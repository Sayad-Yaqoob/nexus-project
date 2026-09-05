from langgraph.graph import StateGraph, START, END

from agent.state import NexusState
from agent.nodes import (
    node_load_context,
    node_classify_intent,
    node_respond,
    node_offering_create,
    node_persist_session
)

def build_nexus_graph():
    """
    Build and compile the unified NexusGraph for the NEXUS agent.
    """
    workflow = StateGraph(NexusState)

    # Add nodes
    workflow.add_node("load_context", node_load_context)
    workflow.add_node("classify_intent", node_classify_intent)
    workflow.add_node("respond", node_respond)
    workflow.add_node("offering_create", node_offering_create)
    workflow.add_node("persist_session", node_persist_session)

    # Define execution pipeline
    workflow.add_edge(START, "load_context")
    workflow.add_edge("load_context", "classify_intent")
    workflow.add_conditional_edges(
        "classify_intent",
        lambda state: "offering_create" if state.get("intent") == "offering_create" else "respond",
        {"offering_create": "offering_create", "respond": "respond"},
    )
    workflow.add_edge("offering_create", "persist_session")
    workflow.add_edge("respond", "persist_session")
    workflow.add_edge("persist_session", END)

    return workflow.compile()

nexus_graph = build_nexus_graph()
