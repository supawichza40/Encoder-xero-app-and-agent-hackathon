> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 11.

## 11.1 The MCP tool surface — exactly 51 tools (v0.0.17)

- Repo `github.com/XeroAPI/xero-mcp-server` (MIT); npm `@xeroapi/xero-mcp-server` **v0.0.17, published 2026-05-26**. "52" was a miscount — corrected to **51**.
- Decomposition: **25 list + 11 create + 10 update + 5 timesheet = 51.** By domain: invoicing 3 · quotes 3 · credit notes 3 · payments 2 · contacts 4 · bank transactions 3 · manual journals 3 · items 3 · tracking 5 · read-only reports 5 (P&L, BS, TB, aged AR/AP) · settings 3 · payroll leave read-only 6 · timesheets full-CRUD 8 (NZ/UK payroll only).
- **README tool names are STALE — do not code against the README.**
- **Golden-path tools that matter:** `create-invoice`, `create-bank-transaction`, `create-payment`; reads `list-bank-transactions`, `list-accounts`, `list-profit-and-loss`. **Manual journals are the one fully-CRUD, voidable doc type = the safest write surface** (kept in reserve for the LedgerMedic pivot).
- **Irrelevant to our golden path:** all payroll (6 leave-read + 8 timesheet), tracking (5), items, quotes, credit-notes.

## 11.2 The draft-invoice dead-end — what MCP CANNOT do

MCP **cannot**: approve `DRAFT → AUTHORISED` (**"the draft-invoice dead-end"**) · reconcile a bank line (no statement-line access) · attach files/receipts · email/send an invoice · void/delete anything (only payroll timesheets are deletable) · POs, batch payments, repeating invoices, expense claims, fixed assets, bank feeds, pay runs, AU/US payroll. `update-invoice` / `update-quote` / `update-credit-note` touch **DRAFT only** (already noted in §3.4). This is WHY our path uses `create-*` writes end to end and never relies on approve/send/reconcile.

## 11.3 Known broken / limited in v0.0.17 (issue numbers)

- **`update-bank-transaction` 400s in v0.0.17 — issues #206 / #184. Avoid it live.** Our path uses `create-bank-transaction` (unaffected) — do NOT improvise an update path.
- **No PKCE** (#203). · List tools **paginate ~10 records/page** (#193). · New Custom Connections **lose `accounting.journals.read`** under granular V2 (#175).

## 11.4 MCP-vs-REST gaps (fall back to REST only if forced)

- **RepeatingInvoices POST/PUT** exist in core REST since ~Aug 2022 (`developer.xero.com/documentation/api/accounting/repeatinginvoices`); only the MCP wrapper lacks them (`xero-mcp-server#113`).
- **`PUT …/Allocations`** (credit-note/overpayment allocation) is **absent from MCP** — raw `xero-node` only.
- Bank reconciliation, attachments, send-email = **REST-only**. None are on our golden path.

## 11.5 JAX (Just Ask Xero) — capabilities and the contractual boundary

- **Ships (labelled "beta" throughout, never formally GA, free until FY27):** invoice/quote create-edit-approve-send via chat (since Aug 2024; web/email/WhatsApp all regions, SMS AU/US/UK/NZ) · cash-flow/P&L/BS Q&A + 30-day projection + benchmarking (Syft-powered, all regions Dec 2025) · auto bank reconciliation "powered by JAX" (beta, high-confidence lines only) · web research (OpenAI-powered) · **JAX in Microsoft 365 Copilot shipped 1 Jul 2026** (Q&A/insights only at launch).
- **JAX CANNOT / is contractually banned from:** *"JAX is unable to give financial forecasts, financial advice or recommendations"* (Xero disclaimer) · cannot edit line items, void/delete invoices, or create invoices where US auto-sales-tax is on · operates only on **structured in-Xero data** (not messy external multi-doc onboarding) · **"doesn't run in the background — it needs your prompts to perform"** · contact-management via chat NOT supported · payment-chasing / reminder emails = **announced-only, unshipped through Jul 2026** · **no third-party plugin model — you cannot extend JAX.**
- **Our lane:** gross-up is accounting judgement over a messy external document → position PayoutBridge as **"the correcting-accounting layer JAX is contractually banned from."**

## 11.6 Native-feature overlap verdicts (HIGH = Xero already does it; LOW = white space)

| Candidate feature | Verdict | Note |
|---|---|---|
| Gross-up / clearing-account correction (PayoutBridge) | **LOW — white space** | No service/gig payout connector exists; JAX banned from the judgement (§11.5) |
| DeferDesk / revenue recognition | **LOW** | Rev-rec "Not in pipeline" since Mar 2023; re-confirmed live 4 Jul 2026 |
| DepositDesk (customer deposits) | **HIGH** (native, GA 15 Jun 2026, Stripe-powered) | Residual **LOW** carve-out: deposit-as-liability treatment |
| CreditSweep (bulk credit allocation) | **MEDIUM** | "Not planned short term"; New Credit Notes UI rebuild may absorb it |
| RetentionLedger (construction retentions) | **LOW** | Not planned as of May 2024 |
| TroncClear (tronc/tips) | **LOW** | Payroll-adjacency caution |
| PartialExemption / VAT | **LOW** | Open since Sep 2018 |
| BillOptimizer (AP prioritisation) | **HIGH US / MEDIUM UK** | LOW decisioning carve-out |
| Generic "chat with your books" | **HIGH — head-on JAX collision, AVOID** | — |

## 11.7 Anthropic–Xero partnership positioning ("build alongside JAX, not on top")

- Announced **Mar 2026** (`blog.xero.com/news-events/anthropic-xero-partnership-claude-ai/`, 27 Mar 2026): "Claude-powered insights within Xero, and the integration of Xero into Claude.ai … available in the coming months" = **NOT shipped as of 4 Jul 2026.**
- **Anthropic powers JAX itself.** Xero wants partners *alongside* JAX via **MCP + Agentic SDK + webhooks + App Store**; there is **no JAX plugin surface**.
- **Judge-resonant framing:** *"We build alongside JAX, not on top of it"* — an agent that helps Xero win, not a JAX competitor. (AFR, 14 May 2026, frames AI/Anthropic as a threat to Xero's outlook — being additive answers that anxiety.)

## 11.8 Xerocon / roadmap re-check + strategy context

- **Xerocon London 8–9 Jul 2026 (DevDay 7 Jul) — re-check the product map on 9 Jul 2026.** This ENCODE hackathon (4–5 Jul) is on Xero's official dev calendar. Xerocon Denver 19–20 Aug 2026.
- **3×3 strategy:** win **accounting / payments / payroll** in **US / UK / AU** — anything core to those in those markets risks collision.
- **API terms PROHIBIT training models on Xero API data** (inference is fine). Developer pricing (Mar 2026) = **5 tiers on connections + egress**; read-heavy agents pay more. **Smart Document Capture** (Hubdoc successor) launched 1 Jul 2026.

---

# SECTION 12 — ARCHITECTURE JUDGE-SIGNALS (mirror the on-site mentor)

> **Mentor = Ashish Nangia, Principal PM AI Products (on-site).** Signals sourced from his own public build **`github.com/anangia261089/Tax-Insights`** (`ARCHITECTURE.md`, Apr 2026) — an AI chat assistant on Xero data. His stack: **Next.js 16 · Claude API · Xero API (full OAuth 2.0) · Neon Postgres (Drizzle ORM) · iron-session · Vercel/Netlify.** Attribute as his personal build, not Xero policy (§0.B).

