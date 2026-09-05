from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class UserContextInfo(BaseModel):
    id: Union_ID = Field(..., alias="id")
    name: str = "User"
    email: str = ""
    role: str = "client"
    public_handle: Optional[str] = None
    is_client: bool = True
    is_expert: bool = False

    class Config:
        populate_by_name = True


from typing import Union
Union_ID = Union[str, int]


class AgentContext(BaseModel):
    """
    Structured Application Context passed to the NEXUS agent on every request.
    Defines real application state, user permissions, current screen, and active task.
    """
    user: UserContextInfo
    capabilities: List[str] = Field(default_factory=lambda: ["client"])
    perspective: str = "client"  # "client" | "expert"
    route: str = "/nexus"
    screen: str = "agent_canvas"
    selected_entity_id: Optional[Union[str, int]] = None
    selected_entity_type: Optional[str] = None
    active_task: Optional[Dict[str, Any]] = None
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    recent_actions: List[Dict[str, Any]] = Field(default_factory=list)

    def is_authorized_for(self, capability_name: str, expert_only: bool = False) -> bool:
        """Check if authenticated user is authorized for a capability."""
        if expert_only and not self.user.is_expert:
            return False
        return True
