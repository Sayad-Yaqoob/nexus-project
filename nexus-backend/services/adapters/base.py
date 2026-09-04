from abc import ABC, abstractmethod
from typing import TypeVar, Optional, List, Dict, Any, Tuple, Union
from pydantic import BaseModel, Field

T = TypeVar("T", bound=BaseModel)

class User(BaseModel):
    id: Union[str, int]
    email: str
    full_name: str
    role: str = "client"
    public_handle: Optional[str] = None

class Offering(BaseModel):
    id: Optional[Union[str, int]] = None
    title: str
    offer_type: str = "1:1 Session"
    price: float = 0.0
    duration: Optional[str] = None
    description: Optional[str] = None
    file_required: bool = False

class ExpertProfile(BaseModel):
    id: Optional[Union[str, int]] = None
    user_id: Union[str, int]
    full_name: Optional[str] = None
    public_handle: Optional[str] = None
    professional_headline: str
    bio: str
    category: str
    expertise_tags: Union[str, List[str]]
    is_verified: bool = False
    confidence_score: Optional[float] = 0.9
    linkedin_url: Optional[str] = None
    x_url: Optional[str] = None
    timezone: Optional[str] = "UTC"
    offerings: List[Offering] = Field(default_factory=list)

class DataAdapter(ABC):
    """Abstract data persistence adapter interface."""

    @abstractmethod
    async def get_user(self, uid: str) -> Optional[User]:
        """Fetch user by UID or ID."""
        pass

    @abstractmethod
    async def get_expert_profile(self, uid: str) -> Optional[ExpertProfile]:
        """Fetch expert profile by user ID or profile ID."""
        pass

    @abstractmethod
    async def save_expert_profile(self, uid: str, profile: ExpertProfile) -> ExpertProfile:
        """Save or update expert profile."""
        pass

    @abstractmethod
    async def list_experts(self, filters: Optional[Dict[str, Any]] = None) -> List[ExpertProfile]:
        """List expert profiles filtered by criteria."""
        pass

    @abstractmethod
    async def save_offering(self, expert_id: str, offering: Offering) -> str:
        """Create or update an offering for an expert."""
        pass

class LLMAdapter(ABC):
    """Abstract LLM provider adapter interface."""

    @abstractmethod
    async def extract_structured(self, prompt: str, schema: type[T]) -> T:
        """Extract structured JSON matching a Pydantic schema using LLM."""
        pass

    @abstractmethod
    async def generate_reasoning(self, prompt: str) -> str:
        """Generate open reasoning or text response using LLM."""
        pass

class VectorAdapter(ABC):
    """Abstract vector search adapter interface."""

    @abstractmethod
    async def index_experts(self, experts: List[ExpertProfile]) -> None:
        """Index expert profiles into vector store."""
        pass

    @abstractmethod
    async def search(self, query_embedding: List[float], top_k: int = 3) -> List[Tuple[str, float]]:
        """Search for top_k most similar expert profile IDs given query embedding. Returns [(expert_id, score)]."""
        pass
