"""
Tier 1 unit tests: Planner (PL1-PL9)
"""

from decimal import Decimal

import pytest

from backend.models import CanonicalPayout, StepKind
from backend.planner import create_plan


def _broken_payout() -> CanonicalPayout:
    """
    Build a CanonicalPayout that violates gross - commission - fees - refunds == net
    by bypassing the Pydantic model validator (model_construct skips validation).
    This simulates a payout that slips past the model layer so we can test
    the planner's own defence-in-depth guard at planner.py:33-37.
    """
    return CanonicalPayout.model_construct(
        payout_ref="MC-PAYOUT-0407",
        period="16-30 Jun 2026",
        gross=Decimal("1340.00"),
        commission=Decimal("445.90"),
        fees=Decimal("47.10"),
        refunds=Decimal("0.00"),
        net=Decimal("999.00"),   # correct value is 847.00
        bookings=[],
    )


def _golden_payout() -> CanonicalPayout:
    return CanonicalPayout(
        payout_ref="MC-PAYOUT-0407",
        period="16-30 Jun 2026",
        gross=Decimal("1340.00"),
        commission=Decimal("445.90"),
        fees=Decimal("47.10"),
        refunds=Decimal("0.00"),
        net=Decimal("847.00"),
        bookings=[],
    )


# ── PL1: 3 steps ──────────────────────────────────────────────────────────
def test_PL1_three_steps():
    plan = create_plan(_golden_payout())
    assert len(plan.steps) == 3


# ── PL2: Step 1 is create-invoice ─────────────────────────────────────────
def test_PL2_step1_invoice():
    plan = create_plan(_golden_payout())
    s = plan.steps[0]
    assert s.kind == StepKind.CREATE_INVOICE
    assert s.amount == Decimal("1340.00")
    assert s.account == "Platform Clearing"


# ── PL3: Step 2 is create-bank-transaction ────────────────────────────────
def test_PL3_step2_bank_txn():
    plan = create_plan(_golden_payout())
    s = plan.steps[1]
    assert s.kind == StepKind.CREATE_BANK_TRANSACTION
    assert s.amount == Decimal("493.00")
    assert s.lines is not None and len(s.lines) == 2


# ── PL4: Step 2 fee lines correct ─────────────────────────────────────────
def test_PL4_fee_lines():
    plan = create_plan(_golden_payout())
    lines = plan.steps[1].lines
    assert lines[0].amount == Decimal("445.90")
    assert lines[1].amount == Decimal("47.10")
    assert "commission" in lines[0].description.lower()
    assert "fee" in lines[1].description.lower()


# ── PL5: Step 3 is create-payment ─────────────────────────────────────────
def test_PL5_step3_payment():
    plan = create_plan(_golden_payout())
    s = plan.steps[2]
    assert s.kind == StepKind.CREATE_PAYMENT
    assert s.amount == Decimal("847.00")
    assert s.clears == "MC-PAYOUT-0407"


# ── PL6: invariant_check is True ──────────────────────────────────────────
def test_PL6_invariant_true():
    plan = create_plan(_golden_payout())
    assert plan.invariant_check is True


# ── PL7: Step amounts sum correctly ───────────────────────────────────────
def test_PL7_amounts_balance():
    plan = create_plan(_golden_payout())
    assert plan.steps[0].amount - plan.steps[1].amount == plan.steps[2].amount


# ── PL8: Zero-refund payout ────────────────────────────────────────────────
def test_PL8_zero_refund():
    payout = _golden_payout()
    plan = create_plan(payout)
    # With refunds=0, only 2 fee lines
    assert len(plan.steps[1].lines) == 2


# ── PL9: Non-zero refund produces 4-step plan with credit-note (E1) ───────
def test_PL9_nonzero_refund():
    """When refunds > 0 the planner emits 4 steps:
    invoice → credit-note → bank-txn → payment.
    Bank-txn amount is commission + fees only (refunds handled by credit-note).
    """
    from backend.models import StepKind

    payout = CanonicalPayout(
        payout_ref="REF",
        period="Jun",
        gross=Decimal("1000.00"),
        commission=Decimal("300.00"),
        fees=Decimal("50.00"),
        refunds=Decimal("100.00"),
        net=Decimal("550.00"),
        bookings=[],
    )
    plan = create_plan(payout)

    # Must be 4 steps
    assert len(plan.steps) == 4

    # Step order: invoice → credit-note → bank-txn → payment
    assert plan.steps[0].kind == StepKind.CREATE_INVOICE
    assert plan.steps[1].kind == StepKind.CREATE_CREDIT_NOTE
    assert plan.steps[2].kind == StepKind.CREATE_BANK_TRANSACTION
    assert plan.steps[3].kind == StepKind.CREATE_PAYMENT

    # Credit-note carries refund amount
    assert plan.steps[1].amount == Decimal("100.00")

    # Bank-txn is commission + fees only (NOT including refunds)
    assert plan.steps[2].amount == Decimal("350.00")
    assert len(plan.steps[2].lines) == 2  # commission + fees, no refund line

    # Payment carries net
    assert plan.steps[3].amount == Decimal("550.00")


# ── PL10: Planner refuses when invariant is broken ────────────────────────
def test_PL10_invariant_failure_refuses():
    """Planner raises ValueError (refuses) when the payout invariant is broken,
    even if a malformed payout slips past the model validator.

    This exercises the defence-in-depth guard at planner.py:33-37, which is
    the crown-jewel rule from CLAUDE.md: the agent must be structurally
    unable to propose books that don't balance.

    The expected net is 1340.00 - 445.90 - 47.10 - 0.00 = 847.00.
    We inject 999.00 instead, bypassing the model validator via model_construct.
    """
    broken = _broken_payout()
    with pytest.raises(ValueError, match="Planner invariant failure"):
        create_plan(broken)
