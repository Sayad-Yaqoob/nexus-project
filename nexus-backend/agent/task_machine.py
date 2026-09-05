from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class TaskStateEnum(str, Enum):
    IDLE = "IDLE"
    UNDERSTANDING = "UNDERSTANDING"
    COLLECTING_INFO = "COLLECTING_INFO"
    PREVIEW_SHOWN = "PREVIEW_SHOWN"
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"


class ActiveTask(BaseModel):
    """
    Explicit Task State Machine object tracking active operation lifecycle.
    Prevents completed tasks from contaminating future agent invocations.
    """
    task_id: str
    capability: str
    state: TaskStateEnum = TaskStateEnum.IDLE
    intent_type: str = "offering_create"
    draft_data: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    requires_confirmation: bool = True
    confirmation_action: Optional[str] = None

    def is_active(self) -> bool:
        """Returns True if task is still in progress."""
        return self.state not in [TaskStateEnum.IDLE, TaskStateEnum.COMPLETED, TaskStateEnum.ERROR]

    def reset(self) -> "ActiveTask":
        """Reset task machine to IDLE state."""
        self.state = TaskStateEnum.IDLE
        self.draft_data = {}
        self.missing_fields = []
        self.requires_confirmation = False
        self.confirmation_action = None
        return self
