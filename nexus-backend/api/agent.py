from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status

from api.deps import get_current_user
from services.adapters import User, get_data_adapter
from agent.service import AgentService

router = APIRouter()

class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class AgentChatResponse(BaseModel):
    response: str
    session_id: str
    intent: str
    role: str
    suggested_actions: List[str]
    conversation_history: List[Dict[str, Any]]
    response_type: str = "message"
    draft: Optional[Dict[str, Any]] = None
    action_result: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False
    confirmation: Optional[Dict[str, Any]] = None

@router.post("/agent/chat", response_model=AgentChatResponse)
async def agent_chat(
    req: AgentChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Main unified agent chat endpoint.
    Processes user input through NexusGraph state graph and returns role-aware agent response.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    try:
        user_id = int(current_user.id)
    except ValueError:
        user_id = 1

    result = await AgentService.process_message(
        user_id=user_id,
        message=req.message.strip(),
        session_id=req.session_id
    )

    return AgentChatResponse(**result)

@router.get("/agent/sessions/{session_id}")
async def get_session_history(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Fetch session history for an authenticated user."""
    data_adapter = get_data_adapter()
    session_data = await data_adapter.get_session(session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )

    # Ensure user owns the session
    if str(session_data.get("user_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to session"
        )

    return session_data
