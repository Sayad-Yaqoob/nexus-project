import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.deps import get_current_user
from services.adapters import (
    DataAdapter, LLMAdapter, VectorAdapter,
    User, ExpertProfile, Offering,
    get_data_adapter, get_llm_adapter, get_vector_adapter
)
from services.adapters.faiss_adapter import FAISSAdapter

router = APIRouter()

class FindExpertsRequest(BaseModel):
    raw_problem: str
    category_filter: Optional[str] = None
    user_id: Optional[str] = None

class ExpertMatchItem(BaseModel):
    id: Union[str, int]
    user_id: Union[str, int]
    full_name: str
    handle: str
    headline: str
    category: str
    tags: List[str]
    match_score: float # percentage 0 to 100
    reasoning: str
    is_verified: bool = True
    top_offering: Optional[Dict[str, Any]] = None

class FindExpertsResponse(BaseModel):
    status: str = "success"
    raw_problem: str
    matches: List[ExpertMatchItem]

@router.post("/client/find-experts", response_model=FindExpertsResponse)
async def find_experts(
    req: FindExpertsRequest,
    data_adapter: DataAdapter = Depends(get_data_adapter),
    llm_adapter: LLMAdapter = Depends(get_llm_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """
    Client Match: Embeds problem description, searches FAISS vector store,
    uses Groq LLM to rank and generate custom match reasoning lines, and returns top 3 experts.
    """
    if not req.raw_problem or not req.raw_problem.strip():
        raise HTTPException(status_code=400, detail="raw_problem is required")

    # 1. Fetch all experts from DataAdapter to ensure index is loaded
    all_experts = await data_adapter.list_experts()
    if all_experts:
        await vector_adapter.index_experts(all_experts)

    # 2. Get embedding for client problem description
    query_vec = []
    if isinstance(vector_adapter, FAISSAdapter):
        query_vec = vector_adapter.get_embedding(req.raw_problem)
    else:
        # Fallback dummy embedding
        query_vec = [0.1] * 384

    # 3. Vector search top candidates
    search_results = await vector_adapter.search(query_vec, top_k=5)

    # If vector search returned results
    candidate_profiles: List[tuple[ExpertProfile, float]] = []
    if search_results:
        for exp_id, score in search_results:
            prof = await data_adapter.get_expert_profile(exp_id)
            if prof:
                candidate_profiles.append((prof, score))

    # If no vector matches found, fallback to listing experts directly
    if not candidate_profiles:
        for p in all_experts[:5]:
            candidate_profiles.append((p, 0.75))

    # 4. Generate LLM match reasoning and rank top 3
    final_matches: List[ExpertMatchItem] = []

    for idx, (prof, base_score) in enumerate(candidate_profiles[:3]):
        # Match score calculation
        pct_score = round(min(98.5, max(65.0, base_score * 100.0 if base_score <= 1.0 else base_score)), 1)
        
        tags_str = ", ".join(prof.expertise_tags) if isinstance(prof.expertise_tags, list) else (prof.expertise_tags or "")
        
        prompt = (
            f"You are NEXUS matchmaker for MindGigs. Client problem: '{req.raw_problem}'. "
            f"Expert: {prof.full_name or 'Specialist'} ({prof.professional_headline}). "
            f"Category: {prof.category}. Expertise tags: {tags_str}. Bio snippet: {prof.bio[:150]}. "
            f"In ONE concise, high-impact sentence, explain why this expert is a great match for the client's problem."
        )

        reasoning = await llm_adapter.generate_reasoning(prompt)
        # Clean reasoning text
        reasoning = reasoning.strip().strip('"')

        top_offering = None
        if prof.offerings:
            o = prof.offerings[0]
            top_offering = {
                "id": o.id,
                "title": o.title,
                "type": o.offer_type,
                "price": float(o.price),
                "duration": o.duration
            }

        tags_list = prof.expertise_tags if isinstance(prof.expertise_tags, list) else [t.strip() for t in prof.expertise_tags.split(",") if t.strip()]

        final_matches.append(ExpertMatchItem(
            id=prof.id or idx + 1,
            user_id=prof.user_id,
            full_name=prof.full_name or f"Expert #{idx+1}",
            handle=prof.public_handle or f"expert_{idx+1}",
            headline=prof.professional_headline or "Expert Specialist",
            category=prof.category or "General",
            tags=tags_list,
            match_score=pct_score,
            reasoning=reasoning,
            is_verified=prof.is_verified,
            top_offering=top_offering
        ))

    return FindExpertsResponse(
        raw_problem=req.raw_problem,
        matches=final_matches
    )
