from services.adapters.base import DataAdapter, LLMAdapter, VectorAdapter, User, ExpertProfile, Offering
from services.adapters.firestore_adapter import FirestoreAdapter
from services.adapters.groq_adapter import GroqAdapter
from services.adapters.faiss_adapter import FAISSAdapter

_data_adapter = FirestoreAdapter()
_llm_adapter = GroqAdapter()
_vector_adapter = FAISSAdapter()

def get_data_adapter() -> DataAdapter:
    return _data_adapter

def get_llm_adapter() -> LLMAdapter:
    return _llm_adapter

def get_vector_adapter() -> VectorAdapter:
    return _vector_adapter

__all__ = [
    "DataAdapter", "LLMAdapter", "VectorAdapter",
    "User", "ExpertProfile", "Offering",
    "FirestoreAdapter", "GroqAdapter", "FAISSAdapter",
    "get_data_adapter", "get_llm_adapter", "get_vector_adapter"
]
