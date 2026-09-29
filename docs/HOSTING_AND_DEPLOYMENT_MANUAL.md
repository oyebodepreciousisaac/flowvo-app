# Flowvo — Production Hosting & Deployment Manual

This manual provides precise, step-by-step instructions for hosting and operating Flowvo in a secure, scalable production environment.

---

## 1. Production Architecture Overview

| Component | Recommended Provider | Alternative |
| :--- | :--- | :--- |
| **Web & API Host** | [Vercel](https://vercel.com) | [Railway](https://railway.app), [Render](https://render.com) |
| **Relational Database** | [Neon](https://neon.tech) (PostgreSQL Serverless) | [Supabase](https://supabase.com) (PostgreSQL) |
| **Transactional Email** | [Resend](https://resend.com) | Amazon SES, Postmark |
| **Anti-Spam / CAPTCHA** | [Cloudflare Turnstile](https://dash.cloudflare.com) | Google reCAPTCHA v3 |
| **Payment Gateways** | [Paystack](https://paystack.com) (NGN) & [Stripe](https://stripe.com) (GBP/USD/EUR) | Manual bank transfers |
| **Scheduled Crons** | Vercel Cron (`vercel.json`) | GitHub Actions, Upstash QStash, cron-job.org |

---

## 2. Step 1: Push Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `flowvo` or `flowvo-app`). Set it to **Private**.
2. In your local terminal, add the remote and push your code:

```bash
git remote add origin https://github.com/<your-username>/flowvo.git
git branch -M main
git push -u origin main
```

---

## 3. Step 2: Provision a Cloud PostgreSQL Database

Because Vercel runs on serverless architecture (ephemeral containers with no persistent disk), SQLite is only for local testing. A hosted PostgreSQL database is required for production.

### Option A: Neon Serverless Postgres (Recommended — Fast & Free)
1. Go to [Neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, name it `flowvo-prod`, and choose your closest region (e.g., Frankfurt/London for Europe, Washington DC for US).
3. On the dashboard, copy the **Connection string** (choose **Pooled connection** string for serverless):
   ```text
   postgresql://user:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require
   ```

### Option B: Supabase (Alternative)
1. Go to [Supabase.com](https://supabase.com) and create a project.
2. Go to **Project Settings** → **Database** → **Connection string** (URI). Select **Transaction Pooler** (port 6543) or **Direct Connection** (port 5432).

---

## 4. Step 3: Switch Prisma to PostgreSQL for Production

In `flowvo/prisma/schema.prisma`:
Change line 6:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then push your schema to your new remote database:
```bash
cd flowvo
# Set DATABASE_URL in your local .env.local to your Neon connection string, then run:
npx prisma db push
```
*(This creates all tables, unique indices, and foreign keys in Neon/Supabase immediately).*

Commit this change to git:
```bash
git commit -am "chore(db): configure postgresql datasource for production"
git push origin main
```

---

## 5. Step 4: Generate Production Secrets

Run these two commands in PowerShell or bash to generate cryptographically secure 256-bit (64-character hex) keys:

```bash
# 1. Field-level encryption key (for securing API keys and payment records at rest)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Cron job authorization secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these two hex strings safely in a password manager.

---

## 6. Step 5: Deploy on Vercel

1. Log into [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Select your GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click `Edit` and select `flowvo`
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next`
4. Expand **Environment Variables** and add the following:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` (from Neon/Supabase) | Primary DB connection |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Canonical app URL for links & CSRF |
| `FIELD_ENCRYPTION_KEY` | *(64-char hex key from Step 4)* | AES-256-GCM field encryption |
| `CRON_SECRET` | *(64-char hex key from Step 4)* | Protects background cron endpoints |
| `RESEND_API_KEY` | `re_...` (from [Resend](https://resend.com/api-keys)) | Outbound email delivery |
| `EMAIL_FROM` | `Flowvo <noreply@yourdomain.com>` | Verified domain sender address |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x...` (from Cloudflare) | Anti-spam public site key |
| `TURNSTILE_SECRET_KEY` | `0x...` (from Cloudflare) | Anti-spam server verification key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe Dashboard) | Verifies incoming Stripe events |
| `PAYSTACK_SECRET_KEY` | `sk_live_...` (from Paystack Dashboard) | Verifies incoming Paystack events |

5. Click **Deploy**. Vercel will build and deploy the app in ~60–90 seconds.

---

## 7. Step 6: Verify Vercel Cron Jobs

Flowvo includes `flowvo/vercel.json` which Vercel reads automatically on deployment:
- `/api/cron/quote-followup` (Runs every 6 hours)
- `/api/cron/invoice-overdue` (Runs daily at 08:00 UTC)
- `/api/cron/review-reminder` (Runs every 12 hours)

In Vercel:
1. Navigate to your project → **Settings** → **Cron Jobs**.
2. Verify that the 3 cron jobs are listed with status **Active**.
3. Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` using the `CRON_SECRET` environment variable you provided.

---

## 8. Step 7: Configure Payment Webhooks

### A. Paystack Configuration (for NGN / Nigeria)
1. Log into [Paystack Dashboard](https://dashboard.paystack.com) → **Settings** → **API Keys & Webhooks**.
2. Set **Live Webhook URL** to:
   ```text
   https://your-domain.vercel.app/api/webhooks/paystack
   ```
3. Copy your **Live Secret Key** (`sk_live_...`) and ensure it matches `PAYSTACK_SECRET_KEY` in Vercel.
4. Click **Save Changes**.

### B. Stripe Configuration (for GBP, USD, EUR)
1. Log into [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. Set **Endpoint URL** to:
   ```text
   https://your-domain.vercel.app/api/webhooks/stripe
   ```
4. Under **Select events to listen to**, select:
   - `checkout.session.completed`
5. Click **Add endpoint**.
6. Reveal the **Signing secret** (`whsec_...`), copy it, and paste it into Vercel as `STRIPE_WEBHOOK_SECRET`.
7. Redeploy your latest deployment in Vercel to pick up the updated secret.

---

## 9. Step 8: Post-Deployment Smoke Test Checklist

- [ ] **Health Endpoint**: Visit `https://your-domain.vercel.app/api/health` — it should return:
  ```json
  {"status":"ok","timestamp":"...","database":"connected"}
  ```
- [ ] **Admin Registration**: Visit `https://your-domain.vercel.app/register` and create your production business account.
- [ ] **Configure Business Profile**: Visit `/settings`:
  - Set Business Name, Email, Country, and Default Currency.
  - Set Google Review Link.
  - Configure Bank Details / Payment Gateway.
- [ ] **Test Public Enquiry**: Visit `https://your-domain.vercel.app/enquiry/<your-business-slug>`. Submit a test enquiry and verify:
  - Lead appears instantly on your `/leads` dashboard.
  - Automated acknowledgement email arrives in your inbox.
- [ ] **Test Quote & Acceptance**: Create a quote, send it, open the client acceptance link, and approve it. Confirm that a job is scheduled and an invoice is generated.
- [ ] **Test Invoice Print Preview**: Open `/invoices/[id]/print` and test browser print dialog formatting.
