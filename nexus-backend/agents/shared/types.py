from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class OfferingDraft(BaseModel):
    title: str = Field(description="Title of the offering")
    offer_type: str = Field(
        default="1:1 Session", 
        description="One of: '1:1 Session', 'Subscription', 'Digital Product', 'Custom Offer', 'Book', 'Highlight'"
    )
    price: float = Field(default=100.0, description="Price in USD")
    duration: Optional[str] = Field(default="60 min", description="Duration string e.g. '60 min'")
    description: Optional[str] = Field(default="", description="Detailed description")
    file_required: bool = Field(default=False, description="Whether a digital product file upload is mandatory")
    file_path: Optional[str] = Field(default=None, description="Path to uploaded placeholder file if any")
    file_placeholder_valid: bool = Field(default=False, description="True if mandatory file is uploaded or not required")

    model_config = ConfigDict(from_attributes=True)


class ExpertDraft(BaseModel):
    professional_headline: str = Field(description="Professional headline summarizing expert identity")
    bio: str = Field(description="Comprehensive professional bio (2-3 paragraphs)")
    expertise_tags: List[str] = Field(default_factory=list, description="List of 5-10 expertise tags")
    category: str = Field(description="Primary category e.g. 'AI & Data', 'Software Development', 'Business & Strategy'")
    suggested_offerings: List[OfferingDraft] = Field(default_factory=list, description="List of 1-3 suggested services or products")
    weekly_hours_json: Optional[str] = Field(default='{"Mon-Fri": "9am-5pm"}', description="Schedule JSON string")
    timezone: str = Field(default="UTC", description="Timezone e.g. 'UTC-5'")
    session_duration_default: int = Field(default=60, description="Default session length in minutes")
    buffer_between_sessions: int = Field(default=15, description="Buffer time in minutes")

    model_config = ConfigDict(from_attributes=True)


class AmbiguityCheck(BaseModel):
    confidence_score: float = Field(description="Confidence score from 0.0 to 1.0")
    missing_fields: List[str] = Field(default_factory=list, description="List of key missing information fields")
    clarification_questions: List[str] = Field(default_factory=list, description="1-3 target clarifying questions if confidence < 0.7")


class PreviewCard(BaseModel):
    draft_id: str
    user_id: int
    full_name: str
    professional_headline: str
    bio: str
    category: str
    expertise_tags: List[str]
    offerings: List[OfferingDraft]
    is_verified: bool = False
    needs_file_upload: bool = False
    validation_error: Optional[str] = None


class RequirementBrief(BaseModel):
    problem: str = Field(description="Summary of the client's problem or project need")
    category: str = Field(description="Matched market category e.g. 'AI & Data', 'Software Development'")
    goals: List[str] = Field(default_factory=list, description="Client's primary goals")
    constraints: List[str] = Field(default_factory=list, description="Budget, timeline, or technical constraints")
    expertise_needed: List[str] = Field(default_factory=list, description="Key skills or expertise tags needed")
    urgency: str = Field(default="Standard", description="Urgency level e.g. 'Immediate', 'Standard'")
    missing_information: List[str] = Field(default_factory=list, description="Information missing to provide a match")
    clarification_questions: List[str] = Field(default_factory=list, description="Questions for client if confidence < 0.7")
    confidence_score: float = Field(default=1.0, description="Overall confidence score from 0.0 to 1.0")


class MatchResult(BaseModel):
    expert_id: int
    full_name: str
    professional_headline: str
    category: str
    match_score: float = Field(description="Match score percentage from 0.0 to 100.0")
    reasoning: str = Field(description="2-3 sentence explanation of why this expert fits")
    rank: int = Field(description="Rank order 1, 2, or 3")
    top_offering: Optional[OfferingDraft] = None


class Top3Matches(BaseModel):
    matches: List[MatchResult]
    summary: str = Field(description="Brief summary of why these top experts were recommended")
