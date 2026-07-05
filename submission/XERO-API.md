# PayoutBridge — Xero API Usage

This answers the submission form's required Xero questions. Every entry is reconciled
against `src/backend/xero_client.py`, `seed.py`, `main.py`, `config.py`, and
`docs/specs/12-ENDPOINTS-AND-SCOPES.md`.

## (a) How the project uses the Xero API

PayoutBridge runs an AI bank-reconciliation workflow on marketplace settlement statements.
The bank feed sees only the net payout, so the books understate turnover and hide
commission. PayoutBridge corrects this with **clearing-account gross-up accounting**:

1. It reads Xero to seed and verify (accounts, the net bank deposit, P&L).
2. After a human approves the proposed plan, it writes three ordered transactions that
   route the gross through a **Platform Clearing** account and book fees against it.
3. It reads the clearing balance back to prove it returns to **£0.00**, then reads the P&L
   for a before/after comparison.

**Every write is gated by explicit human approval in the UI — nothing auto-posts.** The
golden path uses ≤10 Xero calls; the worst-case refund flow ≤15/min against the 60/min
tenant limit. `Retry-After` is honoured on 429.

Two API surfaces are used:
- The **Xero MCP server** (`@xeroapi/xero-mcp-server`, stdio JSON-RPC) for all standard
  accounting operations.
- **Raw Xero Accounting REST** (httpx) for the two operations the MCP server does not
  expose: attachments and history notes.

## (b) Endpoints and HTTP methods used

### Writes

| Operation | Xero REST endpoint / method | Surface | Purpose |
|---|---|---|---|
| Create invoice | `POST /Invoices` | MCP `create-invoice` | Gross £1,340 into Platform Clearing (golden step 1) |
| Create credit note | `POST /CreditNotes` | MCP `create-credit-note` | Refund path (E1) |
| Create bank transaction | `POST /BankTransactions` | MCP `create-bank-transaction` | Fees £493 out of Clearing (step 2); seed net-deposit RECEIVE |
| Create payment | `PUT /Payments` | MCP `create-payment` | Clear £847 against bank deposit (step 3) |
| Create contact | `POST /Contacts` | MCP `create-contact` | Seed MarketplaceCo contact |
| Create tracking category / option | `PUT /TrackingCategories`, `PUT /TrackingCategories/{id}/Options` | MCP `create-tracking-category` / `create-tracking-options` | Channel tracking (E3) |
| Attach source CSV to invoice | `PUT /Invoices/{id}/Attachments/{filename}` | **raw REST** | Attach the statement to the invoice (E2) |
| Add history note | `PUT /{Endpoint}/{guid}/History` | **raw REST** | Provenance note per created object (E6) |

### Reads

| Operation | Xero REST endpoint / method | Surface | Purpose |
|---|---|---|---|
| List accounts | `GET /Accounts` | MCP `list-accounts` | Seed find-or-create; clearing-balance verification |
| Profit & loss | `GET /Reports/ProfitAndLoss` | MCP `list-profit-and-loss` | Before/after P&L snapshots |
| Organisation details | `GET /Organisation` | MCP `list-organisation-details` | `GET /health` |
| Trial balance | `GET /Reports/TrialBalance` | MCP `list-trial-balance` | `GET /dashboard` (E4) |
| Aged receivables by contact | `GET /Reports/AgedReceivablesByContact` | MCP `list-aged-receivables-by-contact` | `GET /dashboard` (E4) |
| Balance sheet | `GET /Reports/BalanceSheet` | MCP `list-report-balance-sheet` | `GET /dashboard` (E4) |
| Tax rates | `GET /TaxRates` | MCP `list-tax-rates` | `GET /vat-check` (E5) |
| List bank transactions | `GET /BankTransactions` | MCP `list-bank-transactions` | Seed idempotency check |
| List contacts | `GET /Contacts` | MCP `list-contacts` | Contact idempotency check |
| List tracking categories | `GET /TrackingCategories` | MCP `list-tracking-categories` | Seed check-before-create (2-category org cap) |
| List connections (tenant id) | `GET https://api.xero.com/connections` | **raw REST** | Tenant-id header for E2/E6 |
| Mint access token | `POST https://identity.xero.com/connect/token` | **raw REST** | Client-credentials token for E2/E6 |

> `update-bank-transaction` is deliberately **not** used — it is broken in Xero MCP v0.0.17
> (issues #206/#184). The path uses `create-*` end to end.

## (c) OAuth2 scopes

Confirmed against `config.py` and `.env.example`:

```
accounting.transactions accounting.contacts accounting.settings
accounting.reports.read accounting.attachments offline_access
```

| Scope | Why |
|---|---|
| `accounting.transactions` | Invoices, credit notes, bank transactions, payments (reads + writes) |
| `accounting.contacts` | MarketplaceCo contact create/list |
| `accounting.settings` | Chart of accounts, tax rates, tracking categories |
| `accounting.reports.read` | P&L, trial balance, balance sheet, aged receivables |
| `accounting.attachments` | Source CSV attached to the invoice (E2) |
| `offline_access` | Refresh-token support for the Custom Connection |

**Granular-scope note:** Custom Connections created from 29 Apr 2026 onward may need split
scopes instead of the umbrella ones — `accounting.invoices`, `accounting.banktransactions`,
`accounting.payments` for `accounting.transactions`, and
`accounting.reports.trialbalance.read` / `accounting.reports.balancesheet.read` /
`accounting.reports.profitandloss.read` / `accounting.reports.aged.read` for
`accounting.reports.read`. `XERO_SCOPES` in `.env` is the single adjustment point.

## Auth model

Custom Connection (client-credentials, machine-to-machine) against the **Xero Demo Company
(UK)** only — free tier. The live/paid tenant is never touched.
