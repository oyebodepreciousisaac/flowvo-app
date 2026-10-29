# Settlevo (Flowvo) — Production Deployment & Operations Guide

> **Recommended Stack:** Vercel (Edge Serverless) + Neon Serverless PostgreSQL + Resend (Email) + Paystack & Stripe  

---

## 1. Prerequisites

Before deploying to production, ensure you have active accounts on:
1. **GitHub**: To host the application repository.
2. **Vercel**: Edge hosting and serverless compute.
3. **Neon** (`neon.tech`): Serverless PostgreSQL database with connection pooling.
4. **Resend** (`resend.com`): Transactional email API for client quotes and invoice notifications.
5. **Paystack** & **Stripe**: Gateway credentials for dual-currency payments.

---

## 2. Step-by-Step Production Deployment

### Step 1: Database Setup on Neon
1. Log in to [Neon.tech](https://neon.tech) and create a project named `flowvo-prod`.
2. Copy the **Pooled Connection String** (contains `-pooler` in the host domain):
   ```text
   postgresql://<user>:<password>@ep-example-pooler.eu-central-1.neon.tech/neondb?sslmode=require
   ```
3. Run migrations against your production database:
   ```bash
   cd flowvo
   DATABASE_URL="<your-neon-url>" npx prisma migrate deploy
   ```

### Step 2: Deploy to Vercel
1. Connect your GitHub repository to Vercel.
2. Set the **Root Directory** to `flowvo`.
3. Set the **Framework Preset** to Next.js.
4. Configure all mandatory environment variables (see table below).
5. Click **Deploy**.

---

## 3. Environment Variables Configuration Matrix

| Variable | Required | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Neon PostgreSQL Pooled Connection URL | `postgresql://user:pass@pooler.neon.tech/db?sslmode=require` |
| `NEXTAUTH_SECRET` | **Yes** | 256-bit random secret for sessions | Generate via `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | **Yes** | 32-byte hex key for AES-256 bank encryption | Generate via `openssl rand -hex 32` (64 chars) |
| `CRON_SECRET` | **Yes** | Bearer secret for automated background crons | Generate via `openssl rand -hex 24` |
| `RESEND_API_KEY` | **Yes** | Resend API key for transactional emails | `re_123456789...` |
| `EMAIL_FROM` | **Yes** | Verified sender email domain | `Settlevo <notifications@yourdomain.com>` |
| `PAYSTACK_SECRET_KEY` | **Yes** | Paystack live secret key | `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | **Yes** | Paystack live public key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key for multi-currency | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET`| Optional | Stripe signing secret for checkout events | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public application base URL | `https://flowvo.app` |

---

## 4. Webhook Registration

### 4.1 Paystack Webhook
- Navigate to **Paystack Dashboard** $\rightarrow$ **Settings** $\rightarrow$ **API Keys & Webhooks**.
- Set **Live Webhook URL** to:
  `https://<your-domain>/api/webhooks/paystack`
- Paystack will automatically sign all incoming webhook events using your `PAYSTACK_SECRET_KEY`.

### 4.2 Stripe Webhook
- Navigate to **Stripe Dashboard** $\rightarrow$ **Developers** $\rightarrow$ **Webhooks**.
- Add endpoint:
  `https://<your-domain>/api/webhooks/stripe`
- Select events: `checkout.session.completed`, `payment_intent.succeeded`.
- Copy the **Signing Secret** and assign it to `STRIPE_WEBHOOK_SECRET`.

---

## 5. Automated Background Crons

Settlevo ships with pre-configured cron tasks in `flowvo/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/quote-followup",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/invoice-overdue",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/review-reminder",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Vercel automatically sends the `CRON_SECRET` header when triggering these paths. If hosting elsewhere, configure scheduled HTTP requests with the header:
`Authorization: Bearer <YOUR_CRON_SECRET>`
