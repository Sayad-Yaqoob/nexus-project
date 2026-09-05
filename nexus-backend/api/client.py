import json
from typing import Optional, List, Dict, Any, Union
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

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: List[str]

class ExpertMatchItem(BaseModel):
    id: Union[str, int]
    user_id: Union[str, int]
    full_name: str
    handle: str
    headline: str
    category: str
    tags: List[str]
    match_score: float
    reasoning: str
    is_verified: bool = True
    top_offering: Optional[Dict[str, Any]] = None

class FindExpertsResponse(BaseModel):
    status: str = "success"
    raw_problem: str
    needs_clarification: bool = False
    confidence_score: float = 0.95
    clarification_questions: List[ClarificationQuestion] = Field(default_factory=list)
    matches: List[ExpertMatchItem] = Field(default_factory=list)

@router.post("/client/find-experts", response_model=FindExpertsResponse)
async def find_experts(
    req: FindExpertsRequest,
    data_adapter: DataAdapter = Depends(get_data_adapter),
    llm_adapter: LLMAdapter = Depends(get_llm_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """
    Client Match: Evaluates query specificity. If broad/ambiguous, returns clarification pills.
    Otherwise embeds problem description, searches FAISS vector store, uses Groq LLM to rank matches.
    """
    if not req.raw_problem or not req.raw_problem.strip():
        raise HTTPException(status_code=400, detail="raw_problem is required")

    words = [w for w in req.raw_problem.strip().split() if len(w) > 2]

    # Check for broad / ambiguous query (less than 4 specific terms and no domain indicators)
    is_broad = len(words) < 4 and not any(kw in req.raw_problem.lower() for kw in [
        "rag", "fine-tuning", "next.js", "aws", "terraform", "pitch deck", "cro", "meddpicc", "seo", "cfo", "supply chain"
    ])

    # 1. Fetch all experts to sync index
    all_experts = await data_adapter.list_experts()
    if all_experts:
        await vector_adapter.index_experts(all_experts)

    # 2. Get vector embedding
    query_vec = []
    if isinstance(vector_adapter, FAISSAdapter):
        query_vec = vector_adapter.get_embedding(req.raw_problem)
    else:
        query_vec = [0.1] * 384

    # 3. Search vector store
    search_results = await vector_adapter.search(query_vec, top_k=max(len(all_experts), 1))

    candidate_profiles: List[tuple[ExpertProfile, float]] = []
    if search_results:
        for exp_id, score in search_results:
            prof = await data_adapter.get_expert_profile(exp_id)
            if prof:
                candidate_profiles.append((prof, score))

    # 4. Generate ranking & reasoning
    final_matches: List[ExpertMatchItem] = []
    for idx, (prof, base_score) in enumerate(candidate_profiles):
        pct_score = round(min(98.5, max(65.0, base_score * 100.0 if base_score <= 1.0 else base_score)), 1)
        tags_str = ", ".join(prof.expertise_tags) if isinstance(prof.expertise_tags, list) else (prof.expertise_tags or "")
        
        prompt = (
            f"You are NEXUS matchmaker for MindGigs. Client problem: '{req.raw_problem}'. "
            f"Expert: {prof.full_name or 'Specialist'} ({prof.professional_headline}). "
            f"Category: {prof.category}. Tags: {tags_str}. "
            f"Explain in ONE short sentence why this expert matches."
        )

        try:
            reasoning = await llm_adapter.generate_reasoning(prompt)
            reasoning = reasoning.strip().strip('"')
        except Exception:
            tags = tags_str.split(", ")[:3]
            grounded = [f"Matches {prof.category}" if prof.category else None]
            grounded.extend(f"Relevant tag: {tag}" for tag in tags if tag)
            reasoning = "; ".join(item for item in grounded if item) or "Retrieved from the expert profile."

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

    # Clarification options generation for broad queries
    clarification_questions = []
    if is_broad:
        clarification_questions = [
            ClarificationQuestion(
                id="q1",
                question="Which specific objective are you looking to achieve?",
                options=[
                    "Build LLM & RAG Application",
                    "Scale SaaS Full-Stack Architecture",
                    "Optimize AWS Cloud Infrastructure",
                    "Fundraising & Pitch Deck Advisory",
                    "Growth Marketing & Paid Acquisition"
                ]
            )
        ]

    return FindExpertsResponse(
        raw_problem=req.raw_problem,
        needs_clarification=is_broad and not final_matches,
        confidence_score=0.65 if is_broad else 0.95,
        clarification_questions=clarification_questions,
        matches=final_matches
    )
