# PayoutBridge — Project Details

**Tagline:** Your bank feed has been lying about your turnover.

## What it is

PayoutBridge is a Xero-native agent that fixes a specific, expensive blind spot: when a
business sells through a marketplace, the platform takes commission and fees before wiring
the net payout, and Xero's bank feed books only that net figure as revenue. Real turnover
is understated, commission expense is invisible, and the VAT trail is wrong from the first
statement.

The agent ingests the platform's CSV settlement statement, proposes clearing-account
gross-up accounting in plain English, and — only after a human approves — posts three
ordered writes to Xero, then proves the result with a live zero-balance check and a
before/after P&L.

## The problem, with the demo figure

On the synthetic MarketplaceCo statement:

| Item | Amount |
|---|---|
| Gross sales | £1,340.00 |
| Commission (35%) | £445.90 |
| Prepayment fees | £47.10 |
| **Net payout (all Xero sees)** | **£847.00** |

Turnover is understated by **£493** on a single statement, and commission expense never
appears. Every downstream report and tax filing inherits that error.

## The core workflow

1. **Upload** — drag the CSV in. The backend computes `sha256(file_bytes)`; a duplicate
   file short-circuits to "already posted" with the stored Xero IDs.
2. **Parse & validate** — a deterministic column map (no LLM) produces a canonical payout
   model. A Pydantic validator enforces the accounting invariant
   `gross − commission − fees − refunds === net` (`1340.00 − 445.90 − 47.10 − 0.00 === 847.00`).
   If it fails, the file is rejected with a 422. The agent is structurally unable to
   propose books that do not balance.
3. **Propose** — the planner builds a 3-step journal plan and returns it with a
   plain-English "what Xero will do" checklist. No writes have happened yet.
4. **Approve (human gate)** — the user clicks *Approve & Post to Xero*. Every write
   requires this explicit approval; nothing auto-posts.
5. **Execute** — three ordered Xero writes:
   1. `create-invoice` — gross £1,340.00 into Platform Clearing
   2. `create-bank-transaction` — commission £445.90 + fees £47.10 out of Clearing
   3. `create-payment` — £847.00 clears against the seeded bank deposit
   Each step is audit-logged and recorded in a per-step idempotency map, so a crash after
   write 1 resumes at write 2 with no double-posting.
6. **Verify** — a live read confirms Platform Clearing sits at **£0.00**, and a P&L
   snapshot shows revenue corrected from £847 to £1,340 with £493 of expense now visible.

## What makes it defensible

- **Human-in-the-loop by construction.** A wrong journal is worse than none; approval is
  the production control, not an afterthought.
- **Per-step idempotency**, keyed on the file hash, not a per-file flag.
- **Decimal everywhere** — the demo is deliberately VAT-free to avoid rounding mismatches.
- **Deterministic parsing** on the golden path — no LLM schema inference where money is
  posted.
- **Zero-balance proof** — the clearing account returning to £0.00 is a live, checkable
  claim, not a screenshot.

## Beyond the golden path

- **Persona workspaces** — Owner, Bookkeeper, and Freelancer each get a role-tuned
  dashboard: reordered KPIs, jargon-free labels, and a freelancer tax summary.
- **Streaming assistant** — a data-aware chat assistant (Ollama Cloud) with a
  Fast/Thinking toggle. It can explain the payout, the VAT position, and the audit
  trail; it has no write access — the money path stays fully deterministic.
- **Audit export & evidence pack** — the full audit trail exports as CSV or JSON
  (with a CSV formula-injection guard), and a per-file evidence pack bundles the
  statement hash, plan, Xero IDs, and verification result for an accountant.
- **Proven live** — the golden path has been executed end-to-end on the live Xero
  Demo Company; the clearing account reached a genuine £0.00 on a real tenant.

Verified by tests: 199 backend (pytest, unit + mock-Xero API tiers) and 139 frontend
(vitest) — all passing.

## Scope, honestly

The refund path (adds a `create-credit-note`, 4 writes) and channel tracking are
implemented. Out of scope: PDF/OCR parsing, live marketplace APIs, VAT splitting (the
optional check only reads and flags), and any delete/void operation. Demo data is
synthetic; the only marketplace brand shown anywhere is "MarketplaceCo".
