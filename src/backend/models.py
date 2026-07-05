from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, model_validator


# ── Core financial models ──────────────────────────────────────────────────

class BookingRow(BaseModel):
    date: str
    client: str
    client_type: str  # "New" | "Repeat"
    service: str
    gross_amount: Decimal
    commission_rate: str
    commission: Decimal


class CanonicalPayout(BaseModel):
    payout_ref: str       # "MC-PAYOUT-0407"
    period: str           # "16-30 Jun 2026"
    gross: Decimal        # 1340.00
    commission: Decimal   # 445.90
    fees: Decimal         # 47.10
    refunds: Decimal      # 0.00
    net: Decimal          # 847.00
    bookings: list[BookingRow]

    @model_validator(mode="after")
    def check_invariant(self) -> "CanonicalPayout":
        expected = self.gross - self.commission - self.fees - self.refunds
        if expected != self.net:
            raise ValueError(
                f"Invariant violation: {self.gross} - {self.commission} - "
                f"{self.fees} - {self.refunds} = {expected}, expected {self.net}"
            )
        return self


# ── Plan models ────────────────────────────────────────────────────────────

class StepKind(str, Enum):
    CREATE_INVOICE = "create-invoice"
    CREATE_CREDIT_NOTE = "create-credit-note"   # E1: refund step
    CREATE_BANK_TRANSACTION = "create-bank-transaction"
    CREATE_PAYMENT = "create-payment"


class FeeLineItem(BaseModel):
    description: str
    amount: Decimal


class PlanStep(BaseModel):
    kind: StepKind
    amount: Decimal
    account: str | None = None
    lines: list[FeeLineItem] | None = None
    clears: str | None = None


class JournalPlan(BaseModel):
    steps: list[PlanStep]
    invariant_check: bool


# ── API response models ────────────────────────────────────────────────────

class ProposalStatus(str, Enum):
    NEW = "new"
    ALREADY_POSTED = "already-posted"


class ProposalResponse(BaseModel):
    status: ProposalStatus
    file_hash: str
    payout: CanonicalPayout
    plan: JournalPlan | None = None
    existing_ids: dict[str, Any] | None = None


class StepResult(BaseModel):
    step: int
    kind: StepKind
    xero_id: str
    status: str  # "success" | "error"
    message: str | None = None


class AttachmentResult(BaseModel):
    invoice_id: str
    filename: str
    status: str   # "success" | "failed"


class ApprovalResponse(BaseModel):
    file_hash: str
    results: list[StepResult]
    clearing_balance: Decimal
    verified: bool  # True when clearing_balance == 0.00
    attachment: AttachmentResult | None = None


class StatusResponse(BaseModel):
    file_hash: str
    completed_steps: list[str]
    invoice_id: str | None = None
    credit_note_id: str | None = None   # E1
    bank_txn_id: str | None = None
    payment_id: str | None = None
    clearing_balance: Decimal | None = None
    audit_entries: list[dict[str, Any]]


class PnLSnapshot(BaseModel):
    revenue: Decimal
    commission_expense: Decimal | None = None
    other_expenses: dict[str, Any] | None = None
    net_profit: Decimal


class PnLResponse(BaseModel):
    before: PnLSnapshot | None = None
    after: PnLSnapshot | None = None


class ApproveRequest(BaseModel):
    file_hash: str


class HealthResponse(BaseModel):
    status: str
    xero_connected: bool
    organisation: str | None = None


# ── Dashboard / VAT models (E4, E5) ───────────────────────────────────────

class TrialBalanceEntry(BaseModel):
    account: str
    balance: str


class AgedReceivableEntry(BaseModel):
    contact: str
    outstanding: str


class RecentPayout(BaseModel):
    file_hash: str
    completed_steps: list[str]
    clearing_balance: str | None = None


class NewVsRepeatBucket(BaseModel):
    count: int
    commission: str


class NewVsRepeat(BaseModel):
    new: NewVsRepeatBucket
    repeat: NewVsRepeatBucket


class PersonaMetrics(BaseModel):
    fees_this_month: str
    gross_turnover_vat_safe: str
    ytd_income: str
    ytd_deductible_fees: str
    new_vs_repeat: NewVsRepeat


class RunHistoryEntry(BaseModel):
    hash: str
    status: str  # "posted" | "failed" | "skipped-idempotent" | "partial"
    payout_ref: str | None = None
    timestamp: str | None = None
    net: str | None = None


class DashboardResponse(BaseModel):
    trial_balance: dict[str, str]
    aged_receivables: list[AgedReceivableEntry]
    balance_sheet: dict[str, str]
    recent_payouts: list[RecentPayout]
    fetched_at: str
    source: str   # "xero" | "degraded"
    persona_metrics: PersonaMetrics | None = None
    run_history: list[RunHistoryEntry] | None = None


class VatRateEntry(BaseModel):
    name: str
    rate: str


class VatCheckResponse(BaseModel):
    org_rates: list[VatRateEntry]
    golden_path_tax_type: str
    consistent: bool
    note: str
    fetched_at: str
    source: str   # "xero" | "degraded"


# ── Evidence pack (PRI-2, CONTRACT.md §3) ──────────────────────────────────

class EvidencePackXeroIds(BaseModel):
    invoice_id: str | None = None
    bank_txn_id: str | None = None
    payment_id: str | None = None
    credit_note_id: str | None = None   # non-null only for refund statements


class EvidencePackAmounts(BaseModel):
    gross: str
    commission: str
    fees: str
    refunds: str
    net: str


class EvidencePack(BaseModel):
    payout_ref: str
    csv_sha256: str
    xero_ids: EvidencePackXeroIds
    amounts: EvidencePackAmounts
    clearing_balance: str | None = None
    verified: bool
    generated_at: str
