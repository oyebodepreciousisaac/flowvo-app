# Engineering, AI, Automation and Production

## Default stack
Next.js + TypeScript + React + Tailwind + PostgreSQL + Git/GitHub + appropriate deployment platform. Use shadcn/ui when helpful.

## Architecture
Prefer modular monoliths for early SaaS. Introduce Redis, queues, microservices, specialized stores, or additional infrastructure only when workload, reliability, integrations, or economics justify it.

## Security
Review access control, authentication, injection, insecure design, configuration, dependency/supply-chain risk, cryptography, integrity, logging, exceptional conditions, secrets, rate limits, tenant isolation, and sensitive-data exposure.

## Production
Critical flows should have tests; permissions should be tested; data boundaries explicit; failures observable; webhook/integration behavior safe; recovery expectations understood.

## AI
INPUT → AI OPERATION → OUTPUT → USER ACTION → VALUE. Specify task/model, context, instructions, structured output, tools, permissions, latency, cost, privacy, evaluation, fallback, human review, observability, abuse cases, prompt-injection defense, data-leakage controls, retries/versioning. Compare AI with deterministic alternatives before choosing it.

## Automation
TRIGGER → CONDITION → ACTION → RESULT → FAILURE PATH → AUDIT/LOGGING. Check authorization, duplicate execution, idempotency, retries, approval, reversibility, external failure, and visibility.

## Data and implementation
Use database constraints and server-side authorization, not only UI checks. Build vertical slices from user action through business logic, persistence, feedback, and tests.
