// Mock backend for offline UI testing.
// Mock is ON by default so the UI can be tested without a backend.
// To hit the real API, append ?mock=0 to the URL or set VITE_PAYOUTBRIDGE_MOCK=0.

import type {
  ApprovalResponse,
  AuditEntry,
  DashboardResponse,
  PnLResponse,
  ProposalResponse,
  StatusResponse,
  VatCheckResponse,
} from "./payout-types";


export function isMockEnabled(): boolean {
  if (import.meta.env.VITE_PAYOUTBRIDGE_MOCK === "0") return false;
  if (import.meta.env.VITE_PAYOUTBRIDGE_MOCK === "1") return true;
  if (typeof window !== "undefined") {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("mock");
      if (q === "0") return false;
      if (q === "1") return true;
      const ls = window.localStorage?.getItem("payoutbridge.mock");
      if (ls === "0") return false;
      if (ls === "1") return true;
    } catch {
      /* fall through */
    }
  }
  return true; // default ON
}


const DEMO_PAYOUT = {
  payout_ref: "MC-PAYOUT-0407",
  period: "16-30 Jun 2026",
  gross: "1340.00",
  commission: "445.90",
  fees: "47.10",
  refunds: "0.00",
  net: "847.00",
  bookings: [
    {
      date: "2026-06-17",
      client: "Alex Rivera",
      client_type: "New" as const,
      service: "Cut & Colour",
      gross_amount: "180.00",
      commission_rate: "35%",
      commission: "63.00",
    },
    {
      date: "2026-06-19",
      client: "Priya Shah",
      client_type: "New" as const,
      service: "Balayage",
      gross_amount: "260.00",
      commission_rate: "35%",
      commission: "91.00",
    },
    {
      date: "2026-06-22",
      client: "Jordan Lee",
      client_type: "Repeat" as const,
      service: "Blow-dry",
      gross_amount: "45.00",
      commission_rate: "15%",
      commission: "6.75",
    },
    {
      date: "2026-06-25",
      client: "Sam Okoro",
      client_type: "New" as const,
      service: "Full Highlights",
      gross_amount: "855.00",
      commission_rate: "33.4%",
      commission: "285.15",
    },
  ],
};

const REFUND_PAYOUT = {
  payout_ref: "MC-PAYOUT-2107",
  period: "16-21 Jul 2026",
  gross: "1180.00",
  commission: "383.50",
  fees: "41.50",
  refunds: "60.00",
  net: "695.00",
  bookings: [
    {
      date: "2026-07-16",
      client: "Nadia Klein",
      client_type: "New" as const,
      service: "Consultation",
      gross_amount: "220.00",
      commission_rate: "35%",
      commission: "77.00",
    },
    {
      date: "2026-07-18",
      client: "Tom Reyes",
      client_type: "Repeat" as const,
      service: "Follow-up",
      gross_amount: "60.00",
      commission_rate: "15%",
      commission: "9.00",
    },
    {
      date: "2026-07-19",
      client: "Amara Diallo",
      client_type: "New" as const,
      service: "Full session",
      gross_amount: "900.00",
      commission_rate: "33%",
      commission: "297.50",
    },
  ],
};

// In-memory idempotency store — persists across renders in a single tab.
const posted = new Set<string>();
// Track which hashes correspond to refund payouts, so /approve + /status
// can return the 4-step credit-note flow.
const refundHashes = new Set<string>();

function hashFile(file: File): string {
  // Cheap deterministic pseudo-hash for demo idempotency.
  const raw = `${file.name}:${file.size}:${file.lastModified}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `mock-${(h >>> 0).toString(16).padStart(8, "0")}`;
}

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function mockPropose(file: File): Promise<ProposalResponse> {
  const file_hash = hashFile(file);
  const isRefund = file.name.toLowerCase().includes("2107");
  if (isRefund) refundHashes.add(file_hash);
  const payout = isRefund ? REFUND_PAYOUT : DEMO_PAYOUT;
  if (posted.has(file_hash)) {
    return delay({
      status: "already-posted",
      file_hash,
      payout,
      plan: null,
      existing_ids: {
        invoice_id: "INV-0042",
        bank_txn_id: "BT-0117",
        payment_id: "PMT-0089",
        completed_steps: isRefund
          ? ["create-invoice", "create-credit-note", "create-bank-transaction", "create-payment"]
          : ["create-invoice", "create-bank-transaction", "create-payment"],
      },
    });
  }
  const steps = isRefund
    ? [
        { kind: "create-invoice" as const, amount: payout.gross, account: "Platform Clearing", lines: null, clears: null },
        { kind: "create-credit-note" as const, amount: payout.refunds, account: "Platform Clearing", lines: null, clears: null },
        {
          kind: "create-bank-transaction" as const,
          amount: (Number(payout.commission) + Number(payout.fees)).toFixed(2),
          account: "Platform Clearing",
          lines: [
            { description: "New-client commission", amount: payout.commission },
            { description: "Prepayment fees", amount: payout.fees },
          ],
          clears: null,
        },
        { kind: "create-payment" as const, amount: payout.net, account: null, lines: null, clears: payout.payout_ref },
      ]
    : [
        { kind: "create-invoice" as const, amount: "1340.00", account: "Platform Clearing", lines: null, clears: null },
        {
          kind: "create-bank-transaction" as const,
          amount: "493.00",
          account: "Platform Clearing",
          lines: [
            { description: "New-client commission", amount: "445.90" },
            { description: "Prepayment fees", amount: "47.10" },
          ],
          clears: null,
        },
        { kind: "create-payment" as const, amount: "847.00", account: null, lines: null, clears: "MC-PAYOUT-0407" },
      ];
  return delay({
    status: "new",
    file_hash,
    payout,
    plan: { invariant_check: true, steps },
    existing_ids: null,
  });
}

export async function mockApprove(file_hash: string): Promise<ApprovalResponse> {
  posted.add(file_hash);
  const isRefund = refundHashes.has(file_hash);
  if (isRefund) {
    return delay(
      {
        file_hash,
        clearing_balance: "0.00",
        verified: true,
        results: [
          { step: 1, kind: "create-invoice", xero_id: "INV-0051", status: "success" },
          { step: 2, kind: "create-credit-note", xero_id: "CN-0007", status: "success" },
          { step: 3, kind: "create-bank-transaction", xero_id: "BT-0128", status: "success" },
          { step: 4, kind: "create-payment", xero_id: "PMT-0094", status: "success" },
        ],
        attachment: { invoice_id: "INV-0051", filename: "settlement.csv", status: "success" },
      },
      200,
    );
  }
  return delay(
    {
      file_hash,
      clearing_balance: "0.00",
      verified: true,
      results: [
        { step: 1, kind: "create-invoice", xero_id: "INV-0042", status: "success" },
        { step: 2, kind: "create-bank-transaction", xero_id: "BT-0117", status: "success" },
        { step: 3, kind: "create-payment", xero_id: "PMT-0089", status: "success" },
      ],
      attachment: { invoice_id: "INV-0042", filename: "settlement.csv", status: "success" },
    },
    200,
  );
}

export async function mockPnl(): Promise<PnLResponse> {
  return delay({
    before: {
      revenue: "847.00",
      commission_expense: null,
      other_expenses: null,
      net_profit: "847.00",
    },
    after: {
      revenue: "1340.00",
      commission_expense: "493.00",
      other_expenses: null,
      net_profit: "847.00",
    },
  });
}

export async function mockStatus(file_hash: string): Promise<StatusResponse> {
  const now = new Date();
  const t = (offset: number) => new Date(now.getTime() + offset * 1000).toISOString();
  const isRefund = refundHashes.has(file_hash);
  const entries: AuditEntry[] = isRefund
    ? [
        { timestamp: t(0), file_hash, action: "create-invoice", request: { amount: "1180.00", account: "Platform Clearing", tracking: "Channel:MarketplaceCo" }, xero_id: "INV-0051", status: "success" },
        { timestamp: t(1), file_hash, action: "create-credit-note", request: { amount: "60.00", account: "Platform Clearing" }, xero_id: "CN-0007", status: "success" },
        { timestamp: t(2), file_hash, action: "create-bank-transaction", request: { amount: "425.00", account: "Platform Clearing" }, xero_id: "BT-0128", status: "success" },
        { timestamp: t(3), file_hash, action: "create-payment", request: { amount: "695.00", clears: "MC-PAYOUT-2107" }, xero_id: "PMT-0094", status: "success" },
        { timestamp: t(4), file_hash, action: "attach-source", request: { filename: "settlement.csv", invoice_id: "INV-0051" }, xero_id: "INV-0051", status: "success" },
        { timestamp: t(5), file_hash, action: "history-note", request: { note: "Verified zero-balance clearing (refund path)" }, xero_id: null, status: "info" },
      ]
    : [
    {
      timestamp: t(0),
      file_hash,
      action: "create-invoice",
      request: { amount: "1340.00", account: "Platform Clearing", tracking: "Channel:MarketplaceCo" },
      xero_id: "INV-0042",
      status: "success",
    },
    {
      timestamp: t(1),
      file_hash,
      action: "create-bank-transaction",
      request: { amount: "493.00", account: "Platform Clearing" },
      xero_id: "BT-0117",
      status: "success",
    },
    {
      timestamp: t(2),
      file_hash,
      action: "create-payment",
      request: { amount: "847.00", clears: "MC-PAYOUT-0407" },
      xero_id: "PMT-0089",
      status: "success",
    },
    {
      timestamp: t(3),
      file_hash,
      action: "attach-source",
      request: { filename: "settlement.csv", invoice_id: "INV-0042" },
      xero_id: "INV-0042",
      status: "success",
    },
    {
      timestamp: t(4),
      file_hash,
      action: "history-note",
      request: { note: "Verified zero-balance clearing" },
      xero_id: null,
      status: "info",
    },
  ];
  return delay({
    file_hash,
    completed_steps: isRefund
      ? ["create-invoice", "create-credit-note", "create-bank-transaction", "create-payment"]
      : ["create-invoice", "create-bank-transaction", "create-payment"],
    invoice_id: isRefund ? "INV-0051" : "INV-0042",
    bank_txn_id: isRefund ? "BT-0128" : "BT-0117",
    payment_id: isRefund ? "PMT-0094" : "PMT-0089",
    clearing_balance: "0.00",
    audit_entries: entries,
  });
}

export async function mockDashboard(): Promise<DashboardResponse> {
  return delay({
    trial_balance: { clearing: "0.00", fees_expense: "5048.00", revenue: "18930.00" },
    aged_receivables: [],
    balance_sheet: { assets: "24800.00", liabilities: "6210.00", equity: "18590.00" },
    recent_payouts: [
      { date: "2026-07-02", source: "MarketplaceCo", gross: "1340.00", net: "847.00", status: "verified" },
      { date: "2026-06-28", source: "MarketplaceCo", gross: "980.00", net: "642.00", status: "verified" },
      { date: "2026-06-24", source: "MarketplaceCo", gross: "0.00", net: "0.00", status: "idempotent" },
      { date: "2026-06-20", source: "MarketplaceCo", gross: "2110.00", net: "1368.00", status: "verified" },
    ],
    fetched_at: new Date().toISOString(),
  });
}

export async function mockVatCheck(): Promise<VatCheckResponse> {
  return delay({
    org_rates: [
      { name: "20% (VAT on Income)", rate: "20" },
      { name: "No VAT", rate: "0" },
    ],
    golden_path_tax_type: "NONE",
    consistent: true,
  });
}

export async function mockHealth(): Promise<{ status: string; xero_connected: boolean; organisation: string }> {
  return delay({ status: "ok", xero_connected: true, organisation: "Demo Company (UK)" });
}

export function resetMockState() {
  posted.clear();
  refundHashes.clear();
}
