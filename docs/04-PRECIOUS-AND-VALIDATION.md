# PRECIOUS + Validation

> Project state: **DISCOVERY**
> Last updated: 2026-09-27

---

## P — Problem

Small trade and service businesses (plumbers, electricians, HVAC, cleaners, landscapers, handymen) run recurring multi-step workflows — enquiry → quote → job → invoice → payment — but these steps are fragmented across WhatsApp messages, email inboxes, phone calls, spreadsheets, and disconnected apps. The critical failure modes are:

- **Leads go unanswered** for hours or days while the owner is on-site doing physical work.
- **Quotes are sent and never followed up**, so jobs are lost silently with no record.
- **Job completion does not automatically trigger an invoice** — invoicing depends on the owner remembering to do it later.
- **Payment chasing is manual and emotionally difficult**, so late invoices sit uncollected.
- **Google review requests are never sent**, so the business misses reputation compounding.
- **Past customers are never reactivated** — no systematic way to surface dormant leads.

INTERPRETATION: The problem is not that tradespeople lack tools. It is that no single lightweight tool connects the full handoff chain without demanding significant configuration or commitment to a full field-service platform.

---

## R — Repetition

FACT (qualitative, community evidence): Every job a trade business takes involves this full cycle. A business doing 10–50 jobs/month runs the workflow 10–50 times per month. Every job is a potential failure point.

ASSUMPTION: A solo or micro-team (1–3 people) doing 15–30 jobs/month would experience 5–15 workflow failure events per month — missed follow-ups, forgotten invoices, or skipped review requests.

---

## E — Economic cost

INTERPRETATION (from community and industry evidence):

- **Lost leads from slow response**: A missed lead at £200–£500 average job value is a meaningful direct cash loss per incident.
- **Uncollected / delayed invoices**: For a business invoicing £5,000–£20,000/month, even 2-week delays on 20% of invoices represents material cash flow impact.
- **Missing Google reviews**: Reviews are the primary conversion mechanism for local trade businesses (Google Local Pack). Each missed review compounds over time.
- **Admin time cost**: Estimated 5–10+ hours/week of non-billable admin. At £30–£50/hour opportunity cost, that is £150–£500/week lost to admin that is not billable work.

UNKNOWN: No direct interviews have been conducted. These are interpretations from industry content and community signal, not measured individual user data.

---

## C — Current workaround

FACT (community signal): Most micro trade businesses use one of these stacks:

1. **WhatsApp + Google Calendar + manual invoicing** (Wave, PDF, or handwritten)
2. **Email + spreadsheet for tracking + accounting software** (QuickBooks / FreeAgent / Xero)
3. **A field service tool (Jobber, ServiceM8) configured only partially**, with most automation unused because setup complexity is high

INTERPRETATION: The most common workaround is fragmented tooling + owner memory. Tasks fall through the gap between tools, not because the tools are wrong, but because there is no glue connecting them without custom setup.

---

## I — Incentive

Why would the user/buyer change?

ASSUMPTION (strong): The incentive is primarily **cash flow and time recovery**. Missing follow-ups, slow invoicing, and uncollected payment directly reduce take-home income. This is not a comfort improvement — it is a revenue and margin issue.

Secondary incentive: **reputation**. A Google review gap directly harms the ability to win new business from local search.

Likely switching trigger: owner loses a visible job to a faster-responding competitor, or realises they are spending Sunday evenings on admin that the system should handle.

ASSUMPTION: Willingness to pay is real but price-sensitive. Monthly subscription of £20–£60/month is plausible; £100+ requires a strong visible ROI case.

---

## O — Opportunity

Where could software create disproportionate value?

1. **Automated lead acknowledgement** — instant WhatsApp/SMS on enquiry before the owner is free to reply. Disproportionate: turns a response delay into a professional first impression.

2. **Quote-to-job handoff without re-entry** — once a quote is accepted, the job record carries forward automatically. Disproportionate: eliminates the most common source of re-entry error and delay.

3. **Job-complete → invoice trigger** — marking a job done automatically drafts or sends an invoice. Disproportionate: closes the most common invoicing gap without relying on owner memory.

4. **Automated Google review request** — sent via WhatsApp/SMS after payment confirmed. Disproportionate: review accumulation is exponential in local SEO; each review compounds future lead volume.

5. **Dormant lead reactivation** — periodic nudges to leads that went quiet. Disproportionate: no existing lightweight tool surfaces these without manual list management.

**Product wedge hypothesis (HYPOTHESIS):** Existing platforms (Jobber, ServiceM8, Housecall Pro: £39–£199+/month) solve this space but require significant configuration, ongoing management, and have complex feature surfaces that overwhelm a solo owner. The opportunity is a **narrowly scoped, workflow-first product that automates the five highest-failure handoffs without requiring the owner to become a software administrator**.

---

## U — User

**Who experiences the problem:**
Owner-operator of a small trade or service business: plumber, electrician, HVAC technician, cleaner, landscaper, handyman.
Team size: 1–5 people (typically solo or owner + 1–2 staff).
Volume: 10–50 jobs/month.
Tech comfort: moderate — uses smartphone, WhatsApp, and basic apps, but unlikely to configure complex CRM integrations.

**Who pays:** The business owner directly. No procurement or approval chain. Payment decision is personal and fast.

**Who approves:** Same person. Single decision-maker.

**Geography note (INTERPRETATION):** The source signal is UK-context. The problem is structurally global (the same workflow fragmentation exists across markets). Regional differences in preferred communication channel (WhatsApp vs SMS) and payment rail matter for implementation, not product validity.

---

## S — Solution

**Smallest product that could solve the core problem:**

A workflow-first web application that connects the five critical handoffs:

1. Lead captured → instant acknowledgement sent (WhatsApp/email)
2. Quote created in the app → sent to customer → follow-up scheduled automatically
3. Quote accepted → job record created with no re-entry
4. Job marked complete → invoice drafted and sent automatically
5. Invoice paid → Google review request sent via WhatsApp/SMS

**What it is not:**
- A full field service management platform with scheduling, dispatching, GPS, time-tracking
- A replacement for QuickBooks or Xero (accounting stays external)
- A general CRM

**Value hypothesis (draft, HYPOTHESIS):**

> FOR a solo or micro-team trade/service business owner
> WHO is losing jobs, cash, and reviews to fragmented manual processes
> THE PRODUCT automates the five most failure-prone workflow handoffs
> BY connecting lead capture → quote → job → invoice → review in one lightweight tool
> SO THAT the owner does less non-billable admin, gets paid faster, and compounds their Google reputation without learning new software

---

## Validation evidence

| Evidence | Source | Date | What it supports | What it does not prove |
|---|---|---|---|---|
| Community discussion confirms tradespeople find Jobber "overkill" or too expensive for small volume | Reddit (multiple threads, community content) | 2024–2025 | A gap exists between spreadsheets and full FSM platforms | Exact size of the addressable segment |
| Industry content confirms missed follow-up and forgotten invoicing are primary pain points | Industry trade/SaaS content sites | 2024–2025 | Problem is real and widely acknowledged | Individual user magnitude — not yet measured |
| ServiceM8 free tier (30 jobs/month) exists, confirming sub-50-job/month segment is real and actively served | ServiceM8 pricing page | 2026 | Competitors see small volume as a viable entry point | Whether these users want a different type of product |
| Airtable + n8n "lead-to-cash" template demand exists on Upwork and automation communities | Source Upwork brief; automation community content | 2026 | Manual workflow integration need exists; some operators pay for it | Whether a SaaS product beats a done-for-you service for this segment |
| Google review request via SMS/WhatsApp is a confirmed, in-demand automation for local trade businesses | Multiple review automation tools + Jobber/OctopusPro built-in features | 2026 | Feature is valued and in use; not novel | Willingness to pay for it as standalone vs. bundled |

---

## Decision

**CONTINUE DISCOVERY → move to user interview design**

**Reason:**

The problem signal is coherent and consistent across multiple community and industry sources. The workflow hypothesis (five handoffs that fail without automation) is structurally sound. Existing alternatives are either too expensive/complex (Jobber, Housecall Pro) or too narrow (review-only, invoice-only tools). A plausible product wedge exists.

**What is not yet established:**
- No direct user interviews conducted. All evidence is second-hand or interpretive.
- The buying trigger (what pushes a specific owner to switch from their current workaround) is assumed, not confirmed.
- Whether a SaaS product or a done-for-you automation setup is the right delivery model is unresolved.
- The exact smallest workflow that produces enough value for first retention is unconfirmed.

**Build gate is NOT yet satisfied.** Direction is clear enough to design discovery conversations — not to start building.

**Immediate next action:** Draft 5–8 focused user interview questions targeting trade business owners. Conduct 3–5 conversations before making MVP scope decisions.
