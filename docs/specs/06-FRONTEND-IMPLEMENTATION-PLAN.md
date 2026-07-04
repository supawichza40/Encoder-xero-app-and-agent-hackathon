# PayoutBridge — Frontend Implementation Plan

A parallel-first plan for building the React/Vite/Tailwind frontend. Work is organised into a shared foundation, three independent tracks that run simultaneously, an integration phase that wires everything into the page, and a final polish pass.

References: [04-FRONTEND-SPEC.md](04-FRONTEND-SPEC.md) (component specs), [03-API-SPEC.md](03-API-SPEC.md) (API contracts), [01-APP-OVERVIEW.md](01-APP-OVERVIEW.md) Section 4 (user journey).

---

## Execution Map

```
                    ┌──────────────────────┐
                    │  FOUNDATION           │
                    │  Vite + Types + Hook  │
                    │  + Design Tokens      │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            v                  v                  v
 ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
 │  TRACK A       │  │  TRACK B         │  │  TRACK C         │
 │  Ingestion     │  │  Payoff Panels   │  │  Data Display    │
 │                │  │                  │  │                  │
 │  A1: FileUpload│  │  B1: Clearing    │  │  C1: StepProgress│
 │  A2: Approval  │  │      Recon       │  │  C2: AuditTrail  │
 │      Drawer    │  │  B2: PnL         │  │  C3: Idempotency │
 │                │  │      Comparison  │  │      Banner      │
 └───────┬────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │
                    ┌─────────v──────────┐
                    │  INTEGRATION       │
                    │  App.tsx wiring    │
                    │  + state machine   │
                    └─────────┬──────────┘
                              │
                    ┌─────────v──────────┐
                    │  FINAL             │
                    │  Projector polish  │
                    │  + browser test    │
                    └────────────────────┘
```

Each track produces self-contained, individually testable components. No track imports from another — they all consume the shared types and API hook from the Foundation.

---

## FOUNDATION — Project Scaffold, Types, API Hook, Design Tokens

**Must complete before any track starts.** Produces a running Vite dev server, all TypeScript types matching the backend API contract, the central `usePayoutBridge` hook, and the Tailwind design tokens.

### F1 — Project Scaffold

| # | Task | Detail |
|---|---|---|
| F1.1 | Initialise Vite project | `npm create vite@latest frontend -- --template react-ts` |
| F1.2 | Install Tailwind | `npm install -D tailwindcss @tailwindcss/vite` and configure `tailwind.config.js` with the dark theme palette |
| F1.3 | Write `vite.config.ts` | API proxy: `/propose`, `/approve`, `/status`, `/pnl`, `/health` all forward to `http://localhost:8000` |
| F1.4 | Clean boilerplate | Remove default Vite/React template content from `App.tsx`, `index.css`, etc. |
| F1.5 | Set base styles | Dark background (`#0f172a`), default text colour (`#f8fafc`), font stack (system sans-serif + monospace for numbers) in `index.css` via Tailwind `@layer base` |

### F2 — TypeScript Types (`src/types/index.ts`)

| # | Task | Detail |
|---|---|---|
| F2.1 | API response types | `BookingRow`, `CanonicalPayout`, `FeeLineItem`, `PlanStep`, `JournalPlan`, `ProposalResponse`, `StepResult`, `ApprovalResponse`, `PnLSnapshot`, `PnLResponse`, `AuditEntry`, `StatusResponse` — all matching [03-API-SPEC.md](03-API-SPEC.md) exactly. All monetary fields are `string` (no client-side arithmetic). |
| F2.2 | UI state types | `Phase` union type: `"idle" \| "uploading" \| "proposed" \| "approving" \| "verified" \| "error" \| "idempotent" \| "partial_error"` |

### F3 — API Hook (`src/hooks/usePayoutBridge.ts`)

| # | Task | Detail |
|---|---|---|
| F3.1 | State management | `phase: Phase`, `proposal: ProposalResponse \| null`, `approval: ApprovalResponse \| null`, `pnl: PnLResponse \| null`, `error: string \| null` |
| F3.2 | `uploadFile(file: File)` | `POST /propose` with `FormData`. On success: if `status === "already-posted"` set phase to `"idempotent"`, else set phase to `"proposed"`. On error: set phase to `"error"`, store message. |
| F3.3 | `approve()` | `POST /approve` with `{file_hash}`. Set phase to `"approving"` before the call. On success: set `approval`, set phase to `"verified"`, immediately call `fetchPnl()`. On error: set phase to `"partial_error"`, store partial results. |
| F3.4 | `fetchPnl()` | `GET /pnl`. Store result in `pnl` state. |
| F3.5 | `fetchStatus(hash)` | `GET /status/{hash}`. Returns `StatusResponse` for the audit trail. |
| F3.6 | `reset()` | Clear all state, set phase to `"idle"`. |
| F3.7 | API base URL | `const API_BASE = import.meta.env.VITE_API_URL ?? ""` (empty string = use Vite proxy) |

### F4 — Design Tokens (`tailwind.config.js` extension)

| # | Task | Detail |
|---|---|---|
| F4.1 | Colour tokens | Extend Tailwind `theme.colors` with: `primary: "#0f172a"`, `card: "#1e293b"`, `success: "#22c55e"`, `warning: "#f59e0b"`, `error: "#ef4444"`, `accent: "#3b82f6"` |
| F4.2 | Utility classes | Add `font-tabular` utility for `font-variant-numeric: tabular-nums` (right-aligned monetary columns) |

**Acceptance Check:**

```bash
cd frontend && npm install && npm run dev
# Vite dev server starts on localhost:5173
# Page loads with dark background, no content yet
# TypeScript compiles with zero errors
```

---

## TRACK A — Ingestion Components

**What this delivers:** The two components that handle the first half of the user journey — uploading a file and reviewing/approving the proposal. These are the primary interactive surfaces.

**Prerequisite:** Foundation complete.

**Backend required:** No. Components can be developed and visually tested with hardcoded mock data.

### A1 — `FileUpload` Component (`src/components/FileUpload.tsx`)

| # | Task | Detail |
|---|---|---|
| A1.1 | Drop zone UI | Dashed-border rectangle with an upload icon and "Drag & drop your payout CSV, or click to browse" text. Styled with `border-dashed border-slate-600 hover:border-accent`. |
| A1.2 | Drag-and-drop handlers | `onDragOver`, `onDragEnter` (highlight border), `onDragLeave` (reset), `onDrop` (extract file). Visual feedback: border turns `accent` blue on drag-over. |
| A1.3 | File input fallback | Hidden `<input type="file" accept=".csv">` triggered by clicking the drop zone. |
| A1.4 | Upload trigger | On file received (drop or pick): validate `.csv` extension, call `onProposalReceived` callback (parent wires this to `usePayoutBridge.uploadFile`). |
| A1.5 | Loading state | When `disabled` is true (upload in progress): show spinner inside the drop zone, grey out, prevent further drops. |
| A1.6 | Error display | When `onError` fires: show inline red text below the drop zone with the error message. Dismiss on next interaction. |

**Props:**

```typescript
interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
  error: string | null;
}
```

**Acceptance:** Renders the drop zone. Dropping a `.csv` file calls `onFileSelected`. Dropping a non-CSV shows an error. Loading state greys out the zone.

### A2 — `ApprovalDrawer` Component (`src/components/ApprovalDrawer.tsx`)

| # | Task | Detail |
|---|---|---|
| A2.1 | Payout summary card | Table showing `Gross`, `Commission`, `Fees`, `Refunds`, `Net` with amounts right-aligned in monospace. Equation rendered visually: `£1,340.00 - £493.00 = £847.00`. |
| A2.2 | Booking detail (collapsible) | Disclosure/accordion: "View 9 bookings". Table: Date, Client, Type, Service, Amount, Commission Rate, Commission. Default collapsed. |
| A2.3 | "What Xero will do" checklist | Three items, each with a circle-outline icon: (1) "Create a gross revenue invoice for £{gross} into Platform Clearing", (2) "Book commission (£{commission}) and fees (£{fees}) as expenses from Platform Clearing", (3) "Clear the £{net} net payout against your bank deposit". Amounts interpolated from `payout`. |
| A2.4 | Approve button | Full-width green button: "Approve & Post to Xero". `bg-success hover:bg-green-600 text-white font-semibold py-3 text-lg`. Disabled state: `opacity-50 cursor-not-allowed`. |
| A2.5 | State transitions | `idle`: button enabled. `loading` (during `/approve`): button disabled, text changes to "Posting to Xero...", spinner replaces icon. `approved`: button hidden (replaced by StepProgress/ClearingReconciliation from parent). |

**Props:**

```typescript
interface ApprovalDrawerProps {
  payout: CanonicalPayout;
  plan: JournalPlan;
  onApprove: () => void;
  disabled: boolean;
}
```

**Acceptance:** Renders with mock payout data. Amounts display correctly with `£` prefix and tabular alignment. Clicking approve calls `onApprove`. Booking detail toggles open/closed.

### Track A — Done

Two fully styled, interactive components that handle Upload -> Review -> Approve. They don't know about Xero results — that's Tracks B and C.

---

## TRACK B — Payoff Panels

**What this delivers:** The two components that prove the correction worked — the clearing reconciliation and the P&L before/after. These are the most visually important elements in the demo pitch.

**Prerequisite:** Foundation complete.

**Backend required:** No. Developed with hardcoded mock data.

### B1 — `ClearingReconciliation` Component (`src/components/ClearingReconciliation.tsx`)

| # | Task | Detail |
|---|---|---|
| B1.1 | Equation row | Large-format text: `Gross £1,340 - Commission & fees £493 = Net £847`. Font size `text-xl` or larger. Monospace for amounts. |
| B1.2 | Verification badge | Prominent display: "Platform Clearing: £0.00" with a green checkmark icon. Font size `text-3xl` minimum (must be legible from the back of a room on a projector). Green text (`text-success`) when `verified === true`. Red text (`text-error`) with warning icon if balance is non-zero. |
| B1.3 | Visual emphasis | This is the single most important UI element in the demo. Card background slightly lighter than page (`bg-card`), with a subtle green border (`border-success/30`) when verified. The `£0.00` should be the largest text on the entire page. |
| B1.4 | Animation | Fade-in + scale-up animation when the component first renders (the "payoff moment"). Use CSS `@keyframes` or Tailwind `animate-` utilities. |

**Props:**

```typescript
interface ClearingReconciliationProps {
  gross: string;
  feesTotal: string;
  net: string;
  clearingBalance: string;
  verified: boolean;
}
```

**Acceptance:** Renders the equation and badge with mock data. `£0.00` is the largest, most prominent text. Verified state shows green; non-zero shows red. Entrance animation plays on mount.

### B2 — `PnLComparison` Component (`src/components/PnLComparison.tsx`)

| # | Task | Detail |
|---|---|---|
| B2.1 | Two-card layout | Side-by-side cards using CSS grid or flex: "BEFORE" (left) and "AFTER" (right). Stack vertically below `768px`. |
| B2.2 | BEFORE card | Muted styling (`opacity-60` or `bg-slate-800/50`). Header: "BEFORE". Lines: Revenue: £847.00, Commission Expense: —, Net Profit: £847.00. |
| B2.3 | AFTER card | Highlighted styling (full opacity, subtle green-tinted border). Header: "AFTER". Lines: Revenue: £1,340.00 (highlighted with upward arrow or green text), Commission Expense: £493.00 (new line, highlighted), Net Profit: £847.00. |
| B2.4 | Change indicators | Revenue line: show delta `+£493.00` in green. Commission line: show "NEW" badge. Net profit: show "unchanged" in secondary text — reinforces that the correction fixes reporting, not cash. |
| B2.5 | Null handling | If `before` or `after` is `null`, show a placeholder: "Awaiting data..." in secondary text. |

**Props:**

```typescript
interface PnLComparisonProps {
  before: PnLSnapshot | null;
  after: PnLSnapshot | null;
}
```

**Acceptance:** Renders two cards with mock P&L data. Revenue delta visible. Commission line has "NEW" indicator. Stacks on narrow viewport. Null `after` shows placeholder.

### Track B — Done

Two polished display panels that are the visual climax of the demo. They receive data from props and render it — no API calls, no state management.

---

## TRACK C — Feedback & Status Components

**What this delivers:** The components that communicate progress, idempotency, and audit information — the feedback layer between user action and system response.

**Prerequisite:** Foundation complete.

**Backend required:** No. Developed with hardcoded mock data.

### C1 — `StepProgress` Component (`src/components/StepProgress.tsx`)

| # | Task | Detail |
|---|---|---|
| C1.1 | Three-step horizontal layout | Three columns, evenly spaced. Each column: step indicator (circle) + label below. Labels: "Invoice", "Fees", "Payment". |
| C1.2 | Step states | **Pending:** grey circle, grey label. **In-progress:** blue circle with animated spinner, blue label, pulsing glow. **Complete:** green circle with checkmark icon, green label. |
| C1.3 | Progress derivation | Component receives `results: StepResult[]` and `totalSteps: 3`. Steps 1..N where `N = results.length` are complete. Step `N+1` is in-progress (if `N < totalSteps`). Steps beyond `N+1` are pending. |
| C1.4 | Connector lines | Horizontal lines between step circles. Solid green for completed transitions, dashed grey for pending. |
| C1.5 | Header text | Above the steps: "Posting to Xero..." (during progress) or "Posted to Xero" (all complete). |

**Props:**

```typescript
interface StepProgressProps {
  results: StepResult[];
  totalSteps: number;
  isActive: boolean;
}
```

**Acceptance:** Renders with 0, 1, 2, and 3 completed steps. Spinner animates on the in-progress step. Completed steps show green checks. Connectors reflect state.

### C2 — `AuditTrail` Component (`src/components/AuditTrail.tsx`)

| # | Task | Detail |
|---|---|---|
| C2.1 | Collapsible container | Disclosure element. Header: "Transaction Trace" with a chevron icon. Default state: **collapsed** (during pitch, expanded only for the architecture beat). |
| C2.2 | Table layout | Columns: Timestamp, Action, Request Summary, Xero ID, Status. Horizontal scroll on narrow screens (`overflow-x-auto`). |
| C2.3 | Row rendering | Each `AuditEntry`: format timestamp to `HH:MM:SS`, display action in a code-style badge (`bg-slate-700 rounded px-2`), truncate request to a summary string (e.g. "Invoice £1,340.00 -> Platform Clearing"), display `xero_id` in monospace, status as green tick or red cross icon. |
| C2.4 | Empty state | If `entries` is empty: "No audit entries yet." in secondary text. |

**Props:**

```typescript
interface AuditTrailProps {
  entries: AuditEntry[];
  defaultOpen?: boolean;
}
```

**Acceptance:** Renders collapsed by default. Click header to expand. Table shows mock entries with correct formatting. Scrolls horizontally on narrow screens.

### C3 — `IdempotencyBanner` Component (`src/components/IdempotencyBanner.tsx`)

| # | Task | Detail |
|---|---|---|
| C3.1 | Amber banner | Full-width bar with amber background (`bg-warning/10 border-warning`), warning icon, and text: "Already posted — skipped (idempotent)". |
| C3.2 | Xero ID display | Below the message: "Xero IDs: INV-0042, BT-0117, PMT-0089" in monospace, pulled from `existingIds`. |
| C3.3 | Dismiss/reset | Optional "Upload a different file" link/button that calls the parent's reset function. |

**Props:**

```typescript
interface IdempotencyBannerProps {
  existingIds: {
    invoice_id: string;
    bank_txn_id: string;
    payment_id: string;
  };
  onReset: () => void;
}
```

**Acceptance:** Renders amber banner with mock IDs. Clicking "Upload a different file" calls `onReset`.

### Track C — Done

Three feedback components that communicate system state to the user. All stateless — they receive data and render it.

---

## INTEGRATION — App.tsx Wiring & State Machine

**Prerequisite:** Tracks A, B, and C all complete. This is where they merge into a single interactive page.

**What this delivers:** The fully wired `App.tsx` that orchestrates all components through the state machine, responding to user actions and API results.

### Steps

| # | Task | Detail |
|---|---|---|
| I1 | Wire `usePayoutBridge` hook | Instantiate the hook in `App.tsx`. All component callbacks route through hook actions. |
| I2 | Page layout shell | Vertical stack with max-width container (`max-w-4xl mx-auto`). Header with "PayoutBridge" title and tagline. Sections appear/disappear based on `phase`. |
| I3 | State-to-component mapping | Implement the state machine: |

**State machine wiring:**

```
Phase            Visible Components
─────            ──────────────────
idle             FileUpload
uploading        FileUpload (disabled, loading)
error            FileUpload (with error message)
idempotent       FileUpload + IdempotencyBanner
proposed         FileUpload (disabled) + ApprovalDrawer
approving        FileUpload (disabled) + ApprovalDrawer (disabled)
                 + StepProgress (animating)
verified         FileUpload (disabled) + ApprovalDrawer (approved)
                 + StepProgress (complete)
                 + ClearingReconciliation
                 + PnLComparison
                 + AuditTrail
partial_error    FileUpload (disabled) + ApprovalDrawer (disabled)
                 + StepProgress (showing error on failed step)
                 + error message
```

| # | Task | Detail |
|---|---|---|
| I4 | `FileUpload` wiring | `onFileSelected` -> `hook.uploadFile(file)`. `disabled` = `phase !== "idle"`. `error` = `hook.error` when `phase === "error"`. |
| I5 | `IdempotencyBanner` wiring | Render when `phase === "idempotent"`. `existingIds` = `hook.proposal.existing_ids`. `onReset` = `hook.reset`. |
| I6 | `ApprovalDrawer` wiring | Render when `phase` is `"proposed"`, `"approving"`, or `"verified"`. `payout` = `hook.proposal.payout`. `plan` = `hook.proposal.plan`. `onApprove` = `hook.approve`. `disabled` = `phase !== "proposed"`. |
| I7 | `StepProgress` wiring | Render when `phase` is `"approving"` or `"verified"`. `results` = `hook.approval?.results ?? []`. `totalSteps` = `3`. `isActive` = `phase === "approving"`. |
| I8 | `ClearingReconciliation` wiring | Render when `phase === "verified"`. `gross` = `hook.proposal.payout.gross`. `feesTotal` = string sum of commission + fees (pre-computed from proposal, as a display string). `net` = `hook.proposal.payout.net`. `clearingBalance` = `hook.approval.clearing_balance`. `verified` = `hook.approval.verified`. |
| I9 | `PnLComparison` wiring | Render when `phase === "verified"`. `before` = `hook.pnl?.before`. `after` = `hook.pnl?.after`. If `pnl` is null (still loading), show loading state. |
| I10 | `AuditTrail` wiring | Render when `phase === "verified"`. Fetch entries via `hook.fetchStatus(hash)` after approval completes. Pass `entries` to component. |
| I11 | Reset flow | After `verified`, re-enable `FileUpload` with a "Upload another statement" prompt. Dropping a new file calls `hook.reset()` then `hook.uploadFile()`. |
| I12 | Scroll behaviour | After approval completes (phase -> `"verified"`), smooth-scroll to the `ClearingReconciliation` panel so it's immediately visible — this is the demo payoff moment. |

### Acceptance Check

```
Full flow with running backend:

1. Page loads -> FileUpload drop zone visible, nothing else
2. Drop golden CSV -> spinner -> ApprovalDrawer appears with correct amounts
3. Click "Approve & Post to Xero" -> StepProgress animates 1/3, 2/3, 3/3
4. ClearingReconciliation fades in: "Platform Clearing: £0.00 ✓"
5. PnL before/after appears: revenue 847 -> 1340, commission NEW
6. AuditTrail expandable: 3 entries with real Xero IDs
7. Drop same CSV again -> amber "Already posted" banner with IDs

Full flow with mock data (no backend):
- Same visual progression using hardcoded responses in the hook
```

---

## FINAL — Projector Polish & Browser Testing

**Prerequisite:** Integration complete.

**What this delivers:** A demo-ready page verified on a projector-resolution screen, with all edge cases handled.

### Steps

| # | Task | Detail |
|---|---|---|
| P1 | Projector test | Open the page at 1280x720 in the browser. Verify all text readable, `£0.00 ✓` dominant, P&L cards side-by-side, no horizontal scroll on the page body. |
| P2 | Font sizing audit | Confirm: body text >= 16px, amounts >= 18px in tables, `£0.00` verification >= 32px, Approve button text >= 18px. |
| P3 | Transition timing | Tune the ClearingReconciliation entrance animation: not too fast (misses the payoff), not too slow (wastes pitch time). Target: 400-600ms ease-out. |
| P4 | StepProgress timing | Verify the step indicators update as each write completes. If the backend responds too fast for the animation to register, add a minimum display time per step (~300ms) so the progress is visible during the pitch. |
| P5 | Error states | Test: upload a `.txt` file (error), upload while already processing (disabled), backend down during approve (partial error with completed steps shown). |
| P6 | Responsive check | Narrow the viewport to 768px and below. P&L cards stack vertically. Audit table scrolls horizontally. Drop zone remains usable. |
| P7 | Keyboard navigation | Tab through: FileUpload -> ApprovalDrawer approve button -> AuditTrail disclosure. Focus states visible on dark background. |
| P8 | Colour-blind check | Verify status is never communicated by colour alone: green check has a tick icon, amber banner has a warning icon, red error has a cross icon + text message. |

### Acceptance Check

```
- Page renders correctly at 1280x720 (projector resolution)
- Full golden path clickable with real backend in < 60 seconds
- £0.00 ✓ is the largest, most visible element after approval
- Idempotency re-upload shows amber banner
- No horizontal page scroll at any viewport width
- All interactive elements reachable via keyboard
```

---

## Parallel Execution Timeline

```
Time ──────────────────────────────────────────────────────────────────>

          FOUNDATION
          [F1-F4]
             │
             ├──────────────────────────────────────────────┐
             │                                              │
             │  TRACK A              TRACK B                │  TRACK C
             │  (Ingestion)          (Payoff)                │  (Feedback)
             │                                              │
             │  [A1] FileUpload      [B1] ClearingRecon     │  [C1] StepProgress
             │    │                    │                     │    │
             │    v                    v                     │    v
             │  [A2] ApprovalDrawer  [B2] PnLComparison     │  [C2] AuditTrail
             │                                              │    │
             │                                              │    v
             │                                              │  [C3] IdempotencyBanner
             │                                              │
             └────────────────────┬─────────────────────────┘
                                  │
                           INTEGRATION
                           [I1-I12] App.tsx
                                  │
                                  v
                              FINAL
                           [P1-P8] Polish
```

### Who can work on what, when

| Worker | Starts after | Works on | Delivers |
|---|---|---|---|
| **Worker 1** | Foundation | Track A (A1 -> A2) | `FileUpload.tsx`, `ApprovalDrawer.tsx` |
| **Worker 2** | Foundation | Track B (B1 -> B2) | `ClearingReconciliation.tsx`, `PnLComparison.tsx` |
| **Worker 3** | Foundation | Track C (C1 -> C2 -> C3) | `StepProgress.tsx`, `AuditTrail.tsx`, `IdempotencyBanner.tsx` |
| **Any one** | Tracks A + B + C done | Integration (I1 -> I12) | `App.tsx` wired with state machine |
| **Any one** | Integration done | Final (P1 -> P8) | Demo-ready polish |

A two-worker split assigns Track A + C to one worker and Track B + Integration to the other — Track A is the most interactive, Track B is the most visually critical, and neither is blocked by the other.

### Key Interfaces Between Tracks

All tracks are independent because they share only the Foundation's types and make no cross-imports:

| Interface | Defined in | Consumed by |
|---|---|---|
| `CanonicalPayout`, `JournalPlan`, `PlanStep` | Foundation (`types/index.ts`) | Track A (ApprovalDrawer renders plan steps) |
| `ProposalResponse` | Foundation (`types/index.ts`) | Track A (FileUpload triggers), Track C (IdempotencyBanner reads `existing_ids`) |
| `ApprovalResponse`, `StepResult` | Foundation (`types/index.ts`) | Track B (ClearingReconciliation reads balance), Track C (StepProgress reads results) |
| `PnLSnapshot`, `PnLResponse` | Foundation (`types/index.ts`) | Track B (PnLComparison renders snapshots) |
| `AuditEntry` | Foundation (`types/index.ts`) | Track C (AuditTrail renders entries) |
| `Phase` union type | Foundation (`types/index.ts`) | Integration (App.tsx drives visibility) |
| `usePayoutBridge` hook | Foundation (`hooks/usePayoutBridge.ts`) | Integration (App.tsx consumes all state and actions) |

### File Ownership (no merge conflicts)

| File | Track |
|---|---|
| `src/types/index.ts` | Foundation (shared, read-only after) |
| `src/hooks/usePayoutBridge.ts` | Foundation (shared, read-only after) |
| `src/components/FileUpload.tsx` | A |
| `src/components/ApprovalDrawer.tsx` | A |
| `src/components/ClearingReconciliation.tsx` | B |
| `src/components/PnLComparison.tsx` | B |
| `src/components/StepProgress.tsx` | C |
| `src/components/AuditTrail.tsx` | C |
| `src/components/IdempotencyBanner.tsx` | C |
| `src/App.tsx` | Foundation skeleton; **Integration writes the final version**. No track touches it — they only export components. |
| `tailwind.config.js` | Foundation (shared, read-only after) |
| `vite.config.ts` | Foundation (shared, read-only after) |

No merge point needed — each track owns its own component files, and only Integration touches `App.tsx`.

### Mock Data for Isolated Development

Each track can develop without a running backend by using mock data. Place in `src/mocks/`:

```typescript
// src/mocks/index.ts

export const mockPayout: CanonicalPayout = {
  payout_ref: "MC-PAYOUT-0407",
  period: "16-30 Jun 2026",
  gross: "1340.00",
  commission: "445.90",
  fees: "47.10",
  refunds: "0.00",
  net: "847.00",
  bookings: [
    { date: "2026-06-17", client: "Client A", client_type: "New",
      service: "Cut & Colour", gross_amount: "180.00",
      commission_rate: "35%", commission: "63.00" },
    // ... remaining 8 rows
  ],
};

export const mockPlan: JournalPlan = {
  steps: [
    { kind: "create-invoice", amount: "1340.00",
      account: "Platform Clearing", lines: null, clears: null },
    { kind: "create-bank-transaction", amount: "493.00",
      account: "Platform Clearing",
      lines: [
        { description: "New-client commission", amount: "445.90" },
        { description: "Prepayment fees", amount: "47.10" },
      ], clears: null },
    { kind: "create-payment", amount: "847.00",
      account: null, lines: null, clears: "MC-PAYOUT-0407" },
  ],
  invariant_check: true,
};

export const mockApproval: ApprovalResponse = {
  file_hash: "abc123",
  results: [
    { step: 1, kind: "create-invoice", xero_id: "INV-0042", status: "success" },
    { step: 2, kind: "create-bank-transaction", xero_id: "BT-0117", status: "success" },
    { step: 3, kind: "create-payment", xero_id: "PMT-0089", status: "success" },
  ],
  clearing_balance: "0.00",
  verified: true,
};

export const mockPnl: PnLResponse = {
  before: { revenue: "847.00", commission_expense: null,
            other_expenses: null, net_profit: "847.00" },
  after:  { revenue: "1340.00", commission_expense: "493.00",
            other_expenses: null, net_profit: "847.00" },
};

export const mockAuditEntries: AuditEntry[] = [
  { timestamp: "2026-07-04T15:30:00Z", file_hash: "abc123",
    action: "create-invoice",
    request: { contact: "MarketplaceCo", amount: "1340.00" },
    xero_id: "INV-0042", status: "success" },
  { timestamp: "2026-07-04T15:30:01Z", file_hash: "abc123",
    action: "create-bank-transaction",
    request: { lines: [{ description: "Commission", amount: "445.90" }] },
    xero_id: "BT-0117", status: "success" },
  { timestamp: "2026-07-04T15:30:02Z", file_hash: "abc123",
    action: "create-payment",
    request: { invoice_id: "INV-0042", amount: "847.00" },
    xero_id: "PMT-0089", status: "success" },
];

export const mockExistingIds = {
  invoice_id: "INV-0042",
  bank_txn_id: "BT-0117",
  payment_id: "PMT-0089",
};
```

Each track imports mock data directly into its component file during development, and removes the import once Integration wires real data through props.
