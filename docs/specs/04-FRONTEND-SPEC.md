# PayoutBridge — Frontend Specification

## 1. Overview

The PayoutBridge frontend is a single-page React application that provides the human-in-the-loop approval interface. It communicates with the Python backend API and is the primary visual surface for the demo pitch.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Framework | React 18+ |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Language | TypeScript |
| HTTP client | fetch (native) |
| State management | React hooks (useState/useReducer) |

## 3. Design System

### 3.1 Theme

- **Light professional theme is the default** — clean white canvas, financial-grade
- **Dark theme available via a header toggle** — optimised for projector visibility during the live pitch
- Toggle: sun/moon button top-right of the header; Tailwind class-based dark mode (`darkMode: 'class'`, `dark` class on `<html>`); choice persisted in `localStorage` (`payoutbridge-theme`), defaulting to light when unset (does not auto-follow OS)
- High-contrast text in both themes; every colour token has a light value and a `dark:` variant
- Accent colours: green for success/verification, amber for warnings (idempotency), red for errors
- Financial-grade aesthetic: clean typography, precise alignment, tabular numbers

### 3.2 Typography

- Monospace for amounts and Xero IDs (tabular numerals)
- Sans-serif for headings and body text
- All monetary amounts right-aligned in tables

### 3.3 Colour Palette

Light is the default; the dark column is the `dark:` variant applied when the toggle is on. Semantic accents step one shade darker in light mode for AA contrast on white.

| Use | Light (default) | Dark (`dark:`) | Token |
|---|---|---|---|
| Background | `#ffffff` (white) | `#0f172a` (slate-900) | `bg-primary` |
| Card background | `#f8fafc` (slate-50) | `#1e293b` (slate-800) | `bg-card` |
| Border / divider | `#e2e8f0` (slate-200) | `#334155` (slate-700) | `border` |
| Text primary | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | `text-primary` |
| Text secondary | `#475569` (slate-600) | `#94a3b8` (slate-400) | `text-secondary` |
| Success / verified | `#16a34a` (green-600) | `#22c55e` (green-500) | `text-success` |
| Warning / idempotent | `#d97706` (amber-600) | `#f59e0b` (amber-500) | `text-warning` |
| Error | `#dc2626` (red-600) | `#ef4444` (red-500) | `text-error` |
| Accent / CTA | `#2563eb` (blue-600) | `#3b82f6` (blue-500) | `bg-accent` |

## 4. Page Layout

Single page, vertically stacked panels. No routing. The page progresses through states as the user interacts.

```
┌────────────────────────────────────────────────────────┐
│  HEADER: PayoutBridge logo + tagline                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  FILE UPLOAD ZONE                                      │
│  Drag & drop or click to upload CSV                    │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  APPROVAL DRAWER (appears after upload)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Parsed Payout Summary                           │  │
│  │  Gross: £1,340.00  Commission: £445.90           │  │
│  │  Fees: £47.10      Net: £847.00                  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  "What Xero will do" — 3-item checklist          │  │
│  │  [ ] Create gross revenue invoice (£1,340.00)    │  │
│  │  [ ] Book commission & fees (£493.00)            │  │
│  │  [ ] Clear £847.00 against the bank deposit      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  [  Approve & Post to Xero  ]                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  STEP PROGRESS (appears during /approve)               │
│  Posting to Xero...  1/3 ✓  2/3 ✓  3/3 ✓             │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  CLEARING RECONCILIATION (the payoff — appears after)  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Gross £1,340 - Commission & fees £493 = Net £847│  │
│  │                                                  │  │
│  │  Platform Clearing: £0.00 ✓  (live verification) │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  P&L BEFORE / AFTER (split-screen)                     │
│  ┌───────────────────┐  ┌───────────────────┐         │
│  │  BEFORE            │  │  AFTER            │         │
│  │  Revenue: £847     │  │  Revenue: £1,340  │         │
│  │  Expenses: -       │  │  Expenses: £493   │         │
│  │  Net: £847         │  │  Net: £847        │         │
│  └───────────────────┘  └───────────────────┘         │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  AUDIT TRAIL / TRANSACTION TRACE (collapsible)         │
│  Timestamp | Action | Xero ID | Status                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## 5. Component Specifications

### 5.1 `FileUpload`

**Purpose:** Accept a CSV file via drag-and-drop or file picker. Triggers `POST /propose` on upload.

**Props:**

```typescript
interface FileUploadProps {
  onProposalReceived: (response: ProposalResponse) => void;
  onError: (error: string) => void;
  disabled: boolean;
}
```

**Behaviour:**
- Accepts `.csv` files only
- Shows a drop zone with dashed border and upload icon
- On file drop/select, immediately calls `POST /propose` with the file
- Shows a loading spinner during the API call
- On success, passes the response to the parent
- On error, displays the error message inline

### 5.2 `ApprovalDrawer`

**Purpose:** Display the parsed payout summary, the 3-step plan in plain English, and the approve button. This is the human gate.

**Props:**

```typescript
interface ApprovalDrawerProps {
  payout: CanonicalPayout;
  plan: JournalPlan;
  fileHash: string;
  onApprove: () => void;
  disabled: boolean;
}
```

**Sections:**

1. **Payout Summary** — Table showing `gross`, `commission`, `fees`, `refunds`, `net` with the equation rendered visually
2. **Booking Detail** — Collapsible table of individual booking rows (client, service, amount, commission rate, commission amount)
3. **"What Xero will do"** — 3-item checklist in plain English:
   - "Create a gross revenue invoice for £1,340.00 into Platform Clearing"
   - "Book commission (£445.90) and fees (£47.10) as expenses from Platform Clearing"
   - "Clear the £847.00 net payout against your bank deposit"
4. **Approve Button** — Large green button labelled "Approve & Post to Xero"

**States:**
- `idle` — button enabled, ready to approve
- `loading` — button disabled, spinner shown
- `approved` — button replaced with success state

### 5.3 `IdempotencyBanner`

**Purpose:** Display when a duplicate file is uploaded (status = `already-posted`).

**Props:**

```typescript
interface IdempotencyBannerProps {
  existingIds: {
    invoice_id: string;
    bank_txn_id: string;
    payment_id: string;
  };
}
```

**Display:** Amber banner reading "Already posted at {timestamp} — skipped (idempotent). Xero IDs: {invoice_id}, {bank_txn_id}, {payment_id}."

### 5.4 `StepProgress`

**Purpose:** Show live progress during the `/approve` call as each Xero write completes.

**Props:**

```typescript
interface StepProgressProps {
  results: StepResult[];
  totalSteps: number;
}
```

**Display:**
- Three steps shown horizontally: "1/3", "2/3", "3/3"
- Each step transitions: pending (grey) -> in-progress (blue spinner) -> complete (green tick)
- Label under each step: "Invoice", "Fees", "Payment"

### 5.5 `ClearingReconciliation`

**Purpose:** The payoff panel. Shows the accounting equation and the live verification result. This is the most important visual in the demo.

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

**Display:**
- Large-format equation: `Gross £1,340 - Commission & fees £493 = Net £847`
- Below, prominently: "Platform Clearing: £0.00" with a green checkmark
- The `£0.00 ✓` must be visually dominant — readable from the back of the room on a projector

### 5.6 `PnLComparison`

**Purpose:** Side-by-side before/after P&L comparison from live Xero data.

**Props:**

```typescript
interface PnLComparisonProps {
  before: PnLSnapshot | null;
  after: PnLSnapshot | null;
}
```

**Display:**
- Two cards side by side: "BEFORE" (left, muted) and "AFTER" (right, highlighted)
- Key lines highlighted: Revenue changes from £847 to £1,340; a new "Commission & Fees" expense line of £493 appears
- Net profit stays the same (£847) — demonstrating that the correction doesn't change cash, just corrects reporting

### 5.7 `AuditTrail`

**Purpose:** Collapsible table showing the full audit trail for the current file.

**Props:**

```typescript
interface AuditTrailProps {
  entries: AuditEntry[];
}
```

**Display:**
- Collapsible (default collapsed during pitch, expanded for the architecture beat)
- Table columns: Timestamp | Action | Request Summary | Xero ID | Status
- Each row shows the CSV row -> planned action -> Xero ID -> green tick mapping
- Status uses colour coding: green tick for success, red cross for error

## 6. TypeScript Types

```typescript
interface BookingRow {
  date: string;
  client: string;
  client_type: "New" | "Repeat";
  service: string;
  gross_amount: string;
  commission_rate: string;
  commission: string;
}

interface CanonicalPayout {
  payout_ref: string;
  period: string;
  gross: string;
  commission: string;
  fees: string;
  refunds: string;
  net: string;
  bookings: BookingRow[];
}

interface FeeLineItem {
  description: string;
  amount: string;
}

interface PlanStep {
  kind: "create-invoice" | "create-bank-transaction" | "create-payment";
  amount: string;
  account: string | null;
  lines: FeeLineItem[] | null;
  clears: string | null;
}

interface JournalPlan {
  steps: PlanStep[];
  invariant_check: boolean;
}

interface ProposalResponse {
  status: "new" | "already-posted";
  file_hash: string;
  payout: CanonicalPayout;
  plan: JournalPlan | null;
  existing_ids: {
    invoice_id: string;
    bank_txn_id: string;
    payment_id: string;
    completed_steps: string[];
  } | null;
}

interface StepResult {
  step: number;
  kind: string;
  xero_id: string;
  status: "success" | "error";
}

interface ApprovalResponse {
  file_hash: string;
  results: StepResult[];
  clearing_balance: string;
  verified: boolean;
}

interface PnLSnapshot {
  revenue: string;
  commission_expense: string | null;
  other_expenses: Record<string, string> | null;
  net_profit: string;
}

interface PnLResponse {
  before: PnLSnapshot | null;
  after: PnLSnapshot | null;
}

interface AuditEntry {
  timestamp: string;
  file_hash: string;
  action: string;
  request: Record<string, unknown>;
  xero_id: string | null;
  status: string;
}

interface StatusResponse {
  file_hash: string;
  completed_steps: string[];
  invoice_id: string | null;
  bank_txn_id: string | null;
  payment_id: string | null;
  clearing_balance: string | null;
  audit_entries: AuditEntry[];
}
```

## 7. Application State Machine

The UI progresses through a linear state machine:

```
IDLE
  │
  │  user uploads CSV
  v
UPLOADING
  │
  ├── parse error ──> ERROR (show message, allow retry)
  │
  ├── already-posted ──> IDEMPOTENT (show banner with existing IDs)
  │
  v
PROPOSED
  │  Approval Drawer visible
  │
  │  user clicks "Approve & Post to Xero"
  v
APPROVING
  │  StepProgress animating: 1/3 -> 2/3 -> 3/3
  │
  ├── Xero error ──> PARTIAL_ERROR (show completed steps + error)
  │
  v
VERIFIED
  │  ClearingReconciliation visible: £0.00 ✓
  │  PnLComparison visible
  │  AuditTrail available
  │
  │  user uploads another file
  v
IDLE (reset)
```

## 8. API Integration

### 8.1 `usePayoutBridge` Hook

Central hook managing all API calls and UI state.

```typescript
function usePayoutBridge() {
  // State
  const [phase, setPhase] = useState<Phase>("idle");
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [approval, setApproval] = useState<ApprovalResponse | null>(null);
  const [pnl, setPnl] = useState<PnLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Actions
  async function uploadFile(file: File): Promise<void>;
  async function approve(): Promise<void>;
  async function fetchPnl(): Promise<void>;
  function reset(): void;

  return { phase, proposal, approval, pnl, error, uploadFile, approve, fetchPnl, reset };
}
```

### 8.2 API Base URL

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
```

### 8.3 Monetary Display

All monetary amounts from the API are strings (e.g. `"1340.00"`). The frontend displays them as-is, prepended with `£`. No client-side arithmetic on money values.

## 9. Responsive Behaviour

- Primary target: laptop screen (1280x720+) on a projector
- The P&L split-screen stacks vertically on screens narrower than 768px
- All text and numbers must be readable at projector scale (minimum 16px body, 24px+ for the £0.00 verification)
- The ClearingReconciliation `£0.00 ✓` should render at 32px+ font size

## 10. Accessibility

- All interactive elements keyboard-navigable
- Approve button has clear focus state
- Colour is never the sole indicator of status (always paired with text/icon)
- High contrast meets WCAG AA in both themes (dark text on white by default, light text on `#0f172a` when the dark toggle is on)

## 11. Development

```bash
# Install dependencies
cd frontend
npm install

# Start dev server (proxies API to localhost:8000)
npm run dev

# Build for production
npm run build
```

### 11.1 Vite Proxy Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/propose": "http://localhost:8000",
      "/approve": "http://localhost:8000",
      "/status": "http://localhost:8000",
      "/pnl": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
```
