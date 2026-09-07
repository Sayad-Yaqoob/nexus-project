from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config import settings
from database.connection import init_db
from database.seed import seed_database
from services.adapters import get_data_adapter, get_vector_adapter
from api.shared import router as shared_router
from api.auth import router as auth_router
from api.agent import router as agent_router
from api.expert import router as expert_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan event: startup initialization and cleanup."""
    print("=" * 60)
    print(f"[STARTUP] Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print("=" * 60)
    
    # 1. Initialize DB tables
    await init_db()
    
    # 2. Seed database with mock experts and clients
    await seed_database()
    
    # 3. Index expert profiles into FAISS vector store via VectorAdapter
    try:
        data_adapter = get_data_adapter()
        vector_adapter = get_vector_adapter()
        all_experts = await data_adapter.list_experts()
        await vector_adapter.index_experts(all_experts)
    except Exception as e:
        print(f"[FAISS WARNING] Vector index initialization warning: {e}")

    print("[SUCCESS] System Ready! FastAPI + Groq + LangGraph + FAISS online.")
    yield
    print("[SHUTDOWN] Shutting down NEXUS API server.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS for local Next.js frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for file placeholders
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API routers
app.include_router(shared_router, prefix=settings.API_V1_STR, tags=["Shared"])
app.include_router(auth_router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(agent_router, prefix=settings.API_V1_STR, tags=["NEXUS Agent"])
app.include_router(expert_router, prefix=settings.API_V1_STR, tags=["Expert"])

@app.get("/")
async def root():
    return {
        "message": "NEXUS Agentic Sales Growth Marketplace API",
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
