from langgraph.graph import StateGraph, START, END

from agent.state import NexusState
from agent.intents import NexusIntent
from agent.nodes import (
    node_load_context,
    node_classify_intent,
    node_respond,
    node_offering_create,
    node_offering_edit,
    node_expert_profile_create,
    node_client_search,
    node_earnings_inquiry,
    node_bookings_inquiry,
    node_navigation,
    node_persist_session
)

def route_by_intent(state: NexusState) -> str:
    intent = state.get("intent")
    if intent in [NexusIntent.EXPERT_PROFILE_CREATE, NexusIntent.EXPERT_PROFILE_EDIT]:
        return "expert_profile"
    elif intent == NexusIntent.OFFERING_CREATE:
        return "offering_create"
    elif intent == NexusIntent.OFFERING_EDIT:
        return "offering_edit"
    elif intent in [NexusIntent.CLIENT_MATCH_SEARCH, NexusIntent.EXPERT_DISCOVERY]:
        return "client_search"
    elif intent == NexusIntent.EARNINGS_INQUIRY:
        return "earnings_inquiry"
    elif intent in [NexusIntent.BOOKINGS_INQUIRY, NexusIntent.BOOKING_REQUEST]:
        return "bookings_inquiry"
    elif intent == "navigation":
        return "navigation"
    return "respond"

def build_nexus_graph():
    """
    Build and compile the unified NexusGraph for the NEXUS agent.
    """
    workflow = StateGraph(NexusState)

    # Add nodes
    workflow.add_node("load_context", node_load_context)
    workflow.add_node("classify_intent", node_classify_intent)
    workflow.add_node("expert_profile", node_expert_profile_create)
    workflow.add_node("offering_create", node_offering_create)
    workflow.add_node("offering_edit", node_offering_edit)
    workflow.add_node("client_search", node_client_search)
    workflow.add_node("earnings_inquiry", node_earnings_inquiry)
    workflow.add_node("bookings_inquiry", node_bookings_inquiry)
    workflow.add_node("navigation", node_navigation)
    workflow.add_node("respond", node_respond)
    workflow.add_node("persist_session", node_persist_session)

    # Define execution pipeline
    workflow.add_edge(START, "load_context")
    workflow.add_edge("load_context", "classify_intent")
    workflow.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "expert_profile": "expert_profile",
            "offering_create": "offering_create",
            "offering_edit": "offering_edit",
            "client_search": "client_search",
            "earnings_inquiry": "earnings_inquiry",
            "bookings_inquiry": "bookings_inquiry",
            "navigation": "navigation",
            "respond": "respond",
        },
    )
    workflow.add_edge("expert_profile", "persist_session")
    workflow.add_edge("offering_create", "persist_session")
    workflow.add_edge("offering_edit", "persist_session")
    workflow.add_edge("client_search", "persist_session")
    workflow.add_edge("earnings_inquiry", "persist_session")
    workflow.add_edge("bookings_inquiry", "persist_session")
    workflow.add_edge("navigation", "persist_session")
    workflow.add_edge("respond", "persist_session")
    workflow.add_edge("persist_session", END)


    return workflow.compile()

nexus_graph = build_nexus_graph()
