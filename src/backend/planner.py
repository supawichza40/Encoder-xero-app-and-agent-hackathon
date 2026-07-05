"""
Journal planner: CanonicalPayout → JournalPlan (3 or 4 writes, exact amounts).

Clearing gross-up mechanics (Platform Clearing is a real BANK account; the net
deposit is seeded as a bank transfer Clearing → Business Bank, so Clearing
starts the run at −net):

3-step plan (refunds == 0):
  1. create-invoice          — gross revenue (line → Sales), authorised
  2. create-bank-transaction — commission + fees SPEND from Clearing
  3. create-payment          — gross settles the invoice INTO Clearing

Clearing: −net (seed) − (commission+fees) + gross = 0  ⇐ the invariant.

4-step plan (refunds > 0) adds create-credit-note (contra revenue) after the
invoice; the payment is then gross − refunds so the contact's AR still nets to
zero and Clearing still closes at 0.

Hard rule: raises ValueError if the payout invariant does not hold.
The agent is structurally unable to propose books that don't balance.
"""

from decimal import Decimal

from .config import (
    CLEARING_ACCOUNT_NAME,
    REVENUE_ACCOUNT_NAME,
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

    # Step 1 — always. Invoice lines post to real revenue (Sales); the gross
    # reaches Platform Clearing via the payment step, not the invoice line.
    steps.append(PlanStep(
        kind=StepKind.CREATE_INVOICE,
        amount=payout.gross,
        account=REVENUE_ACCOUNT_NAME,
    ))

    # Step 2 — credit note (only when refunds > 0), contra revenue
    if has_refund:
        steps.append(PlanStep(
            kind=StepKind.CREATE_CREDIT_NOTE,
            amount=payout.refunds,
            account=REVENUE_ACCOUNT_NAME,
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

    # Final step — payment INTO Platform Clearing for the invoice balance
    # (gross, minus any credit-noted refunds). This is what brings the gross
    # into Clearing so it nets to zero against the seed transfer and the fees:
    #   −net (seed) − fees_total + (gross − refunds) = 0
    steps.append(PlanStep(
        kind=StepKind.CREATE_PAYMENT,
        amount=payout.gross - payout.refunds,
        account=CLEARING_ACCOUNT_NAME,
        clears=payout.payout_ref,
    ))

    return JournalPlan(steps=steps, invariant_check=True)
