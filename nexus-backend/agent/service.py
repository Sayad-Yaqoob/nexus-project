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
        session_id: Optional[str] = None
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

        # 3. Construct initial state for graph
        user = await data_adapter.get_user_by_id(user_id)
        role = user.role if user else "client"

        initial_state = {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "message": message,
            "conversation_history": existing_history
        }

        # 4. Invoke graph execution
        final_state = await nexus_graph.ainvoke(initial_state)

        # 5. Format return payload
        return {
            "response": final_state.get("response_text", "How else can I assist you today?"),
            "session_id": session_id,
            "intent": final_state.get("intent", "general_chat"),
            "role": final_state.get("role", role),
            "suggested_actions": final_state.get("suggested_actions", []),
            "conversation_history": final_state.get("conversation_history", [])
        }
