# MVP Specification

> Project state: **DISCOVERY → PRODUCT DEFINITION (hypothesis)**
> Last updated: 2026-09-27
>
> **Status:** This is a working hypothesis, not a validated spec. It is based on community/industry signal only — no direct user interviews have been conducted. Assumptions are labelled. Sections marked ASSUMPTION or HYPOTHESIS should be reviewed against user evidence before engineering begins.

---

## Value hypothesis

> **FOR** a solo or micro-team (1–5 person) trade/service business owner
> **WHO** loses jobs, cash, and reviews to fragmented manual admin processes
> **THE PRODUCT** connects the five most failure-prone workflow handoffs — lead to quote to job to invoice to review — in a single lightweight tool
> **BY** automating the transitions that currently depend on owner memory
> **SO THAT** the owner responds to leads faster, gets paid without manual chasing, and earns Google reviews without effort — without needing to learn complex field-service software

---

## Target user

**Primary user (HYPOTHESIS):**
Owner-operator of a small trade or service business.
Examples: plumber, electrician, HVAC technician, cleaner, landscaper, handyman.
Team size: 1–5 people. Typically solo or owner + 1–2 field workers.
Job volume: 10–30 jobs/month (sub-50 is the validated segment boundary from ServiceM8's free tier).
Tech comfort: moderate — smartphone-native, uses WhatsApp and basic apps, will not configure complex integrations.

**Who pays:** The business owner. No procurement chain. Personal, fast purchasing decision.

**Assumption to validate:** Whether the owner is the person who would set up and use the tool daily, or whether a part-time admin person runs the office side. This changes the UX complexity the product must handle.

---

## Core job

**HYPOTHESIS:** When a new enquiry arrives, the owner wants to respond instantly, convert it into a trackable job without re-entering data, get paid promptly on completion, and receive a Google review — without any of this depending on memory or manual effort between steps.

---

## Activation event

**HYPOTHESIS:** The owner has created their first lead, sent their first quote, and seen the automated follow-up fire — all within their first session. This is the earliest point at which the product demonstrates its core value proposition (the handoff automation, not just data entry).

**Assumption:** If the user's first session ends without experiencing at least one automated action, retention will be poor. The product must reach automation within the first 10 minutes of use.

---

## Primary workflow (the five handoffs — MVP scope)

This is the single coherent workflow the MVP must complete end-to-end:

```
LEAD ARRIVES
    ↓
[AUTO] Instant acknowledgement sent to customer (email or WhatsApp)
    ↓
Owner reviews lead → creates quote in app → sends to customer
    ↓
[AUTO] Quote follow-up reminder sent to customer after N days if no response
    ↓
Customer accepts → [AUTO] Job record created from quote data (no re-entry)
    ↓
Owner marks job complete
    ↓
[AUTO] Invoice drafted from job record and sent to customer
    ↓
Customer pays → [AUTO] Google review request sent via WhatsApp or email
    ↓
[FUTURE] Dormant lead reactivation (not in MVP)
```

**What makes this coherent:** Each step produces the next without manual data transfer. The value is in the chain, not any individual step.

---

## MVP features

### Must have

**Lead management**
- Lead capture form (embeddable or direct link — no integration required from customer side)
- Lead record: name, contact (phone/email), service type, brief description, date/source
- Instant automated acknowledgement on lead submission (email; WhatsApp as stretch goal for MVP)
- Lead status visible to owner: New / Contacted / Quoted / Won / Lost

**Quote creation and follow-up**
- Create a quote from a lead record — customer data pre-filled, no re-entry
- Quote line items: description, quantity, unit price, total (no complex job costing)
- Send quote to customer via email (PDF or formatted email)
- Automated follow-up reminder to customer after configurable delay (default: 3 days) if quote status is still Sent
- Owner can mark quote as Accepted or Declined

**Job record**
- When quote is accepted, job is created automatically from quote data
- Job record: customer, service description, quoted amount, scheduled date (manual entry), status
- Job status: Scheduled / In Progress / Complete
- Owner marks job complete from web app or mobile browser

**Invoice**
- When job is marked complete, invoice is automatically drafted from job record (customer, line items, amount)
- Owner reviews and confirms before send (approval checkpoint — no fully automatic send in MVP)
- Invoice sent to customer via email
- Invoice status: Draft / Sent / Paid / Overdue
- Owner can manually mark invoice as Paid (no payment gateway in MVP — see out of scope)

**Google review request**
- When invoice is marked Paid, automated review request sent to customer via email
- Request contains direct link to owner's Google Business Profile review page (owner configures this once in settings)
- One follow-up reminder after 4 days if no action (no click tracking in MVP — follow-up is time-based)

**Owner account and settings**
- Single-user account (one business, one login — no team management in MVP)
- Business name, contact, Google review link
- Email address for outgoing messages (configurable reply-to)
- Basic branding: business name on emails

**Dashboard / job status view**
- Simple list view of all active jobs with current status
- Overdue invoices surfaced prominently
- Leads awaiting action surfaced prominently

### Explicitly out of scope for MVP

- WhatsApp Business API integration (high complexity; use email first; WhatsApp is v2 if signal validates it)
- Online payment gateway / Stripe integration (adds compliance, webhook handling, card fee UX decisions — defer)
- Automatic invoice send without owner approval (risk of billing errors; approval checkpoint is safer and builds trust)
- Team / multi-user accounts (adds role management complexity; solo user is the target)
- Scheduling / calendar / dispatching (not the product wedge; Jobber already does this)
- GPS / location tracking
- Time tracking / job costing
- QuickBooks / Xero / accounting integration (important eventually; not in MVP)
- Customer portal (customer-facing status tracking)
- Dormant lead reactivation (genuinely valuable; not in minimum coherent workflow)
- AI-generated quotes or pricing suggestions
- SMS (outside WhatsApp) — regulatory complexity per market; email first
- Mobile native app (iOS/Android) — web-responsive is sufficient for MVP

---

## Core entities

| Entity | Key fields | Notes |
|---|---|---|
| **Lead** | id, customer_name, phone, email, service_type, description, source, status, created_at | Status: new / contacted / quoted / won / lost |
| **Quote** | id, lead_id, line_items[], total, status, sent_at, follow_up_sent_at, accepted_at | Status: draft / sent / accepted / declined |
| **Job** | id, quote_id, customer_name, description, amount, scheduled_date, status, completed_at | Status: scheduled / in_progress / complete |
| **Invoice** | id, job_id, line_items[], total, status, sent_at, paid_at | Status: draft / sent / paid / overdue |
| **ReviewRequest** | id, invoice_id, sent_at, reminder_sent_at | Triggered on invoice marked paid |
| **Business** (owner account) | id, name, email, google_review_url, reply_to_email | One per account in MVP |

---

## Critical states every workflow step must handle

| State | Required behaviour |
|---|---|
| First-time / empty | Owner sees guided prompt, not a blank dashboard; clear call to action: "Add your first lead" |
| Loading | Inline indicators on async actions (quote send, invoice send); no spinner-blocking full pages |
| Success | Confirmation that automated action fired (e.g. "Acknowledgement sent to customer") |
| Validation error | Inline, field-level errors before any send action; never send a half-formed quote or invoice |
| Email delivery failure | Owner notified that an automated email failed to send; manual fallback prompted |
| Invoice approval checkpoint | Owner must confirm invoice before it sends — never silently sends |
| Overdue invoice | Surface prominently; provide one-click re-send reminder action |
| Review link not configured | Block review request from firing; prompt owner to add their Google review URL |
| Session expired | Redirect to login without losing current form data where possible |
| Mobile / small screen | All critical owner actions (mark job complete, approve invoice) must work on a phone browser |

---

## MVP success metric

HYPOTHESIS — to be defined with measurable targets after the first real users are onboarded:

**Primary signal:** Does a user who creates their first lead complete at least one full cycle to invoice within their first 14 days? (Activation + workflow completion)

**Secondary signals:**
- Time from lead creation to first quote sent (ideally < 10 minutes)
- Percentage of jobs that result in an invoice without owner manually chasing themselves
- Percentage of paid invoices that trigger a review request without owner intervention

**What failure looks like:** Owner creates leads but quotes are drafted and never sent; or jobs are created but invoices sit as drafts. If the pipeline stalls at any single step consistently, that step is the friction point to fix.

---

## Assumptions that would change this spec

| Assumption | If wrong, the spec changes as follows |
|---|---|
| ASSUMPTION: The solo owner is the primary user of the web app | If an admin/receptionist is the user, the UX complexity and fields change significantly |
| ASSUMPTION: Email is a sufficient channel for automated messages in MVP | If WhatsApp is the only channel owners trust for trade communications, MVP must include WhatsApp Business API despite its complexity |
| ASSUMPTION: Owners will accept an approval checkpoint before invoice send | If owners want fully automatic invoicing, the approval step can be made optional — but this increases billing error risk |
| ASSUMPTION: The five handoffs are each valuable enough to justify the chain | If only one or two handoffs matter to most users (e.g. just the invoice + review), the MVP could be narrower |
| ASSUMPTION: £20–£60/month is a plausible price point | If owners resist any subscription and prefer one-time setup, SaaS delivery model is wrong |
| ASSUMPTION: Web-responsive is sufficient; no native app needed | If owners need to mark jobs complete in the field without reliable internet, a PWA or offline capability becomes relevant |

---

## Risks

| Risk | Severity | Mitigation in MVP |
|---|---|---|
| Email deliverability — owner's business emails land in customer spam | High | Use a reputable transactional email provider (Resend/SendGrid); allow custom reply-to; clear sender identity |
| Google review link misconfiguration | Medium | Validate URL format on save; show a test link; block review request if link is missing |
| User abandons mid-workflow (quote never sent, invoice never confirmed) | High | Surface stalled items prominently on dashboard; send owner digest of outstanding actions |
| Scope creep into scheduling/dispatching features | High | Non-goals list is explicit; any scheduling request is deferred to a later milestone |
| ServiceM8 free tier already solves enough for the target user | High (unresolved) | This is the critical unknown; differentiation must be demonstrated in user interviews before engineering |
| SaaS delivery model rejected in favour of done-for-you service preference | Medium | Could pivot to productised service or hybrid; SaaS spec is a working hypothesis |

---

## What must be true before engineering begins

The following must be confirmed by at least 3 user conversations or a structured substitute before serious implementation:

1. ☐ At least one real trade/service business owner has described the five-handoff problem in their own words
2. ☐ At least one has articulated a specific, recent incident where a handoff failed and cost them money or time
3. ☐ At least one has confirmed they are not already fully satisfied by ServiceM8's free tier or equivalent
4. ☐ A plausible price point has been named by the user, not assumed by the product team
5. ☐ The delivery model (SaaS subscription vs. one-time setup) has been explored, not assumed
