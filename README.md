# mindGigs — Powered by NEXUS

> **The Intelligent Marketplace for On-Demand Expertise & Agentic Operations.**  
> Second-Generation Agentic Marketplace Engine built for **mindGigs**.

---

## 🎯 1. Product Identity & Vision

**mindGigs** is a dual-sided expertise marketplace where specialists sell advisory services, courses, subscriptions, and digital products, while clients discover solutions for technical and strategic challenges.

**NEXUS** is the agentic operating layer embedded inside mindGigs. Rather than acting as a generic chatbot, NEXUS operates over real application context:
- **Natural language for intent.**
- **Structured UI for precision.**
- **Real application state for truth.**

```text
                    mindGigs
                       │
             ┌─────────┴─────────┐
             │                   │
        Marketplace          NEXUS
             │                   │
     Clients + Experts     Intelligent Agentic OS
             │                   │
             └─────────┬─────────┘
                       │
              Real SQLite Backend
```

---

## 🏗️ 2. Core Architecture & Agentic OS

NEXUS operates as an explicit Agentic Operating System built around:

1. **`AgentContext`**: A structured context object passed on every request tracking authenticated user identity, account capabilities, current perspective (Client vs Expert), current route/screen, and selected entity.
2. **`CapabilityRegistry`**: 22 registered application operations (`create_1_to_1`, `create_subscription`, `create_book`, `create_digital_product`, `create_custom_offering`, `create_highlight`, `update_offering`, `delete_offering`, `search_experts`, `create_booking`, `get_my_bookings`, `get_incoming_bookings`, `get_earnings`, `navigate_to_screen`, `update_availability`, etc.).
3. **`TaskStateMachine`**: Explicit task lifecycle (`IDLE` -> `UNDERSTANDING` -> `COLLECTING_INFO` -> `PREVIEW_SHOWN` -> `AWAITING_CONFIRMATION` -> `EXECUTING` -> `VERIFYING` -> `COMPLETED`). Ensures completed tasks reset active task state so future prompts start fresh without stale contamination.
4. **Backend Authorization Matrix**: Permissions are enforced on the backend (`deps.py` & `nodes.py`). Client accounts cannot create/edit offerings or access expert earnings, receiving polite permission responses.
5. **Verified Writes**: Persistent operations execute real SQLite database operations (`nexus.db`), read back the record, and verify state before returning `action_success`.

---

## 📦 3. Features & Offering Workflows

| Offering Type | Mapped Capabilities & Fields | Verification & Delivery |
| :--- | :--- | :--- |
| **1:1 Session** | Title, description, price, duration, weekly schedule, timezone | Real DB write + calendar slot availability |
| **Subscription** | Plan title, monthly price, description, included benefits (list), active toggle | Real DB write + subscription manager refresh |
| **Book** | Cover images, title, author, tagline, price, overview, Buy Now (PDF <= 80MB), Amazon Link, Custom Link | Real DB write + file upload validation |
| **Digital Product** | Title, price, description, file upload (PDF/ZIP/XLSX/PPTX <= 50MB) or external link | Real DB write + file attachment rule |
| **Custom Offering** | Title, price, description, CTA options | Real DB write + custom service quote |
| **Highlight** | Title, image URL, link URL, listed status | Real DB write + profile highlight card |

---

## 🔌 4. Tech Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy, SQLite (`aiosqlite`), LangGraph, Groq LLM API, FAISS CPU vector index, `sentence-transformers` (`all-MiniLM-L6-v2`).
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.

---

## 🚀 5. Local Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Groq API Key (Free at [console.groq.com](https://console.groq.com))

### 1. Configure Environment
```bash
cp .env.example .env
```
Set your `GROQ_API_KEY` in `.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 2. Run FastAPI Backend
```bash
cd nexus-backend
python -m venv venv
# On Windows PowerShell:
venv\Scripts\activate

pip install -r requirements.txt
python main.py
```
Backend API starts at `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 3. Run Next.js Frontend
```bash
cd nexus-frontend
npm install
npm run dev
```
Frontend App starts at `http://localhost:3000`.

---

## 🧪 6. Test Suite & Verification

### Run Backend Pytest Suite
```bash
cd nexus-backend
venv\Scripts\python -m pytest -o pythonpath=. tests/test_golden_paths.py
```
*Executes all 6 test suites covering Golden Path A (1:1), B (Subscription), C (Book), D (Client Search), E (Booking), F (Edit), G (Navigation), Authorization Restrictions, and State Contamination Regression.*

### Run Frontend Static Build Check
```bash
cd nexus-frontend
npm.cmd run build
```
*Verifies Next.js production compilation and TypeScript type checking.*

---

## 📡 7. Main API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /api/v1/auth/mimic` | `POST` | Authenticate dev demo persona (`client` or `expert`) |
| `GET /api/v1/users/me` | `GET` | Fetch authenticated user profile & capabilities |
| `POST /api/v1/agent/chat` | `POST` | Unified NEXUS Agent Chat endpoint (with `current_route` & `current_perspective`) |
| `GET /api/v1/offerings` | `GET` | Fetch expert offerings |
| `PUT /api/v1/offerings/{id}` | `PUT` | Update offering (Expert authorization enforced) |
| `DELETE /api/v1/offerings/{id}` | `DELETE` | Delete offering (Expert authorization enforced) |
| `GET /api/v1/bookings` | `GET` | List bookings (Client My Bookings vs Expert Incoming Bookings) |
| `POST /api/v1/bookings` | `POST` | Create booking record in SQLite DB |
| `GET /api/v1/earnings` | `GET` | Fetch expert earnings summary (Expert authorization enforced) |
| `GET /api/v1/experts` | `GET` | List seeded marketplace experts |
| `GET /api/v1/health` | `GET` | System health check & FAISS index count |

---

## 🔒 8. Security & License

- Built for **mindGigs.com** / Aartec.
- Zero API keys or credentials committed to source control.
