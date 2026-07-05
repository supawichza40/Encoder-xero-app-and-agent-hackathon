"""
Tier 2 API tests: GET /evidence-pack/{file_hash}  (PRI-2)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import json

import pytest


def _seed_posted_and_proposal(tmp_path, file_hash, posted_entry, payout):
    (tmp_path / "posted.json").write_text(json.dumps({file_hash: posted_entry}), encoding="utf-8")
    proposals_dir = tmp_path / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps({"payout": payout}), encoding="utf-8"
    )


# ── Known, fully-posted hash → 200 with exact shape ───────────────────────
def test_evidence_pack_known_hash_200(api_client, tmp_path):
    file_hash = "a" * 64
    _seed_posted_and_proposal(
        tmp_path,
        file_hash,
        posted_entry={
            "invoice_id": "INV-0042",
            "bank_txn_id": "BT-0117",
            "payment_id": "PMT-0089",
            "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"],
            "clearing_balance": "0.00",
        },
        payout={
            "payout_ref": "MC-PAYOUT-0407",
            "gross": "1340.00",
            "commission": "445.90",
            "fees": "47.10",
            "refunds": "0.00",
            "net": "847.00",
        },
    )

    resp = api_client.get(f"/evidence-pack/{file_hash}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["payout_ref"] == "MC-PAYOUT-0407"
    assert body["csv_sha256"] == file_hash
    assert body["xero_ids"] == {
        "invoice_id": "INV-0042",
        "bank_txn_id": "BT-0117",
        "payment_id": "PMT-0089",
        "credit_note_id": None,
    }
    assert body["amounts"] == {
        "gross": "1340.00",
        "commission": "445.90",
        "fees": "47.10",
        "refunds": "0.00",
        "net": "847.00",
    }
    assert body["clearing_balance"] == "0.00"
    assert body["verified"] is True
    assert "generated_at" in body


# ── Unknown hash → 404 with exact detail message ──────────────────────────
def test_evidence_pack_unknown_hash_404(api_client):
    resp = api_client.get(f"/evidence-pack/{'b' * 64}")
    assert resp.status_code == 404
    assert resp.json() == {"detail": "no posted statement with that hash"}


# ── Malformed hash → 404 (path traversal guard), never 500 ───────────────
def test_evidence_pack_malformed_hash_404(api_client):
    resp = api_client.get("/evidence-pack/not-a-valid-hash!!")
    assert resp.status_code == 404
    assert resp.json() == {"detail": "no posted statement with that hash"}


# ── End-to-end via propose/approve ────────────────────────────────────────
def test_evidence_pack_after_approve(api_client, golden_csv):
    import io

    fh_resp = api_client.post(
        "/propose", files={"file": ("payout.csv", io.BytesIO(golden_csv), "text/csv")}
    )
    file_hash = fh_resp.json()["file_hash"]
    approve_resp = api_client.post("/approve", json={"file_hash": file_hash})
    assert approve_resp.status_code == 200

    resp = api_client.get(f"/evidence-pack/{file_hash}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["csv_sha256"] == file_hash
    assert body["verified"] is True
    assert body["clearing_balance"] == "0.00"
