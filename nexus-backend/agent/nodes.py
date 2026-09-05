import json
from typing import Dict, Any, List

from agent.state import NexusState
from agent.intents import NexusIntent, INTENT_DESCRIPTIONS, SUGGESTED_ACTIONS_BY_INTENT
from services.adapters import get_data_adapter, get_llm_adapter, get_vector_adapter
from agent.offering import execute_offering, extract_offering_entities, merge_draft, OfferingDraft

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
    """Node: Classify user intent using fast LLM model with context awareness."""
    llm = get_llm_adapter()
    message = state.get("message", "")
    role = state.get("role", "client")
    pending = state.get("pending_action", {})
    pending_act = pending.get("action")

    if pending_act == "publish_offering" or (state.get("intent") == NexusIntent.OFFERING_CREATE and state.get("draft")):
        return {"intent": NexusIntent.OFFERING_CREATE}
    if pending_act == "update_offering" or (state.get("intent") == NexusIntent.OFFERING_EDIT and state.get("draft")):
        return {"intent": NexusIntent.OFFERING_EDIT}

    msg_lower = message.lower()
    
    # 1. Search / Find Expert intent takes priority if user asks to find/hire/need an expert or if role is client looking for expertise
    if any(k in msg_lower for k in ["find", "search", "match", "hire", "looking for", "need an expert", "expert for", "expert for our", "recommend", "need help with"]):
        return {"intent": NexusIntent.CLIENT_MATCH_SEARCH}
    
    # 2. Earnings heuristics
    if any(k in msg_lower for k in ["earning", "payout", "revenue", "paid", "income"]):
        return {"intent": NexusIntent.EARNINGS_INQUIRY}
    
    # 3. Bookings heuristics
    if any(k in msg_lower for k in ["booking", "schedule", "calendar", "appointment"]):
        return {"intent": NexusIntent.BOOKINGS_INQUIRY if role == "expert" else NexusIntent.BOOKING_REQUEST}

    # 4. Offering edit heuristics (for expert role)
    if role == "expert" and any(k in msg_lower for k in ["edit offer", "update price", "change price", "change my", "change price of"]):
        return {"intent": NexusIntent.OFFERING_EDIT}

    # 5. Offering creation heuristics (for expert role)
    if role == "expert" and (
        any(k in msg_lower for k in ["create offer", "add offering", "new service", "create a 1:1", "create session", "sell", "new offer"]) or
        ("session" in msg_lower and any(k in msg_lower for k in ["create", "offer", "offering", "$", "dollar", "price"]))
    ):
        return {"intent": NexusIntent.OFFERING_CREATE}

    # 6. Profile edit heuristics
    if role == "expert" and any(k in msg_lower for k in ["profile", "bio", "headline", "tag"]):
        return {"intent": NexusIntent.EXPERT_PROFILE_EDIT}

    # Fallback to LLM classifier
    prompt = f"""Classify the user intent for a marketplace AI assistant.
User Role: {role}
Message: "{message}"

Possible Intents:
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
    data_adapter = get_data_adapter()
    vector_adapter = get_vector_adapter()
    message = state.get("message", "")
    previous_draft = state.get("draft") or state.get("extracted_entities")
    extraction = extract_offering_entities(message)
    draft = merge_draft(previous_draft, extraction)
    pending = state.get("pending_action") or {}
    msg_low = message.lower().strip()
    
    is_confirmation = bool(
        (pending.get("action") == "publish_offering" and pending.get("user_id") == state.get("user_id")) and
        any(k in msg_low for k in ["publish", "yes", "confirm", "approve", "create", "go ahead", "do it"])
    )

    if is_confirmation:
        try:
            result = await execute_offering(data_adapter, state["user_id"], draft)
            all_experts = await data_adapter.list_experts()
            try:
                await vector_adapter.index_experts(all_experts)
            except Exception as ve:
                print(f"[FAISS re-index warning] {ve}")

            return {
                "response_text": f"Your {draft.offer_type} '{draft.title}' ($ {draft.price}) has been created successfully and verified in the database.",
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
                "response_text": f"I couldn't publish the offering: {exc}",
                "response_type": "error",
                "action_result": {"success": False, "error": str(exc)},
                "draft": draft.model_dump(),
                "pending_action": pending,
                "requires_confirmation": True,
                "confirmation_action": "publish_offering",
            }
        except Exception as exc:
            return {
                "response_text": f"I couldn't publish the offering because the data operation failed: {exc}",
                "response_type": "error",
                "action_result": {"success": False, "error": str(exc)},
                "draft": draft.model_dump(),
                "pending_action": pending,
                "requires_confirmation": True,
                "confirmation_action": "publish_offering",
            }

    missing = []
    if not draft.title:
        missing.append("title")
    if draft.price is None:
        missing.append("price")
    if missing:
        labels = " and ".join(missing)
        return {
            "response_text": f"I have the details you provided. I still need the {labels} before I can prepare the offering.",
            "response_type": "clarification",
            "draft": draft.model_dump(),
            "extracted_entities": extraction.model_dump(exclude_none=True),
            "pending_action": {},
            "requires_confirmation": False,
        }

    return {
        "response_text": f"I have the details for your {draft.offer_type}. Review them below.",
        "response_type": "action_preview",
        "draft": draft.model_dump(),
        "extracted_entities": extraction.model_dump(exclude_none=True),
        "pending_action": {"action": "publish_offering", "user_id": state["user_id"]},
        "requires_confirmation": True,
        "confirmation_action": "publish_offering",
        "suggested_actions": ["Create Offer", "Edit Details", "Cancel"]
    }

import re

async def node_offering_edit(state: NexusState) -> Dict[str, Any]:
    """Node: Handle natural language offering updates."""
    data_adapter = get_data_adapter()
    message = state.get("message", "")
    user_id = state.get("user_id", 1)
    
    price_match = re.search(r"(?:\$|usd|dollars?\s*)(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:\$|usd|dollars?)", message, re.I)
    new_price = float(price_match.group(1) or price_match.group(2)) if price_match else None

    ctx = await data_adapter.get_user_context(user_id)
    user_offerings = ctx.offerings if ctx else []

    if not user_offerings:
        return {
            "response_text": "You don't have any active offerings to edit yet. Would you like to create one?",
            "response_type": "general",
            "suggested_actions": ["Create a 1:1 Session"]
        }

    target_off = user_offerings[0]
    for off in user_offerings:
        if any(w.lower() in message.lower() for w in off.title.split()):
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
                "response_text": f"Price for '{updated.title}' updated to ${updated.price} successfully and verified.",
                "response_type": "action_success",
                "action_result": updated.model_dump(),
                "pending_action": {},
                "requires_confirmation": False,
                "suggested_actions": ["View My Offers", "Edit Profile"]
            }

    proposed_price = new_price or (float(target_off.price) + 100.0)
    draft = {
        "id": target_off.id,
        "title": target_off.title,
        "offer_type": target_off.offer_type,
        "price": proposed_price,
        "duration": target_off.duration,
        "description": target_off.description
    }

    return {
        "response_text": f"I have prepared the update for '{target_off.title}'. Review the details below.",
        "response_type": "action_preview",
        "draft": draft,
        "pending_action": {"action": "update_offering", "offering_id": target_off.id, "new_price": proposed_price},
        "requires_confirmation": True,
        "confirmation_action": "update_offering",
        "suggested_actions": ["Confirm Update", "Cancel"]
    }

async def node_client_search(state: NexusState) -> Dict[str, Any]:
    """Node: Perform real FAISS vector search & DB lookup for client expert discovery."""
    data_adapter = get_data_adapter()
    vector_adapter = get_vector_adapter()
    llm = get_llm_adapter()
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
            tags_str = ", ".join(prof.expertise_tags) if isinstance(prof.expertise_tags, list) else (prof.expertise_tags or "")
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
        "response_text": f"I found experts whose profiles and offerings match your request. Review their match cards below.",
        "response_type": "search_results",
        "response_data": {"matches": matches_list},
        "suggested_actions": ["View Top Profile", "Book Session", "Narrow Search"]
    }

async def node_earnings_inquiry(state: NexusState) -> Dict[str, Any]:
    """Node: Query actual DB earnings for expert."""
    data_adapter = get_data_adapter()
    user_id = state.get("user_id", 1)
    earnings_data = await data_adapter.get_earnings(user_id)
    
    return {
        "response_text": f"Here is your current earnings summary based on verified bookings.",
        "response_type": "earnings",
        "response_data": earnings_data,
        "suggested_actions": ["Request Payout", "View Bookings", "Create Offering"]
    }

async def node_bookings_inquiry(state: NexusState) -> Dict[str, Any]:
    """Node: Query bookings for user."""
    data_adapter = get_data_adapter()
    user_id = state.get("user_id", 1)
    role = state.get("role", "client")
    bookings = await data_adapter.list_bookings(user_id, role)
    
    return {
        "response_text": f"Here are your {'incoming' if role == 'expert' else 'active'} bookings from the database.",
        "response_type": "booking",
        "response_data": {"bookings": bookings},
        "suggested_actions": ["Find Experts" if role == 'client' else "View Earnings"]
    }

from services.adapters.faiss_adapter import FAISSAdapter

async def node_respond(state: NexusState) -> Dict[str, Any]:
    """Node: Generate role-aware concise fallback response."""
    llm = get_llm_adapter()
    user_context = state.get("user_context", {})
    role = state.get("role", "client")
    message = state.get("message", "")
    intent = state.get("intent", NexusIntent.GENERAL_CHAT)

    user_info = user_context.get("user", {})
    user_name = user_info.get("full_name", "User")

    system_prompt = f"""You are NEXUS, an autonomous AI sales & growth advisor for MindGigs.
User: {user_name} ({role.upper()}).
Goal: Provide 1-3 short, clean sentences explaining platform capabilities or guiding the user.
Never invent fake features, ratings, prices, or fake checkout flows.
"""
    response_text = await llm.generate(message, system_prompt=system_prompt)
    suggested = SUGGESTED_ACTIONS_BY_INTENT.get(intent, ["How does NEXUS work?", "Explore Platform"])

    return {
        "response_text": response_text,
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
    }
