# Settlevo (Flowvo) — API Reference Manual

> **Base URL (Local):** `http://localhost:3000/api`  
> **Base URL (Production):** `https://<domain>/api`  
> **Content-Type:** `application/json`  

---

## 1. Authentication Endpoints

### 1.1 Register Business & User
- **Method:** `POST`
- **Route:** `/api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "businessName": "Apex Plumbing Services",
    "name": "Isaac Oyebode",
    "email": "isaac@apexplumbing.com",
    "password": "SecurePassword123!",
    "currency": "NGN",
    "phone": "+2348012345678"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": "cly1234...",
      "email": "isaac@apexplumbing.com",
      "name": "Isaac Oyebode",
      "role": "BUSINESS_OWNER",
      "businessId": "cly5678..."
    }
  }
  ```

### 1.2 User Login
- **Method:** `POST`
- **Route:** `/api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "isaac@apexplumbing.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  Sets `httpOnly`, `sameSite: "lax"`, `secure` session cookie (`flowvo_session`).

### 1.3 Change Password
- **Method:** `POST`
- **Route:** `/api/auth/change-password`
- **Access:** Authenticated (Requires valid session)
- **Request Body:**
  ```json
  {
    "currentPassword": "SecurePassword123!",
    "newPassword": "NewStrongPassword456!"
  }
  ```

---

## 2. Public Enquiry & Portal Endpoints

### 2.1 Submit Public Customer Enquiry
- **Method:** `POST`
- **Route:** `/api/enquiry/[businessSlug]`
- **Access:** Public (Honeypot protected)
- **Request Body:**
  ```json
  {
    "name": "Babatunde Lawal",
    "email": "customer@example.com",
    "phone": "+2348098765432",
    "serviceRequired": "Emergency Pipe Leak Repair",
    "description": "Kitchen pipe leaking under the sink, needs immediate attention.",
    "budgetPreference": "50000 - 100000",
    "website": ""
  }
  ```
- **Behavior:**
  - Validates honeypot field (`website` must be empty).
  - Creates a `Lead` record with `status: "NEW"`.
  - Dispatches immediate customer acknowledgment email via Resend.
  - Logs `LEAD_CREATED` to `ActivityLog`.

### 2.2 Customer Quote Retrieval
- **Method:** `GET`
- **Route:** `/q/[quoteToken]`
- **Access:** Public (Protected by 256-bit entropy token)
- **Response:** Renders interactive customer quotation portal with line items, tax breakdown, and acceptance modal.

### 2.3 Accept Quote
- **Method:** `POST`
- **Route:** `/api/quotes/[id]/accept`
- **Access:** Public (Valid `quoteToken` required) or Authenticated Business Owner
- **Request Body:**
  ```json
  {
    "quoteToken": "3f4a8b...",
    "acceptedBy": "Babatunde Lawal"
  }
  ```
- **Behavior:**
  - Transitions `Quote` to `ACCEPTED`.
  - Transitions linked `Lead` to `WON`.
  - Automatically provisions a new `Job` record in `SCHEDULED` status.

### 2.4 Decline Quote
- **Method:** `POST`
- **Route:** `/api/quotes/[id]/decline`
- **Request Body:**
  ```json
  {
    "quoteToken": "3f4a8b...",
    "reason": "Budget constraints"
  }
  ```

---

## 3. Business Core Operations (Authenticated)

### 3.1 Quotes Management
- `POST /api/quotes` — Create draft quote with line items.
- `POST /api/quotes/[id]/send` — Finalize and dispatch quote link to customer.
- `POST /api/quotes/[id]/receipt` — Upload offline payment proof / deposit receipt.

### 3.2 Jobs Management
- `PATCH /api/jobs/[id]` — Update job status (`SCHEDULED`, `IN_PROGRESS`, `COMPLETE`) or schedule date.
  - *Automated Side-Effect:* Transitioning to `COMPLETE` immediately auto-drafts an `Invoice` with sequential numbering (`INV-XXX`).

### 3.3 Invoices & Payments
- `POST /api/invoices/[id]/send` — Send invoice with Paystack / Stripe checkout links.
- `POST /api/invoices/[id]/paid` — Mark invoice as paid manually (for cash/bank transfer).
- `POST /api/invoices/[id]/currency` — Switch invoice presentation currency.

### 3.4 Banking & Subaccounts (Paystack)
- `GET /api/banks/nigeria` — Retrieve verified list of 280+ Nigerian financial institutions.
- `POST /api/banks/resolve` — Verify NUBAN account number against selected bank code.
- `POST /api/business/subaccount` — Create or update Paystack Subaccount for direct artisan split settlement.

---

## 4. Webhook Handlers

### 4.1 Paystack Webhook
- **Method:** `POST`
- **Route:** `/api/webhooks/paystack`
- **Signature Header:** `x-paystack-signature`
- **Verification:** HMAC-SHA512 using `PAYSTACK_SECRET_KEY`.
- **Supported Events:**
  - `charge.success`: Idempotently marks invoice as `PAID`, records payment audit log, and triggers Google Review request.

### 4.2 Stripe Webhook
- **Method:** `POST`
- **Route:** `/api/webhooks/stripe`
- **Signature Header:** `stripe-signature`
- **Verification:** HMAC-SHA256 using `STRIPE_WEBHOOK_SECRET`.
- **Supported Events:**
  - `checkout.session.completed`: Marks associated invoice as `PAID` and triggers post-payment workflows.

### 4.3 Resend Email Bounce Webhook
- **Method:** `POST`
- **Route:** `/api/webhooks/resend`
- **Verification:** Bearer token or HMAC secret check.
- **Supported Events:**
  - `email.bounced`: Updates invoice delivery status to `BOUNCED` and surfaces warning banner on dashboard.

---

## 5. Background Automation Crons

Crons are triggered by external schedulers (e.g., Vercel Cron, GitHub Actions) via `Authorization: Bearer <CRON_SECRET>`.

### 5.1 Quote Follow-Up Daemon
- **Route:** `GET /api/cron/quote-followup`
- **Schedule:** Daily (`0 9 * * *`)
- **Logic:** Identifies quotes in `SENT` status older than 3 days with no prior follow-up. Dispatches polite email reminder and logs activity.

### 5.2 Overdue Invoice Daemon
- **Route:** `GET /api/cron/invoice-overdue`
- **Schedule:** Daily (`0 8 * * *`)
- **Logic:** Transitions past-due `SENT` invoices to `OVERDUE` status and alerts operator.

### 5.3 Review Request Daemon
- **Route:** `GET /api/cron/review-reminder`
- **Schedule:** Daily (`0 10 * * *`)
- **Logic:** Identifies review requests in `SENT` status > 4 days old with no response. Sends a friendly follow-up request (respects customer unsubscribe status).

