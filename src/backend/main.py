"""
PayoutBridge — FastAPI application entry point.

Endpoints:
  POST /propose            — parse CSV, build plan (3 or 4 steps), check idempotency
  POST /approve            — golden path writes + E1 credit-note + E2 attach + E6 history
  GET  /status/{hash}      — step-map + audit trail for a file hash
  GET  /pnl                — before/after P&L snapshots
  GET  /dashboard          — live Xero reads: trial balance + aged-AR + balance sheet [E4]
  GET  /vat-check          — list-tax-rates + VAT consistency flag [E5]
  GET  /health             — connectivity + Xero org check

Golden path accounting (Platform Clearing, code 810, BANK type):
  Seed  → RECEIVE net deposit pre-seeded in Platform Clearing
  Step1 → create-invoice gross (ACCREC) into Clearing
  Step2 → create-credit-note refunds OUT of Clearing (only when refunds > 0) [E1]
  Step3 → create-bank-transaction SPEND fees FROM Clearing
  Step4 → create-payment SPEND net FROM Clearing → £0.00 ✓
  (Step 2 absent for zero-refund files → 3 total steps)

Post-write extras (non-fatal):
  E2 — source CSV attached to invoice via raw REST PUT
  E6 — history note on each created object via raw REST PUT
"""

import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
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
    AgedReceivableEntry,
    ApprovalResponse,
    ApproveRequest,
    AttachmentResult,
    DashboardResponse,
    HealthResponse,
    JournalPlan,
    PlanStep,
    PnLResponse,
    PnLSnapshot,
    ProposalResponse,
    ProposalStatus,
    RecentPayout,
    StatusResponse,
    StepKind,
    StepResult,
    VatCheckResponse,
    VatRateEntry,
)
from .parser import parse_payout_csv
from .planner import create_plan
from .xero_client import XeroClient, XeroMCPError

logger = logging.getLogger(__name__)

# In-memory proposal cache: file_hash → (CanonicalPayout, JournalPlan)
_proposals: dict[str, tuple[Any, JournalPlan]] = {}

# In-memory cache for expensive read endpoints (E4, E5)
_dashboard_cache: tuple[DashboardResponse, float] | None = None
_vat_cache: tuple[VatCheckResponse, float] | None = None
_CACHE_TTL = 60.0  # seconds

# Uploads dir — stores raw CSV bytes for E2 attachment
_UPLOADS_DIR = Path(STATE_DIR) / "uploads"

# Xero endpoint names for E6 history notes (maps StepKind → endpoint label)
_HISTORY_ENDPOINTS: dict[StepKind, str] = {
    StepKind.CREATE_INVOICE: "Invoices",
    StepKind.CREATE_CREDIT_NOTE: "CreditNotes",
    StepKind.CREATE_BANK_TRANSACTION: "BankTransactions",
    StepKind.CREATE_PAYMENT: "Payments",
}


# ── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    state_dir = Path(STATE_DIR)
    state_dir.mkdir(parents=True, exist_ok=True)
    _UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    for fname in ("posted.json", "audit.json"):
        fpath = state_dir / fname
        if not fpath.exists() or fpath.stat().st_size == 0:
            fpath.write_text("[]" if fname == "audit.json" else "{}", encoding="utf-8")

    client = XeroClient()
    try:
        await client.connect()
        app.state.xero = client
        logger.info("Xero MCP client ready")
    except Exception as exc:
        logger.warning("Xero MCP client failed to connect: %s — degraded mode", exc)
        app.state.xero = None

    yield

    if getattr(app.state, "xero", None):
        await app.state.xero.disconnect()


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="PayoutBridge Agent", version="2.0.0", lifespan=lifespan)

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
    Parse a marketplace payout CSV and return a journal plan (3 or 4 steps).
    Idempotent: re-uploading a fully-posted file returns 'already-posted'.
    Upload bytes are saved to state/uploads/<hash>.csv for E2 attachment.
    """
    if file.content_type not in ("text/csv", "application/csv", "application/octet-stream"):
        fname = file.filename or ""
        if not fname.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="CSV parse error: empty file")
    if len(file_bytes) > 1_048_576:
        raise HTTPException(status_code=400, detail="File too large (max 1 MB)")

    file_hash = idem.compute_file_hash(file_bytes)

    # Persist upload bytes for E2 attachment
    upload_path = _UPLOADS_DIR / f"{file_hash}.csv"
    if not upload_path.exists():
        upload_path.write_bytes(file_bytes)

    # Parse + plan first (needed to know step count for idempotency check)
    try:
        payout = parse_payout_csv(file_bytes)
    except ValueError as exc:
        msg = str(exc)
        if "Invariant violation" in msg:
            raise HTTPException(status_code=422, detail=msg) from exc
        raise HTTPException(status_code=400, detail=msg) from exc

    try:
        plan = create_plan(payout)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Idempotency check: all steps in THIS plan completed?
    existing = idem.check_already_posted(file_hash)
    if existing:
        completed = existing.get("completed_steps", [])
        expected_kinds = [s.kind.value for s in plan.steps]
        if all(k in completed for k in expected_kinds):
            return ProposalResponse(
                status=ProposalStatus.ALREADY_POSTED,
                file_hash=file_hash,
                payout=payout,
                plan=None,
                existing_ids=idem.get_step_ids(file_hash),
            )

    # Cache proposal
    _proposals[file_hash] = (payout, plan)
    proposals_dir = Path(STATE_DIR) / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps(
            {"payout": payout.model_dump(mode="json"), "plan": plan.model_dump(mode="json")},
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
    Execute the full write plan (3 or 4 steps) for a previously proposed file.

    Crash-safe: each step is persisted immediately after completion.
    A retry re-runs only the remaining steps.
    Post-write extras (non-fatal): CSV attachment (E2), history notes (E6).
    """
    file_hash = request.file_hash
    payout, plan = _load_proposal(file_hash)

    if idem.all_steps_complete(file_hash, plan):
        ids = idem.get_step_ids(file_hash)
        raise HTTPException(
            status_code=409,
            detail="All steps already completed",
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

    completed_ids = idem.get_step_ids(file_hash)
    invoice_id: str | None = completed_ids.get("invoice_id")

    # Dynamic step numbering (plan may be 3 or 4 steps)
    step_number_map = {step.kind: i + 1 for i, step in enumerate(plan.steps)}
    payout_ref = payout.payout_ref
    hash_short = file_hash[:8]
    history_note = f"Posted by PayoutBridge from {payout_ref} sha256:{hash_short}"
    description = f"Gross marketplace sales — period {payout.period}"

    for step in remaining:
        step_num = step_number_map[step.kind]
        xero_id = "UNKNOWN"

        try:
            if step.kind == StepKind.CREATE_INVOICE:
                xero_id = await client.create_invoice(
                    contact_name=CONTACT_NAME,
                    description=description,
                    amount=step.amount,
                    account_code=CLEARING_ACCOUNT_CODE,
                    reference=payout_ref,
                )
                invoice_id = xero_id

            elif step.kind == StepKind.CREATE_CREDIT_NOTE:
                xero_id = await client.create_credit_note(
                    contact_name=CONTACT_NAME,
                    amount=step.amount,
                    account_code=CLEARING_ACCOUNT_CODE,
                    reference=payout_ref,
                )

            elif step.kind == StepKind.CREATE_BANK_TRANSACTION:
                lines = step.lines or []
                xero_id = await client.create_bank_transaction(
                    contact_name=CONTACT_NAME,
                    lines=lines,
                    bank_account_code=CLEARING_ACCOUNT_CODE,
                    reference=payout_ref,
                )

            elif step.kind == StepKind.CREATE_PAYMENT:
                if not invoice_id:
                    raise ValueError(
                        "invoice_id not available for create-payment. "
                        "Step 1 must complete first."
                    )
                xero_id = await client.create_payment(
                    invoice_id=invoice_id,
                    amount=step.amount,
                    account_code=CLEARING_ACCOUNT_CODE,
                    reference=payout_ref,
                )

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
            results.append(StepResult(
                step=step_num, kind=step.kind,
                xero_id="ERROR", status="error", message=err_msg,
            ))
            raise HTTPException(
                status_code=503,
                detail=f"Xero write failed at step {step_num} ({step.kind.value}): {err_msg}",
            ) from exc

        # Step succeeded — record & audit
        audit_module.append_entry(
            file_hash=file_hash,
            action=step.kind.value,
            request={"amount": str(step.amount), "reference": payout_ref},
            xero_id=xero_id,
            status="success",
        )
        idem.record_step(file_hash, step.kind.value, xero_id)
        results.append(StepResult(
            step=step_num, kind=step.kind, xero_id=xero_id, status="success",
        ))

        # ── E6: history note (non-fatal) ───────────────────────────────
        endpoint = _HISTORY_ENDPOINTS.get(step.kind)
        if endpoint and xero_id not in ("UNKNOWN", "ERROR"):
            try:
                ok = await client.add_history_note(endpoint, xero_id, history_note)
                audit_module.append_entry(
                    file_hash=file_hash,
                    action="history-note",
                    request={"endpoint": endpoint, "guid": xero_id},
                    xero_id=xero_id,
                    status="success" if ok else "failed",
                )
            except Exception as he:
                logger.warning("History note failed for %s/%s: %s", endpoint, xero_id, he)
                audit_module.append_entry(
                    file_hash=file_hash, action="history-note",
                    request={"endpoint": endpoint, "guid": xero_id},
                    xero_id=xero_id, status="failed",
                )

    # ── E2: attach source CSV to invoice (non-fatal) ──────────────────────
    attachment: AttachmentResult | None = None
    if invoice_id and invoice_id not in ("UNKNOWN", "ERROR"):
        upload_path = _UPLOADS_DIR / f"{file_hash}.csv"
        if upload_path.exists():
            csv_bytes = upload_path.read_bytes()
            filename = f"{payout_ref}.csv"
            try:
                ok = await client.attach_file(invoice_id, filename, csv_bytes)
                status_str = "success" if ok else "failed"
            except Exception as ae:
                logger.warning("attach_file raised: %s", ae)
                status_str = "failed"

            attachment = AttachmentResult(
                invoice_id=invoice_id, filename=filename, status=status_str
            )
            audit_module.append_entry(
                file_hash=file_hash,
                action="attach-source",
                request={"invoice_id": invoice_id, "filename": filename},
                xero_id=invoice_id,
                status=status_str,
            )

    # ── Verification read ─────────────────────────────────────────────────
    # A failed read must never be silently reported as a passed verification —
    # defaulting clearing_balance to 0 on error previously made `verified`
    # evaluate True even though the balance was never actually confirmed.
    try:
        clearing_balance = await client.get_clearing_balance()
        balance_read_succeeded = True
    except Exception as exc:
        logger.warning("Clearing balance check failed: %s", exc)
        clearing_balance = Decimal("0")
        balance_read_succeeded = False

    verified = balance_read_succeeded and clearing_balance == Decimal("0.00")
    idem.record_clearing_balance(file_hash, str(clearing_balance))

    # ── P&L AFTER snapshot ────────────────────────────────────────────────
    try:
        raw_pnl = await client.list_profit_and_loss()
        snapshot_after = client.extract_pnl_snapshot(raw_pnl)
        pnl_after_path = Path(STATE_DIR) / "pnl-after.json"
        pnl_after_path.write_text(json.dumps(snapshot_after, indent=2), encoding="utf-8")
        logger.info("AFTER P&L snapshot saved")
    except Exception as exc:
        logger.warning("AFTER P&L capture failed: %s", exc)

    return ApprovalResponse(
        file_hash=file_hash,
        results=results,
        clearing_balance=clearing_balance,
        verified=verified,
        attachment=attachment,
    )


# ── GET /status/{file_hash} ───────────────────────────────────────────────────

@app.get("/status/{file_hash}", response_model=StatusResponse)
async def status(file_hash: str):
    """Return the step-map and full audit trail for a file hash."""
    step_ids = idem.get_step_ids(file_hash)
    audit_entries = audit_module.get_trace_panel(file_hash)

    if not step_ids.get("completed_steps") and not audit_entries:
        raise HTTPException(status_code=404, detail=f"No record found for hash: {file_hash}")

    clearing = step_ids.get("clearing_balance")
    return StatusResponse(
        file_hash=file_hash,
        completed_steps=step_ids.get("completed_steps") or [],
        invoice_id=step_ids.get("invoice_id"),
        credit_note_id=step_ids.get("credit_note_id"),
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
        raise HTTPException(status_code=404, detail="No P&L snapshots available. Run the seed first.")

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


# ── GET /dashboard — E4 ───────────────────────────────────────────────────────

@app.get("/dashboard", response_model=DashboardResponse)
async def dashboard():
    """
    Aggregate live Xero reads: trial balance + aged receivables + balance sheet
    + recent payouts from local state. Cached 60 s in-process.
    Returns 503 with source=degraded when Xero is unavailable.
    """
    import time
    global _dashboard_cache

    # Serve cache if fresh
    if _dashboard_cache:
        data, fetched_at = _dashboard_cache
        if time.time() - fetched_at < _CACHE_TTL:
            return data

    client: XeroClient | None = getattr(app.state, "xero", None)
    if not client:
        return _degraded_dashboard()

    try:
        tb_raw, ar_raw, bs_raw = await _fetch_dashboard_reads(client)
        # Extraction must stay inside the try: when the MCP server answers with
        # an error payload the raw values are strings, and extracting from them
        # raised AttributeError -> 500 instead of the promised degraded fallback.
        trial_balance = client.extract_trial_balance_summary(tb_raw)
        aged_raw = client.extract_aged_receivables_summary(ar_raw)
        balance_sheet = client.extract_balance_sheet_summary(bs_raw)
    except Exception as exc:
        logger.warning("Dashboard Xero reads failed: %s", exc)
        return _degraded_dashboard()

    aged_receivables = [
        AgedReceivableEntry(contact=r["contact"], outstanding=r["outstanding"])
        for r in aged_raw
    ]

    recent_payouts = _build_recent_payouts()

    data = DashboardResponse(
        trial_balance=trial_balance,
        aged_receivables=aged_receivables,
        balance_sheet=balance_sheet,
        recent_payouts=recent_payouts,
        fetched_at=datetime.now(timezone.utc).isoformat(),
        source="xero",
    )
    _dashboard_cache = (data, time.time())
    return data


async def _fetch_dashboard_reads(client: XeroClient):
    """Fire trial-balance, aged-receivables, balance-sheet in sequence (rate-aware)."""
    import asyncio
    tb = await client.list_trial_balance()
    ar = await client.list_aged_receivables_by_contact()
    bs = await client.list_report_balance_sheet()
    return tb, ar, bs


def _degraded_dashboard() -> DashboardResponse:
    return DashboardResponse(
        trial_balance={"clearing": "0.00", "fees_expense": "0.00", "revenue": "0.00"},
        aged_receivables=[],
        balance_sheet={"bank": "0.00", "current_assets": "0.00"},
        recent_payouts=_build_recent_payouts(),
        fetched_at=datetime.now(timezone.utc).isoformat(),
        source="degraded",
    )


def _build_recent_payouts() -> list[RecentPayout]:
    try:
        posted_path = Path(STATE_DIR) / "posted.json"
        if not posted_path.exists():
            return []
        raw = json.loads(posted_path.read_text(encoding="utf-8"))
        results = []
        for fhash, entry in list(raw.items())[-10:]:
            results.append(RecentPayout(
                file_hash=fhash,
                completed_steps=entry.get("completed_steps", []),
                clearing_balance=entry.get("clearing_balance"),
            ))
        return list(reversed(results))
    except Exception:
        return []


# ── GET /vat-check — E5 ───────────────────────────────────────────────────────

@app.get("/vat-check", response_model=VatCheckResponse)
async def vat_check():
    """
    Read live tax rates from Xero and confirm golden-path VAT consistency.
    Cached 60 s in-process. Returns source=degraded when Xero unavailable.
    Guardrail: flags only, never advises — wording follows spec 10 §6.
    """
    import time
    global _vat_cache

    if _vat_cache:
        data, fetched_at = _vat_cache
        if time.time() - fetched_at < _CACHE_TTL:
            return data

    client: XeroClient | None = getattr(app.state, "xero", None)
    if not client:
        return _degraded_vat()

    try:
        raw_rates = await client.list_tax_rates()
    except Exception as exc:
        logger.warning("list-tax-rates failed: %s", exc)
        return _degraded_vat()

    org_rates: list[VatRateEntry] = []
    has_none_or_zero = False

    for r in raw_rates:
        name = r.get("Name") or r.get("name") or ""
        rate = str(r.get("TaxType") or r.get("EffectiveRate") or r.get("rate") or "")
        effective = r.get("EffectiveRate") or r.get("effectiveRate")
        try:
            effective_dec = Decimal(str(effective)) if effective is not None else None
        except Exception:
            effective_dec = None

        org_rates.append(VatRateEntry(name=name, rate=rate))

        # "No VAT" / "Zero Rated" / 0% EffectiveRate count as consistent with golden path
        if (
            "none" in name.lower()
            or "no vat" in name.lower()
            or "zero" in name.lower()
            or (effective_dec is not None and effective_dec == Decimal("0"))
        ):
            has_none_or_zero = True

    consistent = has_none_or_zero
    note = (
        "Rates on file: "
        + ", ".join(f"{r.name}" for r in org_rates[:5])
        + ". This payout posted VAT-free — "
        + ("consistent" if consistent else "inconsistent — review required")
        + ". Ask your accountant to confirm treatment."
    )

    data = VatCheckResponse(
        org_rates=org_rates,
        golden_path_tax_type="NONE",
        consistent=consistent,
        note=note,
        fetched_at=datetime.now(timezone.utc).isoformat(),
        source="xero",
    )
    _vat_cache = (data, time.time())
    return data


def _degraded_vat() -> VatCheckResponse:
    return VatCheckResponse(
        org_rates=[
            VatRateEntry(name="Standard Rate (20%)", rate="OUTPUT"),
            VatRateEntry(name="Zero Rated", rate="ZERORATEDOUTPUT"),
            VatRateEntry(name="No VAT", rate="NONE"),
        ],
        golden_path_tax_type="NONE",
        consistent=True,
        note="Xero not connected — illustrative rates shown. Ask your accountant to confirm treatment.",
        fetched_at=datetime.now(timezone.utc).isoformat(),
        source="degraded",
    )


# ── GET /health ───────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check — always 200; degraded state expressed in body."""
    client: XeroClient | None = getattr(app.state, "xero", None)
    if not client:
        return HealthResponse(status="degraded", xero_connected=False, organisation=None)

    try:
        org = await client.list_organisation_details()
        org_name = (
            org.get("Name") or org.get("name")
            or org.get("LegalName") or "Xero Organisation"
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
        Creates accounts, contact, seeded deposits, tracking category.
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
    # Reject anything that isn't a plain hex hash: file_hash is joined into a
    # filesystem path below, so `../`, `/`, `.` etc. must never reach it.
    if not file_hash or len(file_hash) > 64 or any(
        c not in "0123456789abcdef" for c in file_hash
    ):
        raise HTTPException(status_code=404, detail=f"No proposal found for hash: {file_hash}")

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
