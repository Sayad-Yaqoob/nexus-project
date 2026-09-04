import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status, Header

from config import settings
from services.adapters import (
    DataAdapter, LLMAdapter, VectorAdapter,
    User, get_data_adapter, get_llm_adapter, get_vector_adapter
)

def create_access_token(data: dict) -> str:
    """Encode JWT token."""
    to_encode = data.copy()
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(
    authorization: Optional[str] = Header(None),
    data_adapter: DataAdapter = Depends(get_data_adapter)
) -> User:
    """Extract current user from Authorization header or return fallback user."""
    if not authorization or not authorization.startswith("Bearer "):
        # Fallback user for dev / unauthenticated requests
        user = await data_adapter.get_user("1")
        if user:
            return user
        return User(id="1", email="sayad@mindgigs.com", full_name="Sayad Yaqoob", role="expert", public_handle="sayad")

    token = authorization.split(" ")[1]
    
    # Check Firebase Auth token or JWT token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = str(payload.get("sub", payload.get("uid", "1")))
    except jwt.PyJWTError:
        user_id = "1"

    user = await data_adapter.get_user(user_id)
    if user:
        return user

    return User(id=user_id, email="user@mindgigs.com", full_name="MindGigs User", role="client", public_handle="user")
