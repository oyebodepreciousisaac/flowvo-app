# Settlevo (Flowvo)

> **Autonomous Lead-to-Cash Workflow & Direct Settlement Platform for Modern Trade & Service SMBs.**  
> Built with Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, PostgreSQL (Neon), Tailwind CSS, Paystack, Stripe, and Resend.

---

## Overview

Settlevo closes the **"Lead-to-Cash Chasm"** for independent trade contractors, technicians, and field service businesses (plumbing, electrical, HVAC, tiling, carpentry). It coordinates inbound inquiries, estimate approvals, job execution, invoice drafting, dual-rail payment settlement, and customer reputation into an automated, deterministic pipeline.

```
Public Enquiry ──► Auto-Ack Lead ──► Interactive Quote ──► Scheduled Job ──► Auto-Draft Invoice ──► Direct Settlement ──► Google Review
```

---

## Key Features

- **Public Branded Enquiry Portals**: Slug-based mobile intake forms (`/enquiry/[businessSlug]`) with anti-spam honeypot and instant automated customer acknowledgment.
- **Interactive Digital Quotations**: Tokenized customer portals (`/q/[quoteToken]`) with itemized pricing, tax computation, and digital acceptance signatures.
- **Automated Job Provisioning**: Quote acceptance immediately provisions a scheduled job with inherited line items and customer records.
- **Zero-Lag Invoicing**: Marking a job as completed instantly auto-drafts a sequential invoice (`INV-001`, `INV-002`) ready for one-click dispatch.
- **Dual Payment Settlement Rails**:
  - **Paystack (NGN)**: Direct bank transfer & debit card settlement into artisan accounts via Paystack Subaccounts and NUBAN bank resolution.
  - **Stripe (USD / GBP / EUR)**: Hosted checkout sessions with Apple Pay and Google Pay for international clients.
- **Autonomous Background Crons**: Follow up on stalled quotes, escalate overdue invoices, and trigger Google review reminders.
- **Enterprise-Grade Security**: AES-256-GCM encryption for bank account storage, timing-safe HMAC webhook verification, and OWASP ASVS Level 2 compliance.
- **Progressive Web App (PWA) & Mobile Handover**: Instant installability on iOS and Android with offline caching, bottom-sheet install guidance, and desktop-to-mobile QR transfer from the dashboard.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Components, Route Handlers) |
| **UI & Styling** | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Lucide React](https://lucide.dev) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org) (via [Neon Serverless](https://neon.tech)) & [Prisma ORM 5](https://www.prisma.io) |
| **Payments** | [Paystack](https://paystack.com) (Subaccounts, NGN Rails) & [Stripe](https://stripe.com) (Global Multi-Currency) |
| **Transactional Mail** | [Resend](https://resend.com) with custom HTML templates |
| **Testing** | [Vitest](https://vitest.dev) (79 passing unit, integration, and security tests) |

---

## Quickstart & Local Development

### 1. Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/oyebodepreciousisaac/settlevo.git
cd settlevo/flowvo

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### 3. Environment Variables
Populate `.env.local` with your configuration:
```env
DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@host/db for PostgreSQL
NEXTAUTH_SECRET="your-32-byte-hex-secret"
ENCRYPTION_KEY="your-32-byte-hex-key-for-bank-details"
CRON_SECRET="your-cron-secret-token"
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="Settlevo <notifications@yourdomain.com>"
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Migrations
```bash
# Generate Prisma Client & apply migrations
npm run db:migrate
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Testing & Quality Assurance

The codebase includes an automated test suite verifying business logic, database mutations, idempotency, and OWASP security controls:

```bash
cd flowvo
npm test
```

```
 Test Files  12 passed (12)
      Tests  79 passed (79)
   Duration  ~25s (100% pass rate)
```

For full test suite details and the complete test catalog, refer to the [Testing Strategy Guide](docs/TESTING_STRATEGY.md).

---

## Architecture & Documentation

Comprehensive engineering documentation is available in the [`docs/`](docs/) directory:

- [System Architecture](docs/ARCHITECTURE.md) — 5-stage lifecycle state machine, domain entities, and data flows.
- [API Reference](docs/API_REFERENCE.md) — REST API endpoints, webhooks, and background cron runners.
- [Database Schema](docs/DATABASE_SCHEMA.md) — Prisma schema entities, relationships, indexes, and constraints.
- [Security Audit Report](docs/SECURITY_AUDIT.md) — OWASP ASVS assessment and cryptographic vulnerability remediation.
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — Instructions for hosting on Vercel with Neon PostgreSQL.
- [Portfolio Case Study](docs/CASE_STUDY.md) — Business context, operational challenges, and measured client impact.

---

## Project Structure

```text
settlevo/
├── docs/                      # Production engineering documentation
│   ├── ARCHITECTURE.md        # System design & state machines
│   ├── API_REFERENCE.md       # API endpoints, webhooks & crons
│   ├── DATABASE_SCHEMA.md     # Relational schema & indexes
│   ├── SECURITY_AUDIT.md      # OWASP security assessment
│   ├── DEPLOYMENT_GUIDE.md    # Production setup manual
│   ├── TESTING_STRATEGY.md    # Complete 74-test QA catalog
│   └── CASE_STUDY.md          # Business impact case study
├── flowvo/                    # Next.js 16 full-stack web application
│   ├── prisma/                # Database schema & migrations
│   ├── public/                # Static assets & brand vectors
│   ├── src/
│   │   ├── __tests__/         # 11 Vitest test suites (74 tests)
│   │   ├── app/               # App Router pages & API routes
│   │   ├── components/        # UI & layout components
│   │   └── lib/               # Auth, payments, crypto & email
│   ├── package.json           # Dependencies and scripts
│   └── vercel.json            # Deployment & cron configuration
└── README.md                  # Project overview & quickstart
```

---

## License

This project is licensed under the [MIT License](LICENSE).
