# PayoutBridge — Backend Specification (Python)

> **Expansion (2026-07-05):** approved features add to this spec — E1 credit-note refund step (`planner.py`, `models.py`, `idempotency.py`), E2 attachment upload + E6 history notes (raw-REST helpers in `xero_client.py`), E3 tracking category (`seed.py`, write calls), E4 `GET /dashboard`, E5 `GET /vat-check` (`main.py`). Authoritative detail: [`11-EXPANSION-SPEC.md`](11-EXPANSION-SPEC.md); endpoint inventory: [`12-ENDPOINTS-AND-SCOPES.md`](12-ENDPOINTS-AND-SCOPES.md).

## 1. Overview

The backend is a Python FastAPI application that serves as the agent core for PayoutBridge. It handles CSV parsing, journal planning, idempotency, Xero API integration (via MCP server), and exposes a REST API consumed by the React frontend.

## 2. Technology Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Python | 3.12+ |
| Web framework | FastAPI | 0.115+ |
| ASGI server | Uvicorn | 0.34+ |
| Data validation | Pydantic | 2.x |
| Xero integration | `xero-python` SDK + MCP subprocess | Latest |
| Environment | python-dotenv | Latest |
| File hashing | hashlib (stdlib) | — |
| CSV parsing | csv (stdlib) | — |
| Decimal handling | decimal (stdlib) | — |

## 3. Module Breakdown

### 3.1 `config.py` — Application Configuration

Loads environment variables and defines application constants.

```python
# Environment variables (from .env)
XERO_CLIENT_ID: str
XERO_CLIENT_SECRET: str
XERO_SCOPES: str = "accounting.transactions accounting.contacts accounting.settings accounting.reports.read offline_access"

# Application constants
STATE_DIR: Path = Path("state")
DATA_DIR: Path = Path("data")
CLEARING_ACCOUNT_CODE: str = "810"
CLEARING_ACCOUNT_NAME: str = "Platform Clearing"
FEES_ACCOUNT_CODE: str = "418"
FEES_ACCOUNT_NAME: str = "Platform Commission & Fees"
CONTACT_NAME: str = "MarketplaceCo (Marketplace)"
```

### 3.2 `models.py` — Pydantic Data Models

```python
from decimal import Decimal
from pydantic import BaseModel, model_validator
from enum import Enum

class BookingRow(BaseModel):
    date: str
    client: str
    client_type: str        # "New" | "Repeat"
    service: str
    gross_amount: Decimal
    commission_rate: str
    commission: Decimal

class CanonicalPayout(BaseModel):
    payout_ref: str         # "MC-PAYOUT-0407"
    period: str             # "16-30 Jun 2026"
    gross: Decimal          # 1340.00
    commission: Decimal     # 445.90
    fees: Decimal           # 47.10
    refunds: Decimal        # 0.00
    net: Decimal            # 847.00
    bookings: list[BookingRow]

    @model_validator(mode="after")
    def check_invariant(self) -> "CanonicalPayout":
        expected_net = self.gross - self.commission - self.fees - self.refunds
        if expected_net != self.net:
            raise ValueError(
                f"Invariant violation: {self.gross} - {self.commission} - "
                f"{self.fees} - {self.refunds} = {expected_net}, expected {self.net}"
            )
        return self

class StepKind(str, Enum):
    CREATE_INVOICE = "create-invoice"
    CREATE_BANK_TRANSACTION = "create-bank-transaction"
    CREATE_PAYMENT = "create-payment"

class FeeLineItem(BaseModel):
    description: str
    amount: Decimal

class PlanStep(BaseModel):
    kind: StepKind
    amount: Decimal
    account: str | None = None
    lines: list[FeeLineItem] | None = None
    clears: str | None = None

class JournalPlan(BaseModel):
    steps: list[PlanStep]
    invariant_check: bool

class ProposalStatus(str, Enum):
    NEW = "new"
    ALREADY_POSTED = "already-posted"

class ProposalResponse(BaseModel):
    status: ProposalStatus
    file_hash: str
    payout: CanonicalPayout
    plan: JournalPlan | None = None
    existing_ids: dict | None = None  # present when already-posted

class StepResult(BaseModel):
    step: int
    kind: StepKind
    xero_id: str
    status: str             # "success" | "error"

class ApprovalResponse(BaseModel):
    file_hash: str
    results: list[StepResult]
    clearing_balance: Decimal
    verified: bool          # True when clearing_balance == 0.00

class StatusResponse(BaseModel):
    file_hash: str
    completed_steps: list[str]
    invoice_id: str | None = None
    bank_txn_id: str | None = None
    payment_id: str | None = None
    clearing_balance: Decimal | None = None
    audit_entries: list[dict]

class PnLSnapshot(BaseModel):
    revenue: Decimal
    commission_expense: Decimal | None = None
    other_expenses: dict | None = None
    net_profit: Decimal

class PnLResponse(BaseModel):
    before: PnLSnapshot | None = None
    after: PnLSnapshot | None = None
```

### 3.3 `parser.py` — CSV Parser

Deterministic, hardcoded column map. No LLM inference. Reads only the header summary row for amounts (booking detail rows are for display only).

```python
def parse_payout_csv(file_bytes: bytes) -> CanonicalPayout:
    """
    Parse a marketplace payout CSV into a CanonicalPayout.

    Expected CSV structure:
      Row 1 (header): PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
      Row 2 (summary): MC-PAYOUT-0407,16-30 Jun 2026,1340.00,445.90,47.10,0.00,847.00
      Row 3 (booking header): BookingDate,Client,ClientType,Service,GrossAmount,CommissionRate,Commission
      Rows 4+: individual booking rows

    Raises ValueError if:
      - CSV structure doesn't match expected format
      - Invariant (gross - commission - fees - refunds == net) fails
    """
```

**Key rules:**
- Header-row totals are authoritative; booking rows are display detail only.
- Commission detail sums may approximate the header — the parser reads ONLY the header row for amounts.
- The `CanonicalPayout` model validator enforces the invariant at construction time.

### 3.4 `planner.py` — Journal Planner

Transforms a `CanonicalPayout` into a `JournalPlan` with exactly three write steps.

```python
def create_plan(payout: CanonicalPayout) -> JournalPlan:
    """
    Build a 3-step journal plan from a canonical payout.

    Steps:
      1. create-invoice: ACCREC invoice for gross amount, paid into Platform Clearing
      2. create-bank-transaction: SPEND from Platform Clearing for commission + fees
      3. create-payment: Apply net amount from Platform Clearing against the bank deposit

    Raises ValueError if the payout invariant does not hold.
    Returns a JournalPlan with invariant_check=True.
    """
```

**Hard rule:** `planner.py` must raise if the invariant fails. The agent must be structurally unable to propose books that don't balance.

### 3.5 `idempotency.py` — Idempotency Manager

```python
import hashlib
from pathlib import Path

STATE_FILE = Path("state/posted.json")

def compute_file_hash(file_bytes: bytes) -> str:
    """Return the sha256 hex digest of the file contents."""

def check_already_posted(file_hash: str) -> dict | None:
    """
    Check posted.json for an existing entry with this hash.
    Returns the step-map dict if found, None if new.
    """

def record_step(file_hash: str, step_kind: str, xero_id: str) -> None:
    """
    Record a completed step in posted.json.

    Step-map structure per hash:
    {
        "invoice_id": "INV-0042",
        "bank_txn_id": "BT-0117",
        "payment_id": "PMT-0089",
        "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"]
    }

    A crash after write 1 means re-run will skip write 1 and execute writes 2-3.
    """

def get_remaining_steps(file_hash: str, plan: JournalPlan) -> list[PlanStep]:
    """Return only the plan steps not yet recorded as completed."""
```

### 3.6 `xero_client.py` — Xero MCP Client Wrapper

Communicates with Xero via the MCP server process (`npx -y @xeroapi/xero-mcp-server@latest`).

```python
class XeroClient:
    """
    Wrapper around the Xero MCP server for reads and writes.
    Manages the MCP subprocess lifecycle and provides typed methods.
    """

    async def connect(self) -> None:
        """Start the MCP subprocess and establish connection."""

    async def disconnect(self) -> None:
        """Shut down the MCP subprocess."""

    # --- Read operations ---

    async def list_organisation_details(self) -> dict:
        """Verify connectivity. Returns org name and details."""

    async def list_accounts(self) -> list[dict]:
        """List all accounts. Used to find/verify Platform Clearing."""

    async def list_bank_transactions(self) -> list[dict]:
        """List bank transactions. Used to locate the net deposit."""

    async def list_profit_and_loss(self) -> dict:
        """Fetch P&L report for before/after comparison."""

    async def get_clearing_balance(self) -> Decimal:
        """Query the Platform Clearing account balance (verification read)."""

    # --- Write operations (golden path) ---

    async def create_invoice(
        self,
        contact_name: str,
        description: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """
        Create an ACCREC invoice for gross revenue into Platform Clearing.
        Returns the Xero Invoice ID.
        """

    async def create_bank_transaction(
        self,
        contact_name: str,
        lines: list[FeeLineItem],
        account_code: str,
        reference: str,
    ) -> str:
        """
        Create a SPEND bank transaction from Platform Clearing for fees.
        Returns the Xero BankTransaction ID.
        """

    async def create_payment(
        self,
        invoice_id: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """
        Create a payment clearing the net amount against the bank deposit.
        Returns the Xero Payment ID.
        """

    # --- Seed operations ---

    async def create_account(self, name: str, code: str, account_type: str) -> str:
        """Create a Chart of Accounts entry if not already present."""

    async def create_contact(self, name: str) -> str:
        """Create a contact if not already present."""

    async def create_receive_transaction(
        self, amount: Decimal, reference: str, account_code: str
    ) -> str:
        """Seed the net deposit (the 'wrong books' starting state)."""
```

**Rate limit handling:**
- Honour `Retry-After` header on 429 responses.
- Golden path uses <= 10 calls total, well within the 60/min limit.

### 3.7 `audit.py` — Audit Trail

```python
from pathlib import Path

AUDIT_FILE = Path("state/audit.json")

def append_entry(
    file_hash: str,
    action: str,
    request: dict,
    xero_id: str | None,
    status: str,
) -> None:
    """
    Append an audit entry to audit.json.

    Entry structure:
    {
        "timestamp": "2026-07-04T15:30:00Z",
        "file_hash": "abc123...",
        "action": "create-invoice",
        "request": { ... },
        "xero_id": "INV-0042",
        "status": "success"
    }
    """

def get_entries(file_hash: str) -> list[dict]:
    """Return all audit entries for a given file hash."""

def get_trace_panel(file_hash: str) -> list[dict]:
    """
    Return audit entries shaped for the Transaction Trace panel:
    CSV row -> planned action -> Xero ID -> status tick.
    """
```

### 3.8 `seed.py` — Demo Company Seeder

Idempotent script that sets up the Demo Company for the golden-path demo.

```python
async def seed_demo_company(client: XeroClient) -> None:
    """
    Idempotent seed: re-run creates nothing new.

    Steps:
    1. Create/verify "Platform Clearing" account (code 810, current asset)
    2. Create/verify "Platform Commission & Fees" account (code 418, expense)
    3. Create/verify "MarketplaceCo (Marketplace)" contact
    4. Create the net deposit bank transaction: RECEIVE £847.00, ref MC-PAYOUT-0407
    5. Capture BEFORE P&L snapshot to state/pnl-before.json
    """
```

### 3.9 `main.py` — FastAPI Application

```python
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PayoutBridge Agent", version="1.0.0")

# CORS configured for local frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

See [03-API-SPEC.md](03-API-SPEC.md) for full endpoint documentation.

## 4. State Management

All state is stored in local JSON files under `state/`. No database.

| File | Purpose | Reset behaviour |
|---|---|---|
| `state/posted.json` | Idempotency step-map | Delete to allow re-posting |
| `state/audit.json` | Full audit trail | Delete to clear history |
| `state/pnl-before.json` | P&L snapshot before writes | Recaptured on seed |
| `state/pnl-after.json` | P&L snapshot after writes | Captured after approve |

## 5. Error Handling

| Scenario | Behaviour |
|---|---|
| Invariant failure (gross - commission - fees - refunds != net) | `planner.py` raises `ValueError`; `/propose` returns 422 |
| Duplicate file upload | Return `already-posted` status with existing Xero IDs |
| MCP write failure mid-sequence | Record last completed step; return partial result; re-run skips completed steps |
| Xero rate limit (429) | Honour `Retry-After` header; retry once; fail with 503 if still blocked |
| MCP subprocess crash | Return 503; log to audit trail |
| Malformed CSV | Return 400 with specific parse error |

## 6. Security

- `.env` file is never committed (in `.gitignore`)
- No secrets in code; all via environment variables
- CORS restricted to known frontend origins
- File uploads validated: CSV only, size-limited
- No user authentication for the demo (single-tenant, local)

## 7. Dependencies (`requirements.txt`)

```
fastapi>=0.115.0
uvicorn>=0.34.0
python-dotenv>=1.1.0
pydantic>=2.10.0
xero-python>=7.0.0
python-multipart>=0.0.18
```

## 8. Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with XERO_CLIENT_ID and XERO_CLIENT_SECRET

# Seed the Demo Company
python -m backend.seed

# Start the server
uvicorn backend.main:app --reload --port 8000
```
