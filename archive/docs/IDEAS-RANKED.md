# Xero App & Agent Hackathon — Top-10 Ideas Ranked by Win-Confidence

> **⚠ Verifier corrections — read before pitching (full verdicts in Appendix A):**
> - **FALSE claim caught & removed from logic:** the stated reason to kill #10 *ContractToCashline* — that Xero's RepeatingInvoices API is read-only / template creation is "technically impossible" — is **wrong**. The core Accounting REST API supports **POST/PUT on repeating invoices since ~Aug 2022**; only the *MCP toolkit wrapper* lacks the tool (GitHub xero-mcp-server#113). ContractToCashline is more feasible than its rank implies — build against the REST API directly, not the MCP wrapper.
> - **#2 LedgerMedic differentiation overstated:** "XBert/Booke only flag" is not accurate — XBert ships auto-resolve, Booke auto-categorises. The real, narrower wedge = **auto-posting an audit-trailed correcting manual journal**. Pitch that exact gap, not "they only flag."
> - **Unverified micro-facts:** Custom Connection price (quoted inconsistently as £5 vs $5) and the 60/min rate limit — confirm on developer.xero.com before quoting on stage.
> - **2nd-opinion (ollama deepseek-v4-pro) disagreements >20 pts:** RevenueGuard 83 vs Claude 58, PayoutClarity 70 vs 46 — both may be underrated; re-judge if you lean B03. (ollama scored optimistically across the board; the red-teamed Claude numbers are the conservative primary.)
> - **Method caveat:** integer 0-100 sub-scores encode *judgement*, not measurement — treat as calibrated ranking, not a true probability.

**What this number is (and is not).** Win-Confidence (0–100) is a weighted blend of six factors mapped to the actual judging rubric (50% Xero-Connection, 30% API Integration, 20% Architecture, with the 3-minute demo as the tie-breaker). It estimates *how likely this idea is to win this specific rubric with a weekend build and a 90-second demo*, combined with *whether it solves a real problem for a large number of businesses*. It is not a guarantee — a judged event cannot be guaranteed, and a 68 does not mean "68% chance of winning"; it means the idea scores 68/100 against the rubric-weighted factor model after independent verification stripped out false claims and a red-team pass docked scores for weaknesses the first scorer missed. Every score below carries its red-team corrections un-rounded.

---

## 1. The Measure: Win-Confidence Rubric

| # | Factor | Weight | What 100 means |
|---|--------|--------|----------------|
| F1 | **Xero-Centrality** | 25% | Remove Xero and the product ceases to exist. Xero's ledger is the source of truth AND the destination of every action — reads drive decisions, writes execute them. (Deletion test: if a spreadsheet swap leaves the demo intact, F1 caps at 40.) |
| F2 | **API-Depth** | 15% | Coordinated multi-endpoint reads feeding writes across ≥3 create/update types (manual-journal + payment + credit-note), correct accounting pattern (clearing-account gross-up), idempotent, human-in-loop before ledger writes. Only distinct write types exercised in the live demo count. |
| F3 | **Weekend-Feasibility** | 20% | One flow, fully demoable on the resettable UK Demo Company; every dependency mocked-input-safe (CSV/PDF upload, not live scrape); stays under rate limits. |
| F4 | **Demo-Wow / Legibility** | 15% | A 90-second single flow where a messy input becomes a correct Xero ledger state ON SCREEN — the before/after ledger diff is the wow, self-evident to an accountant judge. |
| F5 | **Differentiation-vs-incumbents** | 15% | Verified white-space: zero incumbent, AND falls inside a JAX contractual ban (forecasting/advice) or autonomously FIXES where others only flag. Unexcluded overlap caps F5 at 50. |
| F6 | **Real-World-Impact / Scale** | 10% | Quantified pain across a large Xero-reachable segment (4.4M subscribers, 1000+ App Store apps for real distribution). |

---

## 2. Score at a Glance

```
GigLedger        (B01)  ████████████████████████████████████░░░░░░░░░░░░░░  68
LedgerMedic      (B01)  ███████████████████████████████████░░░░░░░░░░░░░░░  66
StatementMatch   (B01)  █████████████████████████████████░░░░░░░░░░░░░░░░░  63
X-Border FX      (B01)  █████████████████████████████████░░░░░░░░░░░░░░░░░  62  ✗ failed red-team
Fund Guardian    (B01)  ███████████████████████████████░░░░░░░░░░░░░░░░░░░  59
RevenueGuard     (B03)  ██████████████████████████████░░░░░░░░░░░░░░░░░░░░  58
LedgerSense      (B02)  █████████████████████████████░░░░░░░░░░░░░░░░░░░░░  55
Section 24 MTD   (B01)  ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░  54
PayoutClarity    (B03)  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  46
ContractToCash   (B02)  ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  42  ✗ core write API doesn't exist
```

---

## 3. Top-10 Ranking

| Rank | Idea | Bounty | Win-Confidence | Why it wins | #1 Risk |
|------|------|--------|:---:|-------------|---------|
| 1 | **GigLedger** — Service/Gig Payout Reconciler | B01 | **68** | Verified white-space (A2X/Link My Books/Synder are ecommerce-only; no service/gig connector exists), textbook clearing-account gross-up pattern hits the API-depth rubric, and the net-vs-gross fix is a real accounting wrong that every downstream report inherits. | LLM schema-inference across refund/VAT/fee edge cases is fragile (F3=47); the demo must narrow to ONE platform schema or the golden path breaks. |
| 2 | **LedgerMedic** — Month-End Remediation w/ Audit-Trailed Journals | B01 | **66** | Named in the hackathon's own open-gap list; XBert/Booke verified flag-only — this FIXES with a correcting journal + approval + audit trail, exactly what F5=100 describes. | Reliable error-detection over the Reports-API trial balance is fragile; the stage demo depends on a deterministically pre-seeded error. |
| 3 | **StatementMatch** — AP Supplier-Statement Reconciler | B01 | **63** | Highest feasibility in the field (F3=72): PDF-in, diff, one draft-bill write — a golden path that is hard to kill on stage, in a confirmed gap (no native Xero AP statement recon). | Fails the strict deletion test — statement-vs-bill matching runs fine against a CSV; only one thin Xero write (F1 docked 78→68). |
| 4 | **Cross-Border Freelancer/Agency FX Payout Reconciler** | B01 | **62** | Deepest API pattern in the set (F2=80: bills + bank-transactions + FX manual-journals through a clearing account) in confirmed white-space. **But the red-team killed it**: strictly-worse, narrower C01. | **Did not survive red-team** (F3=32): per-contractor realized FX gain/loss inference is unbuildable-reliably in 24h, and the FX diff is invisible on a projector. Redundant with #1. |
| 5 | **Fund Guardian** — Restricted-Fund Compliance for Non-Profits | B01 | **59** | Solid feasibility (F3=74) on a real legal obligation (restricted vs unrestricted funds) with no native Xero fund-accounting concept; correcting-journal + treasurer approval hits the architecture pillar. | Differentiation is thin (F5=46): auto-tagging overlaps JAX categorization, and Keela/Infoodle already occupy nonprofit fund-tracking territory. |
| 6 | **RevenueGuard** — Recurring-Revenue Leakage & Recovery | B03 | **58** | The only credible B03 entry: proactive autonomous action on revenue (draft correcting invoices/credit-notes), in a niche no Xero App Store app covers. Diversity 2nd-opinion loved it (83). | Intent-inference over sparse repeating-invoice data is fragile and Demo Company data is thin — the leakage £ figure is a number the judge must trust, not watch change. |
| 7 | **LedgerSense** — Per-Line-Item Chart-of-Accounts Judgment | B02 | **55** | Xero's chart-of-accounts + historical coding as both training signal and write target; explainable per-line rationale is a genuine layer Dext lacks. | Verification found Dext Prepare already does per-line-item account+tax assignment (F5 crushed 42→30) — the moat is only "LLM reasoning + explainability", a hard sell in 90 seconds. |
| 8 | **Section 24 MTD Landlord Pre-Filer** | B01 | **54** | Real deadline pressure (MTD ITSA mandatory 6 Apr 2026, first quarterly update 7 Aug 2026 — weeks away at event time) and the highest verified impact score after C01. | FreeAgent already automates the exact hook (Section 24 + MTD ITSA quarterly filing); F3=40 — multi-source tax logic is a genuine weekend-build hazard. |
| 9 | **PayoutClarity** — Commission & Fee Rate-Card Auditor | B03 | **46** | Novel proactive-revenue layer (rate-card variance audit) no incumbent offers even in ecommerce; JAX verified non-advisory so the judgment layer is open. | The Xero write path is semantically undefined — a credit note is merchant-to-customer, not merchant-to-platform (F1=38); it also depends on C01's clearing ledger existing first. |
| 10 | **ContractToCashline** — Contract/SOW → Recurring-Invoice Setup | B02 | **42** | Confirmed whitespace (no incumbent does contract-to-billing-schedule extraction) and a genuinely clever "Xero as enforcement layer" frame. | **Fatal**: Xero's RepeatingInvoices endpoint is GET-only — the flagship mechanic (auto-creating a repeating-invoice template) is technically impossible against the public API, not just out of toolkit scope. |

**Also-ran note:** all ten scored candidates appear in this table — nothing was cut below the line. The full scored set and the top-10 are the same list; the meaningful cut lines are red-team survival (C14 failed) and API existence (C13's core write doesn't exist).

---

## 4. Idea Profiles

### #1 · GigLedger — Service/Gig Payout Reconciler (B01) — **68**

**Problem.** Service/gig platforms (Treatwell, Fresha, Booksy, Uber, Deliveroo, Airbnb, Fiverr, Upwork) pay net-of-commission/fees/VAT/refunds with no standard schema. Xero's bank feed books the NET deposit as revenue — understating turnover and burying VAT and commission as invisible cost, corrupting every downstream report and tax filing. Scale: no pre-built connector covers this vertical at all, across Xero's 4.4M-subscriber reach (UK, its largest international market, is dense with exactly these merchants).

**Xero-central angle.** LLM parses any payout doc and posts `create-manual-journal` / `create-bank-transaction` against a "Platform Clearing" account — gross revenue, commission expense, processing fee, VAT, FX — tagged per-platform via `tracking-category`, then reconciles the clearing account to the actual net bank deposit (`list-bank-transactions`). Human approves before posting. The write API IS the fix.

**Factor sub-scores.** F1 Xero-Centrality **82** · F2 API-Depth **75** · F3 Feasibility **47** · F4 Demo-Wow **76** (red-teamed 85→76) · F5 Differentiation **66** (red-teamed 73→66) · F6 Impact **55**.

**Diversity 2nd-opinion: 84** (Δ+16 vs 68 — agrees, no flag; the independent pass liked it even more).

**Red-team weaknesses (survived).**
- "Any CSV/PDF from 8 platforms" is scope inflation — the live demo must narrow to ONE schema (Treatwell) or the golden path breaks.
- The net-vs-gross "aha" needs one beat of accountant narration; not fully self-evident.
- LLM schema-inference across refund/VAT/partial-fee edge cases is the fragile part — F3=47 is honest.
- Moat is "no NATIVE per-platform connector": Synder indirectly reconciles Stripe/PayPal-routed payouts and JAX auto-reconciles the raw bank line.
- Verification correction: Custom Connection M2M is NOT free (~£5/mo per org) — demo via standard OAuth2 authorization-code flow on the UK Demo Company instead; and the Demo Company resets every 28 days, not hourly.

**Weekend build sketch.**
- *Golden path:* seed the UK Demo Company with a net Treatwell deposit in the bank feed → upload one seeded Treatwell payout CSV → LLM extracts gross/commission/fee/VAT/net → approval screen shows the proposed journal in plain English → one click → journal + clearing-account entries post → clearing account zeroes against the net deposit.
- *API calls:* `list-bank-transactions` (find the net deposit) → `create-manual-journal` (gross-up split) → `create-bank-transaction` (clearing entries) → `list-P&L` (before/after) — with an idempotency key per payout file.
- *Mock:* the payout CSV itself (static, seeded, one schema — Treatwell only); auth via standard OAuth2 auth-code flow, not the falsely-"free" M2M.
- *90-second wow:* split screen — P&L BEFORE (net booked as revenue, no commission line) vs P&L AFTER (gross revenue up, commission expense and VAT visible, clearing account at zero). One sentence of narration: "your bank feed has been lying about your turnover."

---

### #2 · LedgerMedic — Month-End Remediation with Audit-Trailed Journals (B01) — **66**

**Problem.** XBert and Booke AI detect bookkeeping issues but stop at a flag; someone still has to research and manually book every correcting entry — the real time sink for bookkeepers closing many small clients, and impossible for owners without a bookkeeper. Scale: named in the hackathon's own gap list (d) as still open in 2025–2026; the flag-only status of both incumbents was independently verified.

**Xero-central angle.** Trial balance (via the Reports API), `list-manual-journal` history and `list-bank-transactions` detect the anomaly; `create-manual-journal` posts the correcting entry with an "AI-suggested, human-approved" `tracking-category` tag, a linked before/after note, and an idempotency key per fix. Detection → approved fix → audit trail, directly hitting the 20% architecture pillar.

**Factor sub-scores.** F1 **82** · F2 **56** · F3 **57** (red-teamed 63→57) · F4 **70** (red-teamed 78→70) · F5 **72** · F6 **48**.

**Diversity 2nd-opinion: 75** (Δ+9 — agrees, no flag).

**Red-team weaknesses (survived).**
- LLM detection of miscoded transactions / VAT anomalies over the Reports-API trial balance is accounting-logic-fragile; a reliable demo needs a PRE-SEEDED known error — close to staging the wow.
- Only the post-journal ledger diff is self-evident; the detection step asks the judge to trust the tool found a real error.
- Overlap risk with JAX data-entry/reconcile if the "error" is a mis-categorization JAX would also surface.
- Verification note: trial balance comes from the Reports API, not a flat CRUD endpoint — slightly more integration surface than assumed.

**Weekend build sketch.**
- *Golden path:* seed a deliberate miscoding into the Demo Company (e.g. an asset purchase booked to office expenses) → agent scans trial balance + bank transactions → flags the anomaly with a plain-English rationale ("this £2,400 laptop was expensed; it should be capitalised") → one tap → correcting journal posts, tagged and noted.
- *API calls:* Reports-API trial balance + `list-bank-transactions` + `list-manual-journal` (detect) → `create-manual-journal` with `tracking-category` reference (fix), idempotency key per finding.
- *Mock:* the seeded error is the mock — deterministic, chosen so the fix is obvious to an accountant judge. Pick an error class JAX does NOT handle (a journal-level miscoding, not a bank-line categorisation).
- *90-second wow:* before/after trial balance diff on screen — the wrong line turns right, and the audit-trail note shows exactly who approved what and why. Tagline: "XBert tells you it's broken. We fix it — with a paper trail."

---

### #3 · StatementMatch — AP Supplier-Statement Reconciler (B01) — **63**

**Problem.** No native Xero feature reconciles supplier statements against the bills ledger. Missing bills silently understate liabilities until a supplier chases for money already owed; duplicates get paid twice. Scale caveat (verified): the pitch's headline stats ("1.29% of volume at ~$2,034 each"; "76%/17%" fraud figures) could NOT be confirmed — the closest real source (Fiscaltec) gives a 1–2.5% range of disbursements with no per-item figure. Pitch the pain qualitatively; do not quote those numbers to judges.

**Xero-central angle.** `list-bank-transactions` + `list-invoices` (bills) build the AP view; an LLM parses the statement PDF into structured lines, diffs against Xero, and on approval calls `create-invoice` (draft bill) for missing items or `update-invoice` notes for disputes.

**Factor sub-scores.** F1 **68** (red-teamed 78→68) · F2 **50** · F3 **72** · F4 **60** (red-teamed 72→60) · F5 **76** · F6 **40** (red-teamed 45→40).

**Diversity 2nd-opinion: 73** (Δ+10 — agrees, no flag).

**Red-team weaknesses (survived).**
- Deletion test bites: statement-vs-bill matching is ledger-agnostic — swap Xero bills for a CSV and the matcher still runs.
- Primary output is a discrepancy report + a chase EMAIL (non-Xero); the only Xero write is a single draft bill, so the on-screen ledger change is thin.
- Headline impact stats are unsourced; AP-statement recon is real but mid-size pain.

**Weekend build sketch.**
- *Golden path:* upload a supplier statement PDF (seeded to partially match a Demo Company supplier) → parsed line table appears → three rows highlighted: MISSING, DUPLICATE, AMOUNT-MISMATCH → approve → draft bill created for the missing item; dispute note attached to the duplicate.
- *API calls:* `list-invoices` (bills) + `list-bank-transactions` (read) → `create-invoice` (draft bill) + `update-invoice` (dispute note).
- *Mock:* the statement PDF (crafted so the diff is dramatic); the chase email is displayed, not sent.
- *90-second wow:* the MISSING row turning into a real draft bill inside Xero — "a liability your books didn't know about, now on the ledger before the supplier calls." To fight the thin-write critique, end on the Xero bills screen, not the report.

---

### #4 · Cross-Border Freelancer/Agency FX Payout Reconciler (B01) — **62** — FAILED RED-TEAM

**Problem.** Agencies paying dozens of overseas freelancers via Wise/Payoneer/Deel get batch payouts that net off platform fees and FX spread before the bank feed — so Xero books the net as the full expense, or the bookkeeper splits every batch by hand. No quantified market-scale figure exists for this segment (verified), which caps F6.

**Xero-central angle.** LLM infers gross/fee/FX-rate/net per contractor from any schema; `create-bill` / `create-bank-transaction` against a Payouts-Clearing account; FX gain/loss via `create-manual-journal` — the ecommerce gross-up pattern applied to cross-border service payouts.

**Factor sub-scores.** F1 **82** · F2 **80** (highest in field) · F3 **32** (red-teamed 38→32) · F4 **54** (red-teamed 65→54) · F5 **72** · F6 **40**.

**Diversity 2nd-opinion: 69** (Δ+7 — agrees on the number, not the verdict).

**Red-team verdict: DID NOT SURVIVE.** This is the one candidate the red-team eliminated despite a top-4 score:
- Strictly-worse, narrower variant of #1 GigLedger: same clearing-account gross-up pattern but harder per-contractor realized FX gain/loss inference and a much smaller segment — redundant in any portfolio that keeps GigLedger.
- Even scoped to one provider, auto-booking realized FX gain/loss per contractor is genuine multi-step accounting that will not be reliable in 24h.
- FX gain/loss is subtle — not a self-evident ledger diff in 90 seconds on a projector.

**Weekend build sketch (for completeness — recommend NOT building).**
- *Golden path (if forced):* one provider only (Wise), one batch CSV → per-contractor bills against Payouts-Clearing → one aggregate FX gain/loss journal (not per-contractor) → clearing zeroes against the net deposit.
- *API calls:* `create-bill`, `create-bank-transaction`, `create-manual-journal`, `list-bank-transactions`.
- *Mock:* the Wise statement CSV; a hard-coded contractor→Xero-contact map.
- *Bottom line:* everything demoable here is demoable more legibly with GigLedger. Skip.

---

### #5 · Fund Guardian — Restricted-Fund Compliance Agent for Non-Profits (B01) — **59**

**Problem.** Small charities must legally keep restricted donor/grant funds separate from unrestricted, but Xero has no native fund-accounting concept — most hack it with manual tracking categories or a side spreadsheet, risking regulator action on a compliance breach. Scale: niche segment, and (verified) no quantified non-profit impact figure exists — F6 stays capped at 42.

**Xero-central angle.** Classifies each new bank-transaction/invoice/bill against fund rules using the two available tracking categories (Fund × Restriction-type), auto-applies tags, runs a scheduled `list-bank-transactions` scan for mis-posts, drafts a correcting `create-manual-journal` for treasurer approval, and produces a rolling P&L-by-fund via `list-P&L` filtered by tracking category.

**Factor sub-scores.** F1 **70** (red-teamed 78→70) · F2 **55** · F3 **74** · F4 **52** (red-teamed 60→52) · F5 **46** (red-teamed 58→46) · F6 **42**.

**Diversity 2nd-opinion: 61** (Δ+2 — agrees, no flag).

**Red-team weaknesses (survived).**
- Auto-tagging to a tracking category is close to JAX auto-categorization; Keela/Infoodle already occupy nonprofit accounting in the Xero App Store (the "zero marketplace competition" claim was verified as overstated).
- The 2-active-tracking-category cap (~100 options) blocks multi-dimensional fund structures (fund × program), constraining the real workflow.
- Tag-changes-plus-journal is a low-drama demo whose "aha" needs fund-restriction domain knowledge.

**Weekend build sketch.**
- *Golden path:* Demo Company pre-set with Fund and Restriction tracking categories → seed a grant receipt and an expense wrongly paid from restricted funds → agent scan flags the breach in plain English ("£800 of the Community Kitchen grant was spent on general admin") → treasurer approves → correcting journal posts → P&L-by-fund shows the restricted fund whole again.
- *API calls:* `list-bank-transactions` (scan) → update transactions with `tracking-category` tags → `create-manual-journal` (correction) → `list-P&L` filtered by tracking category (fund report).
- *Mock:* the fund-rules sheet (a simple JSON of grant terms).
- *90-second wow:* the P&L-by-fund report — a view Xero cannot natively produce — plus the breach caught and fixed. Lead with "this is a legal requirement, not a preference" to buy the domain-knowledge beat.

---

### #6 · RevenueGuard — Recurring-Revenue Leakage & Recovery Agent (B03) — **58**

**Problem.** Subscription/membership SMEs (spas, gyms, retainer agencies) lose revenue silently when a plan changes, a card fails, or a renewal is forgotten. Xero flags it only as a missing bank match, never as a revenue problem. Scale: real mid-size pain, no hard number attached (F6=45); the differentiation moat is thin — Zuora/NetSuite ship leakage detection commercially, it just doesn't exist Xero-native.

**Xero-central angle.** Reads `list-invoices` (repeating), `list-bank-transactions`, `list-contacts` to reconstruct expected-vs-actual billing cadence per customer, then writes draft `create-invoice` / `create-credit-note` corrections behind a human-approval gate — proactive autonomous action on revenue, exactly what B03 demands.

**Factor sub-scores.** F1 **70** · F2 **58** · F3 **60** (red-teamed 72→60) · F4 **56** (red-teamed 64→56) · F5 **44** (red-teamed 50→44) · F6 **45**.

**Diversity 2nd-opinion: 83 — FLAG: disagrees by +25.** The independent pass rated this far higher than the primary score. Read: if the team wants B03 specifically, this is the candidate where a second evaluator saw materially more upside than the red-teamed consensus — worth a deliberate look before dismissing it as mid-table.

**Red-team weaknesses (survived).**
- Detecting silently-lapsed direct debits and under-billed plan changes means inferring intent from sparse repeating-invoice data — fragile, and the UK Demo Company's repeating-invoice data is thin, so the scenario must be heavily seeded.
- Leakage is invisible until quantified; the judge must trust the £ figure it prints.
- Verification corrections: Custom Connections cost $5/mo (free only against the Demo Company), and the 60/min rate limit could not be corroborated this pass (5,000/day per org is the confirmed figure).

**Weekend build sketch.**
- *Golden path:* seed 5 customers with repeating invoices; break two (one lapsed direct debit, one under-billed plan change) → agent reconstructs cadence per customer → dashboard: "£1,140 leaked across 2 customers, here's the evidence" → approve → draft correcting invoices appear in Xero.
- *API calls:* `list-invoices` (repeating) + `list-bank-transactions` + `list-contacts` (detect) → `create-invoice` + `create-credit-note` (recover), idempotent per gap found.
- *Mock:* the entire customer history is seeded — deterministic gaps, deterministic detection.
- *90-second wow:* the recovered-£ counter plus draft invoices materialising in the Xero AR screen. Counter the "trust the number" weakness by clicking into one gap and showing the raw expected-vs-actual timeline.

---

### #7 · LedgerSense — Per-Line-Item Chart-of-Accounts Judgment Agent (B02) — **55**

**Problem.** AI invoice tools do OCR/extraction well but categorise from historical rules. The originally claimed gap ("none reason per line item") was verified as OVERSTATED: Dext Prepare's Line Item Extraction already assigns per-line account codes and tax rates. The true remaining gap is narrower — Dext's per-line coding is rule/grouping-driven, not LLM semantic reasoning with explainable rationale or policy logic (capitalisation thresholds, COGS-vs-overhead).

**Xero-central angle.** Xero's chart of accounts + tax rates are the ground truth; the agent reads historical Xero coding to calibrate, classifies each line, and writes drafts via `create-bank-transaction` / `create-invoice` with `tracking-category`. Xero is both the training signal and the write target.

**Factor sub-scores.** F1 **65** · F2 **55** · F3 **60** (verify-adjusted 68→60) · F4 **58** (verify-adjusted 60→58) · F5 **30** (verify-adjusted 42→30 on the Dext finding) · F6 **48** (verify-adjusted 50→48).

**Diversity 2nd-opinion: 68** (Δ+13 — mild disagreement, under the flag threshold).

**Red-team weaknesses.** None recorded beyond the verification pass — but the verification pass itself did the damage: the differentiation story now rests entirely on "deeper reasoning + explainability + policy logic," which is real but hard to make visible against an incumbent that produces similar-looking output.

**Weekend build sketch.**
- *Golden path:* upload one messy multi-language invoice (pre-OCR'd — input arrives as structured text, OCR is out of scope) → per-line classification table: each line gets an account, a tax code, and a one-sentence rationale ("capitalised: unit price above your £500 asset threshold") → approve → draft bill lands in Xero with per-line coding.
- *API calls:* `list-accounts` + historical `list-invoices` coding (calibrate) → `create-invoice` (draft bill, per-line accounts) with `tracking-category`.
- *Mock:* the OCR step entirely; a stated company policy sheet (capitalisation threshold, COGS rules).
- *90-second wow:* eight messy foreign-language lines each landing on the right account WITH a visible reason. The rationale column is the differentiator — make it the biggest thing on screen, because per-line coding alone is something Dext already shows.

---

### #8 · Section 24 MTD Landlord Pre-Filer (B01) — **54**

**Problem.** MTD for Income Tax is mandatory from 6 April 2026 for >£50k sole traders/landlords; first quarterly update due 7 August 2026 (verified dates). Most affected landlords still keep spreadsheets, and Section 24 (20% basic-rate credit vs full interest deduction) is a well-documented repeated error. Scale caveat (verified): the "~864k landlords lettered by HMRC" figure is unsupported by any official source — HMRC is confirmed to be writing to filers near the threshold, but do not quote 864k.

**Xero-central angle.** Ingests bank statements/CSV/rent-roll, auto-categorises via `create-bank-transaction` / `update-invoice` with `tracking-category`, detects gaps across `list-trial-balance` / `list-bank-transactions`, applies the Section 24 finance-cost restriction as a `create-manual-journal` split, and assembles a submission-ready quarterly pack. Corrects only after human sign-off; never files.

**Factor sub-scores.** F1 **62** · F2 **72** · F3 **40** · F4 **42** · F5 **48** · F6 **60**.

**Diversity 2nd-opinion: 65** (Δ+11 — agrees, no flag).

**Red-team weaknesses.** None recorded beyond verification — which found the big one: **FreeAgent for Landlords already automates the exact hook** (Section 24 finance-cost restriction + HMRC-recognised MTD ITSA quarterly filing). The one genuine wedge left is "this, but on Xero." F3=40 reflects real tax-domain complexity as a weekend hazard, and F4=42 reflects that a quarterly tax pack is inherently low-drama on stage.

**Weekend build sketch.**
- *Golden path:* upload a landlord's bank CSV + rent roll → auto-categorised into Xero → issue scanner lists MTD-blocking gaps ("Q2 has no mortgage interest recorded") → the Section 24 journal posts the correct 20%-credit treatment → quarterly review pack renders.
- *API calls:* `create-bank-transaction` (ingest) → `list-trial-balance` + `list-bank-transactions` (gap scan) → `create-manual-journal` (Section 24 split) → `update-invoice` with `tracking-category` (per-property tags).
- *Mock:* bank CSV, mortgage statement, rent roll — all seeded; HMRC submission is explicitly out of scope (a "review pack," never a filing).
- *90-second wow:* the side-by-side "what most landlords file (wrong) vs the correct Section 24 treatment" with the £ difference. The deadline urgency ("your first quarterly update is due 7 August — five weeks from today") is the emotional hook.

---

### #9 · PayoutClarity — Commission & Fee Rate-Card Auditor (B03) — **46**

**Problem.** Commission structures on Treatwell/Fresha/Uber/Deliveroo change silently (promo periods, tiered rates, fee hikes). Merchants have no independent Xero-side check that they were charged the contracted rate. Scale: an audit layer on a niche within a niche (F6=38) — real, but small money per merchant.

**Xero-central angle.** Builds on GigLedger's clearing-account ledger; computes actual effective commission % per period from `list-bank-transactions` / manual-journal history vs a stored rate card; where variance exceeds threshold, calls `create-credit-note` or drafts a dispute email citing exact Xero transaction IDs as evidence.

**Factor sub-scores.** F1 **38** · F2 **42** · F3 **40** (verify-adjusted 42→40) · F4 **55** · F5 **65** · F6 **38**.

**Diversity 2nd-opinion: 70 — FLAG: disagrees by +24.** The independent pass saw notably more here (likely the novelty of the proactive-recovery angle and the verified JAX ban on judgment calls). The primary score's counterargument stands, though: the write path is broken at the semantic level.

**Red-team weaknesses.** None recorded beyond verification — which confirmed the killer: a **credit note is merchant-to-customer, not merchant-to-platform**, so the flagship Xero write (`create-credit-note`) is semantically wrong for a platform-overcharge claim, and the real output (a dispute email) fires outside Xero entirely. F1=38 fails the deletion test. It also depends on the C01 clearing ledger existing first — it is a feature of GigLedger, not a standalone entry.

**Weekend build sketch.**
- *Golden path (only as a GigLedger v2 feature):* rate card stored as JSON → after GigLedger posts a month of gross-ups, the auditor computes effective commission % → variance flagged → dispute claim drafted citing Xero transaction IDs.
- *API calls:* `list-bank-transactions` + manual-journal history (read); the write path needs redesign — a receivable-from-platform bill or a note, not a credit note.
- *Mock:* the rate card and the parsed statements (reuse GigLedger's pipeline).
- *90-second wow:* "Treatwell overcharged you £212 in March — here are the nine transaction IDs that prove it." Strong line; weak plumbing. Ship as a closing slide of GigLedger ("what's next"), not as the entry.

---

### #10 · ContractToCashline — Contract/SOW → Recurring-Invoice Setup (B02) — **42**

**Problem.** Small service businesses sign contracts with bespoke terms (quarterly escalators, tiered pricing, pause clauses) that founders manually re-key into Xero recurring invoices — errors here are the upstream root cause of the leakage RevenueGuard catches downstream. Scale: no quantified loss figure exists (F6=42).

**Xero-central angle (as pitched).** LLM extracts the billing schedule from a messy contract PDF and auto-creates the matching Xero repeating-invoice template via create-invoice-with-recurring-schedule, `create-contact`, `create-tracking-category`.

**Factor sub-scores.** F1 **45** · F2 **28** · F3 **25** · F4 **50** · F5 **65** · F6 **42**.

**Diversity 2nd-opinion: 61** (Δ+19 — just under the flag threshold; the independent pass was kinder but not enough to rescue it).

**Red-team weaknesses.** None recorded beyond verification — which found a fatal one: **Xero's RepeatingInvoices endpoint is GET-only** (confirmed via developer docs + an open, unresolved feature request at github.com/XeroAPI/xero-mcp-server/issues/113 to even add READ support to the MCP server). The flagship mechanic — auto-creating a repeating-invoice template — is technically impossible against Xero's public API, full stop. The whitespace claim itself held up (no incumbent does contract-to-billing extraction), which makes this the most frustrating entry on the list: right gap, no door.

**Weekend build sketch (fallback only — recommend NOT building).**
- *Fallback golden path:* contract PDF → extracted schedule table → agent creates the contact plus a SERIES of dated one-off draft invoices (not a repeating template) tagged by plan tier.
- *API calls:* `create-contact`, `create-invoice` (xN, one-off drafts), `create-tracking-category`.
- *Why it still loses:* the fallback is visibly a workaround; the first judge question ("why not a repeating invoice?") exposes the API gap and turns the demo into an apology. Do not build.

---

## 5. If I Had to Pick ONE

**Build GigLedger (68, B01), scoped ruthlessly to a single Treatwell payout schema, and stage the demo as a P&L before/after with the clearing account zeroing on screen.** It is the only candidate that combines verified white-space, the field's best Xero-centrality-plus-API-depth pairing (the clearing-account gross-up is exactly what the 30% API pillar rewards), a top diversity second-opinion (84), and a red-team pass it survived intact — its one real weakness (fragile multi-schema parsing) is fully neutralised by the one-platform scope cut. Keep LedgerMedic (66) as the pivot-ready runner-up if mid-hackathon the payout-parsing golden path proves unreliable — its pre-seeded-error demo is the most deterministic on this list — and fold PayoutClarity in as GigLedger's "what's next" slide for a free B03-flavoured roadmap beat.


---

## Appendix A — Independent Verifier (fresh-context, adversarial)

**Overall verdict:** This deliverable is unusually disciplined for a hackathon idea-ranking: it self-flags its own unverifiable statistics, shows red-team corrections, and hedges where sources are thin — which reduces (but does not eliminate) hallucination risk. Every externally-checkable HARD fact I tested holds up: Xero's ~4.4M FY25 subscriber count, the MTD ITSA dates (mandatory 6 Apr 2026 for >£50k, first quarterly update due 7 Aug 2026), Dext Prepare's per-line-item account+tax assignment, JAX's stated inability to give forecasts/advice/recommendations, and the ecommerce-only scope of A2X/Link My Books/Synder (genuine white-space for service/gig payouts). However, the ranking contains ONE material FALSE claim that inverts its own headline finding: the 'fatal' kill-shot on idea #10 ContractToCashline — that Xero's RepeatingInvoices endpoint is GET-only and creating a template is 'technically impossible against Xero's public API' — is wrong. The Xero Accounting REST API has supported POST/PUT to create and update repeating-invoice templates since ~2022; the GitHub issue #113 it cites is scoped to the xero-mcp-server wrapper lacking that tool, NOT to the core API being read-only. The deliverable explicitly asserts it is 'not just out of toolkit scope,' which is the false part. Separately, the #2-ranked idea's core differentiator ('XBert/Booke verified flag-only') is overstated: XBert ships an 'auto-resolve' function and Booke AI performs automated categorization/reconciliation, so 'flag-only' is not accurate as written (the narrower gap — auto-posting an audit-trailed correcting manual journal — may still hold). A cluster of feasibility/pricing micro-claims (Custom Connection pricing, given inconsistently as ~£5/mo in one place and $5/mo in another; the 60/min rate limit) is unverified. The accounting-semantics reasoning (credit note is merchant-to-customer) is correct. Net: the two top-ranked ideas' external facts are largely sound, but the differentiation basis for #2 is softer than claimed, and the #10 elimination rests on a false API claim, so its low rank is right for the wrong stated reason. The integer-precise 0-100 sub-scores and 'red-teamed 73→66' deltas dress subjective judgment in false quantitative rigor.

**Per-claim verdicts:**
- **FALSE** — ContractToCashline is fatal because Xero's RepeatingInvoices endpoint is GET-only; auto-creating a repeating-invoice template is technically impossible against Xero's public API, not just out of toolkit scope (cites GitHub issue #113).  
  _evidence:_ Xero Accounting REST API supports POST and PUT on RepeatingInvoices to create/update templates (available since ~Aug 2022) per developer.xero.com/documentation/api/accounting/repeatinginvoices. GitHub XeroAPI/xero-mcp-server#113 is a request to add repeating-invoice support to the MCP SERVER wrapper, and its text states 'the Xero Accounting REST API already supports repeating invoices.' The impossibility claim is false; only the MCP toolkit lacks it.
- **SUPPORTED** — Xero has 4.4M subscribers, a large reachable base.  
  _evidence:_ Xero FY25 results report 4.4M total subscribers after +254k net adds (openbriefing/ASX FY25 release; FinTech Magazine). Some sources cite 4.5M+; 4.4M is a valid recent figure.
- **SUPPORTED** — MTD for Income Tax is mandatory from 6 April 2026 for >£50k sole traders/landlords, with the first quarterly update due 7 August 2026.  
  _evidence:_ HMRC/ICAEW/FreeAgent/MTD.digital sources confirm Phase 1 (qualifying income >£50k) mandation from 6 Apr 2026 and first quarterly update for the 6 Apr–5 Jul 2026 quarter due 7 Aug 2026.
- **SUPPORTED** — LedgerSense's original 'no tool reasons per line item' gap is overstated because Dext Prepare already assigns per-line account codes and tax rates.  
  _evidence:_ Dext Help Centre 'Using Line Item Extraction' confirms per-line account codes and tax rates (incl. multiple tax rates per line, supplier-rule automation). The self-applied F5 downgrade is justified.
- **SUPPORTED** — JAX (Just Ask Xero) is contractually banned from forecasting/advice, leaving that space open for a third-party agent.  
  _evidence:_ Xero JAX materials state JAX 'is unable to give financial forecasts, financial advice or recommendations' and does not replace professional advice. Capability limitation confirmed; 'contractual ban' is slightly stronger framing than the source disclaimer but the underlying exclusion is real.
- **SUPPORTED** — GigLedger sits in verified white-space: A2X/Link My Books/Synder are ecommerce-only and no service/gig payout connector exists.  
  _evidence:_ A2X and Link My Books reconcile Amazon/Shopify/eBay marketplace payouts; Synder covers 30+ ecommerce/payment platforms. None targets service/gig platforms (Treatwell/Fresha/Uber/Deliveroo). The service-vertical gap is well-grounded.
- **UNSUPPORTED** — LedgerMedic beats incumbents because XBert and Booke AI are verified flag-only (detect but do not fix).  
  _evidence:_ XBert markets an 'auto-resolve' function (xbert.io) and Booke AI performs automated categorization/reconciliation plus error detection (booke.ai). 'Flag-only' is overstated; the narrower true gap (auto-posting an audit-trailed correcting manual journal) is plausible but was not what the deliverable asserted.
- **SUPPORTED** — PayoutClarity's create-credit-note write is semantically wrong because a credit note is merchant-to-customer, not merchant-to-platform.  
  _evidence:_ Standard accounting: a sales credit note reduces a customer's receivable/owed amount; it is not the instrument for reclaiming an overcharge FROM a platform (where the merchant is the party owed). The critique is correct domain reasoning.
- **SUPPORTED** — StatementMatch's headline AP stats (1.29% of volume at ~$2,034 each; 76%/17% fraud figures) could not be confirmed and should not be quoted.  
  _evidence:_ Self-flagged as unverifiable; I likewise found no authoritative source for those exact figures. Appropriate withdrawal — good honesty, not a hallucination shipped as fact.
- **SUPPORTED** — The '~864k landlords lettered by HMRC' figure is unsupported by any official source.  
  _evidence:_ Self-flagged; no official HMRC source substantiates 864k. HMRC is confirmed to be writing to filers near the threshold, but the specific number is correctly withdrawn.
- **PLAUSIBLE** — FreeAgent for Landlords already automates the exact hook: Section 24 finance-cost restriction plus HMRC-recognised MTD ITSA quarterly filing.  
  _evidence:_ FreeAgent is HMRC-recognised for MTD ITSA and markets landlord support (appeared in MTD searches). The Section 24-specific automation is plausible and consistent with FreeAgent's landlord tax features, but I did not independently confirm that precise capability.
- **UNSUPPORTED** — Custom Connection M2M is not free (~£5/mo per org; elsewhere stated $5/mo), so demo via standard OAuth2 auth-code flow instead.  
  _evidence:_ Not independently verified this pass. The deliverable itself gives inconsistent figures (~£5/mo in the GigLedger note vs $5/mo in the RevenueGuard note) — an internal contradiction that signals the number is recalled, not sourced.
- **PLAUSIBLE** — Xero rate limits are 5,000 calls/day per org (confirmed) with 60/min uncorroborated.  
  _evidence:_ 5,000/day per org and 60 calls/min are the widely documented Xero limits; the deliverable's hedge on 60/min is overly cautious rather than wrong. Not independently re-verified here.
- **PLAUSIBLE** — Keela/Infoodle already occupy nonprofit fund-tracking, undercutting Fund Guardian's 'zero competition' claim.  
  _evidence:_ Keela and Infoodle are real nonprofit CRM/accounting products; the correction direction (nonprofit space is not empty) is sound, though the specific 'fund-tracking in the Xero App Store' overlap was not independently confirmed this pass.
- **UNSUPPORTED** — Win-Confidence maps to a real judging rubric weighted 50% Xero-Connection, 30% API Integration, 20% Architecture.  
  _evidence:_ Event-specific and not externally checkable; taken on trust from the team's own materials. Not a public fact I can confirm or refute — treated as given, not verified.

**Slop / weakness flags:**
- False quantitative precision: integer 0-100 Win-Confidence scores and per-factor sub-scores (e.g. F5=66, 'red-teamed 73->66') present subjective judgment as measurement, implying rigor the underlying model does not have.
- Em-dash spam: heavy em-dash density throughout as a connective-tissue crutch (a common machine-writing tell).
- Occasional autopilot rule-of-three ('reads drive decisions, writes execute them'; 'a plan changes, a card fails, or a renewal is forgotten').
- Internal inconsistency in a cited fact (Custom Connection priced as '~£5/mo' in one profile and '$5/mo' in another) indicates a recalled rather than sourced number.
- One load-bearing 'verified' claim (RepeatingInvoices GET-only / 'technically impossible') is asserted with confidence but is false — a case where confident framing outran the evidence.

> Verifier ran on a fresh context and did not see how the scores were produced. Treat any UNSUPPORTED / FALSE item above as a caveat to carry into the pitch. Diversity 2nd-opinion source: `ollama-cloud,deepseek-v4-pro`. Synthesizer model: `unknown` (synthOk=true).

---
*Generated by the /dispatch Win-Confidence workflow (wf_6828d781-ce6): 43 agents, 5 idea scouts + per-candidate score→fact-check pipeline + adversarial red-team + independent verifier.*
