# PayoutBridge — Backend Implementation Plan

A parallel-first plan for building the Python/FastAPI backend. Work is organised into three independent tracks that run simultaneously after a shared foundation, converging at an integration phase and finishing with a rehearsal script.

References: [02-BACKEND-SPEC.md](02-BACKEND-SPEC.md) (module specs), [03-API-SPEC.md](03-API-SPEC.md) (API contracts), [01-APP-OVERVIEW.md](01-APP-OVERVIEW.md) Section 4.1 (internal processing flow).

---

## Execution Map

```
                    ┌─────────────────────┐
                    │  FOUNDATION          │
                    │  Scaffold + Config   │
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              v              v              v
   ┌──────────────┐  ┌────────────┐  ┌────────────────┐
   │  TRACK A     │  │  TRACK B   │  │  TRACK C       │
   │  Data Layer  │  │  Xero      │  │  Read-only API │
   │              │  │  Client    │  │                │
   │  A1: Models  │  │  B1: MCP   │  │  C1: /status   │
   │  A2: Parser  │  │      client│  │  C2: /pnl      │
   │  A3: Planner │  │  B2: Seed  │  │  C3: /health   │
   │  A4: Idempt. │  │      script│  │      (upgraded)│
   │  A5: Audit   │  │            │  │                │
   │  A6: /propose│  │            │  │                │
   └──────┬───────┘  └─────┬──────┘  └───────┬────────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │
                    ┌──────v──────┐
                    │ INTEGRATION │
                    │ /approve    │
                    │ (3 writes + │
                    │  verify)    │
                    └──────┬──────┘
                           │
                    ┌──────v──────┐
                    │  FINAL      │
                    │  Rehearsal  │
                    │  script     │
                    └─────────────┘
```

Each track produces a tested, self-contained deliverable. No track depends on another until the Integration phase.

---

## FOUNDATION — Project Scaffold & Environment

**Must complete before any track starts.** Produces a runnable FastAPI shell that all three tracks build on top of.

| # | Task | Detail |
|---|---|---|
| F1 | Create directory tree | `backend/`, `state/`, `data/`, `scripts/` under the project root |
| F2 | Write `backend/requirements.txt` | `fastapi>=0.115.0`, `uvicorn>=0.34.0`, `python-dotenv>=1.1.0`, `pydantic>=2.10.0`, `xero-python>=7.0.0`, `python-multipart>=0.0.18`, `mcp>=1.0.0` |
| F3 | Write `backend/config.py` | Load `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_SCOPES` from `.env` via `python-dotenv`. Define constants: `STATE_DIR`, `DATA_DIR`, account codes (`810`, `418`), account names, contact name. Raise on missing required vars. |
| F4 | Write `.env.example` | Template with placeholder values and the default scope string |
| F5 | Write `backend/__init__.py` | Empty — makes `backend` a package |
| F6 | Write minimal `backend/main.py` | FastAPI app with CORS middleware and a stub `GET /health` returning `{"status": "ok"}`. Startup event creates empty `state/posted.json` (`{}`) and `state/audit.json` (`[]`) if missing. |
| F7 | Add `.gitignore` entries | `.env`, `state/*.json`, `__pycache__/`, `*.pyc` |

**Acceptance Check:**

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --port 8000
curl http://localhost:8000/health
# Returns: {"status": "ok"}
```

---

## TRACK A — Data Layer & `/propose` API

**What this delivers:** Everything needed to parse a CSV, build a journal plan, check idempotency, log audits, and serve `POST /propose` — all without touching Xero.

**Prerequisite:** Foundation complete.

**Xero credentials required:** No. This track is pure logic and local I/O.

### A1 — Pydantic Models (`backend/models.py`)

| # | Task | Detail |
|---|---|---|
| A1.1 | Core financial models | `BookingRow`, `CanonicalPayout` with `model_validator` asserting `gross - commission - fees - refunds == net`, `FeeLineItem`. All monetary fields use `Decimal`. |
| A1.2 | Plan models | `StepKind` enum (`create-invoice`, `create-bank-transaction`, `create-payment`), `PlanStep`, `JournalPlan` |
| A1.3 | API response models | `ProposalStatus` enum, `ProposalResponse`, `StepResult`, `ApprovalResponse`, `StatusResponse`, `PnLSnapshot`, `PnLResponse` |

**Acceptance:** `CanonicalPayout` construction with correct amounts succeeds; construction with mismatched amounts raises `ValidationError`.

### A2 — Golden CSV & Parser (`data/`, `backend/parser.py`)

| # | Task | Detail |
|---|---|---|
| A2.1 | Create golden CSV | Write `data/marketplaceco-payout-0407.csv` with the locked content (summary row + 9 booking rows). **This file is never edited again.** |
| A2.2 | Write parser | `parse_payout_csv(file_bytes: bytes) -> CanonicalPayout`. Hardcoded column map. Decode bytes, split into summary section (rows 1-2) and booking section (rows 3+). Parse summary row into `Decimal` fields, booking rows into `BookingRow` list. Return `CanonicalPayout` — invariant validator fires at construction. Raise `ValueError` on malformed input. |

**Acceptance:**

```python
data = Path("data/marketplaceco-payout-0407.csv").read_bytes()
payout = parse_payout_csv(data)
assert payout.gross == Decimal("1340.00")
assert payout.net == Decimal("847.00")
assert len(payout.bookings) == 9

# Tampered file rejects:
tampered = data.replace(b"847.00", b"846.00")
try:
    parse_payout_csv(tampered)
    assert False
except ValueError:
    pass
```

### A3 — Planner (`backend/planner.py`)

| # | Task | Detail |
|---|---|---|
| A3.1 | Write planner | `create_plan(payout: CanonicalPayout) -> JournalPlan`. Re-verify invariant (defence in depth). Build 3 `PlanStep` entries: (1) `create-invoice` for `gross` into Platform Clearing, (2) `create-bank-transaction` for `commission + fees` with two `FeeLineItem` lines, (3) `create-payment` for `net` clearing against `payout_ref`. Set `invariant_check = True`. |

**Acceptance:**

```python
plan = create_plan(payout)
assert len(plan.steps) == 3
assert plan.steps[0].amount == Decimal("1340.00")
assert plan.steps[1].amount == Decimal("493.00")
assert plan.steps[1].lines[0].amount == Decimal("445.90")
assert plan.steps[1].lines[1].amount == Decimal("47.10")
assert plan.steps[2].amount == Decimal("847.00")
```

### A4 — Idempotency (`backend/idempotency.py`)

| # | Task | Detail |
|---|---|---|
| A4.1 | `compute_file_hash(file_bytes) -> str` | sha256 hex digest |
| A4.2 | `check_already_posted(file_hash) -> dict | None` | Read `state/posted.json`, return step-map or `None` |
| A4.3 | `record_step(file_hash, step_kind, xero_id)` | Append to the step-map for this hash, write back to `posted.json`. Structure: `{hash: {invoice_id, bank_txn_id, payment_id, completed_steps: [...]}}` |
| A4.4 | `get_remaining_steps(file_hash, plan) -> list[PlanStep]` | Diff plan steps against completed steps |

**Acceptance:**

```python
h = compute_file_hash(data)
assert check_already_posted(h) is None
record_step(h, "create-invoice", "INV-TEST")
assert len(get_remaining_steps(h, plan)) == 2
```

### A5 — Audit Trail (`backend/audit.py`)

| # | Task | Detail |
|---|---|---|
| A5.1 | `append_entry(file_hash, action, request, xero_id, status)` | Read `state/audit.json`, append `{timestamp, file_hash, action, request, xero_id, status}`, write back |
| A5.2 | `get_entries(file_hash) -> list[dict]` | Filter audit entries by hash |
| A5.3 | `get_trace_panel(file_hash) -> list[dict]` | Same shape as `get_entries` — structured for the frontend Transaction Trace panel |

**Acceptance:** Append an entry, retrieve it by hash, confirm structure matches spec.

### A6 — `POST /propose` Endpoint

| # | Task | Detail |
|---|---|---|
| A6.1 | Wire endpoint in `main.py` | `POST /propose` accepting `UploadFile`. Orchestrate: `file.read()` -> `compute_file_hash()` -> `check_already_posted()`. If posted: return `ProposalResponse(status="already-posted", existing_ids=...)`. Otherwise: `parse_payout_csv()` -> `create_plan()` -> cache proposal in `app.state.proposals[hash]` and persist to `state/proposals/{hash}.json` -> return `ProposalResponse(status="new", ...)`. |
| A6.2 | Error handling | `ValueError` from parser -> 400. `ValidationError` from invariant -> 422. |
| A6.3 | File validation | Reject non-`.csv` files and files > 1MB with 400. |

**Acceptance:**

```bash
curl -X POST http://localhost:8000/propose \
  -F "file=@data/marketplaceco-payout-0407.csv"
# Returns: {"status": "new", "file_hash": "...", "payout": {...}, "plan": {...}}
# plan has 3 steps, amounts match spec
```

### Track A — Done

At this point you have a backend that can receive a CSV, parse it, plan the correction, check for duplicates, and return a full proposal. It doesn't talk to Xero — that's Track B's job. Both converge at Integration.

---

## TRACK B — Xero Client & Seed

**What this delivers:** A working `XeroClient` that can read from and write to the Demo Company, plus a seed script that prepares the Demo Company for the golden path.

**Prerequisite:** Foundation complete.

**Xero credentials required:** Yes. `.env` must have real `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET`, Custom Connection authorised against Demo Company (UK), Node.js installed for `npx`.

### B1 — Xero MCP Client (`backend/xero_client.py`)

| # | Task | Detail |
|---|---|---|
| B1.1 | Class skeleton | `XeroClient` with `async connect()` (spawn `npx -y @xeroapi/xero-mcp-server@latest` as subprocess, pass env vars, establish MCP protocol connection) and `async disconnect()` (kill subprocess). |
| B1.2 | Read methods | `list_organisation_details() -> dict`, `list_accounts() -> list[dict]`, `list_bank_transactions() -> list[dict]`, `list_profit_and_loss() -> dict`, `get_clearing_balance() -> Decimal` (filters `list-accounts` for code `810`). |
| B1.3 | Write methods | `create_invoice(contact_name, description, amount, account_code, reference) -> str` (returns Invoice ID), `create_bank_transaction(contact_name, lines, account_code, reference) -> str` (returns BankTransaction ID), `create_payment(invoice_id, amount, account_code, reference) -> str` (returns Payment ID). |
| B1.4 | Seed methods | `create_account(name, code, account_type) -> str`, `create_contact(name) -> str`, `create_receive_transaction(amount, reference, account_code) -> str`. Each checks for existence first. |
| B1.5 | Rate-limit handling | On 429: read `Retry-After`, `await asyncio.sleep()`, retry once. Second 429 raises. |
| B1.6 | FastAPI lifecycle | `lifespan` context manager in `main.py`: `connect()` on startup, `disconnect()` on shutdown. Store instance in `app.state.xero`. |

**Acceptance:**

```python
client = XeroClient()
await client.connect()
org = await client.list_organisation_details()
assert "Demo Company" in org["Name"]
accounts = await client.list_accounts()
assert len(accounts) > 0
await client.disconnect()
```

### B2 — Seed Script (`backend/seed.py`)

| # | Task | Detail |
|---|---|---|
| B2.1 | Write `seed_demo_company(client)` | (1) Check/create "Platform Clearing" account (code 810, current asset). (2) Check/create "Platform Commission & Fees" account (code 418, expense). (3) Check/create "MarketplaceCo (Marketplace)" contact. (4) Check/create RECEIVE bank transaction for £847.00, reference `MC-PAYOUT-0407`. (5) Fetch P&L, write to `state/pnl-before.json`. |
| B2.2 | CLI entry point | `if __name__ == "__main__"` block: load config, create `XeroClient`, connect, seed, disconnect. Run as `python -m backend.seed`. |
| B2.3 | Optional: `POST /seed` route | In `main.py`, gated behind `ALLOW_SEED=true` config flag. For dev convenience. |

**Acceptance:**

```bash
python -m backend.seed
# First run: creates 2 accounts, 1 contact, 1 bank txn, captures P&L.
# Verify in Xero UI: all objects exist.
# Verify: state/pnl-before.json exists.

python -m backend.seed
# Second run: creates nothing new (idempotent).
```

### Track B — Done

At this point you have a tested Xero client and a seeded Demo Company ready for the golden-path writes. The client doesn't know about CSV parsing or planning — that's Track A's job. Both converge at Integration.

---

## TRACK C — Read-only API Endpoints

**What this delivers:** The three read-only endpoints that the frontend needs for status polling, P&L display, and health checking. These read from `state/` files and Xero (health only), with no dependency on the proposal or approval flows.

**Prerequisite:** Foundation complete.

**Xero credentials required:** Only for the upgraded `/health` endpoint (B1.6 must be wired for the live check; stub it until Integration if Track B isn't done yet).

### C1 — `GET /status/{file_hash}`

| # | Task | Detail |
|---|---|---|
| C1.1 | Wire endpoint in `main.py` | Read `state/posted.json` for the step-map, read `state/audit.json` for matching entries. Return `StatusResponse`. Return 404 if hash not found in either file. |

**Acceptance:**

```bash
# Manually seed state/posted.json with a test entry, then:
curl http://localhost:8000/status/<test_hash>
# Returns: completed_steps, IDs, audit_entries
```

### C2 — `GET /pnl`

| # | Task | Detail |
|---|---|---|
| C2.1 | Wire endpoint in `main.py` | Read `state/pnl-before.json` and `state/pnl-after.json`. Return `PnLResponse`. `after` is `null` if file missing. Return 404 if neither file exists. |

**Acceptance:**

```bash
# After seed has run (state/pnl-before.json exists):
curl http://localhost:8000/pnl
# Returns: {"before": {...}, "after": null}
```

### C3 — Upgraded `GET /health`

| # | Task | Detail |
|---|---|---|
| C3.1 | Upgrade health endpoint | If `app.state.xero` exists (Track B lifecycle wired), call `list_organisation_details()`. Return `{"status": "ok", "xero_connected": true, "organisation": "Demo Company (UK)"}`. On failure or if client not yet available: return `{"status": "degraded", "xero_connected": false, "organisation": null}`. |

**Acceptance:**

```bash
curl http://localhost:8000/health
# With Xero: {"status": "ok", "xero_connected": true, "organisation": "..."}
# Without:   {"status": "degraded", "xero_connected": false, ...}
```

### Track C — Done

These endpoints work immediately once state files exist. They'll serve real data as soon as Integration populates those files through the `/approve` flow.

---

## INTEGRATION — `/approve` Endpoint

**Prerequisite:** Tracks A, B, and C all complete. This is where they merge.

**What this delivers:** The single most critical endpoint — `POST /approve` — which orchestrates Track A's planner/idempotency/audit with Track B's Xero client to execute the 3 golden-path writes, verify the result, and populate the state files that Track C's endpoints serve.

### Steps

| # | Task | Detail |
|---|---|---|
| I1 | Wire `POST /approve` in `main.py` | Accept `{"file_hash": "..."}`. Retrieve the cached proposal from `app.state.proposals` or `state/proposals/{hash}.json`. Return 404 if not found. |
| I2 | Check for completed run | Call `check_already_posted(file_hash)`. If all 3 steps complete, return 409 with existing IDs. |
| I3 | Build remaining-steps list | Call `get_remaining_steps(file_hash, plan)` to handle crash recovery (skip already-completed writes). |
| I4 | Sequential execution loop | For each remaining step: |
|    |                          | **(a)** Dispatch to the correct `XeroClient` method based on `step.kind`: |
|    |                          | `create-invoice` -> `client.create_invoice(contact, description, step.amount, account_code, payout.payout_ref)` |
|    |                          | `create-bank-transaction` -> `client.create_bank_transaction(contact, step.lines, account_code, payout.payout_ref)` |
|    |                          | `create-payment` -> `client.create_payment(invoice_id_from_step_1, step.amount, account_code, payout.payout_ref)` |
|    |                          | **(b)** Call `audit.append_entry()` with the returned Xero ID |
|    |                          | **(c)** Call `idempotency.record_step()` to persist completion |
|    |                          | **(d)** Build a `StepResult` and append to the results list |
| I5 | Verification read | Call `client.get_clearing_balance()`. Set `verified = (balance == Decimal("0.00"))`. |
| I6 | P&L AFTER snapshot | Call `client.list_profit_and_loss()`, write to `state/pnl-after.json`. |
| I7 | Return response | `ApprovalResponse` with all step results, `clearing_balance`, `verified` flag. |
| I8 | Error handling | Xero write fails mid-sequence: audit-log the error, return partial result with HTTP 503. The failed step is NOT recorded in `posted.json`, so the next `/approve` call retries from that step. |

### Cross-step data flow

The `create-payment` step (step 3) needs the `invoice_id` returned by step 1. Handle this by:
- If step 1 ran in this execution: use the `xero_id` from its `StepResult`.
- If step 1 was completed in a prior run (crash recovery): read `invoice_id` from `posted.json`.

### Acceptance Check

```bash
# 1. Propose
curl -s -X POST http://localhost:8000/propose \
  -F "file=@data/marketplaceco-payout-0407.csv" | python -m json.tool

# 2. Approve
curl -s -X POST http://localhost:8000/approve \
  -H "Content-Type: application/json" \
  -d '{"file_hash": "<hash>"}' | python -m json.tool
# Returns: 3 results, all "success", clearing_balance "0.00", verified true

# 3. Verify in Xero UI:
#    - Invoice for £1,340.00, bank transaction for £493.00, payment for £847.00
#    - Platform Clearing = £0.00

# 4. Verify state files:
#    - state/posted.json: hash with all 3 IDs
#    - state/audit.json: 3 entries with Xero IDs
#    - state/pnl-after.json: exists with updated revenue

# 5. Read-only endpoints now serve real data:
curl http://localhost:8000/status/<hash>    # steps, IDs, audit
curl http://localhost:8000/pnl              # before/after P&L
curl http://localhost:8000/health           # xero_connected: true

# 6. Re-approve (idempotent):
curl -s -X POST http://localhost:8000/approve \
  -H "Content-Type: application/json" \
  -d '{"file_hash": "<same_hash>"}'
# Returns: 409 "All steps already completed"

# 7. Re-propose (idempotent):
curl -s -X POST http://localhost:8000/propose \
  -F "file=@data/marketplaceco-payout-0407.csv"
# Returns: {"status": "already-posted", "existing_ids": {...}}
```

---

## FINAL — Reset & Rehearsal Script

**Prerequisite:** Integration complete.

**What this delivers:** A one-command end-to-end validation of the entire golden path — used for demo rehearsal and the final pre-pitch sanity check.

### Steps

| # | Task | Detail |
|---|---|---|
| R1 | Write `scripts/reset_rehearsal.py` | Uses `httpx` to call the running server. Sequence: |
|    |                                    | **(1)** Delete `state/posted.json`, `state/audit.json`, `state/pnl-after.json` |
|    |                                    | **(2)** Call seed (via `POST /seed` or direct import) to re-seed and recapture `pnl-before.json` |
|    |                                    | **(3)** `POST /propose` with the golden CSV — assert `status == "new"` |
|    |                                    | **(4)** `POST /approve` with the returned hash — assert 3 successes, `verified == true` |
|    |                                    | **(5)** `GET /status/{hash}` — assert 3 completed steps |
|    |                                    | **(6)** `GET /pnl` — assert `after.revenue == "1340.00"` |
|    |                                    | **(7)** `POST /propose` again — assert `status == "already-posted"` |
|    |                                    | Print pass/fail for each check. |
| R2 | Add `httpx` to requirements | Append `httpx>=0.28.0` to `backend/requirements.txt` |

### Acceptance Check

```bash
python scripts/reset_rehearsal.py
# [1/7] Reset state files .............. OK
# [2/7] Seed Demo Company .............. OK
# [3/7] Propose golden CSV ............. OK (status: new)
# [4/7] Approve ........................ OK (3/3 writes, verified)
# [5/7] Status check ................... OK (3 steps complete)
# [6/7] P&L check ...................... OK (revenue 847 -> 1340)
# [7/7] Idempotency check .............. OK (already-posted)
```

---

## Parallel Execution Timeline

```
Time ──────────────────────────────────────────────────────────────────>

          FOUNDATION
          [F1-F7]
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
             │  TRACK A (no Xero needed)      TRACK B          │  TRACK C
             │                                (needs creds)    │  (no Xero needed)
             │                                                 │
             │  [A1] Models                   [B1] Xero client │  [C1] /status
             │    │                             │               │  [C2] /pnl
             │    v                             v               │  [C3] /health stub
             │  [A2] Parser + CSV             [B2] Seed script │
             │    │                                            │
             │    v                                            │
             │  [A3] Planner                                   │
             │    │                                            │
             │    v                                            │
             │  [A4] Idempotency                               │
             │    │                                            │
             │    v                                            │
             │  [A5] Audit                                     │
             │    │                                            │
             │    v                                            │
             │  [A6] /propose                                  │
             │                                                 │
             └──────────────────┬──────────────────────────────┘
                                │
                         INTEGRATION
                         [I1-I8] /approve
                                │
                                v
                            FINAL
                         [R1-R2] Rehearsal
```

### Who can work on what, when

| Worker | Starts after | Works on | Delivers |
|---|---|---|---|
| **Worker 1** | Foundation | Track A (A1 -> A2 -> A3 -> A4 -> A5 -> A6) | `models.py`, `parser.py`, `planner.py`, `idempotency.py`, `audit.py`, `POST /propose` |
| **Worker 2** | Foundation + Xero credentials | Track B (B1 -> B2) | `xero_client.py`, `seed.py` |
| **Worker 3** | Foundation | Track C (C1, C2, C3) | `GET /status`, `GET /pnl`, `GET /health` |
| **Any one** | Tracks A + B + C done | Integration (I1 -> I8) | `POST /approve` |
| **Any one** | Integration done | Final (R1 -> R2) | `reset_rehearsal.py` |

Track C is small enough that Worker 1 or Worker 3 can absorb it — the three-worker split is the maximum useful parallelism. A two-worker split assigns Track A to one and Tracks B+C to the other.

### Key Interfaces Between Tracks

The tracks are independent because they agree on shared contracts. These must not drift:

| Interface | Defined in | Consumed by |
|---|---|---|
| `CanonicalPayout`, `JournalPlan`, `PlanStep` models | Track A (`models.py`) | Integration (`/approve` dispatches plan steps to Xero client) |
| `XeroClient` method signatures | Track B (`xero_client.py`) | Integration (`/approve` calls write methods) |
| `state/posted.json` structure | Track A (`idempotency.py`) | Track C (`/status` reads it) |
| `state/audit.json` structure | Track A (`audit.py`) | Track C (`/status` reads it) |
| `state/pnl-before.json`, `state/pnl-after.json` structure | Track B (seed writes before), Integration (approve writes after) | Track C (`/pnl` reads both) |
| `app.state.proposals` cache | Track A (`/propose` writes) | Integration (`/approve` reads) |
| `app.state.xero` client instance | Track B (lifecycle) | Integration + Track C (`/health`) |

### File Ownership (no merge conflicts)

| File | Track |
|---|---|
| `backend/models.py` | A |
| `backend/parser.py` | A |
| `backend/planner.py` | A |
| `backend/idempotency.py` | A |
| `backend/audit.py` | A |
| `backend/xero_client.py` | B |
| `backend/seed.py` | B |
| `backend/config.py` | Foundation (shared, read-only after) |
| `backend/main.py` | Foundation skeleton; A adds `/propose`, B adds lifecycle + `/seed`, C adds `/status` `/pnl` `/health`, Integration adds `/approve`. **Merge point — coordinate or use a router-per-track pattern.** |
| `data/marketplaceco-payout-0407.csv` | A |
| `scripts/reset_rehearsal.py` | Final |

To avoid conflicts on `main.py`, each track can define its routes in a separate `APIRouter`:

```
backend/routes/propose.py    # Track A
backend/routes/xero.py       # Track B (/seed)
backend/routes/readonly.py   # Track C (/status, /pnl, /health)
backend/routes/approve.py    # Integration
backend/main.py              # Foundation: mounts all routers
```
