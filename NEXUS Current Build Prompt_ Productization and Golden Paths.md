# NEXUS CURRENT BUILD TASK
## Productize the agent and complete the Expert + Client golden paths

Read the NEXUS MASTER CONTEXT before making changes.

Do NOT rebuild the project.

First inspect the current repository and determine what is already implemented.

The current goal is NOT to add every MindGigs feature.

The goal is to make these two workflows genuinely work end-to-end:

```text
EXPERT:
Natural language → Action UI → confirmation → real DB write → verification → My Offers/Profile

CLIENT:
Natural language → real semantic search → real expert cards → profile → offering → availability → booking
```

The current implementation has a serious UX/product problem:

NEXUS sometimes behaves like a generic chatbot and produces long LLM-generated essays containing unsupported platform behavior.

Fix this at the architecture level, not by simply shortening the prompt.

---

# PRIORITY 1: STOP RAW LLM OUTPUT

Inspect the current `/api/agent/chat` response and frontend rendering.

Implement a strict structured response contract.

The frontend must render typed components instead of arbitrary LLM output.

At minimum support:

```text
greeting
clarification
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

Create/reuse a central response renderer.

Example:

```text
search_results → ExpertMatchResults
action_preview → ActionCard
profile → ExpertProfileCard
booking → BookingCard
earnings → EarningsSummaryCard
```

Natural-language agent messages should be short.

The card is the primary result.

---

# PRIORITY 2: EXPERT OFFER CREATION

Make this exact request work:

> "I need to create a 1:1 session for $500. I will be offering marketing strategies and other related things. Total time will be 1 hour."

Expected:

```text
NEXUS:
"I have the details for your 1:1 session. Review them below."

[Create 1:1 Session]

Type
1:1 Session

Title
Marketing Strategy Session

Description
Marketing strategies and related consulting.

Price
$500

Duration
60 minutes

Availability
Not specified / request if required

[Edit] [Cancel] [Create Offer]
```

Important:

Do not invent availability.

If availability is required for creation, ask for it.

If it is not required by the current demo business rules, allow creation and display that availability can be configured separately.

Do not invent other fields.

---

# PRIORITY 3: REAL ACTION EXECUTION

When the expert clicks confirmation:

```text
Action Card
 ↓
backend service
 ↓
DataAdapter
 ↓
SQLite
 ↓
verify record
 ↓
success
```

No fake success.

After creation, return the actual created offering.

The expert should be able to see it immediately in:

```text
My Offers
```

and wherever the demo expert profile displays offerings.

---

# PRIORITY 4: MY OFFERS

Inspect the current My Offers implementation.

Make it a real database-backed page.

It must:

- query actual offerings
- display offering type
- title
- price
- currency
- duration where applicable
- status
- actions

At minimum support:

```text
View
Edit
```

and:

```text
+ Create Offer
```

The `+ Create Offer` flow should use the same service/business logic as NEXUS.

Do not duplicate creation logic in React.

---

# PRIORITY 5: OFFER EDITING

Support natural-language editing.

Example:

> "Change my marketing session to $600."

Expected:

```text
Update Offer

Current price
$500

New price
$600

[Cancel] [Confirm Update]
```

After confirmation:

```text
database update
 ↓
verification
 ↓
My Offers refresh
```

Make sure the agent updates the correct existing offering instead of accidentally creating another one.

---

# PRIORITY 6: AVAILABILITY

This is currently incomplete and must be implemented properly.

Add/complete availability support for:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Each day:

```text
available
start
end
```

Also:

```text
timezone
```

Create a reusable `AvailabilityEditor`.

It should be usable from:

1. Expert profile
2. NEXUS action workflow
3. Booking availability lookup

Example:

```text
Weekly Availability

MON  09:00 – 17:00   ✓
TUE  09:00 – 17:00   ✓
WED  Unavailable
THU  09:00 – 17:00   ✓
FRI  09:00 – 15:00   ✓
SAT  Unavailable
SUN  Unavailable

Timezone
Asia/Karachi
```

Do not make the user type this as prose.

---

# PRIORITY 7: CLIENT SEARCH

This is equally important.

Test this exact request:

> "I need an expert for our marketing team to help us launch the new product related to authors."

The system must:

1. Extract search intent.
2. Build a search query.
3. Use the existing VectorAdapter / FAISS system.
4. Search actual seeded expert records.
5. Rank actual records.
6. Return structured results.
7. Render actual ExpertMatchCards.

Do not respond with a long essay.

Do not ask six unnecessary questions before searching.

There is enough information in the initial request to perform a first search.

After showing results, NEXUS may ask whether the client wants to narrow the search.

---

# PRIORITY 8: MATCH CARD

Build a polished match card containing only actual data.

Example:

```text
Sarah Khan
Product Marketing Strategist

Marketing & Growth

Match: 89%

Why this matches:
• Marketing strategy
• Product launch experience
• Relevant author/publishing expertise

Relevant offering:
Launch Strategy Session
$250 · 60 min

[View Profile]
[View Offering]
```

The actual content must come from the database.

The explanation may be generated, but it must be grounded in retrieved expert fields.

No hallucinated facts.

---

# PRIORITY 9: NO ARBITRARY TOP 3

Do not return only three experts because the UI is designed for three.

Return all relevant matches according to the search system.

The frontend should support a scrollable result list.

Do not use fake scores.

If the ranking system currently only produces similarity scores, expose those honestly.

---

# PRIORITY 10: EXPERT PROFILE

Clicking:

```text
View Profile
```

must open a real demo expert profile.

Display actual:

- name
- photo if available
- headline
- bio
- category
- tags
- verification state if available
- social links if available
- timezone
- availability
- offerings

The client must be able to select an actual offering.

---

# PRIORITY 11: BOOKING FLOW

Implement the demo booking vertical slice.

Flow:

```text
Client
 ↓
Expert
 ↓
Offering
 ↓
Availability
 ↓
Select time
 ↓
Client details
 ↓
Review
 ↓
Confirm
 ↓
Create booking
 ↓
Verify
```

Booking must be stored in the actual database.

Use:

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

If payment is simulated:

```text
Demo Payment
```

must be clearly shown.

Do not claim real payment occurred.

---

# PRIORITY 12: BOTH SIDES SEE THE BOOKING

After booking:

Client:

```text
My Bookings
```

must show the booking.

Expert:

```text
Incoming Bookings
```

must show the same booking.

Use the same database record.

Do not create two separate frontend-only objects.

---

# PRIORITY 13: EXPERT/CLIENT PERSPECTIVE

Keep the current product decision:

Expert account:

```text
Perspective: Client | Expert
```

Client-only account:

```text
No perspective toggle
```

Perspective changes conversational context only.

It does not grant permissions.

---

# PRIORITY 14: PLATFORM DATA CONTRACT

Before generating any text, ask:

> "Where did this fact come from?"

Valid sources:

```text
database
adapter
business rule
authenticated user context
actual implementation
```

Invalid source:

```text
LLM imagination
```

Never invent:

- prices
- ratings
- reviews
- experts
- availability
- categories
- platform features
- meetings
- contracts
- payment behavior
- filters
- statistics

---

# PRIORITY 15: MINDGIGS FORM COMPLETENESS

Inspect the existing MindGigs mapping and current models/components.

Identify any form fields currently missing from NEXUS.

Especially check:

### Expert profile

- photo
- bio
- headline
- handle
- expertise tags
- category
- socials
- availability
- timezone
- currency
- calendar state

### 1:1

- title
- description
- price
- currency
- duration
- availability
- timezone
- session-specific fields supported by current model

### Digital Product

- title
- description
- price
- currency
- file
- external delivery link
- file validation

### Other offer types

Ensure the architecture can represent their type-specific fields even if their complete workflows are not part of this demo slice.

Do not invent fields that are not supported by the existing MindGigs mapping.

---

# PRIORITY 16: LANDING PAGE

Inspect the current landing page.

If it is still unfinished, polish it enough to present NEXUS as a serious SaaS product.

Structure:

```text
Hero
 ↓
How NEXUS works
 ↓
Expert workflow
 ↓
Client workflow
 ↓
Actual product UI preview
 ↓
CTA
 ↓
Footer
```

Avoid generic AI hype and decorative gimmicks.

The real product interface should be the visual proof.

---

# PRIORITY 17: ARCHITECTURE

Do not put business logic into React components.

Prefer:

```text
React
 ↓
API
 ↓
Agent / Service
 ↓
DataAdapter
 ↓
Database
```

Use reusable services such as:

```text
create_offering
update_offering
search_experts
get_expert_profile
get_availability
update_availability
create_booking
get_bookings
```

Reuse existing adapters.

Do not create parallel business logic.

---

# PRIORITY 18: VERIFICATION

Every persistent action must follow:

```text
execute
 ↓
read back
 ↓
verify
 ↓
respond
```

Do not display:

```text
"Created successfully"
```

unless the record actually exists.

---

# PRIORITY 19: UI QUALITY

The UI should be:

- clean
- professional
- restrained
- responsive
- consistent
- readable
- card-driven for structured results

Use the existing NEXUS design system.

Avoid:

- raw JSON
- giant text blobs
- markdown walls
- excessive chatbot-style bubbles
- unsupported buttons
- dead navigation
- fake loading states
- fake success states

---

# PRIORITY 20: TEST THESE EXACT FLOWS

Do not stop after implementing code.

Test:

### Expert

```text
Create profile
→ Set availability
→ Create 1:1
→ Edit action card
→ Confirm
→ Verify DB
→ My Offers
→ Expert profile
```

### Client

```text
Search for marketing expert for author-related product launch
→ Actual semantic results
→ View expert
→ View offering
→ View availability
→ Book
→ Verify booking
→ Client My Bookings
→ Expert Incoming Bookings
```

### Editing

```text
Change existing offer price
→ Preview
→ Confirm
→ Verify
```

### Perspective

```text
Expert → Client perspective
Expert → Expert perspective
Client-only → no toggle
```

---

# FINAL REQUIREMENT

Do not tell me that the feature is complete merely because the code exists.

At the end, report:

```text
1. What you changed
2. Files changed
3. What is actually working
4. What was tested
5. Test results
6. Any environment limitations
7. Anything intentionally left unimplemented
```

The standard is:

> **A smaller working NEXUS is better than a larger fake NEXUS.**

The stakeholder should be able to interact with the system and visibly see that NEXUS is performing real operations over real application data.

# END CURRENT BUILD TASK