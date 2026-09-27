# DESIGN.md — Flowvo Design System

> Status: Draft — for review before implementation
> Last updated: 2026-09-27
> Source of truth for all frontend implementation decisions.
> This document is implementation-facing. Every value here should be usable directly in code.

---

## 1. Design intent

Flowvo is an **operational tool**, not a marketing product. The design system must communicate:
- **Calm authority** — the owner feels in control, not overwhelmed
- **Clarity at a glance** — status and next action readable in under 2 seconds
- **Professional restraint** — nothing is there unless it earns its place
- **Mobile-readiness** — the owner's primary action (marking a job complete) happens on a phone

The system deliberately avoids the "AI startup" visual language: no gradient blobs, no purple/teal palettes, no glassmorphism, no oversized display headings hiding the actual product.

---

## 2. Color system

### Design rationale
The palette must work in high ambient light (outdoor/van use on phone), convey professional trust (the product sends emails on behalf of the owner), and surface urgency without constant alarm.

The base is a **warm off-white** with a **slate-grey neutral family** — workmanlike, not corporate. The primary action colour is a **deep teal-green**: not generic SaaS blue, not trade-orange, not AI-purple. It reads as practical, reliable, and slightly distinctive.

### Color tokens

```css
/* Base surfaces */
--color-bg:              #F7F8F7;   /* off-white, warm — not pure white */
--color-surface:         #FFFFFF;   /* cards, panels */
--color-surface-muted:   #F0F1F0;   /* secondary surfaces, inputs */
--color-surface-raised:  #FFFFFF;   /* modals, dropdowns — with shadow */

/* Text */
--color-text:            #1A1D1A;   /* near-black — high contrast */
--color-text-secondary:  #4A5150;   /* labels, metadata */
--color-text-muted:      #7A8580;   /* placeholder, helper text */
--color-text-on-primary: #FFFFFF;

/* Border */
--color-border:          #D8DCDB;   /* default dividers */
--color-border-strong:   #A8B0AF;   /* form focus-adjacent, emphasis */
--color-border-focus:    #1E7A6A;   /* focus ring — matches primary */

/* Primary action — deep teal-green */
--color-primary:         #1E7A6A;
--color-primary-hover:   #165F53;
--color-primary-active:  #0F4840;
--color-primary-subtle:  #E8F5F2;   /* soft background for primary-tinted areas */

/* Status colours — semantic */
--color-status-new:      #E8F5F2;   /* bg */ /* text: #1E7A6A */
--color-status-action:   #FFF4E0;   /* bg */ /* text: #8C5A00 */   /* amber — needs owner action */
--color-status-warning:  #FFF4E0;
--color-status-overdue:  #FDECEA;   /* bg */ /* text: #B91C1C */   /* red — invoice overdue */
--color-status-complete: #E8F5F2;   /* bg */ /* text: #1E7A6A */
--color-status-lost:     #F3F3F3;   /* bg */ /* text: #7A8580 */

/* Semantic system */
--color-success:         #1E7A6A;
--color-success-bg:      #E8F5F2;
--color-warning:         #8C5A00;
--color-warning-bg:      #FFF4E0;
--color-error:           #B91C1C;
--color-error-bg:        #FDECEA;
--color-info:            #1D5FA8;
--color-info-bg:         #EBF3FD;

/* Overlay */
--color-overlay:         rgba(26, 29, 26, 0.48);
```

### Status chip colour mapping

| Status label | Background token | Text token |
|---|---|---|
| New / Scheduled | `--color-status-new` | `#1E7A6A` |
| Contacted / In Progress | `--color-surface-muted` | `--color-text-secondary` |
| Quoted / Sent | `--color-status-action` | `#8C5A00` |
| Action Needed / Draft | `--color-status-action` | `#8C5A00` |
| Won / Complete / Paid | `--color-status-complete` | `#1E7A6A` |
| Overdue | `--color-status-overdue` | `#B91C1C` |
| Lost / Declined | `--color-status-lost` | `--color-text-muted` |

---

## 3. Typography

### Font families

```css
/* Primary UI typeface */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace — invoice numbers, job IDs, amounts */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Rationale for Inter:** Highly legible at small sizes, excellent number rendering, widely used in operational software, loads fast via Google Fonts. Not a design-personality statement — it is the right practical choice for this category.

### Type scale

```css
/* Display — product name / hero only, never inside the app */
--text-display:   2rem;      /* 32px */
--text-display-weight: 700;

/* Headings */
--text-h1:  1.5rem;   /* 24px — page title */
--text-h2:  1.25rem;  /* 20px — section heading */
--text-h3:  1rem;     /* 16px — card heading, label group */

/* Body */
--text-body:        0.9375rem;  /* 15px — primary reading */
--text-body-sm:     0.875rem;   /* 14px — secondary, metadata */
--text-caption:     0.8125rem;  /* 13px — timestamps, helper text */
--text-micro:       0.75rem;    /* 12px — status chips, badges */

/* Weights */
--weight-regular:   400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;

/* Line heights */
--leading-tight:    1.25;   /* headings */
--leading-normal:   1.5;    /* body */
--leading-relaxed:  1.65;   /* longer reads, help text */

/* Tracking */
--tracking-tight:   -0.01em;   /* headings */
--tracking-normal:  0;
--tracking-wide:    0.04em;    /* status chips, labels */
```

### Typography rules

- **Never use `--text-display` inside the product app.** It is for marketing/landing pages only.
- Page titles (`--text-h1`) appear once per screen, not per section.
- Status chips and badges always use `--text-micro` with `--tracking-wide` and `--weight-semibold`.
- Invoice amounts and job IDs use `--font-mono`.
- All UI label text uses `--weight-medium` minimum — never `--weight-regular` for actionable labels.

---

## 4. Layout and spacing system

### Base unit

```css
--space-unit: 4px;

--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Containers

```css
--container-max:    1200px;   /* full desktop container */
--container-narrow: 720px;    /* forms, settings, detail views */
--container-card:   480px;    /* single-column content max */

--sidebar-width: 240px;       /* desktop left nav */
--sidebar-collapsed: 64px;    /* icon-only collapsed state */
```

### Grid

- **Desktop:** 12-column, 24px gutters, sidebar layout (240px nav + fluid content)
- **Tablet (768–1024px):** 8-column, 20px gutters, sidebar collapses to icons
- **Mobile (<768px):** single column, 16px horizontal padding, full-width cards, bottom navigation

### Section rhythm

- Between major page sections: `--space-8` (32px)
- Between card groups: `--space-6` (24px)
- Within a card (internal padding): `--space-4` (16px) all sides
- Between form fields: `--space-4` (16px)
- Between inline elements: `--space-2` (8px)

---

## 5. Shape and depth

### Border radius

```css
--radius-sm:   4px;   /* chips, badges, small inputs */
--radius-md:   8px;   /* cards, buttons, form fields */
--radius-lg:   12px;  /* modals, larger panels */
--radius-pill: 999px; /* status chips */
```

### Shadows / elevation

```css
/* Avoid heavy shadows — this is a calm, light product */
--shadow-card:   0 1px 3px rgba(26,29,26,0.08), 0 1px 2px rgba(26,29,26,0.06);
--shadow-raised: 0 4px 12px rgba(26,29,26,0.10), 0 2px 4px rgba(26,29,26,0.06);
--shadow-modal:  0 8px 32px rgba(26,29,26,0.14), 0 2px 8px rgba(26,29,26,0.08);
```

### Borders

```css
--border-default: 1px solid var(--color-border);
--border-strong:  1px solid var(--color-border-strong);
--border-focus:   2px solid var(--color-border-focus);  /* keyboard focus ring */
```

---

## 6. Navigation model

### Desktop
- **Left sidebar** — persistent, 240px wide
- Navigation items: Dashboard, Leads, Quotes, Jobs, Invoices, Settings
- Each item has a icon + label
- Active item: `--color-primary-subtle` background + `--color-primary` text/icon
- Sidebar collapses to icon-only (64px) when user preference or on smaller desktops

### Mobile
- **Bottom tab bar** — 5 items max: Home, Leads, Jobs, Invoices, More
- Quotes and Settings move into "More"
- Bottom nav height: 60px; touch targets minimum 44px

### Navigation rules
- No nested dropdowns in the sidebar — the product is not complex enough to need them
- Active screen title appears as `--text-h1` at top of content area
- Breadcrumbs appear only on detail views (e.g., Job #014 > Invoice #014)

---

## 7. Component language

### 7.1 Status chip

**Purpose:** Display the current status of a Lead, Quote, Job, or Invoice at a glance.

```
Anatomy:
[● Status label]

- Pill shape (border-radius: 999px)
- Font: --text-micro, --weight-semibold, --tracking-wide, UPPERCASE
- Padding: 2px 8px
- Colour: see status chip mapping table (section 2)
- No border — background colour only
```

**States:** Read-only. Status chips are never interactive directly; they change when the owner takes an action (button → confirmation → status updates).

---

### 7.2 Primary button

```
Anatomy: [Label] or [Icon Label]

- Background: --color-primary (#1E7A6A)
- Text: --color-text-on-primary (#FFFFFF)
- Font: --text-body-sm, --weight-semibold
- Padding: 10px 20px
- Border-radius: --radius-md (8px)
- Height: 40px (default), 36px (compact), 48px (touch/mobile)
- Hover: --color-primary-hover
- Active: --color-primary-active
- Disabled: 40% opacity, cursor: not-allowed
- Focus: --border-focus ring, 2px offset
```

**Rule:** One primary button per view. Never two competing primary actions. If two actions exist, one is secondary.

---

### 7.3 Secondary button

```
- Background: transparent
- Border: --border-default
- Text: --color-text
- Hover: --color-surface-muted background
- Same sizing as primary
```

---

### 7.4 Destructive button

```
- Outline style only in most contexts (red border + red text)
- Solid red fill only inside a confirmation modal after the user has initiated destruction
- Used for: Delete lead, Mark invoice as lost, Remove customer
- Always accompanied by a confirmation dialog — never fires immediately
```

---

### 7.5 Card

**Purpose:** The primary container for Lead, Quote, Job, and Invoice records in list views.

```
Anatomy:
┌─────────────────────────────────┐
│ [Status chip]          [Date]   │
│ Customer Name                   │
│ Service type / description      │
│                      [£ Amount] │
│ ─────────────────────────────── │
│ [Primary action button]         │
└─────────────────────────────────┘

- Background: --color-surface
- Border-radius: --radius-md (8px)
- Box-shadow: --shadow-card
- Padding: --space-4 (16px)
- Full width on mobile, max 100% in list column on desktop
- One primary action button at the bottom — the single obvious next step
- Overdue / action-needed cards: left border accent (4px solid --color-error or --color-warning)
```

**Rules:**
- No nested cards
- Status chip always top-left
- Amount always right-aligned
- Primary action button is always present and labelled with the specific action ("Send quote" not "Action")

---

### 7.6 Form fields

```
- Input height: 40px
- Border: --border-default, transitions to --border-focus on focus
- Background: --color-surface
- Placeholder: --color-text-muted
- Label: above input, --text-body-sm, --weight-medium
- Helper text: below input, --text-caption, --color-text-muted
- Error text: below input, --text-caption, --color-error, with error icon
- Error state: --color-error border
- Disabled: --color-surface-muted background, --color-text-muted text, 60% opacity
- Border-radius: --radius-md (8px)
```

**Rules:**
- Labels always visible — no floating labels (the owner may be distracted and return mid-form)
- Error messages are specific: "Email address is required" not "Invalid input"
- Validation runs on blur, not on every keystroke
- Required fields marked with asterisk only if a mix of required and optional exist on the same form

---

### 7.7 Dashboard action item

**Purpose:** Surface stalled workflow items that need the owner's attention.

```
Anatomy:
[! icon]  [Record description]        [Action button]
          e.g. "Invoice for James Miller is 5 days overdue"

- Full-width strip, --color-warning-bg or --color-error-bg depending on urgency
- Icon: amber (!) for action needed, red (!) for overdue
- Description: plain English, names the customer and the issue
- Action button: right-aligned, secondary style → opens the relevant record
- Dismissible: No — it disappears only when the owner resolves the issue
```

---

### 7.8 Toast notification

**Purpose:** Confirm that an automated action fired successfully.

```
- Position: top-right (desktop), top centre (mobile)
- Duration: 4 seconds auto-dismiss
- Anatomy: [icon] [message] [× dismiss]
- Success toast: --color-success-bg, --color-success icon
- Error toast: --color-error-bg, --color-error icon (no auto-dismiss — requires acknowledgement)
- Max width: 360px
- Border-radius: --radius-md
- Shadow: --shadow-raised
```

**Example messages:**
- ✓ "Acknowledgement sent to David Chen"
- ✓ "Quote follow-up scheduled for 3 days from now"
- ✓ "Invoice #018 sent to Sarah Jones"
- ✗ "Invoice not sent — email address is missing" (requires action, stays visible)

---

### 7.9 Empty state

**Purpose:** Guide a first-time or zero-record view rather than showing a blank screen.

```
Anatomy:
[ Functional illustration — simple line icon, not decorative ]
[ Heading: "No leads yet" ]
[ Body: One sentence explaining the next step ]
[ Primary action button ]

- Centred in content area
- Illustration: single-colour, uses --color-primary-subtle and --color-primary
- No stock photos, no hero art
- Body text: --color-text-secondary
- Maximum: one CTA in the empty state
```

**Examples:**
- Leads: "No leads yet. Share your enquiry form link to start receiving enquiries."
- Quotes: "No quotes yet. Open a lead and create a quote from there."
- Jobs: "No active jobs. When a quote is accepted, a job appears here automatically."

---

### 7.10 Confirmation modal

**Purpose:** Required before any action that sends an email to a customer or is irreversible.

```
Anatomy:
┌─────────────────────────────────┐
│ Send invoice to Sarah Jones?    │  ← --text-h3, specific
│                                 │
│ Invoice #018 · £340.00          │  ← Key details, --text-body-sm
│ This will send an email to:     │
│ sarah@example.com               │
│                                 │
│ [Cancel]   [Send invoice]       │  ← Secondary + Primary
└─────────────────────────────────┘

- Never uses "Are you sure?" — always describes the exact action and consequence
- Destructive confirm button uses destructive-button style
- Modal max-width: 480px
- Background overlay: --color-overlay
```

---

## 8. UX behaviour principles

### 8.1 One primary action per screen
Every screen has a single obvious next step. The owner does not make decisions about what to do — the product surfaces the action.

### 8.2 Automation is always explained
Every automated trigger is described in plain English in Settings: "When you mark a job as complete, Flowvo will draft an invoice automatically. You review and send it." No unexplained behaviour.

### 8.3 Nothing sends without confirmation
Quotes, invoices, and review requests require owner confirmation before sending. Only the initial lead acknowledgement fires automatically (this is the core value proposition — the product must respond faster than the owner can).

### 8.4 Stalled items rise to the top
The dashboard is ordered by urgency, not by date. An overdue invoice always appears above a new lead unless the new lead has been waiting more than 24 hours.

### 8.5 Failure is always visible
If an automated email fails to deliver, the owner sees it immediately in the dashboard action strip — not buried in a log. The product surfaces: what failed, which customer, and what to do.

### 8.6 Progressive disclosure
Detail views open from list cards. The owner does not navigate to separate pages to take common actions — they can mark jobs complete and approve invoices directly from the card or a slide-over panel.

### 8.7 Mobile is first-class, not an afterthought
Marking a job complete happens at the job site, on a phone. The button must be 48px tall, text must be readable in bright light, and the confirmation must be dismissible with one tap.

---

## 9. Motion and interaction

### Motion philosophy
Motion communicates state change, not personality. It must not delay the owner from completing an action.

```css
--duration-fast:    120ms;
--duration-normal:  200ms;
--duration-slow:    320ms;
--ease-out:         cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);
```

### Motion rules
- Status chip colour transition: `--duration-normal`, `ease-out`
- Card entry: `--duration-slow` fade-up (translateY 8px → 0, opacity 0 → 1)
- Toast entry: `--duration-fast` slide-in from right
- Modal: `--duration-normal` fade + subtle scale (0.97 → 1.0)
- Button hover: `--duration-fast` background transition
- **No continuous animations, looping animations, or scroll-driven parallax inside the app**
- Respects `prefers-reduced-motion` — all animations disabled if set

---

## 10. Responsive rules

| Breakpoint | Name | Behaviour |
|---|---|---|
| < 480px | Mobile S | Single column, bottom nav, stacked cards |
| 480–767px | Mobile L | Single column, bottom nav |
| 768–1023px | Tablet | Sidebar collapses to icons, 2-column cards possible |
| 1024–1279px | Desktop S | Full sidebar, 2-column content |
| ≥ 1280px | Desktop | Full sidebar, max container 1200px |

### Mobile-specific rules
- Touch targets: minimum 44×44px for all interactive elements
- Floating action button ("+ Add lead") in bottom-right on mobile list views
- Forms are single-column on all mobile sizes
- Invoice amounts and key numbers use `--text-h2` size on mobile for readability
- Bottom safe area padding for devices with home indicator

---

## 11. Accessibility rules

- **Colour contrast:** All text meets WCAG AA minimum (4.5:1 for body, 3:1 for large text)
- **Focus visible:** All interactive elements have a visible focus ring (`--border-focus`, 2px offset) — never remove default focus outline without a replacement
- **Status chips:** Never communicate status by colour alone — always include a text label
- **Error messages:** Linked to their fields via `aria-describedby`; field invalid state announced via `aria-invalid`
- **Modals:** Focus trapped inside open modal; `aria-modal="true"`; dismiss with Escape key
- **Toasts:** `role="status"` for success; `role="alert"` for errors
- **Forms:** All inputs have a `<label>` — no placeholder-only labelling
- **Images/icons:** Decorative icons have `aria-hidden="true"`; functional icons include a text label or `aria-label`
- **Keyboard:** All workflows completable by keyboard alone

---

## 12. Anti-generic-AI design review

| Check | Status |
|---|---|
| No decorative gradients as hero background | ✓ Flat off-white surface, no gradient |
| No purple/blue AI palette | ✓ Deep teal-green — distinct from standard AI colour language |
| No glassmorphism | ✓ Solid surfaces, subtle box-shadow only |
| No animated blobs or floating shapes | ✓ No decorative motion |
| No "AI-powered" labels | ✓ Product has no AI in MVP; language is functional |
| No excessive whitespace hiding the product | ✓ Operational density is favoured; spacing is purposeful |
| No fake metrics or testimonials | ✓ Metrics only from real data; empty states are honest |
| No three-card feature grids on internal screens | ✓ App uses list views and workflow cards |
| No giant hero typography inside the app | ✓ Page titles are `--text-h1` (24px); no display text in app |
| Status always shown with text label, not colour only | ✓ Status chips include text |

---

## 13. Originality and coherence review

| Check | Status |
|---|---|
| Brand identity distinct from Oyebode's personal brand | ✓ Flowvo has its own name, palette, and personality |
| Reference sites influenced principles, not visual identity | ✓ Jobber influenced *action-surfacing* principle; Wave influenced *calm density* principle |
| System is internally consistent | ✓ Palette, type, spacing, and components share the same base unit and rationale |
| Design fits the user and category | ✓ Designed for a tradesperson at a phone; high contrast; direct language |
| Interface reflects the actual workflow | ✓ Navigation matches the five entities in the workflow; every screen has one primary action |
| No copied logos, assets, or marketing copy | ✓ |
| Accessibility considered | ✓ WCAG AA contrast; focus handling; ARIA roles defined |
| Responsive behaviour defined | ✓ Five breakpoints; mobile-first critical actions |
| State handling defined | ✓ 10 critical states mapped in MVP spec; component states defined above |
| Implementable with Next.js + Tailwind/CSS | ✓ All tokens expressible as CSS custom properties or Tailwind config |

---

## 14. Open questions before implementation

| Question | Why it matters |
|---|---|
| Does the product name "Flowvo" survive IP/domain check? | Branding assets should not be finalised until domain and trademark availability are confirmed |
| Is Inter the right font for the email templates sent to customers? | Customer emails are a separate rendering context; web-safe fallbacks needed |
| Should the sidebar navigation use icon-only on tablet, or a responsive drawer? | Affects layout implementation complexity — decide before building navigation |
| Should the mobile bottom tab bar include Jobs and Invoices, or Leads and Jobs? | Depends on which two screens the owner uses most from mobile — validate with first users |
| Logo / wordmark design | Not created in this artifact — requires a visual design pass or icon design if treating Flowvo as a real launch product |
