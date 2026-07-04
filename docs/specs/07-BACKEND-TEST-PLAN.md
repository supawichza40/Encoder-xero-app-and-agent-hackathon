# PayoutBridge — Backend Test Plan

Test plan for the Python/FastAPI backend, organised into the same parallel tracks as the [implementation plan](05-BACKEND-IMPLEMENTATION-PLAN.md). Each track's tests are independent and can run without the other tracks being built.

References: [02-BACKEND-SPEC.md](02-BACKEND-SPEC.md), [03-API-SPEC.md](03-API-SPEC.md), [05-BACKEND-IMPLEMENTATION-PLAN.md](05-BACKEND-IMPLEMENTATION-PLAN.md).

---

## Test Stack

| Tool | Purpose |
|---|---|
| `pytest` | Test runner |
| `pytest-asyncio` | Async test support (for XeroClient) |
| `httpx` | FastAPI `TestClient` async transport |
| `unittest.mock` / `pytest-mock` | Mocking XeroClient for offline tests |
| `tmp_path` (pytest fixture) | Isolated state directories per test |

Add to `backend/requirements-dev.txt`:

```
pytest>=8.0.0
pytest-asyncio>=0.25.0
httpx>=0.28.0
pytest-mock>=3.14.0
```

---

## Test Tiers

```
┌──────────────────────────────────────────────────────────────────┐
│  TIER 1 — Unit Tests (no I/O, no Xero)                          │
│  Models, parser, planner, idempotency, audit                     │
│  Run: pytest tests/unit/  (~instant, every commit)               │
├──────────────────────────────────────────────────────────────────┤
│  TIER 2 — API Tests (mocked Xero, real FastAPI)                  │
│  All endpoints via TestClient, XeroClient mocked                 │
│  Run: pytest tests/api/  (~seconds, every commit)                │
├──────────────────────────────────────────────────────────────────┤
│  TIER 3 — Integration Tests (live Xero Demo Company)             │
│  Real MCP subprocess, real API calls                             │
│  Run: pytest tests/integration/ -m xero  (manual, pre-demo)     │
└──────────────────────────────────────────────────────────────────┘
```

---

## TIER 1 — Unit Tests

No network, no filesystem (use `tmp_path`), no Xero. These test pure logic and can run in < 1 second.

### 1.1 Models (`tests/unit/test_models.py`)

Aligns with: Track A, step A1.

| ID | Test | Assertion |
|---|---|---|
| M1 | Construct `CanonicalPayout` with valid amounts | `gross=1340, commission=445.90, fees=47.10, refunds=0, net=847` succeeds |
| M2 | Construct `CanonicalPayout` with broken invariant | `net=846` raises `ValidationError` containing "Invariant violation" |
| M3 | Invariant edge: refunds reduce net | `gross=1340, commission=445.90, fees=47.10, refunds=10, net=837` succeeds |
| M4 | Invariant edge: all zeros | `gross=0, commission=0, fees=0, refunds=0, net=0` succeeds |
| M5 | Invariant edge: negative amounts rejected | Pydantic validates Decimal precision, negative values follow model rules |
| M6 | `BookingRow` construction | All fields parse correctly, `commission_rate` is string ("35%") |
| M7 | `JournalPlan` with `invariant_check=False` | Constructs (the flag is informational, not enforced at the model level) |
| M8 | `StepKind` enum values | `"create-invoice"`, `"create-bank-transaction"`, `"create-payment"` match API spec |
| M9 | `ProposalResponse` serialisation | `status="new"` serialises to `{"status": "new", ...}` with Decimal amounts as strings |
| M10 | `ApprovalResponse` with `verified=True` | `clearing_balance=Decimal("0.00")` serialises as `"0.00"` |

### 1.2 Parser (`tests/unit/test_parser.py`)

Aligns with: Track A, step A2.

| ID | Test | Input | Assertion |
|---|---|---|---|
| P1 | Golden CSV parses correctly | `data/marketplaceco-payout-0407.csv` | `gross=1340.00`, `net=847.00`, `len(bookings)=9` |
| P2 | Summary amounts match locked values | Golden CSV | `commission=445.90`, `fees=47.10`, `refunds=0.00` |
| P3 | Booking rows parse correctly | Golden CSV | First booking: `client="Client A"`, `client_type="New"`, `service="Cut & Colour"`, `gross_amount=180.00`, `commission=63.00` |
| P4 | Tampered net amount rejects | Golden CSV with `847.00` -> `846.00` | `ValueError` raised |
| P5 | Tampered gross amount rejects | Golden CSV with `1340.00` -> `1350.00` | `ValueError` raised |
| P6 | Empty file rejects | `b""` | `ValueError` with parse error message |
| P7 | Missing summary row rejects | CSV with header only, no data row | `ValueError` |
| P8 | Wrong column count rejects | CSV with fewer columns | `ValueError` |
| P9 | Non-numeric amount rejects | `GrossSales` = `"abc"` | `ValueError` |
| P10 | UTF-8 BOM handled | Golden CSV prefixed with `\xef\xbb\xbf` | Parses correctly (BOM stripped) |
| P11 | Windows line endings handled | Golden CSV with `\r\n` | Parses correctly |
| P12 | Trailing whitespace handled | Amounts with trailing spaces | Parses correctly after strip |

### 1.3 Planner (`tests/unit/test_planner.py`)

Aligns with: Track A, step A3.

| ID | Test | Assertion |
|---|---|---|
| PL1 | Golden payout produces 3 steps | `len(plan.steps) == 3` |
| PL2 | Step 1 is `create-invoice` | `kind="create-invoice"`, `amount=1340.00`, `account="Platform Clearing"` |
| PL3 | Step 2 is `create-bank-transaction` | `kind="create-bank-transaction"`, `amount=493.00`, two `FeeLineItem` lines |
| PL4 | Step 2 fee lines correct | `lines[0].amount=445.90` ("New-client commission"), `lines[1].amount=47.10` ("Prepayment fees") |
| PL5 | Step 3 is `create-payment` | `kind="create-payment"`, `amount=847.00`, `clears="MC-PAYOUT-0407"` |
| PL6 | `invariant_check` is `True` | `plan.invariant_check is True` |
| PL7 | Step amounts sum correctly | `steps[0].amount - steps[1].amount == steps[2].amount` |
| PL8 | Zero-refund payout | Standard golden payout with `refunds=0` produces valid plan |
| PL9 | Non-zero refund payout | `gross=1000, commission=300, fees=50, refunds=100, net=550` produces valid plan with adjusted amounts |

### 1.4 Idempotency (`tests/unit/test_idempotency.py`)

Aligns with: Track A, step A4. All tests use `tmp_path` for isolated `posted.json`.

| ID | Test | Assertion |
|---|---|---|
| ID1 | `compute_file_hash` is deterministic | Same bytes -> same hash, different bytes -> different hash |
| ID2 | `compute_file_hash` is sha256 | Hash matches `hashlib.sha256(data).hexdigest()` |
| ID3 | New file returns `None` | `check_already_posted(hash)` on empty `posted.json` returns `None` |
| ID4 | Record step 1, check remaining | After recording `create-invoice`, `get_remaining_steps` returns 2 steps |
| ID5 | Record all 3 steps, check posted | `check_already_posted` returns dict with all 3 IDs |
| ID6 | Record all 3 steps, no remaining | `get_remaining_steps` returns empty list |
| ID7 | Partial recording (crash recovery) | Record steps 1 and 2, `get_remaining_steps` returns only step 3 |
| ID8 | Multiple files tracked independently | Two different hashes, each with their own step-maps |
| ID9 | `posted.json` persists across calls | Write, re-read in a new function call, data survives |
| ID10 | Duplicate `record_step` is safe | Recording the same step twice doesn't corrupt state |

### 1.5 Audit (`tests/unit/test_audit.py`)

Aligns with: Track A, step A5. All tests use `tmp_path`.

| ID | Test | Assertion |
|---|---|---|
| AU1 | Append entry to empty file | `audit.json` contains 1 entry |
| AU2 | Append multiple entries | 3 entries appended, all present in order |
| AU3 | Entry has correct structure | Fields: `timestamp`, `file_hash`, `action`, `request`, `xero_id`, `status` |
| AU4 | `timestamp` is ISO 8601 | Parseable by `datetime.fromisoformat()` |
| AU5 | `get_entries` filters by hash | Two hashes with entries, query one, only its entries returned |
| AU6 | `get_entries` for unknown hash | Returns empty list |
| AU7 | `get_trace_panel` returns same shape | Output matches `get_entries` structure |

---

## TIER 2 — API Tests

Real FastAPI app via `TestClient`, but `XeroClient` is mocked. Tests the HTTP layer: request parsing, response shapes, status codes, error handling. No Xero credentials needed.

### 2.1 Test Setup

```python
# tests/api/conftest.py

@pytest.fixture
def mock_xero_client():
    """A mock XeroClient with pre-programmed responses for the golden path."""
    client = AsyncMock(spec=XeroClient)
    client.create_invoice.return_value = "INV-0042"
    client.create_bank_transaction.return_value = "BT-0117"
    client.create_payment.return_value = "PMT-0089"
    client.get_clearing_balance.return_value = Decimal("0.00")
    client.list_profit_and_loss.return_value = {
        "Revenue": "1340.00", "Expenses": "493.00", "NetProfit": "847.00"
    }
    client.list_organisation_details.return_value = {"Name": "Demo Company (UK)"}
    return client

@pytest.fixture
def app(mock_xero_client, tmp_path):
    """FastAPI app with mocked Xero and isolated state directory."""
    # Patch STATE_DIR to tmp_path
    # Inject mock_xero_client into app.state
    # Return TestClient
```

### 2.2 `/propose` Endpoint (`tests/api/test_propose.py`)

Aligns with: Track A, step A6.

| ID | Test | Assertion |
|---|---|---|
| AP1 | Upload golden CSV | 200, `status="new"`, `file_hash` present, `payout.gross="1340.00"` |
| AP2 | Response plan has 3 steps | `plan.steps` length is 3, kinds match spec |
| AP3 | Response amounts are strings | `payout.gross` is `"1340.00"` not `1340.0` |
| AP4 | Duplicate upload returns `already-posted` | Upload, record all steps, upload again -> `status="already-posted"`, `existing_ids` present |
| AP5 | Malformed CSV returns 400 | Upload a `.csv` with garbage content -> 400 with `"CSV parse error"` in detail |
| AP6 | Invariant-violating CSV returns 422 | Upload CSV with tampered net -> 422 with `"Invariant violation"` in detail |
| AP7 | Non-CSV file returns 400 | Upload a `.txt` file -> 400 |
| AP8 | Empty file returns 400 | Upload empty `.csv` -> 400 |
| AP9 | Response includes bookings | `payout.bookings` is a list of 9 items |
| AP10 | `existing_ids` is `null` for new file | `existing_ids` field is `null` when `status="new"` |

### 2.3 `/approve` Endpoint (`tests/api/test_approve.py`)

Aligns with: Integration phase.

| ID | Test | Assertion |
|---|---|---|
| AA1 | Approve after propose | 200, 3 results all `status="success"`, `clearing_balance="0.00"`, `verified=true` |
| AA2 | Results contain Xero IDs | `results[0].xero_id="INV-0042"`, etc. |
| AA3 | Unknown hash returns 404 | `POST /approve {"file_hash": "nonexistent"}` -> 404 |
| AA4 | Already-completed returns 409 | Approve, then approve again -> 409 with `existing_ids` |
| AA5 | Crash recovery: step 1 done | Pre-populate `posted.json` with step 1 complete, approve -> mock called only for steps 2 and 3 |
| AA6 | Crash recovery: steps 1+2 done | Pre-populate steps 1+2, approve -> mock called only for step 3 |
| AA7 | Xero write failure returns 503 | Mock `create_bank_transaction` to raise -> 503, step 1 result present, step 2 has error |
| AA8 | Partial failure records completed steps | After AA7, `posted.json` has step 1 recorded, not step 2 |
| AA9 | P&L AFTER snapshot saved | After approve, `state/pnl-after.json` exists |
| AA10 | `create_payment` receives invoice ID | Mock `create_payment` called with `invoice_id="INV-0042"` from step 1 |
| AA11 | Verification with non-zero balance | Mock `get_clearing_balance` to return `Decimal("0.01")` -> `verified=false` |

### 2.4 `/status` Endpoint (`tests/api/test_status.py`)

Aligns with: Track C, step C1.

| ID | Test | Assertion |
|---|---|---|
| AS1 | Status after full approve | 200, `completed_steps` has 3 items, all IDs present |
| AS2 | Status with partial completion | Pre-populate 1 step -> `completed_steps` has 1 item |
| AS3 | Status for unknown hash | 404 |
| AS4 | Audit entries included | `audit_entries` list matches entries in `audit.json` |
| AS5 | Clearing balance included | `clearing_balance` present when recorded |

### 2.5 `/pnl` Endpoint (`tests/api/test_pnl.py`)

Aligns with: Track C, step C2.

| ID | Test | Assertion |
|---|---|---|
| APL1 | P&L after seed and approve | 200, `before.revenue="847.00"`, `after.revenue="1340.00"` |
| APL2 | P&L before approve (no after) | 200, `before` present, `after` is `null` |
| APL3 | P&L with no data | 404 when neither snapshot file exists |
| APL4 | Commission expense in after | `after.commission_expense="493.00"` |
| APL5 | Net profit unchanged | `before.net_profit == after.net_profit == "847.00"` |

### 2.6 `/health` Endpoint (`tests/api/test_health.py`)

Aligns with: Track C, step C3.

| ID | Test | Assertion |
|---|---|---|
| AH1 | Healthy with Xero connected | 200, `status="ok"`, `xero_connected=true`, `organisation` present |
| AH2 | Degraded without Xero | Mock raises on `list_organisation_details` -> 200/503, `status="degraded"`, `xero_connected=false` |

---

## TIER 3 — Integration Tests (Live Xero)

Real MCP subprocess, real Xero Demo Company. These tests are slow, require credentials, and mutate the Demo Company — run manually before the demo, never in CI.

Mark with `@pytest.mark.xero` so they can be excluded from normal runs.

### 3.1 Xero Client (`tests/integration/test_xero_client.py`)

Aligns with: Track B, step B1.

| ID | Test | Assertion |
|---|---|---|
| XC1 | Connect and disconnect | No error raised |
| XC2 | `list_organisation_details` | Returns dict containing `"Demo Company"` |
| XC3 | `list_accounts` | Returns non-empty list |
| XC4 | `list_bank_transactions` | Returns list (may be empty on fresh Demo Company) |
| XC5 | `list_profit_and_loss` | Returns dict with revenue data |
| XC6 | `create_account` idempotent | Create "Test Clearing" account, create again -> no duplicate, same ID |
| XC7 | `create_contact` idempotent | Create "Test Contact", create again -> no duplicate |

### 3.2 Seed (`tests/integration/test_seed.py`)

Aligns with: Track B, step B2.

| ID | Test | Assertion |
|---|---|---|
| XS1 | Seed creates all objects | After seed: Platform Clearing account, Fees account, MarketplaceCo contact, £847 receive transaction all exist in Xero |
| XS2 | Seed is idempotent | Run seed twice -> no duplicates (account/contact counts unchanged) |
| XS3 | P&L BEFORE captured | `state/pnl-before.json` exists and contains revenue data |

### 3.3 Golden Path End-to-End (`tests/integration/test_golden_path.py`)

Aligns with: Integration + Final.

| ID | Test | Assertion |
|---|---|---|
| XG1 | Full golden path | Seed -> propose -> approve -> status -> pnl. All pass. |
| XG2 | Clearing balance is zero | After approve, `clearing_balance == "0.00"` |
| XG3 | Xero UI verification | Invoice for £1,340, bank transaction for £493, payment for £847 visible in Xero |
| XG4 | P&L after shows correction | `after.revenue` > `before.revenue`, commission expense visible |
| XG5 | Idempotency end-to-end | Re-propose same file -> `"already-posted"`, re-approve -> 409 |
| XG6 | Audit trail complete | `/status` returns 3 audit entries with real Xero IDs |

---

## Test Directory Structure

```
tests/
├── conftest.py                     # Shared fixtures (tmp_path state, golden CSV bytes)
├── unit/
│   ├── test_models.py              # M1-M10
│   ├── test_parser.py              # P1-P12
│   ├── test_planner.py             # PL1-PL9
│   ├── test_idempotency.py         # ID1-ID10
│   └── test_audit.py               # AU1-AU7
├── api/
│   ├── conftest.py                 # Mock XeroClient, TestClient factory
│   ├── test_propose.py             # AP1-AP10
│   ├── test_approve.py             # AA1-AA11
│   ├── test_status.py              # AS1-AS5
│   ├── test_pnl.py                 # APL1-APL5
│   └── test_health.py              # AH1-AH2
└── integration/
    ├── conftest.py                 # Real XeroClient, @pytest.mark.xero
    ├── test_xero_client.py         # XC1-XC7
    ├── test_seed.py                # XS1-XS3
    └── test_golden_path.py         # XG1-XG6
```

## Running Tests

```bash
# All unit + API tests (no Xero needed, fast)
pytest tests/unit/ tests/api/ -v

# Unit tests only
pytest tests/unit/ -v

# API tests only
pytest tests/api/ -v

# Integration tests (requires .env with Xero creds, mutates Demo Company)
pytest tests/integration/ -m xero -v

# Full suite
pytest -v
```

## Parallel Execution of Test Development

Tests align to the same tracks as the implementation plan and can be written in parallel:

| Worker | Tests to write | Backend track |
|---|---|---|
| **Worker 1** | `test_models`, `test_parser`, `test_planner`, `test_idempotency`, `test_audit`, `test_propose` | Track A |
| **Worker 2** | `test_xero_client`, `test_seed` | Track B |
| **Worker 3** | `test_status`, `test_pnl`, `test_health` | Track C |
| **Any one** | `test_approve`, `test_golden_path` | Integration + Final |

Tests for each track can be written and run before the other tracks exist, because they mock or isolate the dependencies.
