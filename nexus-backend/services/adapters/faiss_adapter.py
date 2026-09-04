import numpy as np
import faiss
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer

from services.adapters.base import VectorAdapter, ExpertProfile
from config import settings

class FAISSAdapter(VectorAdapter):
    """
    FAISS-CPU in-memory VectorAdapter implementation using sentence-transformers.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None
        self._index = None
        self._expert_id_map: List[str] = []
        self._initialized = False

    def _ensure_initialized(self):
        if not self._initialized:
            print(f"[FAISSAdapter] Loading local embedding model: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
            self._index = faiss.IndexFlatIP(settings.EMBEDDING_DIM)
            self._initialized = True

    def get_embedding(self, text: str) -> List[float]:
        """Encode text to float list embedding."""
        self._ensure_initialized()
        vec = self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return vec.astype(np.float32).tolist()

    async def index_experts(self, experts: List[ExpertProfile]) -> None:
        """Index expert profiles into FAISS in-memory index."""
        self._ensure_initialized()
        if not experts:
            return

        expert_ids = []
        vectors = []

        for p in experts:
            tags_text = ", ".join(p.expertise_tags) if isinstance(p.expertise_tags, list) else (p.expertise_tags or "")
            off_text = " ".join([f"{o.title}: {o.description or ''}" for o in p.offerings])
            text = f"Category: {p.category}\nHeadline: {p.professional_headline}\nTags: {tags_text}\nBio: {p.bio}\nOfferings: {off_text}"
            
            vec = self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True).astype(np.float32)
            expert_ids.append(str(p.id or p.user_id))
            vectors.append(vec)

        if vectors:
            matrix = np.array(vectors).astype(np.float32)
            self._index = faiss.IndexFlatIP(settings.EMBEDDING_DIM)
            self._index.add(matrix)
            self._expert_id_map = expert_ids
            print(f"[FAISSAdapter] Successfully indexed {self._index.ntotal} expert profiles.")

    async def search(self, query_embedding: List[float], top_k: int = 3) -> List[Tuple[str, float]]:
        """Search FAISS index using query vector embedding. Returns [(expert_id, similarity_score)]."""
        self._ensure_initialized()
        if self._index is None or self._index.ntotal == 0:
            print("[FAISSAdapter WARNING] Index is empty.")
            return []

        q_arr = np.array([query_embedding], dtype=np.float32)
        scores, indices = self._index.search(q_arr, k=min(top_k, self._index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._expert_id_map):
                continue
            exp_id = self._expert_id_map[idx]
            # Convert cosine score to 0.0-1.0 range
            norm_score = float(max(0.0, min(1.0, float(score))))
            results.append((exp_id, norm_score))

        return results
