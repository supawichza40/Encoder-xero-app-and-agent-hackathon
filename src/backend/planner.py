"""
Journal planner: CanonicalPayout → JournalPlan (3 or 4 writes, exact amounts).

3-step plan (refunds == 0):
  1. create-invoice         — gross revenue into Platform Clearing
  2. create-bank-transaction — commission + fees out of Clearing
  3. create-payment          — net clears against bank deposit

4-step plan (refunds > 0):
  1. create-invoice         — gross revenue into Platform Clearing
  2. create-credit-note     — refund amount out of Clearing (E1)
  3. create-bank-transaction — commission + fees out of Clearing
  4. create-payment          — net clears against bank deposit

Hard rule: raises ValueError if the payout invariant does not hold.
The agent is structurally unable to propose books that don't balance.
"""

from decimal import Decimal

from .config import (
    CLEARING_ACCOUNT_NAME,
    CLEARING_ACCOUNT_CODE,
    FEES_ACCOUNT_CODE,
    CONTACT_NAME,
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
    Build a 3- or 4-step journal plan from a validated CanonicalPayout.
    Returns 4 steps when payout.refunds > 0 (includes create-credit-note).
    """
    # Defence-in-depth invariant check (model validator already fired once)
    expected_net = payout.gross - payout.commission - payout.fees - payout.refunds
    if expected_net != payout.net:
        raise ValueError(
            f"Planner invariant failure: {payout.gross} - {payout.commission} - "
            f"{payout.fees} - {payout.refunds} = {expected_net}, expected {payout.net}"
        )

    has_refund = payout.refunds > Decimal("0")

    # Bank-txn only covers commission + fees (refunds handled by credit note when present)
    fees_total = payout.commission + payout.fees

    steps: list[PlanStep] = []

    # Step 1 — always
    steps.append(PlanStep(
        kind=StepKind.CREATE_INVOICE,
        amount=payout.gross,
        account=CLEARING_ACCOUNT_NAME,
    ))

    # Step 2 — credit note (only when refunds > 0)
    if has_refund:
        steps.append(PlanStep(
            kind=StepKind.CREATE_CREDIT_NOTE,
            amount=payout.refunds,
            account=CLEARING_ACCOUNT_NAME,
        ))

    # Step 2 or 3 — bank transaction (commission + fees)
    fee_lines = [
        FeeLineItem(description="New-client commission", amount=payout.commission),
        FeeLineItem(description="Prepayment fees", amount=payout.fees),
    ]
    steps.append(PlanStep(
        kind=StepKind.CREATE_BANK_TRANSACTION,
        amount=fees_total,
        account=CLEARING_ACCOUNT_NAME,
        lines=fee_lines,
    ))

    # Final step — payment
    steps.append(PlanStep(
        kind=StepKind.CREATE_PAYMENT,
        amount=payout.net,
        clears=payout.payout_ref,
    ))

    return JournalPlan(steps=steps, invariant_check=True)
