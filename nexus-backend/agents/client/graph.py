from typing import Dict, Any, TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from agents.client.nodes import (
    node_client_ingest,
    node_client_extract,
    node_client_ambiguity_detect,
    node_client_ask_questions,
    node_client_category_filter,
    node_client_semantic_match,
    node_client_rank,
    node_client_present
)

class ClientGraphState(TypedDict, total=False):
    session_id: int
    raw_problem: str
    user_id: Optional[int]
    history: List[dict]
    brief: Optional[dict]
    confidence_score: float
    questions: List[str]
    candidate_expert_ids: List[int]
    top_10_expert_ids: List[int]
    similarity_map: Dict[int, float]
    top_3_matches: Optional[dict]
    status: str

def route_client_confidence(state: ClientGraphState) -> str:
    """Route graph based on RequirementBrief confidence score."""
    confidence = state.get("confidence_score", 1.0)
    if confidence < 0.7:
        return "ask_questions"
    return "category_filter"

def build_client_graph() -> StateGraph:
    """Build and compile the Client Matching LangGraph."""
    workflow = StateGraph(ClientGraphState)

    # Add nodes
    workflow.add_node("ingest", node_client_ingest)
    workflow.add_node("extract", node_client_extract)
    workflow.add_node("ambiguity_detect", node_client_ambiguity_detect)
    workflow.add_node("ask_questions", node_client_ask_questions)
    workflow.add_node("category_filter", node_client_category_filter)
    workflow.add_node("semantic_match", node_client_semantic_match)
    workflow.add_node("rank", node_client_rank)
    workflow.add_node("present", node_client_present)

    # Add edges
    workflow.set_entry_point("ingest")
    workflow.add_edge("ingest", "extract")
    workflow.add_edge("extract", "ambiguity_detect")

    workflow.add_conditional_edges(
        "ambiguity_detect",
        route_client_confidence,
        {
            "ask_questions": "ask_questions",
            "category_filter": "category_filter"
        }
    )

    workflow.add_edge("ask_questions", END)
    workflow.add_edge("category_filter", "semantic_match")
    workflow.add_edge("semantic_match", "rank")
    workflow.add_edge("rank", "present")
    workflow.add_edge("present", END)

    return workflow.compile()

client_graph = build_client_graph()
