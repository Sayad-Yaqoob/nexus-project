from typing import TypedDict, Optional, List, Dict, Any

class NexusState(TypedDict, total=False):
    """
    Unified conversation state for the NEXUS agent graph.
    """
    session_id: str
    user_id: int
    role: str  # "expert" | "client"
    message: str  # Latest user input message
    conversation_history: List[Dict[str, str]]
    intent: str
    extracted_entities: Dict[str, Any]
    user_context: Dict[str, Any]
    response_text: str
    suggested_actions: List[str]
    requires_confirmation: bool
    confirmation_action: Optional[str]
    response_type: str
    draft: Dict[str, Any]
    action_result: Dict[str, Any]
    pending_action: Dict[str, Any]
