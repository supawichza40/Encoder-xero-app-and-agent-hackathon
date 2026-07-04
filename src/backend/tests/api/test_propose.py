"""
Tier 2 API tests: POST /propose  (AP1-AP10)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import io
import json
from decimal import Decimal

import pytest

import backend.idempotency as idem


def _upload(client, data: bytes, filename: str = "payout.csv", content_type: str = "text/csv"):
    return client.post(
        "/propose",
        files={"file": (filename, io.BytesIO(data), content_type)},
    )


# ── AP1: Golden CSV → 200 new ──────────────────────────────────────────────
def test_AP1_golden_csv_new(api_client, golden_csv):
    resp = _upload(api_client, golden_csv)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "new"
    assert "file_hash" in body
    assert body["file_hash"]  # non-empty
    assert body["payout"]["gross"] == "1340.00"


# ── AP2: Response plan has 3 steps ────────────────────────────────────────
def test_AP2_plan_has_three_steps(api_client, golden_csv):
    resp = _upload(api_client, golden_csv)
    assert resp.status_code == 200
    steps = resp.json()["plan"]["steps"]
    assert len(steps) == 3
    kinds = [s["kind"] for s in steps]
    assert kinds == ["create-invoice", "create-bank-transaction", "create-payment"]


# ── AP3: Amounts are strings (Decimal serialisation) ──────────────────────
def test_AP3_amounts_are_strings(api_client, golden_csv):
    resp = _upload(api_client, golden_csv)
    assert resp.status_code == 200
    payout = resp.json()["payout"]
    assert isinstance(payout["gross"], str)
    assert payout["gross"] == "1340.00"
    assert payout["net"] == "847.00"
    assert payout["commission"] == "445.90"
    assert payout["fees"] == "47.10"


# ── AP4: Duplicate upload after all steps → already-posted ────────────────
def test_AP4_duplicate_returns_already_posted(api_client, golden_csv):
    resp = _upload(api_client, golden_csv)
    file_hash = resp.json()["file_hash"]

    # Simulate all 3 steps having completed
    idem.record_step(file_hash, "create-invoice", "INV-001")
    idem.record_step(file_hash, "create-bank-transaction", "BT-001")
    idem.record_step(file_hash, "create-payment", "PMT-001")

    # Re-upload same file
    resp2 = _upload(api_client, golden_csv)
    assert resp2.status_code == 200
    body2 = resp2.json()
    assert body2["status"] == "already-posted"
    assert body2["existing_ids"] is not None
    assert "invoice_id" in body2["existing_ids"]


# ── AP5: Garbage CSV → 400 ────────────────────────────────────────────────
def test_AP5_garbage_csv_400(api_client):
    resp = _upload(api_client, b"this is not a csv at all!!!")
    assert resp.status_code == 400
    assert "CSV parse error" in resp.json()["detail"]


# ── AP6: Tampered net (invariant violation) → 422 ─────────────────────────
def test_AP6_invariant_violation_422(api_client, golden_csv):
    # Replace "847.00" with "846.00" in the summary row
    tampered = golden_csv.replace(b"847.00", b"846.00", 1)
    resp = _upload(api_client, tampered)
    assert resp.status_code in (400, 422)
    assert "Invariant violation" in resp.json()["detail"] or "846" in resp.json()["detail"]


# ── AP7: Non-CSV file → 400 ───────────────────────────────────────────────
def test_AP7_non_csv_400(api_client, golden_csv):
    resp = _upload(api_client, b"some content", filename="report.txt", content_type="text/plain")
    assert resp.status_code == 400


# ── AP8: Empty file → 400 ─────────────────────────────────────────────────
def test_AP8_empty_file_400(api_client):
    resp = _upload(api_client, b"")
    assert resp.status_code == 400


# ── AP9: Bookings list has 9 items ────────────────────────────────────────
def test_AP9_bookings_count(api_client, golden_csv):
    resp = _upload(api_client, golden_csv)
    assert resp.status_code == 200
    bookings = resp.json()["payout"]["bookings"]
    assert isinstance(bookings, list)
    assert len(bookings) == 9


# ── AP10: existing_ids is null for new file ───────────────────────────────
def test_AP10_existing_ids_null_for_new(api_client, golden_csv):
    resp = _upload(api_client, golden_csv)
    assert resp.status_code == 200
    assert resp.json()["existing_ids"] is None
