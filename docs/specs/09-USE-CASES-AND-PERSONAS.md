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

> **Entry points (decided 2026-07-05):** the product ships as **3 doors, 1 room** — the landing page offers three persona cards (owner / bookkeeper / freelancer) that pre-select a persona at sign-up; a navbar switcher re-tints the shared app (KPI order, greeting, panel emphasis, assistant prompts). No separate per-persona builds — UC-R4 stays roadmap. Full tinting map: [`11-EXPANSION-SPEC.md`](11-EXPANSION-SPEC.md) §P. Per-persona journeys, dashboard gap analysis, and the role-specific requirement backlog: **§7 below**.

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
- **Value:** Turns "trust me" into a defensible, timestamped audit trail. Strengthened by [`11`](11-EXPANSION-SPEC.md) E2 (source CSV attached to the Xero invoice) and E6 (provenance note in each object's Xero history).

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
| ~~UC-R3~~ | ~~Refunds / credit notes~~ — **promoted to UC-7 [Supported]** (2026-07-05) | See [`11-EXPANSION-SPEC.md`](11-EXPANSION-SPEC.md) E1 |
| UC-R4 | Multi-client bookkeeper dashboard | Single-tenant Demo Company only |
| UC-R5 | Live marketplace API connection, VAT splitting, forecasting | Scope and rounding risk for a 90-second demo |
| UC-R6 | Webhook-driven ingestion (invoice events instead of polling) | Needs public callback URL on demo day — unacceptable live risk (`11` E7) |

### UC-7 — Post a settlement containing refunds **[Supported]** *(promoted from UC-R3)*
- **Actor:** Sam or Priya
- **Trigger:** A settlement CSV whose `Refunds` column is non-zero (fixture `marketplaceco-payout-2107.csv`).
- **Main flow:** planner emits a **4-step plan** — invoice → `create-credit-note` (refund) → bank transaction (fees) → payment — invariant `gross − commission − fees − refunds === net` enforced as ever.
- **Outcome:** refunds appear as a credit note in Xero; clearing still nets to £0.00.
- **Value:** 4th distinct write type; proves the pattern generalises past the happy path. Detail: [`11-EXPANSION-SPEC.md`](11-EXPANSION-SPEC.md) E1.

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
| Persona journeys + requirement backlog (§7) | Entry system + tinting map, `11 §P` |

---

## 7. Persona Journeys & Role-Specific Requirements

> **Why this section exists.** As of 2026-07-05 the app has exactly **four** persona-conditional behaviors (KPI #1 label, approval-drawer heading, audit-trail default-open, chat prompt order — audit refs below); every other dashboard and `/app` block renders identically for all three roles. This section defines what each persona is actually trying to do on the webpage, how the current UI serves those jobs, and the requirement backlog that makes each door lead to a genuinely role-appropriate room. Requirement IDs (`GEN-*`, `SAM-*`, `PRI-*`, `ALX-*`) are the build backlog; implementation status of the `11 §P4` tinting map is tracked in `11 §P5`.

### 7.0 Cross-cutting findings (all personas)

| ID | Finding / requirement | Evidence | Effort |
|---|---|---|---|
| GEN-1 | **Bug:** the Log-in flow hard-codes persona `"owner"` — only Sign-up honors the door choice. Fix to preserve the stored persona. | `Navbar.tsx:282` | S |
| GEN-2 | No first-run empty state: a brand-new signup sees a fully populated dashboard of hardcoded illustrative numbers as if they were their own. Replace with a guided "upload your first statement" state. *(= SAM-1, ALX-5)* | `routes/index.tsx:111-123` | M |
| GEN-3 | Dashboard charts (turnover area, fees donut, payouts/week) and headline bars are hardcoded regardless of activity. Drive from real posted history once ≥1 statement exists; until then, label as illustrative or suppress. *(= SAM-6; erodes Priya's professional trust hardest)* | `routes/index.tsx:89, 257-294, 374-429` | L |
| GEN-4 | A failed Xero write shows a generic "!" — `StepResult.message` (the per-step failure reason) exists in the API layer but is never rendered. Surface it. *(= SAM-4, PRI-3)* | `payout-types.ts:72-73`, `StepProgress` | S |

### 7.1 Persona journey — Sam, salon owner

**Identity & context.** Sam owns and runs a two-chair beauty & spa salon. New clients book through a Treatwell-style marketplace (in-demo brand: **MarketplaceCo**; Treatwell is the real-world analogue only, never demo data), which deducts new-client commission and prepayment fees before paying out net. Sam does his own bookkeeping in Xero, or reviews it monthly — no formal accounting training. He needs numbers he can read at a glance and trust without translating clearing-account jargon.

**Jobs-to-be-done.**
- When the bank shows a deposit smaller than what clients actually paid, I want to see my *true* turnover, so I can price and plan off real numbers.
- When the marketplace silently keeps commission and fees, I want those recorded as a proper Xero expense, so I can claim them and stop understating costs.
- When HMRC or my VAT return depends on turnover being right, I want confidence the figures in Xero reflect gross sales, so I don't file wrong under Making Tax Digital.
- When I'm about to trust a number on screen, I want proof it reconciles against real Xero data, so I can sign off without a second-guess.
- When a settlement period closes, I want a five-minute Monday-morning ritual (upload → approve → done), so bookkeeping doesn't eat salon time.

**Screen-by-screen journey.**

| Step | Screen/surface | What Sam does | What Sam needs to see | Currently there? |
|---|---|---|---|---|
| 1 | Landing door card | Picks "I run the business" | Pain/value copy matching his situation | ✓ `routes/index.tsx:932` |
| 2 | Sign-up dialog | Confirms persona, creates account | Confirmation this sets up *his* view | ✓ persona stored |
| 3 | First dashboard visit | Lands on dashboard | An empty/onboarding state, not fabricated activity | ✗ — GEN-2 |
| 4 | Upload statement (`/app`) | Drags in the CSV | Plain confirmation the right file loaded | ✓ |
| 5 | Approval drawer | Reads gross/commission/fees/net + invariant badge | Heading in his language | ✓ "What Xero will do" (`app.tsx:103-107`) |
| 6 | Approve | Clicks Approve & Post | Nothing posts without his click | ✓ human-in-the-loop **[Demo]** |
| 7 | Step progress | Watches 3 writes | Xero IDs as proof, not just a spinner | ✓ |
| 8 | Clearing reconciliation | Sees £0.00 proof | The "money vanished, now accounted for" moment | ✓ **[Demo]** |
| 9 | P&L before/after | Compares £847 revenue vs £1,340 + £493 expense | Same net, true books, side by side | ✓ |
| 10 | Dashboard, next week | Returns after a period | Charts reflecting *his* real activity | partial — KPI #1 label tints (`index.tsx:327`); charts stay hardcoded (GEN-3) |

**How the current dashboard serves Sam.** The "Reported vs real" bars answer his #1 job *in concept* but mislead in practice — hardcoded figures a real owner would read as his own books (GEN-3). KPI #1 ("Real turnover (MTD)") is the one place the dashboard speaks his language. "Fees recovered" KPI is exactly his deductible-expense job — same hardcoded-data caveat. Upload CTA serves the ritual. Ticker marquee and greeting card carry no accounting job. Chatbot prompt order (starts "What did the platform take?") matches his top question.

**Gaps → proposed requirements.**

| Req ID | Requirement | Why (job) | Data already available? | Effort |
|---|---|---|---|---|
| SAM-1 | First-run empty state | Ritual + trust | → GEN-2 | S |
| SAM-2 | "Money the platform took this month" headline stat (aggregated commission + fees actually posted) | Fees-as-expense — today buried in the approval drawer, absent from dashboard | Yes — P&L `other_expenses` exists, never rendered (`payout-types.ts:130`) | S |
| SAM-3 | VAT-safe turnover figure, explicitly labelled as gross (pre-commission) for MTD | VAT/MTD exposure — no way today to know which number is VAT-relevant turnover | Partial — gross computed in plan; needs dashboard framing | M |
| SAM-4 | Per-step failure in plain English | Trust | → GEN-4 | S |
| SAM-5 | New-vs-repeat client split ("X new clients cost you £Y in commission") | Ties commission cost to *why* it was charged | Yes — `client_type` + `commission_rate` per booking, never aggregated (`payout-types.ts:16,19`) | M |
| SAM-6 | Charts driven by real posted history | Trust the numbers | → GEN-3 | L |

**Benefit line.** Sam's bank feed will only ever show him £847 — PayoutBridge shows him the £1,340 he actually earned, the £493 the platform quietly kept, and proof, straight from Xero, that the books balance to the penny.

### 7.2 Persona journey — Priya, freelance bookkeeper

**Identity & context.** Priya runs her own bookkeeping practice, keeping Xero books for 10–15 small service businesses — several sell through marketplaces (salons on a Treatwell-style platform, cleaners on a services marketplace). She is the **daily transaction recorder**; each client's accountant reviews and files at period end. Today she reverse-engineers settlement statements into revenue + fees by hand, one client's Xero org at a time. In PayoutBridge today she works **one client's books at a time** (single Demo Company; multi-client dashboard stays **[Roadmap]** UC-R4). Professional-grade needs: determinism, traceability, defensibility. She is also the **key influencer** — one convinced Priya brings 10–15 businesses.

**Jobs-to-be-done.**
1. When a client's fortnightly settlement CSV lands, I want a correct gross-up entry in minutes, so one file doesn't eat my margin.
2. When a client's accountant (or HMRC) questions a figure, I want every number traceable to a source row and a Xero ID, so I can defend it without re-deriving from memory.
3. When a client forwards the same statement twice, I want the system to refuse to double-post, so one email mistake never corrupts a ledger.
4. When posting crashes mid-run, I want to resume from the exact failed step, so I don't audit which of three writes already landed.
5. When a period closes, I want a provable clearing-balance-zero check, so I sign off with evidence, not assurance.

**Screen-by-screen journey.**

| Step | Screen/surface | What Priya does | What she needs to see | Currently there? |
|---|---|---|---|---|
| 1 | Landing door card | Picks "I keep the books" | Her pain named: manual gross-up, defensibility | ✓ `11 §P1` |
| 2 | Sign-up | Persona pre-selected | That this is a single-client session today | ✓ persona stored; ✗ no single-client framing |
| 3 | Dashboard | Skims before opening a client file | Clearing balance + audit-readiness first, not marketing charts | ✗ — `11 §P4` specifies clearing-first KPI order for bookkeeper; **not implemented** — KPI row identical today (`index.tsx:322-371`); charts hardcoded (GEN-3) |
| 4 | Upload client statement | Drops the CSV | Immediate parse feedback | ✓ |
| 5 | Approval drawer | Cross-checks figures against source CSV | Invariant badge, booking table, "Writes with Xero IDs" heading | ✓ heading tints (`app.tsx:103-107`) |
| 6 | Approve | Confirms the 3–4 write plan | Explicit per-write list before committing | ✓ |
| 7 | Step progress | Watches writes post | Xero IDs per step; failure detail if one fails | ✓ IDs; ✗ failure detail (GEN-4) |
| 8 | Idempotency banner | Confirms no double-post | "Already posted" with existing IDs | ✓ **[Supported]** UC-2 |
| 9 | Audit trail | Builds client-file evidence | Full table, expanded by default | ✓ auto-expanded for bookkeeper (`app.tsx:268`) |
| 10 | Clearing reconciliation | Verifies zero-balance | £0.00 badge | ✓ **[Demo]** UC-5 |
| 11 | Export for client file | Saves proof | One-click audit-trail export | ✗ — manual screenshots today (PRI-1) |
| 12 | Next client statement | Repeats | Run history with statuses across sessions | partial — `localStorage` sidebar only (PRI-5) |

**How the current dashboard serves her.** The audit trail, Xero-ID capture, and idempotency banner are *her* features — they answer "did this post, once, correctly, and can I prove it." The tinted heading and auto-expanded audit trail correctly bias `/app` toward her. But the dashboard's ticker, greeting card, and three hardcoded charts are decoration aimed at Sam's "see my real numbers" moment — noise for her at best. Worse: charts that render populated with illustrative figures before any upload are **actively corrosive to professional trust** — she bills on accuracy and knows to distrust unlabelled charts (GEN-3 hits her hardest).

**Gaps → proposed requirements.**

| Req ID | Requirement | Why (job) | Data already available? | Effort |
|---|---|---|---|---|
| PRI-1 | Audit-trail export (CSV/PDF) for the client file | Job 2 | Yes — `audit.json` has full rows | S |
| PRI-2 | Statement-level "evidence pack": source CSV hash + Xero IDs + zero-proof in one exportable view | Jobs 2, 5 — one artifact for the accountant | Yes — hash in `posted.json`, IDs in `StepResult`, balance from verification read | M |
| PRI-3 | Per-step error detail on failed write | Job 4 | → GEN-4 | S |
| PRI-4 | Implement clearing-first KPI order for bookkeeper (spec'd `11 §P4`, not built) + mute illustrative charts for this persona | Jobs 1, 5 — trust over decoration | KPI data exists; ordering/suppression is UI-only | S |
| PRI-5 | Run history with per-run status (posted / failed / skipped-idempotent) | Jobs 1, 3 | Partial — `completed_steps` exists in `ExistingIds`, unused | M |
| PRI-6 | Visible file-hash/dedupe indicator on upload, before approval | Job 3 — confidence before she commits time | Yes — sha256 computed pre-approve | S |

**Benefit line.** Versus hand gross-up, PayoutBridge gives Priya a deterministic, per-file audit trail she can produce on demand — cutting per-client close time while making every figure defensible to the client's accountant and HMRC, not just asserted.

### 7.3 Persona journey — Alex, self-employed freelancer

**Identity & context.** Alex is a mobile hair & beauty freelancer who gets clients through MarketplaceCo — the platform books the client, takes commission + prepayment fees, and pays out net weekly. Alex files their own UK Self Assessment (online deadline 31 January) and, once turnover crosses the phased MTD-for-ITSA thresholds, will need digital records anyway. Accounting skill ≈ zero: has never heard "clearing account" or "gross-up", and just wants to know — *is the number I'm about to declare right, and what can I legally deduct?*

**Jobs-to-be-done.**

| # | Job |
|---|---|
| J1 | When January's Self Assessment is due, I want the tax year's correct income figure (not the understated bank-deposit total), so I file without under-declaring. |
| J2 | When a weekly payout lands, I want to see what the platform actually took, so I know my real earnings before I spend against them. |
| J3 | When HMRC asks to see my records, I want proof tied to source statements, so I have more than "trust me". |
| J4 | When I look at my books, I want plain English, so I don't have to learn accounting to trust the tool. |

**Tax-saving angle.** Platform fees are a deductible business expense Alex doesn't know to claim. The demo statement shows £493.00 withheld (£445.90 commission + £47.10 fees) from £1,340.00 gross. At that weekly rate — *illustrative extrapolation* — roughly £25.6k/year of deductible fees would be invisible to him, because only the £847 net ever reaches the bank feed.

**Screen-by-screen journey.**

| Step | Screen/surface | What Alex does | What he needs to see (his language) | Currently there? |
|---|---|---|---|---|
| 1 | Landing door card | Picks "I work for myself" | Pain/value copy matching his situation | ✓ `routes/index.tsx:945-950` |
| 2 | Sign-up | Confirms freelancer persona | One click, no accounting questions | ✓ |
| 3 | First dashboard | Lands on populated dashboard | His one number ("Income for Self Assessment") standing out; the rest looking like *his* data | partial — KPI #1 tints (`index.tsx:327`); hardcoded charts undermine first impression (GEN-2/GEN-3) |
| 4 | Upload | Drags in the CSV | First-timer reassurance | ✗ no guided first-upload copy (ALX-5 → GEN-2) |
| 5 | Approval drawer | Reads the breakdown | "You earned £1,340, they kept £493, you take home £847" in plain words | partial — heading tints ("What we'll record"); invariant still surfaces as "balanced / invariant failed" — jargon (ALX-2) |
| 6 | Approve | Clicks Approve | A one-line plain-English confirmation of what's about to happen | ✗ trust barrier (ALX-4) |
| 7 | Done-proof | Watches steps | Confirmation in real words | ✓ step labels already plain ("Invoice", "Fees", "Payment") |
| 8 | "Tell HMRC" moment | Reconciliation / P&L | "This is your income figure; this is your deductible cost" | ✗ — still speaks "clearing balance = £0.00" and P&L jargon (ALX-1, ALX-2) |
| 9 | Back next week | Chatbot | Tax/fee-specific prompts | ✓ tinted prompts (`Chatbot.tsx:19-21`) |

**How the current dashboard serves him.** The "Income (Self Assessment)" KPI is his **only** persona touch — it serves J1 but stops short: income without its deduction pair, so he still can't read taxable profit off the dashboard. The "Reported vs real" bars are genuinely strong for him — they visualise exactly J1/J2 without needing a persona branch. Everything else is untinted noise or worse for him: the ticker reads like a stock widget; the clearing-balance KPI and P&L language are terms he can't decode; day-one hardcoded charts risk looking fabricated to someone deciding whether to trust the tool. Past the headline KPI, the current UI treats Alex identically to Sam and Priya — and their fluency with "clearing", "invariant", and "P&L" is exactly what he doesn't have.

**Gaps → proposed requirements.**

| Req ID | Requirement | Why (job) | Data already available? | Effort |
|---|---|---|---|---|
| ALX-1 | YTD "Income for Self Assessment" + "Deductible platform fees" pair — the two figures his tax return needs | J1 | Partial — P&L `other_expenses` exists, never rendered | M |
| ALX-2 | Jargon-free relabel layer when persona = freelancer ("clearing balance" → "money moving through"; "invariant" → "everything checks out") | J4 | Yes — copy-only | S |
| ALX-3 | "You'd have under-reported by £X" callout on the reported-vs-real bars | J1, J2 | Yes — delta already computed for the bars | S |
| ALX-4 | Plain-English approve confirmation ("we'll record £1,340 income and £493 costs in your Xero") before the write fires | J3 + trust barrier | Yes — figures in the `JournalPlan` | S |
| ALX-5 | Guided empty state for first-ever upload | J4, onboarding trust | → GEN-2 | M |
| ALX-6 | SA103F expense-category hint on the fees breakdown — *record-keeping aid only, not tax advice; copy + legal review required* | J1, J3 | Partial — no SA103 category mapping exists | L **[Roadmap]** |

**Benefit line.** At tax time, Alex declares the correct income and claims every fee the platform quietly withheld — without ever having to understand a clearing account to do it.

### 7.4 Consolidated build backlog (by effort)

| Effort | Requirements |
|---|---|
| **S** (copy/UI-only, data already flows) | GEN-1 (login persona bug), GEN-4 (step error detail), SAM-2, PRI-1, PRI-4, PRI-6, ALX-2, ALX-3, ALX-4 |
| **M** | GEN-2 (empty state — unlocks SAM-1/ALX-5), SAM-3, SAM-5, PRI-2, PRI-5, ALX-1 |
| **L** | GEN-3 (real chart data), ALX-6 **[Roadmap]** |

The S-row is a persona-differentiation pass achievable almost entirely in the frontend against data the API layer already returns; the M-row needs modest backend aggregation (`/dashboard` additions); GEN-3 is the only structural piece.
