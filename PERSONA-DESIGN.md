# PERSONA-DESIGN.md — Component-level persona experience spec

**Author:** Persona Experience Design Director · **Date:** 2026-07-05
**Deliverable:** design spec only. No code changed. Shared pipeline state — do not delete.
**Governing decision (`11 §P`):** 3 doors, 1 room. One shared app, persona-**tinted**. We are
designing three *feelings* of one product, not three products. Judges switch persona live in the
navbar (`Navbar.tsx` persona dropdown, `useDemoAuth.setPersona`) and must see the room change
emphasis without the data changing.

**Serves:** GEN-1..4, SAM-1..6, PRI-1..6, ALX-1..5 (ALX-6 excluded — roadmap). British English,
`£`, tabular-nums, **MarketplaceCo only** (no Amazon/Etsy/Shopify/eBay/Stripe/Treatwell in any
demo surface).

**Files this spec touches (all edits in place — NO moves/renames, PREFLIGHT §1):**
`src/routes/index.tsx`, `src/routes/app.tsx`, `src/components/{ApprovalDrawer,StepProgress,ClearingReconciliation,PnLComparison,AuditTrail,IdempotencyBanner,FileUpload,Navbar,Chatbot,motion}.tsx`, `src/styles.css`, `src/lib/useDemoAuth.ts`.
**New sibling files (allowed — force no moves):** `src/lib/personaTheme.ts` (tokens + copy, the single source of truth), `src/components/PersonaEmptyState.tsx`, `src/components/TaxSummaryCard.tsx`.

---

## 0. The one governing rule (read before anything else)

**Chrome stays constant; only persona surfaces shift.** These NEVER change by persona, so the app
stays recognisably one product across a live switch:

- Navbar, buttons, links, the primary CTA — keep `bg-primary` / `--primary` blue everywhere.
- **Semantic colour is fixed and never persona-tinted** (this is what keeps accounting meaning stable):
  - money earned / verified / £0.00 proof → **emerald / `--success`**
  - money the platform took / fees → **amber (`amber-400`)**, negative ledger → **rose (`fb7185`)**
  - failed write / error → **destructive red**
- Layout skeleton, spacing scale, fonts (Geist / Instrument Serif display / JetBrains Mono money).

**Persona surfaces that DO shift:** KPI order + labels + accent, dashboard greeting, which blocks
show/mute, the ambient glow-blob hue, `/app` section order + auto-expand, approve-confirmation copy,
the empty state copy, and the one hero moment. That is the whole tinting surface.

> Note on Sam's accent colliding with semantic green: intentional. Sam's entire room is "money
> earned + verified", so emerald doing double duty (accent **and** success) reinforces his story.
> For Priya (blue) and Alex (violet) the success-green stays a distinct status colour against their
> accent, so "verified" still reads as its own thing.

---

## 1. Per-persona accent / tint system

Built entirely on the existing palette family. The KPI glow classes already exist in `styles.css`
(`dashboard-kpi-blue|amber|violet|emerald`) and `KpiCard` already accepts `tone: "primary"|"amber"|"violet"|"success"` (`index.tsx:565`). We reuse them — no new colour is invented.

| Persona | Accent | Core token | Tailwind text / border / bg | KpiCard `tone` | KPI glow class | LiveDot `tone` |
|---|---|---|---|---|---|---|
| **Owner (Sam)** | Emerald | `--success` (`#22c55e` / accent `#34d399`) | `text-emerald-400` · `border-emerald-500/40` · `bg-emerald-500/10` | `success` | `dashboard-kpi-emerald` | `success` |
| **Bookkeeper (Priya)** | Blue (primary/ledger) | `--primary` (`#3b82f6`) | `text-blue-400` · `border-blue-500/40` · `bg-blue-500/10` | `primary` | `dashboard-kpi-blue` | `primary` |
| **Freelancer (Alex)** | Violet | `oklch(0.606 0.25 292.717)` (`#8b5cf6`) | `text-violet-400` · `border-violet-500/40` · `bg-violet-500/10` | `violet` | `dashboard-kpi-violet` | *(add `violet`)* |

**Why these three:** emerald = warm money-earned confidence (Sam). Blue = institutional ledger
calm; Priya's real distinctiveness is *subtraction and density*, not saturation, so she gets the
product at its most sober, accented with the same primary blue as the chrome. Violet = friendly,
approachable, and deliberately *not* money-green so tax figures read as "your numbers", not
"accounting" (Alex).

### 1.1 Token layer — `src/styles.css` (append 3 rules)

Set an accent CSS var per persona so any bespoke element can reference `var(--persona)`:

```css
[data-persona="owner"]      { --persona: var(--success); }        /* emerald  */
[data-persona="bookkeeper"] { --persona: var(--primary); }        /* blue     */
[data-persona="freelancer"] { --persona: oklch(0.606 0.25 292.717); } /* violet-500 */
```

Apply `data-persona={persona}` to the dashboard `<main>` (`index.tsx:194`) and the `/app` `<main>`
(`app.tsx:112`). Use for focus rings and ambient glows: `outline-color: var(--persona)`,
`bg-[var(--persona)]/8`.

### 1.2 Ergonomic layer — `src/lib/personaTheme.ts` (NEW, single source of truth)

One map every component imports; no persona `? :` ladders scattered across files.

```ts
import type { Persona } from "@/lib/useDemoAuth";

export interface PersonaTone {
  accentText: string;   // "text-emerald-400"
  accentBorder: string; // "border-emerald-500/40"
  accentBg: string;     // "bg-emerald-500/10"
  kpiGlow: string;      // "dashboard-kpi-emerald"
  kpiTone: "success" | "primary" | "violet"; // -> KpiCard tone
  dot: "success" | "primary" | "violet";     // -> LiveDot tone (add "violet")
  glowHue: string;      // "bg-emerald-500/8"  (ambient blob)
}

export const PERSONA_TONE: Record<Persona, PersonaTone> = {
  owner:      { accentText:"text-emerald-400", accentBorder:"border-emerald-500/40", accentBg:"bg-emerald-500/10", kpiGlow:"dashboard-kpi-emerald", kpiTone:"success", dot:"success", glowHue:"bg-emerald-500/8" },
  bookkeeper: { accentText:"text-blue-400",    accentBorder:"border-blue-500/40",    accentBg:"bg-blue-500/10",    kpiGlow:"dashboard-kpi-blue",    kpiTone:"primary", dot:"primary", glowHue:"bg-blue-500/8" },
  freelancer: { accentText:"text-violet-400",  accentBorder:"border-violet-500/40",  accentBg:"bg-violet-500/10",  kpiGlow:"dashboard-kpi-violet", kpiTone:"violet",  dot:"primary", glowHue:"bg-violet-500/8" },
};
```

**One-line additive change to `motion.tsx` LiveDot (`motion.tsx:193`):** add a `violet` branch to the
`colors` map → `bg-violet-500`. No existing tone changes.

---

## 2. Dashboard (`src/routes/index.tsx`)

### 2.1 KPI set + ORDER per persona (implements `11 §P4` KPI order, SAM-2, SAM-3, ALX-1)

Reorder the **DOM** (not CSS `order`) so tab/screen-reader order matches the visual order. All four
cards use `KpiCard` (`index.tsx:547`). Bind numeric values to `dash.persona_metrics` from the
contract; fall back to the existing illustrative constants only when metrics are null.

**Owner — the money story (turnover leads):**
1. **Real turnover (MTD)** — `gross_turnover_vat_safe` £1,340.00 · tone `success` · sublabel *"gross, pre-commission — the figure your VAT return needs"* (SAM-3, folds VAT-safe framing here, no 5th card)
2. **Money MarketplaceCo took** — `fees_this_month` £493.00 · tone `amber` · delta *"commission £445.90 + fees £47.10"* (SAM-2; renames the vague "Fees recovered")
3. **Payouts reconciled** — count · tone `success` (kept, supporting)
4. **Clearing balance** — £0.00 · tone `success` · delta *"Verified · zero-balance"* · `pulse`

**Bookkeeper — the evidence desk (clearing + audit lead):**
1. **Clearing balance** — £0.00 · tone `success` · delta *"Verified · provable zero"* · `pulse` **← first**
2. **Statements posted** — `run_history.length` · tone `primary` · delta *"0 exceptions · 0 duplicates"* (PRI-5)
3. **Gross turnover (period)** — £1,340.00 · tone `primary`
4. **Fees posted (period)** — £493.00 · tone `amber`

**Freelancer — tax-ready (the two SA numbers are the hero PAIR, ALX-1):**
1. **Income for Self Assessment** — `ytd_income` £1,340.00 · tone `violet` **← hero, bracketed with #2**
2. **Deductible platform fees** — `ytd_deductible_fees` £493.00 · tone `amber` **← its pair**
3. **Take-home so far** — net £847.00 · tone `success`
4. **Everything checks out** — clearing £0.00 relabelled jargon-free · tone `success` · delta *"nothing left in limbo"* (ALX-2)

> Cards 1+2 for Alex render as a visually bracketed pair: wrap both in one `rounded-2xl border
> border-violet-500/25 bg-violet-500/[0.04] p-1.5` container with a shared eyebrow *"Your tax return
> needs these two numbers"*. This is Alex's immersion moment (§6).

### 2.2 Greeting + insight line (`index.tsx:227-255`) — implements `11 §P4` greeting tinting

Greeting eyebrow/headline copy from the matrix (§4). The rotating insight line (`index.tsx:249-254`):

- **Owner** — keep the 3-item rotator (his "activity feel").
- **Bookkeeper** — replace rotator with a **static** status line: *"Clearing £0.00 · 12 statements posted · 0 exceptions"* (no motion churn on the evidence desk).
- **Freelancer** — static plain line: *"You've earned £1,340 this year · £493 of it is claimable back."*

The workspace `LiveDot` at `index.tsx:234` takes `PERSONA_TONE[persona].dot`. The two ambient glow
blobs (`index.tsx:314-319`) take `PERSONA_TONE[persona].glowHue` for the primary blob (keep the
second emerald blob only for owner; drop to a single blob for the calmer personas).

### 2.3 Show / mute / hide matrix (the biggest decisions)

| Block (file:line) | Owner | Bookkeeper | Freelancer |
|---|---|---|---|
| Ticker marquee (`index.tsx:201-225`) | **Show** | **Hide** (decorative noise, PRI-4) | **Hide** |
| Reported-vs-real bars (`index.tsx:257-294`) | **Show** (strong for him) | Compact stat only | **Show** (strong) + ALX-3 callout |
| Turnover area chart (`index.tsx:374-401`) | **Show** | **Mute → replace with Run-history table** | Hide |
| Fees donut (`index.tsx:403-414`) | **Show** | **Hide** | Hide |
| Payouts bar chart (`index.tsx:418-428`) | **Show** | **Hide** | Hide |
| Recent-activity panel (`index.tsx:431+`) | Show | **Show, promoted** (with per-run status, PRI-5) | Show, simplified |
| Chatbot | Show | Show | Show |

**Bookkeeper chart mute (PRI-4 + GEN-3):** the three decorative charts are hardcoded/illustrative
and corrode her professional trust. Replace her Charts row with a single dense **Run-history table**
(`run_history` from contract): columns `payout_ref · date · status · net · hash-prefix`, mono,
tabular, zero decoration. Status chip colours: `posted`→emerald, `skipped-idempotent`→amber,
`failed`→destructive, `partial`→amber.

**GEN-3 illustrative honesty:** when `live && dash` is false (no real posted data), owner/freelancer
charts get a small chip in the `ChartCard` header: *"Illustrative — demo data"* (`text-[10px]
text-muted-foreground border border-border/60 rounded-full px-2 py-0.5`). Bookkeeper never shows an
unlabelled chart at all (she gets the table).

### 2.4 GEN-2 first-run empty state — `src/components/PersonaEmptyState.tsx` (NEW)

**One** empty state, persona-tinted copy. Render it in place of the fabricated dashboard when there
is no real posted history (`run_history` null/empty **and** `!live`). Art direction:

- Full dashboard grid-bg (`dashboard-grid-bg`), single centred `max-w-md` card, `bg-card/80
  backdrop-blur-sm border`, `animate-fade-up`.
- Accent icon tile: `size-14 rounded-2xl` using `PERSONA_TONE[persona].accentBg` + `ring-1
  ring-[color]/30`, `Upload` icon in `PERSONA_TONE[persona].accentText`, `animate-float`.
- Headline (`font-display` italic, `text-2xl`) + one-line subcopy + one primary CTA button
  (`bg-primary`, `btn-shimmer`) → `<Link to="/app">`. Copy per §4.
- No fabricated numbers anywhere on this state.

### 2.5 ALX-3 callout (freelancer only) on the reported-vs-real bars

Under the bars block (`index.tsx:290`), for `persona === "freelancer"` add a callout reading the
already-computed `hiddenRevenue`:

> **You'd have under-reported by £{hiddenRevenue}.** Your bank feed only ever showed £12,210 —
> your real income was £18,930.

Tone: gentle warning, not alarm — `border-amber-500/30 bg-amber-500/[0.06] text-amber-200`, a small
`AlertTriangle` in `text-amber-400`, `role="note"`.

---

## 3. `/app` golden-path flow (`src/routes/app.tsx`)

### 3.1 ALX-4 plain-English approve confirmation

A confirmation strip that renders **above the Approve button** inside `ApprovalDrawer` once a
proposal exists and before the write fires. Slides in with `animate-slide-in`, `role="status"`
`aria-live="polite"`, accent border `PERSONA_TONE[persona].accentBorder`. Copy per persona (§4):

- **Owner:** "This posts **£1,340 revenue** and **£493 costs** to Xero, then clears **£847** to your bank. Nothing posts until you approve."
- **Bookkeeper:** "3 writes queued — invoice, bank transaction, payment. Each returns a Xero ID. Nothing posts until you approve."
- **Freelancer:** "We'll record **£1,340 income** and **£493 of costs** in your Xero — that's the £493 you can claim back. Nothing is sent until you tap Approve."

Keep the existing invariant badge; for freelancer, relabel it per ALX-2 (see jargon map §4).

### 3.2 GEN-4 step-error surface (`StepProgress.tsx`, serves SAM-4, PRI-3)

Today a failed write shows a generic "!"; `StepResult.message` (`payout-types.ts:72-73`) exists but
is never rendered. On a failed step:

- Expand the failed step row into an inline panel: `border-destructive/40 bg-destructive/10
  rounded-md p-3`, `role="alert"`, showing `StepResult.message` verbatim in mono.
- Add a **"Retry from this step"** affordance (idempotency resumes only the failed + later writes —
  PREFLIGHT §2). Button `variant=outline`, immediate press state (no dead clicks, PREFLIGHT §5).
- Persona framing prefix on the message: owner/bookkeeper "Write 2 failed:"; freelancer "That step
  didn't go through:" (plain).

### 3.3 PRI-6 dedupe / file-hash badge (before approval)

On upload, before approval, surface the sha256 (already computed pre-approve) as a mono chip under
the filename in `FileUpload.tsx` / `ApprovalDrawer.tsx`:

- New statement → `SHA-256 a1b2c3… · New statement` — `text-emerald-400 border-emerald-500/30`.
- Already posted (idempotent) → `Already posted · 3 Xero IDs on file` — `text-amber-400
  border-amber-500/30`, links to the existing `IdempotencyBanner`.

Always present; **promoted (larger, always-visible)** for bookkeeper, subtle for owner/freelancer.

### 3.4 PRI-1 export + PRI-2 evidence pack placement

- **Export button** in the `AuditTrail` card header → `GET /audit/export?format=csv`. Icon
  `Download`, `aria-label="Export audit trail as CSV"`. Prominent (primary-outline) for bookkeeper;
  secondary (ghost) for others.
- **Evidence pack button** on the verified state (`app.tsx:248-276`) → `GET /evidence-pack/{hash}`,
  renders the pack (CSV hash + Xero IDs + £0.00 proof) as one exportable card. Bookkeeper-primary;
  present-but-quiet for others. This is Priya's hero (§6).

### 3.5 Per-persona section order + auto-expand (verified state, `app.tsx:248-276`)

Reorder the DOM of the verified block per persona (implements `11 §P4` `/app` emphasis):

| Persona | Section order (verified) | Auto-expanded |
|---|---|---|
| **Owner** | ClearingReconciliation (£0.00 hero) → **PnLComparison** → AuditTrail | **PnLComparison** (P4 — currently spec-only) |
| **Bookkeeper** | ClearingReconciliation → **AuditTrail** (+ Export, Evidence pack) → PnLComparison | **AuditTrail** (already `app.tsx:268`) |
| **Freelancer** | **TaxSummaryCard** (new) → ClearingReconciliation (jargon-free) → PnLComparison (relabelled) | TaxSummaryCard; AuditTrail collapsed/minimal |

`PnLComparison` and `AuditTrail` need a `defaultOpen` prop driven by persona (AuditTrail already has
it). `TaxSummaryCard.tsx` (NEW) = a violet-accented card showing the three plain numbers: **Income
£1,340 · Costs you can claim £493 · Take-home £847**, with the plain line *"Report the £1,340, claim
the £493 — the £847 is just what reached your bank."*

### 3.6 Freelancer jargon-free reskin of existing components (ALX-2, copy-only)

`ClearingReconciliation.tsx` and `PnLComparison.tsx` take a `persona`/`plain` prop; when freelancer,
swap labels via the jargon map (§4). No structural change — same figures, same layout, reworded.

---

## 4. Copy matrix (persona × surface) — exact strings

British English, `£`, MarketplaceCo. Put all of this in `personaTheme.ts` as `PERSONA_COPY`.

| Surface | Owner (Sam) | Bookkeeper (Priya) | Freelancer (Alex) |
|---|---|---|---|
| **Greeting eyebrow** | "{name}'s workspace" | "{name} · client books" | "{name}'s tax view" |
| **Greeting headline** | "Your real turnover" | "Client books status" | "Your income, correctly" |
| **KPI #1 label** | "Real turnover (MTD)" | "Clearing balance" | "Income for Self Assessment" |
| **KPI #1 sublabel** | "gross, pre-commission — VAT-safe" | "Verified · provable zero" | "this tax year to date" |
| **KPI #2 label** | "Money MarketplaceCo took" | "Statements posted" | "Deductible platform fees" |
| **KPI #4 / clearing label** | "Clearing balance" | "Clearing balance" | "Everything checks out" |
| **Empty-state headline** | "Let's see your real turnover" | "Post your first client statement" | "Let's get your income tax-ready" |
| **Empty-state subcopy** | "Upload a MarketplaceCo payout — we'll show what you truly earned and prove the books balance." | "Upload a client's settlement CSV — deterministic gross-up, full audit trail, provable £0.00." | "Upload your MarketplaceCo payout — we'll show the income to declare and the fees you can claim." |
| **Empty-state CTA** | "Upload payout" | "Upload client statement" | "Upload my payout" |
| **Approve confirmation** | "This posts £1,340 revenue and £493 costs to Xero, then clears £847 to your bank." | "3 writes queued — invoice, bank transaction, payment. Each returns a Xero ID." | "We'll record £1,340 income and £493 of costs — the £493 you can claim back. Nothing is sent until you approve." |
| **Checklist heading** (`app.tsx:102-107`, exists) | "What Xero will do" | "Writes with Xero IDs" | "What we'll record" |
| **Chat prompts** (`Chatbot.tsx:18-22`, exists) | "What did the platform take?" → | "Show me the audit trail" → | "Is my income right for taxes?" → |

**Freelancer jargon map (ALX-2) — apply everywhere for `persona==="freelancer"`:**

| Accounting term | Plain (Alex) |
|---|---|
| clearing balance / clearing account | "money moving through" |
| clearing = £0.00 | "everything's accounted for — nothing left in limbo" |
| invariant / balanced / invariant failed | "everything checks out" / "the numbers don't add up yet" |
| gross-up | "showing your full income" |
| P&L (before/after) | "your income vs your costs" |
| revenue | "income" |
| expense / commission + fees | "costs" / "platform fees you can claim" |
| reconciled | "matched to your bank" |
| net | "take-home" |

---

## 5. Motion / micro-interactions (existing `motion.tsx` + `styles.css` only — no new deps)

All ≤ 250ms for interactions, `cubic-bezier(0.16,1,0.3,1)`, and every primitive already honours
`prefers-reduced-motion` (`usePrefersReducedMotion`, the reduced-motion CSS block at
`styles.css:476`). 90-second-demo-safe: restrained, no fireworks.

1. **Persona switch (P3, the live judge moment).** Put `key={persona}` on the greeting card + the
   KPI `<section>` (`index.tsx:322`) and on the `/app` verified block. React remounts those blocks,
   replaying the existing `animate-fade-up` stagger (180/260/340/420ms delays already in place) — a
   ~400ms staggered re-entrance that reads as "the room re-composing for this person". The ambient
   glow blob recolours via `PERSONA_TONE[persona].glowHue` and cross-fades on its existing
   `animate-glow-pulse`. No new animation authored.
2. **£0.00 reveal (owner + bookkeeper trust cue).** In `ClearingReconciliation`, drive the balance
   with `<CountUp value={0} decimals={2} prefix="£" />` counting down from the gross to 0, then the
   "Verified" badge fades in with the existing `LiveDot` `pulse-ring` + a one-shot `animate-reveal`
   scale-pop and emerald glow. Staged: number settles → badge → ring.
3. **Approve confirmation (ALX-4).** The confirmation strip enters with `animate-slide-in`; the
   Approve button keeps its existing press state; on approve the strip is replaced by `StepProgress`
   (no dead click — visible state change < 100ms, PREFLIGHT §5).
4. **KPI hover** — unchanged (`dashboard-kpi` lift + radial glow already per-tone).

---

## 6. Immersion moment — ONE hero per persona, and how it's staged

- **Owner — "the £493 they quietly kept."** On dashboard load, KPI #2 ("Money MarketplaceCo took")
  counts up in amber while the reported-vs-real bar fills to real turnover; lands on the benefit
  line *"£847 is all your bank ever showed you — here's the £1,340 you actually earned."* Echoed at
  the £0.00 clearing proof. Staging: KPI CountUp (amber) → bar `gap-bar-real` fill → benefit line
  `insight-rotate`.
- **Bookkeeper — the £0.00 evidence stamp.** On the verified `/app` state: ClearingReconciliation
  £0.00 + auto-expanded AuditTrail + a one-click **Evidence pack** export (hash + Xero IDs + zero
  proof in one artifact). The moment is *"provable zero, exportable in one click — hand it to the
  accountant."* Staging: £0.00 CountUp → verified badge → AuditTrail expands → Export/Evidence-pack
  buttons fade in.
- **Freelancer — the two-number tax card.** The bracketed hero pair on the dashboard (**Income for
  Self Assessment £1,340 / Deductible fees £493**) with *"That's £493 you can claim back that never
  touched your bank."* Re-stated by `TaxSummaryCard` at the top of the verified `/app` state.
  Staging: the two violet cards fade-up together under the shared eyebrow, then the plain line.

---

## 7. Accessibility

**Contrast (all on `--card` `#1e293b` / `--background` `#0f172a`, dark theme):**
- Emerald-400 `#34d399`, blue-400 `#60a5fa`, violet-400 `#a78bfa`, amber-400 `#fbbf24` all clear
  AA (≥3:1) as **large text / KPI numerals / graphic accents**. For **small body text** on dark, step
  to the -300 shade (`emerald-300`, `blue-300`, `violet-300`, `amber-200`) to hold ≥4.5:1.
- The ALX-3 amber callout uses `text-amber-200` for body (not amber-400) to stay AA at 14px.
- Status chips keep saturated semantic colours (never grey) — matches the existing mono-theme note
  in `styles.css:84-92`.

**Focus states:** every new interactive element keeps a visible 2px ring. Persona focus ring may use
`var(--persona)` but must never drop below 3:1 vs background — all three persona hues satisfy this on
slate-900. Keep the existing `focus-visible:ring-2 focus-visible:ring-ring` pattern (`app.tsx:125`)
as the fallback.

**ARIA / semantics for new interactive elements:**
- Approve confirmation strip: `role="status"` `aria-live="polite"`.
- Step-error panel: `role="alert"` (already the pattern at `app.tsx:241`); "Retry from this step"
  button labelled.
- Export button: `aria-label="Export audit trail as CSV"`; Evidence-pack button:
  `aria-label="Download evidence pack"`.
- Empty-state CTA: real `<Link>`/`<button>` with visible text (no icon-only).
- Dedupe badge: `aria-label` announces "Already posted" / "New statement" (not colour-only).
- **KPI reorder must reorder the DOM, not CSS `order`** — so keyboard tab order and screen-reader
  reading order match the visual persona order.
- Persona switch remounts content via `key`; ensure focus is not lost silently — return focus to the
  greeting heading (`tabIndex={-1}` + `.focus()`) after a switch, or leave focus on the navbar
  dropdown trigger.

---

## 8. Requirement coverage map

| Req | Where in this spec |
|---|---|
| GEN-1 (login persona bug) | note `useDemoAuth`/`Navbar.tsx:282` — preserve stored persona (engineering fix, flagged) |
| GEN-2 (empty state) | §2.4 `PersonaEmptyState` |
| GEN-3 (illustrative charts) | §2.3 (label chip / bookkeeper table) |
| GEN-4 (step error) | §3.2 |
| SAM-1 | §2.4 | SAM-2 | §2.1 KPI#2 | SAM-3 | §2.1 KPI#1 sublabel | SAM-4 | §3.2 | SAM-5 | run-history/new-vs-repeat data available (optional supporting stat) | SAM-6 | §2.3 GEN-3 |
| PRI-1 | §3.4 | PRI-2 | §3.4 evidence pack | PRI-3 | §3.2 | PRI-4 | §2.1/§2.3 clearing-first + mute charts | PRI-5 | §2.3 run-history table | PRI-6 | §3.3 |
| ALX-1 | §2.1 hero pair | ALX-2 | §4 jargon map + §3.6 | ALX-3 | §2.5 | ALX-4 | §3.1 | ALX-5 | §2.4 |

**Definition of done (per PREFLIGHT §7):** all copy/order/token changes land in-place (no file
moves); `bun run test` green; live-switch owner→bookkeeper→freelancer visibly re-tints without data
change; projector-readable at 1280×720; WCAG-AA focus/contrast as §7.
