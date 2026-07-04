"""
Tier 2 API tests: GET /status/{file_hash}  (AS1-AS5)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import io
import json
from decimal import Decimal

import pytest

import backend.idempotency as idem
import backend.audit as audit_mod


def _propose(client, golden_csv: bytes) -> str:
    resp = client.post(
        "/propose",
        files={"file": ("payout.csv", io.BytesIO(golden_csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["file_hash"]


def _approve(client, file_hash: str):
    return client.post("/approve", json={"file_hash": file_hash})


# ── AS1: Status after full approve ────────────────────────────────────────
def test_AS1_status_after_full_approve(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    _approve(api_client, fh)

    resp = api_client.get(f"/status/{fh}")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["completed_steps"]) == 3
    assert "create-invoice" in body["completed_steps"]
    assert "create-bank-transaction" in body["completed_steps"]
    assert "create-payment" in body["completed_steps"]


# ── AS2: Status with partial completion ───────────────────────────────────
def test_AS2_status_partial_completion(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    # Record only step 1
    idem.record_step(fh, "create-invoice", "INV-PARTIAL")

    resp = api_client.get(f"/status/{fh}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["completed_steps"] == ["create-invoice"]
    assert body["invoice_id"] == "INV-PARTIAL"
    assert body["bank_txn_id"] is None
    assert body["payment_id"] is None


# ── AS3: Status for unknown hash → 404 ───────────────────────────────────
def test_AS3_unknown_hash_404(api_client):
    resp = api_client.get("/status/totally_unknown_hash_xyz")
    assert resp.status_code == 404


# ── AS4: Audit entries included in response ───────────────────────────────
def test_AS4_audit_entries_included(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    _approve(api_client, fh)

    resp = api_client.get(f"/status/{fh}")
    assert resp.status_code == 200
    entries = resp.json()["audit_entries"]
    assert isinstance(entries, list)
    assert len(entries) >= 3
    actions = [e["action"] for e in entries]
    assert "create-invoice" in actions


# ── AS5: Clearing balance included when recorded ──────────────────────────
def test_AS5_clearing_balance_recorded(api_client, golden_csv):
    fh = _propose(api_client, golden_csv)
    # Record steps + clearing balance directly
    idem.record_step(fh, "create-invoice", "INV-001")
    idem.record_step(fh, "create-bank-transaction", "BT-001")
    idem.record_step(fh, "create-payment", "PMT-001")
    idem.record_clearing_balance(fh, "0.00")

    resp = api_client.get(f"/status/{fh}")
    assert resp.status_code == 200
    assert resp.json()["clearing_balance"] == "0.00"
