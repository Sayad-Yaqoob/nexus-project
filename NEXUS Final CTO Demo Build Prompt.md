# NEXUS — FINAL CTO DEMO BUILD
## Turn NEXUS from a chatbot prototype into a working MindGigs agentic product

You are working inside the existing `nexus-project` repository.

This is a **final product-quality integration pass** for the NEXUS proof of concept.

Do NOT rebuild the project from scratch.

Do NOT replace working infrastructure unnecessarily.

Do NOT create fake functionality just to make the demo appear complete.

The goal is to make NEXUS feel like a real agentic layer sitting on top of MindGigs:

> User speaks naturally → NEXUS understands → extracts structured information → validates it → presents a polished action/result UI → user confirms when necessary → NEXUS performs the actual operation → verifies the result → updates the relevant MindGigs-style screen.

The two most important stakeholder demonstrations are:

### GOLDEN PATH A: EXPERT

User says:

> "I want to create a 1:1 session for $500. I'll be offering marketing strategy and related consulting. Total time is one hour."

NEXUS must:

1. Understand the request.
2. Extract the structured fields.
3. Identify missing required information.
4. Ask only for genuinely missing information.
5. Present a clean editable "Create 1:1 Session" action card.
6. Allow the expert to edit fields.
7. Require explicit confirmation.
8. Actually create the offering in the demo database.
9. Verify that it exists.
10. Show success.
11. Make the new offering immediately visible in the expert's "My Offers" / profile experience.
12. Allow the expert to continue creating another offer or manage the new one.

### GOLDEN PATH B: CLIENT

User says:

> "I need an expert for our marketing team to help us launch the new product related to authors."

NEXUS must:

1. Understand the request.
2. Extract the actual search intent.
3. Immediately search the real seeded expert database using semantic search.
4. Return actual experts from the database.
5. Rank them using transparent scoring.
6. Explain why each expert matched.
7. Show their actual profile/offering information.
8. Allow the client to select an expert.
9. Let the client inspect the expert/profile/offering.
10. Allow the next real booking/purchase workflow supported by the demo.
11. Never invent experts, prices, ratings, meetings, filters, platform features, or policies.

---

# 1. MOST IMPORTANT CHANGE: NEXUS MUST NOT DISPLAY RAW LLM OUTPUT

This is currently one of the biggest problems.

The LLM is producing long conversational essays and unsupported platform instructions.

That must stop.

## New rule

The LLM is an intelligence layer, NOT the UI renderer.

Never directly render arbitrary LLM-generated structured-looking text as the application's main result.

Instead:

```text
User message
    ↓
Intent classification
    ↓
Structured extraction
    ↓
Validation / business rules
    ↓
Application state
    ↓
Typed response
    ↓
React component
```

The backend should return typed structured responses.

Example:

```json
{
  "response_type": "action",
  "action_type": "create_offering",
  "message": "I have the details for your 1:1 session. Review them before I create it.",
  "requires_confirmation": true,
  "data": {
    "offering_type": "1:1_session",
    "title": "Marketing Strategy Session",
    "price": 500,
    "currency": "USD",
    "duration_minutes": 60,
    "description": "Marketing strategy and consulting for product launches."
  }
}
```

The frontend renders this using:

```text
CreateOfferingActionCard
```

NOT by printing the JSON.

---

# 2. RESPONSE TYPES MUST BE STRICT

Expand the response contract.

Use typed response types such as:

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
error
general
```

For actions:

```text
create_profile
edit_profile
create_offering
edit_offering
create_booking
update_availability
```

The frontend must have a renderer such as:

```text
ResponseRenderer
```

which chooses the correct component based on `response_type` / `action_type`.

Example:

```text
response_type = search_results
        ↓
ExpertMatchResults

response_type = action_preview
        ↓
ActionCard

response_type = profile
        ↓
ExpertProfileCard

response_type = booking
        ↓
BookingCard

response_type = earnings
        ↓
EarningsSummaryCard
```

This is critical.

---

# 3. NEXUS RESPONSE POLISHING LAYER

Add a backend response normalization layer.

For example:

```text
agents/
    nexus_graph.py
    response_formatter.py
    validators.py
```

The formatter must:

- remove unnecessary verbosity
- remove repeated information
- remove unsupported claims
- remove invented platform terminology
- convert structured information into typed UI responses
- preserve actual database values
- keep conversational messages short
- distinguish facts from suggestions
- never manufacture missing data

The agent's natural-language message should usually be 1–3 concise sentences.

Example:

BAD:

> "Great! Based on your request, I can help you create an exceptional strategic marketing offering..."

GOOD:

> "I have enough information to create the 1:1 session. Review the details below and confirm when you're ready."

The card contains the details.

---

# 4. ABSOLUTE ANTI-HALLUCINATION RULE

NEXUS must NEVER invent:

- expert names
- expert profiles
- prices
- ratings
- reviews
- availability
- categories
- offerings
- booking slots
- payment methods
- checkout steps
- platform features
- contracts
- meeting policies
- free consultations
- guarantees
- filters
- verification states
- currencies
- earnings
- commissions
- booking statuses

unless those values exist in the application's actual data/business rules.

If the database does not contain something:

```text
Do not invent it.
```

If the platform mapping does not establish a feature:

```text
Do not claim it exists.
```

If a capability is not implemented:

```text
Tell the user that it is not currently available in the demo.
```

This is a hard product requirement.

---

# 5. MINDGIGS BUSINESS MODEL TO MODEL

Use the existing MindGigs platform mapping as the source of truth.

MindGigs has:

## BUY

- Find Experts
- Public Expert Profiles
- My Bookings
- My Purchases
- 1:1 session booking
- Checkout flow
- Expert discovery

## SELL

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
- Billing & Payouts

The existing platform mapping confirms these areas and the six major offer types.

Do not implement all of these as fake features.

Instead, make the demo architecture capable of representing them and fully implement the workflows necessary for the stakeholder demo.

---

# 6. EXPERT OFFER TYPES

The application must understand these offering types:

```text
1:1 Session
Subscription
Digital Product
Book
Custom Offering
Highlight
```

Do not treat all offers as identical.

Each type has different fields and validation requirements.

The existing mapping explicitly identifies these six types.

---

# 7. 1:1 SESSION MUST BE COMPLETE

This is the primary expert demo.

The action card must support:

### Required / relevant fields

- Offer Type
- Session Title
- Description
- Price
- Currency
- Duration
- Availability
- Expert timezone
- Booking availability
- Any session-specific settings represented by the existing data model

Do NOT stop at:

```text
title
price
duration
description
```

Availability is important and was previously missed.

The MindGigs expert profile includes weekly hours and timezone.

---

# 8. AVAILABILITY MUST BE A FIRST-CLASS FEATURE

Add proper availability support.

Represent weekly availability as:

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
  },
  "wednesday": {
    "available": false
  }
}
```

Support:

- Monday–Sunday
- available/unavailable
- start time
- end time
- timezone

The profile onboarding mapping explicitly calls for weekly hours for each day and timezone detection/confirmation.

Do not force users to type availability manually in a chat paragraph.

The Action UI should provide a clean availability editor.

Example:

```text
Weekly Availability

MON   09:00 ───── 17:00   ✓
TUE   09:00 ───── 17:00   ✓
WED   Unavailable          —
THU   09:00 ───── 17:00   ✓
FRI   09:00 ───── 15:00   ✓
SAT   Unavailable          —
SUN   Unavailable          —

Timezone
Asia/Karachi
```

Allow editing.

---

# 9. EXPERT PROFILE MUST BE REAL, NOT JUST A CHAT DRAFT

Expert onboarding should collect the actual profile information supported by MindGigs.

Support:

- profile photo
- headline
- bio
- expertise tags
- category
- public handle
- social links
- weekly availability
- timezone
- currency
- Google Calendar field/state if represented in the current architecture

The mapping explicitly includes these fields.

Natural language can populate them.

Example:

> "I'm a marketing strategist focused on SaaS launches. My LinkedIn is ... I work Monday through Friday from 9 to 5 Pakistan time."

NEXUS extracts this into the profile draft.

Then show:

```text
┌──────────────────────────────┐
│ Expert Profile               │
│                              │
│ [Photo]                      │
│ Sarah Khan                   │
│ SaaS Marketing Strategist    │
│                              │
│ Marketing & Growth           │
│ SaaS • Product Launches ...  │
│                              │
│ Availability                 │
│ Mon–Fri 09:00–17:00          │
│ Asia/Karachi                 │
│                              │
│ [Edit] [Publish Profile]     │
└──────────────────────────────┘
```

---

# 10. MY OFFERS MUST ACTUALLY WORK

Create a real demo equivalent of:

```text
SELL → My Offers
```

This is not a placeholder page.

It must read from the same database used by NEXUS.

When NEXUS creates an offer:

```text
NEXUS
  ↓
DataAdapter
  ↓
SQLite
  ↓
My Offers
```

The new offer must immediately appear.

Example:

```text
My Offers

+ Create Offer

┌───────────────────────────────────────┐
│ Marketing Strategy Session            │
│ 1:1 Session                           │
│ $500                                  │
│ 60 minutes                            │
│                                       │
│ Active                                │
│                                       │
│ [View] [Edit]                         │
└───────────────────────────────────────┘
```

No fake success message.

If the database record does not exist, NEXUS cannot say it was created.

---

# 11. CREATE OFFER MUST ALSO BE AVAILABLE OUTSIDE CHAT

The expert should be able to say:

> "Create another offer."

NEXUS should handle it.

But also provide:

```text
+ Create Offer
```

inside the My Offers interface.

This button should open a proper structured creation interface.

The two paths should use the same backend service:

```text
Chat creation
      ↓
CreateOfferingService
      ↑
UI creation
```

Do not duplicate business logic.

---

# 12. OFFER EDITING

If an expert says:

> "Change the price of my marketing session to $600."

NEXUS should:

1. Identify the actual offering.
2. Load it from the database.
3. Change only the requested field.
4. Show the proposed change.
5. Ask for confirmation.
6. Persist it.
7. Verify it.
8. Refresh My Offers/profile data.

Never create a second offer accidentally.

---

# 13. OFFER TYPE-SPECIFIC FIELDS

Build the data model so different offer types can have different fields.

### 1:1 Session

Support:

- title
- description
- price
- currency
- duration
- availability
- timezone
- session settings

### Subscription

Support the fields represented by the current data model/business mapping, including:

- title
- description
- price
- currency
- subscription period
- benefits
- external link if applicable

### Digital Product

Support:

- title
- description
- price
- currency
- product type
- uploaded file OR external delivery link
- file validation

The platform mapping specifies supported uploaded file types including:

```text
PDF
ZIP
XLSX
PPTX
DOCX
CSV
```

with a 50MB limit.

Use the existing `file_handler.py` validation rather than duplicating rules.

### Book

Support the actual book-related fields represented by the existing model, including:

- title
- description
- price
- book PDF
- retailer links where applicable

### Custom Offering

Support the fields represented by the existing model, including:

- title
- description
- price
- installment plans where applicable

### Highlight

Support:

- image
- link
- display order

Do not invent additional business rules.

---

# 14. CLIENT EXPERIENCE MUST BE A REAL MARKETPLACE EXPERIENCE

The client should not receive an essay.

For:

> "I need an expert for our marketing team to help us launch the new product related to authors."

NEXUS should respond approximately:

> "I found experts whose profiles and offerings match marketing, product launches, and author/publishing work."

Then render:

```text
MATCHING EXPERTS

┌────────────────────────────────────┐
│ Expert Name                        │
│ Product Marketing Strategist       │
│ Marketing & Growth                 │
│                                    │
│ Match: 91%                         │
│                                    │
│ Why this matches                  │
│ • Product launch strategy          │
│ • Marketing expertise              │
│ • Relevant author/publishing work │
│                                    │
│ Offering                            │
│ Launch Strategy Session             │
│ $250 · 60 min                       │
│                                    │
│ [View Profile] [View Offering]    │
└────────────────────────────────────┘
```

Repeat for all relevant experts.

---

# 15. CLIENT MATCHING MUST USE REAL DATA

Pipeline:

```text
Client message
      ↓
Intent extraction
      ↓
Search query construction
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
React match cards
```

The LLM can help explain why an expert matched.

The LLM cannot invent the expert.

Every result must correspond to an actual database record.

---

# 16. NO ARBITRARY "TOP 3"

Return all relevant matches according to the search/ranking system.

The existing architecture explicitly requires all relevant matches and rejects an arbitrary top-three cutoff.

The UI should therefore support:

- scrollable results
- ranking
- score
- reason
- actual expert information
- actual offering information

Do not say:

> "Here are the top 3 experts"

unless exactly three actual relevant records exist.

---

# 17. MATCH SCORE MUST BE EXPLAINABLE

Do not produce random numbers like:

```text
94%
```

just because the LLM feels that way.

The score must come from an actual ranking mechanism.

At minimum, document the scoring inputs.

For example:

```text
semantic similarity
+
category relevance
+
tag relevance
+
offering relevance
```

If additional signals are actually implemented, include them.

The UI should show:

```text
Match: 87%

Why:
✓ Strong marketing expertise
✓ Product launch experience
✓ Relevant author/publishing tags
```

The explanation must be grounded in the actual expert record.

---

# 18. CLIENT MUST BE ABLE TO REACH THE EXPERT

This was previously incomplete.

From an Expert Match Card:

```text
[View Profile]
```

must open a real demo expert profile.

The profile should contain:

- name
- photo
- headline
- bio
- category
- tags
- verification state if available
- social links if appropriate
- availability
- actual offerings

The client should be able to select an offering.

Example:

```text
Sarah Khan
Product Marketing Strategist

Marketing & Growth

SaaS • Product Launches • Content Strategy

About
...

Available
Mon–Fri, 10:00–17:00 PKT

Offers

Launch Strategy Session
$250 · 60 min

[Book Session]
```

---

# 19. CLIENT BOOKING FLOW

Implement the demo version of the actual booking concept.

The real MindGigs flow is based around selecting a session time, entering details, and confirming payment. The platform mapping also records dual timezone handling and slot holds.

For the demo:

```text
Client
 ↓
Expert
 ↓
Offering
 ↓
Available time
 ↓
Client details
 ↓
Review
 ↓
Confirm
 ↓
Create booking
 ↓
Verify booking
```

Do not integrate real Stripe unless it already exists and is configured.

Instead, clearly label demo payment state as demo/simulated where necessary.

Do NOT pretend real money was charged.

---

# 20. TIMEZONE HANDLING

Expert availability belongs to the expert timezone.

Client sees converted availability in the client's timezone.

Example:

```text
Expert timezone:
Asia/Karachi

Client timezone:
Europe/London

Available:
14:00 PKT
↓
10:00 GMT
```

Do not silently assume both users share a timezone.

Store:

```text
scheduled_datetime
client_timezone
expert_timezone
```

The existing data model already anticipates these booking fields.

---

# 21. BOOKINGS MUST BECOME REAL DATABASE OBJECTS

Create/use the booking model with fields such as:

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

The existing project mapping specifies these fields.

Then expose:

### Client

```text
My Bookings
```

### Expert

```text
Incoming Bookings
```

with statuses:

```text
Confirmed
Pending
Completed
Cancelled
```

These are confirmed in the existing platform mapping.

---

# 22. EXPERT PERSPECTIVE TOGGLE

Keep the new product decision:

### Expert accounts

Show:

```text
Perspective

Client | Expert
```

or an equally clean equivalent.

### Client-only accounts

Do NOT show the toggle.

Important:

This is NOT authorization.

The actual authenticated account role remains authoritative.

Perspective only changes:

```text
What NEXUS prioritizes
```

For example:

Expert perspective:

> "Create an offer"

Client perspective:

> "Find an expert"

But backend permissions must still be enforced independently.

---

# 23. SIDEBAR / PRODUCT NAVIGATION

Make the demo feel like a real MindGigs environment.

Use the existing structure:

```text
Overview

BUY
  My Bookings
  My Purchases

SELL
  Expert Profile
  My Offers
  Incoming Bookings
  Earnings
  1:1 Sessions
  Subscriptions
  Digital Products
  Books
  Highlights
  Custom Offerings
  Newsletter

AFFILIATE
  Links & Codes
  Earnings & Payouts
  History

ACCOUNT
  General
  Notifications
  Billing
```

Not every page needs full implementation in this pass.

But implemented features must be real.

Clearly distinguish:

```text
Implemented
```

from:

```text
Not available in demo
```

Never create dead buttons that imply functionality that doesn't exist.

---

# 24. PROFILE ↔ OFFERS ↔ DATABASE MUST BE CONNECTED

There must be one source of truth.

Example:

```text
SQLite

users
expert_profiles
offerings
bookings
earnings
payouts
client_sessions
```

Then:

```text
NEXUS
 ↓
DataAdapter
 ↓
Database
 ↓
Profile / My Offers / Bookings / Earnings
```

Do not maintain separate fake frontend state as the source of truth.

Frontend state can cache data, but database state is authoritative.

---

# 25. ACTION EXECUTION STATE

When NEXUS performs an operation, show real progress.

Example:

```text
Create 1:1 Session

✓ Details validated
✓ Offer data prepared
→ Creating offer...
→ Verifying offer...

✓ Offer created
```

Do not display these steps unless the corresponding backend operation actually happened.

---

# 26. CONFIRMATION RULE

Anything that changes persistent data requires confirmation unless it is explicitly a harmless navigation/search operation.

Examples requiring confirmation:

- publish profile
- create offer
- edit offer
- delete offer
- create booking
- cancel booking
- request payout
- delete account

Searches do NOT require confirmation.

Navigation does NOT require confirmation.

---

# 27. EDITABLE ACTION CARDS

Action cards are central to the NEXUS UX.

They should support:

```text
Edit
Confirm
Cancel
```

For an offer:

```text
Create 1:1 Session

Offer type
[1:1 Session]

Title
[Marketing Strategy Session]

Description
[Marketing strategy and consulting...]

Price
[$500]

Currency
[USD]

Duration
[60 minutes]

Availability
[Edit schedule]

[Cancel] [Create Offer]
```

The user should not need to type everything again just to correct one field.

---

# 28. MISSING INFORMATION

The agent should ask only for missing information.

Example:

User:

> "Create a session about marketing."

NEXUS should NOT invent:

- price
- duration
- availability

Instead:

> "I can create that. What price and session duration should I use?"

Then continue.

If the user says:

> "$500, one hour."

Now the card appears.

---

# 29. NATURAL LANGUAGE + STRUCTURED UI

The product philosophy should be:

```text
Natural language for intent.
Structured UI for precision.
```

Do NOT turn the entire application into a chat transcript.

Do NOT turn the entire application into forms either.

Use conversation to initiate actions and cards/forms to inspect and control them.

---

# 30. QUICK ACTIONS

Context-aware quick actions are useful.

Expert:

```text
Create Offer
Edit Profile
View Earnings
View Bookings
Update Availability
```

Client:

```text
Find Experts
My Bookings
My Purchases
```

Do not show actions the user cannot perform.

---

# 31. EARNINGS

If an expert asks:

> "How much have I earned?"

query actual earnings data.

Return a structured card:

```text
Earnings

Total Sales
$1,250

Expert Earnings
$875

Platform Fees
$375

Pending
$250

Recent Sales
...
```

Use the actual business rules represented by the existing platform mapping.

The platform mapping specifies a 70% expert / 30% platform split and a $50 payout minimum.

Never generate fake numbers.

---

# 32. DATABASE / SERVICES

Do not put business logic directly into FastAPI routes or React components.

Prefer:

```text
Agent
 ↓
Tool / Service
 ↓
DataAdapter
 ↓
Database
```

For example:

```text
create_offering()
update_offering()
get_offering()
search_experts()
get_expert_profile()
get_availability()
create_booking()
get_bookings()
get_earnings()
```

The agent should call these capabilities.

The agent should NOT know whether the backend is SQLite, Firestore, WordPress, or another system.

This preserves the future WordPress adapter architecture.

---

# 33. WORDPRESS REALITY

Production MindGigs uses WordPress.

The NEXUS demo uses SQLite.

Therefore:

```text
NEXUS Agent
    ↓
DataAdapter interface
    ↓
SQLiteAdapter
```

Future:

```text
NEXUS Agent
    ↓
DataAdapter interface
    ↓
WordPressAdapter
```

Do not hard-code the agent to SQLite.

Do not pretend SQLite is production MindGigs.

Do not claim the demo has modified live MindGigs.

---

# 34. LANDING PAGE

Keep the polished NEXUS landing page.

It should communicate:

```text
NEXUS
The agentic layer for MindGigs.

Turn conversations into marketplace actions.
```

Include:

- Hero
- What NEXUS does
- Expert workflow
- Client workflow
- Product UI preview
- CTA
- Login / Demo entry
- Footer

Avoid:

- generic "revolutionary AI" language
- glowing AI brains
- excessive gradients
- random floating objects
- meaningless animations
- fake testimonials
- fake statistics

The actual product UI should be the visual centerpiece.

---

# 35. DESIGN SYSTEM

Keep the existing design system:

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
System sans-serif
```

Clean.

Professional.

Restrained.

The visual language should feel like serious SaaS/product software.

---

# 36. DEMO AUTH

Keep the current mimic/demo authentication.

Requirements:

- random seeded user
- valid JWT
- no `user_id=1`
- expert/client personas
- account capabilities remain separate from perspective
- demo banner where appropriate

---

# 37. SEED DATA MUST SUPPORT THE DEMO

Ensure the seeded experts are not generic placeholders.

We need meaningful variation.

At minimum:

- marketing experts
- product marketing experts
- authors/publishing-related experts
- business strategists
- AI/data experts
- software experts
- coaching/leadership experts
- finance experts
- operations experts
- personal development experts

Each expert should have:

- name
- headline
- bio
- category
- tags
- public handle
- verification state
- availability
- timezone
- currency
- 1–3 actual offerings

The client search demo must therefore produce meaningful real matches.

---

# 38. IMPORTANT: TEST THE EXACT BAD EXAMPLE

After implementation, test this exact client message:

> "I need an expert for our marketing team to help us launch the new product related to authors"

The response MUST NOT contain invented things such as:

```text
Explore Experts
Marketing de Produtos
Authors & Publications
4.5 stars
5+ launches
Portuguese
free 30-minute meeting
contracts
project panel
BRL payment
request proposal
```

unless these things actually exist in the application's data/business rules.

Instead it should show actual seeded experts and actual offerings.

---

# 39. TEST THE EXACT EXPERT EXAMPLE

Test:

> "I need to create a 1:1 session for 500 dollars. I will be offering marketing strategies and other related things. Total time will be 1 hour."

Expected:

```text
NEXUS:
"I have the details for your 1:1 session. Review them below."

[Create 1:1 Session]

Title
Marketing Strategy Session

Type
1:1 Session

Price
$500

Duration
60 minutes

Description
Marketing strategies and related consulting.

Availability
Not specified

[Edit] [Create Offer]
```

If availability is required by the actual demo business rule, ask for it before allowing creation.

After confirmation:

```text
✓ Offer created
```

Then:

```text
My Offers

Marketing Strategy Session
$500
60 minutes
Active
```

The record must come from the database.

---

# 40. TEST EDITING

After creating the offer:

> "Change it to $600."

Expected:

```text
Update Offer

Current price
$500

New price
$600

[Cancel] [Confirm Update]
```

Then persist and verify.

---

# 41. TEST CLIENT → EXPERT → BOOKING

Use the client flow:

```text
Find expert
 ↓
Search results
 ↓
Select expert
 ↓
View profile
 ↓
Select real offering
 ↓
View actual availability
 ↓
Select time
 ↓
Enter details
 ↓
Review
 ↓
Confirm demo booking
 ↓
Booking appears in My Bookings
 ↓
Booking appears in expert Incoming Bookings
```

Both sides must see the same booking record.

---

# 42. TEST PERSPECTIVE

For an expert account:

```text
Perspective: Client | Expert
```

Switch to Client:

```text
NEXUS prioritizes:
Find Experts
My Bookings
My Purchases
```

Switch to Expert:

```text
NEXUS prioritizes:
Create Offer
Edit Profile
Availability
Bookings
Earnings
```

But authorization remains based on the account.

---

# 43. ERROR HANDLING

Errors must be human-readable.

BAD:

```text
ValidationError: pydantic_core...
```

GOOD:

> "I couldn't create the offer because the price is missing."

For database errors:

> "I couldn't save that offer. Nothing was changed."

For unavailable features:

> "That feature isn't implemented in the current demo yet."

Never fake completion.

---

# 44. DO NOT BUILD FAKE FEATURES

This is a hard rule.

Never create:

```text
fake Stripe payment
fake WordPress synchronization
fake Google Calendar event
fake email delivery
fake expert reviews
fake ratings
fake bookings
fake availability
fake earnings
fake payouts
fake published URLs
fake API responses
```

A controlled demo database is completely acceptable.

A fake claim that something happened is not.

---

# 45. FRONTEND ARCHITECTURE

Use reusable components.

Suggested structure:

```text
components/nexus/

AgentWorkspace.tsx
ChatMessage.tsx
ResponseRenderer.tsx
QuickActionChips.tsx
FileUploadInput.tsx

cards/
    ActionCard.tsx
    CreateOfferingActionCard.tsx
    ProfileDraftCard.tsx
    ExpertMatchCard.tsx
    ExpertProfileCard.tsx
    OfferingCard.tsx
    AvailabilityEditor.tsx
    BookingCard.tsx
    EarningsSummaryCard.tsx
    SuccessCard.tsx

marketplace/
    ExpertProfileView.tsx
    MyOffers.tsx
    MyBookings.tsx
    IncomingBookings.tsx
```

Do not create duplicate implementations of the same business operation.

---

# 46. BACKEND ARCHITECTURE

Suggested:

```text
agents/
    nexus_graph.py
    prompts.py
    response_formatter.py
    validators.py
    tools.py

services/
    offering_service.py
    profile_service.py
    matching_service.py
    booking_service.py
    earnings_service.py

api/
    agent.py
    tools.py

adapters/
    base.py
    sqlite_adapter.py
    firestore_adapter.py
    groq_adapter.py
    faiss_adapter.py
```

Adapt this to the existing repository rather than blindly creating duplicate files.

---

# 47. LANGGRAPH MUST ACTUALLY ORCHESTRATE ACTIONS

The graph must not just be:

```text
load context
→ classify
→ respond
```

It needs meaningful workflow routing.

Conceptually:

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
 ├── matching workflow
 ├── booking workflow
 ├── earnings workflow
 └── navigation workflow
 ↓
action / result
 ↓
format_response
 ↓
persist_state
 ↓
END
```

For persistent actions:

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

---

# 48. VERIFY AFTER EVERY WRITE

Never assume a successful function call means the operation worked.

After:

```text
create_offering()
```

perform:

```text
get_offering(id)
```

After:

```text
create_booking()
```

perform:

```text
get_booking(id)
```

Then generate success.

---

# 49. CONTEXT MEMORY

NEXUS should remember the current workflow.

Example:

User:

> "Create a marketing session."

NEXUS:

> "What price should I use?"

User:

> "$500."

NEXUS must know that `$500` is the price for the session being created.

It must not start a new unrelated workflow.

Persist session state.

---

# 50. NO GENERIC AI CHATBOT FALLBACK FOR PLATFORM TASKS

If the user asks:

> "Create an offer."

Do not answer with instructions about how to create an offer.

Actually begin the workflow.

If the user asks:

> "Find me a marketing expert."

Do not explain how MindGigs search works.

Actually search.

If the user asks:

> "Show my bookings."

Do not describe where bookings are located.

Actually query the database and display them.

NEXUS is an operator, not a help-center article.

---

# 51. FINAL CTO ACCEPTANCE TEST

Before declaring completion, manually test all of these.

### Test 1: Login

```text
Try Demo
→ random user
→ JWT
→ /nexus
```

### Test 2: Expert profile

```text
I want to start selling
→ collect missing profile data
→ profile preview
→ confirmation
→ database write
→ profile visible
```

### Test 3: Availability

```text
Set my availability to Monday-Friday 9-5
→ structured availability editor
→ save
→ profile reflects it
```

### Test 4: Create offer

```text
Create a 1:1 session for $500,
one hour,
marketing strategy
```

→ action card  
→ editable  
→ confirmation  
→ database write  
→ verification  
→ My Offers updated

### Test 5: Edit offer

```text
Change it to $600
```

→ edit card  
→ confirmation  
→ update  
→ verification

### Test 6: Client search

```text
I need an expert for our marketing team
to help us launch the new product related to authors
```

→ real semantic search  
→ real seeded experts  
→ transparent ranking  
→ no hallucinated data

### Test 7: Expert profile

```text
View expert
```

→ actual profile  
→ actual offerings  
→ actual availability

### Test 8: Booking

```text
Select actual offering
→ actual available slot
→ client details
→ confirmation
→ database booking
→ client My Bookings
→ expert Incoming Bookings
```

### Test 9: Earnings

```text
How much did I earn?
```

→ actual earnings query  
→ structured earnings card

### Test 10: Perspective

Expert:

```text
Client | Expert
```

Client-only:

```text
No perspective toggle
```

---

# 52. VALIDATION

Run:

```bash
pytest
```

and frontend:

```bash
npm run build
```

Fix:

- TypeScript errors
- Python errors
- API schema mismatches
- broken imports
- runtime failures
- stale frontend assumptions
- database migration/seed problems

If the environment prevents a test from running, explicitly report that instead of claiming success.

---

# 53. FINAL QUALITY BAR

The final product should communicate this:

> "NEXUS understands what I want and actually helps me do it."

Not:

> "NEXUS gives me a very long AI-generated explanation about what I could do."

The product should feel like:

```text
AI intelligence
+
real application state
+
real marketplace data
+
structured action UI
+
human confirmation
+
real execution
+
verification
```

That is the core of the demo.

Prioritize:

```text
1 excellent expert workflow
+
1 excellent client discovery/booking workflow
+
polished UI
+
real database operations
+
zero hallucinated platform behavior
```

over implementing every MindGigs feature superficially.

Do not expand scope until these workflows are solid.

# END OF PROMPT