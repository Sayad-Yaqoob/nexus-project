# NEXUS — Agentic Sales Growth System for MindGigs

> **API-First. Portable by Design. Zero Local LLM Dependency.**  
> Second-Generation Agentic Marketplace Engine built for MindGigs.

---

## 🎯 1. Project Vision

NEXUS is a portable, API-first agentic sales growth engine built for **MindGigs** (a dual-sided marketplace where Experts sell digital services & Clients buy solutions). 

While generic chatbot wrappers fail because they lack personal context and structured output, NEXUS solves this by combining **Groq API high-speed LLMs**, **local FAISS vector embeddings**, and an **abstract Adapter Architecture** to deliver two primary workflows:

1. **Expert Studio**: Guided workspace that converts raw natural language descriptions into structured profile drafts, offering listings, file validation rules, and live preview cards published to Firestore.
2. **Client Match**: Interactive matching engine that converts client problem briefs into 3D FAISS vector embeddings, ranks top 3 expert matches via Groq reasoning, and presents interactive clarification pills for broad queries.

---

## ✨ 2. Features Matrix

| Feature | Description | Technology |
| :--- | :--- | :--- |
| **Groq API LLM Extraction** | Converts natural language expertise into structured headlines, bios, categories, and skill tags | `mixtral-8x7b-32768` |
| **Groq Reasoning Ranker** | Generates personalized high-impact match reasoning lines for top expert recommendations | `llama-3.3-70b-versatile` |
| **Local FAISS Vector Search** | Sub-millisecond vector similarity search over expert profiles & offerings | `faiss-cpu` + `all-MiniLM-L6-v2` |
| **File Validation Engine** | Enforces mandatory file attachments for Digital Products (PDF/ZIP/XLSX ≤ 50MB) & Books (PDF ≤ 80MB) | `file_handler.py` |
| **Client Clarification Loop** | Detects broad/ambiguous client queries and renders selectable inline clarification pills | FastAPI + React |
| **Portable Adapter Layer** | One `.env` line swaps Data, LLM, or Vector providers without touching business logic | Python Abstract Base Classes |
| **Graceful Degradation** | Automatically degrades to rule-based logic & template forms on 429 rate limits | Exponential Backoff (2s → 16s) |
| **MindGigs Design System** | Light off-white canvas (`#F8F9FA`), dark navy sidebar (`#0B1320`), mint green accents (`#00C49F`) | Next.js 16 + Tailwind CSS |
| **Draggable Floating Bubble** | Floating AI assistant button on non-NEXUS pages with position saved to `localStorage` | HTML5 Drag & Drop API |

---

## 🏗️ 3. Architecture Diagram

```
                 +-------------------------------------------------------+
                 |                   NEXUS FRONTEND                      |
                 |      Next.js 16 (Turbopack) + Tailwind CSS + Auth     |
                 |  - /nexus Workspace (Expert Studio | Client Match)    |
                 |  - Draggable Floating Bubble & MindGigs Sidebar Nav    |
                 +---------------------------+---------------------------+
                                             |
                                  REST API / JSON (Bearer ID Token)
                                             v
                 +-------------------------------------------------------+
                 |                    FASTAPI BACKEND                    |
                 |  - /api/v1/expert/generate-profile                    |
                 |  - /api/v1/expert/generate-offering & publish         |
                 |  - /api/v1/client/find-experts (FAISS + Reasoning)    |
                 |  - /api/v1/health & /api/v1/users/me                  |
                 +---------------------------+---------------------------+
                                             |
                          DEPENDENCY INJECTION ADAPTER LAYER
                                             |
       +-------------------------------------+-------------------------------------+
       |                                     |                                     |
       v                                     v                                     v
+---------------+                     +---------------+                     +---------------+
|  DataAdapter  |                     |  LLMAdapter   |                     | VectorAdapter |
+---------------+                     +---------------+                     +---------------+
| Firestore /   |                     | Groq API      |                     | FAISS-CPU +   |
| SQLite Local  |                     | (mixtral-8x7b |                     | sentence-     |
| Fallback      |                     |  llama-3.3)   |                     | transformers  |
+---------------+                     +---------------+                     +---------------+
```

---

## 🔌 4. Plug-and-Play Adapter Guide

NEXUS is designed for complete portability between developer environments and Aartec's production infrastructure. Every external service lives behind an Abstract Base Class in `nexus-backend/services/adapters/base.py`.

### Swapping Firebase Projects
To switch data persistence from your dev project to Aartec's production Firebase, simply update `.env`:

```env
# Change this in .env:
FIREBASE_PROJECT_ID=aartec-production-firebase-id
FIREBASE_CREDENTIALS_PATH=./production-firebase-credentials.json
```

**Zero code changes required.** If Firebase Admin credentials are not supplied, `FirestoreAdapter` automatically falls back to local SQLite execution (`sqlite+aiosqlite:///./nexus.db`).

### Swapping LLM Providers
To switch LLM execution from Groq to OpenAI or another provider in the future:
1. Implement `OpenAIAdapter(LLMAdapter)` inheriting from `services.adapters.base.LLMAdapter`.
2. Update `.env`: `LLM_PROVIDER=openai`.

---

## 🚀 5. Local Quickstart

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Groq API Key (Free tier at [console.groq.com](https://console.groq.com))

### 1. Clone & Configure Environment
```bash
cp .env.example .env
```

Set your `GROQ_API_KEY` in `.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 2. Run Backend (FastAPI)
```bash
cd nexus-backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
python main.py
```
Backend API will start at: `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

### 3. Run Frontend (Next.js)
```bash
cd nexus-frontend
npm install
npm run dev
```
Frontend App will start at: `http://localhost:3000` (Redirects to `/nexus`).

---

## 🐳 6. Docker Compose Orchestration

Run both frontend and backend in isolated containers with Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 📡 7. API Reference Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /api/v1/auth/verify` | `POST` | Verifies Firebase ID token or dev authentication session |
| `GET /api/v1/users/me` | `GET` | Returns active user profile context & personalized NEXUS greeting |
| `POST /api/v1/expert/generate-profile` | `POST` | Extracts structured profile draft from natural language expertise description |
| `POST /api/v1/expert/publish-profile` | `POST` | Saves structured profile to Firestore / DataAdapter & updates FAISS index |
| `POST /api/v1/expert/generate-offering` | `POST` | Parses natural language offering brief into structured properties with file rules |
| `POST /api/v1/expert/publish-offering` | `POST` | Validates file upload rules and publishes offering to Firestore |
| `POST /api/v1/expert/upload-file` | `POST` | Uploads digital product / book attachment placeholder |
| `POST /api/v1/client/find-experts` | `POST` | FAISS vector search + Groq reasoning ranker (returns matches or clarification pills) |
| `GET /api/v1/health` | `GET` | Operational health check returning status of DataAdapter, Groq API, and FAISS index count |

---

## 🔒 8. Security & License

- Built for **Aartec / MindGigs.com**.
- Zero API keys or service credentials committed to repository.
