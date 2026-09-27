# Engineering Readiness Review — Flowvo

> Project state: **PRODUCT DEFINITION → PRE-ENGINEERING**
> Last updated: 2026-09-27
> Sources: docs/05-MVP-SPEC.md, docs/DESIGN.md, docs/PRODUCT-BRAND.md, docs/03-COMPETITOR-RESEARCH.md
>
> **Label conventions used throughout this document:**
> - **FACT** — confirmed, not debatable at this stage
> - **DECISION** — a deliberate product/engineering choice already logged
> - **ASSUMPTION** — believed to be true but not yet validated by evidence
> - **UNKNOWN** — genuinely unresolved; must be answered before or during implementation
> - **DEPENDENCY** — a third-party or external factor the product relies on

---

## 1. Application architecture

### What must be built

The MVP is a web-based, multi-screen operational tool with a persistent sidebar navigation (desktop), a bottom tab bar (mobile), and a server-side component to handle automated email dispatch, scheduled follow-ups, and event-triggered actions.

**DECISION:** Web-first (not native iOS/Android). Progressive web app behaviour (offline caching) is out of MVP scope. Web-responsive is the required minimum.

**FACT:** The product has two distinct runtime contexts:
1. **Owner-facing web app** — the authenticated dashboard and workflow screens
2. **Customer-facing email delivery** — automated emails sent on behalf of the owner (not a customer-facing web interface in MVP)

**FACT:** There is no customer login, no customer portal, and no customer-facing interactive UI in MVP.

### Proposed architecture

```
[Browser — Owner web app]
        ↕ HTTPS
[Application server — Next.js]
    ├── API routes (REST or tRPC) — workflow actions, CRUD, status transitions
    ├── Server-side rendering (SSR) — initial page loads, SEO for landing page
    └── Background jobs / queue — scheduled follow-ups, email triggers
        ↕
[PostgreSQL database]
        ↕
[Transactional email provider — Resend or SendGrid]
```

**ASSUMPTION:** Next.js (App Router) is the right framework. It provides SSR, API routes, and is deployable to Vercel or a VPS with minimal configuration. **DECISION required** before implementation: confirm deployment target, which determines whether Vercel serverless or a persistent Node.js process is the right host for background jobs.

**UNKNOWN:** Background job execution model. Serverless Vercel functions do not support persistent workers or cron jobs natively. Options:
- Vercel Cron (limited to 1-minute minimum interval — sufficient for quote follow-up checks)
- A separate worker process on a VPS
- A managed queue (BullMQ on Redis, Inngest, Trigger.dev)
This must be decided before the implementation plan, as it affects the entire automation layer.

**ASSUMPTION:** No microservices in MVP. A single Next.js app with API routes is sufficient for the expected scale (sub-1,000 active users in the first year).

---

## 2. Data model

### Entities (from MVP spec — confirmed)

| Entity | Primary purpose | Key status field |
|---|---|---|
| **Business** | Owner account (one per account in MVP) | — |
| **Lead** | Inbound enquiry record | new / contacted / quoted / won / lost |
| **Quote** | Quote sent to customer, created from lead | draft / sent / accepted / declined |
| **Job** | Work to be done, auto-created from accepted quote | scheduled / in_progress / complete |
| **Invoice** | Billing document, auto-drafted from completed job | draft / sent / paid / overdue |
| **ReviewRequest** | Automated review prompt, triggered on invoice paid | — (sent_at / reminder_sent_at) |

**FACT:** The entities form a linear chain. Each record is created from the previous. This means foreign key relationships are strictly one-directional in MVP:
```
Business → Lead → Quote → Job → Invoice → ReviewRequest
```

**DECISION:** No multi-tenancy between businesses. In MVP, one database account = one Business. Row-level security (RLS) is not required for v1 since there are no shared tables between businesses. **ASSUMPTION:** This remains true; revisit when team/multi-user accounts are introduced.

### Data constraints and rules

- A Lead may have at most one Quote in MVP (no quote revisions or competing quotes for same lead)
- A Quote may have at most one Job (one-to-one in MVP; future: one lead → multiple quotes)
- A Job may have at most one Invoice in MVP
- An Invoice may have at most one ReviewRequest

**UNKNOWN:** What happens when a quote needs to be revised? The MVP spec does not define quote versioning. This must be clarified before engineering the Quote entity — either quotes are replaced/overwritten, or a version number is introduced.

**UNKNOWN:** What happens when a customer pays partially? The MVP spec says "mark invoice as Paid" (manual). No partial payment state is defined. Must decide: is there a "partially paid" status or not?

### Line items

Quote and Invoice each contain an array of line items (description, quantity, unit price, total).

**DECISION:** Line items stored as JSONB in PostgreSQL (not a separate normalised table in MVP). This simplifies the data model and avoids join complexity for a small line item count. **ASSUMPTION:** Line item count per invoice stays under 20 in the target segment. If job costing features are added later, this will need normalisation.

**ASSUMPTION:** Currency is fixed to GBP in MVP. Internationalisation (currency, locale, VAT rules) is a v2 concern. Must be confirmed — if the first users are outside the UK, this assumption breaks.

---

## 3. Authentication and authorisation

**DECISION:** Single-user account. One login per Business. No team roles in MVP.

**FACT:** All routes and API endpoints must be protected behind authentication. Unauthenticated requests return 401. The only unauthenticated surface in MVP is:
- The lead capture form (public — accepts submissions without requiring the customer to log in)
- The landing/marketing page

**ASSUMPTION:** Email/password authentication is sufficient for MVP. Social login (Google OAuth) is a quality-of-life addition — worthwhile but not required to launch.

**DEPENDENCY:** Authentication library required. Options:
- **NextAuth.js (Auth.js v5)** — FACT: well-supported with Next.js App Router; handles sessions via JWTs or database sessions
- **Clerk** — managed auth service; faster to implement, adds a vendor dependency and monthly cost
- **Lucia Auth** — lightweight, database-session based; less vendor lock-in

**UNKNOWN:** Session persistence model. If the owner uses the app on both a desktop and a phone, session continuity must work across devices. Database sessions (not JWT-only) are required for this. Must be decided before implementing auth.

**ASSUMPTION:** Password reset via email link is required at launch. Without this, any owner who loses access to their account is permanently locked out.

**FACT:** The lead capture form endpoint must be rate-limited and protected against spam submissions (form bots). Even without login, the endpoint writes to the database and triggers an email. A CSRF token or signed form token is required.

---

## 4. Integrations

### Email (DEPENDENCY — required for MVP)

**FACT:** Automated email is the core automation mechanism. Without a transactional email provider, the product cannot deliver its primary value.

**Decision required:** Provider selection. Candidates:

| Provider | Free tier | Key advantage | Risk |
|---|---|---|---|
| **Resend** | 100 emails/day, 3,000/month | Modern API, great DX, Next.js native | Smaller ecosystem; newer |
| **SendGrid** | 100 emails/day free | Mature, high deliverability, trusted | More complex setup; Twilio acquisition concerns |
| **Postmark** | Trial only (no permanent free tier) | Best deliverability for transactional | Cost starts immediately |

**ASSUMPTION:** Resend is the preferred choice for MVP (Next.js ecosystem fit, simple API). Must be confirmed before implementation.

**FACT:** The product sends emails on behalf of the owner's business. This means:
- The "From" name must be the business name (e.g., "Dave's Plumbing")
- The reply-to must be the owner's email address
- The sending domain must be authenticated (SPF, DKIM) — otherwise emails land in spam
**UNKNOWN:** Does the owner need to set up their own sending domain (custom domain authentication), or does the product send from a shared Flowvo-verified domain (e.g., `noreply@mail.flowvo.app`) with the owner's business name in the "From" field? **This is a significant UX and trust question.** Custom domain authentication requires DNS access — many trade owners will not know how to do this. A shared sending domain is simpler to launch but may reduce trust signal for the customer receiving the email.

**DEPENDENCY:** Sending domain must be verified with the provider before the first email is sent. If on a shared domain, Flowvo's domain must be verified once. If per-customer domain, each new user needs a setup step.

### Google Business Profile (DEPENDENCY — required for review request feature)

**FACT:** The review request feature requires the owner to provide their Google Business Profile review link. Flowvo stores this link and appends it to the automated review request email.

**FACT:** No OAuth integration with Google is required in MVP. The owner manually copies their review link into Settings. This is deliberate — Google's API for review management has restricted access.

**DEPENDENCY:** The owner's Google Business Profile must be set up and they must know how to find their review link. **ASSUMPTION:** Most trade business owners in the target segment have a Google Business Profile, as it is the most common source of customer reviews for local trade businesses. This is unvalidated.

**DECISION:** Validate the Google review URL format on save (must match `g.page/` or `maps.google.com/` patterns). Show a test link. Block the review request from firing if the link is not configured or fails format validation.

### No other integrations in MVP

**FACT (from MVP spec):** The following are explicitly out of scope:
- WhatsApp Business API
- Stripe / payment gateway
- QuickBooks / Xero
- Google Calendar
- SMS

---

## 5. Automation layer

This is the most architecturally significant part of the MVP. The product's core value proposition is automated handoffs — and these require a reliable, observable job execution system.

### Automation events required

| Trigger | Event | Automated action | Timing |
|---|---|---|---|
| Lead submitted via form | Lead created | Send acknowledgement email to customer | Immediate (< 5 seconds) |
| Quote sent by owner | Quote status = Sent | Schedule follow-up reminder | +3 days (configurable) if status still Sent |
| Quote accepted | Quote status = Accepted | Create Job record from Quote data | Immediate |
| Job marked complete | Job status = Complete | Draft Invoice from Job data | Immediate |
| Invoice sent by owner | Invoice status = Sent | — (no automation on send in MVP) | — |
| Invoice marked Paid | Invoice status = Paid | Send review request email to customer | Immediate |
| Review request sent | ReviewRequest created | Schedule review reminder | +4 days if no follow-up sent yet |

**FACT:** There are two categories of automation:
1. **Immediate** — fires synchronously or near-synchronously when a status transitions
2. **Scheduled** — fires after a delay; requires a persistent job queue or cron mechanism

**UNKNOWN (critical):** Execution model for scheduled jobs. This must be resolved first:

- **Option A — Vercel Cron + database polling:** A cron function runs every N minutes, queries the database for due jobs (e.g., quotes where status=Sent AND sent_at < NOW() - 3 days AND follow_up_sent_at IS NULL), and fires the emails. Simple to implement; no external queue dependency. Latency: up to N minutes after deadline.
- **Option B — Managed queue (Inngest / Trigger.dev / BullMQ + Redis):** On status transition, enqueue a delayed job. More precise timing; more complex infrastructure; adds a vendor dependency or a Redis instance.

**DECISION required before implementation:** For MVP scale and the nature of the delays (days, not seconds), Option A (Vercel Cron + database polling) is likely sufficient and simpler. Must be confirmed. Recommend confirming this as the MVP implementation approach.

**ASSUMPTION:** Owners will not require sub-minute precision on follow-up timing. A follow-up that fires at "3 days and 15 minutes" rather than exactly 3 days is acceptable.

**FACT:** Every automated action must:
- Be logged to a `automation_events` or `activity_log` table (what fired, when, to whom, result)
- Display a confirmation to the owner in the UI (toast or dashboard item)
- Surface failures to the owner immediately (not silently fail)

**ASSUMPTION:** There is no retry logic for failed emails in MVP beyond surfacing the failure to the owner. A manual resend mechanism must exist. Automatic retry is a v2 concern.

---

## 6. Analytics and observability

**DECISION:** No third-party analytics in MVP (no Google Analytics, no Mixpanel). The product is not yet at the scale where complex funnel analytics are needed.

**FACT:** The following must be logged internally to a database table (not third-party) to measure the MVP success metrics defined in docs/05-MVP-SPEC.md:

| Event | Why it must be logged |
|---|---|
| Lead created | Measure activation rate |
| Quote sent (time delta from lead created) | Measure lead-to-quote time |
| Invoice sent | Measure workflow completion |
| Invoice marked Paid | Measure payment completion |
| Review request sent | Measure end-to-end chain completion |
| Email delivery failure | Measure email reliability |
| Automation job fired (each) | Observe automation health |

**ASSUMPTION:** A simple `activity_log` table with (business_id, entity_type, entity_id, event_type, occurred_at, metadata JSONB) is sufficient for MVP observability. No real-time dashboard needed for the owner in MVP — this feeds internal product monitoring only.

**UNKNOWN:** Does the owner need to see a history of automated actions in the UI? For example, "Flowvo sent a follow-up to James Miller on 24 September at 10:02am." This is a trust feature, not a metrics feature. If owners feel the product is doing things invisibly, trust breaks. **Recommend:** A simple "Activity" section on each record's detail view showing key automated events. Must be confirmed as in-scope before engineering begins.

---

## 7. Security

### Authentication surface
**FACT:** All API routes must check session validity on every request. Unauthenticated requests must return 401, never 403 (which would reveal that the resource exists). No API keys or public endpoints except the lead capture form endpoint.

### Lead capture form
**FACT:** The lead form is the only public write endpoint. It must be protected against:
- Spam submissions (rate limiting by IP — e.g., max 5 submissions per IP per hour)
- Bot submissions (honeypot field, CSRF token, or Cloudflare Turnstile — not Google reCAPTCHA in MVP due to GDPR concerns)

**ASSUMPTION:** Cloudflare Turnstile (free, privacy-friendly) is the preferred spam protection mechanism. Must be confirmed.

### Data isolation
**FACT:** Every database query must be scoped by `business_id`. A query that omits the business scope would allow one owner to read another owner's customer data. This must be enforced at the repository/query layer, not just at the route level.

**ASSUMPTION:** Row-level security in PostgreSQL (using Supabase RLS or manual WHERE scoping) is not required in MVP since authentication is server-side (no direct client-to-database connection). Must be revisited if a client-side query layer (e.g., Supabase client library) is ever exposed to the browser.

### Data at rest
**FACT:** The database must store customer PII (name, email, phone). This requires:
- Encrypted database at rest (standard with managed PostgreSQL providers — Supabase, Neon, Railway)
- No PII in logs (customer names and emails must not appear in application log output)
- A privacy policy statement (UNKNOWN: is a GDPR-compliant privacy policy required at MVP launch? ASSUMPTION: Yes, if any EU customers use the product.)

### Email security
**FACT:** Sending domain authentication (SPF, DKIM, DMARC) is required to avoid spam filtering. This is a configuration task, not a code task, but it must be completed before the first email sends.

**UNKNOWN:** Does the product need to comply with CAN-SPAM / PECR at launch? The automated emails are transactional (not marketing), which significantly reduces compliance burden. However, the review request email is borderline — it is triggered by a commercial transaction but asks for a commercial favour (the review). **Recommend:** Include an "unsubscribe from review requests" mechanism in the review email to stay clearly on the safe side of PECR. This is a small implementation effort with significant legal risk mitigation.

---

## 8. Testing

**DECISION:** The following test types are required before the first real user is onboarded:

### 1. Unit tests — automation trigger logic
The state machine logic (what fires when a status transitions) is the highest-risk code in the product. A bug here can cause:
- An email sent to the wrong customer
- An invoice sent before the owner approved it
- A review request sent before the job is actually paid

**FACT:** Each status transition handler must have unit tests covering:
- Happy path (correct status → correct action fires)
- Guard conditions (action does not fire if prerequisite not met — e.g., review link not configured)
- Idempotency (running the same transition twice does not send two emails)

### 2. Integration tests — email dispatch
**FACT:** Email sending must be tested against the provider's sandbox/test mode before any live email is sent. Resend and SendGrid both support test mode.

### 3. End-to-end tests — the full workflow chain
**ASSUMPTION:** Playwright is the appropriate E2E test tool for a Next.js app.

Key E2E test scenarios:
- Lead created → acknowledgement fires → quote created → quote sent → follow-up scheduled
- Quote accepted → job auto-created → job marked complete → invoice drafted
- Invoice approved and sent → invoice marked paid → review request fires
- Overdue invoice surfaces on dashboard
- Email delivery failure surfaces on dashboard

### 4. Mobile/responsive smoke test
**FACT:** Every critical action (mark job complete, approve invoice) must be tested on a real mobile browser before launch. Not just browser DevTools mobile mode.

**UNKNOWN:** Whether to use a device testing service (BrowserStack, Sauce Labs) or rely on physical devices. For MVP scale, physical device testing (a real Android and real iPhone) is sufficient.

---

## 9. Deployment

**ASSUMPTION:** Vercel is the deployment target for the Next.js app. This is the lowest-friction option for a Next.js project and covers CI/CD, preview deployments, and HTTPS automatically.

**DEPENDENCY:** A managed PostgreSQL provider is required. Options:

| Provider | Free tier | Notes |
|---|---|---|
| **Neon** | Generous free tier | Serverless PostgreSQL, excellent Vercel integration |
| **Supabase** | Free tier | PostgreSQL + built-in auth + storage; more than needed but no cost |
| **Railway** | $5/month minimum | Simple, predictable pricing; supports persistent workers |
| **PlanetScale** | No free tier (deprecated) | Not recommended |

**ASSUMPTION:** Neon is the preferred database provider for MVP due to Vercel integration and generous free tier. Must be confirmed.

**FACT:** Environment variables required before first deployment:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — session secret
- `NEXTAUTH_URL` — canonical app URL
- `RESEND_API_KEY` (or equivalent) — email provider API key
- `EMAIL_FROM_DOMAIN` — the sending domain for automated emails

**UNKNOWN:** Whether a staging/preview environment is required before production. Vercel's preview deployments (per branch) partially address this. A separate staging database would add complexity but reduce the risk of automation jobs firing against real customer data during testing. **Recommend:** Separate staging database from day one. Staging automation jobs should send to a fixed test email address, not to real customer addresses.

**FACT:** Database migrations must be managed with a schema migration tool (Prisma Migrate or Drizzle Kit). Schema changes must never be applied directly to a production database without a migration file. **DECISION required:** ORM selection — Prisma or Drizzle. Both are compatible with Next.js and Neon/Supabase. Drizzle is lighter; Prisma has better type generation. Recommend Prisma for MVP (better onboarding documentation, larger ecosystem).

---

## 10. Failure states (product-level)

These are the failure modes that engineering must handle explicitly — not infrastructure failures, but user-facing failures within the normal product workflow.

| Failure | Detection | User-facing response | Engineering requirement |
|---|---|---|---|
| Lead form submitted, acknowledgement email fails to send | Email provider returns error | Dashboard alert: "Acknowledgement to [customer] failed — resend manually" | Log failure, surface to dashboard, provide manual resend action |
| Quote follow-up scheduled but never fires (job queue failure) | Cron job monitoring | Dashboard alert: "Follow-up to [customer] may be overdue" | Monitoring on cron execution; alert if cron has not run in expected window |
| Quote accepted, job auto-creation fails | Database error | Error toast: "Job could not be created automatically — create manually from this quote" | Transaction rollback; surface to owner; prevent data inconsistency |
| Invoice drafted from job, line items missing | Job record incomplete | Validation block: "Invoice cannot be drafted — job description is incomplete" | Pre-flight check before draft creation; surface specific missing field |
| Invoice sent, email bounces | Email provider bounce webhook | Dashboard alert: "Invoice email to [customer] bounced — check email address" | Inbound webhook handler from email provider for bounce events; update invoice delivery status |
| Review request fires but Google link not configured | Application-level guard | Block: do not fire; prompt in Settings: "Add your Google review link to enable review requests" | Guard check before any ReviewRequest is created; surface in Settings as incomplete setup |
| Owner session expires mid-form | Auth middleware | Redirect to login with form data preserved where possible (localStorage save) | Session-aware form state persistence |
| Database connection failure | Server error | 503 page with "Please try again in a moment" | Health check endpoint; proper Next.js error boundary |
| Email provider API is down | Provider outage | Queue the email; retry when provider is back (or surface to owner for manual send) | ASSUMPTION: In MVP, surfacing to owner is acceptable. Retry queue is v2. |

---

## 11. Open engineering decisions — must be resolved before implementation plan

The following are blockers. Each must be answered to write an implementation plan.

| # | Decision needed | Options | Impact |
|---|---|---|---|
| 1 | **Background job execution model** | Vercel Cron + DB polling vs. managed queue (Inngest/Trigger.dev) | Affects entire automation architecture |
| 2 | **Authentication library** | NextAuth.js v5 vs. Clerk vs. Lucia | Affects session model, implementation complexity |
| 3 | **ORM selection** | Prisma vs. Drizzle | Affects schema management, type generation, migration workflow |
| 4 | **Database provider** | Neon vs. Supabase vs. Railway | Affects deployment topology and cost |
| 5 | **Sending domain model** | Shared Flowvo domain vs. per-owner custom domain | Affects email trust, onboarding complexity |
| 6 | **Staging environment** | Vercel preview + shared staging DB vs. fully isolated staging | Affects test safety and release confidence |
| 7 | **Quote revision model** | Overwrite existing quote vs. version-numbered quotes | Affects data model before first migration |
| 8 | **Activity log visibility** | Internal only vs. visible to owner per-record | Affects scope; if owner-visible, adds a UI screen |
| 9 | **Unsubscribe mechanism in review emails** | Required (PECR caution) vs. deferred | Legal risk; small implementation effort |
| 10 | **Currency and locale** | GBP-only MVP vs. configurable | Affects data model (amount stored as integer pence vs. decimal with currency code) |

---

## 12. Recommended engineering stack (summary for implementation plan)

These are recommendations, not final decisions. Each marked **ASSUMPTION** should be confirmed before the implementation plan is written.

| Layer | Recommended choice | Type |
|---|---|---|
| Framework | Next.js 14+ (App Router) | DECISION |
| Language | TypeScript | DECISION |
| Database | PostgreSQL via Neon | ASSUMPTION |
| ORM | Prisma | ASSUMPTION |
| Auth | NextAuth.js v5 (Auth.js) | ASSUMPTION |
| Email | Resend | ASSUMPTION |
| Styling | Tailwind CSS + CSS custom properties (design tokens) | ASSUMPTION |
| Background jobs | Vercel Cron + database polling | ASSUMPTION |
| Deployment | Vercel | ASSUMPTION |
| E2E testing | Playwright | ASSUMPTION |
| Unit testing | Vitest | ASSUMPTION |
| Spam protection | Cloudflare Turnstile | ASSUMPTION |
| Monitoring | Vercel Analytics (basic) + internal activity_log table | ASSUMPTION |
| Migrations | Prisma Migrate | ASSUMPTION |

**No AI features in MVP.** The word "AI" does not appear in any recommended component. Every automated action is deterministic and rule-based.
