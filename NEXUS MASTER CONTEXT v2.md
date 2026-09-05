# NEXUS PROJECT — MASTER CONTEXT v2

## 1. PROJECT OWNER / ROLE

I am Sayad Yaqoob, a final-year BS Artificial Intelligence student and AI/ML intern at Aartec, which operates MindGigs.com.

I am building **NEXUS**, an agentic AI productivity layer for MindGigs.

Important:
- I use AI-assisted coding heavily.
- Do not assume I personally wrote every line of code.
- Do not exaggerate implementation maturity.
- Explain important architectural decisions clearly when needed.
- Prefer working, demonstrable functionality over large amounts of unfinished code.

---

# 2. WHAT NEXUS IS

NEXUS is NOT a generic AI chatbot.

NEXUS is an **agentic interface over MindGigs**.

Core concept:

```text
Natural language
      ↓
Understand intent
      ↓
Extract structured information
      ↓
Validate against real platform rules/data
      ↓
Generate structured action/result
      ↓
Render appropriate UI
      ↓
User confirms when required
      ↓
Execute real operation
      ↓
Verify result
      ↓
Update application state
```

NEXUS should behave like an operator, not a consultant.

BAD:

> "You can go to My Offers and create an offering by..."

GOOD:

> "I'll prepare the offer for you."

Then show an editable action card and actually perform the operation after confirmation.

---

# 3. CORE PRODUCT PRINCIPLE

The central UX principle is:

> **Natural language for intent. Structured UI for precision. Real application state for truth.**

The LLM must NOT directly control what the UI displays.

Instead:

```text
LLM
 ↓
structured state
 ↓
backend validation/business logic
 ↓
typed response
 ↓
React component
```

Never dump raw LLM responses, JSON, essays, or generated pseudo-UI into the interface.

---

# 4. CURRENT TARGET STACK

Backend:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite / aiosqlite for demo
- LangGraph
- Groq LLMs
- FAISS CPU
- sentence-transformers / `all-MiniLM-L6-v2`

Frontend:

- Next.js
- App Router
- TypeScript
- React
- Tailwind CSS

Architecture:

```text
NEXUS Agent
    ↓
Services / Tools
    ↓
DataAdapter
    ↓
SQLite demo backend
```

Future:

```text
NEXUS Agent
    ↓
Services / Tools
    ↓
DataAdapter
    ↓
WordPress / MindGigs adapter
```

The agent must not be tightly coupled to SQLite, WordPress, or Firestore.

---

# 5. MINDGIGS REALITY

MindGigs is a WordPress-based marketplace.

NEXUS currently does NOT have production WordPress/database access.

Therefore the project uses a controlled SQLite-backed demo environment.

Never claim that the demo has modified live MindGigs.

Never fake WordPress integration.

The demo should prove that the architecture can later connect through a WordPress adapter.

---

# 6. MINDGIGS FUNCTIONAL AREAS

## BUY / CLIENT

- Find Experts
- Public Expert Profiles
- My Bookings
- My Purchases
- 1:1 session discovery and booking

## SELL / EXPERT

- Expert Profile
- My Offers
- Incoming Bookings
- Earnings
- 1:1 Sessions
- Subscriptions
- Digital Products
- Books
- Highlights
- Custom Offerings
- Newsletter

## AFFILIATE

- Links & Codes
- Earnings & Payouts
- History

## ACCOUNT

- General
- Notifications
- Billing / Payouts

Do not create fake implementations for features that are not actually built.

---

# 7. EXPERT PROFILE

Relevant profile information:

- photo
- bio
- headline
- public handle
- expertise tags
- category
- social links
- weekly availability
- timezone
- currency
- Google Calendar state/sync where supported

Public handle must be unique.

If the user proposes a taken handle, check the database and suggest alternatives.

---

# 8. EXPERT OFFER TYPES

MindGigs supports:

1. 1:1 Session
2. Subscription
3. Digital Product
4. Book
5. Custom Offering
6. Highlight

Do not treat every offering as an identical object if its fields differ.

---

# 9. 1:1 SESSION

The 1:1 creation workflow should support:

- offering type
- title
- description
- price
- currency
- duration
- availability
- expert timezone
- relevant session settings

Example:

> "Create a 1:1 session for $500 about marketing strategy for one hour."

Expected flow:

```text
Extract
 ↓
Validate
 ↓
Action Card
 ↓
Edit if needed
 ↓
Confirm
 ↓
Create database record
 ↓
Verify
 ↓
Show success
 ↓
My Offers reflects new offer
```

Do not invent price, duration, availability, or other values that the user did not provide.

---

# 10. AVAILABILITY

Availability is a first-class feature.

Represent weekly availability with:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Each day can contain:

- available/unavailable
- start time
- end time

Also store timezone.

Example:

```json
{
  "monday": {
    "available": true,
    "start": "09:00",
    "end": "17:00"
  },
  "tuesday": {
    "available": true,
    "start": "09:00",
    "end": "17:00"
  }
}
```

The UI should provide a proper availability editor instead of forcing the user to type a schedule in prose.

---

# 11. DIGITAL PRODUCTS

Digital products may require:

- title
- description
- price
- currency
- file or external delivery link

Use the existing file handler.

Supported file types include:

- PDF
- ZIP
- XLSX
- PPTX
- DOCX
- CSV

Maximum file size:

- 50MB

Do not duplicate validation rules in multiple locations.

---

# 12. CLIENT MATCHING

Core workflow:

```text
Client request
 ↓
Intent/entity extraction
 ↓
Search query
 ↓
VectorAdapter
 ↓
FAISS
 ↓
Actual expert records
 ↓
Ranking
 ↓
Structured match results
 ↓
Expert Match Cards
```

The client should receive actual database experts.

The LLM may explain why an expert matches, but it must not invent the underlying expert data.

Never invent:

- names
- prices
- ratings
- reviews
- experience
- availability
- categories
- offerings
- verification
- meetings
- contracts
- payment rules
- platform features

---

# 13. MATCHING RULE

No arbitrary top-three cutoff.

Return all relevant matches according to the implemented search/ranking mechanism.

Each match should contain:

- expert ID
- actual expert name
- headline
- category
- relevant tags
- match score
- grounded explanation
- actual relevant offering(s)

The score must be derived from actual ranking signals, not randomly generated by the LLM.

---

# 14. CLIENT → EXPERT

The client must be able to:

```text
Find Experts
 ↓
See real matches
 ↓
View Expert Profile
 ↓
See real offerings
 ↓
See real availability
 ↓
Select offering
 ↓
Book
```

Expert profile should show actual database data.

---

# 15. BOOKING

Booking model should support:

```text
client_id
expert_id
offering_id
session_type
scheduled_datetime
client_timezone
expert_timezone
status
payment_status
amount
```

Booking statuses:

- Pending
- Confirmed
- Completed
- Cancelled

Client and expert should reference the same booking record.

Client:

```text
My Bookings
```

Expert:

```text
Incoming Bookings
```

For the demo, payment may be simulated, but it must be clearly identified as demo/simulated.

Never pretend real money was charged.

---

# 16. TIMEZONE

Expert availability is stored in expert timezone.

Client booking times should be displayed in client timezone when appropriate.

Store both:

- expert timezone
- client timezone

Do not silently assume they are identical.

---

# 17. ACTION UI

Action cards are a core NEXUS concept.

Example:

```text
Create 1:1 Session

Offer Type
1:1 Session

Title
Marketing Strategy Session

Description
Marketing strategy and consulting.

Price
$500

Currency
USD

Duration
60 minutes

Availability
Mon–Fri, 09:00–17:00

[Edit] [Cancel] [Create Offer]
```

Action cards must be editable.

Do not make users repeat the entire request to correct one field.

---

# 18. CONFIRMATION

Persistent/destructive actions require explicit confirmation.

Examples:

- publish profile
- create offer
- edit offer
- delete offer
- create booking
- cancel booking
- payout actions
- account deletion

Search and navigation do not require confirmation.

---

# 19. VERIFY WRITES

After every persistent write:

```text
write
 ↓
read/verify
 ↓
success response
```

Never claim success simply because a function returned without throwing.

Example:

```text
create_offering()
 ↓
get_offering(id)
 ↓
confirm existence
 ↓
show success
```

---

# 20. RESPONSE TYPES

Backend should return typed responses such as:

```text
greeting
clarification
action
action_preview
action_success
search_results
profile
offering
booking
earnings
navigation
general
error
```

Potential actions:

```text
create_profile
edit_profile
create_offering
edit_offering
update_availability
create_booking
```

Frontend should have a central:

```text
ResponseRenderer
```

that maps response types to React components.

---

# 21. RESPONSE POLISHING

Natural-language messages should be short.

Prefer 1–3 sentences.

The UI card/table contains the detailed information.

Do not allow the LLM to produce:

- long essays
- fake instructions
- invented platform terminology
- unsupported workflows
- fake UI labels
- irrelevant explanations

The LLM's job is to understand and explain.

The application's job is to render and execute.

---

# 22. ANTI-HALLUCINATION CONTRACT

This is non-negotiable.

If information exists in:

- database
- adapter
- business rules
- actual application state

it may be shown.

If it does not exist:

```text
Do not invent it.
```

If a capability is not implemented:

```text
Say that it is unavailable in the current demo.
```

Never manufacture data merely to make the conversation look complete.

---

# 23. AGENT STATE

Target state includes:

```text
user_id
user_role
perspective
conversation_history
intent
extracted_entities
missing_info
draft_data
action_result
response_type
requires_confirmation
confirmation_action
session_id
```

User role and conversational perspective are separate.

---

# 24. EXPERT PERSPECTIVE TOGGLE

Expert accounts have:

```text
Perspective: Client | Expert
```

Client-only accounts do not see this toggle.

The toggle changes conversational/product perspective.

It does NOT change authorization.

Backend permissions continue to use the authenticated account role/capabilities.

---

# 25. LANGGRAPH

Target conceptual graph:

```text
START
 ↓
load_context
 ↓
classify_intent
 ↓
extract_entities
 ↓
validate
 ↓
route
 ├── profile workflow
 ├── offering workflow
 ├── availability workflow
 ├── matching workflow
 ├── booking workflow
 ├── earnings workflow
 └── navigation workflow
 ↓
action/result
 ↓
format_response
 ↓
persist_state
 ↓
END
```

For writes:

```text
draft
 ↓
confirmation
 ↓
execute
 ↓
verify
 ↓
success
```

LangGraph must orchestrate actual workflows, not merely classify a message and generate a paragraph.

---

# 26. IMPORTANT AGENT TOOLS

Prefer reusable services/tools such as:

```text
create_offering()
update_offering()
get_offering()
search_experts()
get_expert_profile()
get_availability()
update_availability()
create_booking()
get_bookings()
get_earnings()
```

Agent calls capabilities through adapters/services.

Agent should not directly manipulate database internals.

---

# 27. DATABASE SOURCE OF TRUTH

Important entities:

```text
users
expert_profiles
offerings
bookings
earnings
payouts
client_sessions
expert_embeddings
matches
```

Frontend must not maintain fake persistent marketplace state.

Database is authoritative.

---

# 28. DEMO ENVIRONMENT

The demo environment should behave like a miniature MindGigs installation.

If NEXUS creates an offer:

```text
NEXUS
 ↓
SQLite
 ↓
My Offers
 ↓
Profile
```

The offer must actually appear.

If NEXUS creates a booking:

```text
Client My Bookings
        ↕
same database record
        ↕
Expert Incoming Bookings
```

This is much better than showing a fake success message.

---

# 29. AUTHENTICATION

Demo authentication:

- random seeded user
- valid JWT
- no hardcoded `user_id=1`
- expert/client personas
- existing Firebase authentication can remain available

Demo mode is acceptable.

Fake authorization is not.

---

# 30. SEED DATA

Seed approximately 20–30 realistic experts.

Categories should include meaningful variation across:

- AI & Data
- Software Development
- Business & Strategy
- Marketing & Growth
- Sales
- Finance & Investing
- Operations & Supply Chain
- Coaching & Leadership
- Science & Environment
- Personal Development

Experts should have:

- realistic names
- realistic bios
- headlines
- categories
- tags
- public handles
- availability
- timezone
- currency
- 1–3 actual offerings
- realistic variation

The client matching demo depends on this data being meaningful.

---

# 31. UI DESIGN

Design system:

```text
Sidebar: #0B1320
Active: #112233
Accent: #00C49F
Canvas: #F8F9FA
Cards: #FFFFFF
Border: #E2E8F0
Primary text: #1E293B
Secondary text: #64748B
CTA: #00C49F
Danger: red
```

Style:

- serious SaaS
- clean
- restrained
- professional
- responsive
- no decorative AI gimmicks
- no excessive gradients
- no fake futuristic effects

The product UI itself should sell the idea.

---

# 32. LANDING PAGE

NEXUS should have a polished public landing page.

Core message:

> NEXUS turns conversations into marketplace actions.

Include:

- hero
- how it works
- expert workflow
- client workflow
- product UI preview
- CTA
- login/demo entry
- footer

Avoid generic AI marketing language and fake claims.

---

# 33. CURRENT KNOWN FAILURE

The previous client experience produced long AI-generated responses containing invented platform features and invented search criteria.

Example problem:

The user asked for a marketing expert for a product related to authors.

NEXUS responded with fabricated things such as:

- unsupported filters
- invented ratings
- invented launch counts
- invented language requirements
- invented meetings
- invented contracts
- invented pricing
- invented checkout behavior

This behavior is explicitly forbidden going forward.

The client must immediately use actual semantic search against actual seeded experts.

---

# 34. GOLDEN PATH A

Expert says:

> "Create a 1:1 session for $500, one hour, marketing strategy."

Expected:

```text
Natural language
 ↓
Extraction
 ↓
Missing-field check
 ↓
Action card
 ↓
Edit
 ↓
Confirm
 ↓
Create DB record
 ↓
Verify
 ↓
Success
 ↓
My Offers updated
 ↓
Profile updated
```

---

# 35. GOLDEN PATH B

Client says:

> "I need an expert for our marketing team to help us launch the new product related to authors."

Expected:

```text
Natural language
 ↓
Extract search intent
 ↓
Semantic search
 ↓
Actual experts
 ↓
Transparent ranking
 ↓
Match cards
 ↓
Expert profile
 ↓
Actual offering
 ↓
Actual availability
 ↓
Booking workflow
```

No invented platform behavior.

---

# 36. QUALITY RULE

Prefer:

```text
5 excellent working workflows
```

over:

```text
20 fake or half-working features
```

Never claim an implementation is complete if it has not been tested.

If an environment problem prevents testing, report the exact limitation.

---

# 37. CTO DEMO SUCCESS CRITERIA

A stakeholder should be able to:

1. Enter demo mode.
2. Land in NEXUS.
3. See personalized context.
4. Switch Expert/Client perspective if the account supports it.
5. Create/edit an expert profile.
6. Set availability.
7. Create a 1:1 offering conversationally.
8. Edit the generated action card.
9. Confirm creation.
10. See the actual offer in My Offers.
11. See the offer on the expert profile.
12. Ask NEXUS to find an expert.
13. See actual semantic matches.
14. Open an actual expert profile.
15. View actual offerings.
16. View actual availability.
17. Create a demo booking.
18. See the booking from both client and expert sides.
19. Query actual earnings/bookings.
20. Experience concise, polished NEXUS responses rather than raw AI output.

---

# 38. DEVELOPMENT RULE

Before changing code:

1. Inspect the existing repository.
2. Identify what already works.
3. Reuse existing adapters/services/components.
4. Do not duplicate business logic.
5. Make the smallest complete vertical slice.
6. Test it.
7. Only then expand.

Do not rebuild working authentication, adapters, or database infrastructure without a concrete reason.

# END MASTER CONTEXT