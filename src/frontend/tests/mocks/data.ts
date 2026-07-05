// Mock fixtures for PayoutBridge frontend tests.
// Shapes and values sourced from docs/specs/03-API-SPEC.md and the golden CSV
// (src/data/marketplaceco-payout-0407.csv). Amounts are strings, matching the
// API's Decimal-as-string contract (see API spec section 4).

export const mockBookings = [
  {
    date: "2026-06-17",
    client: "Client A",
    client_type: "New",
    service: "Cut & Colour",
    gross_amount: "180.00",
    commission_rate: "35%",
    commission: "63.00",
  },
  {
    date: "2026-06-18",
    client: "Client B",
    client_type: "New",
    service: "Full Head Highlights",
    gross_amount: "260.00",
    commission_rate: "35%",
    commission: "91.00",
  },
  {
    date: "2026-06-19",
    client: "Client C",
    client_type: "New",
    service: "Balayage",
    gross_amount: "240.00",
    commission_rate: "35%",
    commission: "84.00",
  },
  {
    date: "2026-06-20",
    client: "Client D",
    client_type: "Repeat",
    service: "Blow Dry",
    gross_amount: "26.00",
    commission_rate: "0%",
    commission: "0.00",
  },
  {
    date: "2026-06-21",
    client: "Client E",
    client_type: "New",
    service: "Colour Correction",
    gross_amount: "220.00",
    commission_rate: "35%",
    commission: "77.00",
  },
  {
    date: "2026-06-24",
    client: "Client F",
    client_type: "New",
    service: "Cut & Colour",
    gross_amount: "200.00",
    commission_rate: "35%",
    commission: "70.00",
  },
  {
    date: "2026-06-25",
    client: "Client G",
    client_type: "Repeat",
    service: "Cut & Finish",
    gross_amount: "22.00",
    commission_rate: "0%",
    commission: "0.00",
  },
  {
    date: "2026-06-26",
    client: "Client H",
    client_type: "New",
    service: "Highlights",
    gross_amount: "174.00",
    commission_rate: "35%",
    commission: "60.90",
  },
  {
    date: "2026-06-28",
    client: "Client I",
    client_type: "Repeat",
    service: "Fringe Trim",
    gross_amount: "18.00",
    commission_rate: "0%",
    commission: "0.00",
  },
];

export const mockPayout = {
  payout_ref: "MC-PAYOUT-0407",
  period: "16-30 Jun 2026",
  gross: "1340.00",
  commission: "445.90",
  fees: "47.10",
  refunds: "0.00",
  net: "847.00",
  bookings: mockBookings,
};

export const mockPlan = {
  steps: [
    {
      kind: "create-invoice",
      amount: "1340.00",
      account: "Platform Clearing",
      lines: null,
      clears: null,
    },
    {
      kind: "create-bank-transaction",
      amount: "493.00",
      account: "Platform Clearing",
      lines: [
        { description: "New-client commission", amount: "445.90" },
        { description: "Prepayment fees", amount: "47.10" },
      ],
      clears: null,
    },
    {
      kind: "create-payment",
      amount: "847.00",
      account: null,
      lines: null,
      clears: "MC-PAYOUT-0407",
    },
  ],
  invariant_check: true,
};

export const mockProposeResponseNew = {
  status: "new",
  file_hash: "abc123",
  payout: mockPayout,
  plan: mockPlan,
  existing_ids: null,
};

export const mockExistingIds = {
  invoice_id: "INV-0042",
  bank_txn_id: "BT-0117",
  payment_id: "PMT-0089",
  completed_steps: ["create-invoice", "create-bank-transaction", "create-payment"],
};

export const mockProposeResponseAlreadyPosted = {
  status: "already-posted",
  file_hash: "abc123",
  payout: mockPayout,
  plan: null,
  existing_ids: mockExistingIds,
};

export const mockApprovalResults = [
  { step: 1, kind: "create-invoice", xero_id: "INV-0042", status: "success" },
  { step: 2, kind: "create-bank-transaction", xero_id: "BT-0117", status: "success" },
  { step: 3, kind: "create-payment", xero_id: "PMT-0089", status: "success" },
];

export const mockApproval = {
  file_hash: "abc123",
  results: mockApprovalResults,
  clearing_balance: "0.00",
  verified: true,
};

export const mockPnlBefore = {
  revenue: "847.00",
  commission_expense: null,
  other_expenses: {},
  net_profit: "847.00",
};

export const mockPnlAfter = {
  revenue: "1340.00",
  commission_expense: "493.00",
  other_expenses: {},
  net_profit: "847.00",
};

export const mockPnl = {
  before: mockPnlBefore,
  after: mockPnlAfter,
};

export const mockAuditEntries = [
  {
    timestamp: "2026-07-04T15:30:00Z",
    file_hash: "abc123",
    action: "create-invoice",
    request: {
      contact: "MarketplaceCo (Marketplace)",
      amount: "1340.00",
      account: "Platform Clearing",
    },
    xero_id: "INV-0042",
    status: "success",
  },
  {
    timestamp: "2026-07-04T15:30:01Z",
    file_hash: "abc123",
    action: "create-bank-transaction",
    request: {
      contact: "MarketplaceCo (Marketplace)",
      lines: [
        { description: "New-client commission", amount: "445.90" },
        { description: "Prepayment fees", amount: "47.10" },
      ],
      account: "Platform Clearing",
    },
    xero_id: "BT-0117",
    status: "success",
  },
  {
    timestamp: "2026-07-04T15:30:02Z",
    file_hash: "abc123",
    action: "create-payment",
    request: { invoice_id: "INV-0042", amount: "847.00" },
    xero_id: "PMT-0089",
    status: "success",
  },
];

export const mockStatus = {
  file_hash: "abc123",
  completed_steps: ["create-invoice", "create-bank-transaction", "create-payment"],
  invoice_id: "INV-0042",
  bank_txn_id: "BT-0117",
  payment_id: "PMT-0089",
  clearing_balance: "0.00",
  audit_entries: mockAuditEntries,
};

export const mockHealthOk = {
  status: "ok",
  xero_connected: true,
  organisation: "Demo Company (UK)",
};

export const mockHealthDegraded = {
  status: "degraded",
  xero_connected: false,
  organisation: null,
};
