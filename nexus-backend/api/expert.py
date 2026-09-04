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

class GenerateOfferingRequest(BaseModel):
    raw_description: str

class OfferingDraftResponse(BaseModel):
    title: str
    offer_type: str = "1:1 Session"
    price: float = 0.0
    duration: Optional[str] = "60 min"
    description: str = ""
    file_required: bool = False
    allowed_file_types: List[str] = Field(default_factory=list)

class PublishOfferingRequest(BaseModel):
    title: str
    offer_type: str
    price: float
    duration: Optional[str] = None
    description: Optional[str] = None
    file_required: bool = False
    file_path: Optional[str] = None

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

@router.post("/expert/generate-offering", response_model=OfferingDraftResponse)
async def generate_offering(
    req: GenerateOfferingRequest,
    llm_adapter: LLMAdapter = Depends(get_llm_adapter)
):
    """
    Expert Studio Offering Creator: Parses natural language offering description (e.g. 'I want to offer a 1-hour AI Strategy Call for $150')
    and extracts structured offering properties with file rules.
    """
    if not req.raw_description or not req.raw_description.strip():
        raise HTTPException(status_code=400, detail="raw_description is required")

    class OfferingSchema(BaseModel):
        title: str = Field(description="Catchy title of the offering e.g. 1:1 AI Strategy Call or Enterprise LLM Playbook")
        offer_type: str = Field(description="Must be one of: '1:1 Session', 'Digital Product', 'Custom Offer', 'Book'")
        price: float = Field(description="Price in USD e.g. 150.0")
        duration: Optional[str] = Field(default="60 min", description="Duration string e.g. 60 min or N/A for digital products")
        description: str = Field(description="Detailed offering description highlighting deliverables and benefits")

    prompt = f"Extract a single offering structure from the following text description:\n\"{req.raw_description}\""

    try:
        extracted = await llm_adapter.extract_structured(prompt, OfferingSchema)
        offer_type = extracted.offer_type
        if offer_type not in ["1:1 Session", "Digital Product", "Custom Offer", "Book"]:
            if "book" in req.raw_description.lower():
                offer_type = "Book"
            elif "product" in req.raw_description.lower() or "pdf" in req.raw_description.lower() or "zip" in req.raw_description.lower() or "template" in req.raw_description.lower():
                offer_type = "Digital Product"
            else:
                offer_type = "1:1 Session"

        file_required = file_handler.is_file_required(offer_type)
        rule = file_handler.OFFER_TYPE_FILE_RULES.get(offer_type, {})
        allowed_types = rule.get("allowed_types", [])

        return OfferingDraftResponse(
            title=extracted.title,
            offer_type=offer_type,
            price=extracted.price,
            duration=extracted.duration or ("N/A" if file_required else "60 min"),
            description=extracted.description,
            file_required=file_required,
            allowed_file_types=allowed_types
        )
    except Exception as e:
        print(f"[GenerateOffering Error/Fallback] {e}")
        is_digital = "digital" in req.raw_description.lower() or "book" in req.raw_description.lower() or "pdf" in req.raw_description.lower()
        offer_type = "Digital Product" if is_digital else "1:1 Session"
        file_req = file_handler.is_file_required(offer_type)
        rule = file_handler.OFFER_TYPE_FILE_RULES.get(offer_type, {})

        return OfferingDraftResponse(
            title="1:1 Advisory Session" if not is_digital else "Digital Resource Guide",
            offer_type=offer_type,
            price=150.0,
            duration="N/A" if is_digital else "60 min",
            description=req.raw_description,
            file_required=file_req,
            allowed_file_types=rule.get("allowed_types", [])
        )

@router.post("/expert/publish-offering")
async def publish_offering(
    req: PublishOfferingRequest,
    current_user: User = Depends(get_current_user),
    data_adapter: DataAdapter = Depends(get_data_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """
    Expert Studio Offering Creator: Validates file rules and publishes offering to Firestore / DataAdapter.
    """
    is_valid, err_msg = file_handler.validate_placeholder(req.offer_type, req.file_path)
    file_req = file_handler.is_file_required(req.offer_type)

    if file_req and not is_valid:
        raise HTTPException(
            status_code=400,
            detail=err_msg or f"Offering type '{req.offer_type}' requires a valid digital file upload before publishing."
        )

    offering = Offering(
        title=req.title,
        offer_type=req.offer_type,
        price=req.price,
        duration=req.duration,
        description=req.description,
        file_required=file_req
    )

    offering_id = await data_adapter.save_offering(str(current_user.id), offering)
    
    # Re-index experts to include new offering in vector search
    all_experts = await data_adapter.list_experts()
    await vector_adapter.index_experts(all_experts)

    return {
        "status": "success",
        "message": f"Offering '{req.title}' published successfully!",
        "offering_id": offering_id
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
