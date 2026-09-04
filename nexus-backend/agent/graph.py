from langgraph.graph import StateGraph, START, END

from agent.state import NexusState
from agent.nodes import (
    node_load_context,
    node_classify_intent,
    node_respond,
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
    workflow.add_node("persist_session", node_persist_session)

    # Define execution pipeline
    workflow.add_edge(START, "load_context")
    workflow.add_edge("load_context", "classify_intent")
    workflow.add_edge("classify_intent", "respond")
    workflow.add_edge("respond", "persist_session")
    workflow.add_edge("persist_session", END)

    return workflow.compile()

nexus_graph = build_nexus_graph()
