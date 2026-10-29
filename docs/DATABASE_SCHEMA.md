# Settlevo (Flowvo) — Database Schema & Data Dictionary

> **ORM:** Prisma v5  
> **Database Engine:** PostgreSQL (Neon Serverless / Supabase in Production, SQLite in Local Dev)  
> **Tenant Isolation Model:** Row-Level Logical Separation (`businessId` Foreign Key Constraint)  

---

## 1. Entity-Relationship Overview

```
+--------------------+        1:N        +--------------------+
|  BusinessProfile   | ----------------- |        User        |
+--------------------+                   +--------------------+
          |
          | 1:N
          +-----------------------------+-----------------------------+
          |                             |                             |
          v                             v                             v
+--------------------+        +--------------------+        +--------------------+
|        Lead        |        |       Quote        |        |        Job         |
+--------------------+        +--------------------+        +--------------------+
          |                             |                             |
          | 1:N                         | 1:N                         | 1:1
          v                             v                             v
+--------------------+        +--------------------+        +--------------------+
|    ActivityLog     |        |     QuoteItem      |        |      Invoice       |
+--------------------+        +--------------------+        +--------------------+
                                                                      |
                                                                      | 1:N
                                                                      v
                                                            +--------------------+
                                                            |   PaymentRecord    |
                                                            +--------------------+
                                                                      |
                                                                      | 1:1
                                                                      v
                                                            +--------------------+
                                                            |   ReviewRequest    |
                                                            +--------------------+
```

---

## 2. Core Tables & Schemas

### 2.1 `BusinessProfile`
The top-level multi-tenant container for an independent trade company.

| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | `@id @default(cuid())` | Primary key |
| `slug` | String | `@unique` | URL slug for public portal (e.g. `apex-plumbing-d1jf`) |
| `name` | String | | Legal trading name |
| `phone` | String | | Contact telephone number |
| `email` | String | | Business notification email |
| `currency` | String | `@default("NGN")` | Primary operating currency (`NGN`, `USD`, `GBP`, `EUR`) |
| `address` | String? | | Physical trading address |
| `logoUrl` | String? | | Branded vector/raster logo URL |
| `googleReviewUrl` | String? | | Public Google Business review deep-link |
| `bankDetailsEncrypted` | String? | | AES-256-GCM cipher string containing bank details |
| `paystackSubaccountCode` | String? | | Linked Paystack subaccount ID for split settlement |
| `createdAt` | DateTime | `@default(now())` | Registration timestamp |

### 2.2 `User` & `Session`
Authentication and role-based access management.

- `User`: Contains hashed password (`bcrypt` salt rounds = 12), user email, name, role (`BUSINESS_OWNER`, `STAFF`), and foreign key `businessId`.
- `Session`: High-entropy session token stored with strict expiration timestamp.

### 2.3 `Lead`
Inbound commercial inquiries captured from public portals or created by operators.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Primary Key |
| `businessId` | String | Foreign key to `BusinessProfile` |
| `name` | String | Customer full name |
| `email` | String | Customer email |
| `phone` | String | Customer phone number |
| `serviceRequired` | String | High-level service classification |
| `description` | String | Specific job requirements / customer notes |
| `budgetPreference` | String? | Stated budget expectation |
| `status` | Enum | `NEW`, `CONTACTED`, `QUALIFIED`, `WON`, `LOST` |

### 2.4 `Quote` & `QuoteItem`
Estimates delivered to prospective clients.

- `Quote`: Contains `businessId`, `leadId`, `totalAmount`, `status` (`DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`), and `quoteToken` (256-bit token for public access).
- `QuoteItem`: Line-item breakdown with description, quantity, unit price, and total line amount.

### 2.5 `Job`
Active operational task generated upon quote acceptance.

- Status states: `SCHEDULED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETE` / `CANCELLED`.
- Contains scheduled start and end dates, technician assignment, and customer location.

### 2.6 `Invoice` & `PaymentRecord`
Settlement instruments and financial audit records.

- `Invoice`: Sequential `invoiceNumber` (`INV-001`), `businessId`, `jobId`, `totalAmount`, `currency`, `dueDate`, `paymentStatus` (`DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`).
- `PaymentRecord`: Idempotent audit record storing transaction reference, gateway provider (`PAYSTACK`, `STRIPE`, `MANUAL`), amount paid, and timestamp.

### 2.7 `ReviewRequest`
Autonomous customer reputation loop.

- Tracks dispatch of Google Review requests upon invoice clearance, follow-up count, and customer unsubscribe preferences.

---

## 3. Database Indexes for High-Performance Queries

To ensure constant-time queries across tenant-isolated tables, Settlevo enforces multi-column B-Tree indexes:

```prisma
@@index([businessId, status])        // Optimized lead/quote/job dashboard filtering
@@index([businessId, paymentStatus]) // Fast overdue invoice retrieval
@@index([quoteToken])                // O(1) customer quote portal lookup
@@index([invoiceNumber, businessId]) // Fast sequential invoice verification
```
