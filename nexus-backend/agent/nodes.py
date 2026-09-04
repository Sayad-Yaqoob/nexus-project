import json
from typing import Dict, Any, List

from agent.state import NexusState
from agent.intents import NexusIntent, INTENT_DESCRIPTIONS, SUGGESTED_ACTIONS_BY_INTENT
from services.adapters import get_data_adapter, get_llm_adapter, get_vector_adapter

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
    
    # Simple rule-based heuristics to ensure high classification speed & accuracy
    msg_lower = message.lower()
    if any(k in msg_lower for k in ["earning", "payout", "revenue", "paid", "income"]):
        intent = NexusIntent.EARNINGS_INQUIRY
    elif any(k in msg_lower for k in ["booking", "schedule", "calendar", "appointment"]):
        intent = NexusIntent.BOOKINGS_INQUIRY if role == "expert" else NexusIntent.BOOKING_REQUEST
    elif any(k in msg_lower for k in ["create offer", "add offering", "new service", "new product", "add course"]):
        intent = NexusIntent.OFFERING_CREATE
    elif any(k in msg_lower for k in ["edit offer", "update price", "change price"]):
        intent = NexusIntent.OFFERING_EDIT
    elif any(k in msg_lower for k in ["profile", "bio", "headline", "tag"]):
        intent = NexusIntent.EXPERT_PROFILE_EDIT if role == "expert" else NexusIntent.GENERAL_CHAT
    elif any(k in msg_lower for k in ["find", "search", "match", "hire", "looking for", "need an expert", "recommend"]):
        intent = NexusIntent.CLIENT_MATCH_SEARCH
    else:
        # LLM classifier fallback
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

async def node_respond(state: NexusState) -> Dict[str, Any]:
    """Node: Generate role-aware, highly contextual response."""
    llm = get_llm_adapter()
    data_adapter = get_data_adapter()
    
    user_context = state.get("user_context", {})
    role = state.get("role", "client")
    message = state.get("message", "")
    intent = state.get("intent", NexusIntent.GENERAL_CHAT)
    history = state.get("conversation_history", [])

    user_info = user_context.get("user", {})
    user_name = user_info.get("full_name", "User")
    
    # If client is asking for expert matches, fetch top experts from database
    expert_matches_context = ""
    if role == "client" and intent in [NexusIntent.CLIENT_MATCH_SEARCH, NexusIntent.EXPERT_DISCOVERY]:
        experts = await data_adapter.list_experts()
        if experts:
            matched_lines = []
            for exp in experts[:5]:
                tags_str = ", ".join(exp.expertise_tags) if isinstance(exp.expertise_tags, list) else exp.expertise_tags
                off_desc = f"{len(exp.offerings)} offerings" if exp.offerings else "Consulting"
                matched_lines.append(f"- **{exp.full_name}** ({exp.category}): {exp.professional_headline}. Tags: [{tags_str}]. Offerings: {off_desc}.")
            expert_matches_context = "\nAvailable Seeded Experts in System:\n" + "\n".join(matched_lines)

    system_prompt = f"""You are NEXUS, an autonomous AI sales & growth advisor for MindGigs.
You are interacting with an authenticated user with the following profile:
- Name: {user_name}
- Role: {role.upper()}
- Currency: {user_info.get('currency', 'USD')}
{f"- Professional Headline: {user_context.get('expert_profile', {}).get('professional_headline', 'Specialist')}" if role == 'expert' and user_context.get('expert_profile') else ""}
{f"- Active Offerings: {len(user_context.get('offerings', []))} offerings listed" if role == 'expert' else ""}

Your Goals:
1. Provide personalized, role-aware assistance.
2. If the user is an EXPERT: help them optimize profile, design high-converting offerings (1:1 sessions, digital products, subscriptions), view earnings, and maximize revenue.
3. If the user is a CLIENT: help them find the perfect verified experts, evaluate offerings, and navigate booking sessions or purchasing digital assets.
4. Keep answers clear, structured, and actionable. Do not use generic filler.
{expert_matches_context}
"""

    history_str = ""
    if history:
        recent = history[-6:]
        history_str = "Recent Conversation:\n" + "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in recent]) + "\n\n"

    user_prompt = f"{history_str}Current Intent: {intent}\nUser Message: {message}"

    response_text = await llm.generate(user_prompt, system_prompt=system_prompt)
    suggested = SUGGESTED_ACTIONS_BY_INTENT.get(intent, ["How does NEXUS work?", "Explore Platform"])

    return {
        "response_text": response_text,
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

    if session_id and user_id:
        state_to_save = {
            "intent": state.get("intent"),
            "role": state.get("role"),
            "suggested_actions": state.get("suggested_actions", [])
        }
        await data_adapter.save_session(session_id, user_id, history, state_to_save)

    return {"conversation_history": history}
