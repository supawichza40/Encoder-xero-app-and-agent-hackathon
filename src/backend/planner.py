"""
Journal planner: CanonicalPayout → JournalPlan (3 writes, exact amounts).

Hard rule: raises ValueError if the payout invariant does not hold.
The agent is structurally unable to propose books that don't balance.
"""

from decimal import Decimal

from .config import (
    CLEARING_ACCOUNT_NAME,
    CLEARING_ACCOUNT_CODE,
    FEES_ACCOUNT_CODE,
)
from .models import (
    CanonicalPayout,
    FeeLineItem,
    JournalPlan,
    PlanStep,
    StepKind,
)


def create_plan(payout: CanonicalPayout) -> JournalPlan:
    """
    Build a 3-step journal plan from a validated CanonicalPayout.

    Steps:
      1. create-invoice  — gross revenue into Platform Clearing
      2. create-bank-transaction — commission + fees out of Clearing
      3. create-payment  — net clears against the bank deposit
    """
    # Defence-in-depth invariant check (model validator already fired once)
    expected_net = payout.gross - payout.commission - payout.fees - payout.refunds
    if expected_net != payout.net:
        raise ValueError(
            f"Planner invariant failure: {payout.gross} - {payout.commission} - "
            f"{payout.fees} - {payout.refunds} = {expected_net}, expected {payout.net}"
        )

    fees_total = payout.commission + payout.fees + payout.refunds

    steps: list[PlanStep] = [
        PlanStep(
            kind=StepKind.CREATE_INVOICE,
            amount=payout.gross,
            account=CLEARING_ACCOUNT_NAME,
        ),
        PlanStep(
            kind=StepKind.CREATE_BANK_TRANSACTION,
            amount=fees_total,
            account=CLEARING_ACCOUNT_NAME,
            lines=[
                FeeLineItem(description="New-client commission", amount=payout.commission),
                FeeLineItem(description="Prepayment fees", amount=payout.fees),
            ] if payout.refunds == Decimal("0") else [
                FeeLineItem(description="New-client commission", amount=payout.commission),
                FeeLineItem(description="Prepayment fees", amount=payout.fees),
                FeeLineItem(description="Refunds", amount=payout.refunds),
            ],
        ),
        PlanStep(
            kind=StepKind.CREATE_PAYMENT,
            amount=payout.net,
            clears=payout.payout_ref,
        ),
    ]

    return JournalPlan(steps=steps, invariant_check=True)
