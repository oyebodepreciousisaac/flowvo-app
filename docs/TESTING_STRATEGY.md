# Settlevo (Flowvo) — Automated Testing Suite & QA Test Matrix

> **Testing Framework:** Vitest v2.1.9 with V8 Code Coverage  
> **Test Status:** 12 Test Suites Passing | 79 of 79 Automated Tests Passing (100% Success Rate)  
> **Execution Duration:** ~25 seconds  

---

## 1. QA Philosophy & Test Coverage Strategy

Settlevo relies on multi-layer automated testing:
- **Unit Testing**: Isolated logic validation for password hashing, currency conversion, timing-safe cryptographic comparisons, and VAT computations.
- **Integration Testing**: End-to-end database operations against SQLite/PostgreSQL through Prisma ORM for lead intake, quote transitions, job dispatching, and auto-invoice drafting.
- **Security & Threat Testing**: Direct simulation of malicious payloads, timing attacks, missing webhook signatures, CSRF tampering, and cross-tenant IDOR access attempts.
- **Idempotency Testing**: Verifying that recurring webhooks, duplicated payment events, and automated cron cycles execute without duplicate side-effects.

---

## 2. Test Suites Summary Matrix

| Suite File | Scope / Slice | Tests | Status | Execution Focus |
| :--- | :--- | :---: | :---: | :--- |
| `security-remediation.test.ts` | OWASP ASVS Remediation | 13 | **PASS** | Webhook verification, fail-closed auth, timing-safe signatures |
| `slice-a-payments.test.ts` | Payment Gateway Rails | 15 | **PASS** | Paystack subaccounts, Stripe sessions, payment idempotency |
| `slice-d-security.test.ts` | Cryptography & Data Vault | 9 | **PASS** | AES-256-GCM bank encryption, token entropy, key rotation |
| `slice1.test.ts` | Auth & Onboarding | 5 | **PASS** | Password hashing, session creation, email dispatch mock |
| `slice2.test.ts` | Inbound Lead Intake | 4 | **PASS** | Honeypot anti-spam, lead creation, activity log auditing |
| `slice3.test.ts` | Quotation State Machine | 8 | **PASS** | Interactive quote acceptance, quote rejection, quote follow-up cron |
| `slice4.test.ts` | Job Execution & Invoicing | 4 | **PASS** | Job status transitions, sequential invoice drafting (`INV-001`) |
| `slice5.test.ts` | Invoice Lifecycle & Overdue | 4 | **PASS** | Overdue invoice cron runner, Resend bounce webhook processing |
| `slice6.test.ts` | Reputation & Review Engine | 5 | **PASS** | Google review triggers, unsubscribe handling, review reminder cron |
| `slice7.test.ts` | Operational Hardening | 6 | **PASS** | System `/api/health`, dashboard action priority ordering |
| `live-status.test.ts` | Real-Time Live Sync | 1 | **PASS** | Live fingerprint calculation and badge counts |
| `pwa.test.ts` | Progressive Web App | 5 | **PASS** | Manifest validity, icon assets, service worker, offline fallback |
| **TOTAL** | **12 Test Suites** | **79** | **PASS** | **100% Operational Pass Rate** |

---

## 3. Detailed Catalog of All 74 Test Cases

### 1. `security-remediation.test.ts` (13 Tests)
1. `rejects Paystack webhook missing x-paystack-signature header with 401`
2. `rejects Paystack webhook with invalid signature with 401`
3. `verifies Paystack webhook with valid signature and processes event`
4. `rejects Stripe webhook missing stripe-signature header with 400`
5. `rejects Stripe webhook with invalid signature with 400`
6. `verifies Stripe webhook with valid signature and processes event`
7. `rejects Resend bounce webhook with invalid secret`
8. `rejects public quote receipt upload without valid quoteToken`
9. `allows quote receipt upload with valid quoteToken`
10. `allows authenticated quote receipt upload with internal ID`
11. `enforces production encryption key requirement`
12. `timing-safe comparison rejects different length buffers`
13. `timing-safe comparison accepts identical buffers`

### 2. `slice-a-payments.test.ts` (15 Tests)
14. `calculates Paystack subaccount split settlement percentage accurately`
15. `validates NUBAN bank account resolution payload`
16. `handles invalid bank code gracefully`
17. `creates Stripe checkout session with line items and currency`
18. `processes Paystack charge.success webhook event`
19. `idempotently processes duplicate invoice payment events without duplicate execution`
20. `creates PaymentRecord with transaction reference and payment provider`
21. `transitions invoice to PAID status on successful settlement`
22. `records activity log entry upon invoice payment`
23. `triggers Google Review request creation upon invoice settlement`
24. `verifies currency formatting for NGN with proper symbol and separators`
25. `verifies currency formatting for USD with proper decimals`
26. `verifies currency formatting for GBP`
27. `verifies currency formatting for EUR`
28. `handles zero-amount invoices appropriately`

### 3. `slice-d-security.test.ts` (9 Tests)
29. `encrypts bank details using AES-256-GCM`
30. `decrypts encrypted bank details accurately`
31. `fails decryption when authentication tag is tampered with`
32. `fails decryption when ciphertext is tampered with`
33. `generates unique IV for each encryption operation`
34. `generates 256-bit cryptographically secure session tokens`
35. `enforces password strength requirements (min 8 chars, mixed case, numbers)`
36. `rejects weak passwords below minimum complexity threshold`
37. `hashes passwords with bcrypt salt rounds = 12`

### 4. `slice1.test.ts` (5 Tests)
38. `registers a new business profile and initial owner user`
39. `hashes owner password before storage`
40. `authenticates valid user credentials and generates session`
41. `rejects invalid login credentials with uniform timing delay`
42. `simulates transactional email send in test environment`

### 5. `slice2.test.ts` (4 Tests)
43. `creates a Lead with default NEW status and creates associated ActivityLogs`
44. `logs failure to ActivityLog when email fails while preserving the Lead record`
45. `rejects lead submissions with populated honeypot website field`
46. `associates lead with correct businessId tenant isolation`

### 6. `slice3.test.ts` (8 Tests)
47. `creates Quote in DRAFT status and transitions lead to CONTACTED`
48. `accepting a quote sets quote=ACCEPTED, lead=WON, and auto-creates a Job record`
49. `declining a quote sets quote=DECLINED and lead=LOST`
50. `generates high-entropy quoteToken for customer portal access`
51. `calculates quote subtotal and total based on line items`
52. `calculates tax and discount rates accurately`
53. `only matches quotes sent >3 days ago with no prior follow-up in follow-up cron`
54. `follow-up cron query is idempotent and does not dispatch duplicate emails`

### 7. `slice4.test.ts` (4 Tests)
55. `allows transitions from SCHEDULED to IN_PROGRESS and to COMPLETE`
56. `allows direct transition from SCHEDULED to COMPLETE (skipping IN_PROGRESS)`
57. `generates sequential invoice numbers per business (INV-001, INV-002)`
58. `auto-drafts invoice when job is completed with copied customer data and line items`

### 8. `slice5.test.ts` (4 Tests)
59. `generates sequential invoice numbers per business starting at INV-001`
60. `sets past-due SENT invoices to OVERDUE and writes activity log in overdue cron`
61. `updates emailDeliveryStatus to BOUNCED on Resend bounce event`
62. `ignores non-bounce webhook events without modifying records`

### 9. `slice6.test.ts` (5 Tests)
63. `blocks review request and logs activity when googleReviewUrl is missing`
64. `blocks subsequent review requests if customer previously unsubscribed`
65. `dispatches review request email when conditions are met`
66. `finds and processes eligible review requests >4 days old without duplicates in reminder cron`
67. `review reminder cron is idempotent across multiple executions`

### 10. `slice7.test.ts` (6 Tests)
68. `returns status ok and db connected on GET /api/health`
69. `hashes password and verifies matches correctly in change password logic`
70. `rejects change password when current password does not match`
71. `identifies action items and groups them according to severity on dashboard action strip`
72. `orders priority actions with overdue invoices as critical`
73. `orders pending quote follow-ups as action-needed`

### 11. `live-status.test.ts` (1 Test)
74. `calculates accurate count summary and fingerprint for business in live status API`

### 12. `pwa.test.ts` (5 Tests)
75. `provides a valid manifest.json with standalone display mode and icons`
76. `verifies all PWA icon assets exist on disk with valid file sizes`
77. `verifies sw.js service worker implementation and cache strategy`
78. `verifies offline.html exists with retry action`
79. `verifies PWA install utility detects environment gracefully`

