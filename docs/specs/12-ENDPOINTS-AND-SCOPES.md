# PayoutBridge — Xero Endpoints & Scopes Inventory

> **Purpose:** the submission form asks which Xero endpoints and scopes the project uses (TOOLING.md §4). This is the authoritative list. Update whenever `xero_client.py` or `seed.py` gains/loses a call. Expansion features referenced as E1–E6 (see [`11-EXPANSION-SPEC.md`](11-EXPANSION-SPEC.md)).

## 1. Xero calls — writes

| Call | Surface | Used by | Feature |
|---|---|---|---|
| `create-invoice` | MCP | golden path step 1 | base |
| `create-credit-note` | MCP | refund plan step 2 | E1 |
| `create-bank-transaction` | MCP | golden path fees step | base |
| `create-payment` | MCP | golden path final step | base |
| `create-contact` | MCP | seed (MarketplaceCo) | base |
| `create-tracking-category` / `create-tracking-options` | MCP | seed ("Channel" → "MarketplaceCo") | E3 |
| `PUT /Invoices/{id}/Attachments/{filename}` | **raw REST** | attach source CSV after step 1 | E2 |
| `PUT /{Endpoint}/{guid}/History` | **raw REST** | provenance note per created object | E6 |

## 2. Xero calls — reads

| Call | Surface | Used by | Feature |
|---|---|---|---|
| `list-accounts` | MCP | seed + clearing-balance verification | base |
| `list-profit-and-loss` | MCP | P&L before/after snapshots | base |
| `list-organisation-details` | MCP | `GET /health` | base |
| `list-trial-balance` | MCP | `GET /dashboard` | E4 |
| `list-aged-receivables-by-contact` | MCP | `GET /dashboard` | E4 |
| `list-report-balance-sheet` | MCP | `GET /dashboard` | E4 |
| `list-tax-rates` | MCP | `GET /vat-check` (assistant) | E5 |
| `list-bank-transactions` | MCP | seed idempotency check | base |
| `list-contacts` | MCP | seed idempotency check | base |
| `list-tracking-categories` | MCP | seed check-before-create (2-category org cap) | E3 |

## 3. OAuth scopes requested

| Scope | Why |
|---|---|
| `accounting.transactions` | invoices, credit notes, bank transactions, payments (writes + reads) |
| `accounting.contacts` | MarketplaceCo contact |
| `accounting.settings` | accounts, tax rates, tracking categories |
| `accounting.reports.read` | P&L, trial balance, balance sheet, aged receivables |
| `accounting.attachments` | E2 source-CSV attachment |

> Granular-scope note: new Custom Connections (from 29 Apr 2026) may require the split scopes — `accounting.invoices`, `accounting.banktransactions`, `accounting.payments` in place of `accounting.transactions`, and `accounting.reports.trialbalance.read` / `accounting.reports.balancesheet.read` / `accounting.reports.profitandloss.read` / `accounting.reports.aged.read` in place of `accounting.reports.read`. `XERO_SCOPES` in `.env` is the single place to adjust.

## 4. Rate-limit posture

- Worst-case full flow (refund file, all features): **15 calls** vs 60/min tenant limit.
- Dashboard reads cached 60s in-process; no polling loops anywhere.
- `Retry-After` honoured by the MCP wrapper; raw REST calls (E2/E6) retry once then log-and-continue (non-fatal).

## 5. Auth model

Custom Connection (client-credentials, machine-to-machine) against the **Demo Company (UK)** — free tier. Env: `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_SCOPES`. Raw REST calls (E2/E6) mint tokens from the same credentials via `POST https://identity.xero.com/connect/token`.
