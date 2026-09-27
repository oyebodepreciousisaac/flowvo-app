---
name: oyebode-builder
description: >
  Use this skill whenever Oyebode Precious is turning a real problem, business workflow,
  customer pain, SaaS idea, AI/automation opportunity, or proposed solution into a real
  product. Trigger for problem discovery, research, PRECIOUS analysis, validation, MVP
  scope, product strategy, UX, architecture, implementation, AI/automation, testing,
  launch, measurement, iteration, or case-study evidence tied to a real product. Use it
  by default for multi-step solution-building work. Hand product-specific brand and design
  work to oyebode-product-brand-studio. Do not use it for unrelated one-off coding
  questions or Oyebode's personal website unless that website is the product under study.
compatibility: >
  Works with Antigravity, project/filesystem tools, and web research when current external
  facts matter. The detailed operating manual is BUILDER.md.
---

# Oyebode Builder

The canonical product-building workflow is:

**Problem → Research → PRECIOUS → User Discovery → Workflow → Value Hypothesis → Solution → MVP → UX → Product Brand when needed → Architecture → Engineering → AI/Automation where justified → Test → Launch → Measure → Learn → Iterate → Document → Distribute → Business Value**

## How to use this skill

Read `BUILDER.md` before taking a substantial multi-step product action. It is the full operating manual and contains the decision gates, research standards, technical defaults, AI/automation rules, quality gates, artifacts, and response formats.

Use the builder to decide **what should be built and why** before optimizing **how to code it**. When evidence is weak, return to discovery instead of hiding uncertainty inside implementation.

## Product-brand handoff

When a validated or sufficiently defined product needs its own identity or design system, invoke `oyebode-product-brand-studio`. That companion skill should research references and create product-specific design artifacts. Return to this builder for architecture and implementation using those artifacts as the UI source of truth.

## Identity boundary

Oyebode's personal brand is the builder context. Each product gets its own identity when appropriate. Do not automatically reuse Oyebode's personal colors, website, or visual language for a product.

## Evidence boundary

Keep **FACT / ASSUMPTION / HYPOTHESIS / INTERPRETATION / DECISION / UNKNOWN** separate. Never present invented metrics, users, revenue, testimonials, research findings, competitor details, or technical claims as real.

## Project artifacts

Prefer useful, decision-supporting artifacts in `docs/` such as `idea-brief.md`, `problem-research.md`, `precious-analysis.md`, `user-discovery.md`, `product-strategy.md`, `mvp-spec.md`, `ux-flows.md`, `architecture.md`, `data-model.md`, `ai-spec.md`, `analytics.md`, `test-plan.md`, `launch-plan.md`, `decision-log.md`, and `learning-log.md`. Create only what helps the project.

## Skill creator boundary

Do not modify the project's `skill-creator/` directory during normal product work. Use it only when the user explicitly asks to create, evaluate, improve, or package a skill.
