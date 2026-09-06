from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class Capability(BaseModel):
    name: str
    description: str
    expert_only: bool = False
    requires_confirmation: bool = False
    read_only: bool = True
    required_fields: List[str] = Field(default_factory=list)
    optional_fields: List[str] = Field(default_factory=list)
    required_files: List[str] = Field(default_factory=list)
    target_routes: List[str] = Field(default_factory=list)


CAPABILITY_REGISTRY: Dict[str, Capability] = {
    "get_current_user": Capability(
        name="get_current_user",
        description="Retrieve authenticated user profile and account role",
        read_only=True
    ),
    "get_profile": Capability(
        name="get_profile",
        description="Retrieve expert profile details, bio, tags, and category",
        expert_only=True,
        read_only=True
    ),
    "update_profile": Capability(
        name="update_profile",
        description="Update expert headline, bio, expertise tags, or category",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        optional_fields=["professional_headline", "bio", "expertise_tags", "category"]
    ),
    "get_offers": Capability(
        name="get_offers",
        description="List active offerings for expert user",
        expert_only=True,
        read_only=True
    ),
    "get_offering": Capability(
        name="get_offering",
        description="Retrieve details of a specific offering by ID",
        read_only=True,
        required_fields=["offering_id"]
    ),
    "create_1_to_1": Capability(
        name="create_1_to_1",
        description="Create a 1:1 advisory/consulting session offering",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title", "price"],
        optional_fields=["duration", "description", "currency", "availability"],
        target_routes=["/sell/1-to-1", "/sell/offers"]
    ),
    "create_subscription": Capability(
        name="create_subscription",
        description="Create a recurring subscription plan offering for clients",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title", "price"],
        optional_fields=["description", "benefits", "billing_period", "external_link"],
        target_routes=["/sell/subscriptions", "/sell/offers"]
    ),
    "update_subscription": Capability(
        name="update_subscription",
        description="Update an existing subscription plan's title, price, or details",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["offering_id"],
        optional_fields=["title", "price", "billing_period", "description", "benefits"],
        target_routes=["/sell/subscriptions", "/sell/offers"]
    ),
    "create_digital_product": Capability(
        name="create_digital_product",
        description="Create a downloadable digital product offering (PDF, ZIP, templates)",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title", "price"],
        optional_fields=["description", "file_path", "delivery_link"],
        required_files=["digital_file"],
        target_routes=["/sell/digital-products", "/sell/offers"]
    ),
    "create_book": Capability(
        name="create_book",
        description="Create a book publishing & sales offering (PDF, Amazon, Custom Link)",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title", "price"],
        optional_fields=["author", "tagline", "overview", "buy_now_pdf", "amazon_link", "custom_link", "front_cover", "back_cover"],
        required_files=["book_pdf"],
        target_routes=["/sell/books", "/sell/offers"]
    ),
    "create_custom_offering": Capability(
        name="create_custom_offering",
        description="Create a custom tailored service offering",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title", "price"],
        optional_fields=["description", "custom_scope", "delivery_timeline"],
        target_routes=["/sell/custom-offerings", "/sell/offers"]
    ),
    "create_newsletter": Capability(
        name="create_newsletter",
        description="Create and broadcast a newsletter digest to audience and subscribers",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title"],
        optional_fields=["newsletter_subject", "target_audience", "content_draft"],
        target_routes=["/sell/offers"]
    ),
    "create_highlight": Capability(
        name="create_highlight",
        description="Create a profile highlight card",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["title"],
        optional_fields=["image_url", "link_url"],
        target_routes=["/sell/highlights", "/sell/offers"]
    ),
    "update_offering": Capability(
        name="update_offering",
        description="Update an existing offering's title, price, duration, or description",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["offering_id"],
        optional_fields=["title", "price", "duration", "description"]
    ),
    "delete_offering": Capability(
        name="delete_offering",
        description="Delete an offering from database",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        required_fields=["offering_id"]
    ),
    "get_availability": Capability(
        name="get_availability",
        description="Retrieve weekly schedule and timezone",
        read_only=True
    ),
    "update_availability": Capability(
        name="update_availability",
        description="Update weekly schedule hours and timezone",
        expert_only=True,
        requires_confirmation=True,
        read_only=False,
        optional_fields=["weekly_hours_json", "timezone"]
    ),
    "search_experts": Capability(
        name="search_experts",
        description="Semantic FAISS search for experts matching project/need query",
        read_only=True,
        required_fields=["query"]
    ),
    "get_expert_profile": Capability(
        name="get_expert_profile",
        description="Fetch detailed profile of a specific expert",
        read_only=True,
        required_fields=["expert_id"]
    ),
    "get_available_slots": Capability(
        name="get_available_slots",
        description="Retrieve available booking time slots for an expert",
        read_only=True,
        required_fields=["expert_user_id"]
    ),
    "create_booking": Capability(
        name="create_booking",
        description="Book a session with an expert",
        requires_confirmation=True,
        read_only=False,
        required_fields=["expert_user_id"],
        optional_fields=["offering_id", "scheduled_at", "notes"]
    ),
    "get_my_bookings": Capability(
        name="get_my_bookings",
        description="Retrieve client's scheduled bookings",
        read_only=True
    ),
    "get_incoming_bookings": Capability(
        name="get_incoming_bookings",
        description="Retrieve expert's incoming client bookings",
        expert_only=True,
        read_only=True
    ),
    "get_earnings": Capability(
        name="get_earnings",
        description="Retrieve verified earnings and payout status for expert",
        expert_only=True,
        read_only=True
    ),
    "navigate_to_screen": Capability(
        name="navigate_to_screen",
        description="Navigate user to a specific screen/tab in mindGigs",
        read_only=True,
        required_fields=["target_route"]
    )
}


def get_capability(name: str) -> Optional[Capability]:
    return CAPABILITY_REGISTRY.get(name)

