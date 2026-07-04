# PayoutBridge — Frontend Test Plan

Test plan for the React/Vite/Tailwind frontend, organised into the same parallel tracks as the [implementation plan](06-FRONTEND-IMPLEMENTATION-PLAN.md). Each track's tests are independent and can run without the other tracks being built.

> **Expansion cases (2026-07-05, [`11-EXPANSION-SPEC.md`](11-EXPANSION-SPEC.md)):**
> - **FX1** ApprovalDrawer: 4-step plan renders 4 checklist items incl. credit-note; refund row visible when `refunds != "0.00"`.
> - **FX2** StepProgress: `totalSteps` follows `plan.steps.length` (3 and 4 both correct).
> - **FX3** Persona: sign-up stores persona; switcher re-orders dashboard KPIs per tinting map (§P4); switching never refetches/mutates data.
> - **FX4** Landing: 3 persona cards render; card click pre-selects persona in sign-up dialog.
> - **FX5** Dashboard: `/dashboard` success → live values + "Live from Xero" stamp, no "illustrative" footer; failure → fallback figures + footer retained.
> - **FX6** Assistant: "Check my VAT" renders `/vat-check` rates with flag-not-advice wording.
> - **FX7** AuditTrail: renders `attach-source` and `history-note` rows.
> - **FX8** `/status` fetch uses path param `/status/{hash}` (regression for query-param bug).

References: [04-FRONTEND-SPEC.md](04-FRONTEND-SPEC.md), [03-API-SPEC.md](03-API-SPEC.md), [06-FRONTEND-IMPLEMENTATION-PLAN.md](06-FRONTEND-IMPLEMENTATION-PLAN.md).

---

## Test Stack

| Tool | Purpose |
|---|---|
| Vitest | Test runner (Vite-native, fast) |
| React Testing Library | Component rendering and user interaction |
| `@testing-library/user-event` | Realistic user events (click, type, drop) |
| MSW (Mock Service Worker) | API mocking at the network level |
| jsdom | DOM environment for unit/component tests |

Add to `frontend/package.json` devDependencies:

```json
{
  "vitest": "^3.0.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "msw": "^2.7.0",
  "jsdom": "^26.0.0"
}
```

---

## Test Tiers

```
┌──────────────────────────────────────────────────────────────────┐
│  TIER 1 — Component Tests (isolated, mocked data)                │
│  Each component renders correctly with various prop combinations │
│  Run: vitest run tests/components/  (~instant, every commit)     │
├──────────────────────────────────────────────────────────────────┤
│  TIER 2 — Hook & Integration Tests (MSW-mocked API)             │
│  usePayoutBridge hook, App.tsx state machine, full page flows    │
│  Run: vitest run tests/integration/  (~seconds, every commit)    │
├──────────────────────────────────────────────────────────────────┤
│  TIER 3 — Visual & Manual Tests (real browser, real backend)     │
│  Projector check, responsive, keyboard, colour-blind             │
│  Run: manual checklist (pre-demo)                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## TIER 1 — Component Tests

Each component tested in isolation with mock props. No API calls, no hook wiring, no other components. Uses React Testing Library's `render` + queries.

### 1.1 `FileUpload` (`tests/components/FileUpload.test.tsx`)

Aligns with: Track A, step A1.

| ID | Test | Action | Assertion |
|---|---|---|---|
| FU1 | Renders drop zone | Render with defaults | Drop zone visible with "Drag & drop" text |
| FU2 | File picker triggers on click | Click the drop zone | Hidden file input `click` event fires |
| FU3 | Valid CSV calls callback | Simulate drop of a `.csv` file | `onFileSelected` called with the `File` object |
| FU4 | Non-CSV rejected | Simulate drop of `.txt` file | `onFileSelected` NOT called, error text appears |
| FU5 | Disabled state | Render with `disabled=true` | Drop zone has reduced opacity, drop events ignored |
| FU6 | Error message displayed | Render with `error="Parse failed"` | Error text visible in red |
| FU7 | Drag-over visual feedback | Simulate `dragEnter` event | Border colour changes to accent blue |
| FU8 | Drag-leave resets visual | Simulate `dragEnter` then `dragLeave` | Border colour resets |

### 1.2 `ApprovalDrawer` (`tests/components/ApprovalDrawer.test.tsx`)

Aligns with: Track A, step A2.

| ID | Test | Action | Assertion |
|---|---|---|---|
| AD1 | Renders payout summary | Render with mock payout | Gross `£1,340.00`, commission `£445.90`, fees `£47.10`, net `£847.00` visible |
| AD2 | Renders all amounts with `£` prefix | Render with mock payout | All monetary values start with `£` |
| AD3 | Booking detail collapsed by default | Render with mock payout | Booking table not visible, "View 9 bookings" text present |
| AD4 | Booking detail expands on click | Click "View 9 bookings" | Booking table visible with 9 rows |
| AD5 | Checklist shows 3 items | Render with mock plan | Three "What Xero will do" items visible |
| AD6 | Checklist amounts interpolated | Render with mock payout/plan | Checklist items contain `£1,340.00`, `£445.90`, `£47.10`, `£847.00` |
| AD7 | Approve button enabled when idle | Render with `disabled=false` | Button clickable, green background |
| AD8 | Approve button calls callback | Click "Approve & Post to Xero" | `onApprove` called once |
| AD9 | Approve button disabled state | Render with `disabled=true` | Button has `opacity-50`, click does nothing |
| AD10 | Amounts use tabular numerals | Render with mock payout | Amount elements have `font-variant-numeric: tabular-nums` (via class check or computed style) |

### 1.3 `ClearingReconciliation` (`tests/components/ClearingReconciliation.test.tsx`)

Aligns with: Track B, step B1.

| ID | Test | Action | Assertion |
|---|---|---|---|
| CR1 | Renders equation | Render with mock amounts | Text contains `£1,340`, `£493`, `£847` |
| CR2 | Verified: green check | Render with `verified=true`, `clearingBalance="0.00"` | `£0.00` visible with green styling, checkmark icon present |
| CR3 | Not verified: red warning | Render with `verified=false`, `clearingBalance="0.01"` | `£0.01` visible with red/error styling |
| CR4 | `£0.00` is prominent | Render verified | Element containing `£0.00` has font-size >= 32px |
| CR5 | Entrance animation class | Render verified | Container has animation CSS class on mount |

### 1.4 `PnLComparison` (`tests/components/PnLComparison.test.tsx`)

Aligns with: Track B, step B2.

| ID | Test | Action | Assertion |
|---|---|---|---|
| PL1 | Renders BEFORE card | Render with mock before/after | "BEFORE" heading visible, revenue `£847.00` |
| PL2 | Renders AFTER card | Render with mock before/after | "AFTER" heading visible, revenue `£1,340.00` |
| PL3 | Revenue delta shown | Render with mock data | `+£493.00` or equivalent delta indicator visible in green |
| PL4 | Commission line marked NEW | Render with mock data | "NEW" badge or indicator next to commission expense |
| PL5 | Net profit unchanged | Render with mock data | Both cards show `£847.00` net profit |
| PL6 | Null `after` shows placeholder | Render with `after=null` | "Awaiting data..." text visible in AFTER position |
| PL7 | Null `before` shows placeholder | Render with `before=null` | "Awaiting data..." text visible in BEFORE position |
| PL8 | BEFORE card is muted | Render with mock data | BEFORE card has reduced opacity or muted styling |

### 1.5 `StepProgress` (`tests/components/StepProgress.test.tsx`)

Aligns with: Track C, step C1.

| ID | Test | Action | Assertion |
|---|---|---|---|
| SP1 | Renders 3 step indicators | Render with `totalSteps=3`, empty results | 3 step circles visible, all grey/pending |
| SP2 | 0 completed: all pending | Render with `results=[]` | All steps grey, no checkmarks |
| SP3 | 1 completed: first green | Render with `results=[step1]` | Step 1 green with tick, step 2 blue/spinner, step 3 grey |
| SP4 | 2 completed | Render with `results=[step1, step2]` | Steps 1-2 green, step 3 active |
| SP5 | All completed | Render with `results=[step1, step2, step3]` | All green with ticks, header says "Posted to Xero" |
| SP6 | Labels correct | Render | Labels read "Invoice", "Fees", "Payment" |
| SP7 | Active spinner | Render with 1 result, `isActive=true` | In-progress step has animated spinner |
| SP8 | Inactive: no spinner | Render with 1 result, `isActive=false` | No spinning animation |
| SP9 | Connector lines reflect state | Render with 1 result | First connector green/solid, second grey/dashed |

### 1.6 `AuditTrail` (`tests/components/AuditTrail.test.tsx`)

Aligns with: Track C, step C2.

| ID | Test | Action | Assertion |
|---|---|---|---|
| AT1 | Renders collapsed by default | Render with `defaultOpen=false` | "Transaction Trace" heading visible, table NOT visible |
| AT2 | Expands on click | Click heading | Table becomes visible with entries |
| AT3 | Renders 3 entries | Render expanded with 3 mock entries | 3 table rows visible |
| AT4 | Timestamp formatted | Render with ISO timestamp | Displays as `HH:MM:SS` |
| AT5 | Action in code badge | Render | Action text has code-style background |
| AT6 | Xero ID in monospace | Render | ID elements have monospace font |
| AT7 | Status tick icon | Render with `status="success"` | Green tick icon visible |
| AT8 | Status cross icon | Render with `status="error"` | Red cross icon visible |
| AT9 | Empty state | Render with `entries=[]` | "No audit entries yet." text visible |
| AT10 | Respects `defaultOpen=true` | Render with `defaultOpen=true` | Table visible on mount without clicking |

### 1.7 `IdempotencyBanner` (`tests/components/IdempotencyBanner.test.tsx`)

Aligns with: Track C, step C3.

| ID | Test | Action | Assertion |
|---|---|---|---|
| IB1 | Renders amber banner | Render with mock IDs | Amber-coloured banner visible |
| IB2 | Shows message text | Render | "Already posted — skipped (idempotent)" text visible |
| IB3 | Displays all Xero IDs | Render with mock IDs | `INV-0042`, `BT-0117`, `PMT-0089` all visible |
| IB4 | IDs in monospace | Render | ID text elements have monospace font |
| IB5 | Reset link present | Render | "Upload a different file" link visible |
| IB6 | Reset calls callback | Click "Upload a different file" | `onReset` called once |

---

## TIER 2 — Hook & Integration Tests

Tests the `usePayoutBridge` hook and the full `App.tsx` page wiring. API calls are intercepted by MSW (Mock Service Worker) so no real backend is needed.

### 2.1 MSW Setup (`tests/mocks/handlers.ts`)

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // POST /propose — new file
  http.post("/propose", async ({ request }) => {
    return HttpResponse.json({
      status: "new",
      file_hash: "abc123",
      payout: { /* mock golden payout */ },
      plan: { /* mock 3-step plan */ },
      existing_ids: null,
    });
  }),

  // POST /approve — success
  http.post("/approve", async () => {
    return HttpResponse.json({
      file_hash: "abc123",
      results: [
        { step: 1, kind: "create-invoice", xero_id: "INV-0042", status: "success" },
        { step: 2, kind: "create-bank-transaction", xero_id: "BT-0117", status: "success" },
        { step: 3, kind: "create-payment", xero_id: "PMT-0089", status: "success" },
      ],
      clearing_balance: "0.00",
      verified: true,
    });
  }),

  // GET /pnl
  http.get("/pnl", () => {
    return HttpResponse.json({
      before: { revenue: "847.00", commission_expense: null, other_expenses: null, net_profit: "847.00" },
      after: { revenue: "1340.00", commission_expense: "493.00", other_expenses: null, net_profit: "847.00" },
    });
  }),

  // GET /status/:hash
  http.get("/status/:hash", () => {
    return HttpResponse.json({ /* mock status */ });
  }),

  // GET /health
  http.get("/health", () => {
    return HttpResponse.json({ status: "ok", xero_connected: true, organisation: "Demo Company (UK)" });
  }),
];
```

Override individual handlers per test to simulate error scenarios.

### 2.2 `usePayoutBridge` Hook (`tests/hooks/usePayoutBridge.test.ts`)

Aligns with: Foundation, step F3.

| ID | Test | Action | Assertion |
|---|---|---|---|
| HK1 | Initial state | Instantiate hook | `phase="idle"`, `proposal=null`, `approval=null`, `pnl=null`, `error=null` |
| HK2 | `uploadFile` transitions to `proposed` | Call `uploadFile(csvFile)` | Phase transitions: `idle` -> `uploading` -> `proposed`. `proposal` populated. |
| HK3 | `uploadFile` with already-posted | Override MSW to return `already-posted` | Phase -> `idempotent`. `proposal.existing_ids` populated. |
| HK4 | `uploadFile` with server error | Override MSW to return 400 | Phase -> `error`. `error` message set. |
| HK5 | `approve` transitions to `verified` | After `uploadFile`, call `approve()` | Phase: `proposed` -> `approving` -> `verified`. `approval` populated. |
| HK6 | `approve` fetches P&L | After `approve` completes | `pnl` populated with before/after snapshots |
| HK7 | `approve` with Xero failure | Override MSW to return 503 | Phase -> `partial_error`. `error` message set. Partial results available. |
| HK8 | `reset` clears all state | After `verified`, call `reset()` | Phase -> `idle`. All state nulled. |
| HK9 | `fetchPnl` standalone | Call `fetchPnl()` | `pnl` populated |
| HK10 | Concurrent upload prevention | Call `uploadFile` while already uploading | Second call is a no-op or throws |

### 2.3 `App.tsx` State Machine (`tests/integration/App.test.tsx`)

Aligns with: Integration phase. Full-page render with MSW-mocked API.

| ID | Test | Action | Assertion |
|---|---|---|---|
| SM1 | Idle: only FileUpload visible | Render `<App />` | Drop zone visible. No ApprovalDrawer, no ClearingReconciliation. |
| SM2 | Upload -> Proposed | Drop a CSV file | ApprovalDrawer appears with payout summary and approve button |
| SM3 | Proposed -> Approving -> Verified | Click "Approve & Post to Xero" | StepProgress animates, then ClearingReconciliation appears with `£0.00 ✓` |
| SM4 | Verified: all panels visible | After approval | ClearingReconciliation, PnLComparison, and AuditTrail (collapsed) all present |
| SM5 | Duplicate upload -> Idempotent | Override MSW for already-posted, drop CSV | IdempotencyBanner appears with amber styling and Xero IDs |
| SM6 | Idempotent: reset returns to idle | Click "Upload a different file" on banner | Banner disappears, drop zone re-enabled |
| SM7 | Error: message and retry | Override MSW to return 400, drop CSV | Error message visible. Drop zone still functional for retry. |
| SM8 | Partial error: completed steps shown | Override MSW `/approve` to return 503 | StepProgress shows completed steps. Error message for failed step. |
| SM9 | P&L comparison renders after verify | After approval completes | BEFORE shows £847 revenue, AFTER shows £1,340 revenue |
| SM10 | AuditTrail toggles | After verify, click "Transaction Trace" | Audit table expands with entries |

### 2.4 Golden Path Full Flow (`tests/integration/GoldenPath.test.tsx`)

End-to-end flow through the UI with MSW, simulating exactly what happens during the live demo.

| ID | Test | Assertion |
|---|---|---|
| GP1 | Upload -> Review -> Approve -> Verify -> Audit | All phases transition correctly in sequence. Final state: ClearingReconciliation shows `£0.00 ✓`, P&L shows revenue change, audit has 3 entries. |
| GP2 | Timing: entire flow completes | From file drop to verified state in < 5 seconds (MSW responds instantly; tests UI responsiveness, not API speed). |
| GP3 | Duplicate after full flow | After GP1, drop same file -> IdempotencyBanner. |

---

## TIER 3 — Visual & Manual Tests

Cannot be automated. Run manually before the demo with a real backend. Use this as a checklist.

### 3.1 Projector Readability

| ID | Check | Pass criteria |
|---|---|---|
| VIS1 | Open page at 1280x720 | All content fits without horizontal scroll |
| VIS2 | `£0.00 ✓` readability | Legible from 5 metres away on a projector |
| VIS3 | Approve button visibility | Green button clearly visible against dark background |
| VIS4 | P&L side-by-side | Both cards visible without scrolling at 1280 width |
| VIS5 | Font sizes | Body >= 16px, amounts >= 18px, verification >= 32px |

### 3.2 Responsive

| ID | Check | Pass criteria |
|---|---|---|
| RES1 | 768px viewport | P&L cards stack vertically |
| RES2 | 480px viewport | All components remain usable, no overflow |
| RES3 | Audit table narrow | Table scrolls horizontally inside its container, page does NOT scroll horizontally |

### 3.3 Interaction

| ID | Check | Pass criteria |
|---|---|---|
| INT1 | Keyboard: tab to approve | Tab key reaches the approve button, focus ring visible |
| INT2 | Keyboard: expand audit | Enter/Space on audit disclosure toggles it |
| INT3 | Keyboard: file upload | Enter/Space on drop zone opens file picker |
| INT4 | Click outside booking detail | Expanded booking table stays open (no accidental close) |

### 3.4 Accessibility

| ID | Check | Pass criteria |
|---|---|---|
| A11Y1 | Colour-blind safe | Remove colour (greyscale browser extension): all statuses distinguishable by icon + text alone |
| A11Y2 | Screen reader | VoiceOver/NVDA can read: drop zone label, payout amounts, checklist items, approval button, verification result |
| A11Y3 | WCAG AA contrast | All text-on-background pairs pass 4.5:1 ratio (check with browser DevTools) |

### 3.5 Live Backend Flow

| ID | Check | Pass criteria |
|---|---|---|
| LIVE1 | Golden path with real backend | Upload CSV -> Approve -> £0.00 verified -> P&L correct. Total time < 30 seconds. |
| LIVE2 | Idempotent re-upload | Drop same file -> amber banner with real Xero IDs |
| LIVE3 | Backend down during approve | Stop backend mid-flow -> error state shows, completed steps preserved |
| LIVE4 | Slow network | Throttle to 3G in DevTools -> loading states visible, no UI jank |

---

## Test Directory Structure

```
frontend/
├── tests/
│   ├── setup.ts                          # Vitest setup: RTL matchers, MSW server
│   ├── mocks/
│   │   ├── handlers.ts                   # MSW default handlers (golden path)
│   │   ├── server.ts                     # MSW setupServer
│   │   └── data.ts                       # Mock payout, plan, approval, pnl, audit
│   ├── components/
│   │   ├── FileUpload.test.tsx           # FU1-FU8
│   │   ├── ApprovalDrawer.test.tsx       # AD1-AD10
│   │   ├── ClearingReconciliation.test.tsx # CR1-CR5
│   │   ├── PnLComparison.test.tsx        # PL1-PL8
│   │   ├── StepProgress.test.tsx         # SP1-SP9
│   │   ├── AuditTrail.test.tsx           # AT1-AT10
│   │   └── IdempotencyBanner.test.tsx    # IB1-IB6
│   ├── hooks/
│   │   └── usePayoutBridge.test.ts       # HK1-HK10
│   └── integration/
│       ├── App.test.tsx                  # SM1-SM10
│       └── GoldenPath.test.tsx           # GP1-GP3
├── vitest.config.ts
└── ...
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
});
```

```typescript
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
import { server } from "./mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Running Tests

```bash
# All automated tests (Tier 1 + Tier 2)
cd frontend && npx vitest run

# Component tests only (Tier 1)
npx vitest run tests/components/

# Hook + integration tests only (Tier 2)
npx vitest run tests/hooks/ tests/integration/

# Watch mode during development
npx vitest

# With coverage
npx vitest run --coverage
```

## Parallel Execution of Test Development

Tests align to the same tracks as the implementation plan:

| Worker | Tests to write | Frontend track |
|---|---|---|
| **Worker 1** | `FileUpload.test.tsx`, `ApprovalDrawer.test.tsx` | Track A |
| **Worker 2** | `ClearingReconciliation.test.tsx`, `PnLComparison.test.tsx` | Track B |
| **Worker 3** | `StepProgress.test.tsx`, `AuditTrail.test.tsx`, `IdempotencyBanner.test.tsx` | Track C |
| **Any one** | `usePayoutBridge.test.ts`, `App.test.tsx`, `GoldenPath.test.tsx` | Foundation + Integration |

Component tests (Tier 1) need only mock props — no MSW, no hook. They can be written the moment the component file exists. Hook and integration tests (Tier 2) need the MSW setup from Foundation but are independent of which components exist.
