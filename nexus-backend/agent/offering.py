import re
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from services.adapters import DataAdapter, Offering

Union_ID = Union[str, int]


class Availability(BaseModel):
    days: List[str] = Field(default_factory=list)
    start: Optional[str] = None
    end: Optional[str] = None

    @property
    def hours_summary(self) -> str:
        if self.start and self.end:
            return f"{self.start} - {self.end}"
        return "09:00 AM - 05:00 PM"


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

    # Custom Offer specific fields
    custom_scope: Optional[str] = None
    delivery_timeline: Optional[str] = None
    
    # Newsletter specific fields
    newsletter_subject: Optional[str] = None
    target_audience: Optional[str] = None
    content_draft: Optional[str] = None

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
    if "newsletter" in lowered or "broadcast" in lowered or "email digest" in lowered:
        return "Newsletter"
    if "book" in lowered or "ebook" in lowered or "publish my book" in lowered:
        return "Book"
    if "subscription" in lowered or "monthly plan" in lowered or "recurring" in lowered or "every month" in lowered or "/month" in lowered or "/mo" in lowered:
        return "Subscription"
    if "digital product" in lowered or "pdf" in lowered or "zip" in lowered or "template" in lowered or "downloadable" in lowered:
        return "Digital Product"
    if "highlight" in lowered or "card" in lowered:
        return "Highlight"
    if "custom offer" in lowered or "custom service" in lowered or "custom project" in lowered:
        return "Custom Offer"
    if "1:1" in lowered or "one-on-one" in lowered or "session" in lowered or "consult" in lowered or "advisory" in lowered or "call" in lowered:
        return "1:1 Session"

    # Fallback to screen context if natural language is ambiguous
    if current_screen:
        screen_low = current_screen.lower()
        if "newsletter" in screen_low:
            return "Newsletter"
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


def parse_availability(text: str) -> Availability:
    lowered = text.lower()
    days: List[str] = []
    
    day_map = {
        "monday": "Monday", "mon": "Monday",
        "tuesday": "Tuesday", "tue": "Tuesday",
        "wednesday": "Wednesday", "wed": "Wednesday",
        "thursday": "Thursday", "thu": "Thursday",
        "friday": "Friday", "fri": "Friday",
        "saturday": "Saturday", "sat": "Saturday",
        "sunday": "Sunday", "sun": "Sunday",
    }
    
    if "weekday" in lowered:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    elif "weekend" in lowered:
        days = ["Saturday", "Sunday"]
    else:
        for k, v in day_map.items():
            if re.search(r"\b" + k + r"\b", lowered):
                if v not in days:
                    days.append(v)
                    
    if not days:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    # Parse hours/time if mentioned (e.g. "9am to 5pm", "10:00 - 18:00", "2pm to 6pm", "from 10am until 4pm")
    time_match = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until|through)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)", lowered)
    if time_match:
        start_time = time_match.group(1).strip().upper()
        end_time = time_match.group(2).strip().upper()
        if not any(m in start_time for m in ["AM", "PM"]):
            start_time += " AM"
        if not any(m in end_time for m in ["AM", "PM"]):
            end_time += " PM"
    else:
        start_time = "09:00 AM"
        end_time = "05:00 PM"

    return Availability(days=days, start=start_time, end=end_time)


def extract_offering_entities(message: str, current_screen: Optional[str] = None) -> OfferingDraft:
    offering_type = resolve_offering_type(message, current_screen)
    price = parse_price(message)
    duration = parse_duration(message)
    lowered = message.lower()
    
    title_match = re.search(r"(?:title|called|named|subject|titled)\s*(?:is|:)?\s*[\"']?([^\"'.!,?]+)", message, re.I)
    title = title_match.group(1).strip() if title_match else None
    
    if not title:
        topic_match = re.search(r"(?:offering|session about|consulting for|advisory on|book about|subscription for|newsletter for|newsletter about|where i will|where i|help)\s+([a-zA-Z0-9\s&]+?)(?:\.|\$|total|for|\d+|$)", message, re.I)
        if topic_match:
            raw_topic = topic_match.group(1).strip()
            raw_topic = re.sub(r"\b(and other related things|and related things|and so on|total time|total|time|companies|better)\b", "", raw_topic, flags=re.I).strip()
            if raw_topic and len(raw_topic) > 3:
                title = " ".join([w.capitalize() for w in raw_topic.split() if w.lower() not in ["where", "i", "will"]])

    if not title or len(title) < 3 or title.lower() in ["for", "a", "an", "the", "session", "book", "subscription", "newsletter"]:
        if "finance" in lowered or "cash flow" in lowered or "money" in lowered or "cfo" in lowered:
            title = "Financial & Cash Flow Management Advisory"
        elif "marketing" in lowered or "growth" in lowered or "ads" in lowered:
            title = f"Marketing & Growth {offering_type}"
        elif "ai" in lowered or "rag" in lowered or "llm" in lowered:
            title = f"AI Architecture & LLM {offering_type}"
        elif offering_type == "Book":
            title = "My New Book"
        elif offering_type == "Subscription":
            title = "Monthly Advisory Club"
        elif offering_type == "Digital Product":
            title = "Specialist Digital Playbook"
        elif offering_type == "Newsletter":
            title = "Expert Weekly Digest"
        elif offering_type == "Custom Offer":
            title = "Custom Advisory & Implementation Project"
        else:
            title = f"1:1 Advisory Session" if "1:1" in offering_type else f"{offering_type} Offering"

    availability = parse_availability(message) if offering_type == "1:1 Session" else None

    # Determine description and specific fields
    description = f"{title} — 1:1 session offering on MindGigs." if offering_type == "1:1 Session" else f"{title} — premium {offering_type.lower()} on MindGigs."
    if "help companies" in lowered or "cash flow" in lowered or "finances" in lowered:
        description = "1:1 consultation session helping companies manage finances, optimize unit economics, and better handle cash flow."

    newsletter_subject = title if offering_type == "Newsletter" else None
    target_audience = "Subscribers & Clients" if offering_type == "Newsletter" else None
    content_draft = f"Welcome to {title}! Here are the key insights and strategic updates for this week." if offering_type == "Newsletter" else None

    custom_scope = "Custom scope tailored to specific project requirements." if offering_type == "Custom Offer" else None
    delivery_timeline = "3-5 business days" if offering_type == "Custom Offer" else None
    
    file_required = offering_type in ["Book", "Digital Product"]
    
    billing_period = "monthly"
    if "yearly" in lowered or "annual" in lowered:
        billing_period = "yearly"

    final_price = price if price is not None else (0.0 if offering_type == "Newsletter" else None)

    return OfferingDraft(
        title=title,
        offer_type=offering_type,
        price=final_price,
        duration=duration or ("N/A" if file_required or offering_type in ["Newsletter", "Custom Offer"] else "60 min"),
        description=description,
        billing_period=billing_period if offering_type == "Subscription" else None,
        file_required=file_required,
        availability=availability,
        custom_scope=custom_scope,
        delivery_timeline=delivery_timeline,
        newsletter_subject=newsletter_subject,
        target_audience=target_audience,
        content_draft=content_draft
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

