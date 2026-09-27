# Agent Instructions

This project template uses a three-layer operating model to keep product decisions, agent reasoning, and deterministic execution separate.

## Layer 1: Skills and project instructions

Use `.agents/skills/` for reusable operating procedures. The two product-building skills in this template are:

- `oyebode-builder` — the default system for turning a real problem into a validated, production-oriented product.
- `oyebode-product-brand-studio` — the companion system for creating a distinct brand/design system for a product.

Read the relevant skill instructions before substantial work. Keep project-specific decisions and source-of-truth artifacts in the project itself, especially under `docs/`.

## Layer 2: Agent orchestration

Your job is to route the user's intent through the right skill and tools, research when current facts matter, expose uncertainty, make trade-offs explicit, and execute when the direction is clear.

For a new solution, default to `oyebode-builder`.

When product identity or visual design needs to be created or analyzed, use `oyebode-product-brand-studio`, then return to `oyebode-builder` for implementation and product iteration.

Do not treat a reference website as a cloning target. Learn its design principles and adapt them to the product's users, workflow, category, and positioning.

## Layer 3: Deterministic execution

Use existing project scripts/tools before writing new ones. Create deterministic scripts under `execution/` only when a repeated task genuinely benefits from them. Keep temporary generated data in `.tmp/` and secrets in `.env` files that are never committed.

When a tool fails, inspect the actual error, fix the smallest responsible layer, rerun the relevant check, and record the useful learning in the project documentation when it will prevent recurrence.

## Evidence and quality

Do not invent product research, user evidence, metrics, testimonials, technical behavior, API contracts, or competitor facts. Distinguish FACT, ASSUMPTION, HYPOTHESIS, INTERPRETATION, DECISION, and UNKNOWN.

Prefer real user value and evidence over adding features quickly.

## Skill Creator protection

The `skill-creator/` directory is infrastructure for creating and evaluating skills. Do not modify, rename, delete, or reformat anything inside it during normal product work. Touch it only when the user explicitly asks for skill creation, improvement, evaluation, benchmarking, or packaging.
