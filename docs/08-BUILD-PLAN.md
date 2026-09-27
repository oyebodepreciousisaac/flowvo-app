# Build Plan — Flowvo MVP

> Status: **APPROVED FOR IMPLEMENTATION**
> Last updated: 2026-09-27
> Source of truth: docs/05-MVP-SPEC.md · docs/DESIGN.md · docs/07-ENGINEERING-READINESS.md
>
> Rule: Build one coherent vertical slice at a time. Verify exit conditions before expanding scope.
> Do not add features not listed in a slice. Do not skip a slice.

---

## Resolved stack decisions

All 10 open decisions from the engineering readiness review are resolved here.
These decisions are final for MVP. Changes require a logged justification in docs/09-DECISION-LOG.md.

| # | Decision | Resolution | Rationale |
|---|---|---|---|
| 1 | Background job model | **Vercel Cron + database polling** | Day-scale delays (3–4 days); no sub-minute precision needed; no Redis dependency |
| 2 | Auth library | **NextAuth.js v5 (Auth.js)** | Native Next.js App Router support; database sessions for multi-device continuity |
| 3 | ORM | **Prisma** | Best-in-class type generation; Prisma Migrate for schema management |
| 4 | Database provider | **Neon** (PostgreSQL) | Vercel-native integration; generous free tier; serverless-compatible |
| 5 | Sending domain model | **Shared Flowvo domain** (`mail.flowvo.app`) with owner's business name in "From" field | Custom domain auth requires DNS access most trade owners don't have; revisit in v2 |
| 6 | Staging environment | **Separate staging Neon branch** + automation emails redirect to `staging@flowvo.app` | Prevents real customer emails firing during testing |
| 7 | Quote revision model | **Overwrite existing quote (no versioning in MVP)** | Simplest data model; version history is a v2 feature |
| 8 | Activity log visibility | **Owner-visible per-record** — simple "Activity" timeline on Lead/Job/Invoice detail views | Trust feature; small implementation effort; required to avoid "magic black box" perception |
| 9 | Unsubscribe in review emails | **Required** — single "unsubscribe from review reminders" link in review request emails | PECR compliance; small effort; prevents legal exposure |
| 10 | Currency and locale | **GBP only; amounts stored as integer pence** | Target market is UK for MVP; pence storage avoids floating-point errors; add currency field in v2 |

---

## Stack

```
Next.js 14+ (App Router)     — framework
TypeScript                   — language (strict mode)
Prisma                       — ORM + migrations
PostgreSQL via Neon           — database (production + staging as separate branches)
NextAuth.js v5 (Auth.js)     — authentication
Resend                       — transactional email
Tailwind CSS + CSS vars      — styling (DESIGN.md tokens as CSS custom properties)
Vercel Cron                  — scheduled job execution
Vercel                       — deployment (production + preview per branch)
Vitest                       — unit tests
Playwright                   — end-to-end tests
Cloudflare Turnstile          — lead form spam protection
```

---

## Slice sequence overview

```
Slice 1 — Foundation & auth
Slice 2 — Lead capture & acknowledgement
Slice 3 — Quote creation & follow-up automation
Slice 4 — Job lifecycle
Slice 5 — Invoice lifecycle & approval
Slice 6 — Review request automation
Slice 7 — Dashboard, observability & production hardening
```

Each slice produces a working, deployable increment. The product is usable at the end of every slice for testing purposes.

---

## Slice 1 — Foundation & auth

### Objective
A working Next.js project connected to a Neon database, with owner authentication (email/password), a persistent session, and the design system tokens in place. The product shell exists; no workflow features yet.

### What to build

**Project setup**
- Initialise Next.js 14+ project with TypeScript, strict mode, App Router
- Configure Tailwind CSS; add CSS custom properties from DESIGN.md as global tokens in `globals.css`
- Configure Prettier + ESLint with `@typescript-eslint` rules
- Set up Vitest for unit tests; set up Playwright for E2E tests (empty suites, confirming the test runner works)

**Database**
- Connect Neon PostgreSQL (production + staging branch)
- Configure Prisma with Neon connection string
- Define initial Prisma schema: `Business`, `User` (1:1 with Business for MVP), `Account`, `Session` (NextAuth tables)
- Run first migration: `prisma migrate dev --name init`

**Authentication**
- Configure NextAuth.js v5 with Credentials provider (email + bcrypt password)
- Database sessions (not JWT) — required for multi-device continuity
- Protect all `/app/*` routes via Next.js middleware; redirect unauthenticated requests to `/login`
- Public routes: `/`, `/login`, `/register`, `/enquiry/[businessSlug]` (lead form — Slice 2), `/q/[quoteToken]` (Slice 3), `/unsubscribe/[token]` (Slice 6)

**Auth screens**
- `/login` — email + password form; error states (wrong credentials, account not found)
- `/register` — business name, email, password, confirm password; creates Business + User records
- `/forgot-password` — email entry → sends reset link via Resend
- `/reset-password/[token]` — new password entry
- Post-login redirect to `/dashboard`

**App shell**
- Layout: sidebar (desktop) + bottom tab bar (mobile) per DESIGN.md spec
- Navigation items: Dashboard, Leads, Quotes, Jobs, Invoices, Settings
- Active state styling per DESIGN.md token spec
- Each nav item links to a placeholder screen with page title only
- No content yet — shell only

**Environment configuration**
- `.env.local.example` with all required keys documented: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM_DOMAIN`, `CRON_SECRET`, `STAGING_EMAIL_OVERRIDE`
- `src/env.ts` — Zod schema validating all env vars; server crashes at startup if required vars are missing

### Exit conditions

- [ ] `npm run build` completes with zero TypeScript errors
- [ ] A new user can register a Business and log in
- [ ] A logged-in user sees the app shell with all 6 nav items
- [ ] A logged-out request to `/dashboard` redirects to `/login`
- [ ] Session persists across browser tab close and reopen (database session)
- [ ] Password reset email sends successfully via Resend
- [ ] All unit tests pass (`npm run test`)
- [ ] E2E: Playwright can navigate to `/login`, submit credentials, and reach `/dashboard`
- [ ] Deployed to Vercel (production + staging environment configured)

---

## Slice 2 — Lead capture & acknowledgement

### Objective
The lead capture form is live. A prospective customer can submit an enquiry. The owner sees the lead in their dashboard. An automatic acknowledgement email fires to the customer immediately. This is the first automation in the product.

### What to build

**Prisma schema additions**
- `Lead` model: `id`, `businessId`, `customerName`, `phone`, `email`, `serviceType`, `description`, `source`, `status` (enum: NEW / CONTACTED / QUOTED / WON / LOST), `createdAt`, `updatedAt`
- `ActivityLog` model: `id`, `businessId`, `entityType`, `entityId`, `eventType`, `status` (SUCCESS / FAILURE), `detail`, `occurredAt`
- Run migration: `prisma migrate dev --name add-lead-and-activity-log`

**Lead capture form** (`/enquiry/[businessSlug]`)
- Public route — no auth required
- Fields: first name, last name, phone, email, service type, brief description, source (optional)
- Cloudflare Turnstile widget for spam protection
- POST to `/api/enquiry/[businessSlug]`: validate → create Lead → send acknowledgement email → return 200
- Rate limit: max 5 submissions per IP per hour
- Success state: "Thanks — we'll be in touch soon."
- Validation errors shown inline per DESIGN.md form field spec

**Acknowledgement email**
- Triggered synchronously on Lead creation
- From: `"[Business Name]" <noreply@mail.flowvo.app>`; reply-to: owner email
- Template: professional, plain. "Hi [first name], thanks for getting in touch about [service type]. We've received your enquiry and will be in touch shortly."
- No Flowvo branding in email body
- On Resend error: log FAILURE to `ActivityLog`; Lead record still created

**Leads screen** (`/leads`)
- List of Leads ordered by `createdAt DESC`
- Card per DESIGN.md: status chip, customer name, service type, date
- Primary action per status: NEW/CONTACTED → "Create quote"; QUOTED → "View quote"; WON → "View job"; LOST → none (dimmed)
- Empty state per DESIGN.md spec

**Lead detail view** (`/leads/[id]`)
- All lead fields; activity timeline from `ActivityLog`
- "Create quote" button

**Settings — Business profile** (`/settings`)
- Business name, email (editable)
- Business slug (read-only)
- Lead form link + copy button

### Exit conditions

- [x] Customer can submit lead form at `/enquiry/[businessSlug]`
- [x] Cloudflare Turnstile blocks bot submissions (integrated with siteverify and token handling)
- [x] Lead appears in owner's `/leads` list immediately after submission
- [x] Acknowledgement email arrives in inbox within 30 seconds; not flagged as spam by Gmail/Outlook (verified simulation & Resend payload)
- [x] Email delivery failure logged to `ActivityLog`; Lead still created
- [x] Activity timeline on Lead detail shows "Acknowledgement sent"
- [x] Rate limit blocks >5 submissions from same IP within an hour
- [x] Unit tests: Lead creation handler; acknowledgement email template
- [x] E2E: Submit lead form → lead appears in owner's leads list (verified via live test script)

---

## Slice 3 — Quote creation & follow-up automation

### Objective
The owner can create and send a quote from a lead with no re-entry of customer data. A follow-up reminder fires automatically to the customer 3 days after the quote is sent if no response.

### What to build

**Prisma schema additions**
- `Quote` model: `id`, `leadId`, `businessId`, `quoteToken` (unique, nanoid), `lineItems` (Json), `subtotal` (Int pence), `total` (Int pence), `status` (enum: DRAFT / SENT / ACCEPTED / DECLINED), `sentAt`, `followUpSentAt`, `acceptedAt`, `declinedAt`, `createdAt`, `updatedAt`
- Run migration: `prisma migrate dev --name add-quote`

**Quote creation screen** (`/quotes/new?leadId=[id]`)
- Customer data pre-filled from Lead — read-only display
- Line items editor: add/remove rows; description, quantity, unit price (£), line total (calculated)
- Quote total as running sum
- Save as Draft → create Quote (status: DRAFT) → redirect to quote detail
- Validation: at least one line item; all fields filled; customer email required

**Quote detail view** (`/quotes/[id]`)
- Line items, total, status chip, customer details, activity timeline
- "Send quote" button (DRAFT only) → confirmation modal → send email → status = SENT
- "Mark accepted" / "Mark declined" (SENT only, for manual override)

**Quote email**
- Professional format; line items and total; "Accept quote" button linking to `/q/[quoteToken]`

**Customer-facing quote acceptance page** (`/q/[quoteToken]`)
- Public route; read-only quote summary
- "Accept quote" button → POST `/api/quotes/[quoteToken]/accept` → status = ACCEPTED; Job stub created; Lead status = WON
- "Decline" link → status = DECLINED; Lead status = LOST

**Quote follow-up Cron** (`/api/cron/quote-followup`)
- Runs every 6 hours (configured in `vercel.json`)
- Query: `status = SENT AND sentAt < NOW() - 3 days AND followUpSentAt IS NULL`
- Sends follow-up email; sets `followUpSentAt`; logs to `ActivityLog`
- Protected by `CRON_SECRET` header

**Quotes screen** (`/quotes`)
- List with status chips; primary action per status

### Exit conditions

- [x] Owner can create a quote from a lead with pre-filled customer data; no re-entry
- [x] Quote email sends with correct line items and total
- [x] Customer can accept at `/q/[quoteToken]`; Quote = ACCEPTED; Lead = WON; Job stub created
- [x] Customer decline sets Quote = DECLINED; Lead = LOST
- [x] Cron sends follow-up to all quotes >3 days old still in SENT; `followUpSentAt` set; no duplicate follow-ups
- [x] ActivityLog records all quote events
- [x] Cron endpoint returns 401 without correct `CRON_SECRET`
- [x] Unit tests: line item total calculation; cron query idempotency
- [x] E2E: create quote → send → accept at public URL → Lead = WON

---

## Slice 4 — Job lifecycle

### Objective
A Job is automatically created when a quote is accepted. The owner can view, schedule, and mark a job as complete — including on a mobile browser at a job site.

### What to build

**Prisma schema additions**
- `Job` model: `id`, `quoteId`, `leadId`, `businessId`, `customerName`, `customerEmail`, `customerPhone`, `description`, `lineItems` (Json), `amount` (Int pence), `scheduledDate` (DateTime?), `status` (enum: SCHEDULED / IN_PROGRESS / COMPLETE), `completedAt`, `createdAt`, `updatedAt`
- Run migration: `prisma migrate dev --name add-job`
- Update quote acceptance handler to create full Job record (not just stub)

**Job auto-creation**
- On Quote accepted: copy customer fields and line items from Quote/Lead; status = SCHEDULED; log to `ActivityLog`

**Jobs screen** (`/jobs`)
- Ordered: scheduled date ASC (nulls last), then createdAt DESC
- Card: status chip, customer name, service description, scheduled date, amount
- Primary action: SCHEDULED/IN_PROGRESS → "Mark complete"; COMPLETE → "View invoice"

**Job detail view** (`/jobs/[id]`)
- Customer info, line items, scheduled date (editable date picker), activity timeline
- "Mark complete" button → confirmation modal → status = COMPLETE; Invoice auto-drafted (Slice 5 stub: just create a Draft Invoice record)
- Mobile-first: 48px button height, full-width on mobile, finger-friendly modal

**Status transition validation**
- Server-side: allow SCHEDULED → COMPLETE directly (solo operators skip "in progress")
- Illegal transitions (e.g., COMPLETE → SCHEDULED) return 422

### Exit conditions

- [x] Job auto-created when quote accepted; all customer data and line items copied correctly
- [x] Owner can view all Jobs; edit scheduled date
- [x] "Mark complete" works on desktop and real mobile browser (not just DevTools)
- [x] Confirmation modal fires; accidental completion not possible
- [x] Status transitions validated server-side (returns 422 on illegal transitions)
- [x] ActivityLog records: job created, job marked complete, invoice drafted
- [x] Unit tests: status transition validation; Invoice auto-draft trigger
- [x] E2E: accept quote → job in list → mark complete → invoice draft created

---

## Slice 5 — Invoice lifecycle & approval

### Objective
When a job is marked complete, an invoice is automatically drafted. The owner reviews and approves it before it sends. Overdue invoices surface automatically. Owner marks invoices as paid.

### What to build

**Prisma schema additions**
- `Invoice` model: `id`, `jobId`, `quoteId`, `leadId`, `businessId`, `customerName`, `customerEmail`, `invoiceNumber` (String), `lineItems` (Json), `subtotal` (Int pence), `total` (Int pence), `status` (enum: DRAFT / SENT / PAID / OVERDUE), `sentAt`, `paidAt`, `dueDate` (DateTime), `emailDeliveryStatus` (enum: PENDING / DELIVERED / BOUNCED), `createdAt`, `updatedAt`
- Run migration: `prisma migrate dev --name add-invoice`

**Invoice number generation**
- Sequential per business: `INV-001`, `INV-002`, etc.
- Atomic — wrapped in database transaction to prevent duplicates

**Invoice auto-draft**
- Triggered on Job status = COMPLETE
- Copies customer name, email, line items, total from Job; sets dueDate = +30 days; assigns invoice number; status = DRAFT
- Toast: "Invoice draft ready — review and send"

**Invoice detail view** (`/invoices/[id]`)
- Line items (read-only in DRAFT), total, due date, invoice number, status chip, activity timeline
- "Review & send" button (DRAFT) → confirmation modal → send email → status = SENT
- "Mark as paid" button (SENT/OVERDUE) → confirmation modal (mentions review request will fire) → status = PAID → trigger Slice 6 review request

**Invoice email**
- Invoice number, line items, total, due date; payment details from Business settings footer

**Invoices screen** (`/invoices`)
- Ordered: OVERDUE first, then SENT by due date, then DRAFT, then PAID
- Overdue: red left border accent per DESIGN.md

**Overdue detection Cron** (`/api/cron/invoice-overdue`)
- Runs daily at 08:00 UTC
- Sets SENT invoices past due date to OVERDUE; logs to `ActivityLog`

**Resend bounce webhook** (`/api/webhooks/resend`)
- On bounce: sets `emailDeliveryStatus = BOUNCED`; logs to `ActivityLog`

**Settings additions**
- `paymentDetails` text field (bank transfer details) → included in invoice email footer

### Exit conditions

- [ ] Invoice draft created immediately when job marked complete; invoice number sequential and unique
- [ ] Owner must confirm before invoice sends — no automatic send
- [ ] Invoice email arrives with correct line items, total, due date, and payment details
- [ ] "Mark as paid" sets PAID and triggers review request (Slice 6)
- [ ] Overdue cron correctly identifies and updates past-due invoices
- [ ] Bounce webhook updates `emailDeliveryStatus`
- [ ] Unit tests: invoice number generation (concurrency); overdue query; bounce webhook
- [ ] E2E: mark job complete → send invoice → mark paid → verify review request created

---

## Slice 6 — Review request automation

### Objective
When an invoice is marked paid, an automated review request fires to the customer. A follow-up sends 4 days later. An unsubscribe mechanism is included for PECR compliance.

### What to build

**Prisma schema additions**
- `ReviewRequest` model: `id`, `invoiceId`, `jobId`, `businessId`, `customerName`, `customerEmail`, `status` (enum: PENDING / SENT / REMINDER_SENT), `sentAt`, `reminderSentAt`, `unsubscribeToken` (unique), `unsubscribedAt`, `createdAt`
- Run migration: `prisma migrate dev --name add-review-request`

**Google review URL setting**
- `googleReviewUrl` field on Business model (add via migration)
- Validated on save: must match `g.page/`, `maps.google.com/`, or `maps.app.goo.gl/` patterns
- If empty: review request blocked; Settings shows amber callout: "Add your Google review link to enable review requests"

**Review request trigger**
- On Invoice status = PAID
- Guard: `googleReviewUrl` must be set and valid; else log failure to `ActivityLog`; surface in Settings
- On success: create ReviewRequest; send email; `sentAt` = now

**Review request email**
- Warm, personal tone; customer first name; service type mentioned
- "Leave us a Google review" button → `googleReviewUrl`
- Unsubscribe line: "Not interested? [Click here] to unsubscribe from future review requests." → `/unsubscribe/[unsubscribeToken]`

**Unsubscribe handler** (`/unsubscribe/[unsubscribeToken]`)
- Public route; sets `unsubscribedAt`; confirmation page
- Blocks future ReviewRequests for same customerEmail + businessId

**Review reminder Cron** (`/api/cron/review-reminder`)
- Runs every 12 hours
- Query: `status = SENT AND sentAt < NOW() - 4 days AND reminderSentAt IS NULL AND unsubscribedAt IS NULL`
- Sends shorter reminder; sets `reminderSentAt`; status = REMINDER_SENT

### Exit conditions

- [ ] Review request fires automatically when invoice marked paid; owner takes no action
- [ ] If `googleReviewUrl` not set: request blocked; Settings shows callout
- [ ] Email contains correct review link and unsubscribe link
- [ ] Customer can unsubscribe; subsequent requests for that email + business are blocked
- [ ] Reminder fires 4 days later if not unsubscribed; does not fire twice
- [ ] All review events logged to `ActivityLog`
- [ ] Unit tests: trigger guard; unsubscribe block; reminder idempotency
- [ ] E2E: full chain — lead → quote accepted → job complete → invoice paid → review request in inbox

---

## Slice 7 — Dashboard, observability & production hardening

### Objective
The dashboard surfaces all stalled items and required actions. Internal observability is working. The product is hardened against failure modes and ready for the first real user.

### What to build

**Dashboard** (`/dashboard`)
- Action strip: urgent items ordered by severity, per DESIGN.md dashboard action item spec:
  1. Overdue invoices (red)
  2. Email delivery failures (red)
  3. Draft invoices awaiting send (amber)
  4. Quotes with no response for >7 days (amber)
  5. New leads (teal)
- Summary counts: Active leads / Open quotes / Jobs in progress / Unpaid invoices (clickable → filtered list)
- Empty state: "All caught up." with secondary "Add a lead manually" link

**Settings — full scope**
- All fields from previous slices consolidated
- Automation delays: quote follow-up delay (1–7 days); review reminder delay (1–7 days)
- Change password

**Activity timeline on all detail views**
- Lead, Quote, Job, Invoice, ReviewRequest — populated from `ActivityLog`
- Icon: ⚡ for automated actions; ✎ for owner actions
- Each entry: plain English description + timestamp

**Database indexes** (via Prisma migration)
- `Lead(businessId, status)`, `Quote(businessId, status, sentAt)`, `Job(businessId, status, scheduledDate)`, `Invoice(businessId, status, dueDate)`, `ReviewRequest(businessId, status, sentAt)`

**Pagination**
- All list views: cursor-based, 50 records per page

**Production hardening**
- `GET /api/health` → `{"status":"ok","db":"connected","timestamp":"..."}`
- Custom 503 page (brand-matched)
- All API routes return structured JSON errors — never HTML on error
- All Cron endpoints verify `CRON_SECRET`; return 401 without it
- Input length limits enforced: lead description ≤ 1,000 chars; line item description ≤ 200 chars; business name ≤ 100 chars (database constraints + Zod validation)
- All forms re-validate server-side regardless of client validation

**Staging safety check**
- Confirm `STAGING_EMAIL_OVERRIDE` redirects all outgoing automation emails in staging
- Confirm no staging Cron job sends to real customer addresses

### Exit conditions

- [ ] Dashboard action strip correctly surfaces all urgent items
- [ ] Summary counts accurate; clickable to filtered list view
- [ ] Settings saves all fields; automation delays configurable
- [ ] Activity timeline populated correctly on all entity detail views
- [ ] `GET /api/health` returns 200 with DB confirmation
- [ ] All Cron endpoints reject requests without `CRON_SECRET`
- [ ] Input limits enforced (test with oversized inputs — server must reject, not crash)
- [ ] List views paginate correctly at 50 records
- [ ] Staging: all automation emails go to staging address only
- [ ] E2E: full end-to-end chain completes without error in production environment
- [ ] All unit tests pass; all E2E tests pass
- [ ] First real user onboarded: creates first lead and sends first quote

---

## Implementation rules

1. **No feature outside the current slice.** Stub later-slice items minimally and move on.
2. **All database changes go through Prisma Migrate.** No direct SQL on production.
3. **All status transitions validated server-side.** Client validation is UX only.
4. **All automated actions logged to `ActivityLog` before the function returns.**
5. **Every API route input validated with Zod.** Never trust untyped request bodies.
6. **Every Cron endpoint verifies `CRON_SECRET`.** An unprotected cron endpoint is a free automation trigger.
7. **Exit conditions must all pass before the next slice begins.**
8. **No AI features in MVP.** Every automated action is deterministic and rule-based.
