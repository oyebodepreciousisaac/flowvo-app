# Competitor / Alternative Research

> Research scope: only what affects MVP positioning and scope decisions.
> Last updated: 2026-09-27

---

## Alternatives in the field

### 1. Jobber
- **Intended customer**: Small to mid-size field service businesses (1–25+ users)
- **Strongest part**: Scheduling, dispatching, client hub, automated follow-ups
- **Entry price**: ~£39/month (Core); scales to £599+/month (Plus)
- **Configuration burden**: Significant — multiple setup steps; full FSM feature surface
- **What's automated**: Reminders, quote follow-ups, invoice reminders; review requests via add-on
- **What remains manual**: Custom intake forms, payment channel selection, initial data entry
- **Source of complexity**: Feature breadth designed for growing teams, not solo operators
- **Implication for product**: Jobber is the "aspirational" upgrade. It is the right answer for a business doing 50+ jobs/month and willing to invest in setup. Solo operators at 10–30 jobs/month report it feels like overkill or too expensive for the volume. This is the gap.

### 2. ServiceM8
- **Intended customer**: Trades (iOS-first; popular in Australia and UK)
- **Strongest part**: Job management, mobile UX, unlimited users priced by job volume
- **Entry price**: Free (30 jobs/month); £29–£349/month by volume
- **Configuration burden**: Moderate; requires mobile setup; iOS-first is a real constraint
- **What's automated**: Invoices on job completion, SMS notifications, basic review requests
- **What remains manual**: Lead intake, quote-to-job transition if not using their forms
- **Implication for product**: ServiceM8 is a closer competitor. Free tier validates the 10–30 job/month segment. The iOS dependency and job-volume pricing model are weaknesses against a web-first, workflow-complete alternative.

### 3. Housecall Pro
- **Intended customer**: Home service businesses (US-focused)
- **Strongest part**: Online booking, automated invoicing, dispatching, team management
- **Entry price**: ~£59/month (Basic, billed annually); £199+ for advanced features
- **Configuration burden**: High — designed as a full all-in-one platform
- **Implication for product**: Strong US product, less relevant to UK/global micro-business. Same problem as Jobber: too broad for the solo operator segment.

### 4. Tradify
- **Intended customer**: Tradespeople (electricians, plumbers, builders) in UK, NZ, Australia
- **Strongest part**: Quote-to-invoice, job costing, mobile
- **Entry price**: ~£35/month per user
- **Implication for product**: Specifically trade-focused and quote-centric. A closer competitor on paper. Weakness: per-user pricing penalises solo operators who add staff; no apparent lead-capture-to-response automation.

### 5. Wave + Google Calendar (the lean stack workaround)
- **Who uses it**: Solo operators unwilling to pay for FSM software
- **What they get**: Free invoicing, free scheduling
- **What they lack**: Connected workflow — lead acknowledgement, quote follow-up, job-complete → invoice trigger, review request. Each step is manual and disconnected.
- **Implication for product**: This is the actual status quo for the target user. A product that connects Wave-equivalent invoicing with automated handoffs would beat this stack on the handoff problem specifically.

### 6. Airtable + n8n / Zapier / Make (DIY automation)
- **Who uses it**: Tech-comfortable freelancers, some trade business operators who have found Upwork automation builders
- **What they get**: Fully customisable lead-to-cash pipeline
- **What they lack**: No UI for non-technical users; requires ongoing maintenance; breaks when APIs change; total cost of ownership is higher than it appears when factoring builder fees
- **Implication for product (INTERPRETATION)**: This is the "done-for-you automation service" competitor. The source Upwork brief lives here. A SaaS product wins against this if it is genuinely usable without technical setup and more reliable than a custom n8n workflow.

---

## Evidence table

| Claim / observation | Source | Date | Evidence type | Implication |
|---|---|---|---|---|
| Jobber Core starts at ~£39/month with complex feature surface | Jobber pricing page (via research summary) | 2026 | FACT | Price/complexity creates a gap for the micro-business segment |
| ServiceM8 has a free tier up to 30 jobs/month | ServiceM8 pricing page | 2026 | FACT | Validates 10–30 job/month segment as worth serving |
| Reddit/community: Jobber described as "overkill" for small volume operators | Reddit (multiple threads) | 2024–2025 | FACT (qualitative) | A segment of users does not adopt the obvious alternative |
| n8n + Airtable "lead-to-cash" is a template sold on Upwork for £500–£2,000 per setup | Automation community content | 2026 | FACT | Done-for-you custom automation is a real competitive alternative |
| Tradify is specifically trade-focused in UK/ANZ but per-user pricing limits solo adoption | Research summary | 2026 | INTERPRETATION | A trade-focused product that avoids per-user pricing has structural pricing advantage |
| Review request automation is already built into Jobber, OctopusPro, and specialist review tools | Multiple sources | 2026 | FACT | Feature is not novel; must be bundled into a broader workflow, not sold standalone |

---

## Product gap (INTERPRETATION)

The gap is not a missing feature in an existing product. The gap is a **positioning gap**:

No current product is:
1. Priced and scoped for the solo or 2-person trade operator at 10–30 jobs/month
2. Workflow-complete without requiring configuration expertise
3. Web-first (not iOS-only)
4. Focused on the **handoff chain** (lead → quote → job → invoice → review) as the primary product surface rather than as a feature buried in a full FSM platform

The closest threat is ServiceM8 (free tier, trade-focused). The differentiation hypothesis must survive contact with ServiceM8 specifically.

UNKNOWN: Whether a trade business owner already using ServiceM8's free tier would pay for this product instead, and why.
