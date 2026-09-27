# Start Here — Lead-to-Cash Automation Project

This is a new product workspace derived from the Oyebode master template. The two reusable skills and the Skill Creator infrastructure are kept intact.

## The goal

Move from a concrete workflow problem to a real, deployable SaaS product without spending weeks on research that does not affect a decision.

## Working concept

Lead → response → qualification → quote → quote follow-up → job → completion → invoice → payment follow-up → review/reactivation.

This is still a hypothesis. Validate the wedge before building the full workflow.

## Order of work

1. `/oyebode-builder` — focused problem investigation.
2. Validate enough to define a specific user, workflow, wedge and MVP.
3. `/oyebode-builder` — define the smallest coherent MVP.
4. `/oyebode-product-brand-studio` — create the product-specific identity and DESIGN.md.
5. `/oyebode-builder` — engineering-readiness review.
6. `/plan` — create and review the implementation plan.
7. `/oyebode-builder` — build one vertical slice.
8. Verify the slice with tests and browser usage.
9. Record evidence and decide the next slice.
10. Repeat until the MVP is live.

## Anti-nonsense rule

Do not build a broad field-service platform. Do not add AI for appearance. Do not keep researching after the critical product decisions are clear. Do not create empty documentation for its own sake.

## Source of truth

Product decisions belong in `docs/`.
The current product design belongs in `docs/DESIGN.md` once Product Brand Studio creates it.
The implementation plan is created through Antigravity `/plan` and should be reviewed before execution.

## Skill Creator protection

Do not modify the `skill-creator/` directory during this project.
