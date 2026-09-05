import re
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from services.adapters import DataAdapter, Offering

Union_ID = Union[str, int]


class Availability(BaseModel):
    days: List[str] = Field(default_factory=list)
    start: Optional[str] = None
    end: Optional[str] = None


class OfferingDraft(BaseModel):
    id: Optional[Union_ID] = None
    title: Optional[str] = None
    offer_type: str = "1:1 Session"
    price: Optional[float] = None
    currency: str = "USD"
    duration: Optional[str] = None
    description: Optional[str] = None
    
    # Subscription specific fields
    billing_period: Optional[str] = "monthly"
    benefits: List[str] = Field(default_factory=list)
    
    # Book specific fields
    author: Optional[str] = None
    tagline: Optional[str] = None
    overview: Optional[str] = None
    buy_now_pdf: Optional[str] = None
    amazon_link: Optional[str] = None
    custom_link: Optional[str] = None
    front_cover: Optional[str] = None
    back_cover: Optional[str] = None
    
    # Digital product / File fields
    file_required: bool = False
    file_path: Optional[str] = None
    delivery_link: Optional[str] = None
    
    # Highlight specific fields
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    
    availability: Optional[Availability] = None


def parse_price(text: str) -> Optional[float]:
    match = re.search(
        r"(?:[$€£]\s*|(?:usd|dollars?|eur|euros?|gbp|pounds?)\s*)(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:[$€£]|usd|dollars?|eur|euros?|gbp|pounds?|/month|/mo|a month|monthly)",
        text,
        re.I
    )
    if not match:
        if any(k in text.lower() for k in ["$", "price", "cost", "charge", "sell", "for"]):
            num_match = re.search(r"\b(\d+(?:\.\d{1,2})?)\b", text)
            if num_match:
                return float(num_match.group(1))
        return None
    return float(match.group(1) or match.group(2))


def parse_duration(text: str) -> Optional[str]:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)", text, re.I)
    if not match:
        return None
    value = float(match.group(1))
    unit = match.group(2).lower()
    if unit.startswith(("hour", "hr")):
        minutes = int(value * 60)
    else:
        minutes = int(value)
    return f"{minutes} min"


def resolve_offering_type(message: str, current_screen: Optional[str] = None) -> str:
    lowered = message.lower()
    
    # Explicit keywords override screen context
    if "book" in lowered or "ebook" in lowered or "publish my book" in lowered:
        return "Book"
    if "subscription" in lowered or "monthly plan" in lowered or "recurring" in lowered or "every month" in lowered or "/month" in lowered or "/mo" in lowered:
        return "Subscription"
    if "digital product" in lowered or "pdf" in lowered or "zip" in lowered or "template" in lowered or "downloadable" in lowered:
        return "Digital Product"
    if "highlight" in lowered or "card" in lowered:
        return "Highlight"
    if "custom offer" in lowered or "custom service" in lowered:
        return "Custom Offer"
    if "1:1" in lowered or "one-on-one" in lowered or "session" in lowered or "consult" in lowered or "advisory" in lowered or "call" in lowered:
        return "1:1 Session"

    # Fallback to screen context if natural language is ambiguous (e.g. "Create another one for $250")
    if current_screen:
        screen_low = current_screen.lower()
        if "book" in screen_low:
            return "Book"
        if "subscription" in screen_low:
            return "Subscription"
        if "digital" in screen_low:
            return "Digital Product"
        if "highlight" in screen_low:
            return "Highlight"
        if "custom" in screen_low:
            return "Custom Offer"

    return "1:1 Session"


def extract_offering_entities(message: str, current_screen: Optional[str] = None) -> OfferingDraft:
    offering_type = resolve_offering_type(message, current_screen)
    price = parse_price(message)
    duration = parse_duration(message)
    lowered = message.lower()
    
    title_match = re.search(r"(?:title|called|named)\s*(?:is|:)?\s*[\"']?([^\"'.!,?]+)", message, re.I)
    title = title_match.group(1).strip() if title_match else None
    
    if not title:
        topic_match = re.search(r"(?:offering|session about|consulting for|advisory on|book about|subscription for)\s+([a-zA-Z0-9\s&]+?)(?:\.|\$|total|for|\d+|$)", message, re.I)
        if topic_match:
            raw_topic = topic_match.group(1).strip()
            raw_topic = re.sub(r"\b(and other related things|and related things|and so on|total time|total|time)\b", "", raw_topic, flags=re.I).strip()
            if raw_topic and len(raw_topic) > 2:
                title = " ".join([w.capitalize() for w in raw_topic.split()])

    if not title or len(title) < 3 or title.lower() in ["for", "a", "an", "the", "session", "book", "subscription"]:
        if "marketing" in lowered:
            title = f"Marketing {offering_type}"
        elif "ai" in lowered or "rag" in lowered or "llm" in lowered:
            title = f"AI Advisory {offering_type}"
        elif offering_type == "Book":
            title = "My New Book"
        elif offering_type == "Subscription":
            title = "Monthly Advisory Club"
        elif offering_type == "Digital Product":
            title = "Specialist Digital Playbook"
        else:
            title = f"1:1 {offering_type}"

    description = f"{title} — premium {offering_type.lower()} on MindGigs."
    
    file_required = offering_type in ["Book", "Digital Product"]
    
    billing_period = "monthly"
    if "yearly" in lowered or "annual" in lowered:
        billing_period = "yearly"

    return OfferingDraft(
        title=title,
        offer_type=offering_type,
        price=price,
        duration=duration or ("N/A" if file_required else "60 min"),
        description=description,
        billing_period=billing_period if offering_type == "Subscription" else None,
        file_required=file_required
    )


def merge_draft(previous: Optional[Dict[str, Any]], incoming_draft: OfferingDraft) -> OfferingDraft:
    if not previous:
        return incoming_draft
    
    prev_type = previous.get("offer_type", "1:1 Session")
    if prev_type != incoming_draft.offer_type:
        return incoming_draft
        
    merged_dict = dict(previous)
    inc_dict = incoming_draft.model_dump(exclude_none=True)
    merged_dict.update(inc_dict)
    return OfferingDraft.model_validate(merged_dict)


async def execute_offering(
    data_adapter: DataAdapter,
    user_id: int,
    draft: OfferingDraft,
) -> Dict[str, Any]:
    if draft.title is None or draft.price is None:
        raise ValueError("Title and Price are required before publishing an offering.")
        
    profile = await data_adapter.get_expert_profile(str(user_id))
    if profile is None or str(profile.user_id) != str(user_id):
        raise PermissionError("Only an authenticated expert account can publish an offering.")
        
    offering = Offering(
        title=draft.title,
        offer_type=draft.offer_type,
        price=draft.price,
        duration=draft.duration or ("N/A" if draft.file_required else "60 min"),
        description=draft.description or f"{draft.title} on MindGigs",
        file_required=draft.file_required
    )
    
    offering_id = await data_adapter.save_offering(str(profile.id), offering)
    refreshed = await data_adapter.get_user_context(user_id)
    
    return {
        "id": offering_id,
        "title": draft.title,
        "offer_type": draft.offer_type,
        "price": draft.price,
        "currency": draft.currency,
        "duration": draft.duration,
        "description": draft.description,
        "file_required": draft.file_required,
        "file_path": draft.file_path,
        "verified_in_db": refreshed is not None,
    }

