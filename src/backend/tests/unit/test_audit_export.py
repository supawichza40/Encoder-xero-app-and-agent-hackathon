"""
Tier 1 unit tests: audit export + evidence pack (PRI-1, PRI-2)
Uses tmp_state fixture (from tests/conftest.py) for isolated state dir.
"""

import csv
import io
import json

import pytest

from backend.audit_export import build_evidence_pack, entries_to_csv, load_audit_entries


# ── Empty audit.json ──────────────────────────────────────────────────────
def test_empty_audit_returns_empty_list(tmp_state):
    assert load_audit_entries(tmp_state) == []


def test_empty_audit_csv_has_only_header(tmp_state):
    csv_text = entries_to_csv([], tmp_state)
    rows = list(csv.reader(io.StringIO(csv_text)))
    assert rows == [["timestamp", "action", "payout_ref", "xero_id", "status", "summary"]]


# ── CSV correctness — comma-in-summary round-trips ────────────────────────
def test_csv_summary_with_comma_round_trips(tmp_state):
    entries = [
        {
            "timestamp": "2026-07-04T15:30:00Z",
            "file_hash": "abc123",
            "action": "create-invoice",
            "request": {"reference": "MC, INC"},
            "xero_id": "INV-001",
            "status": "success",
        }
    ]
    csv_text = entries_to_csv(entries, tmp_state)
    rows = list(csv.reader(io.StringIO(csv_text)))
    assert len(rows) == 2
    header, row = rows
    assert header == ["timestamp", "action", "payout_ref", "xero_id", "status", "summary"]
    # The comma inside the value must not have split into an extra column
    assert row == [
        "2026-07-04T15:30:00Z",
        "create-invoice",
        "",
        "INV-001",
        "success",
        "reference=MC, INC",
    ]


# ── payout_ref lookup ──────────────────────────────────────────────────────
def test_payout_ref_lookup_when_proposal_exists(tmp_state):
    proposals_dir = tmp_state / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    file_hash = "a" * 64
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps({"payout": {"payout_ref": "MC-PAYOUT-0407"}}), encoding="utf-8"
    )
    entries = [
        {
            "timestamp": "t",
            "file_hash": file_hash,
            "action": "create-invoice",
            "request": {},
            "xero_id": "INV-001",
            "status": "success",
        }
    ]
    csv_text = entries_to_csv(entries, tmp_state)
    rows = list(csv.reader(io.StringIO(csv_text)))
    assert rows[1][2] == "MC-PAYOUT-0407"


def test_payout_ref_empty_when_proposal_missing(tmp_state):
    entries = [
        {
            "timestamp": "t",
            "file_hash": "b" * 64,
            "action": "create-invoice",
            "request": {},
            "xero_id": "INV-001",
            "status": "success",
        }
    ]
    csv_text = entries_to_csv(entries, tmp_state)
    rows = list(csv.reader(io.StringIO(csv_text)))
    assert rows[1][2] == ""


# ── build_evidence_pack — fully populated ─────────────────────────────────
def _seed_posted_and_proposal(state_dir, file_hash, posted_entry, payout):
    (state_dir / "posted.json").write_text(
        json.dumps({file_hash: posted_entry}), encoding="utf-8"
    )
    proposals_dir = state_dir / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps({"payout": payout}), encoding="utf-8"
    )


def test_build_evidence_pack_fully_populated_verified_true(tmp_state):
    file_hash = "c" * 64
    _seed_posted_and_proposal(
        tmp_state,
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

    pack = build_evidence_pack(tmp_state, file_hash)
    assert pack is not None
    assert pack["payout_ref"] == "MC-PAYOUT-0407"
    assert pack["csv_sha256"] == file_hash
    assert pack["xero_ids"] == {
        "invoice_id": "INV-0042",
        "bank_txn_id": "BT-0117",
        "payment_id": "PMT-0089",
        "credit_note_id": None,
    }
    assert pack["amounts"] == {
        "gross": "1340.00",
        "commission": "445.90",
        "fees": "47.10",
        "refunds": "0.00",
        "net": "847.00",
    }
    assert pack["clearing_balance"] == "0.00"
    assert pack["verified"] is True
    assert "generated_at" in pack and pack["generated_at"].endswith("Z")


# ── Unknown hash → None ───────────────────────────────────────────────────
def test_build_evidence_pack_unknown_hash_returns_none(tmp_state):
    (tmp_state / "posted.json").write_text("{}", encoding="utf-8")
    assert build_evidence_pack(tmp_state, "d" * 64) is None


# ── Malformed hash → None (path traversal guard) ──────────────────────────
@pytest.mark.parametrize(
    "bad_hash",
    ["../../etc/passwd", "not-hex!!", "a" * 65, "", "abc/def"],
)
def test_build_evidence_pack_malformed_hash_returns_none(tmp_state, bad_hash):
    assert build_evidence_pack(tmp_state, bad_hash) is None


# ── Missing proposal for a known posted hash → None (defensive) ──────────
def test_build_evidence_pack_missing_proposal_returns_none(tmp_state):
    file_hash = "e" * 64
    (tmp_state / "posted.json").write_text(
        json.dumps({file_hash: {"invoice_id": "INV-1", "clearing_balance": "0.00"}}),
        encoding="utf-8",
    )
    assert build_evidence_pack(tmp_state, file_hash) is None


# ── Refund path — credit_note_id populated ────────────────────────────────
def test_build_evidence_pack_refund_path_credit_note_populated(tmp_state):
    file_hash = "f" * 64
    _seed_posted_and_proposal(
        tmp_state,
        file_hash,
        posted_entry={
            "invoice_id": "INV-1",
            "credit_note_id": "CN-0003",
            "bank_txn_id": "BT-1",
            "payment_id": "PMT-1",
            "clearing_balance": "0.00",
        },
        payout={
            "payout_ref": "MC-PAYOUT-2107",
            "gross": "1340.00",
            "commission": "445.90",
            "fees": "47.10",
            "refunds": "50.00",
            "net": "797.00",
        },
    )
    pack = build_evidence_pack(tmp_state, file_hash)
    assert pack is not None
    assert pack["xero_ids"]["credit_note_id"] == "CN-0003"


def test_build_evidence_pack_no_refund_credit_note_null(tmp_state):
    file_hash = "1" * 64
    _seed_posted_and_proposal(
        tmp_state,
        file_hash,
        posted_entry={
            "invoice_id": "INV-1",
            "bank_txn_id": "BT-1",
            "payment_id": "PMT-1",
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
    pack = build_evidence_pack(tmp_state, file_hash)
    assert pack is not None
    assert pack["xero_ids"]["credit_note_id"] is None


# ── Not verified when clearing balance is nonzero / absent ────────────────
def test_build_evidence_pack_not_verified_when_balance_nonzero(tmp_state):
    file_hash = "2" * 64
    _seed_posted_and_proposal(
        tmp_state,
        file_hash,
        posted_entry={"invoice_id": "INV-1", "clearing_balance": "12.34"},
        payout={
            "payout_ref": "MC-PAYOUT-0407",
            "gross": "1340.00",
            "commission": "445.90",
            "fees": "47.10",
            "refunds": "0.00",
            "net": "847.00",
        },
    )
    pack = build_evidence_pack(tmp_state, file_hash)
    assert pack is not None
    assert pack["verified"] is False


def test_build_evidence_pack_not_verified_when_balance_never_recorded(tmp_state):
    file_hash = "3" * 64
    _seed_posted_and_proposal(
        tmp_state,
        file_hash,
        posted_entry={"invoice_id": "INV-1"},
        payout={
            "payout_ref": "MC-PAYOUT-0407",
            "gross": "1340.00",
            "commission": "445.90",
            "fees": "47.10",
            "refunds": "0.00",
            "net": "847.00",
        },
    )
    pack = build_evidence_pack(tmp_state, file_hash)
    assert pack is not None
    assert pack["verified"] is False
