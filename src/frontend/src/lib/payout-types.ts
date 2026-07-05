// PayoutBridge shared types — mirror the FastAPI backend contracts.

export type Phase =
  | "idle"
  | "uploading"
  | "error"
  | "idempotent"
  | "proposed"
  | "approving"
  | "verified"
  | "partial_error";

export interface BookingRow {
  date: string;
  client: string;
  client_type: "New" | "Repeat";
  service: string;
  gross_amount: string;
  commission_rate: string;
  commission: string;
}

export interface CanonicalPayout {
  payout_ref: string;
  period: string;
  gross: string;
  commission: string;
  fees: string;
  refunds: string;
  net: string;
  bookings: BookingRow[];
}

export interface FeeLineItem {
  description: string;
  amount: string;
}

export interface PlanStep {
  kind: "create-invoice" | "create-credit-note" | "create-bank-transaction" | "create-payment";
  amount: string;
  account: string | null;
  lines: FeeLineItem[] | null;
  clears: string | null;
}

export interface JournalPlan {
  steps: PlanStep[];
  invariant_check: boolean;
}

export interface ExistingIds {
  invoice_id: string;
  bank_txn_id: string;
  payment_id: string;
  completed_steps: string[];
}

export interface ProposalResponse {
  status: "new" | "already-posted";
  file_hash: string;
  payout: CanonicalPayout;
  plan: JournalPlan | null;
  existing_ids: ExistingIds | null;
}

export interface StepResult {
  step: number;
  kind: string;
  xero_id: string;
  status: "success" | "error";
  // Backend (models.StepResult) reports step failures in `message`.
  message?: string | null;
}

export interface ApprovalResponse {
  file_hash: string;
  results: StepResult[];
  clearing_balance: string;
  verified: boolean;
  attachment?: AttachmentResult | null;
}

export interface AttachmentResult {
  invoice_id: string;
  filename: string;
  // Backend uses "failed" (not "error") for a failed attachment.
  status: "success" | "error" | "failed";
}

// UI-friendly payout row. In Live mode the backend returns
// {file_hash, completed_steps, clearing_balance} rows — usePayoutBridge
// normalizes them into this shape (gross/net unknown → null).
export interface DashboardPayout {
  date: string;
  source: string;
  gross: string | null;
  net: string | null;
  status: "verified" | "idempotent";
  file_hash?: string;
}

export interface AgedReceivable {
  contact: string;
  outstanding: string;
}

export interface DashboardResponse {
  trial_balance: { clearing: string; fees_expense: string; revenue: string };
  aged_receivables: AgedReceivable[];
  // Key set differs between Xero and degraded mode — treat as a string map.
  balance_sheet: Record<string, string>;
  recent_payouts: DashboardPayout[];
  fetched_at: string;
  source?: string; // "xero" | "degraded" | "demo"
}

export interface VatCheckResponse {
  org_rates: { name: string; rate: string }[];
  golden_path_tax_type: string;
  consistent: boolean;
  note?: string;
  fetched_at?: string;
  source?: string; // "xero" | "degraded" | "demo"
}

export interface PnLSnapshot {
  revenue: string;
  commission_expense: string | null;
  other_expenses: Record<string, string> | null;
  net_profit: string;
}

export interface PnLResponse {
  before: PnLSnapshot | null;
  after: PnLSnapshot | null;
}

export interface AuditEntry {
  timestamp: string;
  file_hash: string;
  action: string;
  request: Record<string, unknown>;
  xero_id: string | null;
  status: string;
}

export interface StatusResponse {
  file_hash: string;
  completed_steps: string[];
  invoice_id: string | null;
  credit_note_id?: string | null; // refund path (E1) only
  bank_txn_id: string | null;
  payment_id: string | null;
  clearing_balance: string | null;
  audit_entries: AuditEntry[];
}
