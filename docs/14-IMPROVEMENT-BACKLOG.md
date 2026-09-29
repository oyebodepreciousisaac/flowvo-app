# 14. Flowvo — Improvement Backlog & Enhancement Roadmap

> **Document Status:** Active  
> **Document Owner:** Oyebode Precious  
> **Date Created:** 28 Sep 2026  
> **Audience:** Developer, Product Owner  
> **Reference:** Items raised in founder review session, Sept 2026

---

## How This Document Is Organised

All 10 improvement items from the founder review have been grouped into **4 delivery slices**, clustered by what they touch — so that a developer can pick up one slice at a time without context-switching between unrelated parts of the system.

| Slice | Theme | Items Covered |
| :--- | :--- | :--- |
| **Slice A** | Payments & Invoicing | #1, #2, #7 |
| **Slice B** | UI Labels, Colours & Status Chips | #3, #4 |
| **Slice C** | UX Polish — Auth, Slug & Dark Mode | #5, #6, #8 |
| **Slice D** | Security Audit & Penetration Hardening | #9, #10 |

---

## SLICE A — Payments & Invoicing

> **Theme:** Make the financial layer real, global, and professional.

---

### A1 — Integrate a Real Payment System (Paystack-first, with Stripe as fallback)

**What the founder said:**  
> *"The payment system must be real — card, transfer, and other means. Paystack preferred. Currency must be correct — Euro for Euro, Naira for Nigerians. Not just one currency."*

**Current state (what the code shows):**  
The current system stores `paymentDetails` as a free-text textarea in Settings (`BusinessProfileForm.tsx`). This means users paste their bank details manually and customers are expected to do a manual bank transfer. There is no payment gateway integration, no real-time payment capture, no multi-currency awareness.

**What needs to be built:**

#### Decision: Paystack + Stripe (dual gateway)
| Gateway | Best For | Currencies |
| :--- | :--- | :--- |
| **Paystack** | Nigeria (NGN), Ghana (GHS), Kenya (KES), South Africa (ZAR), Rwanda (RWF), Egypt (EGP) | NGN, GHS, USD, ZAR |
| **Stripe** | UK (GBP), Europe (EUR), USA (USD), global | GBP, EUR, USD, 135+ currencies |

**Implementation plan:**

1. **Database additions** (Prisma schema):
   - Add `currency` field to `Business` model (default `"GBP"`)
   - Add `paymentGateway` enum: `STRIPE | PAYSTACK | MANUAL`
   - Add `paystackPublicKey`, `stripePublishableKey` to `Business` (stored encrypted)
   - Add `paymentsEnabled: Boolean` flag
   - Add `paymentLinkUrl`, `paymentReference`, `gatewayPaymentId` to `Invoice`

2. **Settings page** — replace the plain textarea with a structured payment setup flow:
   - **Step 1:** Owner selects their primary country — auto-suggests gateway (Nigeria = Paystack, UK/EU = Stripe)
   - **Step 2:** Owner pastes in their Paystack Secret Key or Stripe Secret Key (stored server-side, never in browser)
   - **Step 3:** Test connection button verifies the key is valid via the gateway test API before saving

3. **Invoice payment link generation:**
   - When an invoice is sent, the API creates a payment link via Paystack (/paymentrequest/create) or Stripe (PaymentLink API)
   - The link is embedded in the invoice email and on the /invoices/[id] page as a Pay Now button
   - Payment link uses the invoice total amount and the business currency

4. **Currency handling — multi-currency rules:**
   - Business country = Nigeria  =  currency NGN, gateway Paystack
   - Business country = UK       =  currency GBP, gateway Stripe
   - Business country = EU       =  currency EUR, gateway Stripe
   - Business country = USA      =  currency USD, gateway Stripe
   - Business country = Ghana    =  currency GHS, gateway Paystack
   - Other African countries     =  currency USD, gateway Paystack
   - All amounts stored in the database remain in pence/kobo/cents (smallest unit) as they do today
   - The formatPence() utility in lib/invoice.ts must be extended to accept a currency argument and use Intl.NumberFormat for locale-aware formatting

5. **Webhook handlers:**
   - /api/webhooks/paystack — listens for charge.success event, marks invoice PAID, triggers Google review request
   - /api/webhooks/stripe — listens for payment_intent.succeeded — same flow
   - Both must verify the webhook signature (Paystack uses HMAC-SHA512, Stripe uses stripe-signature header)

6. **Payment methods supported:**
   - **Paystack:** Card, Bank Transfer, USSD, Mobile Money, QR, Bank Account
   - **Stripe:** Card, BACS Direct Debit, SEPA, Apple Pay, Google Pay, Link

**Files to create/modify:**
- `prisma/schema.prisma` — add currency and gateway fields
- `src/lib/paystack.ts` — new Paystack API client
- `src/lib/stripe.ts` — new Stripe API client
- `src/app/api/webhooks/paystack/route.ts` — new
- `src/app/api/webhooks/stripe/route.ts` — new
- `src/app/(app)/settings/PaymentSetupForm.tsx` — replace the textarea
- `src/lib/invoice.ts` — extend formatPence() to formatAmount(pence, currency)

---

### A2 — Printable Professional Invoices with Time on Invoice

**What the founder said:**  
> *"The invoice must be printable — with a place to print it. Also ensure the time is on the invoice, and mirror how invoices are done in the real world."*

**Current state:**  
The invoice detail page exists at /invoices/[id] but has no print function. The invoice displays date but not time. Layout is functional but not a formal print-quality document.

**What needs to be built:**

#### Real-world invoice anatomy (what must appear on every invoice):

```
[BUSINESS NAME / LOGO]                          INVOICE
Business Address                       Invoice No: INV-042
Email | Phone                          Date: 28 Sep 2026
                                       Time: 14:32
BILL TO:                               Due Date: 12 Oct 2026
Customer Name
Customer Email
Customer Phone

#  Description            Qty    Unit Price    Total
1  Labour - 3 hrs          3      75.00        225.00
2  Parts - Pipe fitting     1      45.00         45.00

                               Subtotal:        270.00
                               VAT (20%):        54.00
                               TOTAL DUE:       324.00

PAYMENT DETAILS:
Bank: Barclays | Sort: 20-00-00 | Acc: 12345678
OR: [Pay Online] button
Payment terms: 14 days from invoice date

Thank you for your business.
```

**Implementation plan:**

1. **Add time to invoice records:**
   - The createdAt field already stores a full DateTime in Prisma — it just needs to be formatted and displayed
   - Update all invoice display logic to show both date AND time: 28 Sep 2026 at 14:32

2. **Create a dedicated printable invoice layout:**
   - Create /invoices/[id]/print as a separate route with no navigation header, no sidebar — just the invoice document
   - Use CSS @media print rules to hide all non-invoice UI elements on window.print()
   - Add a Print Invoice button on the invoice detail page that calls window.print()

3. **CSS print rules to add to globals.css:**
   ```css
   @media print {
     .no-print { display: none !important; }
     body { background: white; color: black; font-size: 11pt; }
     .invoice-doc { max-width: 100%; box-shadow: none; border: none; }
   }
   ```

4. **Invoice completeness — fields to add/verify:**
   - Invoice issue date + time (use createdAt)
   - Due date (already exists)
   - Payment terms text e.g. Payment due within 14 days
   - Business address (add address field to Business model in Prisma)
   - VAT/Tax line (optional toggle in settings — vatEnabled Boolean, vatRate Float)
   - Subtotal, Tax, and Grand Total breakdown
   - Thank you footer

**Files to create/modify:**
- `src/app/(app)/invoices/[id]/print/page.tsx` — new printable route
- `src/app/globals.css` — add @media print rules
- `prisma/schema.prisma` — add address and VAT fields to Business

---

### A7 — Global Payment Settings (Bank Details Re-thought)

**What the founder said:**  
> *"In Settings, I saw an input for bank — is it meant to be the account number or what? Think globally, not just Africa."*

**Current state:**  
The paymentDetails field is a single freeform textarea with a UK-specific placeholder. This does not work for IBAN-based Europe, routing-number-based USA, or NUBAN-based Nigeria.

**What needs to be built:**

Replace the textarea with a structured Payment Settings Panel that adapts based on the business country:

| Country/Region | Fields Shown |
| :--- | :--- |
| United Kingdom | Account Name, Sort Code, Account Number |
| Nigeria | Account Name, Bank Name, NUBAN Account Number |
| USA / Canada | Account Name, Routing Number, Account Number |
| Europe (SEPA) | Account Name, IBAN, BIC/SWIFT |
| Other | Account Name, Bank Name, SWIFT/BIC, Account Number |

**Additional considerations:**
- The structured fields should be stored as JSON in the paymentDetails DB column
- When rendering on invoices, the system formats them correctly per country
- When a payment gateway is connected (Paystack/Stripe), the manual bank section is still shown but marked as a secondary/fallback option
- A Pay Online button pointing to the gateway payment link takes priority

---

## SLICE B — UI Labels, Colours & Status Chips

> **Theme:** Fix confusing same-colour status chips so every status is instantly scannable. Research-backed, industry-standard colour logic.

---

### B3 — Lead Status Colours Are Wrong (NEW = WON, CONTACTED = LOST)

**What the founder said:**  
> *"Both NEW and WON have the same colour label, and CONTACTED and LOST have the same colour. That does not feel right — I think they should have different colours."*

**Current state (from StatusChip.tsx):**
- NEW, SCHEDULED, WON, COMPLETE, PAID — all green (wrong — mixes unrelated stages)
- CONTACTED, IN_PROGRESS — grey
- LOST, DECLINED — also grey (same as CONTACTED — impossible to distinguish)

**Industry research — how CRMs colour lead statuses:**

| CRM / Tool | NEW | CONTACTED | WON | LOST |
| :--- | :--- | :--- | :--- | :--- |
| HubSpot | Blue | Blue/teal | Green | Grey |
| Pipedrive | Blue | Blue | Green | Red |
| Salesforce | Blue | Orange/amber | Green | Dark grey |
| Monday.com | Blue | Amber | Green | Red |
| Streak (Gmail) | Blue | Blue-green | Green | Dark grey |

**Consensus pattern from research:**
- NEW = Blue (informational — new arrival, needs attention)
- CONTACTED = Amber (in-progress, pending action)
- QUOTED = Purple/Violet (advanced stage — in negotiation)
- WON = Green (positive outcome / closed-won)
- LOST = Red (negative terminal — clearly differentiated from CONTACTED)

---

### B4 — Jobs Status Colours: SCHEDULED = COMPLETE (Both Green)

**What the founder said:**  
> *"In Jobs, SCHEDULED and COMPLETE have the same green label — that is not good for UX."*

**Industry research — how field service and job management tools colour job statuses:**

| Tool | SCHEDULED | IN_PROGRESS | COMPLETE |
| :--- | :--- | :--- | :--- |
| ServiceTitan | Blue | Amber/Orange | Green |
| Jobber | Blue | Amber/Orange | Green |
| Tradify | Blue | Orange | Green |
| Commusoft | Blue | Orange | Green/teal |
| FieldPulse | Blue | Yellow | Green |

**Consensus: SCHEDULED = Blue, IN_PROGRESS = Amber, COMPLETE = Green**

**After the B3 and B4 fix, the complete status colour table becomes:**

| Status | Background | Text Colour | Meaning Signal |
| :--- | :--- | :--- | :--- |
| NEW | Blue-100 `#DBEAFE` | Blue-700 `#1D4ED8` | New arrival — informational |
| SCHEDULED | Blue-100 `#DBEAFE` | Blue-700 `#1D4ED8` | Planned — not started yet |
| CONTACTED | Amber-100 `#FEF3C7` | Amber-700 `#B45309` | Follow-up in motion |
| IN_PROGRESS | Amber-100 `#FEF3C7` | Amber-700 `#B45309` | Active — happening now |
| ACTION_NEEDED | Amber-100 `#FEF3C7` | Amber-700 `#B45309` | Needs owner action |
| QUOTED | Violet-100 `#EDE9FE` | Violet-700 `#6D28D9` | Quote sent — awaiting decision |
| SENT | Violet-100 `#EDE9FE` | Violet-700 `#6D28D9` | Invoice sent — awaiting payment |
| DRAFT | Grey-100 `#F3F4F6` | Grey-500 `#6B7280` | Not yet sent |
| WON | Green-100 `#D1FAE5` | Green-800 `#065F46` | Deal closed — won |
| COMPLETE | Green-100 `#D1FAE5` | Green-800 `#065F46` | Job finished |
| PAID | Green-100 `#D1FAE5` | Green-800 `#065F46` | Invoice settled |
| LOST | Red-100 `#FEE2E2` | Red-600 `#DC2626` | Deal closed — lost |
| DECLINED | Red-100 `#FEE2E2` | Red-600 `#DC2626` | Customer declined |
| OVERDUE | Red-100 `#FEE2E2` | Red-600 `#DC2626` | Payment past due |

**Files to modify:**
- `src/components/ui/StatusChip.tsx` — new colour mapping (one change, all pages benefit)

---

## SLICE C — UX Polish: Auth, Slug & Dark Mode

> **Theme:** Fix friction in the user experience around registration, passwords, business identity, and system appearance preferences.

---

### C5 — Business Slug Does Not Update When Business Name Changes

**What the founder said:**  
> *"Once I change the name of the business it is not reflecting in the slug — is that how it is supposed to be?"*

**The answer: Yes — this is intentional and correct. But it needs better UX explanation.**

**Why slugs must NOT auto-update from name changes:**
1. The slug is used in the public URL (/enquiry/apex-heating-k3f2). Changing it would break any bookmarks, WhatsApp links, or website embeds already shared.
2. Google may have indexed the old URL — changing it breaks SEO.
3. It breaks existing QR codes printed on flyers or trade cards.

**Industry practice:**  
Shopify, WordPress, GitHub, Stripe, and HubSpot all lock the URL slug after creation and require a deliberate manual change with an explicit warning.

**What to build — a Rename Slug flow:**
1. Keep the slug as read-only by default (correct as-is)
2. Add a subtle "Change slug" link next to the read-only field
3. Clicking it opens a modal with:
   - An editable slug input with live URL preview
   - A prominent warning banner: "Changing your slug will break any links you have already shared. Anyone using the old link will get a 404 error."
   - A confirmation checkbox: "I understand all previously shared links will stop working"
   - A confirm button to save
4. API update: Add optional slug field that triggers a unique check before updating

**Files to modify:**
- `src/app/(app)/settings/BusinessProfileForm.tsx`
- `src/app/api/business/profile/route.ts`

---

### C6 — Password Field Needs Eye Toggle + Strong Password Validation

**What the founder said:**  
> *"Is it best practice not to have an eye in the password section? I also want password validation like the standard — uppercase, symbol, letters — not just 8 characters."*

**Answer: Yes — an eye (show/hide) toggle is industry-standard best practice per WCAG 2.1 and NIST SP 800-63B guidelines.**

**What to build:**

#### 1. Password Visibility Toggle
Update the Input component to accept a type="password" variant with a built-in eye toggle button using Lucide Eye / EyeOff icons.

#### 2. Strong Password RegEx Validation (server + client)

**New password rules (NIST + OWASP standard):**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*...)
- Maximum 128 characters (prevent DoS on bcrypt)

**RegEx pattern:**
```
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,128}$/
```

**Zod schema update:**
```typescript
password: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/(?=.*[A-Z])/, "Must contain at least one uppercase letter")
  .regex(/(?=.*[a-z])/, "Must contain at least one lowercase letter")
  .regex(/(?=.*\d)/, "Must contain at least one number")
  .regex(/(?=.*[!@#$%^&*()\-_=+{};:,<.>])/, "Must contain at least one special character"),
```

#### 3. Live password strength meter on the registration form
- Show a strength bar: Weak / Fair / Strong / Very Strong as the user types
- Show inline checklist showing which rules are met in real-time

**Files to modify:**
- `src/components/ui/Input.tsx` — add password toggle variant
- `src/app/api/auth/register/route.ts` — update registerSchema
- `src/app/api/auth/change-password/route.ts` — apply same schema
- `src/app/register/page.tsx` — add live strength meter UI

---

### C8 — Dark Mode Support (System-Aware + Manual Toggle)

**What the founder said:**  
> *"I want a dual mode — light mode and dark mode — that can be toggled or done based on system settings. If the system is in dark mode the app should mirror that."*

**Current state:**  
The app uses CSS custom properties defined in globals.css. This is the correct architecture for dark mode — it just needs a second set of variable values.

**What to build:**

#### 1. System-aware dark mode (automatic)
Add a @media (prefers-color-scheme: dark) block in globals.css with dark-mode overrides for all CSS variables. This makes the app automatically match the OS setting.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f1117;
    --color-surface: #1a1d27;
    --color-surface-muted: #22263a;
    --color-border: #2e3347;
    --color-text: #f0f2f8;
    --color-text-secondary: #9aa3c2;
    /* all other tokens... */
  }
}
```

#### 2. Manual toggle (user preference overrides system)
- Add a sun/moon icon toggle button in the app navigation bar
- Store preference in localStorage as "theme": "light" | "dark" | "system"
- Apply data-theme="dark" on the html element when dark is active
- On next load, read localStorage before React hydrates (script tag in layout.tsx) to prevent flash of wrong theme

#### 3. Recommended dark mode token palette (matching Flowvo teal/green brand)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| --color-bg | #f7f9fc | #0f1117 |
| --color-surface | #ffffff | #1a1d27 |
| --color-surface-muted | #f0f4f8 | #22263a |
| --color-border | #e2e8f0 | #2e3347 |
| --color-text | #0f1623 | #f0f2f8 |
| --color-text-secondary | #5a6a8a | #9aa3c2 |
| --color-primary | #1aab8b | #22d3aa |
| --color-error | #dc2626 | #f87171 |
| --color-warning | #d97706 | #fbbf24 |

**Files to modify:**
- `src/app/globals.css` — add dark mode CSS variable overrides
- `src/app/layout.tsx` — add theme-init script to prevent flash
- `src/components/layout/ThemeToggle.tsx` — new toggle component
- Navigation component — embed the toggle button

---

## SLICE D — Security Audit & Penetration Hardening

> **Theme:** Act as a senior SOC analyst AND a black-hat penetration tester. Identify every exploitable weakness and fix it.

---

### D9 — Senior Security Audit (SOC / System Analyst Perspective)

**Audit methodology:** Full code review of auth, API routes, session management, input handling, and external integrations.

---

#### VULNERABILITY 1: bcrypt Salt Rounds Too Low
**Severity:** MEDIUM  
**File:** `src/lib/auth.ts` line 10 — `bcrypt.genSalt(10)`  
**Finding:** Cost factor 10 was the OWASP recommendation in 2012. In 2026, modern hardware cracks cost-10 bcrypt hashes much faster. OWASP 2023 recommends minimum 12, preferably 14.  
**Fix:** Raise `genSalt(10)` to `genSalt(12)` as a minimum.

---

#### VULNERABILITY 2: No Rate Limiting on Auth API Routes
**Severity:** HIGH — Brute Force Attack Vector  
**Files:** `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`  
**Finding:** No rate limiting exists on authentication endpoints. An attacker can send thousands of login attempts per second. The enquiry form has Cloudflare Turnstile, but the auth APIs have nothing.  
**Fix:**
- Install `@upstash/ratelimit` and `@upstash/redis`
- Apply sliding window: max 5 login attempts per IP per 15 minutes
- Return `429 Too Many Requests` with `Retry-After` header when exceeded
- Apply to all three auth routes listed above

---

#### VULNERABILITY 3: Session Token Not Rotated After Privilege Changes
**Severity:** MEDIUM — Session Fixation Risk  
**File:** `src/lib/auth.ts`  
**Finding:** Session tokens are not rotated after password or email changes. An attacker who steals an old token retains access even after the user changes their password.  
**Fix:** After a successful password change or email change, call destroySession() then createSession() to issue a fresh token. Apply in `/api/auth/change-password/route.ts`.

---

#### VULNERABILITY 4: Weak Password Validation — Server-Side Bypassable
**Severity:** HIGH — Bypassed with curl or Postman  
**Files:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/change-password/route.ts`  
**Finding:** The server-side Zod schema only enforces min(8). An attacker bypasses the React form and posts directly to the API with a weak password.  
**Fix:** Apply the full strong password regex in the API Zod schema (see C6 above).

---

#### VULNERABILITY 5: No CSRF Protection on Mutating API Routes
**Severity:** HIGH — Cross-Site Request Forgery  
**Finding:** API routes using httpOnly session cookies are vulnerable to CSRF. A malicious website can craft a cross-site form that POSTs to flowvo.app/api/business/profile and the browser silently attaches the session cookie.  
**Fix:**
- Verify Content-Type: application/json header is present AND check Origin/Referer header matches the app domain in all mutating routes
- Note: sameSite: "lax" provides partial protection for top-level navigations but NOT for API calls from subresources

---

#### VULNERABILITY 6: Cron Jobs Lack Strong Authentication
**Severity:** HIGH — Unauthorised Cron Execution  
**File:** `src/app/api/cron/` routes  
**Finding:** Cron endpoints that trigger overdue detection and automated emails must be locked down to prevent any external party from triggering them.  
**Fix:**
- Use Vercel built-in cron authentication — Vercel automatically signs cron requests with Authorization: Bearer header
- Verify `request.headers.get("authorization") === "Bearer " + process.env.CRON_SECRET` in every cron handler
- Set CRON_SECRET as an environment variable

---

#### VULNERABILITY 7: paymentDetails Stored as Plaintext
**Severity:** HIGH — Sensitive Data Exposure  
**Finding:** Bank account numbers, sort codes, IBANs, and routing numbers stored in paymentDetails sit in the database as plaintext strings. If the database is compromised, all financial routing information is fully exposed.  
**Fix:** Encrypt sensitive fields at rest using AES-256-GCM before writing to the database. Decrypt only server-side when rendering invoices or settings.

---

#### VULNERABILITY 8: Missing Input Sanitisation on User-Supplied Text Fields
**Severity:** MEDIUM — Stored XSS Risk  
**Finding:** Customer enquiry form collects description and serviceType as freeform text. If these are ever rendered as dangerouslySetInnerHTML or injected into email templates without escaping, this creates a stored XSS vector.  
**Fix:**
- Audit all email templates in `src/lib/email-templates/` — confirm all user-supplied fields are HTML-escaped
- Add server-side sanitisation before storing user input that could contain HTML

---

#### VULNERABILITY 9: Missing Security HTTP Headers
**Severity:** MEDIUM — Missing Defence-in-Depth  
**Finding:** The next.config.ts and vercel.json do not set recommended security response headers.  
**Fix — Add to next.config.ts:**
```typescript
headers: async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      {
        key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; img-src 'self' data:; connect-src 'self'"
      }
    ]
  }
]
```

---

### D10 — Penetration Testing Findings (Black-Hat Perspective)

**Methodology:** Simulate what an attacker with no insider knowledge, but with access to the public-facing app, would attempt.

---

#### ATTACK VECTOR 1: Credential Stuffing / Password Spraying
**How it works:** Attacker buys a list of email:password combos from previous breaches and runs them against /api/auth/login in batches.  
**Current exposure:** No rate limiting = unlimited login attempts possible.  
**Fix:** Rate limiting (see D9 Vulnerability 2) + account lockout after N failed attempts + breach password check via haveibeenpwned.com API.

---

#### ATTACK VECTOR 2: Insecure Direct Object Reference (IDOR)
**How it works:** An authenticated user for Business A manually changes the leadId, invoiceId, or jobId in the URL to another business record ID.  
**Current exposure:** Must be verified — all API routes must check businessId matches the session user before returning data.  
**Fix:** Audit every API route that accepts an ID parameter. All database queries must include `where: { id: ..., businessId: session.user.businessId }` — never just `where: { id: ... }` alone.

---

#### ATTACK VECTOR 3: Public Enquiry Form Abuse (Spam + DDoS)
**How it works:** An attacker scripts thousands of fake enquiry submissions, flooding the owner's inbox and database.  
**Current exposure:** Turnstile is in place for basic bot protection. However, Turnstile can be bypassed with headless browser farms.  
**Fix:**
- Verify server-side Turnstile token verification is happening in /api/enquiry
- Add IP-based rate limiting per slug (max 3 submissions per IP per hour per business)
- Add a honeypot field (hidden field in HTML — if filled, reject silently)

---

#### ATTACK VECTOR 4: Token Enumeration on Quote Accept Link
**How it works:** If quote tokens at /q/[token] are short or predictable, an attacker enumerates tokens to accept or decline quotes for other businesses.  
**Current exposure:** Needs verification of token generation method.  
**Fix:** Ensure quote tokens are generated using `crypto.randomBytes(32).toString('hex')` — 256 bits of entropy, unguessable. Confirm this in the quotes API route.

---

#### ATTACK VECTOR 5: Account Takeover via Password Reset
**How it works:** Attacker triggers a password reset for a victim email. If the reset token has a long expiry or is not invalidated after use, the attacker who intercepts the email retains access.  
**Current exposure:** Must verify (a) token expiry time and (b) whether token is invalidated immediately after use.  
**Fix:**
- Reset tokens must expire in 1 hour maximum (not 24 hours)
- After the reset link is used, the token must be deleted from the database immediately
- After a password reset, all existing sessions for that user must be destroyed

---

#### ATTACK VECTOR 6: Webhook Replay Attack
**How it works:** Attacker captures a valid Stripe or Paystack webhook payload (e.g. charge.success) and replays it repeatedly, potentially marking the same invoice as paid multiple times.  
**Current exposure:** Not yet applicable since payment webhooks do not exist yet — but must be built correctly from day one (Slice A1).  
**Fix:**
- Verify webhook signatures on every inbound request (Stripe: stripe.webhooks.constructEvent, Paystack: HMAC-SHA512 signature check)
- Store gatewayPaymentId on the invoice and check for duplicates before processing
- The same event ID should only be processed once

---

## Summary: Full Priority and Effort Matrix

| ID | Issue | Slice | Priority | Estimated Effort |
| :--- | :--- | :--- | :--- | :--- |
| A1 | Real payment gateway (Paystack + Stripe) | A | CRITICAL | 5-8 days |
| A2 | Printable invoice with time | A | HIGH | 1-2 days |
| A7 | Global payment settings (structured bank fields) | A | HIGH | 1 day |
| B3 | Fix lead status colours | B | MEDIUM | 0.5 day |
| B4 | Fix jobs status colours | B | MEDIUM | 0.5 day |
| C5 | Slug rename flow with warning | C | LOW-MEDIUM | 1 day |
| C6 | Password eye toggle + strong validation | C | HIGH | 0.5-1 day |
| C8 | Dark mode (system + toggle) | C | MEDIUM | 2-3 days |
| D9 | Security audit fixes (9 vulnerabilities) | D | CRITICAL | 3-5 days |
| D10 | Penetration test hardening (6 attack vectors) | D | CRITICAL | 2-3 days |

---

> **Recommended start order:**
> 1. **Slice B** — status colour fix first (one file, zero risk, immediate visual improvement)
> 2. **Slice D** — security hardening in parallel (critical vulnerabilities, fix before going to production)
> 3. **Slice C** — password, dark mode, slug UX (user-facing quality improvements)
> 4. **Slice A** — payments sprint (largest scope, most value, requires dedicated focus)
