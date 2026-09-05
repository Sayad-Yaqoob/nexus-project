import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from services.adapters import DataAdapter, Offering


class Availability(BaseModel):
    days: List[str] = Field(default_factory=list)
    start: Optional[str] = None
    end: Optional[str] = None


class OfferingExtraction(BaseModel):
    offering_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    duration: Optional[str] = None
    availability: Optional[Availability] = None


class OfferingDraft(BaseModel):
    title: Optional[str] = None
    offer_type: str = "1:1 Session"
    price: Optional[float] = None
    currency: str = "USD"
    duration: Optional[str] = None
    description: Optional[str] = None
    availability: Optional[Availability] = None


def _duration(text: str) -> Optional[str]:
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


def _price(text: str) -> Optional[float]:
    match = re.search(r"(?:[$€£]\s*|(?:usd|dollars?|eur|euros?|gbp|pounds?)\s*)(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:[$€£]|usd|dollars?|eur|euros?|gbp|pounds?)", text, re.I)
    if not match:
        return None
    return float(match.group(1) or match.group(2))


def _availability(text: str) -> Optional[Availability]:
    lowered = text.lower()
    days: List[str] = []
    if "weekend" in lowered:
        days = ["Saturday", "Sunday"]
    else:
        day_names = {
            "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
            "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday",
            "sunday": "Sunday",
        }
        days = [name for key, name in day_names.items() if key in lowered]
    times = re.findall(r"\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s*(?:am|pm)?\b", lowered)
    if not days and len(times) < 2:
        return None

    def normalize(value: str) -> str:
        value = value.strip().lower().replace(" ", "")
        match = re.fullmatch(r"(\d{1,2})(?::(\d{2}))?(am|pm)?", value)
        if not match:
            return value
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        suffix = match.group(3)
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}"

    return Availability(
        days=days,
        start=normalize(times[0]) if len(times) >= 2 else None,
        end=normalize(times[1]) if len(times) >= 2 else None,
    )


def extract_offering_entities(message: str) -> OfferingExtraction:
    lowered = message.lower()
    if "digital product" in lowered or "pdf" in lowered or "template" in lowered:
        offering_type = "Digital Product"
    elif "subscription" in lowered:
        offering_type = "Subscription"
    elif "custom offer" in lowered:
        offering_type = "Custom Offer"
    elif "book" in lowered:
        offering_type = "Book"
    elif "session" in lowered or "consult" in lowered or "call" in lowered or "1:1" in lowered or "one-on-one" in lowered:
        offering_type = "1:1 Session"
    else:
        offering_type = "1:1 Session"

    title_match = re.search(r"(?:title|called|named)\s*(?:is|:)?\s*[\"']?([^\"'.!,?]+)", message, re.I)
    title = title_match.group(1).strip() if title_match else None

    if not title:
        topic_match = re.search(r"(?:offering|session about|consulting for|advisory on)\s+([a-zA-Z0-9\s&]+?)(?:\.|\$|total|for|\d+|$)", message, re.I)
        if topic_match:
            raw_topic = topic_match.group(1).strip()
            raw_topic = re.sub(r"\b(and other related things|and related things|and so on|total time|total|time)\b", "", raw_topic, flags=re.I).strip()
            if raw_topic and len(raw_topic) > 2:
                words = [w.capitalize() for w in raw_topic.split()]
                topic_title = " ".join(words)
                if "Session" not in topic_title and offering_type == "1:1 Session":
                    title = f"{topic_title} Session"
                else:
                    title = topic_title

    if not title or len(title) < 3 or title.lower() in ["for", "a", "an", "the", "session"]:
        if "marketing" in lowered:
            title = "Marketing Strategy Session"
        elif offering_type == "1:1 Session":
            title = "1:1 Advisory Session"
        else:
            title = f"Custom {offering_type}"

    description = f"{title} consulting and advisory."
    if "offering" in lowered:
        desc_match = re.search(r"offering\s+([^.$]+)", message, re.I)
        if desc_match:
            description = desc_match.group(1).strip().capitalize()
            if not description.endswith('.'):
                description += "."

    return OfferingExtraction(
        offering_type=offering_type,
        title=title,
        description=description,
        price=_price(message),
        currency="USD" if re.search(r"\$|usd|dollar", lowered) else "USD",
        duration=_duration(message) or "60 min",
        availability=_availability(message),
    )


def merge_draft(previous: Optional[Dict[str, Any]], extraction: OfferingExtraction) -> OfferingDraft:
    values: Dict[str, Any] = dict(previous or {})
    incoming = extraction.model_dump(exclude_none=True)
    if "availability" in incoming:
        incoming["availability"] = extraction.availability.model_dump(exclude_none=True) if extraction.availability else None
    values.update(incoming)
    return OfferingDraft.model_validate(values)


async def execute_offering(
    data_adapter: DataAdapter,
    user_id: int,
    draft: OfferingDraft,
) -> Dict[str, Any]:
    if draft.title is None or draft.price is None:
        raise ValueError("The offering draft is incomplete.")
    profile = await data_adapter.get_expert_profile(str(user_id))
    if profile is None or str(profile.user_id) != str(user_id):
        raise PermissionError("Only an authenticated expert with an expert profile can publish an offering.")
    offering = Offering(
        title=draft.title,
        offer_type=draft.offer_type,
        price=draft.price,
        duration=draft.duration,
        description=draft.description,
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
        "availability": draft.availability.model_dump() if draft.availability else None,
        "context_refreshed": refreshed is not None,
    }
