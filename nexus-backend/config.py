import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXUS Agentic API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexus.db"
    
    # Groq API Configuration
    GROQ_API_KEY: str = ""
    # Current Groq models for structured extraction and deep reasoning
    GROQ_FAST_MODEL: str = "openai/gpt-oss-20b"
    GROQ_PREMIUM_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FALLBACK_FAST_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FALLBACK_PREMIUM_MODEL: str = "openai/gpt-oss-20b"
    
    # Embedding & Vector Search
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    
    # JWT / Security
    SECRET_KEY: str = "nexus_mindgigs_super_secret_key_2026_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
