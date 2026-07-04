"""
Tier 1 unit tests: Idempotency (ID1-ID10)
Uses tmp_state fixture for isolated posted.json.
"""

import hashlib
from decimal import Decimal

import pytest

from backend.idempotency import (
    check_already_posted,
    compute_file_hash,
    get_remaining_steps,
    get_step_ids,
    record_step,
)
from backend.models import CanonicalPayout, JournalPlan, StepKind
from backend.planner import create_plan


@pytest.fixture
def golden_payout() -> CanonicalPayout:
    return CanonicalPayout(
        payout_ref="MC-PAYOUT-0407",
        period="Jun",
        gross=Decimal("1340.00"),
        commission=Decimal("445.90"),
        fees=Decimal("47.10"),
        refunds=Decimal("0.00"),
        net=Decimal("847.00"),
        bookings=[],
    )


@pytest.fixture
def golden_plan(golden_payout) -> JournalPlan:
    return create_plan(golden_payout)


# ── ID1: Hash is deterministic ────────────────────────────────────────────
def test_ID1_deterministic(tmp_state):
    data = b"hello world"
    assert compute_file_hash(data) == compute_file_hash(data)
    assert compute_file_hash(data) != compute_file_hash(b"other")


# ── ID2: Hash matches hashlib ─────────────────────────────────────────────
def test_ID2_matches_hashlib(tmp_state):
    data = b"test file bytes"
    assert compute_file_hash(data) == hashlib.sha256(data).hexdigest()


# ── ID3: New file returns None ────────────────────────────────────────────
def test_ID3_new_file_none(tmp_state):
    h = compute_file_hash(b"new file")
    assert check_already_posted(h) is None


# ── ID4: Record step 1, 2 remain ──────────────────────────────────────────
def test_ID4_record_step1_two_remain(tmp_state, golden_plan):
    h = "testhash"
    record_step(h, StepKind.CREATE_INVOICE.value, "INV-001")
    remaining = get_remaining_steps(h, golden_plan)
    assert len(remaining) == 2
    assert remaining[0].kind == StepKind.CREATE_BANK_TRANSACTION


# ── ID5: All 3 steps recorded ─────────────────────────────────────────────
def test_ID5_all_steps_recorded(tmp_state, golden_plan):
    h = "fullhash"
    record_step(h, StepKind.CREATE_INVOICE.value, "INV-001")
    record_step(h, StepKind.CREATE_BANK_TRANSACTION.value, "BT-002")
    record_step(h, StepKind.CREATE_PAYMENT.value, "PMT-003")
    existing = check_already_posted(h)
    assert existing is not None
    assert existing["invoice_id"] == "INV-001"
    assert existing["bank_txn_id"] == "BT-002"
    assert existing["payment_id"] == "PMT-003"


# ── ID6: All steps recorded → none remaining ──────────────────────────────
def test_ID6_no_remaining_after_all(tmp_state, golden_plan):
    h = "complete"
    for kind, xid in [
        (StepKind.CREATE_INVOICE.value, "INV-001"),
        (StepKind.CREATE_BANK_TRANSACTION.value, "BT-002"),
        (StepKind.CREATE_PAYMENT.value, "PMT-003"),
    ]:
        record_step(h, kind, xid)
    assert get_remaining_steps(h, golden_plan) == []


# ── ID7: Crash recovery — steps 1+2 done, only 3 remains ─────────────────
def test_ID7_crash_recovery(tmp_state, golden_plan):
    h = "partial"
    record_step(h, StepKind.CREATE_INVOICE.value, "INV-001")
    record_step(h, StepKind.CREATE_BANK_TRANSACTION.value, "BT-002")
    remaining = get_remaining_steps(h, golden_plan)
    assert len(remaining) == 1
    assert remaining[0].kind == StepKind.CREATE_PAYMENT


# ── ID8: Two hashes tracked independently ────────────────────────────────
def test_ID8_independent_hashes(tmp_state, golden_plan):
    h1, h2 = "hash_one", "hash_two"
    record_step(h1, StepKind.CREATE_INVOICE.value, "INV-001")
    assert check_already_posted(h2) is None
    assert len(get_remaining_steps(h1, golden_plan)) == 2
    assert len(get_remaining_steps(h2, golden_plan)) == 3


# ── ID9: Data persists across calls ───────────────────────────────────────
def test_ID9_persists(tmp_state, golden_plan):
    h = "persist_me"
    record_step(h, StepKind.CREATE_INVOICE.value, "INV-XYZ")
    # Simulate "new call" — re-read from disk
    existing = check_already_posted(h)
    assert existing is not None
    assert existing.get("invoice_id") == "INV-XYZ"


# ── ID10: Duplicate record_step is safe ───────────────────────────────────
def test_ID10_duplicate_safe(tmp_state):
    h = "dup_test"
    record_step(h, StepKind.CREATE_INVOICE.value, "INV-001")
    record_step(h, StepKind.CREATE_INVOICE.value, "INV-001")
    ids = get_step_ids(h)
    assert ids["completed_steps"].count(StepKind.CREATE_INVOICE.value) == 1
