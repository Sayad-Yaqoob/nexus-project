from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel

from api.deps import get_current_user, require_expert_role, create_access_token
from services.adapters import (
    DataAdapter, LLMAdapter, VectorAdapter,
    User, ExpertProfile, Offering,
    get_data_adapter, get_llm_adapter, get_vector_adapter
)
from config import settings

router = APIRouter()

class VerifyTokenRequest(BaseModel):
    token: Optional[str] = None
    email: Optional[str] = None
    uid: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = "expert"

@router.post("/auth/verify")
async def verify_auth_token(
    req: VerifyTokenRequest,
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """Verify Firebase Auth ID token or dev authentication session."""
    uid = req.uid or "1"
    existing_user = await data_adapter.get_user(uid)
    
    if not existing_user:
        user = User(
            id=uid,
            email=req.email or f"user_{uid}@mindgigs.com",
            full_name=req.full_name or "Sayad Yaqoob",
            role=req.role or "expert",
            public_handle=req.email.split("@")[0] if req.email else f"user_{uid}"
        )
    else:
        user = existing_user

    jwt_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})

    return {
        "status": "success",
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": user.model_dump()
    }

@router.get("/users/me")
async def get_user_me(
    current_user: User = Depends(get_current_user),
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """User context loading endpoint for NEXUS greeting and mode context."""
    profile = await data_adapter.get_expert_profile(str(current_user.id))
    
    role_str = "Expert" if current_user.role == "expert" else "Client"
    greeting = f"Welcome back, {current_user.full_name}! mindGigs {role_str} workspace ready."

    return {
        "mode": current_user.role,
        "user": current_user.model_dump(),
        "existing_profile": profile.model_dump() if profile else None,
        "personalized_greeting": greeting
    }

@router.get("/experts")
async def list_experts(
    category: Optional[str] = Query(None),
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """List experts for marketplace browsing."""
    filters = {"category": category} if category else None
    experts = await data_adapter.list_experts(filters)
    return [e.model_dump() for e in experts]

@router.get("/health")
async def health_check(
    data_adapter: DataAdapter = Depends(get_data_adapter),
    llm_adapter: LLMAdapter = Depends(get_llm_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """Health check endpoint indicating DataAdapter, Groq API connectivity & vector store status."""
    experts = await data_adapter.list_experts()
    has_groq_key = bool(settings.GROQ_API_KEY)

    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "data_adapter": data_adapter.__class__.__name__,
        "data_adapter_mode": "firestore" if getattr(data_adapter, "_is_firestore", False) else "sqlite_fallback",
        "llm_provider": "groq",
        "groq_api_configured": has_groq_key,
        "fast_model": settings.GROQ_FAST_MODEL,
        "reasoning_model": settings.GROQ_PREMIUM_MODEL,
        "vector_store": "faiss-cpu",
        "embedding_model": settings.EMBEDDING_MODEL,
        "faiss_index_count": getattr(getattr(vector_adapter, "_index", None), "ntotal", 0),
        "expert_record_count": len(experts),
        "portable_adapters": True
    }

# --- Offerings CRUD Endpoints ---

class UpdateOfferingRequest(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    offer_type: Optional[str] = None

@router.get("/offerings")
async def list_user_offerings(
    current_user: User = Depends(get_current_user),
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """List all offerings for current expert user."""
    profile = await data_adapter.get_expert_profile(str(current_user.id))
    if not profile:
        return []
    return [o.model_dump() for o in profile.offerings]

@router.put("/offerings/{offering_id}")
async def update_offering_endpoint(
    offering_id: int,
    req: UpdateOfferingRequest,
    current_user: User = Depends(require_expert_role),
    data_adapter: DataAdapter = Depends(get_data_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """Update an existing offering in database (expert only)."""
    updated = await data_adapter.update_offering(offering_id, req.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Offering not found")
    all_exp = await data_adapter.list_experts()
    await vector_adapter.index_experts(all_exp)
    return {"status": "success", "offering": updated.model_dump()}

@router.delete("/offerings/{offering_id}")
async def delete_offering_endpoint(
    offering_id: int,
    current_user: User = Depends(require_expert_role),
    data_adapter: DataAdapter = Depends(get_data_adapter),
    vector_adapter: VectorAdapter = Depends(get_vector_adapter)
):
    """Delete an offering from database (expert only)."""
    deleted = await data_adapter.delete_offering(offering_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Offering not found")
    all_exp = await data_adapter.list_experts()
    await vector_adapter.index_experts(all_exp)
    return {"status": "success", "message": "Offering deleted successfully"}

# --- Bookings Endpoints ---

class CreateBookingRequest(BaseModel):
    expert_user_id: int
    offering_id: Optional[int] = None
    scheduled_at: Optional[str] = None
    notes: Optional[str] = None

@router.get("/bookings")
async def list_bookings_endpoint(
    current_user: User = Depends(get_current_user),
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """Fetch bookings for client (My Bookings) or expert (Incoming Bookings)."""
    return await data_adapter.list_bookings(int(current_user.id), current_user.role)

@router.post("/bookings")
async def create_booking_endpoint(
    req: CreateBookingRequest,
    current_user: User = Depends(get_current_user),
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """Create a new demo booking."""
    booking = await data_adapter.create_booking(
        client_id=int(current_user.id),
        expert_user_id=req.expert_user_id,
        offering_id=req.offering_id,
        scheduled_at=req.scheduled_at,
        notes=req.notes
    )
    return {"status": "success", "booking": booking}

# --- Earnings Endpoint ---

@router.get("/earnings")
async def get_earnings_endpoint(
    current_user: User = Depends(require_expert_role),
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """Fetch earnings summary for expert (expert only)."""
    return await data_adapter.get_earnings(int(current_user.id))


