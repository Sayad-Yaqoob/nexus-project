# mindGigs — Powered by NEXUS

> **An Agentic Marketplace Engine that saves experts' precious time while instantly connecting clients to the right practitioner.**

---

## The Problem We're Solving

**Expert time is the scarcest resource in the knowledge economy.**

Today, a top consultant wastes 30–40% of their billable hours on the wrong conversations: unqualified leads, repeated onboarding questions, and manual back-and-forth to determine whether they're even the right fit for a client's problem. Meanwhile, clients spend days browsing generic directories, emailing strangers, and hoping the profile photo and a wall of text translates into real expertise.

**mindGigs changes this on both sides of the marketplace.**

- **For Experts**: NEXUS operates as an intelligent assistant embedded in their workspace. It understands natural language requests to create offerings, manage bookings, and update profiles — eliminating the need to navigate complex dashboards. Experts spend time delivering value, not managing tools.

- **For Clients**: NEXUS performs semantic vector search against verified expert profiles. Instead of keyword matching, it understands the actual problem the client is trying to solve, ranks experts by relevance, and explains *why* each expert is the right fit — in one sentence.

---

## What Is NEXUS?

**NEXUS** is the agentic operating layer embedded inside mindGigs. It is not a chatbot bolted on top of a form. It is the primary interface for platform operations — a state-aware agent that:

1. **Understands intent** — Classifies free-form text into precise operational actions (create offering, search experts, view earnings, navigate to screen, etc.)
2. **Executes against real data** — Every action results in a verified SQLite database write, not a simulated response
3. **Enforces authorization** — Role-based permissions are enforced on the backend; a client account physically cannot invoke expert-only operations
4. **Maintains conversation context** — Session state is persisted across turns, enabling multi-turn confirmation flows

```
┌─────────────────────────────────────────────────────────┐
│                        mindGigs                         │
│  ┌────────────────┐          ┌────────────────────────┐ │
│  │   Client Side  │          │     Expert Side        │ │
│  │                │          │                        │ │
│  │  "Find me an   │  NEXUS   │  "Create a 1:1 session │ │
│  │  AI expert for │◄────────►│  for $300 on LLM       │ │
│  │  RAG systems"  │  Agent   │  architecture"         │ │
│  │                │  Layer   │                        │ │
│  │  → Semantic    │          │  → Intent classified   │ │
│  │    vector      │          │  → Draft shown for     │ │
│  │    search      │          │    confirmation        │ │
│  │  → Ranked      │          │  → DB write verified   │ │
│  │    matches     │          │  → FAISS re-indexed    │ │
│  │  → LLM why     │          │                        │ │
│  └────────────────┘          └────────────────────────┘ │
│                                                         │
│            SQLite Database ← FAISS Vector Index         │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

### Backend — `nexus-backend/`

| Component | Technology | Role |
| :--- | :--- | :--- |
| **API Layer** | FastAPI + Pydantic v2 | REST endpoints, auth, authorization |
| **Agent Graph** | LangGraph | Stateful multi-node execution DAG |
| **Intent Classifier** | Groq LLM (fast model) | Free-text → enum intent with role/screen context |
| **Entity Extractor** | Regex + domain heuristics | Price, duration, offer type, topic extraction |
| **Vector Search** | FAISS-CPU + `all-MiniLM-L6-v2` | Semantic expert-client matching |
| **LLM Reasoning** | Groq LLM (reasoning model) | Per-match "why this expert" explanation |
| **Persistence** | SQLite via SQLAlchemy async | Users, experts, offerings, bookings, sessions |

**Agent Graph nodes** (executed in order per request):
1. `node_load_context` — Load user profile, role, and offerings from DB
2. `node_classify_intent` — Deterministic rule + LLM fallback classification
3. Route to specialized node: `node_offering_create`, `node_client_search`, `node_bookings_inquiry`, `node_earnings_inquiry`, `node_navigation`, or `node_respond`
4. `node_persist_session` — Persist conversation history and state for next turn

### Frontend — `nexus-frontend/`

| Component | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript + React 19 |
| **Styling** | Tailwind CSS |
| **State** | React hooks + context |

**Key flows:**
- `/login` — Persona selection (Client vs Expert) with explicit authentication
- `/nexus` — Main chat interface; perspective-aware (sidebar toggle)
- `/experts` — Marketplace browse with live backend data + fallback
- `/my-bookings`, `/sell/offers`, `/account/general` — Role-gated screens

---

## Tech Stack

```
Backend:  Python 3.10+, FastAPI, LangGraph, Groq API, FAISS-CPU,
          sentence-transformers, SQLAlchemy, aiosqlite, Pydantic v2

Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide Icons

Database: SQLite (portable, zero-config, file-based: nexus.db)
LLM:      Groq API (free tier sufficient — 2 models: fast + reasoning)
Vectors:  FAISS in-memory with sentence-transformers (all-MiniLM-L6-v2)
```

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Groq API Key → Free at [console.groq.com](https://console.groq.com)

### 1. Configure Environment Variables

```bash
# At repo root, copy and fill in the .env:
cp .env.example .env
```

Edit `.env` and set:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> The `.env` file at repo root is read by the backend. The frontend uses `NEXT_PUBLIC_API_URL` (set to `http://localhost:8000` by default in `nexus-frontend/.env.example`).

### 2. Start the Backend

```bash
cd nexus-backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

python main.py
```

Backend starts at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

> On first start, `main.py` automatically runs database migrations, seeds 30 diverse expert profiles across 6 domains, and builds the FAISS vector index.

### 3. Start the Frontend

```bash
cd nexus-frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

### 4. Try the Platform

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **Find an Expert** → Login page → Select **Client** persona → Enter
3. Chat: *"I need an expert to help me launch a SaaS product"*
4. NEXUS returns semantically ranked expert matches with match scores and reasoning
5. Log out → Try **Become an Expert** → Login as expert → Create a 1:1 session offering

---

## API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/mimic` | POST | None | Dev demo: get JWT token for a `client` or `expert` persona |
| `/api/v1/users/me` | GET | JWT | Fetch authenticated user profile and role |
| `/api/v1/agent/chat` | POST | JWT | **Main NEXUS agent endpoint** — natural language input → structured response |
| `/api/v1/experts` | GET | None | List marketplace experts (filterable by category) |
| `/api/v1/offerings` | GET | JWT | List current user's offerings |
| `/api/v1/offerings/{id}` | PUT | JWT (Expert) | Update offering — authorization enforced |
| `/api/v1/offerings/{id}` | DELETE | JWT (Expert) | Delete offering — authorization enforced |
| `/api/v1/bookings` | GET | JWT | My Bookings (client) or Incoming Bookings (expert) |
| `/api/v1/bookings` | POST | JWT | Create a booking |
| `/api/v1/earnings` | GET | JWT (Expert) | Expert earnings summary — authorization enforced |
| `/api/v1/health` | GET | None | System status: DB, LLM, FAISS index count |

**Agent Chat Request:**
```json
{
  "message": "Create a 1:1 session for $300 on LLM architecture",
  "session_id": "optional-for-continuation",
  "agent_context": {
    "route": "/sell/offers",
    "screen": "offers_manager",
    "perspective": "expert"
  }
}
```

**Agent Chat Response:**
```json
{
  "response": "I've prepared your 1:1 Session offering. Review the details below.",
  "response_type": "action_preview",
  "draft": { "title": "...", "price": 300.0, "offer_type": "1:1 Session" },
  "requires_confirmation": true,
  "session_id": "nexus_sess_abc123"
}
```

---

## Test Suite

```bash
cd nexus-backend
venv\Scripts\python -m pytest tests/ -v
```

**Golden Path tests cover:**
- Expert offer creation → confirmation → DB verification
- Client semantic search → booking → earnings
- State contamination regression (draft isolation across turns)
- Subscription / Book / Digital Product type resolution
- Navigation intent handling
- Authorization enforcement (client blocked from expert operations)

---

## Project Structure

```
nexus-project/
├── nexus-backend/
│   ├── agent/              # LangGraph nodes, state, intent, offering logic
│   │   ├── graph.py        # Compiled NexusGraph DAG
│   │   ├── nodes.py        # All agent processing nodes
│   │   ├── intents.py      # NexusIntent enum + suggested actions
│   │   ├── offering.py     # Offering entity extraction + execution
│   │   ├── service.py      # AgentService — session + graph orchestration
│   │   └── state.py        # NexusState TypedDict
│   ├── api/                # FastAPI route handlers
│   │   ├── agent.py        # /agent/chat endpoint
│   │   ├── auth.py         # /auth/mimic, /auth/me
│   │   ├── expert.py       # Expert Studio endpoints
│   │   ├── shared.py       # Offerings, bookings, earnings, experts
│   │   └── deps.py         # JWT auth dependency
│   ├── services/
│   │   └── adapters/       # DataAdapter, LLMAdapter, VectorAdapter + implementations
│   ├── database/           # SQLAlchemy models + connection + migrations
│   ├── tests/              # Pytest golden path + regression tests
│   ├── main.py             # FastAPI app + startup seeding
│   └── requirements.txt
├── nexus-frontend/
│   ├── app/                # Next.js App Router pages
│   │   ├── login/          # Persona selection + authentication
│   │   ├── nexus/          # Main NEXUS chat interface
│   │   ├── experts/        # Expert marketplace browse
│   │   └── ...             # Bookings, offers, account pages
│   ├── components/         # Reusable UI components
│   └── data/               # Fallback expert data (JSON)
├── docker-compose.yml      # Docker Compose for containerized deployment
├── .env.example            # Environment variable template
└── README.md
```

---

## Deployment

### Docker Compose (Recommended)

```bash
cp .env.example .env
# Set GROQ_API_KEY in .env
docker-compose up --build
```

Services:
- `nexus-backend` → port 8000
- `nexus-frontend` → port 3000

---

## Security

- JWT tokens signed with `SECRET_KEY` (set in `.env`)
- Role-based authorization enforced at API layer (`deps.py`) — not just frontend gating
- No credentials committed to source control — all secrets in `.env` (gitignored)
- Groq API key is the only external dependency

---

*Built for [mindGigs](https://mindgigs.com) — where expert time is the product.*
