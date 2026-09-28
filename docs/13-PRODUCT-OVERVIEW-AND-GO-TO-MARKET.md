# 13. Product Overview, Strategy & Go-To-Market Guide

> **Document Status:** Complete  
> **Target Audience:** Business Founders, Marketing Teams, Sales, and Layman Operators  
> **Product Name:** Flowvo  
> **Category:** Lead-to-Cash Automation for Solo Trades & Service Pros  

---

## Part 1: Everything That Has Been Built (The Complete System)

Flowvo is a complete, production-ready **"Lead-to-Cash" software engine**. It handles the entire journey of a customer from the minute they ask for a job quote to the minute money hits the bank and a 5-star review is posted.

Here is what has been built across all 7 development slices:

### 1. Business & Owner Hub (Slice 1)
- **Account Creation & Login:** Secure password hashing (bcrypt), session tokens, and password reset flows.
- **Custom Business Identity:** Every business gets their own unique web link (e.g. `flowvo.app/enquiry/apex-heating`) with their phone, email, and branding.

### 2. Enquiry Capture & Fast Customer Reply (Slice 2)
- **Public Customer Form:** A clean, mobile-friendly enquiry form where customers request a quote.
- **Spam & Bot Protection:** Protected with Cloudflare Turnstile and IP rate limiting.
- **Instant Auto-Reply Email:** The moment a customer submits, Flowvo immediately sends a professional confirmation email so the customer knows they are being looked after.
- **Lead Pipeline:** Categorises every lead as `NEW`, `CONTACTED`, `QUOTED`, `WON`, or `LOST`.

### 3. Fast Quote Builder & 1-Click Customer Approval (Slice 3)
- **Quick Line-Item Quotes:** Create professional quotes with itemised labour, parts, and prices in under 60 seconds.
- **1-Click Customer Acceptance:** The customer receives an email with a secure link (`/q/[token]`) where they can tap **"Accept Quote"** or **"Decline"** directly from their phone with no printing, scanning, or login needed.
- **Automatic Follow-Up Reminder:** If a quote sits for 3 days with no answer, Flowvo automatically sends a gentle follow-up email.
- **Auto-Conversion:** Once accepted, the quote automatically converts into a scheduled Job and marks the lead as Won.

### 4. Job Scheduling & Auto-Invoice Drafting (Slice 4)
- **Job Calendar & Tracking:** Keeps track of scheduled dates and job status (`SCHEDULED` &rarr; `IN_PROGRESS` &rarr; `COMPLETE`).
- **Auto-Draft Invoice:** The moment the tradesperson taps **"Mark Job Complete"** on their phone in the van, Flowvo automatically drafts the invoice with all customer details and line items already filled in.

### 5. Invoicing, Overdue Chasing & Bank Details (Slice 5)
- **Professional Invoices:** Clean invoice layouts with sequential numbers (`INV-001`, `INV-002`) and direct bank transfer details (Sort Code and Account Number).
- **Email Delivery via Resend:** Invoices are delivered straight to the customer's inbox.
- **Automated Overdue Detection:** A daily background check spots invoices past their due date and marks them `OVERDUE`.
- **Bounced Email Detection:** Webhooks immediately alert the owner if an invoice email could not be delivered because of a typo in the customer's email.
- **1-Click Payment Recording:** Easily mark an invoice paid the second money enters the bank.

### 6. Automated 5-Star Google Review Engine (Slice 6)
- **Automatic Review Request:** The second an invoice is marked paid, Flowvo automatically sends the customer a friendly thank-you email containing the business's direct Google Review link.
- **Unsubscribe Protection:** Legal compliance with a 1-click unsubscribe link for customers.
- **Follow-Up Review Reminder:** If the customer hasn't left a review after 4 days, a polite reminder email is sent automatically.

### 7. Action-First Dashboard, Settings & Real-Time Live Sync (Slice 7)
- **Urgency Action Strip:** A priority board ordered by severity so the owner knows what to do in 2 seconds:
  1. *Overdue Invoices* (Red — money waiting to be collected)
  2. *Email Delivery Failures* (Red — customer never got their bill)
  3. *Draft Invoices Awaiting Send* (Amber — jobs finished that need billing)
  4. *Stalled Quotes* (Amber — quotes sent >7 days ago needing attention)
  5. *New Leads* (Teal — new enquiries waiting to be called)
- **Configurable Delays:** Settings to change follow-up timing (1 to 7 days).
- **Real-Time Live Updates:** Operates like a real live app using cross-tab broadcasting and background polling. When a customer submits an enquiry or accepts a quote in another tab, the dashboard updates immediately without pressing browser refresh (`F5`).
- **Branded Error Pages & Health Check:** Custom 404, 500 error boundaries, and live `/api/health` monitoring.

---

## Part 2: What Real Problem Is Flowvo Solving?

### The "Bucket with Holes" in Every Trade Business
Most plumbers, electricians, builders, decorators, and mechanics are incredible at their craft, but **run their business with severe friction**:

1. **They work with their hands all day:** They are under a sink, on a roof, or inside a wiring cupboard. They do not sit at a computer with an assistant.
2. **Leads go cold:** When an enquiry comes in, they don't reply until 9:00 PM at night. By then, the homeowner has already called a competitor.
3. **Quotes get forgotten:** They text a price on WhatsApp or scribble it on a pad, but forget to follow up. Up to **40% of quotes are lost** simply because no one checked back.
4. **Finished jobs don't get billed:** After a 10-hour day of physical work, doing paperwork feels exhausting. Invoices sit un-sent for weeks.
5. **Chasing money is awkward:** When bills are late, owners feel uncomfortable sending reminders, hurting cash flow.
6. **Zero Google reviews:** They do high-quality work, but forget to ask for reviews. Their business stays invisible on Google Maps, leaving them reliant on cheap word-of-mouth.

### The Solution Flowvo Delivers
Flowvo is an **automatic administrative autopilot**.  
It removes all the paperwork friction:
- Customer enquires &rarr; Instant auto-acknowledgement.
- Need a quote? &rarr; Sent in 60 seconds from the phone.
- Customer taps "Accept" &rarr; Turns into a job automatically.
- Job done? &rarr; Invoice drafted automatically.
- Invoice paid? &rarr; 5-star Google review request sent automatically.

---

## Part 3: Who Benefits Most?

### Primary Target Audience
1. **Solo Tradespeople:**
   - Plumbers, heating engineers, gas fitters
   - Electricians and EV charger installers
   - Carpenters, joiners, and builders
   - Painters and decorators
   - Roofers and window fitters
   - Locksmiths and emergency repair pros
2. **Micro Field Teams (1 to 5 people):**
   - Small landscaping, tree surgery, or fencing teams
   - Mobile mechanics and auto detailers
   - Commercial and domestic cleaning services

### How It Changes Their Day
- **Saves 5 to 10 hours a week:** No more spending Sunday evenings or late nights doing paperwork.
- **Gets paid 3x faster:** Invoices are sent the minute jobs finish, with direct bank details and payment terms.
- **Wins more jobs:** Customers are impressed by rapid professional replies, itemised quotes, and instant 1-click acceptance buttons.
- **Builds a 5-star reputation on Google:** Naturally collects dozens of verified reviews without ever having to awkwardly ask in person.

---

## Part 4: How to Advertise and Market Flowvo

Tradespeople are skeptical of generic "tech software," "AI buzzwords," or complex enterprise tools like Salesforce or ServiceTitan. They want something **simple, fast, and proven to make them money**.

### 1. Three Core Marketing Angles (Simple English)

#### Angle A: "The 9 PM Paperwork Killer"
- **Headline:** *"Stop spending your evenings invoicing on the kitchen table."*
- **The Hook:** You worked 10 hours on your tools today. The last thing you want to do is spend 2 hours typing invoices and chasing late payers. Flowvo auto-drafts the bill the second you pack your van.
- **Best For:** Facebook ads, trade forums, short-form video (TikTok/Instagram Reels).

#### Angle B: "The 1-Click Quote Machine"
- **Headline:** *"Win jobs before your competitor even checks their email."*
- **The Hook:** Send clean quotes straight from your phone. Your customer clicks one button on their phone to accept. No printing, no PDFs, no back-and-forth.
- **Best For:** Search Ads (Google Ads: "easy quoting app for electricians/plumbers").

#### Angle C: "Automatic 5-Star Reviews"
- **Headline:** *"Get more Google reviews while you sleep."*
- **The Hook:** You do top-tier work, but never have time to ask for reviews. Flowvo automatically sends your Google link the second an invoice is marked paid.
- **Best For:** Cold email, trade flyers, WhatsApp groups.

---

### 2. High-Converting Marketing Channels

| Channel | Exactly What to Do | Cost | Expected Result |
| :--- | :--- | :--- | :--- |
| **Short-Form Video (TikTok & IG Reels)** | 30-second video of an electrician sitting in his van: *"Just finished this fusebox. Watch how long it takes me to invoice and ask for a review."* (Shows 2 taps on screen). | Free / Organic | High viral potential among trades |
| **Trade Counter Flyer / Posters** | Drop simple A5 flyers at local merchants (Screwfix, Toolstation, City Plumbing, CEF, Travis Perkins): *"Plumbers: Cut 5 hours of paperwork every week. Try 14 days free."* | £50 printing | Local credibility and direct targeted users |
| **Local Trade Facebook Groups** | Join local trade networking groups. Post helpful tips about chasing overdue invoices without being awkward, introducing Flowvo as the tool. | Free | Word-of-mouth adoption |
| **Google Maps Cold Outreach** | Find local trades with great ratings but under 15 total reviews. Send a quick WhatsApp/text: *"Hey Dave, noticed your work on Google — love it. If you want a quick tool that automatically requests Google reviews every time you finish a job, check out flowvo.app"* | Free | High direct conversion rate |
| **Meta Ads (Facebook & Instagram)** | Run targeted ads to interests like "Plumbing", "Electrical wiring", "DeWalt", "Makita", age 25–55. Use clear video demos showing the phone screen. | £10–£20 / day | Scalable paid customer acquisition |

---

### 3. Clear Pricing Structure (Simplicity Wins)

- **Free Trial:** 14-day free trial (no credit card required) — let them send real quotes and invoices.
- **Solo Plan:** £19 / month (Unlimited leads, quotes, invoices, auto-reminders, and review requests).
- **Pro Team Plan (2–5 users):** £39 / month (Multi-user scheduling, team calendar).
- **Why this works:** One extra won job or one saved overdue invoice pays for an entire year of Flowvo. It is an immediate return on investment (ROI).
