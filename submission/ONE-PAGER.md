# PayoutBridge — One-Pager

> **Your bank feed has been lying about your turnover.**

## Problem

When a business sells through a marketplace, the platform deducts commission and fees
before wiring the net payout. Xero's bank feed records only the net deposit as revenue. On
a single MarketplaceCo statement, that hides **£493** of turnover (£1,340 gross booked as
£847 net) and makes commission expense invisible — so every report, VAT return, and tax
filing inherits the error from day one.

## Solution

A Xero-native agent that turns an opaque settlement CSV into correct, auditable
gross-up accounting. It parses the statement deterministically, proposes the fix in plain
English, posts to Xero **only after a human approves**, and proves the result with a live
zero-balance check.

## How it works

| Step | Action | Xero write |
|---|---|---|
| 1 | Record gross revenue into Platform Clearing | `create-invoice` £1,340.00 |
| 2 | Book commission + fees out of Clearing | `create-bank-transaction` £493.00 |
| 3 | Clear the net against the bank deposit | `create-payment` £847.00 |
| 4 | Verify Platform Clearing = **£0.00** (live read) | `list-accounts` |
| 5 | P&L before/after: revenue £847 → £1,340 | `list-profit-and-loss` |

The planner enforces `gross − commission − fees − refunds === net` and refuses to propose
if it fails — the agent is structurally unable to post books that don't balance. Writes are
idempotent per step (keyed on the file's SHA-256), so a crash mid-sequence resumes with no
double-posting. All amounts are Decimal. The full path has been run end-to-end on the live
Xero Demo Company — clearing reached a genuine £0.00 on a real tenant.

Beyond the golden path: persona-tuned dashboards (Owner / Bookkeeper / Freelancer), a
data-aware streaming assistant (the LLM never posts anything), and a one-click audit
export + evidence pack with a CSV formula-injection guard.

## Xero usage

MCP server (`@xeroapi/xero-mcp-server`) for standard accounting ops + raw REST for
attachments/history. Endpoints: `POST /Invoices`, `POST /BankTransactions`, `PUT /Payments`,
`POST /CreditNotes`, `POST /Contacts`, `GET /Accounts`, `GET /Reports/ProfitAndLoss`,
`GET /Organisation`, plus dashboard reports. Scopes: `accounting.transactions`,
`accounting.contacts`, `accounting.settings`, `accounting.reports.read`,
`accounting.attachments`, `offline_access`. Custom Connection, **Xero Demo Company only** —
the live tenant is never touched.

## Tech

Python 3.12 / FastAPI / Pydantic v2 / MCP Python SDK backend (199 tests passing) · React 19
/ Vite / TanStack / Tailwind frontend (Bun, 139 tests passing) · built with Claude Code +
Lovable · optional Make scenario for email ingestion.

## Try it

Live demo (works logged-out, Demo mode):
**https://supawichza40.github.io/Encoder-xero-app-and-agent-hackathon/**

**The one number:** £493 of turnover restored, and a clearing account that proves it at
£0.00.
