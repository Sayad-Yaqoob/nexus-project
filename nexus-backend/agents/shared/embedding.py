import numpy as np
import faiss
from typing import List, Tuple, Dict, Optional
from sentence_transformers import SentenceTransformer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database.models import ExpertProfile, Offering, ExpertEmbedding

class EmbeddingManager:
    """Manages local text embeddings using sentence-transformers and FAISS-CPU index."""
    
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingManager, cls).__new__(cls)
            cls._instance._model = None
            cls._instance._index = None
            cls._instance._expert_id_map = [] # Map index position -> expert_id
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        """Lazy load sentence transformer model and initialize FAISS index."""
        if not self._initialized:
            print(f"[EMBEDDING] Loading sentence transformer model: {settings.EMBEDDING_MODEL}")
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            # Use IndexFlatIP (Inner Product) with normalized vectors for Cosine Similarity
            self._index = faiss.IndexFlatIP(settings.EMBEDDING_DIM)
            self._initialized = True
            print("[EMBEDDING] Local embedding model and FAISS initialized.")

    def encode(self, text: str) -> np.ndarray:
        """Encode text string into normalized float32 vector embedding."""
        self.initialize()
        embedding = self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return embedding.astype(np.float32)

    def build_expert_text(self, profile: ExpertProfile, offerings: List[Offering]) -> str:
        """Construct rich semantic text representation of an expert for embedding."""
        offerings_text = " ".join([f"{o.title} ({o.offer_type}): {o.description or ''}" for o in offerings])
        text_parts = [
            f"Category: {profile.category}",
            f"Headline: {profile.professional_headline or ''}",
            f"Expertise Tags: {profile.expertise_tags or ''}",
            f"Bio: {profile.bio or ''}",
            f"Offerings: {offerings_text}"
        ]
        return "\n".join(text_parts)

    async def sync_database_embeddings(self, db_session: AsyncSession):
        """Pre-compute embeddings for all experts in DB, update FAISS index & expert_embeddings table."""
        self.initialize()
        
        result = await db_session.execute(select(ExpertProfile))
        profiles = result.scalars().all()
        
        if not profiles:
            print("[EMBEDDING] No expert profiles found to index.")
            return

        print(f"[EMBEDDING] Synchronizing embeddings for {len(profiles)} experts...")
        
        expert_ids = []
        vectors = []

        for profile in profiles:
            # Fetch offerings for profile
            off_result = await db_session.execute(select(Offering).filter_by(expert_id=profile.id))
            offerings = off_result.scalars().all()
            
            expert_text = self.build_expert_text(profile, offerings)
            vec = self.encode(expert_text)
            
            expert_ids.append(profile.id)
            vectors.append(vec)
            
            # Store in DB as bytes
            vec_bytes = vec.tobytes()
            emb_record = await db_session.get(ExpertEmbedding, profile.id)
            if not emb_record:
                emb_record = ExpertEmbedding(expert_id=profile.id, embedding=vec_bytes)
                db_session.add(emb_record)
            else:
                emb_record.embedding = vec_bytes
        
        await db_session.commit()

        # Build FAISS index
        vector_matrix = np.array(vectors).astype(np.float32)
        self._index = faiss.IndexFlatIP(settings.EMBEDDING_DIM)
        self._index.add(vector_matrix)
        self._expert_id_map = expert_ids
        
        print(f"[EMBEDDING] FAISS index synchronized with {self._index.ntotal} vectors.")

    def search_experts(
        self, 
        query_embedding: np.ndarray, 
        candidate_expert_ids: Optional[List[int]] = None, 
        top_k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Search FAISS index for top_k experts matching query_embedding.
        Returns List of (expert_id, similarity_score).
        """
        self.initialize()
        
        if self._index is None or self._index.ntotal == 0:
            print("[EMBEDDING WARNING] FAISS index is empty!")
            return []

        # FAISS search expects 2D float32 array
        query_matrix = np.expand_dims(query_embedding, axis=0).astype(np.float32)
        
        # Search index
        scores, indices = self._index.search(query_matrix, k=min(top_k * 3, self._index.ntotal))
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._expert_id_map):
                continue
            expert_id = self._expert_id_map[idx]
            
            # Filter by candidate_expert_ids if provided
            if candidate_expert_ids is not None and expert_id not in candidate_expert_ids:
                continue
            
            # Cosine similarity score normalized between 0.0 and 1.0
            normalized_score = float(max(0.0, min(1.0, (score + 1.0) / 2.0 if score < 0 else score)))
            results.append((expert_id, normalized_score))
            
            if len(results) >= top_k:
                break
                
        return results

embedding_manager = EmbeddingManager()
