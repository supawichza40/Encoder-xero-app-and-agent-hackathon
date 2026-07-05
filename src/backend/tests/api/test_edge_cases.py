"""
Tier 2 API edge-case tests (EC1-EC8).
Covers: refund CSV 4-step golden path, full duplicate-via-approve flow,
invariant violation leaves no cached plan, and the balance-check-failure bug.
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import io
import json
from decimal import Decimal
from pathlib import Path

import pytest

import backend.idempotency as idem

REFUND_CSV_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "marketplaceco-payout-2107.csv"
)


@pytest.fixture
def refund_csv() -> bytes:
    return REFUND_CSV_PATH.read_bytes()


def _propose(client, csv_bytes: bytes) -> dict:
    resp = client.post(
        "/propose",
        files={"file": ("payout.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    return resp


def _approve(client, file_hash: str):
    return client.post("/approve", json={"file_hash": file_hash})


# ── EC1: Refund CSV → 4-step plan including create-credit-note ───────────
def test_EC1_refund_csv_four_step_plan(api_client, refund_csv):
    resp = _propose(api_client, refund_csv)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "new"
    assert body["payout"]["refunds"] == "60.00"
    steps = body["plan"]["steps"]
    assert len(steps) == 4
    kinds = [s["kind"] for s in steps]
    assert kinds == [
        "create-invoice", "create-credit-note",
        "create-bank-transaction", "create-payment",
    ]
    # Credit note carries the refund amount
    assert steps[1]["amount"] == "60.00"


# ── EC2: Refund CSV full approve — credit note written, clearing balances ─
def test_EC2_refund_csv_full_approve(api_client, mock_xero, refund_csv):
    mock_xero.create_credit_note.return_value = "CN-0007"

    fh = _propose(api_client, refund_csv).json()["file_hash"]
    resp = _approve(api_client, fh)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["results"]) == 4
    kinds = [r["kind"] for r in body["results"]]
    assert "create-credit-note" in kinds
    credit_note_result = next(r for r in body["results"] if r["kind"] == "create-credit-note")
    assert credit_note_result["xero_id"] == "CN-0007"
    mock_xero.create_credit_note.assert_called_once()

    # Step-map records the credit note id
    ids = idem.get_step_ids(fh)
    assert ids["credit_note_id"] == "CN-0007"


# ── EC3: Invariant violation → 422, and no plan/proposal is cached ────────
def test_EC3_invariant_violation_leaves_no_cached_plan(api_client, golden_csv):
    tampered = golden_csv.replace(b"847.00", b"846.00", 1)
    resp = _propose(api_client, tampered)
    assert resp.status_code == 422

    # No plan means /approve for this content's hash must 404, not 409/200
    file_hash = idem.compute_file_hash(tampered)
    approve_resp = _approve(api_client, file_hash)
    assert approve_resp.status_code == 404


# ── EC4: Full duplicate-via-approve flow (not manual idem simulation) ────
def test_EC4_full_duplicate_flow_via_real_approve(api_client, golden_csv):
    fh = _propose(api_client, golden_csv).json()["file_hash"]
    approve_resp = _approve(api_client, fh)
    assert approve_resp.status_code == 200

    # Re-propose the identical file — must report already-posted with the
    # real IDs produced by the actual approve() call (not manually injected).
    resp2 = _propose(api_client, golden_csv)
    assert resp2.status_code == 200
    body2 = resp2.json()
    assert body2["status"] == "already-posted"
    assert body2["existing_ids"]["invoice_id"] == "INV-0042"
    assert body2["existing_ids"]["bank_txn_id"] == "BT-0117"
    assert body2["existing_ids"]["payment_id"] == "PMT-0089"


# ── EC5: Malformed CSV (missing summary header) → 400 ─────────────────────
def test_EC5_malformed_csv_wrong_header_400(api_client):
    bad = b"NotThePayoutHeader,Foo\nabc,def\n"
    resp = _propose(api_client, bad)
    assert resp.status_code == 400
    assert "CSV parse error" in resp.json()["detail"]


# ── EC6: BUG — verification-read failure must NOT be reported as verified ─
def test_EC6_balance_check_failure_not_reported_verified(api_client, mock_xero, golden_csv):
    """
    Root cause: approve() wraps the post-write verification read in a bare
    except that defaults clearing_balance to Decimal("0") on failure, which
    then evaluates verified = (clearing_balance == Decimal("0.00")) as True.
    A failed read must never be silently reported as a passed verification.
    """
    mock_xero.get_clearing_balance.side_effect = Exception("Xero read timeout")

    fh = _propose(api_client, golden_csv).json()["file_hash"]
    resp = _approve(api_client, fh)
    assert resp.status_code == 200
    body = resp.json()
    assert body["verified"] is False, (
        "A failed clearing-balance read must not be reported as verified=True"
    )


# ── EC7: Xero write failure at step 1 (not step 2) — no steps recorded ────
def test_EC7_write_failure_at_step1_no_steps_recorded(api_client, mock_xero, golden_csv):
    mock_xero.create_invoice.side_effect = Exception("Xero unavailable")

    fh = _propose(api_client, golden_csv).json()["file_hash"]
    resp = _approve(api_client, fh)
    assert resp.status_code == 503

    ids = idem.get_step_ids(fh)
    assert ids["completed_steps"] == []


# ── EC8: Crash mid-approve never double-posts create-invoice ─────────────
def test_EC8_resume_never_double_posts_invoice(api_client, mock_xero, golden_csv):
    fh = _propose(api_client, golden_csv).json()["file_hash"]
    idem.record_step(fh, "create-invoice", "INV-FROM-CRASH")

    resp = _approve(api_client, fh)
    assert resp.status_code == 200
    mock_xero.create_invoice.assert_not_called()

    # create_payment must use the invoice id recorded before the crash
    call_kwargs = mock_xero.create_payment.call_args.kwargs
    assert call_kwargs["invoice_id"] == "INV-FROM-CRASH"
