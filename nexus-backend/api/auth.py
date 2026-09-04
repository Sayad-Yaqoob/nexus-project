import random
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from database.connection import AsyncSessionLocal
from database.models import User as DBUser
from services.adapters import DataAdapter, get_data_adapter, User
from api.deps import create_access_token, get_current_user

router = APIRouter()

class MimicAuthRequest(BaseModel):
    role: Optional[str] = None  # "expert" or "client"
    user_id: Optional[int] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/auth/mimic", response_model=TokenResponse)
async def mimic_login(
    req: Optional[MimicAuthRequest] = None,
    data_adapter: DataAdapter = Depends(get_data_adapter)
):
    """
    Select a seeded user (randomly or by role/user_id) for dev/demo mimic authentication.
    Returns JWT bearer token and user object.
    """
    target_role = req.role if req else None
    target_uid = req.user_id if req else None

    async with AsyncSessionLocal() as session:
        query = select(DBUser)
        if target_uid:
            query = query.filter_by(id=target_uid)
        elif target_role:
            query = query.filter_by(role=target_role)

        result = await session.execute(query)
        candidates = result.scalars().all()

        if not candidates:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No seeded users found matching criteria (role={target_role}, user_id={target_uid})"
            )

        chosen_user = random.choice(candidates)

        token_data = {
            "sub": str(chosen_user.id),
            "email": chosen_user.email,
            "role": chosen_user.role,
            "handle": chosen_user.public_handle
        }
        access_token = create_access_token(token_data)

        user_dict = {
            "id": chosen_user.id,
            "email": chosen_user.email,
            "full_name": chosen_user.full_name,
            "role": chosen_user.role,
            "public_handle": chosen_user.public_handle,
            "currency": chosen_user.currency or "USD"
        }

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_dict
        )

@router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return authenticated current user profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "public_handle": current_user.public_handle,
        "currency": current_user.currency
    }
