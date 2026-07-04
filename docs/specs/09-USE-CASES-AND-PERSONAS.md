# PayoutBridge — Use Cases & Personas

> **What this document is.** The specs `01`–`08` describe *what* PayoutBridge is and *how* it is built. This document describes *who* it is for and *why* they use it. In product terms it is the **target audience + use-case specification** — the personas, the real-world scenarios, and the user stories that justify the golden path. Read it alongside [`01-APP-OVERVIEW.md`](01-APP-OVERVIEW.md).
>
> **Scope discipline.** Every use case below is tagged **[Demo]** (built and shown in the golden path), **[Supported]** (the shipped code handles it), or **[Roadmap]** (deliberately out of scope for the hackathon — see `01-APP-OVERVIEW.md §10`). No use case implies a capability the code does not have.

---

## 1. Target Audience

PayoutBridge is for **service and gig businesses that earn through a marketplace platform**, and for **the people who keep their books**. The common thread: money arrives as a *net* deposit after the platform has already deducted commission and fees, so the accounting system never sees the real turnover.

### 1.1 Who has this problem

| Segment | Example businesses | Why they are exposed |
|---|---|---|
| Beauty & wellness | Salons, spas, nail bars, aesthetics clinics | Book clients through a marketplace that takes new-client commission + prepayment fees before paying out |
| Home & trades services | Cleaners, handypeople, tutors on a services marketplace | Platform commission deducted per job before the weekly/fortnightly payout lands |
| Gig & freelance | Delivery, creative, and task-based platform workers | Fees and service charges withheld; only net hits the bank |
| Hospitality & events | Small operators taking bookings via an aggregator | Booking fees netted off before settlement |

The demo uses a **synthetic** marketplace, **"MarketplaceCo"**, with invented figures. (Treatwell is referenced only in market research to establish that the pain is real — never as demo content, never as a customer statement.)

### 1.2 Personas

**Persona A — Sam, the owner-operator** *(primary user, primary buyer)*
- Runs a small service business (e.g. a two-chair salon). Does the books themselves in Xero, or reviews them monthly.
- **Pain:** the bank feed shows a £847 deposit and calls it revenue. Real turnover was £1,340. Commission and fees are invisible, so turnover is understated, expenses are missing, and the VAT/tax trail is wrong from day one.
- **Goal:** see true turnover, get platform fees recorded as a real expense, and trust that the books match reality — without learning clearing-account accounting.
- **Success:** uploads the statement, reads a plain-English summary, clicks approve, sees £0.00 proof.

**Persona B — Priya, the bookkeeper / accountant** *(secondary user, key influencer)*
- Keeps books for several marketplace-selling clients. Today she grosses-up settlement statements by hand or lets the error stand.
- **Pain:** manual, error-prone, and unauditable; every client's platform statement has to be reverse-engineered into revenue + fees.
- **Goal:** a repeatable, deterministic, audit-trailed way to post the gross-up correctly, with every write traceable to a source row and a Xero ID.
- **Success:** a defensible audit trail (CSV row → planned action → Xero ID → tick) and a clearing account that provably nets to zero.

**Persona C — Alex, the platform-worker / freelancer** *(tertiary user)*
- Self-employed, on a services or delivery platform, filing their own Self Assessment.
- **Pain:** doesn't realise reported income is understated by withheld fees; risks a wrong tax filing.
- **Goal:** correct income and deductible-fee records with minimal accounting knowledge.

### 1.3 Who this is *not* for

- Businesses paid gross (no platform intermediary) — they have no gross-up problem.
- Enterprises needing multi-entity, multi-currency, or live marketplace API sync — **[Roadmap]**, not this build.
- Anyone wanting automatic categorisation / NL Q&A over their ledger — out of scope (`01 §10`).

---

## 2. Value Proposition per Persona

| Persona | Before PayoutBridge | After PayoutBridge |
|---|---|---|
| Sam (owner) | Turnover understated by £493; fees invisible; VAT wrong | True £1,340 turnover, £493 fees booked, £0.00 clearing proof |
| Priya (bookkeeper) | Manual gross-up per client, no audit trail | Deterministic 3-write plan, full CSV→Xero-ID audit trail |
| Alex (freelancer) | Income under-reported at tax time | Correct income + deductible fees, defensible record |

**One-line pitch (from `01`):** *"Your bank feed has been lying about your turnover."*

---

## 3. Use Cases

Each use case: **Actor**, **Trigger**, **Preconditions**, **Main flow**, **Outcome**, **Value**. Flows reference the golden path in [`01-APP-OVERVIEW.md §4`](01-APP-OVERVIEW.md).

### UC-1 — Correct a marketplace settlement statement **[Demo]**
- **Actor:** Sam (owner) or Priya (bookkeeper)
- **Trigger:** A marketplace settlement statement (CSV) arrives by email at period end.
- **Preconditions:** Xero connected (Demo Company); clearing + fee accounts seeded; net deposit present in the bank.
- **Main flow:**
  1. Upload the CSV (drag & drop).
  2. App parses it, validates `gross − commission − fees − refunds === net`, and proposes a 3-write plan in plain English.
  3. Sam reviews the "What Xero will do" checklist and clicks **Approve & Post to Xero**.
  4. App posts invoice (gross) → bank transaction (fees) → payment (net), logging each Xero ID.
  5. App reads the clearing balance back: **£0.00**, and shows P&L before/after.
- **Outcome:** Books show true turnover and real fees; clearing account nets to zero; audit trail complete.
- **Value:** The core promise — opaque net deposit becomes auditable, Xero-native, gross-up accounting with a human approving every write.

### UC-2 — Re-upload the same statement without double-posting **[Supported]**
- **Actor:** Sam or Priya
- **Trigger:** The same CSV is uploaded again (forwarded twice, re-run, or unsure whether it posted).
- **Preconditions:** The file was already fully posted.
- **Main flow:** App computes `sha256(file_bytes)`, finds it in `posted.json`, and short-circuits before any write.
- **Outcome:** Amber banner — *"Already posted — skipped (idempotent)"* — with the existing Xero IDs. Zero new writes.
- **Value:** Idempotency by file hash means a duplicate can never corrupt the ledger.

### UC-3 — Resume safely after a crash mid-posting **[Supported]**
- **Actor:** System (recovery), observed by the user
- **Trigger:** The process dies between writes (e.g. after the invoice, before the fees).
- **Preconditions:** At least one of the three writes completed and was recorded.
- **Main flow:** On the next `/approve`, the step-map in `posted.json` shows the completed step; the app skips it and resumes from the next write.
- **Outcome:** The remaining writes complete exactly once; no double-posting.
- **Value:** Per-step (not per-file) idempotency makes execution crash-safe — a production-grade control, not a demo shortcut.

### UC-4 — Defend the books to an accountant or HMRC **[Supported]**
- **Actor:** Priya (bookkeeper) or Sam at tax time
- **Trigger:** Someone asks *"where did this revenue / this fee come from?"*
- **Preconditions:** A statement has been posted.
- **Main flow:** Open the Audit Trail (Transaction Trace) panel; each row maps a CSV input to the Xero write it produced, with the returned Xero ID, timestamp, and status tick.
- **Outcome:** Every posted figure is traceable to a source row and a Xero object.
- **Value:** Turns "trust me" into a defensible, timestamped audit trail.

### UC-5 — Prove the clearing account is truly zero at period end **[Demo]**
- **Actor:** Sam or Priya
- **Trigger:** End-of-period reconciliation check.
- **Preconditions:** UC-1 completed for the period's statements.
- **Main flow:** App performs a live verification read of the Platform Clearing balance and renders the reconciliation (`gross − comm & fees = net`, clearing = **£0.00 ✓**).
- **Outcome:** Independent, live confirmation from Xero that the writes exactly offset.
- **Value:** The payoff moment — the numbers reconcile against real Xero data, not a local assertion.

### UC-6 — Refuse to post books that don't balance **[Supported]**
- **Actor:** System (guardrail), observed by the user
- **Trigger:** A statement whose figures violate the invariant (`gross − commission − fees − refunds ≠ net`).
- **Preconditions:** File uploaded.
- **Main flow:** The Pydantic validator fails; the app returns a 422 and refuses to build a plan.
- **Outcome:** No proposal, no writes — the app is *structurally unable* to propose unbalanced books.
- **Value:** A wrong journal is worse than none; the guardrail is the safety story judges reward.

---

## 4. Roadmap Use Cases (explicitly out of scope for this build)

Listed so the audience understands the boundary — none are implemented (`01 §10`).

| Ref | Use case | Why deferred |
|---|---|---|
| UC-R1 | Email-to-agent auto-ingestion (statement arrives → auto-proposed) | Make stretch goal; manual upload is the reliable demo path |
| UC-R2 | Multiple marketplace formats via schema inference | Golden path uses a hardcoded, deterministic column map; no LLM inference |
| UC-R3 | Refunds / credit notes (`create-credit-note`) | Demo is refund-free by design to keep the invariant clean |
| UC-R4 | Multi-client bookkeeper dashboard | Single-tenant Demo Company only |
| UC-R5 | Live marketplace API connection, VAT splitting, forecasting | Scope and rounding risk for a 90-second demo |

---

## 5. Primary User Story (narrative)

> Sam runs a small salon and takes new-client bookings through a marketplace. Every fortnight the platform wires a net payout — last period, £847 — and Xero's bank feed files it as revenue. Sam never sees that the real turnover was £1,340, that the platform kept £445.90 in commission and £47.10 in prepayment fees, or that the VAT trail has been wrong since the first payout.
>
> Sam forwards the settlement CSV into PayoutBridge and drops it in. In ten seconds the app shows the real numbers in plain English and a three-line checklist of exactly what it will write to Xero. Sam clicks **Approve**. Three writes post, each logged with its Xero ID, and the clearing account reads back **£0.00**. Side by side, the P&L flips from £847 of revenue to £1,340 with £493 of newly-visible expense — same net, true books.
>
> Sam's accountant, Priya, opens the audit trail later and traces every figure back to a row in the original statement. Nothing to reverse-engineer, nothing to take on trust.

---

## 6. Traceability

| This document | Maps to |
|---|---|
| Personas A–C, target segments | Problem statement, `01 §2` |
| UC-1, UC-5 | Golden path + verification, `01 §3–4` |
| UC-2, UC-3 | Idempotency & crash safety, `01 §7.2` |
| UC-4 | Audit trail, `01 §7.3` |
| UC-6 | Accounting invariant, `01 §3` |
| Roadmap UC-R1…R5 | Out of scope, `01 §10` |
