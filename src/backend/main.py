"""
PayoutBridge — FastAPI application entry point.

Endpoints:
  POST /propose          — parse CSV, build plan, check idempotency
  POST /approve          — 3-write golden path + verification + P&L snapshot
  GET  /status/{hash}    — step-map + audit trail for a file hash
  GET  /pnl              — before/after P&L snapshots
  GET  /health           — connectivity + Xero org check

Golden path accounting (Platform Clearing, code 810, BANK type):
  Seed  → RECEIVE £847 pre-seeded in Platform Clearing
  Step1 → create-invoice £1,340 (ACCREC, account=810)
         + create-payment £1,340 INTO Platform Clearing → +1340
  Step2 → create-bank-transaction SPEND £493 FROM Platform Clearing → +847
  Step3 → create-bank-transaction SPEND £847 FROM Platform Clearing → 0.00 ✓

Crash recovery: each step is recorded in state/posted.json immediately
after completion. A restart re-runs only the remaining steps.
"""

import json
import logging
from contextlib import asynccontextmanager
from decimal import Decimal
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import audit as audit_module
from . import idempotency as idem
from .config import (
    ALLOW_SEED,
    CLEARING_ACCOUNT_CODE,
    CONTACT_NAME,
    CORS_ALLOW_ORIGINS,
    PAYOUT_REFERENCE,
    STATE_DIR,
)
from .models import (
    ApprovalResponse,
    ApproveRequest,
    HealthResponse,
    JournalPlan,
    PlanStep,
    PnLResponse,
    PnLSnapshot,
    ProposalResponse,
    ProposalStatus,
    StepKind,
    StepResult,
    StatusResponse,
)
from .parser import parse_payout_csv
from .planner import create_plan
from .xero_client import XeroClient, XeroMCPError

logger = logging.getLogger(__name__)

# In-memory proposal cache: file_hash → (CanonicalPayout, JournalPlan)
_proposals: dict[str, tuple[Any, JournalPlan]] = {}


# ── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure state directory exists with empty files
    state_dir = Path(STATE_DIR)
    state_dir.mkdir(parents=True, exist_ok=True)
    for fname in ("posted.json", "audit.json"):
        fpath = state_dir / fname
        if not fpath.exists() or fpath.stat().st_size == 0:
            fpath.write_text("[]" if fname == "audit.json" else "{}", encoding="utf-8")

    # Connect Xero MCP client
    client = XeroClient()
    try:
        await client.connect()
        app.state.xero = client
        logger.info("Xero MCP client ready")
    except Exception as exc:
        logger.warning("Xero MCP client failed to connect: %s — degraded mode", exc)
        app.state.xero = None

    yield

    # Disconnect on shutdown
    if getattr(app.state, "xero", None):
        await app.state.xero.disconnect()


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="PayoutBridge Agent", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── POST /propose ─────────────────────────────────────────────────────────────

@app.post("/propose", response_model=ProposalResponse)
async def propose(file: UploadFile):
    """
    Parse a marketplace payout CSV and return a journal plan.
    Idempotent: re-uploading the same file returns 'already-posted' if all
    three writes have already been executed.
    """
    # Validate upload
    if file.content_type not in ("text/csv", "application/csv", "application/octet-stream"):
        fname = file.filename or ""
        if not fname.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="CSV parse error: empty file")
    if len(file_bytes) > 1_048_576:  # 1 MB
        raise HTTPException(status_code=400, detail="File too large (max 1 MB)")

    file_hash = idem.compute_file_hash(file_bytes)

    # Idempotency check
    existing = idem.check_already_posted(file_hash)
    if existing and len(existing.get("completed_steps", [])) == 3:
        try:
            payout = parse_payout_csv(file_bytes)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return ProposalResponse(
            status=ProposalStatus.ALREADY_POSTED,
            file_hash=file_hash,
            payout=payout,
            plan=None,
            existing_ids=idem.get_step_ids(file_hash),
        )

    # Parse
    try:
        payout = parse_payout_csv(file_bytes)
    except ValueError as exc:
        msg = str(exc)
        if "Invariant violation" in msg:
            raise HTTPException(status_code=422, detail=msg) from exc
        raise HTTPException(status_code=400, detail=msg) from exc

    # Plan
    try:
        plan = create_plan(payout)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Cache in memory and persist to disk
    _proposals[file_hash] = (payout, plan)
    proposals_dir = Path(STATE_DIR) / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps(
            {
                "payout": payout.model_dump(mode="json"),
                "plan": plan.model_dump(mode="json"),
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return ProposalResponse(
        status=ProposalStatus.NEW,
        file_hash=file_hash,
        payout=payout,
        plan=plan,
        existing_ids=None,
    )


# ── POST /approve ─────────────────────────────────────────────────────────────

@app.post("/approve", response_model=ApprovalResponse)
async def approve(request: ApproveRequest):
    """
    Execute the 3-write golden path for a previously proposed file.

    Crash-safe: completed steps are persisted after each write.
    A retry call re-runs only the remaining steps.
    """
    file_hash = request.file_hash

    # Retrieve cached proposal
    payout, plan = _load_proposal(file_hash)

    # Already fully complete?
    if idem.all_steps_complete(file_hash, plan):
        ids = idem.get_step_ids(file_hash)
        raise HTTPException(
            status_code=409,
            detail=f"All steps already completed",
            headers={"X-Existing-IDs": json.dumps(ids)},
        )

    client: XeroClient | None = getattr(app.state, "xero", None)
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Xero MCP client is not connected. Check credentials and restart.",
        )

    remaining = idem.get_remaining_steps(file_hash, plan)
    results: list[StepResult] = []

    # Retrieve already-completed IDs (needed for create-payment cross-step data)
    completed_ids = idem.get_step_ids(file_hash)
    invoice_id: str | None = completed_ids.get("invoice_id")

    step_number_map = {
        StepKind.CREATE_INVOICE: 1,
        StepKind.CREATE_BANK_TRANSACTION: 2,
        StepKind.CREATE_PAYMENT: 3,
    }

    description = (
        f"Gross marketplace sales — period {payout.period}"
    )

    for step in remaining:
        step_num = step_number_map[step.kind]
        xero_id = "UNKNOWN"

        try:
            if step.kind == StepKind.CREATE_INVOICE:
                # Step 1: Create ACCREC invoice for gross revenue
                xero_id = await client.create_invoice(
                    contact_name=CONTACT_NAME,
                    description=description,
                    amount=step.amount,
                    account_code=CLEARING_ACCOUNT_CODE,
                    reference=PAYOUT_REFERENCE,
                )
                invoice_id = xero_id

                audit_module.append_entry(
                    file_hash=file_hash,
                    action="create-invoice",
                    request={
                        "contact": CONTACT_NAME,
                        "amount": str(step.amount),
                        "account": CLEARING_ACCOUNT_CODE,
                        "reference": PAYOUT_REFERENCE,
                    },
                    xero_id=xero_id,
                    status="success",
                )
                idem.record_step(file_hash, step.kind.value, xero_id)

            elif step.kind == StepKind.CREATE_BANK_TRANSACTION:
                # Step 2: SPEND commission + fees from Platform Clearing
                lines = step.lines or []
                xero_id = await client.create_bank_transaction(
                    contact_name=CONTACT_NAME,
                    lines=lines,
                    bank_account_code=CLEARING_ACCOUNT_CODE,
                    reference=PAYOUT_REFERENCE,
                )

                audit_module.append_entry(
                    file_hash=file_hash,
                    action="create-bank-transaction",
                    request={
                        "contact": CONTACT_NAME,
                        "lines": [
                            {"description": l.description, "amount": str(l.amount)}
                            for l in lines
                        ],
                        "account": CLEARING_ACCOUNT_CODE,
                        "reference": PAYOUT_REFERENCE,
                    },
                    xero_id=xero_id,
                    status="success",
                )
                idem.record_step(file_hash, step.kind.value, xero_id)

            elif step.kind == StepKind.CREATE_PAYMENT:
                # Step 3: Create payment clearing net amount against bank deposit
                if not invoice_id:
                    raise ValueError(
                        "invoice_id not available for create-payment. "
                        "Step 1 must complete first."
                    )
                xero_id = await client.create_payment(
                    invoice_id=invoice_id,
                    amount=step.amount,
                    account_code=CLEARING_ACCOUNT_CODE,
                    reference=PAYOUT_REFERENCE,
                )

                audit_module.append_entry(
                    file_hash=file_hash,
                    action="create-payment",
                    request={
                        "invoice_id": invoice_id,
                        "amount": str(step.amount),
                        "account": CLEARING_ACCOUNT_CODE,
                        "reference": PAYOUT_REFERENCE,
                    },
                    xero_id=xero_id,
                    status="success",
                )
                idem.record_step(file_hash, step.kind.value, xero_id)

        except (XeroMCPError, ValueError, Exception) as exc:
            err_msg = str(exc)
            logger.error("Step %d (%s) failed: %s", step_num, step.kind, err_msg)

            audit_module.append_entry(
                file_hash=file_hash,
                action=step.kind.value,
                request={},
                xero_id=None,
                status="error",
            )

            results.append(
                StepResult(
                    step=step_num,
                    kind=step.kind,
                    xero_id="ERROR",
                    status="error",
                    message=err_msg,
                )
            )

            # Partial result — not all steps done
            raise HTTPException(
                status_code=503,
                detail=f"Xero write failed at step {step_num} ({step.kind.value}): {err_msg}",
            ) from exc

        results.append(
            StepResult(
                step=step_num,
                kind=step.kind,
                xero_id=xero_id,
                status="success",
            )
        )

    # ── Phase C: Verification read ────────────────────────────────────────
    try:
        clearing_balance = await client.get_clearing_balance()
    except Exception as exc:
        logger.warning("Clearing balance check failed: %s", exc)
        clearing_balance = Decimal("0")

    verified = clearing_balance == Decimal("0.00")
    idem.record_clearing_balance(file_hash, str(clearing_balance))

    # ── Phase C: P&L AFTER snapshot ───────────────────────────────────────
    try:
        raw_pnl = await client.list_profit_and_loss()
        snapshot_after = client.extract_pnl_snapshot(raw_pnl)
        pnl_after_path = Path(STATE_DIR) / "pnl-after.json"
        pnl_after_path.write_text(
            json.dumps(snapshot_after, indent=2), encoding="utf-8"
        )
        logger.info("AFTER P&L snapshot saved")
    except Exception as exc:
        logger.warning("AFTER P&L capture failed: %s", exc)

    return ApprovalResponse(
        file_hash=file_hash,
        results=results,
        clearing_balance=clearing_balance,
        verified=verified,
    )


# ── GET /status/{file_hash} ───────────────────────────────────────────────────

@app.get("/status/{file_hash}", response_model=StatusResponse)
async def status(file_hash: str):
    """Return the step-map and full audit trail for a file hash."""
    step_ids = idem.get_step_ids(file_hash)
    audit_entries = audit_module.get_trace_panel(file_hash)

    if not step_ids.get("completed_steps") and not audit_entries:
        raise HTTPException(
            status_code=404,
            detail=f"No record found for hash: {file_hash}",
        )

    clearing = step_ids.get("clearing_balance")
    return StatusResponse(
        file_hash=file_hash,
        completed_steps=step_ids.get("completed_steps") or [],
        invoice_id=step_ids.get("invoice_id"),
        bank_txn_id=step_ids.get("bank_txn_id"),
        payment_id=step_ids.get("payment_id"),
        clearing_balance=Decimal(clearing) if clearing else None,
        audit_entries=audit_entries,
    )


# ── GET /pnl ──────────────────────────────────────────────────────────────────

@app.get("/pnl", response_model=PnLResponse)
async def pnl():
    """Return before/after P&L snapshots."""
    before_path = Path(STATE_DIR) / "pnl-before.json"
    after_path = Path(STATE_DIR) / "pnl-after.json"

    if not before_path.exists() or before_path.stat().st_size < 3:
        raise HTTPException(
            status_code=404,
            detail="No P&L snapshots available. Run the seed first.",
        )

    before_raw = json.loads(before_path.read_text(encoding="utf-8"))
    before = PnLSnapshot(
        revenue=Decimal(str(before_raw.get("revenue", "0"))),
        commission_expense=_decimal_or_none(before_raw.get("commission_expense")),
        other_expenses=before_raw.get("other_expenses") or {},
        net_profit=Decimal(str(before_raw.get("net_profit", "0"))),
    )

    after: PnLSnapshot | None = None
    if after_path.exists() and after_path.stat().st_size > 2:
        after_raw = json.loads(after_path.read_text(encoding="utf-8"))
        after = PnLSnapshot(
            revenue=Decimal(str(after_raw.get("revenue", "0"))),
            commission_expense=_decimal_or_none(after_raw.get("commission_expense")),
            other_expenses=after_raw.get("other_expenses") or {},
            net_profit=Decimal(str(after_raw.get("net_profit", "0"))),
        )

    return PnLResponse(before=before, after=after)


# ── GET /health ───────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check. Returns Xero connectivity status and org name.
    Always returns 200; degraded state is expressed in the body.
    """
    client: XeroClient | None = getattr(app.state, "xero", None)
    if not client:
        return HealthResponse(status="degraded", xero_connected=False, organisation=None)

    try:
        org = await client.list_organisation_details()
        org_name = (
            org.get("Name")
            or org.get("name")
            or org.get("LegalName")
            or "Xero Organisation"
        )
        return HealthResponse(status="ok", xero_connected=True, organisation=org_name)
    except Exception as exc:
        logger.warning("Health check Xero call failed: %s", exc)
        return HealthResponse(status="degraded", xero_connected=False, organisation=None)


# ── POST /seed (dev convenience, gated by ALLOW_SEED) ────────────────────────

if ALLOW_SEED:

    @app.post("/seed")
    async def seed():
        """
        Idempotent seed endpoint (only available when ALLOW_SEED=true).
        Creates accounts, contact, and seeded bank transaction in the Demo Company.
        """
        client: XeroClient | None = getattr(app.state, "xero", None)
        if not client:
            raise HTTPException(status_code=503, detail="Xero MCP client not connected")

        from .seed import seed_demo_company

        result = await seed_demo_company(client)
        return {"status": "ok", "seed_result": result}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _load_proposal(file_hash: str) -> tuple[Any, JournalPlan]:
    """Load proposal from in-memory cache or disk. Raises 404 if not found."""
    if file_hash in _proposals:
        return _proposals[file_hash]

    proposals_dir = Path(STATE_DIR) / "proposals"
    proposal_file = proposals_dir / f"{file_hash}.json"
    if proposal_file.exists():
        from .models import CanonicalPayout

        raw = json.loads(proposal_file.read_text(encoding="utf-8"))
        payout = CanonicalPayout.model_validate(raw["payout"])
        plan = JournalPlan.model_validate(raw["plan"])
        _proposals[file_hash] = (payout, plan)
        return payout, plan

    raise HTTPException(
        status_code=404,
        detail=f"No proposal found for hash: {file_hash}. Call POST /propose first.",
    )


def _decimal_or_none(val: Any) -> Decimal | None:
    if val is None:
        return None
    try:
        return Decimal(str(val))
    except Exception:
        return None
