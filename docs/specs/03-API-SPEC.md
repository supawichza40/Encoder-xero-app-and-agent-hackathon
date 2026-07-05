# PayoutBridge — API Specification

## 1. Overview

The PayoutBridge backend exposes a REST API consumed by the React frontend and the Make automation scenario. The API is served by FastAPI on `http://localhost:8000`.

**Base URL:** `http://localhost:8000`

**Content types:**
- Requests: `multipart/form-data` (file upload) or `application/json`
- Responses: `application/json`

## 2. Endpoints

### 2.1 `POST /propose` — Parse & Plan

Upload a marketplace payout CSV. Returns a parsed payout summary, a journal plan, and an idempotency status.

**Request:**

```
POST /propose
Content-Type: multipart/form-data

file: <CSV file>
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File (CSV) | Yes | Marketplace payout settlement statement |

**Response (200 — new file):**

```json
{
  "status": "new",
  "file_hash": "a1b2c3d4e5f6...",
  "payout": {
    "payout_ref": "MC-PAYOUT-0407",
    "period": "16-30 Jun 2026",
    "gross": "1340.00",
    "commission": "445.90",
    "fees": "47.10",
    "refunds": "0.00",
    "net": "847.00",
    "bookings": [
      {
        "date": "2026-06-17",
        "client": "Client A",
        "client_type": "New",
        "service": "Cut & Colour",
        "gross_amount": "180.00",
        "commission_rate": "35%",
        "commission": "63.00"
      }
    ]
  },
  "plan": {
    "steps": [
      {
        "kind": "create-invoice",
        "amount": "1340.00",
        "account": "Platform Clearing",
        "lines": null,
        "clears": null
      },
      {
        "kind": "create-bank-transaction",
        "amount": "493.00",
        "account": "Platform Clearing",
        "lines": [
          { "description": "New-client commission", "amount": "445.90" },
          { "description": "Prepayment fees", "amount": "47.10" }
        ],
        "clears": null
      },
      {
        "kind": "create-payment",
        "amount": "847.00",
        "account": null,
        "lines": null,
        "clears": "MC-PAYOUT-0407"
      }
    ],
    "invariant_check": true
  },
  "existing_ids": null
}
```

> **Refund files (expansion `11` E1):** when the CSV has `Refunds > 0`, `plan.steps` contains **4 steps** — a `create-credit-note` step (amount = refunds, account = Platform Clearing) is inserted after `create-invoice`. Step `kind` enum: `create-invoice | create-credit-note | create-bank-transaction | create-payment`. Clients must render `plan.steps.length` items, not a hardcoded 3.

**Response (200 — already posted):**

```json
{
  "status": "already-posted",
  "file_hash": "a1b2c3d4e5f6...",
  "payout": { "...same as above..." },
  "plan": null,
  "existing_ids": {
    "invoice_id": "INV-0042",
    "bank_txn_id": "BT-0117",
    "payment_id": "PMT-0089",
    "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"]
  }
}
```

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | Malformed CSV or unrecognised format | `{"detail": "CSV parse error: <specific message>"}` |
| 422 | Invariant violation (amounts don't balance) | `{"detail": "Invariant violation: 1340.00 - 445.90 - 47.10 - 0.00 = 847.00, expected 846.00"}` |

---

### 2.2 `POST /approve` — Execute the Plan

Execute the 3-write journal plan against Xero for a previously proposed file. Requires the file hash from `/propose`. Returns step-by-step results and the verification read.

**Request:**

```
POST /approve
Content-Type: application/json

{
  "file_hash": "a1b2c3d4e5f6..."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file_hash` | string | Yes | sha256 hash from the `/propose` response |

**Response (200 — success):**

```json
{
  "file_hash": "a1b2c3d4e5f6...",
  "results": [
    {
      "step": 1,
      "kind": "create-invoice",
      "xero_id": "INV-0042",
      "status": "success"
    },
    {
      "step": 2,
      "kind": "create-bank-transaction",
      "xero_id": "BT-0117",
      "status": "success"
    },
    {
      "step": 3,
      "kind": "create-payment",
      "xero_id": "PMT-0089",
      "status": "success"
    }
  ],
  "clearing_balance": "0.00",
  "verified": true,
  "attachment": { "invoice_id": "INV-0042", "filename": "marketplaceco-payout-0407.csv", "status": "success" }
}
```

> `attachment` (expansion `11` E2) is optional; `"status": "failed"` never fails the approve — attachment upload is non-fatal. Refund files return 4 entries in `results` (includes `create-credit-note`). History-note writes (`11` E6) appear as `history-note` rows in the audit trail, not in this response.

**Response (200 — partial, resumed after crash):**

If some steps were already completed (from a previous interrupted run), only remaining steps are executed. The response includes all step results (previously completed ones marked with their stored Xero IDs).

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 404 | File hash not found (no prior `/propose`) | `{"detail": "No proposal found for hash: <hash>"}` |
| 409 | Already fully posted | `{"detail": "All steps already completed", "existing_ids": {...}}` |
| 503 | Xero API / MCP failure | `{"detail": "Xero write failed at step 2: <error>", "completed": [...]}` |

---

### 2.3 `GET /status/{file_hash}` — Step Map & Audit

Returns the current step-map and audit entries for a given file hash.

**Request:**

```
GET /status/{file_hash}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file_hash` | path string | Yes | sha256 hash of the uploaded file |

**Response (200):**

```json
{
  "file_hash": "a1b2c3d4e5f6...",
  "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"],
  "invoice_id": "INV-0042",
  "bank_txn_id": "BT-0117",
  "payment_id": "PMT-0089",
  "clearing_balance": "0.00",
  "audit_entries": [
    {
      "timestamp": "2026-07-04T15:30:00Z",
      "file_hash": "a1b2c3d4e5f6...",
      "action": "create-invoice",
      "request": {
        "contact": "MarketplaceCo (Marketplace)",
        "amount": "1340.00",
        "account": "Platform Clearing"
      },
      "xero_id": "INV-0042",
      "status": "success"
    },
    {
      "timestamp": "2026-07-04T15:30:01Z",
      "file_hash": "a1b2c3d4e5f6...",
      "action": "create-bank-transaction",
      "request": {
        "contact": "MarketplaceCo (Marketplace)",
        "lines": [
          { "description": "New-client commission", "amount": "445.90" },
          { "description": "Prepayment fees", "amount": "47.10" }
        ],
        "account": "Platform Clearing"
      },
      "xero_id": "BT-0117",
      "status": "success"
    },
    {
      "timestamp": "2026-07-04T15:30:02Z",
      "file_hash": "a1b2c3d4e5f6...",
      "action": "create-payment",
      "request": {
        "invoice_id": "INV-0042",
        "amount": "847.00"
      },
      "xero_id": "PMT-0089",
      "status": "success"
    }
  ]
}
```

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 404 | File hash not found | `{"detail": "No record found for hash: <hash>"}` |

---

### 2.4 `GET /pnl` — Profit & Loss Before/After

Returns the P&L snapshots captured before the seed and after the golden-path writes.

**Request:**

```
GET /pnl
```

**Response (200):**

```json
{
  "before": {
    "revenue": "847.00",
    "commission_expense": null,
    "other_expenses": {},
    "net_profit": "847.00"
  },
  "after": {
    "revenue": "1340.00",
    "commission_expense": "493.00",
    "other_expenses": {},
    "net_profit": "847.00"
  }
}
```

**Notes:**
- `before` is captured during the seed step and stored in `state/pnl-before.json`.
- `after` is captured at the end of `/approve` and stored in `state/pnl-after.json`.
- If `/approve` has not been run yet, `after` will be `null`.

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 404 | No P&L data available (seed not run) | `{"detail": "No P&L snapshots available. Run the seed first."}` |

---

### 2.5 `GET /health` — Health Check

**Request:**

```
GET /health
```

**Response (200):**

```json
{
  "status": "ok",
  "xero_connected": true,
  "organisation": "Demo Company (UK)"
}
```

**Response (503 — Xero not connected):**

```json
{
  "status": "degraded",
  "xero_connected": false,
  "organisation": null
}
```

---

### 2.6 `GET /dashboard` — Live Xero Dashboard Data *(expansion `11` E4)*

Aggregates three cached MCP reads (trial balance, aged receivables, balance sheet) plus local state, so the frontend dashboard shows real Demo Company data. Additionally surfaces persona-oriented metrics and posting run history derived from local state (`state/posted.json` + `state/audit.json`) — no extra Xero calls.

**Response (200):**

```json
{
  "trial_balance": { "clearing": "0.00", "fees_expense": "493.00", "revenue": "1340.00" },
  "aged_receivables": [ { "contact": "MarketplaceCo (Marketplace)", "outstanding": "0.00" } ],
  "balance_sheet": { "bank": "1234.00", "current_assets": "1234.00" },
  "recent_payouts": [
    {
      "file_hash": "a1b2c3d4e5f6...",
      "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"],
      "clearing_balance": "0.00"
    }
  ],
  "fetched_at": "2026-07-05T00:00:00Z",
  "source": "xero",
  "persona_metrics": {
    "fees_this_month": "493.00",
    "gross_turnover_vat_safe": "1340.00",
    "ytd_income": "1340.00",
    "ytd_deductible_fees": "493.00",
    "new_vs_repeat": {
      "new": { "count": 3, "commission": "334.43" },
      "repeat": { "count": 2, "commission": "111.47" }
    }
  },
  "run_history": [
    {
      "hash": "a1b2c3d4e5f6",
      "status": "posted",
      "payout_ref": "MC-PAYOUT-0407",
      "timestamp": "2026-07-05T08:00:00Z",
      "net": "847.00"
    }
  ]
}
```

- Reads cached 60 s in-process (rate-limit rule: never live-loop). `source` is `"xero"` on a live read, `"degraded"` when Xero is unreachable (still 200 — never 503).
- **`persona_metrics`** (additive, PayoutBridge persona use cases): computed from fully-posted statements only (all plan steps completed).
  - `fees_this_month` — commission + fees for statements posted in the current calendar month.
  - `gross_turnover_vat_safe` — rolling 12-month gross turnover (VAT-threshold-relevant), computed over the trailing 12 months from `now` (Europe/London dates) across fully-posted statements — mirrors HMRC's rolling VAT-registration-threshold monitoring, not an all-time sum.
  - `ytd_income` / `ytd_deductible_fees` — gross / (commission + fees) for statements posted within the **UK tax year to date** (6 Apr–5 Apr; a statement posted 5 Apr belongs to the prior tax year, 6 Apr belongs to the new one).
  - `new_vs_repeat` — per-booking count + commission split by `client_type` ("New" vs anything else), aggregated across all fully-posted statements.
  - `null` when no statement has been fully posted yet — the frontend must handle both `persona_metrics` and its absence.
- **`run_history`** — one entry per file hash with write activity, from `posted.json` + `audit.json`. `status` is one of `"posted"` (all plan steps completed), `"partial"` (some but not all steps completed), `"failed"` (a step errored, none completed), or `"skipped-idempotent"` (a re-upload of an already-fully-posted file — appears as a separate entry alongside that hash's `"posted"` entry). `hash` is the first 12 hex characters of the file's sha256. Sorted by `timestamp` descending. `null` when there is no posted/audit data at all.
- 503 when Xero disconnected — frontend falls back to illustrative figures and keeps the "figures are illustrative" footer; live data replaces footer with "Live from Xero · fetched HH:MM".

---

### 2.7 `GET /vat-check` — VAT Rate Consistency Read *(expansion `11` E5)*

Backs the assistant's "Check my VAT" answer with a real `list-tax-rates` read. **Flags, never advises** (spec `10` §6 guardrail).

**Response (200):**

```json
{
  "org_rates": [ { "name": "20% (VAT on Income)", "rate": "20.00" }, { "name": "No VAT", "rate": "0.00" } ],
  "golden_path_tax_type": "NONE",
  "consistent": true
}
```

---

### 2.8 `GET /audit/export?format=csv|json` — Full Audit Trail Export *(expansion `11` PRI-1)*

Exports the complete audit trail (all file hashes, not just one). Read-only, no Xero calls.

**Request:**

```
GET /audit/export?format=csv
GET /audit/export?format=json
```

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `format` | query string | No | `csv` | `"csv"` or `"json"`. Any other value (including missing/garbage) falls back to `csv` — never a 422. |

**Response (200 — `format=csv`, default):**

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="payoutbridge-audit.csv"

timestamp,action,payout_ref,xero_id,status,summary
2026-07-04T15:30:00Z,create-invoice,MC-PAYOUT-0407,INV-0042,success,"amount=1340.00, reference=MC-PAYOUT-0407"
```

- Columns exactly: `timestamp,action,payout_ref,xero_id,status,summary`. `payout_ref` is looked up via `state/proposals/<hash>.json`; empty string if the proposal is missing. `summary` is the entry's `request` dict flattened as `key=value, key=value`.
- No audit data → 200 with a header-only CSV. Never 500.

**Response (200 — `format=json`):**

```json
[
  {
    "timestamp": "2026-07-04T15:30:00Z",
    "file_hash": "a1b2c3d4e5f6...",
    "action": "create-invoice",
    "request": { "amount": "1340.00", "reference": "MC-PAYOUT-0407" },
    "xero_id": "INV-0042",
    "status": "success"
  }
]
```

- Full audit entries array, same shape as `state/audit.json` / `GET /status/{hash}`'s `audit_entries`. No audit data → 200 `[]`. Never 500.

---

### 2.9 `GET /evidence-pack/{file_hash}` — Reconciliation Evidence Pack *(expansion `11` PRI-2)*

Returns a single-document reconciliation record for a posted statement — payout reference, all created Xero object IDs, the four/five amounts, the verified clearing balance, and a generated timestamp.

**Request:**

```
GET /evidence-pack/{file_hash}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `file_hash` | path string | Yes | sha256 hash from `/propose`, of a statement that has been (at least partially) posted via `/approve` |

**Response (200):**

```json
{
  "payout_ref": "MC-PAYOUT-0407",
  "csv_sha256": "a1b2c3d4e5f6...",
  "xero_ids": {
    "invoice_id": "INV-0042",
    "bank_txn_id": "BT-0117",
    "payment_id": "PMT-0089",
    "credit_note_id": null
  },
  "amounts": { "gross": "1340.00", "commission": "445.90", "fees": "47.10", "refunds": "0.00", "net": "847.00" },
  "clearing_balance": "0.00",
  "verified": true,
  "generated_at": "2026-07-05T08:00:00Z"
}
```

- `credit_note_id` is non-null only for refund statements (4-step plan).
- `verified` is `true` only when a clearing balance was actually recorded for this hash AND it equals `"0.00"` — `false` (never an error) when the balance is nonzero or was never recorded (e.g. approve crashed before the verification read).

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 404 | Unknown hash, malformed hash (path-traversal guard), or no posted/proposal record for the hash | `{"detail": "no posted statement with that hash"}` |

---

## 3. Data Flow Diagram

```
Frontend                  Backend                          Xero (MCP)
   │                         │                                │
   │  POST /propose (CSV)    │                                │
   │────────────────────────>│                                │
   │                         │── parse CSV                    │
   │                         │── sha256 hash                  │
   │                         │── check posted.json            │
   │                         │── build JournalPlan            │
   │  { status, plan, ... }  │                                │
   │<────────────────────────│                                │
   │                         │                                │
   │  POST /approve (hash)   │                                │
   │────────────────────────>│                                │
   │                         │── check remaining steps        │
   │                         │── create-invoice ─────────────>│
   │                         │<── invoice_id ─────────────────│
   │                         │── audit.append()               │
   │                         │── create-bank-transaction ────>│
   │                         │<── bank_txn_id ────────────────│
   │                         │── audit.append()               │
   │                         │── create-payment ─────────────>│
   │                         │<── payment_id ─────────────────│
   │                         │── audit.append()               │
   │                         │── get clearing balance ───────>│
   │                         │<── £0.00 ──────────────────────│
   │                         │── list-profit-and-loss ───────>│
   │                         │<── P&L data ───────────────────│
   │                         │── save pnl-after.json          │
   │  { results, verified }  │                                │
   │<────────────────────────│                                │
   │                         │                                │
   │  GET /status/{hash}     │                                │
   │────────────────────────>│                                │
   │                         │── read posted.json             │
   │                         │── read audit.json              │
   │  { steps, audit, ... }  │                                │
   │<────────────────────────│                                │
   │                         │                                │
   │  GET /pnl               │                                │
   │────────────────────────>│                                │
   │                         │── read pnl-before.json         │
   │                         │── read pnl-after.json          │
   │  { before, after }      │                                │
   │<────────────────────────│                                │
```

## 4. Decimal Handling

All monetary amounts are serialised as JSON strings (e.g. `"1340.00"`) to avoid floating-point precision issues. The backend uses Python's `decimal.Decimal` throughout. The frontend should parse these as strings and display as-is, or use a decimal library if arithmetic is needed.

## 5. Idempotency Contract

| Scenario | `/propose` behaviour | `/approve` behaviour |
|---|---|---|
| New file, never seen | Returns `status: "new"` with plan | Executes all 3 writes |
| Same file, fully posted | Returns `status: "already-posted"` with IDs | Returns 409 with existing IDs |
| Same file, partially posted (crash recovery) | Returns `status: "new"` with plan (remaining steps only) | Executes only remaining writes |

The idempotency key is `sha256(file_bytes)`. The step-map in `posted.json` tracks which of the 3 write steps have completed, enabling crash-safe partial recovery.

## 6. CORS Configuration

```python
allow_origins = [
    "http://localhost:5173",    # Vite dev server
    "http://localhost:3000",    # Alternative dev port
]
allow_methods = ["GET", "POST"]
allow_headers = ["*"]
```

## 7. Make Integration

The Make automation scenario (`POST /propose`) uses the same API. Make sends a file attachment from Gmail/Drive. The response determines whether to notify the user (new payout) or skip (already processed). Make does NOT call `/approve` — approval always happens in the UI (human-in-the-loop).
