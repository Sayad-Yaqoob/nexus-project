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
    """Extract current authenticated user from Bearer JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = str(payload.get("sub", payload.get("uid", "")))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await data_adapter.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

async def require_expert_role(current_user: User = Depends(get_current_user)) -> User:
    """Enforce expert authorization. Raises HTTP 403 if authenticated user is client."""
    if current_user.role != "expert":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Expert access required"
        )
    return current_user

