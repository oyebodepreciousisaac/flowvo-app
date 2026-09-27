# Project Brief

> Last updated: 2026-09-27 — State: DISCOVERY

## Working title

Lead-to-Cash Automation (working title only — do not treat as final product name)

## Core user hypothesis

HYPOTHESIS: Solo and micro-team (1–5 person) trade/service business owners — plumbers, electricians, HVAC technicians, cleaners, landscapers, handymen — who run 10–50 jobs/month and manage enquiries, quotes, jobs, invoicing, and payment follow-up without a coherent connected system.

## Core workflow hypothesis

HYPOTHESIS: Lead → instant acknowledgement → qualification → quote → quote follow-up → accepted job → job scheduling → job completion → invoice → payment follow-up → Google review request → dormant lead reactivation.

Five handoffs most likely to fail without automation:
1. Lead → acknowledgement (delayed or missed response)
2. Quote → follow-up (sent and forgotten)
3. Job complete → invoice (depends on owner memory)
4. Invoice → payment chasing (emotionally avoided)
5. Payment confirmed → review request (never happens)

## Problem statement

INTERPRETATION (not yet confirmed by user interviews):
Small trade/service business owners run a recurring multi-step workflow from enquiry to payment, but the steps are fragmented across WhatsApp, email, spreadsheets, and disconnected tools. No single lightweight product connects all five critical handoffs without demanding significant configuration or commitment to a full field-service management platform. The owner's memory is the only glue — and it consistently fails during busy operational periods.

## Job-to-be-done

HYPOTHESIS: When a new enquiry comes in, a trade business owner wants to respond instantly, convert it to a job without losing track, complete the job and get paid promptly, and earn a review — without spending non-billable time on admin or remembering to do each step manually.

## Existing alternatives

See [docs/03-COMPETITOR-RESEARCH.md](03-COMPETITOR-RESEARCH.md) for full analysis.

Summary:
- **Jobber, Housecall Pro**: Too broad and expensive for the 10–30 job/month solo operator
- **ServiceM8**: Closest competitor; free tier validates the segment; iOS-first is a constraint
- **Tradify**: Trade-specific but per-user pricing penalises small teams
- **Wave + Google Calendar**: The actual status quo for the target user — functional but no handoff automation
- **Airtable + n8n (custom build)**: Done-for-you alternative; not self-serve

Critical question: What does our product do that ServiceM8's free tier does not, in a way a solo operator would notice and pay for?

## MVP hypothesis

HYPOTHESIS (not yet scoped): The smallest product is a web application that covers the five handoff steps above for one type of service business, with automated lead acknowledgement, quote-to-job transition, job-complete → invoice trigger, and Google review request. Reactivation is a later feature.

**This hypothesis requires user interview evidence before committing to scope.**

## Primary outcome

HYPOTHESIS: Owner does fewer manual follow-ups, gets paid faster on average, accumulates Google reviews without effort, and can see the current status of every live job in one place.

**Metrics to be defined from user evidence — not invented.**
