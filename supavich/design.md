# PayoutBridge — Frontend Design Prompt · built by Supavich · sources: docs/specs/01–08

**Usage:** paste everything below the line into a fresh Claude "design" chat. That chat has **no repo access**, so this prompt is fully self-sufficient. The 8 source docs below are provenance only — you do not need them to run the prompt.

**Provenance (docs/specs/01–08):**
1. `docs/specs/01` — Product Spec (one-liner, tagline, user journey, scope / out-of-scope)
2. `docs/specs/02-BACKEND-SPEC.md` — backend behaviour, step sequence, invariant, idempotency, error table
3. `docs/specs/03-API-SPEC.md` — endpoint request/response shapes, decimal-as-string rule
4. `docs/specs/04-FRONTEND-SPEC.md` — design system, component specs, state machine, responsive/a11y
5. `docs/specs/05-BACKEND-IMPLEMENTATION-PLAN.md` — planner/writer implementation, endpoint error codes
6. `docs/specs/06-FRONTEND-IMPLEMENTATION-PLAN.md` — mock data, design tokens, projector rules, component acceptance
7. `docs/specs/07-BACKEND-TEST-PLAN.md` — API-shape guarantees the UI can rely on
8. `docs/specs/08-FRONTEND-TEST-PLAN.md` — component UI contracts, manual/visual demo checklist

━━━━━━━━━━━━━━━━  ⬇  PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE  ⬇  ━━━━━━━━━━━━━━━━

# ROLE

You are an **elite product designer + front-end engineer**. Design and build the complete visual UI for a hackathon demo app called **PayoutBridge**. Deliver **one self-contained artifact** (a single HTML file with inline CSS, or a single React artifact) that renders **every screen state as a labeled frame, stacked top to bottom, in one page**.

This UI will be shown **live on a 1280×720 projector** during a 90-second pitch. It must **read from the back of a room**: big type, high contrast, one obvious hero moment. Treat legibility at projector scale as a first-class constraint, not an afterthought. This is a **financial-grade** product — clean typography, precise alignment, tabular numbers, zero visual noise.

Do not ask clarifying questions. Everything you need is below. Where a value is given, use it **verbatim**.

---

# 1. PRODUCT CONTEXT

**Tagline (hero line, top of page):** "Your bank feed has been lying about your turnover."

**One-liner:** PayoutBridge converts opaque platform settlement statements into auditable, Xero-native gross-up accounting — restoring real turnover, fee visibility, and a zero-balance clearing account, with a human approving every write.

**What it does, in one breath:** A salon gets paid £847 into their bank by an online-booking marketplace. Their bank feed says turnover = £847. Reality: they billed £1,340 and the platform kept £493 in commission and fees. PayoutBridge takes the platform's payout CSV, proposes three Xero writes that restore the true £1,340 gross, book the £493 as expenses, and clear the £847 net against the bank deposit — then **proves the clearing account nets to £0.00** and shows a **before/after P&L**.

**Accounting invariant shown on screen:** `gross − commission − fees − refunds === net` → `1340.00 − 445.90 − 47.10 − 0.00 === 847.00`.

## The 90-second demo choreography — 4 beats

The whole page is built to make this arc land. Design each beat to be unmissable on a projector.

- **Beat 1 — SCAN / FLAG (the problem).** Open on the tagline and the discrepancy: the bank feed shows **£847** turnover, but the real number is **£1,340**. Establish the pain in one glance. (This maps to the **idle** frame with the hero tagline + a "your books are under-reporting" framing.)
- **Beat 2 — UPLOAD (the input).** Drag the payout CSV into the drop zone. It parses in ~10s and the **Approval Drawer** appears: payout summary (gross/commission/fees/net), a collapsible 9-booking detail table, and a plain-English "What Xero will do" 3-item checklist. (maps to **proposed**)
- **Beat 3 — APPROVE + PROGRESS (the action).** One click on **[Approve & Post to Xero]**. A live 3-step progress rail animates: **1/3 Invoice ✓ → 2/3 Fees ✓ → 3/3 Payment ✓**, each returning a real Xero ID. (maps to **approving**)
- **Beat 4 — PAYOFF (the win).** The **Clearing Reconciliation** fades in: `Gross £1,340 − Commission & fees £493 = Net £847`, and below it, dominating the screen, **Platform Clearing: £0.00 ✓** (live-verified). Then the **P&L Before/After** split-screen: revenue £847 → £1,340, a new £493 expense line appears, net profit **unchanged at £847**. (maps to **verified**)

## Who is watching (design for both)

- **A Xero-certified accountant judge** — cares about correct double-entry, that the clearing account truly zeroes, that expenses are booked (not netted away), and that there's an audit trail. Speak to them with the reconciliation equation, the £0.00 proof, and the transaction trace.
- **API / engineering judges** — care that writes are real, **idempotent** (re-uploading the same file doesn't double-post), invariant-enforced, and crash-recoverable (partial failure shows completed steps). Speak to them with the amber idempotency banner, the step rail with returned IDs, and the partial-error state.

---

# 2. HARD RULES (non-negotiable — a reviewer will check each one)

1. **Dark theme, exact tokens only.** Use these hex values; do not substitute or "improve" them.

   | Use | Hex | Token |
   |---|---|---|
   | Page background | `#0f172a` | `bg-primary` |
   | Card / panel background | `#1e293b` | `bg-card` |
   | Text primary | `#f8fafc` | `text-primary` |
   | Text secondary / muted | `#94a3b8` | `text-secondary` |
   | Success / verified | `#22c55e` | `text-success` |
   | Warning / idempotent | `#f59e0b` | `text-warning` |
   | Error | `#ef4444` | `text-error` |
   | Accent / CTA / focus | `#3b82f6` | `bg-accent` |

   Semantics: **green = success/verification, amber = warnings (idempotency), red = errors, blue = accent/interaction**.

2. **`£0.00 ✓` MUST be the single largest element on the page after approval.** In the `verified` frame, the Platform Clearing `£0.00 ✓` is the visual hero — larger than any heading, any other number, any logo. Render it at **≥32px** (aim 48–72px for the hero payoff frame). If a viewer 5 metres from a projector can read only one thing, it must be this.

3. **Money is display-only strings — never computed.** Every monetary value in this prompt is a pre-formatted string (e.g. `"1340.00"`). Render it by prepending `£` and printing as-is. **Do NOT do arithmetic in the UI.** Do not sum columns, do not derive the £493, do not recompute the £0.00 — every displayed number is a literal from the mock data. Render all amounts in a **monospace / tabular-numeral** font (`font-variant-numeric: tabular-nums`), **right-aligned** in tables so the columns line up.

4. **Synthetic data only. The word "Treatwell" must never appear anywhere in the design.** The platform is always **"MarketplaceCo"** (contact: `MarketplaceCo (Marketplace)`). All client names are synthetic ("Client A"…"Client I"). This is a demo on fictional data.

5. **Projector font minimums (verified against the test plan):** body text **≥16px**; amounts in tables **≥18px**; the `£0.00` verification **≥32px**; Approve button label **≥18px**. Nothing critical below 16px.

6. **Animation timings (don't miss the payoff, don't waste pitch time):** Clearing Reconciliation entrance = **fade-in + scale-up, 400–600ms ease-out** on mount. StepProgress = **minimum ~300ms visible per step** so each tick registers even if the backend is instant.

7. **No horizontal page scroll, ever, at any width.** Wide content (the audit table) scrolls **inside its own `overflow-x:auto` container** — the page body itself never scrolls sideways.

8. **Status is never signalled by colour alone.** Every state pairs colour **with an icon and text**: green success has a **tick** icon, the amber banner has a **warning** icon, red errors have a **cross** icon + a text message. Must survive a greyscale/colour-blind check. Target **WCAG AA (4.5:1)** contrast on the dark background.

---

# 3. DESIGN SYSTEM

- **Theme:** dark, professional, financial-grade. High-contrast text on `#0f172a`. Precise alignment, generous whitespace, no gradients-for-decoration.
- **Typography:** sans-serif (system stack) for headings/body; **monospace with tabular numerals** for all amounts and all Xero IDs. Monetary columns right-aligned.
- **Layout:** single page, **vertically stacked panels, no routing**. Max-width content column centred on the dark background. Panel order (the app's natural top-to-bottom flow):

  ```
  HEADER            PayoutBridge logo + tagline
  ─────────────────────────────────────────────
  FILE UPLOAD ZONE  drag & drop / click to upload CSV
  ─────────────────────────────────────────────
  IDEMPOTENCY BANNER   (amber, only on duplicate)
  ─────────────────────────────────────────────
  APPROVAL DRAWER   payout summary · 9-booking detail · "What Xero will do" · Approve button
  ─────────────────────────────────────────────
  STEP PROGRESS     Posting to Xero… 1/3 ✓ 2/3 ✓ 3/3 ✓
  ─────────────────────────────────────────────
  CLEARING RECONCILIATION   ← THE PAYOFF · Platform Clearing £0.00 ✓
  ─────────────────────────────────────────────
  P&L BEFORE / AFTER   split-screen, two cards
  ─────────────────────────────────────────────
  AUDIT TRAIL / TRANSACTION TRACE   collapsible
  ```

---

# 4. COMPONENT INVENTORY (9)

Build all nine. Components 1–7 have exact prop interfaces and states — honour them. Components 8–9 are the structural shell. Every amount shown is a literal string from §6.

### 4.1 FileUpload
```typescript
interface FileUploadProps {
  onFileSelected: (file: File) => void;   // build-canonical (06)
  disabled: boolean;
  error: string | null;
  // 04 variant of the same component: { onProposalReceived, onError, disabled }
}
```
- Dashed-border rectangle + upload icon + text **"Drag & drop your payout CSV, or click to browse"**. Base border `border-slate-600`; on hover and drag-over the border turns **accent blue** (`#3b82f6`); drag-leave resets it.
- Hidden `<input type="file" accept=".csv">` fallback for click-to-browse.
- Accepts `.csv` only; validate extension before firing the callback.
- **States:** `idle` (ready) · `loading` (`disabled=true`: spinner in the zone, greyed out, drops prevented) · `error` (inline **red** text below the zone with a cross icon, e.g. after dropping a `.txt`; cleared on next interaction).

### 4.2 ApprovalDrawer
```typescript
interface ApprovalDrawerProps {
  payout: CanonicalPayout;
  plan: JournalPlan;
  onApprove: () => void;
  disabled: boolean;
  // 04 variant also passes: fileHash: string
}
```
Four sections, in order:
1. **Payout Summary** — table of **Gross / Commission / Fees / Refunds / Net**, amounts right-aligned monospace tabular-nums, every value `£`-prefixed. Render the equation visually: **`£1,340.00 − £493.00 = £847.00`**.
2. **Booking Detail** — collapsible, **default collapsed**, toggle labelled **"View 9 bookings"**. Columns: **Date · Client · Type · Service · Amount · Commission Rate · Commission**. (Use the 9 rows in §6.)
3. **"What Xero will do"** — a 3-item plain-English checklist with circle-outline icons, worded exactly:
   - "Create a gross revenue invoice for **£1,340.00** into Platform Clearing"
   - "Book commission (**£445.90**) and fees (**£47.10**) as expenses from Platform Clearing"
   - "Clear the **£847.00** net payout against your bank deposit"
4. **Approve button** — full-width green, label **"Approve & Post to Xero"**, styles `bg-success hover:bg-green-600 text-white font-semibold py-3 text-lg` (label **≥18px**). Disabled = `opacity-50 cursor-not-allowed`.
- **States:** `idle` (button enabled) · `loading` (button disabled, shows **"Posting to Xero…"** + spinner) · `approved` (button hidden, replaced by StepProgress → ClearingReconciliation).

### 4.3 IdempotencyBanner
```typescript
interface IdempotencyBannerProps {
  existingIds: { invoice_id: string; bank_txn_id: string; payment_id: string };
  onReset: () => void;
}
```
- Full-width **amber** bar: `bg-warning/10 border-warning`, a **warning icon**, exact message **"Already posted — skipped (idempotent)"**.
- Second line, monospace: **"Xero IDs: INV-0042, BT-0117, PMT-0089"** (from `existingIds`).
- Optional link **"Upload a different file"** → calls `onReset`.
- (04 phrasing variant, also acceptable: "Already posted at {timestamp} — skipped (idempotent). Xero IDs: …".)

### 4.4 StepProgress
```typescript
interface StepProgressProps {
  results: StepResult[];
  totalSteps: number;   // = 3
  isActive: boolean;    // gates the spinner
}
```
- Three evenly-spaced columns, each = a circle indicator + a label. Labels are **exactly** "Invoice", "Fees", "Payment".
- Per-step visual: **pending** = grey circle + grey label · **in-progress** = blue circle + animated spinner + pulsing glow + blue label · **complete** = green circle + checkmark + green label.
- Progress derivation: steps `1..N` complete where `N = results.length`; step `N+1` is in-progress **only if** `N < totalSteps` **and** `isActive` is true. If `isActive=false`, show **no spinner** even on an in-progress step.
- Connector lines between steps: **solid green** for completed transitions, **dashed grey** for pending.
- Header text: **"Posting to Xero…"** while running, **"Posted to Xero"** when all three are complete.
- Hold each step visible **≥~300ms**.

### 4.5 ClearingReconciliation — THE most important visual in the demo
```typescript
interface ClearingReconciliationProps {
  gross: string;         // "1340.00"
  feesTotal: string;     // "493.00" (display string; do not compute)
  net: string;           // "847.00"
  clearingBalance: string; // "0.00"
  verified: boolean;     // true
}
```
- Equation row (`text-xl`+, monospace amounts): **`Gross £1,340 − Commission & fees £493 = Net £847`**.
- Verification badge below, **the hero of the page**: **"Platform Clearing: £0.00"** + a green **tick**, rendered at **≥32px** (go bigger — this must be the largest text anywhere). Green (`text-success`) when `verified`; if the balance were non-zero it flips to **red** (`text-error`) + a warning icon.
- Card `bg-card` with a subtle **green border** (`border-success/30`) when verified.
- **Entrance animation:** fade-in + scale-up on first mount, **400–600ms ease-out** — this is the payoff moment; make it feel earned.

### 4.6 PnLComparison
```typescript
interface PnLComparisonProps {
  before: PnLSnapshot | null;
  after: PnLSnapshot | null;
}
```
- Two cards side by side — **BEFORE** (left) and **AFTER** (right) — that **stack vertically below 768px**.
- **BEFORE** (muted, `opacity-60` or `bg-slate-800/50`): Revenue **£847.00** · Commission Expense: **—** · Net Profit **£847.00**.
- **AFTER** (full opacity, subtle green-tinted border): Revenue **£1,340.00** (green, up-arrow) · Commission Expense **£493.00** (new line, highlighted) · Net Profit **£847.00**.
- Change indicators: revenue delta shown as **`+£493.00`** in green; a **"NEW"** badge next to the commission line; net profit tagged **"unchanged"** in secondary text. **Both cards must show £847.00 net profit** — that's the point: reporting is corrected, cash is not.
- If `before`/`after` is null → **"Awaiting data…"** placeholder.

### 4.7 AuditTrail
```typescript
interface AuditTrailProps {
  entries: AuditEntry[];
  defaultOpen?: boolean;   // default false — collapsed during the pitch
}
```
- Collapsible disclosure, header **"Transaction Trace"** + chevron, **default collapsed** (expanded only for the architecture beat / Q&A).
- Table columns: **Timestamp · Action · Request Summary · Xero ID · Status**. Wrap in `overflow-x-auto` so it scrolls **inside its own box** on narrow screens.
- Row formatting: timestamp → **`HH:MM:SS`**; action in a **code-style badge** (`bg-slate-700 rounded px-2`); request truncated to a summary (e.g. "Invoice £1,340.00 → Platform Clearing"); `xero_id` in **monospace**; status = green **tick** (success) / red **cross** (error).
- Empty state: **"No audit entries yet."** in secondary text.

### 4.8 Header / Brand (structural)
- Top of page: **PayoutBridge** wordmark/logo + the tagline **"Your bank feed has been lying about your turnover."** Understated, financial-grade. This is the constant across all frames.

### 4.9 App / Layout shell (structural)
- The single-page container: dark `#0f172a` background, centred max-width column, vertically stacked panels, no routing. Owns the `phase` state and renders exactly the components each phase calls for (§5). Between frames in the deliverable, this shell is what you clone per phase.

---

# 5. PHASE STATE MACHINE → SCREENS (render EVERY phase as its own labeled frame)

The app is a linear state machine with **8 phases**. **In your single deliverable, render each phase as a separate, clearly-labeled frame stacked top-to-bottom in the order below.** Each frame is a self-contained mini-screen of the app showing **exactly** the components visible in that phase (per the table). Caption every frame with its phase name + a one-line "what's happening". Think of it as a design board that walks a reviewer through all eight states without them touching anything.

```
idle ──upload──▶ uploading ──┬─ parse error ─▶ error (retry allowed)
                             ├─ duplicate ────▶ idempotent (amber banner + existing IDs)
                             └─ ok ───────────▶ proposed ──approve──▶ approving ──┬─ xero error ─▶ partial_error
                                                                                  └─ ok ────────▶ verified ──▶ (reset to idle)
```

**Components visible per phase — build each frame to match exactly:**

| Phase | Frame shows |
|---|---|
| **idle** | Header + FileUpload only. *(Beat 1 — lead with the tagline + the £847-vs-£1,340 discrepancy framing.)* Nothing else may be present. |
| **uploading** | Header + FileUpload in **loading/disabled** state (spinner in the drop zone). |
| **error** | Header + FileUpload with an **inline red error** (e.g. "Please upload a .csv file" or "CSV parse error: …"), retry allowed. |
| **idempotent** | Header + FileUpload + **IdempotencyBanner** (amber, warning icon, three existing Xero IDs). |
| **proposed** | Header + FileUpload (disabled) + **ApprovalDrawer** (idle, Approve enabled). *(Beat 2)* |
| **approving** | Header + FileUpload (disabled) + ApprovalDrawer (disabled, "Posting to Xero…") + **StepProgress animating** 1/3 → 2/3 → 3/3. *(Beat 3)* |
| **partial_error** | Header + FileUpload (disabled) + ApprovalDrawer (disabled) + **StepProgress** with step 1 ✓ green and **step 2 showing a red error**, plus an error message. (Backend killed mid-approve — completed steps are preserved, not wiped.) |
| **verified** | Header + FileUpload (disabled, "Upload another statement") + ApprovalDrawer (approved) + StepProgress (all complete) + **ClearingReconciliation (£0.00 ✓)** + **PnLComparison** + **AuditTrail (collapsed)**. *(Beat 4 — HERO frame, give it the most space and polish.)* |

Strictness the reviewer checks: in **idle**, only FileUpload is in the DOM (no drawer/reconciliation lurking hidden). In **verified**, ClearingReconciliation + PnLComparison + AuditTrail are **all present simultaneously**.

---

# 6. MOCK DATA (verbatim — render these exact numbers on every frame)

Use these literals. Every screen renders real numbers off these objects: **1340.00 / 445.90 / 47.10 / 847.00**, **493.00**, refs **MC-PAYOUT-0407**, IDs **INV-0042 / BT-0117 / PMT-0089**.

```typescript
const mockPayout /* CanonicalPayout */ = {
  payout_ref: "MC-PAYOUT-0407",
  period: "16-30 Jun 2026",
  gross: "1340.00",
  commission: "445.90",
  fees: "47.10",
  refunds: "0.00",
  net: "847.00",
  bookings: [ /* 9 rows — see the booking table below */ ],
};

const mockPlan /* JournalPlan */ = {
  steps: [
    { kind: "create-invoice",          amount: "1340.00", account: "Platform Clearing", lines: null, clears: null },
    { kind: "create-bank-transaction", amount: "493.00",  account: "Platform Clearing",
      lines: [
        { description: "New-client commission", amount: "445.90" },
        { description: "Prepayment fees",       amount: "47.10"  },
      ], clears: null },
    { kind: "create-payment",          amount: "847.00",  account: null, lines: null, clears: "MC-PAYOUT-0407" },
  ],
  invariant_check: true,
};

const mockApproval /* ApprovalResponse */ = {
  file_hash: "abc123",
  results: [
    { step: 1, kind: "create-invoice",          xero_id: "INV-0042", status: "success" },
    { step: 2, kind: "create-bank-transaction", xero_id: "BT-0117",  status: "success" },
    { step: 3, kind: "create-payment",          xero_id: "PMT-0089", status: "success" },
  ],
  clearing_balance: "0.00",
  verified: true,
};

const mockPnl /* PnLResponse */ = {
  before: { revenue: "847.00",  commission_expense: null,     other_expenses: null, net_profit: "847.00" },
  after:  { revenue: "1340.00", commission_expense: "493.00", other_expenses: null, net_profit: "847.00" },
};

const mockAuditEntries /* AuditEntry[] */ = [
  { timestamp: "2026-07-04T15:30:00Z", file_hash: "abc123", action: "create-invoice",
    request: { contact: "MarketplaceCo", amount: "1340.00" }, xero_id: "INV-0042", status: "success" },
  { timestamp: "2026-07-04T15:30:01Z", file_hash: "abc123", action: "create-bank-transaction",
    request: { lines: [{ description: "Commission", amount: "445.90" }] }, xero_id: "BT-0117", status: "success" },
  { timestamp: "2026-07-04T15:30:02Z", file_hash: "abc123", action: "create-payment",
    request: { invoice_id: "INV-0042", amount: "847.00" }, xero_id: "PMT-0089", status: "success" },
];

const mockExistingIds = { invoice_id: "INV-0042", bank_txn_id: "BT-0117", payment_id: "PMT-0089" };
```

**Booking detail — 9 rows.** The source spec only prints row 1 verbatim; the other 8 are illustrative fill I derived so the table renders 9 real rows and the columns reconcile to the canonical totals (new-client rows carry 35% commission; repeat rows carry none; gross sums to £1,340.00, commission to £445.90). Render this table verbatim:

| Date | Client | Type | Service | Amount | Comm. Rate | Commission |
|---|---|---|---|---:|---:|---:|
| 2026-06-17 | Client A | New | Cut & Colour | £180.00 | 35% | £63.00 |
| 2026-06-18 | Client B | New | Balayage | £220.00 | 35% | £77.00 |
| 2026-06-19 | Client C | New | Full Head Colour | £195.00 | 35% | £68.25 |
| 2026-06-21 | Client D | New | Cut & Blow Dry | £95.00 | 35% | £33.25 |
| 2026-06-23 | Client E | New | Highlights | £240.00 | 35% | £84.00 |
| 2026-06-25 | Client F | New | Keratin Treatment | £180.00 | 35% | £63.00 |
| 2026-06-27 | Client G | New | Colour Correction | £164.00 | 35% | £57.40 |
| 2026-06-29 | Client H | Repeat | Blow Dry | £35.00 | — | £0.00 |
| 2026-06-30 | Client I | Repeat | Fringe Trim | £31.00 | — | £0.00 |

*(Row 1 is the one canonical row from the spec. Totals: gross £1,340.00, commission £445.90 — do not recompute in the UI, just print. Remember: these amounts are display strings.)*

---

# 7. API SHAPES (field names the UI consumes — match these so the mock mirrors reality)

All money fields are **JSON strings** (e.g. `"1340.00"`). The UI displays them as-is with a `£` prefix; **no client-side arithmetic**.

**`POST /propose`** (multipart, field `file`: CSV) — **new file → 200:**
```json
{ "status": "new", "file_hash": "a1b2c3…",
  "payout": { "payout_ref": "MC-PAYOUT-0407", "period": "16-30 Jun 2026",
    "gross": "1340.00", "commission": "445.90", "fees": "47.10", "refunds": "0.00", "net": "847.00",
    "bookings": [ { "date": "2026-06-17", "client": "Client A", "client_type": "New",
      "service": "Cut & Colour", "gross_amount": "180.00", "commission_rate": "35%", "commission": "63.00" } ] },
  "plan": { "steps": [
    { "kind": "create-invoice", "amount": "1340.00", "account": "Platform Clearing", "lines": null, "clears": null },
    { "kind": "create-bank-transaction", "amount": "493.00", "account": "Platform Clearing",
      "lines": [ { "description": "New-client commission", "amount": "445.90" },
                 { "description": "Prepayment fees", "amount": "47.10" } ], "clears": null },
    { "kind": "create-payment", "amount": "847.00", "account": null, "lines": null, "clears": "MC-PAYOUT-0407" }
  ], "invariant_check": true },
  "existing_ids": null }
```
**`POST /propose`** — **duplicate → 200:** same `payout`, `plan: null`, and
```json
{ "status": "already-posted", "existing_ids": {
  "invoice_id": "INV-0042", "bank_txn_id": "BT-0117", "payment_id": "PMT-0089",
  "completed_steps": ["create-invoice","create-bank-transaction","create-payment"] } }
```
Errors: `400` malformed CSV → `{"detail":"CSV parse error: …"}`; `422` invariant → `{"detail":"Invariant violation: 1340.00 - 445.90 - 47.10 - 0.00 = 847.00, expected 846.00"}`.

**`POST /approve`** (`{ "file_hash": string }`) — **200:**
```json
{ "file_hash": "a1b2c3…", "results": [
  { "step": 1, "kind": "create-invoice", "xero_id": "INV-0042", "status": "success" },
  { "step": 2, "kind": "create-bank-transaction", "xero_id": "BT-0117", "status": "success" },
  { "step": 3, "kind": "create-payment", "xero_id": "PMT-0089", "status": "success" } ],
  "clearing_balance": "0.00", "verified": true }
```
Errors: `404` no proposal; `409` all steps already done (`+ existing_ids`); `503` Xero write failed mid-sequence → `{"detail":"Xero write failed at step 2: …","completed":[…]}` (completed steps preserved — this feeds the **partial_error** frame).

**`GET /status/{file_hash}`** → `{ file_hash, completed_steps[], invoice_id, bank_txn_id, payment_id, clearing_balance, audit_entries[] }`. Each audit entry: `{ timestamp (ISO 8601), file_hash, action, request{}, xero_id, status }`.

**`GET /pnl`** → `{ "before": { "revenue":"847.00", "commission_expense":null, "other_expenses":{}, "net_profit":"847.00" }, "after": { "revenue":"1340.00", "commission_expense":"493.00", "other_expenses":{}, "net_profit":"847.00" } }`. `after` is `null` until `/approve` runs.

**`GET /health`** → `{ "status":"ok", "xero_connected":true, "organisation":"Demo Company (UK)" }` (or `degraded` / `false` / `null`).

**Types the UI binds to:** `BookingRow, CanonicalPayout, FeeLineItem, PlanStep, JournalPlan, ProposalResponse, StepResult, ApprovalResponse, PnLSnapshot, PnLResponse, AuditEntry, StatusResponse`. `Phase = "idle" | "uploading" | "proposed" | "approving" | "verified" | "error" | "idempotent" | "partial_error"`. **All monetary fields are `string`.**

---

# 8. DELIVERABLE SPEC

- **One self-contained artifact.** A single HTML file (inline `<style>`, inline data, inline SVG icons — no external requests, no CDN) **or** a single React artifact. It must render standalone.
- **Show all 8 phases in order**, each as its own labeled frame stacked top-to-bottom (§5), each captioned with the phase name + a one-line description. This is a design board of every state, not a click-through app (static frames are fine; light animation on the payoff frame is welcome).
- **Give the `verified` (payoff) frame hero treatment** — the largest frame, the most polish, and inside it the `£0.00 ✓` is the biggest element on the entire page. This is the frame Supavich will iterate on first, so make it shine.
- **Design tokens exactly as §2.1.** Amounts in monospace tabular-nums, right-aligned, `£`-prefixed, never computed.
- **Responsive:** primary target **1280×720**. Below **768px**, the P&L cards **stack vertically** and the audit table scrolls horizontally **inside its own container**; the **page body never scrolls horizontally** at any width; the drop zone stays usable down to 480px.
- **Accessibility:** every status carries **icon + text**, not colour alone (green tick / amber warning / red cross); interactive elements are keyboard-reachable with a **visible blue focus ring** on the dark background; WCAG AA contrast throughout.
- **Copy is verbatim** where this prompt quotes it ("Approve & Post to Xero", "Already posted — skipped (idempotent)", "Posting to Xero…", the three "What Xero will do" lines, step labels "Invoice/Fees/Payment", "Transaction Trace").
- **No "Treatwell" anywhere.** Platform = MarketplaceCo, clients = Client A–I, org = "Demo Company (UK)".

Now design and build the artifact.

━━━━━━━━━━━━━━━━  ⬆  END OF PROMPT — STOP PASTING HERE  ⬆  ━━━━━━━━━━━━━━━━

---

## Checklist for Supavich

- [ ] **Paste** everything between the two marker lines into a fresh Claude "design" chat (nothing above/below the markers).
- [ ] **Review all 8 phase frames** render in order: idle → uploading → error → idempotent → proposed → approving → partial_error → verified. Each should show only the components that phase allows.
- [ ] **Iterate on the payoff (`verified`) frame first** — confirm `Platform Clearing: £0.00 ✓` is unmistakably the largest thing on the page, the reconciliation equation reads `Gross £1,340 − Commission & fees £493 = Net £847`, and the P&L before/after shows revenue £847 → £1,340 with net profit unchanged at £847.
- [ ] **Spot-check the hard rules:** exact hex tokens, amounts in monospace tabular-nums (never computed), no horizontal page scroll, every status has an icon + text (greyscale-safe), and the word "Treatwell" appears **nowhere**.
- [ ] **Numbers audit:** 1340.00 / 445.90 / 47.10 / 0.00 / 847.00 / 493.00, refs MC-PAYOUT-0407, IDs INV-0042 · BT-0117 · PMT-0089, period "16-30 Jun 2026".
- [ ] **Projector pass:** open at 1280×720, stand back ~5m — body ≥16px, table amounts ≥18px, £0.00 ≥32px, Approve label ≥18px, all legible.
- [ ] Ask the design chat to tune the entrance animation (400–600ms ease-out) and step timing (~300ms/step) if either feels off in the recording.
