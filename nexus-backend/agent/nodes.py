import json
import re
from typing import Dict, Any, List, Optional

from agent.state import NexusState
from agent.intents import NexusIntent, INTENT_DESCRIPTIONS, SUGGESTED_ACTIONS_BY_INTENT
from services.adapters import get_data_adapter, get_llm_adapter, get_vector_adapter
from services.adapters.faiss_adapter import FAISSAdapter
from agent.offering import (
    execute_offering,
    extract_offering_entities,
    merge_draft,
    OfferingDraft,
    resolve_offering_type,
    parse_price
)


def normalize_response_text(text: str) -> str:
    """Normalize agent UI response text by removing raw JSON, internal jargon, or ugly markdown headers."""
    if not text:
        return ""
    # Strip raw JSON if enclosed
    text = re.sub(r"```json\s*.*?\s*```", "", text, flags=re.DOTALL)
    # Strip markdown h1/h2/h3 headers
    text = re.sub(r"^#{1,3}\s*", "", text, flags=re.MULTILINE)
    # Strip internal technical terms
    text = text.replace("NexusGraph", "NEXUS").replace("data_adapter", "database")
    return text.strip()


async def node_load_context(state: NexusState) -> Dict[str, Any]:
    """Node: Load user context (profile, role, offerings) from database."""
    data_adapter = get_data_adapter()
    user_id = state.get("user_id", 1)
    
    ctx = await data_adapter.get_user_context(user_id)
    if ctx:
        user_dict = {
            "id": ctx.user.id,
            "full_name": ctx.user.full_name,
            "email": ctx.user.email,
            "role": ctx.role,
            "public_handle": ctx.user.public_handle,
            "currency": ctx.user.currency,
        }
        expert_dict = ctx.expert_profile.model_dump() if ctx.expert_profile else None
        offerings_list = [o.model_dump() for o in ctx.offerings]
        
        user_context = {
            "user": user_dict,
            "role": ctx.role,
            "is_expert": ctx.is_expert,
            "is_client": ctx.is_client,
            "expert_profile": expert_dict,
            "offerings": offerings_list
        }
    else:
        user_context = {
            "user": {"id": user_id, "role": state.get("role", "client")},
            "role": state.get("role", "client"),
            "is_expert": False,
            "is_client": True,
            "expert_profile": None,
            "offerings": []
        }

    return {
        "role": user_context["role"],
        "user_context": user_context
    }


async def node_classify_intent(state: NexusState) -> Dict[str, Any]:
    """
    Node: Classify user intent dynamically using application context, route, screen, and message semantics.
    Enforces task switching and prevents stale state retention.
    """
    llm = get_llm_adapter()
    message = state.get("message", "")
    role = state.get("role", "client")
    agent_ctx = state.get("agent_context") or {}
    current_route = state.get("current_route") or agent_ctx.get("route", "")
    current_screen = agent_ctx.get("screen", "")
    pending = state.get("pending_action", {})
    pending_act = pending.get("action")
    msg_lower = message.lower().strip()

    # 1. Explicit Confirmation or Cancellation of pending action
    if pending_act and any(k in msg_lower for k in ["cancel", "forget that", "stop", "nevermind", "abort"]):
        return {
            "intent": NexusIntent.GENERAL_CHAT,
            "pending_action": {},
            "requires_confirmation": False,
            "confirmation_action": None,
            "draft": None
        }

    if pending_act == "publish_offering" and any(k in msg_lower for k in ["confirm", "yes", "publish", "do it", "approve", "go ahead"]):
        return {"intent": NexusIntent.OFFERING_CREATE}

    if pending_act == "update_offering" and any(k in msg_lower for k in ["confirm", "yes", "update", "do it", "approve"]):
        return {"intent": NexusIntent.OFFERING_EDIT}

    # 2. Navigation Intent
    if any(k in msg_lower for k in ["take me to", "go to", "navigate to", "open screen", "show screen"]):
        if "booking" in msg_lower:
            return {"intent": "navigation", "target_route": "/my-bookings"}
        if "purchase" in msg_lower:
            return {"intent": "navigation", "target_route": "/my-purchases"}
        if "offer" in msg_lower:
            return {"intent": "navigation", "target_route": "/sell/offers"}
        if "book" in msg_lower:
            return {"intent": "navigation", "target_route": "/sell/books"}
        if "subscription" in msg_lower:
            return {"intent": "navigation", "target_route": "/sell/subscriptions"}
        if "expert" in msg_lower:
            return {"intent": "navigation", "target_route": "/experts"}
        if "account" in msg_lower:
            return {"intent": "navigation", "target_route": "/account/general"}

    # 2.5 Expert Onboarding / Role Transition Intent
    if any(k in msg_lower for k in ["become an expert", "become expert", "start selling", "sign up as expert", "how to become expert", "upgrade to expert", "want to be an expert"]):
        return {"intent": NexusIntent.EXPERT_PROFILE_CREATE}

    if "my offers" in msg_lower or "show offers" in msg_lower or "view offers" in msg_lower:
        if role == "expert":
            return {"intent": "navigation", "target_route": "/sell/offers"}
    if "my bookings" in msg_lower or "show bookings" in msg_lower or "view bookings" in msg_lower or "show my bookings" in msg_lower:
        return {"intent": "navigation", "target_route": "/my-bookings"}
    if "find experts" in msg_lower or "search experts" in msg_lower or "browse experts" in msg_lower:
        return {"intent": "navigation", "target_route": "/experts"}

    # 3. Explicit Search Expert Intent (overrides current screen context)
    search_triggers = [
        "find", "search", "match", "hire", "looking for", "need an expert",
        "expert for", "recommend", "need help", "need someone", "who can help",
        "help me market", "help me launch", "help me publish", "someone to",
        "who can"
    ]
    if any(k in msg_lower for k in search_triggers):
        return {"intent": NexusIntent.CLIENT_MATCH_SEARCH}

    # 4. Financial & Earnings Inquiries
    if any(k in msg_lower for k in ["earning", "payout", "revenue", "paid", "income"]):
        return {"intent": NexusIntent.EARNINGS_INQUIRY}

    # 5. Bookings Inquiries
    if any(k in msg_lower for k in ["booking", "schedule", "calendar", "appointment"]):
        return {"intent": NexusIntent.BOOKINGS_INQUIRY if role == "expert" else NexusIntent.BOOKING_REQUEST}

    # 6. Offering Editing Intent
    if role == "expert" and any(k in msg_lower for k in ["edit offer", "update price", "change price", "change my", "change price of"]):
        return {"intent": NexusIntent.OFFERING_EDIT}

    # 7. Offering Creation Intent (Book, Subscription, Digital Product, 1:1, Custom, Highlight)
    if (
        any(k in msg_lower for k in ["create", "publish", "add", "sell", "new offer", "new book", "new subscription", "new product", "new session"]) or
        ("book" in msg_lower and any(k in msg_lower for k in ["$", "dollar", "sell", "price"]) and not any(k in msg_lower for k in search_triggers)) or
        ("subscription" in msg_lower and any(k in msg_lower for k in ["$", "dollar", "plan", "monthly", "price"]) and not any(k in msg_lower for k in search_triggers)) or
        ("product" in msg_lower and any(k in msg_lower for k in ["$", "dollar", "pdf", "zip", "price"]) and not any(k in msg_lower for k in search_triggers))
    ):
        return {"intent": NexusIntent.OFFERING_CREATE}

    # 8. Profile Editing Intent
    if role == "expert" and any(k in msg_lower for k in ["profile", "bio", "headline", "tag"]):
        return {"intent": NexusIntent.EXPERT_PROFILE_EDIT}

    # Closed-world LLM Classifier Fallback
    prompt = f"""Classify the user intent for the MindGigs AI operator.
User Role: {role}
Current Screen: {current_screen or current_route}
Message: "{message}"

Allowed Intents:
{json.dumps([i.value for i in NexusIntent], indent=2)}

Respond ONLY with the exact intent string from the list above."""
    try:
        raw_intent = await llm.classify(prompt)
        raw_intent = raw_intent.strip().strip('"').strip("'")
        valid_intents = [i.value for i in NexusIntent]
        intent = raw_intent if raw_intent in valid_intents else NexusIntent.GENERAL_CHAT
    except Exception:
        intent = NexusIntent.GENERAL_CHAT

    return {"intent": intent}


async def node_offering_create(state: NexusState) -> Dict[str, Any]:
    """Node: Handle offering creation workflows (1:1 Sessions, Subscriptions, Books, Digital Products, Custom Offers)."""
    # 1. Authorization Enforcement
    if state.get("role") != "expert":
        return {
            "response_text": normalize_response_text("Creating and managing expert offerings is reserved for Expert accounts. As a Client account, you can browse experts, view profiles, and book sessions."),
            "response_type": "error",
            "suggested_actions": ["Find Experts", "My Bookings"]
        }

    data_adapter = get_data_adapter()
    vector_adapter = get_vector_adapter()
    message = state.get("message", "")
    agent_ctx = state.get("agent_context") or {}
    current_screen = agent_ctx.get("screen", "") or state.get("current_route", "")
    
    previous_draft = state.get("draft")
    extraction = extract_offering_entities(message, current_screen)
    draft = merge_draft(previous_draft, extraction)
    pending = state.get("pending_action") or {}
    msg_low = message.lower().strip()

    is_confirmation = bool(
        (pending.get("action") == "publish_offering" and pending.get("user_id") == state.get("user_id")) and
        any(k in msg_low for k in ["publish", "yes", "confirm", "approve", "create", "go ahead", "do it"])
    )

    # 2. Execution upon confirmation
    if is_confirmation:
        try:
            result = await execute_offering(data_adapter, state["user_id"], draft)
            all_experts = await data_adapter.list_experts()
            try:
                await vector_adapter.index_experts(all_experts)
            except Exception as ve:
                print(f"[FAISS re-index warning] {ve}")

            return {
                "response_text": normalize_response_text(f"Your {draft.offer_type} '{draft.title}' (${draft.price}) has been created successfully and verified in the database."),
                "response_type": "action_success",
                "action_result": result,
                "draft": draft.model_dump(),
                "pending_action": {},
                "requires_confirmation": False,
                "confirmation_action": None,
                "suggested_actions": ["View My Offers", "Edit Offer", "Create Another Offer"]
            }
        except (PermissionError, ValueError) as exc:
            return {
                "response_text": normalize_response_text(f"I couldn't publish the offering: {exc}"),
                "response_type": "error",
                "action_result": {"success": False, "error": str(exc)},
                "draft": draft.model_dump(),
                "pending_action": pending,
                "requires_confirmation": True,
                "confirmation_action": "publish_offering",
            }
        except Exception as exc:
            return {
                "response_text": normalize_response_text(f"I couldn't publish the offering because the data operation failed: {exc}"),
                "response_type": "error",
                "action_result": {"success": False, "error": str(exc)},
                "draft": draft.model_dump(),
                "pending_action": pending,
                "requires_confirmation": True,
                "confirmation_action": "publish_offering",
            }

    # 3. Missing Fields Validation
    missing = []
    if not draft.title:
        missing.append("title")
    if draft.price is None:
        missing.append("price")
        
    if missing:
        labels = " and ".join(missing)
        return {
            "response_text": normalize_response_text(f"I have the details you provided for your {draft.offer_type}. Please provide the {labels} so I can prepare the offering preview."),
            "response_type": "clarification",
            "draft": draft.model_dump(),
            "pending_action": {},
            "requires_confirmation": False,
        }

    # 4. Form Action Preview State
    return {
        "response_text": normalize_response_text(f"I have prepared the details for your {draft.offer_type} '{draft.title}'. Review and edit the fields below before publishing."),
        "response_type": "action_preview",
        "draft": draft.model_dump(),
        "pending_action": {"action": "publish_offering", "user_id": state["user_id"]},
        "requires_confirmation": True,
        "confirmation_action": "publish_offering",
        "suggested_actions": ["Confirm Creation", "Edit Details", "Cancel"]
    }


async def node_offering_edit(state: NexusState) -> Dict[str, Any]:
    """Node: Handle natural language offering updates and targeted entity modifications."""
    if state.get("role") != "expert":
        return {
            "response_text": normalize_response_text("Updating offerings is reserved for Expert accounts."),
            "response_type": "error",
            "suggested_actions": ["Find Experts", "My Bookings"]
        }

    data_adapter = get_data_adapter()
    message = state.get("message", "")
    user_id = state.get("user_id", 1)
    agent_ctx = state.get("agent_context") or {}
    selected_entity_id = agent_ctx.get("selected_entity_id") or state.get("selected_entity_id")
    
    new_price = parse_price(message)

    ctx = await data_adapter.get_user_context(user_id)
    user_offerings = ctx.offerings if ctx else []

    if not user_offerings:
        return {
            "response_text": normalize_response_text("You don't have any active offerings to edit yet. Would you like to create one?"),
            "response_type": "general",
            "suggested_actions": ["Create a 1:1 Session"]
        }

    # Entity resolution: target selected_entity_id if present, else title match, else first offering
    target_off = user_offerings[0]
    if selected_entity_id:
        for off in user_offerings:
            if str(off.id) == str(selected_entity_id):
                target_off = off
                break
    else:
        for off in user_offerings:
            if any(w.lower() in message.lower() for w in off.title.split() if len(w) > 3):
                target_off = off
                break

    pending = state.get("pending_action") or {}
    msg_low = message.lower().strip()
    is_confirmation = bool(
        pending.get("action") == "update_offering" and
        any(k in msg_low for k in ["confirm", "yes", "update", "approve", "publish", "do it"])
    )

    if is_confirmation and target_off.id:
        update_price = pending.get("new_price") or new_price or float(target_off.price)
        updated = await data_adapter.update_offering(int(target_off.id), {"price": update_price})
        if updated:
            all_exp = await data_adapter.list_experts()
            try:
                await get_vector_adapter().index_experts(all_exp)
            except Exception:
                pass
            return {
                "response_text": normalize_response_text(f"Price for '{updated.title}' updated to ${updated.price} successfully and verified in database."),
                "response_type": "action_success",
                "action_result": updated.model_dump(),
                "pending_action": {},
                "requires_confirmation": False,
                "suggested_actions": ["View My Offers", "Edit Profile"]
            }

    proposed_price = new_price or (float(target_off.price) + 50.0)
    draft = {
        "id": target_off.id,
        "title": target_off.title,
        "offer_type": target_off.offer_type,
        "price": proposed_price,
        "duration": target_off.duration,
        "description": target_off.description
    }

    return {
        "response_text": normalize_response_text(f"I have prepared the update for '{target_off.title}'. Review the updated details below."),
        "response_type": "action_preview",
        "draft": draft,
        "pending_action": {"action": "update_offering", "offering_id": target_off.id, "new_price": proposed_price},
        "requires_confirmation": True,
        "confirmation_action": "update_offering",
        "suggested_actions": ["Confirm Update", "Cancel"]
    }


def extract_onboarding_entities(message: str, user_name: str) -> Dict[str, Any]:
    """Extract user onboarding fields dynamically from user message."""
    msg_low = message.lower()
    headline = None
    category = None
    bio = None
    tags = None

    if any(k in msg_low for k in ["ai", "data", "ml", "python", "machine learning"]):
        category = "AI & Data"
    elif any(k in msg_low for k in ["marketing", "seo", "growth", "book launch", "pr"]):
        category = "Marketing & Growth"
    elif any(k in msg_low for k in ["software", "code", "react", "flutter", "dev", "architecture"]):
        category = "Software Development"
    elif any(k in msg_low for k in ["coach", "leadership", "executive", "management"]):
        category = "Coaching & Leadership"
    elif any(k in msg_low for k in ["operation", "six sigma", "supply chain", "process"]):
        category = "Operations & Supply Chain"

    if "headline:" in msg_low:
        headline = message.split("headline:", 1)[1].split("\n")[0].strip()
    elif "expert in" in msg_low:
        extracted = message.split("expert in", 1)[1].split(".")[0].strip()
        headline = f"Senior Expert in {extracted.title()}"

    if "bio:" in msg_low:
        bio = message.split("bio:", 1)[1].split("\n")[0].strip()

    if "tags:" in msg_low:
        tags = message.split("tags:", 1)[1].split("\n")[0].strip()

    cat_final = category or "Coaching & Leadership"
    return {
        "full_name": user_name,
        "professional_headline": headline or f"Senior {cat_final} Strategist & Advisor",
        "category": cat_final,
        "bio": bio or f"{user_name} is a verified expert offering 1:1 video consultations and specialized digital products on MindGigs.",
        "expertise_tags": tags or "Strategy, Consulting, Domain Leadership",
        "currency": "USD"
    }


async def node_expert_profile_create(state: NexusState) -> Dict[str, Any]:
    """Node: Handle client-to-expert onboarding workflow and profile editing."""
    data_adapter = get_data_adapter()
    user_id = state.get("user_id", 1)
    message = state.get("message", "")
    pending = state.get("pending_action") or {}
    msg_low = message.lower().strip()
    user_ctx = state.get("user_context", {}).get("user", {})
    user_name = user_ctx.get("full_name", "Verified Expert")

    if pending.get("action") in ["onboard_expert", "create_expert_profile"] and any(k in msg_low for k in ["confirm", "yes", "publish", "do it", "approve", "go ahead", "submit"]):
        draft = pending.get("draft", {})
        from services.adapters import ExpertProfile
        tags_raw = draft.get("expertise_tags", "Consulting, Strategy")
        tags_list = tags_raw.split(",") if isinstance(tags_raw, str) else tags_raw
        profile = ExpertProfile(
            user_id=user_id,
            professional_headline=draft.get("professional_headline", f"{user_name} - Verified Expert"),
            category=draft.get("category", "Coaching & Leadership"),
            bio=draft.get("bio", f"{user_name} is a verified expert offering consultations on MindGigs."),
            expertise_tags=tags_list,
            is_verified=True
        )
        await data_adapter.save_expert_profile(str(user_id), profile)
        return {
            "response_text": normalize_response_text(f"Congratulations {user_name}! Your MindGigs Expert Seller profile is now active. Your role has been upgraded to Expert, unlocking full SELL tools and offering creation."),
            "response_type": "success",
            "role": "expert",
            "pending_action": {},
            "requires_confirmation": False,
            "suggested_actions": ["Create 1:1 Session", "Sell a Book", "Create Subscription"]
        }

    previous_draft = state.get("draft") or {}
    extracted = extract_onboarding_entities(message, user_name)
    draft = {**extracted, **{k: v for k, v in previous_draft.items() if v}}

    return {
        "response_text": normalize_response_text(f"I have prepared your MindGigs Expert Onboarding application for {user_name}. Review your professional headline, category, and bio below to activate your Seller account."),
        "response_type": "action_preview",
        "draft": draft,
        "pending_action": {"action": "onboard_expert", "draft": draft},
        "requires_confirmation": True,
        "confirmation_action": "onboard_expert",
        "suggested_actions": ["Confirm & Become Expert", "Edit Details", "Cancel"]
    }


async def node_client_search(state: NexusState) -> Dict[str, Any]:
    """Node: Perform real FAISS vector search & DB lookup for grounded expert discovery."""
    data_adapter = get_data_adapter()
    vector_adapter = get_vector_adapter()
    message = state.get("message", "")

    all_experts = await data_adapter.list_experts()
    if all_experts:
        try:
            await vector_adapter.index_experts(all_experts)
        except Exception as e:
            print(f"[FAISS index search error] {e}")

    query_vec = []
    if isinstance(vector_adapter, FAISSAdapter):
        query_vec = vector_adapter.get_embedding(message)
    else:
        query_vec = [0.1] * 384

    search_results = await vector_adapter.search(query_vec, top_k=max(len(all_experts), 1))

    matches_list = []
    for exp_id, base_score in search_results:
        prof = await data_adapter.get_expert_profile(str(exp_id))
        if prof:
            pct_score = round(min(98.5, max(65.0, base_score * 100.0 if base_score <= 1.0 else base_score)), 1)
            tags_list = prof.expertise_tags if isinstance(prof.expertise_tags, list) else [t.strip() for t in prof.expertise_tags.split(",") if t.strip()]

            grounded_reasons = []
            if prof.category:
                grounded_reasons.append(f"Category: {prof.category}")
            if tags_list:
                grounded_reasons.append(f"Skills: {', '.join(tags_list[:3])}")
            if prof.offerings:
                grounded_reasons.append(f"Offering: {prof.offerings[0].title}")

            reasoning = f"{prof.professional_headline}. " + " | ".join(grounded_reasons)

            top_offering = None
            if prof.offerings:
                o = prof.offerings[0]
                top_offering = {
                    "id": o.id,
                    "title": o.title,
                    "offer_type": o.offer_type,
                    "price": float(o.price),
                    "duration": o.duration or "60 min",
                    "currency": "USD"
                }

            matches_list.append({
                "id": prof.id,
                "user_id": prof.user_id,
                "full_name": prof.full_name or "Expert Specialist",
                "handle": prof.public_handle or f"expert_{prof.id}",
                "headline": prof.professional_headline or "Expert",
                "category": prof.category or "General",
                "tags": tags_list,
                "match_score": pct_score,
                "reasoning": reasoning,
                "is_verified": prof.is_verified,
                "top_offering": top_offering
            })

    return {
        "response_text": normalize_response_text("I found experts whose profiles and verified offerings match your request. Review their match cards below."),
        "response_type": "search_results",
        "response_data": {"matches": matches_list},
        "suggested_actions": ["View Top Profile", "Book Session", "Narrow Search"]
    }


async def node_earnings_inquiry(state: NexusState) -> Dict[str, Any]:
    """Node: Query actual DB earnings for expert account."""
    if state.get("role") != "expert":
        return {
            "response_text": normalize_response_text("Earnings and payout details are only available for Expert accounts. As a Client account, you can manage your bookings and purchases."),
            "response_type": "error",
            "suggested_actions": ["Find Experts", "My Bookings"]
        }

    data_adapter = get_data_adapter()
    user_id = state.get("user_id", 1)
    earnings_data = await data_adapter.get_earnings(user_id)
    
    return {
        "response_text": normalize_response_text("Here is your current earnings summary based on verified bookings."),
        "response_type": "earnings",
        "response_data": earnings_data,
        "suggested_actions": ["Request Payout", "View Bookings", "Create Offering"]
    }


async def node_navigation(state: NexusState) -> Dict[str, Any]:
    """Node: Return structured navigation action for frontend router."""
    target = state.get("target_route") or "/overview"
    if "my-offers" in target or "sell" in target:
        label = "My Offers"
    elif "my-bookings" in target:
        label = "My Bookings"
    elif "my-purchases" in target:
        label = "My Purchases"
    elif "experts" in target:
        label = "Explore Experts"
    elif "account" in target:
        label = "Account Settings"
    else:
        label = "MindGigs Overview"

    return {
        "response_text": normalize_response_text(f"Navigating you to {label}..."),
        "response_type": "navigation",
        "navigation_action": {"route": target},
        "suggested_actions": ["Overview", "My Bookings", "Explore Experts"]
    }


async def node_bookings_inquiry(state: NexusState) -> Dict[str, Any]:
    """Node: Query bookings for user."""
    data_adapter = get_data_adapter()
    user_id = state.get("user_id", 1)
    role = state.get("role", "client")
    bookings = await data_adapter.list_bookings(user_id, role)
    
    return {
        "response_text": normalize_response_text(f"Here are your {'incoming' if role == 'expert' else 'active'} bookings from the database."),
        "response_type": "booking",
        "response_data": {"bookings": bookings},
        "suggested_actions": ["Find Experts" if role == 'client' else "View Earnings"]
    }


async def node_respond(state: NexusState) -> Dict[str, Any]:
    """Node: Generate role-aware concise fallback response."""
    llm = get_llm_adapter()
    user_context = state.get("user_context", {})
    role = state.get("role", "client")
    message = state.get("message", "")
    intent = state.get("intent", NexusIntent.GENERAL_CHAT)

    user_info = user_context.get("user", {})
    user_name = user_info.get("full_name", "User")

    system_prompt = f"""You are NEXUS, the intelligent AI operating assistant for MindGigs.
User: {user_name} ({role.upper()}).
Goal: Provide 1-3 short, clean sentences guiding the user or operating MindGigs.
Never invent fake features, ratings, prices, or fake checkout flows.
"""
    raw_response = await llm.generate(message, system_prompt=system_prompt)
    clean_response = normalize_response_text(raw_response)
    suggested = SUGGESTED_ACTIONS_BY_INTENT.get(intent, ["How does NEXUS work?", "Explore Platform"])

    return {
        "response_text": clean_response,
        "response_type": "general",
        "suggested_actions": suggested
    }


async def node_persist_session(state: NexusState) -> Dict[str, Any]:
    """Node: Persist updated conversation history and state to SQLite database."""
    data_adapter = get_data_adapter()
    session_id = state.get("session_id")
    user_id = state.get("user_id")
    message = state.get("message")
    response_text = state.get("response_text")
    history = list(state.get("conversation_history", []))

    if message:
        history.append({"role": "user", "content": message})
    if response_text:
        history.append({"role": "assistant", "content": response_text})

        state_to_save = {
            "intent": state.get("intent"),
            "role": state.get("role"),
            "suggested_actions": state.get("suggested_actions", []),
            "response_type": state.get("response_type", "message"),
            "extracted_entities": state.get("extracted_entities", {}),
            "draft": state.get("draft", {}),
            "pending_action": state.get("pending_action", {}),
            "requires_confirmation": state.get("requires_confirmation", False),
            "confirmation_action": state.get("confirmation_action"),
            "response_data": state.get("response_data", {}),
            "navigation_action": state.get("navigation_action")
        }
        await data_adapter.save_session(session_id, user_id, history, state_to_save)

    return {
        "conversation_history": history,
        "response_text": response_text,
        "response_type": state.get("response_type"),
        "response_data": state.get("response_data"),
        "draft": state.get("draft"),
        "action_result": state.get("action_result"),
        "requires_confirmation": state.get("requires_confirmation", False),
        "confirmation_action": state.get("confirmation_action"),
        "navigation_action": state.get("navigation_action")
    }

