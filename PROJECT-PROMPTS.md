# Project Prompt Sequence

Use these prompts in order. Do not skip directly to implementation.

## 1. Focused discovery

```text
/oyebode-builder

We are starting a new product investigation in this workspace.
Read PROJECT-README.md, docs/01-PROJECT-BRIEF.md and docs/00-OPERATING-GATE.md.

Treat the lead-to-cash concept as a hypothesis, not a validated product.
Use the PRECIOUS framework and focused research only.
Do not write application code.
Do not design the UI.
Do not spend time on broad market research that cannot change the product decision.

Determine:
- initial target user,
- recurring workflow problem,
- current workaround,
- economic/time/risk consequence,
- existing alternatives,
- plausible product wedge,
- smallest valuable workflow,
- critical unknowns.

Update the relevant docs/ artifacts and stop at the product decision gate.
```

## 2. Product definition

Run only after discovery is sufficiently clear.

```text
/oyebode-builder

Read the current approved discovery/validation artifacts.
Define the smallest coherent MVP for the lead-to-cash workflow.
Do not add unrelated CRM or field-service features.
Produce/refresh docs/05-MVP-SPEC.md and update docs/09-DECISION-LOG.md.
Stop before design and coding.
```

## 3. Product brand and UX

```text
/oyebode-product-brand-studio

Read the approved product artifacts in docs/.
Create an original product identity and design system for this product.
Use reference websites only as design research.
Do not copy another company's branding, assets, or distinctive identity.
Create docs/DESIGN.md and the product brand artifacts required by the skill.
Stop for review before implementation.
```

## 4. Engineering readiness

```text
/oyebode-builder

Read the approved product strategy, MVP spec and DESIGN.md.
Perform an engineering-readiness review.
Identify requirements, architecture constraints, integrations, data needs,
authentication/authorization, automation, analytics, security, testing,
deployment, and failure states.
Separate FACT, DECISION, ASSUMPTION, UNKNOWN and DEPENDENCY.
Do not code.
Update docs/07-ENGINEERING-READINESS.md and stop.
```

## 5. Implementation plan

Use Antigravity `/plan` after the engineering-readiness review.

```text
Use the approved docs as the source of truth.
Inspect the workspace.
Create a production-oriented implementation plan for the MVP.
Break the work into small vertical slices with explicit exit conditions.
Do not implement yet.
```

## 6. First slice

Only after the implementation plan is reviewed and approved.

```text
/oyebode-builder

Implement Slice 1 from the approved plan only.
Do not expand scope.
Follow docs/DESIGN.md.
After implementation, run typecheck, lint, tests, production build,
and browser verification. Fix Slice-1 issues only.
Report files changed, tests, verification, limitations and the next decision.
```

## 7. After every slice

```text
/oyebode-builder

Do not implement the next slice yet.
Verify the completed slice against the approved product strategy,
MVP spec, DESIGN.md and implementation plan.
Test functionally, technically and in the browser.
Record what worked, what failed, new evidence and product implications.
Update docs/10-LEARNING-LOG.md and docs/09-DECISION-LOG.md where appropriate.
Then propose the smallest next slice.
```
