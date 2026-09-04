import json
from typing import Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

from api.deps import get_current_user
from services.adapters import (
    DataAdapter, LLMAdapter, VectorAdapter,
    User, ExpertProfile, Offering,
    get_data_adapter, get_llm_adapter, get_vector_adapter
)
from services.file_handler import file_handler

router = APIRouter()

class GenerateProfileRequest(BaseModel):
    raw_description: str
    user_id: Optional[str] = None

class ProfileDraftResponse(BaseModel):
    headline: str
    bio: str
    category: str
    tags: List[str]
    confidence_score: float = 0.9

class PublishProfileRequest(BaseModel):
    headline: str
    bio: str
    category: str
    tags: Union[List[str], str]
    confidence_score: Optional[float] = 0.95
    offerings: Optional[List[Offering]] = None

@router.post("/expert/generate-profile", response_model=ProfileDraftResponse)
async def generate_profile(
    req: GenerateProfileRequest,
    llm_adapter: LLMAdapter = Depends(get_llm_adapter)
):
    """
    Expert Studio: Takes natural language expertise description, calls Groq LLM adapter,
    and returns structured profile draft fields.
    """
    if not req.raw_description or not req.raw_description.strip():
        raise HTTPException(status_code=400, detail="raw_description is required")

    class ProfileSchema(BaseModel):
        headline: str = Field(description="Catchy professional headline e.g. Senior AI/ML Engineer & LLM Specialist")
        bio: str = Field(description="Comprehensive professional bio highlighting experience and skills")
        category: str = Field(description="Primary category e.g. AI / Machine Learning, Web Development, Design, Growth")
        tags: List[str] = Field(description="4-6 relevant expertise skill tags")
        confidence_score: float = Field(default=0.92, description="Confidence score from 0.0 to 1.0")

    prompt = f"Analyze the following natural language description of an expert's background and extract structured profile details:\n{req.raw_description}"

    extracted = await llm_adapter.extract_structured(prompt, ProfileSchema)
    
    return ProfileDraftResponse(
        headline=extracted.headline,
        bio=extracted.bio,
        category=extracted.category,
        tags=extracted.tags if isinstance(extracted.tags, list) else [t.strip() for t in extracted.tags.split(",")],
        confidence_score=getattr(extracted, "confidence_score", 0.92)
    )

@router.post("/expert/publish-profile")
async def publish_profile(
    req: PublishProfileRequest,
    current_user: User = Depends(get_current_user),
    data_adapter: DataAdapter = Depends(get_data_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """
    Expert Studio: Saves structured profile to Firestore / DataAdapter and indexes in FAISS vector store.
    """
    tags_list = req.tags if isinstance(req.tags, list) else [t.strip() for t in req.tags.split(",") if t.strip()]

    profile = ExpertProfile(
        user_id=str(current_user.id),
        full_name=current_user.full_name,
        public_handle=current_user.public_handle or f"expert_{current_user.id}",
        professional_headline=req.headline,
        bio=req.bio,
        category=req.category,
        expertise_tags=tags_list,
        is_verified=True,
        confidence_score=req.confidence_score or 0.95,
        offerings=req.offerings or []
    )

    saved_profile = await data_adapter.save_expert_profile(str(current_user.id), profile)
    
    # Re-index in FAISS vector store so client matching instantly reflects updated/published expert
    all_experts = await data_adapter.list_experts()
    await vector_adapter.index_experts(all_experts)

    return {
        "status": "success",
        "message": "Profile published successfully!",
        "profile": saved_profile.model_dump()
    }

@router.post("/expert/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Upload product file placeholder and return path."""
    content = await file.read()
    file_path = file_handler.save_file_placeholder(file.filename, content)
    return {
        "status": "success",
        "filename": file.filename,
        "file_path": file_path
    }
