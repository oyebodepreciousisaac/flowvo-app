# Product Brand

> Created: 2026-09-27
> Status: Draft — for review before implementation
> This is an original brand. It does not reproduce any competitor's name, logo, visual identity, or proprietary assets.

---

## 1. Product context

| Attribute | Value |
|---|---|
| Working title | Lead-to-Cash Automation (placeholder only) |
| Problem | Trade/service business owners lose jobs, cash, and reviews to fragmented manual handoffs between enquiry, quote, job, invoice, and payment |
| Primary user | Solo or micro-team (1–5 person) trade/service business owner: plumber, electrician, HVAC, cleaner, landscaper, handyman |
| Buyer | Same person — single decision-maker, personal budget, fast decision |
| Job-to-be-done | Respond instantly to leads, convert them to jobs, get paid without chasing, earn reviews without effort |
| Core workflow | Lead → Quote → Job → Invoice → Review request (automated handoffs between each) |
| Value proposition | The only lightweight tool that connects the full lead-to-cash chain for a solo trade operator without requiring configuration expertise |
| Category | Lightweight operations SaaS / workflow automation for micro-businesses |
| Business model | SaaS subscription (~£20–60/month — hypothesis) |
| Environment of use | Web browser (desktop and mobile); owner uses it at desk and on a phone at job sites |
| Trust requirements | Owner must trust the product to send professional-looking emails on their behalf; must not send incorrect invoices; must feel reliable and under the owner's control |
| Known alternatives | Jobber (too complex), ServiceM8 (iOS-first, closest competitor), Wave + Google Calendar (disconnected workaround) |
| Key constraint | Must be usable without configuration expertise; must feel like a tool for a real tradesperson, not a tech product |

---

## 2. Product name

### Selected name: **Flowvo**

**Rationale:**
- Evokes *flow* — the connected, uninterrupted chain from lead to payment that the product creates
- *vo* suggests voice, movement, forward progress
- Short, pronounceable, memorable — one word, two syllables
- Does not use generic trade words (Pro, Jobber, Field, Track, etc.) that create association with existing competitors
- Feels professional without being corporate; approachable without being casual
- Available as a neutral English-sounding word with no strong cultural conflict
- Works as a domain candidate: flowvo.app / getflowvo.com

**Name that was rejected and why:**
- TradeFlow — too literal; sounds like a category label, not a product
- QuotePath — too narrow; implies only the quote step
- Handoff — too technical; wouldn't resonate with a plumber
- WorkChain — industrial-sounding; feels like logistics software

> **ASSUMPTION:** The name has not been trademark-searched or domain-verified. Treat as a working title. Verify availability before committing to branding assets.

---

## 3. Product essence

> **Flowvo keeps a trade business moving** — from the first enquiry to the final review — without the owner having to remember what to do next.

---

## 4. Positioning

> **For** solo and micro-team trade/service business owners in the 10–30 job/month range
> **who** are losing revenue and time to fragmented tools and manual admin
> **Flowvo** is a lightweight workflow tool
> **that** connects lead, quote, job, invoice, and review in one automated chain
> **unlike** Jobber or ServiceM8
> **because** it requires no configuration expertise and is priced for a business at this size, not for a growing team.

---

## 5. Brand personality

Five traits that must influence design decisions consistently:

| Trait | What this means in practice |
|---|---|
| **Dependable** | The product does what it says it will do. No surprises. Automated actions always confirmed. Invoice never sends without owner approval. |
| **Practical** | No decorative complexity. Every element earns its place. The interface shows what matters, not what looks impressive. |
| **Calm** | The owner is already in a fast-paced physical job. Flowvo does not add noise. Clear hierarchy. No red banners for non-urgent items. |
| **Direct** | Labels, buttons, and messages are literal and specific. "Send quote to James Miller" not "Proceed to next step". Status words are job words the owner already knows. |
| **Professional** | Flowvo-sent emails must look like they came from a real business. The product should not embarrass the owner in front of their customers. |

### Anti-personality (what this product must never feel like):
- Clever / tech-bro / startup
- AI-powered magic (no unexplained behaviour)
- Enterprise / corporate / intimidating
- Playful / casual (the owner's money is at stake)
- Over-designed / decorative

---

## 6. Product voice

### Tone
Direct, specific, plain English. No jargon. No filler phrases. No marketing speak inside the app.

### Voice principles

**In the app (UI copy):**
- Use the owner's language: job, quote, customer, invoice, payment — not "opportunity", "conversion", "pipeline stage"
- Name the action and the consequence: "Mark as complete — this will draft your invoice" not "Update status"
- Confirm automated actions explicitly: "Review request sent to Sarah Jones" not "Action complete"
- Errors are factual, not apologetic: "Invoice not sent — email address is missing" not "Oops! Something went wrong"
- Empty states give a clear next step: "No leads yet. Share your enquiry form link to get started."

**In automated customer emails (sent on behalf of the owner):**
- Warm and professional; reads like it came from the business owner personally
- Business name and job type always referenced
- Clear single action per email (accept quote / pay invoice / leave review)
- No Flowvo branding in customer-facing emails in MVP (white-label feel)

**What the product never says:**
- "AI-powered" anywhere
- "Seamless" or "effortless" or "easy" (let the product prove it)
- "Revolutionise" or "transform"
- Unsolicited advice or recommendations

---

## 7. Trust model

The owner is trusting Flowvo to communicate with their customers on their behalf. This is a high-trust act for a small business where every customer relationship matters.

**What the interface must communicate:**

| Signal | How |
|---|---|
| You are in control | Owner must confirm before any email is sent to customers; automated actions are always shown with explicit confirmation, not silent |
| It worked | Every automated action (acknowledgement sent, follow-up fired, review request sent) is confirmed in the interface immediately |
| Nothing sent by accident | Invoice approval checkpoint is mandatory; destructive actions require confirmation; no bulk sends |
| Your emails look professional | Preview of customer-facing emails before first send; business name appears in email sender name |
| The data is yours | Clear, simple data — no "insights" or AI-generated recommendations in MVP |
| It is predictable | Automated triggers are explained in plain English in settings: "Review request is sent when you mark an invoice as Paid" |

---

## 8. Brand anti-patterns

The following would make Flowvo feel wrong for this product and user:

| Anti-pattern | Why it is wrong for Flowvo |
|---|---|
| Dark mode as the default | Trade owners work across environments; light-first is more readable outdoors and in bright offices |
| Purple/blue gradient "AI look" | This product has no AI in MVP; that palette signals tech products to a tech audience — not to a plumber |
| Feature-led marketing ("5 powerful tools") | The product sells a chain, not features; marketing should mirror the workflow |
| Animated blobs / hero illustrations | Adds no meaning; makes the product look like a funded startup template |
| Passive dashboard (read-only metrics) | This user needs to act; the dashboard must surface next actions, not just statistics |
| Complex onboarding wizard | The product must reach automation within 10 minutes; onboarding must be the first workflow, not a setup form |
| Generic sans-serif everywhere | Typographic character should feel slightly more deliberate than a default UI kit |

---

## 9. Reference analysis (principles extracted, not copied)

### Reference 1: Jobber (operational field-service SaaS)
**Design character observed:** Functional, sidebar-navigated, action-dense dashboard. "Recommended Actions" are surfaced prominently — the product pushes the user toward the next step, not passive reading.
**Principle extracted:** An operational dashboard for a trade business owner should surface *what to do next*, not just *what has happened*. Passive dashboards fail trade users.
**Adaptation for Flowvo:** Surface stalled items (quote not accepted, invoice not confirmed) at the top of every view. The dashboard is a "today's actions" list, not a KPI chart.

### Reference 2: Category-standard operational SaaS (status chips, card-based list views)
**Design character observed:** Status badges are colour-coded with clear, short labels. Cards contain one primary action per card. Vertical list works better than Kanban on mobile.
**Principle extracted:** Status must be readable in two seconds. Every record should have a clear *one next action* associated with it.
**Adaptation for Flowvo:** Status chips use semantic colours (amber = action needed, green = complete, neutral = in progress). Each job/quote/invoice card shows exactly one primary action button.

### Reference 3: Wave (simple invoicing — the workaround status quo)
**Design character observed:** Very light, uncluttered. Minimal navigation. White space used generously. Feels approachable to a non-technical user.
**Principle extracted:** The target user responds well to visual calm. The risk is that calm becomes passive. Flowvo should be calm but never passive.
**Adaptation for Flowvo:** Light surface, generous spacing — but *action density* increases wherever work is stalled. Visual weight shifts toward the thing that needs doing.
