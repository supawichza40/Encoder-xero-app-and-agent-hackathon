"""
Tier 2 API tests: POST /approve  (AA1-AA12)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import io
import json
from decimal import Decimal
from pathlib import Path

import pytest

import backend.idempotency as idem


def _propose(client, golden_csv: bytes) -> str:
    """Propose the golden CSV and return the file_hash."""
    resp = client.post(
        "/propose",
        files={"file": ("payout.csv", io.BytesIO(golden_csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["file_hash"]


def _approve(client, file_hash: str):
    return client.post("/approve", json={"file_hash": file_hash})


# ── AA1: Golden path → 200 + 3 success results + verified ─────────────────
def test_AA1_golden_path(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["results"]) == 3
    for r in body["results"]:
        assert r["status"] == "success"
    assert body["clearing_balance"] == "0.00"
    assert body["verified"] is True


# ── AA2: Results contain Xero IDs from the mock ───────────────────────────
def test_AA2_results_contain_xero_ids(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert results[0]["xero_id"] == "INV-0042"
    assert results[1]["xero_id"] == "BT-0117"
    assert results[2]["xero_id"] == "PMT-0089"


# ── AA3: Unknown hash → 404 ───────────────────────────────────────────────
def test_AA3_unknown_hash_404(api_client):
    resp = _approve(api_client, "nonexistent_hash_abc123")
    assert resp.status_code == 404


# ── AA4: Already-completed → 409 ─────────────────────────────────────────
def test_AA4_already_completed_409(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    # First approve succeeds
    resp1 = _approve(api_client, fh)
    assert resp1.status_code == 200
    # Second approve → conflict
    resp2 = _approve(api_client, fh)
    assert resp2.status_code == 409


# ── AA5: Crash recovery — step 1 already done ─────────────────────────────
def test_AA5_crash_recovery_step1_done(api_client, mock_xero, golden_csv):
    fh = _propose(api_client, golden_csv)

    # Simulate crash after step 1
    idem.record_step(fh, "create-invoice", "INV-PRIOR")

    resp = _approve(api_client, fh)
    assert resp.status_code == 200

    # create_invoice must NOT have been called again
    mock_xero.create_invoice.assert_not_called()
    # create_bank_transaction and create_payment were executed
    mock_xero.create_bank_transaction.assert_called_once()
    mock_xero.create_payment.assert_called_once()


# ── AA6: Crash recovery — steps 1+2 already done ─────────────────────────
def test_AA6_crash_recovery_steps_1_2_done(api_client, mock_xero, golden_csv):
    fh = _propose(api_client, golden_csv)

    # Simulate crash after steps 1 and 2
    idem.record_step(fh, "create-invoice", "INV-PRIOR")
    idem.record_step(fh, "create-bank-transaction", "BT-PRIOR")

    resp = _approve(api_client, fh)
    assert resp.status_code == 200

    mock_xero.create_invoice.assert_not_called()
    mock_xero.create_bank_transaction.assert_not_called()
    mock_xero.create_payment.assert_called_once()


# ── AA7: Xero write fails on step 2 → 503 ────────────────────────────────
def test_AA7_xero_write_failure_503(api_client, mock_xero, golden_csv):
    # Make step 2 raise
    mock_xero.create_bank_transaction.side_effect = Exception("Xero timeout")

    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 503
    assert "step 2" in resp.json()["detail"].lower() or "bank" in resp.json()["detail"].lower()


# ── AA8: Partial failure — step 1 recorded, step 2 not ───────────────────
def test_AA8_partial_failure_records_step1(api_client, mock_xero, golden_csv):
    mock_xero.create_bank_transaction.side_effect = Exception("Xero timeout")

    fh = _propose(api_client, golden_csv)
    _approve(api_client, fh)  # triggers the 503

    # Step 1 must be persisted, step 2 must not
    ids = idem.get_step_ids(fh)
    assert "create-invoice" in ids["completed_steps"]
    assert "create-bank-transaction" not in ids["completed_steps"]


# ── AA9: P&L AFTER snapshot saved after successful approve ────────────────
def test_AA9_pnl_after_snapshot_saved(api_client, golden_csv, tmp_path):
    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200

    pnl_after = tmp_path / "pnl-after.json"
    assert pnl_after.exists()
    data = json.loads(pnl_after.read_text())
    assert "revenue" in data


# ── AA10: create_payment receives invoice_id from step 1 ──────────────────
def test_AA10_create_payment_gets_invoice_id(api_client, mock_xero, golden_csv):
    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200

    call_kwargs = mock_xero.create_payment.call_args.kwargs
    assert call_kwargs["invoice_id"] == "INV-0042"


# ── AA11: Non-zero clearing balance → verified=false ─────────────────────
def test_AA11_non_zero_balance_not_verified(api_client, mock_xero, golden_csv):
    mock_xero.get_clearing_balance.return_value = Decimal("0.01")

    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200
    body = resp.json()
    assert body["verified"] is False
    assert body["clearing_balance"] == "0.01"


# ── AA13: invoice is authorised after creation, before the payment step ───
def test_AA13_invoice_authorised_before_payment(api_client, mock_xero, golden_csv):
    """MCP creates the invoice DRAFT; the executor must authorise it via raw
    REST (DRAFT invoices post nothing to the ledger and cannot take a payment).
    The invoice line must post to real revenue (Sales, 200) and the payment
    must settle the full gross INTO Platform Clearing (092)."""
    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200

    mock_xero.authorise_invoice.assert_called_once_with("INV-0042")

    invoice_kwargs = mock_xero.create_invoice.call_args.kwargs
    assert invoice_kwargs["account_code"] == "200"          # revenue, not clearing

    payment_kwargs = mock_xero.create_payment.call_args.kwargs
    assert payment_kwargs["account_code"] == "092"          # INTO Platform Clearing
    assert payment_kwargs["amount"] == Decimal("1340.00")   # gross settles invoice


# ── AA14: authorise failure fails step 1 loudly — nothing recorded ─────────
def test_AA14_authorise_failure_fails_step1(api_client, mock_xero, golden_csv):
    from backend.xero_client import XeroMCPError

    mock_xero.authorise_invoice.side_effect = XeroMCPError("authorise failed: 400")

    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 503
    assert "step 1" in resp.json()["detail"].lower()

    # Step 1 must NOT be recorded complete — a DRAFT invoice is not a done step
    ids = idem.get_step_ids(fh)
    assert "create-invoice" not in ids["completed_steps"]
    # And no later step may have run
    mock_xero.create_bank_transaction.assert_not_called()
    mock_xero.create_payment.assert_not_called()


# ── AA12: attach_file failure is non-fatal (E2) — approve still 200/success ─
def test_AA12_attachment_failure_is_non_fatal(api_client, mock_xero, golden_csv):
    """
    attach_file raising must not fail the approve() call or any of the 3
    Xero-write results — it is a best-effort extra, reported via the
    `attachment` field with status="failed", not surfaced as an error.
    """
    mock_xero.attach_file.side_effect = Exception("attachment upload failed")

    fh = _propose(api_client, golden_csv)
    resp = _approve(api_client, fh)
    assert resp.status_code == 200
    body = resp.json()

    assert len(body["results"]) == 3
    for r in body["results"]:
        assert r["status"] == "success"
    assert body["verified"] is True

    assert body["attachment"] is not None
    assert body["attachment"]["status"] == "failed"
    assert body["attachment"]["invoice_id"] == "INV-0042"
