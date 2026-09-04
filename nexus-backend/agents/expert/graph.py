from typing import Dict, Any, TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from agents.expert.nodes import (
    node_ingest,
    node_load_ctx,
    node_extract,
    node_ambiguity_detect,
    node_ask_questions,
    node_validate_files,
    node_preview,
    node_save_db
)

class ExpertGraphState(TypedDict, total=False):
    user_id: int
    raw_description: str
    existing_profile: Optional[dict]
    draft: Optional[dict]
    confidence_score: float
    missing_fields: List[str]
    questions: List[str]
    needs_file_upload: bool
    file_validation_error: Optional[str]
    preview_card: Optional[dict]
    draft_id: str
    approved: bool
    status: str

def route_confidence(state: ExpertGraphState) -> str:
    """Route graph based on ambiguity check confidence score."""
    confidence = state.get("confidence_score", 1.0)
    if confidence < 0.7:
        return "ask_questions"
    return "validate_files"

def build_expert_graph() -> StateGraph:
    """Build and compile the Expert Onboarding LangGraph."""
    workflow = StateGraph(ExpertGraphState)

    # Add nodes
    workflow.add_node("ingest", node_ingest)
    workflow.add_node("load_ctx", node_load_ctx)
    workflow.add_node("extract", node_extract)
    workflow.add_node("ambiguity_detect", node_ambiguity_detect)
    workflow.add_node("ask_questions", node_ask_questions)
    workflow.add_node("validate_files", node_validate_files)
    workflow.add_node("preview", node_preview)
    workflow.add_node("save_db", node_save_db)

    # Add edges
    workflow.set_entry_point("ingest")
    workflow.add_edge("ingest", "load_ctx")
    workflow.add_edge("load_ctx", "extract")
    workflow.add_edge("extract", "ambiguity_detect")

    workflow.add_conditional_edges(
        "ambiguity_detect",
        route_confidence,
        {
            "ask_questions": "ask_questions",
            "validate_files": "validate_files"
        }
    )

    workflow.add_edge("ask_questions", END)
    workflow.add_edge("validate_files", "preview")
    workflow.add_edge("preview", END)
    workflow.add_edge("save_db", END)

    return workflow.compile()

expert_graph = build_expert_graph()
