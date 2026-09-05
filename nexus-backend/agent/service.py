import uuid
from typing import Optional, Dict, Any

from agent.graph import nexus_graph
from services.adapters import get_data_adapter

class AgentService:
    """
    Service wrapper for invoking the compiled NexusGraph.
    Manages session loading, graph execution, and response formatting.
    """

    @staticmethod
    async def process_message(
        user_id: int,
        message: str,
        session_id: Optional[str] = None,
        agent_context: Optional[Dict[str, Any]] = None,
        current_route: Optional[str] = None,
        current_perspective: Optional[str] = None
    ) -> Dict[str, Any]:
        data_adapter = get_data_adapter()
        
        # 1. Resolve session_id
        if not session_id:
            session_id = f"nexus_sess_{uuid.uuid4().hex[:12]}"

        # 2. Load existing session history if available
        existing_history = []
        saved_session = await data_adapter.get_session(session_id)
        if saved_session:
            existing_history = saved_session.get("conversation_history", [])
            saved_state = saved_session.get("state_json", {})
        else:
            saved_state = {}

        # 3. Construct initial state for graph
        user = await data_adapter.get_user_by_id(user_id)
        role = user.role if user else "client"

        # Check perspective override from agent_context or parameter
        perspective = current_perspective
        if not perspective and agent_context:
            perspective = agent_context.get("perspective")
        if not perspective:
            perspective = role

        route = current_route
        if not route and agent_context:
            route = agent_context.get("route")

        # Check if user message is an explicit continuation of a pending task
        pending_act = saved_state.get("pending_action", {}).get("action")
        msg_low = message.lower().strip()
        is_continuing = bool(
            pending_act and any(k in msg_low for k in ["confirm", "yes", "publish", "do it", "approve", "cancel", "go ahead", "do that"])
        )

        initial_state = {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "message": message,
            "conversation_history": existing_history,
            "agent_context": agent_context or {},
            "current_route": route,
            "current_perspective": perspective
        }

        if is_continuing:
            initial_state.update({
                key: saved_state[key]
                for key in ("intent", "extracted_entities", "draft", "pending_action", "requires_confirmation", "confirmation_action")
                if key in saved_state
            })

        # 4. Invoke graph execution
        final_state = await nexus_graph.ainvoke(initial_state)

        # 5. Format return payload
        return {
            "response": final_state.get("response_text", "How else can I assist you today?"),
            "response_type": final_state.get("response_type", "message"),
            "session_id": session_id,
            "intent": final_state.get("intent", "general_chat"),
            "role": final_state.get("role", role),
            "suggested_actions": final_state.get("suggested_actions", []),
            "draft": final_state.get("draft"),
            "action_result": final_state.get("action_result"),
            "requires_confirmation": final_state.get("requires_confirmation", False),
            "confirmation": {
                "action": final_state.get("confirmation_action")
            } if final_state.get("requires_confirmation") else None,
            "response_data": final_state.get("response_data"),
            "navigation": final_state.get("navigation_action"),
            "conversation_history": final_state.get("conversation_history", [])
        }
