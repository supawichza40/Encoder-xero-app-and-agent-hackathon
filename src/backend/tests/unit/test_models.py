"""
Tier 1 unit tests: Models (M1-M10)
No I/O, no Xero.
"""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from backend.models import (
    BookingRow,
    CanonicalPayout,
    JournalPlan,
    PlanStep,
    ProposalResponse,
    ProposalStatus,
    StepKind,
    ApprovalResponse,
)


# ── M1: Valid construction ─────────────────────────────────────────────────
def test_M1_valid_construction():
    p = CanonicalPayout(
        payout_ref="MC-PAYOUT-0407",
        period="16-30 Jun 2026",
        gross=Decimal("1340.00"),
        commission=Decimal("445.90"),
        fees=Decimal("47.10"),
        refunds=Decimal("0.00"),
        net=Decimal("847.00"),
        bookings=[],
    )
    assert p.gross == Decimal("1340.00")
    assert p.net == Decimal("847.00")


# ── M2: Broken invariant raises ────────────────────────────────────────────
def test_M2_broken_invariant_raises():
    with pytest.raises(ValidationError, match="Invariant violation"):
        CanonicalPayout(
            payout_ref="MC-PAYOUT-0407",
            period="Jun 2026",
            gross=Decimal("1340.00"),
            commission=Decimal("445.90"),
            fees=Decimal("47.10"),
            refunds=Decimal("0.00"),
            net=Decimal("846.00"),  # wrong
            bookings=[],
        )


# ── M3: Refunds reduce net ─────────────────────────────────────────────────
def test_M3_refunds_reduce_net():
    p = CanonicalPayout(
        payout_ref="REF",
        period="Jun 2026",
        gross=Decimal("1340.00"),
        commission=Decimal("445.90"),
        fees=Decimal("47.10"),
        refunds=Decimal("10.00"),
        net=Decimal("837.00"),
        bookings=[],
    )
    assert p.net == Decimal("837.00")


# ── M4: All zeros ──────────────────────────────────────────────────────────
def test_M4_all_zeros():
    p = CanonicalPayout(
        payout_ref="REF",
        period="",
        gross=Decimal("0"),
        commission=Decimal("0"),
        fees=Decimal("0"),
        refunds=Decimal("0"),
        net=Decimal("0"),
        bookings=[],
    )
    assert p.net == Decimal("0")


# ── M6: BookingRow construction ────────────────────────────────────────────
def test_M6_booking_row():
    row = BookingRow(
        date="2026-06-17",
        client="Client A",
        client_type="New",
        service="Cut & Colour",
        gross_amount=Decimal("180.00"),
        commission_rate="35%",
        commission=Decimal("63.00"),
    )
    assert row.commission_rate == "35%"
    assert row.gross_amount == Decimal("180.00")


# ── M7: JournalPlan with invariant_check=False ─────────────────────────────
def test_M7_journal_plan_flag():
    plan = JournalPlan(
        steps=[
            PlanStep(kind=StepKind.CREATE_INVOICE, amount=Decimal("100"), account="810"),
        ],
        invariant_check=False,
    )
    assert plan.invariant_check is False


# ── M8: StepKind enum values ────────────────────────────────────────────────
def test_M8_step_kind_values():
    assert StepKind.CREATE_INVOICE.value == "create-invoice"
    assert StepKind.CREATE_BANK_TRANSACTION.value == "create-bank-transaction"
    assert StepKind.CREATE_PAYMENT.value == "create-payment"


# ── M9: ProposalResponse serialisation ────────────────────────────────────
def test_M9_proposal_response_serialisation():
    payout = CanonicalPayout(
        payout_ref="MC",
        period="Jun",
        gross=Decimal("100"),
        commission=Decimal("30"),
        fees=Decimal("10"),
        refunds=Decimal("0"),
        net=Decimal("60"),
        bookings=[],
    )
    resp = ProposalResponse(
        status=ProposalStatus.NEW,
        file_hash="abc",
        payout=payout,
    )
    d = resp.model_dump(mode="json")
    assert d["status"] == "new"
    assert d["payout"]["gross"] == "100"


# ── M10: ApprovalResponse with verified=True ──────────────────────────────
def test_M10_approval_response_verified():
    resp = ApprovalResponse(
        file_hash="abc",
        results=[],
        clearing_balance=Decimal("0.00"),
        verified=True,
    )
    d = resp.model_dump(mode="json")
    assert d["clearing_balance"] == "0.00"
    assert d["verified"] is True
