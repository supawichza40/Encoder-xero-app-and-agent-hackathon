# PayoutBridge — Application Specification

## 1. Product Summary

PayoutBridge converts opaque platform settlement statements into auditable, Xero-native gross-up accounting — restoring real turnover, fee visibility, and a zero-balance clearing account, with a human approving every write.

**Tagline:** "Your bank feed has been lying about your turnover."

## 2. The Problem

When a service business (e.g. a salon) earns through a marketplace platform, the platform deducts commission and fees before wiring the net payout. Xero's bank feed records only the net deposit as revenue.

**Example (synthetic demo scenario):**

| Item | Amount |
|---|---|
| Gross sales | £1,340.00 |
| New-client commission (35%) | £445.90 |
| Prepayment fees | £47.10 |
| **Net payout (what Xero sees)** | **£847.00** |

**Result:** Real turnover understated by £493, commission expense invisible, VAT trail wrong from day one, and every downstream report and tax filing inherits the error.

## 3. Solution

PayoutBridge ingests the platform's settlement statement (CSV), parses it into a canonical payout model, proposes a clearing-account gross-up in plain English, and — after human approval — posts the corrected accounting to Xero and proves it with a live zero-balance verification and before/after P&L comparison.

### The Golden Path (3 writes + verification)

| Step | Xero Operation | Amount | Purpose |
|---|---|---|---|
| 1 | `create-invoice` (ACCREC) | £1,340.00 | Record gross revenue into Platform Clearing |
| 2 | `create-bank-transaction` (SPEND) | £493.00 | Book commission (£445.90) + fees (£47.10) out of Clearing |
| 3 | `create-payment` | £847.00 | Clear £847 from Platform Clearing against the bank deposit |
| 4 | Verification read | — | Confirm Platform Clearing balance = £0.00 |
| 5 | P&L snapshot | — | Before/after comparison from live Xero data |

### The Accounting Invariant

```
gross - commission - fees - refunds === net
1340.00 - 445.90 - 47.10 - 0.00 === 847.00
```

The planner refuses to propose a journal plan if this invariant fails. The agent is structurally unable to propose books that don't balance.

## 4. User Journey

```
                        SALON OWNER / BOOKKEEPER
                                 │
                                 │  Receives marketplace settlement
                                 │  statement (CSV) via email
                                 │
                 ┌───────────────v───────────────┐
                 │  1. UPLOAD                     │
                 │  Drag & drop CSV into          │
                 │  PayoutBridge                   │
                 └───────────────┬───────────────┘
                                 │
                    ┌────────────v────────────┐
                    │  Duplicate file?         │
                    └──┬──────────────────┬───┘
                  YES  │                  │ NO
                       v                  v
        ┌──────────────────┐   ┌─────────────────────────┐
        │  IDEMPOTENT SKIP │   │  2. REVIEW               │
        │  Amber banner:   │   │  Approval Drawer shows:  │
        │  "Already posted │   │  - Payout summary        │
        │   — skipped"     │   │    (gross/comm/fees/net) │
        │  Shows Xero IDs  │   │  - Booking detail table  │
        └──────────────────┘   │  - "What Xero will do"   │
                               │    3-item plain-English   │
                               │    checklist              │
                               └────────────┬─────────────┘
                                            │
                                            │  User reads, understands,
                                            │  and clicks
                                            │  [Approve & Post to Xero]
                                            │
                 ┌──────────────────────────v──────────────────────────┐
                 │  3. APPROVE & POST                                  │
                 │                                                     │
                 │  Step 1/3 ✓  Create gross revenue invoice £1,340   │
                 │  Step 2/3 ✓  Book commission & fees £493            │
                 │  Step 3/3 ✓  Clear £847 against bank deposit        │
                 │                                                     │
                 │  Live progress bar animates as each Xero write      │
                 │  completes. Each step is audit-logged with          │
                 │  the returned Xero ID.                              │
                 └──────────────────────────┬──────────────────────────┘
                                            │
                 ┌──────────────────────────v──────────────────────────┐
                 │  4. VERIFY (the payoff)                             │
                 │                                                     │
                 │  ┌───────────────────────────────────────────────┐  │
                 │  │  Clearing Reconciliation                      │  │
                 │  │  Gross £1,340 - Comm & fees £493 = Net £847   │  │
                 │  │                                               │  │
                 │  │  Platform Clearing: £0.00 ✓                   │  │
                 │  │  (live verification read from Xero)           │  │
                 │  └───────────────────────────────────────────────┘  │
                 │                                                     │
                 │  ┌──────────────────┐  ┌──────────────────┐        │
                 │  │ P&L BEFORE       │  │ P&L AFTER        │        │
                 │  │ Revenue:  £847   │  │ Revenue: £1,340  │        │
                 │  │ Expenses: —      │  │ Expenses: £493   │        │
                 │  │ Net:      £847   │  │ Net:      £847   │        │
                 │  └──────────────────┘  └──────────────────┘        │
                 └──────────────────────────┬──────────────────────────┘
                                            │
                 ┌──────────────────────────v──────────────────────────┐
                 │  5. AUDIT (optional — expand for detail)            │
                 │                                                     │
                 │  Transaction Trace table:                           │
                 │  Timestamp | Action              | Xero ID | Status │
                 │  15:30:00  | create-invoice       | INV-042 | ✓     │
                 │  15:30:01  | create-bank-txn      | BT-117  | ✓     │
                 │  15:30:02  | create-payment       | PMT-089 | ✓     │
                 │                                                     │
                 │  Books are corrected. Upload the next statement     │
                 │  or close — the audit trail persists.               │
                 └─────────────────────────────────────────────────────┘
```

**Journey summary:** Upload (10s) -> Review (30s) -> Approve (5s) -> Verify (automatic) -> Done. One file, one click, three Xero writes, zero-balance proof.

### 4.1 Internal Processing Flow (what the app does after file upload)

The following describes every action the application takes, from the moment the user drops a CSV file to the final verified result. The user sees only the UI surfaces; everything else runs server-side.

**Phase A — Ingestion & Validation (`POST /propose`)**

| Step | Component | Action | Output |
|---|---|---|---|
| A1 | `main.py` | Receive uploaded file bytes from the multipart request | Raw `bytes` |
| A2 | `idempotency.py` | Compute `sha256(file_bytes)` to produce the file hash | `file_hash: str` |
| A3 | `idempotency.py` | Look up `file_hash` in `state/posted.json` | `None` (new) or existing step-map |
| A4 | — | **If already posted:** short-circuit — return `status: "already-posted"` with the stored Xero IDs. Frontend shows the amber idempotency banner. Flow ends here. | `ProposalResponse` |
| A5 | `parser.py` | Parse CSV using the hardcoded column map. Read the summary header row for `gross`, `commission`, `fees`, `refunds`, `net`. Read booking detail rows for the trace panel. | `CanonicalPayout` |
| A6 | `models.py` | Pydantic `model_validator` fires: assert `gross - commission - fees - refunds == net`. **If the invariant fails, reject the file with a 422 error.** The app structurally refuses to proceed with amounts that don't balance. | Validation pass/fail |
| A7 | `planner.py` | Build a `JournalPlan` with exactly 3 steps from the validated `CanonicalPayout`: (1) create-invoice for gross, (2) create-bank-transaction for fees, (3) create-payment for net. Set `invariant_check: true`. | `JournalPlan` |
| A8 | `main.py` | Return the full proposal: payout summary, journal plan, file hash, `status: "new"` | `ProposalResponse` |

> At this point the frontend renders the **Approval Drawer** — payout breakdown, plain-English checklist, and the Approve button. **No Xero writes have happened.** The app is waiting for explicit human approval.

**Phase B — Execution (`POST /approve`)**

The user clicks "Approve & Post to Xero". The frontend sends the `file_hash` to `/approve`. The backend executes each write sequentially, recording progress after every step so a crash mid-sequence is recoverable.

| Step | Component | Action | Xero Tool | Amount |
|---|---|---|---|---|
| B1 | `idempotency.py` | Check `posted.json` for any already-completed steps (crash recovery). Build the list of remaining steps. | — | — |
| B2 | `xero_client.py` | **Write 1:** Create an accounts-receivable invoice. Contact = "MarketplaceCo (Marketplace)". Line description = "Gross marketplace sales — period 16–30 Jun". Account = Platform Clearing (810). | `create-invoice` | £1,340.00 |
| B3 | `audit.py` | Append audit entry: `{action: "create-invoice", xero_id: "INV-...", status: "success"}` | — | — |
| B4 | `idempotency.py` | Record step completion in `posted.json`: `{invoice_id: "INV-..."}` | — | — |
| B5 | `xero_client.py` | **Write 2:** Create a SPEND bank transaction from Platform Clearing. Two line items: "New-client commission" £445.90 + "Prepayment fees" £47.10. | `create-bank-transaction` | £493.00 |
| B6 | `audit.py` | Append audit entry for the bank transaction | — | — |
| B7 | `idempotency.py` | Record step completion: `{bank_txn_id: "BT-..."}` | — | — |
| B8 | `xero_client.py` | **Write 3:** Create a payment that applies £847.00 from Platform Clearing against the seeded net bank deposit (reference MC-PAYOUT-0407). This zeros out the clearing account. | `create-payment` | £847.00 |
| B9 | `audit.py` | Append audit entry for the payment | — | — |
| B10 | `idempotency.py` | Record step completion: `{payment_id: "PMT-..."}`. All 3 steps now marked complete — a re-upload of the same file will return "already-posted". | — | — |

> **Crash safety:** If the process dies between B4 and B5 (for example), on the next `/approve` call step B1 finds `create-invoice` already completed, skips it, and resumes from Write 2 onward. No double-posting.

**Phase C — Verification & Snapshot**

| Step | Component | Action | Xero Tool |
|---|---|---|---|
| C1 | `xero_client.py` | **Verification read:** Query the Platform Clearing account balance from Xero. The expected result is **£0.00** — proof that the 3 writes exactly offset each other. | `list-accounts` (filtered) |
| C2 | `main.py` | Compare balance to zero. Set `verified: true` if `clearing_balance == 0.00`. | — |
| C3 | `xero_client.py` | **P&L AFTER snapshot:** Fetch the current Profit & Loss report from Xero. | `list-profit-and-loss` |
| C4 | `main.py` | Write the AFTER snapshot to `state/pnl-after.json`. | — |
| C5 | `main.py` | Return the full result: 3 step results with Xero IDs, `clearing_balance`, `verified` flag. | — |

> The frontend now renders the **Clearing Reconciliation panel** (£0.00 with a green checkmark) and the **P&L before/after split-screen** (fetched via `GET /pnl`).

**Phase D — Audit & Trace (on demand)**

| Step | Component | Action |
|---|---|---|
| D1 | `main.py` | Frontend calls `GET /status/{file_hash}` | 
| D2 | `idempotency.py` | Read the step-map from `posted.json` |
| D3 | `audit.py` | Read all audit entries for this `file_hash` from `audit.json` |
| D4 | `main.py` | Return combined status: completed steps, all Xero IDs, clearing balance, and the full audit trail shaped for the Transaction Trace panel |

> The frontend renders the **Audit Trail table** — each row maps a CSV input to the Xero write it produced, with the returned Xero ID and a status tick.

**Complete sequence diagram:**

```
User          Frontend           Backend              Xero (MCP)
 │               │                  │                     │
 │  drop CSV     │                  │                     │
 │──────────────>│                  │                     │
 │               │  POST /propose   │                     │
 │               │─────────────────>│                     │
 │               │                  │── sha256 hash       │
 │               │                  │── check posted.json │
 │               │                  │── parse CSV         │
 │               │                  │── validate invariant│
 │               │                  │── build plan        │
 │               │  proposal resp   │                     │
 │               │<─────────────────│                     │
 │               │                  │                     │
 │  review plan  │                  │                     │
 │<──────────────│                  │                     │
 │               │                  │                     │
 │  click approve│                  │                     │
 │──────────────>│                  │                     │
 │               │  POST /approve   │                     │
 │               │─────────────────>│                     │
 │               │                  │── check remaining   │
 │               │                  │                     │
 │               │                  │── create-invoice ──>│
 │               │                  │<── invoice_id ──────│
 │               │                  │── log + record      │
 │               │                  │                     │
 │               │                  │── create-bank-txn ─>│
 │               │                  │<── bank_txn_id ─────│
 │               │                  │── log + record      │
 │               │                  │                     │
 │               │                  │── create-payment ──>│
 │               │                  │<── payment_id ──────│
 │               │                  │── log + record      │
 │               │                  │                     │
 │               │                  │── get clearing bal ─>│
 │               │                  │<── £0.00 ───────────│
 │               │                  │                     │
 │               │                  │── get P&L ─────────>│
 │               │                  │<── P&L snapshot ────│
 │               │                  │── save pnl-after    │
 │               │                  │                     │
 │               │  approval resp   │                     │
 │               │<─────────────────│                     │
 │               │                  │                     │
 │  £0.00 ✓      │                  │                     │
 │  P&L diff     │                  │                     │
 │<──────────────│                  │                     │
 │               │                  │                     │
 │               │  GET /pnl        │                     │
 │               │─────────────────>│                     │
 │               │  before/after    │                     │
 │               │<─────────────────│                     │
 │               │                  │                     │
 │               │  GET /status     │                     │
 │               │─────────────────>│                     │
 │               │  audit trail     │                     │
 │               │<─────────────────│                     │
 │  audit table  │                  │                     │
 │<──────────────│                  │                     │
```

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  INGESTION                                                      │
│  CSV file upload (marketplace settlement statement)             │
│        │                                                        │
│        v                                                        │
│  Parser — deterministic column map -> canonical payout model    │
│        {gross, commission, fees, refunds, net, bookings[]}      │
└────────┬────────────────────────────────────────────────────────┘
         v
┌─────────────────────────────────────────────────────────────────┐
│  AGENT CORE (Python / FastAPI)                                  │
│  idempotency.py — sha256(file) -> posted.json step-map check   │
│  planner.py    — builds the 3-write journal plan + amounts     │
│  audit.py      — appends every action + Xero ID to audit.json  │
│  xero.py       — MCP client wrapper for reads/writes           │
└────────┬────────────────────────────────────────────────────────┘
         v
┌─────────────────────────────────────────────────────────────────┐
│  HUMAN GATE (React UI — Approval Drawer)                        │
│  Plain-English breakdown | "What Xero will do" 3-item checklist │
│  [Approve & Post to Xero] -> live progress 1/3 -> 2/3 -> 3/3   │
└────────┬────────────────────────────────────────────────────────┘
         v
┌─────────────────────────────────────────────────────────────────┐
│  XERO (via MCP server, Custom Connection, UK Demo Company)      │
│  READ  list-bank-transactions  -> locate net deposit £847       │
│  WRITE create-invoice          -> gross revenue £1,340          │
│  WRITE create-bank-transaction -> fees £493 out of Clearing     │
│  WRITE create-payment          -> £847 Clearing <-> bank deposit│
│  READ  clearing balance        -> VERIFY £0.00                  │
│  READ  list-profit-and-loss    -> AFTER snapshot                │
└────────┬────────────────────────────────────────────────────────┘
         v
   UI PAYOFF: Clearing Reconciliation panel £0.00 + P&L before/after
```

## 6. Stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend (agent core) | **Python 3.12+ / FastAPI** | Team preference; strong async support; clean Xero SDK integration |
| Xero access | `@xeroapi/xero-mcp-server` (via `npx`), Custom Connection auth | Free on Demo Company; 51 MCP tools available |
| REST fallback | Direct Xero Accounting API (via `xero-python` SDK) | Only if an MCP gap blocks the golden path |
| Frontend | **React + Vite + Tailwind CSS** | Fast scaffold; professional dark theme |
| Automation | **Make** (free tier — 1,000 ops, 2 scenarios) | Email-to-agent ingestion pipeline |
| State | Local JSON files (`posted.json`, `audit.json`, `pnl-before.json`, `pnl-after.json`) | No database for a demo; resettable |
| Secrets | `.env` (never committed): `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` | Client secret shown once at app creation |

## 7. Key Design Principles

### 7.1 Human-in-the-Loop

Every Xero write requires explicit human approval. A wrong journal is worse than none. The approval gate is the production control that the architecture criterion rewards.

### 7.2 Idempotency

- **Key:** `sha256(file_bytes)`
- **Step-map, not file-flag:** `posted.json` stores per-step completion: `{hash: {invoice_id, bank_txn_id, payment_id, completed_steps: [...]}}`. A crash after write 1 re-runs writes 2-3 only.
- **Duplicate upload:** second upload of the same file returns "Already posted — skipped (idempotent)" with the existing Xero IDs.

### 7.3 Audit Trail

`audit.json` appends `{timestamp, file_hash, action, request, xero_id, status}` for every API call. Rendered in the Transaction Trace panel: CSV row -> planned action -> Xero ID -> green tick.

### 7.4 Deterministic Parsing

No LLM schema inference on the golden path. The parser uses a hardcoded column map for the known marketplace format. Schema inference for unseen formats is roadmap only.

## 8. Xero Configuration

### 8.1 OAuth Scopes

- `accounting.transactions` (or granular: `accounting.invoices`, `accounting.banktransactions`, `accounting.payments`)
- `accounting.contacts`
- `accounting.settings`
- `accounting.reports.profitandloss.read` (or `accounting.reports.read`)

### 8.2 Rate Limits

- 60 calls/min, 5 concurrent, 5,000/day per tenant
- Golden path total <= ~10 calls — well under budget
- `Retry-After` header honoured in the MCP wrapper

### 8.3 Xero Objects Created by Seed

1. Account: **"Platform Clearing"** — type: current asset / bank-adjacent (code `810`)
2. Account: **"Platform Commission & Fees"** — type: expense (code `418`)
3. Contact: **"MarketplaceCo (Marketplace)"**
4. Bank transaction: RECEIVE £847.00, reference `MC-PAYOUT-0407`
5. P&L BEFORE snapshot captured to `state/pnl-before.json`

## 9. Data Model

### 9.1 Canonical Payout (parsed from CSV)

```
CanonicalPayout:
  payout_ref: str          # "MC-PAYOUT-0407"
  period: str              # "16-30 Jun 2026"
  gross: Decimal           # 1340.00
  commission: Decimal      # 445.90
  fees: Decimal            # 47.10
  refunds: Decimal         # 0.00
  net: Decimal             # 847.00
  bookings: list[Booking]  # trace-panel display only
```

### 9.2 Journal Plan (output of planner)

```
JournalPlan:
  steps:
    - kind: "create-invoice"
      amount: 1340.00
      account: "Platform Clearing"
    - kind: "create-bank-transaction"
      amount: 493.00
      lines:
        - desc: "New-client commission", amount: 445.90
        - desc: "Prepayment fees", amount: 47.10
    - kind: "create-payment"
      amount: 847.00
      clears: "MC-PAYOUT-0407"
  invariant_check: bool    # refuse to propose if the sum doesn't hold
```

## 10. Explicitly Out of Scope

- LLM schema inference (any, anywhere)
- Refunds / `create-credit-note`
- PDF parsing / OCR
- Tracking categories
- Multi-platform UI or recipe management
- Live marketplace API connection
- VAT splitting
- Email sending
- JAX-territory features (NL Q&A, auto-recon, categorisation)
- Delete / void operations
- Multi-client / bookkeeper views
- Forecasting

## 11. Repository Structure

```
payoutbridge/
├── .env                          # XERO_CLIENT_ID, XERO_CLIENT_SECRET (never commit)
├── backend/
│   ├── requirements.txt
│   ├── main.py                   # FastAPI application entry point
│   ├── parser.py                 # Hardcoded column map -> CanonicalPayout
│   ├── idempotency.py            # sha256 + step-map (posted.json)
│   ├── planner.py                # CanonicalPayout -> JournalPlan
│   ├── xero_client.py            # MCP client wrapper: reads, 3 writes, verification
│   ├── audit.py                  # audit.json appender + trace-panel shape
│   ├── models.py                 # Pydantic models (CanonicalPayout, JournalPlan, etc.)
│   ├── seed.py                   # Idempotent Demo Company setup + BEFORE P&L capture
│   └── config.py                 # Settings, env var loading
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ApprovalDrawer.tsx
│   │   │   ├── ClearingReconciliation.tsx
│   │   │   ├── PnLComparison.tsx
│   │   │   ├── AuditTrail.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── StepProgress.tsx
│   │   ├── hooks/
│   │   │   └── usePayoutBridge.ts
│   │   └── types/
│   │       └── index.ts
│   └── index.html
├── data/
│   └── marketplaceco-payout-0407.csv   # LOCKED golden file (synthetic demo data)
├── state/
│   ├── posted.json               # Idempotency step-map
│   ├── audit.json                # Audit trail
│   ├── pnl-before.json
│   └── pnl-after.json
└── scripts/
    └── reset_rehearsal.py        # Seed -> propose -> approve -> verify (one command)
```
