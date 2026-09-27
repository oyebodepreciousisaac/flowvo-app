---
name: oyebode-product-brand-studio
description: >
  Use this skill whenever a real SaaS, software product, AI product, automation product, or digital
  solution needs its own brand identity, visual direction, design system, UX/UI language, product
  voice, or reference-website analysis. Trigger when the user wants product brand guidelines, wants a
  product to feel premium/professional/real, asks to study or extract the design language of another
  website, wants to avoid a generic AI-generated look, or moves a validated solution into product
  design. Do not use this for Oyebode Precious's personal brand or personal website unless that site
  itself is the product being designed.
compatibility: >
  Works with Antigravity, filesystem/project tools, browser/web inspection, and exported design-system
  artifacts. It can consume DESIGN.md, style.md, screenshots, tokens, or existing brand guides.
---

# Oyebode Product Brand Studio
### Product problem → Product identity → Product experience → Original design system

## 1. Purpose

Create an original, product-specific brand and design system for every real solution Oyebode builds.

Keep the two identities separate:

**Builder identity**
Oyebode Precious Isaac · SaaS Product Engineer · Problem → Product → Production

**Product identity**
The actual software being built, with its own name, positioning, audience, voice, personality, colors,
typography, visual language, interaction style, and design system.

Do not automatically apply Oyebode's personal colors or personal-website style to a product.

The product's users, problem, category, positioning, workflow, trust requirements, and evidence determine
its identity.

Read `references/01-product-brand-method.md` for the brand-strategy framework.

---

## 2. Trigger conditions

Use this skill when:
- a product needs a name, positioning, brand, or design system
- the user supplies reference websites
- the user asks why a website feels polished or professional
- the user wants to extract visual/design rules from real products
- the UI feels generic, template-like, or “AI generated”
- competitors/category leaders should be studied visually
- a validated solution is entering prototype/MVP design
- an existing product needs a visual redesign without changing its validated purpose

Do not trigger the full workflow for a small isolated CSS fix or for the personal website.

---

## 3. Operating rule

Do not start with colors.

Start with:

**Problem → User → Job → Market → Positioning → Product behavior → Brand → UX → UI**

A beautiful interface that does not fit the workflow is not a successful product design.

---

## 4. Product context

Before defining the visual system, establish:
- product/working name
- problem being solved
- primary user
- buyer/payer when different
- job-to-be-done
- core workflow
- value proposition
- category
- business model when known
- environment of use
- trust/privacy/accessibility requirements
- known alternatives/competitors
- product constraints

Mark uncertain items as assumptions. If the problem is still uncertain, return to the Solution Builder's
PRECIOUS process rather than locking a large identity prematurely.

---

## 5. Reference website intelligence

Treat reference websites as **research evidence**, not templates to clone.

Prefer 2–5 references when practical, selected for different reasons such as category relevance,
interaction quality, information hierarchy, onboarding, dashboard/data presentation, trust, or
accessibility.

### Extract three layers

**A. Visual tokens**
- colors and semantic roles
- typography families, sizes, weights, line heights
- spacing rhythm
- containers/grid
- borders/radii/shadows
- controls and iconography
- imagery
- motion
- responsive behavior

**B. Structural patterns**
- navigation
- page hierarchy
- hero/CTA composition
- content density
- cards/tables/forms
- filters/search
- onboarding
- settings
- dashboards
- notifications
- empty/loading/error/recovery states
- responsive transitions

**C. Design character**
Explain what the interface communicates: calm, technical, editorial, dense, approachable, trustworthy,
operational, playful, precise, etc., and identify the concrete choices that create that impression.

Read `references/02-reference-analysis.md` for the extraction and synthesis method.

---

## 6. Evidence and extraction quality

Use the strongest available evidence:

1. user-provided design-system export
2. browser/page inspection and screenshots
3. computed styles / DOM / CSS
4. dedicated site-design extraction tools
5. visual inspection alone

If the user supplies `DESIGN.md`, `style.md`, tokens, screenshots, or similar material, treat it as source
material and do not invent missing values.

A tool such as MYDESIGN.MD or an equivalent extractor can be used when available, but the workflow must
remain vendor-neutral. If exact values are unavailable, label them as observed/approximate.

Never state inferred design intent as a measured fact.

---

## 7. Extract principles, not identity

Learn from a reference:
- hierarchy
- information density
- spacing rhythm
- component geometry
- interaction conventions
- information architecture
- accessibility patterns
- motion restraint
- trust signals
- content presentation

Do not copy:
- logos/wordmarks
- product names
- proprietary illustrations or mascots
- distinctive imagery
- exact marketing copy/claims
- source code
- a distinctive composition so closely that the new product becomes a replica

For important references, record:

**Observed pattern → Evidence → Why it may work → Applicability → Product-specific adaptation**

---

## 8. Synthesize before designing

Compare the references first.

Separate:
- category conventions
- common patterns
- reference-specific choices
- product-specific requirements
- assumptions

A common pattern is not automatically correct. The product workflow wins.

Use the pattern table from `references/02-reference-analysis.md` when useful.

---

## 9. Product brand strategy

Create:

### Product essence
One sentence describing the product and value it creates.

### Positioning
**For** [user] **who** [problem], **product** is a [category] **that** [value], **unlike** [alternative]
**because** [meaningful difference].

### Brand personality
Choose 3–5 traits that change design decisions, such as precise, calm, dependable, practical,
approachable, bold, editorial, technical, or intelligent.

### Product voice
Define how the product speaks to its users. Avoid generic “AI brand voice” unless the product actually
needs that positioning.

### Trust model
Define what the interface should communicate about reliability, privacy, accuracy, transparency,
control, and professionalism.

### Brand anti-patterns
Define what would make this particular product feel wrong.

---

## 10. Product design system

Create an implementation-ready system with semantic rules.

### Color
Define roles for background, surface, text, muted text, border, primary, secondary, accent, success,
warning, error, info, focus, and dark/light behavior when relevant.

### Typography
Define families, scale, weights, line heights, tracking, display/headings/body/labels/metadata, and
code/technical text when relevant.

### Layout
Define containers, grid, spacing scale, section rhythm, page margins, responsive behavior, and density.

### Shape and depth
Define radii, borders, shadows/elevation, dividers, and focus treatment.

### Components
Define only components the product actually needs. For each important component cover purpose, anatomy,
variants, sizes, states, content rules, accessibility, and responsive behavior.

Read `references/03-design-system-template.md` for the implementation template.

---

## 11. UX is part of the brand

A product feels real because its behavior is coherent, not because the landing page is attractive.

Define:
- time-to-value
- navigation model
- information hierarchy
- primary action per screen
- progressive disclosure
- confirmations
- undo/recovery
- permissions
- empty/loading/error states
- destructive-action protection
- keyboard/accessibility behavior
- mobile/responsive behavior

For AI features also define what the system knows, what it does not know, user control, edit/approve/
reject actions, sources where useful, retry/fallback, and human review.

Never use “AI magic” as a substitute for understandable product behavior.

---

## 12. Anti-generic-AI design gate

Treat these as warning signals, not absolute bans:
- decorative gradients with no semantic reason
- default purple/blue AI palettes across unrelated products
- excessive glassmorphism
- rounded cards everywhere
- giant hero typography that hides the real product
- floating blobs/glows
- “AI-powered” attached to everything
- excessive motion
- fake metrics/testimonials
- repeated three-card feature grids
- meaningless statistics
- excessive whitespace where operational density is needed
- generic illustrations replacing actual product states
- identical templates across unrelated products

For every questionable element ask:

**What does this help the user understand, do, trust, or remember?**

If there is no meaningful answer, remove it or justify it.

Read `references/04-ai-looking-ui-review.md` for the review rubric.

---

## 13. Originality and coherence gate

Before implementation confirm:
- product identity is distinct from Oyebode's personal brand
- reference influence has been abstracted into principles
- the system is internally consistent
- the design fits the users and category
- the interface reflects the actual workflow
- copied logos/assets/copy are absent
- fabricated metrics/testimonials are absent
- accessibility is considered
- responsive behavior exists
- state handling exists
- the system is implementable with the chosen stack

If the product looks too close to a reference, revise the synthesis.

---

## 14. Implementation handoff

Create only the useful artifacts, typically:

```text
/docs/
  PRODUCT-BRAND.md
  DESIGN.md
  UX-GUIDELINES.md
  COMPONENT-GUIDELINES.md
  PRODUCT-VOICE.md
  REFERENCE-ANALYSIS.md
  design-tokens.json
```

`PRODUCT-BRAND.md` = strategy and identity.
`DESIGN.md` = implementation-facing visual source of truth.
`UX-GUIDELINES.md` = interaction behavior.
`REFERENCE-ANALYSIS.md` = the reasoning/evidence behind design decisions.

Do not create empty documents simply to satisfy a checklist.

---

## 15. Frontend handoff questions

Before writing UI code, the agent should be able to answer:

1. What problem does this screen solve?
2. Who uses it?
3. What is the primary action?
4. What information is essential?
5. What states exist?
6. Which design-system rules apply?
7. Which tokens apply?
8. What happens at smaller breakpoints?
9. What accessibility behavior is required?
10. What evidence will tell us the screen works?

If those answers are unclear, continue product/UX reasoning before polishing the UI.

---

## 16. Design review order

Review in this order:

**1. Product truth** — Does the screen represent the real workflow?

**2. UX quality** — Can users understand, act, and recover from failure?

**3. Visual system** — Are hierarchy, type, spacing, color, components, and states coherent?

**4. Product character** — Does it feel distinctive and intentional rather than template-generated?

Fix higher-level problems before visual polish.

---

## 17. Output structure

When starting from scratch:

# Product Brand & Design Direction

## Product understanding
## Target user and job
## Market/category context
## Reference sites and rationale
## Reference findings
## Transferable design principles
## Product positioning
## Brand personality and voice
## Visual direction
## Color system
## Typography system
## Layout/spacing system
## Component language
## UX behavior principles
## Motion/interaction
## Responsive rules
## Accessibility rules
## Anti-generic-AI review
## Originality/coherence review
## Implementation handoff
## Open questions
## Next decision

Move to concrete files/components/code only after the design decisions required for the current scope are
clear.

---

## 18. Decision tree

**New problem, product not defined?** → Use `oyebode-builder` discovery first.

**Product defined, identity unclear?** → Use this skill.

**Reference website supplied?** → Extract/analyze before designing.

**Existing design system supplied?** → Treat it as source evidence and preserve it unless redesign is requested.

**Existing validated brand?** → Use it; improve only when evidence or explicit direction requires it.

**User asks to clone a site exactly?** → Convert the request into reference analysis and original adaptation.

**Small CSS/UI fix only?** → Solve the local implementation task without running the full brand workflow.

**Personal website?** → Use the personal-site workflow.

---

## 19. Final principle

**Problem defines the product. Product defines the experience. Research informs the design. Brand makes the
experience recognizable. Evidence decides what stays.**

The goal is not to make every product look like one person. The goal is to help every product become the
most credible, usable, distinctive, and coherent version of itself.
