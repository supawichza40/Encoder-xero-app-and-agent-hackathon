# Fresh Ideas Run — all-opus, prior idea families excluded

> **Verifier status:** 11/15 claims SUPPORTED, 0 FALSE. Four UNSUPPORTED = citations the fresh-context verifier could not independently re-confirm — **check these before pitching**: (1) the exact productideas.xero.com threads cited for CreditSweep/DepositDesk (URLs + vote counts); (2) the load-bearing claim that the MCP toolkit lacks `PUT …/Allocations` (CreditSweep feasibility hinges on raw xero-node — confirm against the toolkit tool list on the day); (3) the revenue-recognition idea marked Not-planned (Mar 2023); (4) the precise scope of JAX's forecast/advice ban as a PartialVAT differentiator.
> **Loop result:** CreditSweep 68 → 72 after 2 kept variants (AR-only narrowing); DepositDesk + DeferDesk converged at baseline. Fresh avg 66.7 → 68. **No fresh idea beats PayoutBridge 81** — the doc's verdict section addresses whether to switch.

**What this is.** Five *novel* Xero-hackathon ideas, scored on the same Win-Confidence rubric used for every prior run, after curation (family-overlap merges) and an adversarial red-team pass. Every idea here sits outside the 12 hard-excluded families and the saturated-incumbent list.

**Win-Confidence is a probability-of-winning proxy, not a guarantee.** It rewards mechanisms that are demonstrably real on the UK Demo Company, not assertions. A high score means "this is the kind of thing that tends to win this rubric," not "this will win." Scores are post-red-team: where a claim was found false or an incumbent was found shipping the same thing, the relevant factor was cut, not excused.

**Honest benchmark (read this before comparing).** The standing champion — **PayoutBridge** (marketplace/gig **payout-reconciliation** family, hard-excluded #1 from this run) — scored **81** on this exact measure after its own red-team. The fresh scores below were **not** inflated to chase it. **No fresh idea beats 81.** The strongest fresh idea, **CreditSweep at 68**, sits 13 points behind the champion. That gap is the finding, not a rounding error — fresh exploration did not surface a new front-runner. It surfaced a credible *hedge* if the team wants distance from the payout-recon crowd (see verdict).

---

## The measure (6 factors, fixed weights)

| Factor | Weight | 100 means | Hard cap |
|---|---|---|---|
| **F1 Xero-Centrality** | 25% | Remove Xero and the product ceases to exist; the ledger is both source of truth and destination of every action | Spreadsheet-swappable ⇒ cap 40 |
| **F2 API-Depth** | 15% | Coordinated multi-endpoint reads feeding **≥3 distinct** create/update write types, exercised live, idempotent, human-in-loop | Only distinct demo-exercised writes count |
| **F3 Weekend-Feasibility** | 20% | One flow fully demoable on the resettable UK Demo Company via M2M Custom Connection, ideally on **pre-seeded** data, no external file | Live scrape / live 3rd-party OAuth ⇒ ~0 |
| **F4 Demo-Wow** | 15% | 90-second single flow; messy input becomes correct ledger state **on screen**; before/after self-evident to an accountant judge | — |
| **F5 Differentiation** | 15% | Verified white-space **and** inside a JAX contractual ban (forecasting/advice) or autonomously **fixes** where others only flag | Unexcluded incumbent overlap ⇒ cap 50 |
| **F6 Impact** | 10% | Quantified pain across a large Xero-reachable segment (4.4M subscribers), plausible App Store distribution | — |

*Anti-gaming: mechanisms count, assertions do not. 90+ is reserved for the genuinely exceptional.*

---

## Top 5 by Win-Confidence

| Rank | Idea | Bounty | Win-Confidence | Why it wins | #1 Risk |
|---|---|---|---|---|---|
| **1** | **CreditSweep** | B03 Cash-Flow Accelerator (sec B01) | **68** | Highest Xero-centrality in the set (88); autonomously **applies** every unallocated credit/overpayment/prepayment (JAX only does single actions), clearing phantom debtors; verified white-space + real lock-date Product Idea | The magic write — applying **existing** credits — needs `PUT …/Allocations`, absent from the MCP toolkit; only via raw `xero-node`. Demo legibility also needs seeded unallocated clutter |
| **2** | **DepositDesk** | B01 Productivity Powerhouse (sec B02) | **66** | Strong ledger-state manipulation (86); real cross-vertical deposit pain; a guided, liability-correct wrapper Xero never built | **Headline claim is verified FALSE**: deposits *do* create a VAT tax point (HMRC VAT Notice 700 §14.2.2a). An accountant judge catches "no early VAT" on screen; strip it and value collapses to plain income-deferral |
| **3** | **DeferDesk** | B01 Productivity Powerhouse | **66** | Most **buildable** (75) and highest demo-wow (72) in the set; deterministic monthly deferred-revenue journals + rollforward, 100% native; "the engine Xero said it won't build" | **Saturated by unexcluded incumbents** — ScaleXP, Flowrev, Mayday all ship this on the Xero App Store (differentiation capped at 40); single distinct write type |
| **4** | **RetentionLedger** | B01 Productivity Powerhouse | **64** | Genuine white-space (74) — no native retainage, and explicitly **not** CIS; coordinated writes (manual-journal + tracking-category + invoice) | Retention %, completion date and defects period are **contract metadata not in the Demo Company**; the value step (release journals) is future-dated and can't fire live |
| **5** | **PartialVAT** | B02 Vibe Integrator | **62** | Highest differentiation (80) — HMRC itself notes few packages do this; a period-recovery calc squarely inside JAX's advice/calc ban | Demo Company almost certainly lacks the exempt/standard supply mix the calc needs; complex working reduces to one Box-4 journal on screen; single write type |

**Tie-break note (Ranks 2–3, both 66).** The rubric breaks ties on *the 3-minute demo of one flow*. On that test **DeferDesk is the safer runner-up**: F3 75 vs 55 and F4 72 vs 52, and it carries no false on-screen claim. **DepositDesk is the highest-variance idea in the top 5** — its headline "income *and* VAT are never recognised early" is factually wrong, and it fails in front of exactly the accountant/API judges on this panel. A team optimizing for a demo that cannot die should treat **DeferDesk as the effective #2** and only build DepositDesk with the VAT claim removed.

---

## Profiles

### 1. CreditSweep — 68 · B03 Cash-Flow Accelerator (secondary B01)

**One-liner.** Autonomously finds every unapplied credit note, overpayment and prepayment on customer **and** supplier accounts and applies them to open invoices — clearing "unallocated cash" that overstates debtors — while respecting lock dates.

**The problem + why Xero natively lacks it.** Xero requires every credit note, overpayment and prepayment to be allocated **manually, one transaction at a time**. There is no bulk "apply all outstanding credits" action, so they pile up: customers get chased for balances already covered, and supplier accounts show phantom balances. **Source (verified):** Xero Central "Can't apply a customer credit" confirms per-transaction, lock-date-blocked allocation with no apply-all action; the Product Idea *"Lock dates — Allocate past years overpayments to invoices"* exists at an exact URL match on productideas.xero.com (plus sibling lock-date ideas for bills and credit notes). Users literally cannot apply a prior-year overpayment without breaking their lock date. JAX does single AR/AP actions, not a planned batch allocation.

**Xero-central angle (specific tools/endpoints).** Read `list-aged-receivables`/`list-aged-payables` + `list-invoices` + `list-contacts` to build a per-contact map of open invoices and outstanding credits. Propose an oldest-open-first allocation plan. On approval, apply each credit via `PUT /CreditNotes/{id}/Allocations`, `PUT /Overpayments/{id}/Allocations`, `PUT /Prepayments/{id}/Allocations`. Idempotency key per allocation; human gate before the batch. Locked periods are **refused**, and the tool surfaces the lock-date conflict rather than silently editing history.

**Sub-scores.** F1 Xero-Centrality **88** · F2 API-Depth **60** · F3 Feasibility **50** · F4 Demo-Wow **62** · F5 Differentiation **73** · F6 Impact **64**

**Diversity 2nd-opinion.** 86 vs 68 → gap **18**, within tolerance (no flag). The independent-novelty read and the win-confidence read agree this is a real, distinct idea.

**Red-team weaknesses.**
- The magic step (applying **existing** credits) needs `PUT …/Allocations`, which the verified MCP toolkit lacks — reachable only via raw `xero-node` core REST, an extra integration path to prove in 24h. *(feasibility 58→50)*
- Demo legibility depends on the UK Demo Company shipping — or the team seeding — multiple unallocated credit notes, overpayments **and** prepayments across AR and AP. Unconfirmed; without visible clutter the before/after is invisible. *(demoWow 70→62)*
- "Unallocated cash cleared" surfaces only as an aged-receivables numeric delta — abstract for a 3-minute judge unless the seeded scenario is exaggerated.
- The lock-date prior-period case (its headline differentiator) has no sanctioned workaround, so that slice may not be demoable.

**Weekend build sketch.**
- **Golden path:** Open the Demo Company with three seeded credits sitting unapplied (one credit note, one overpayment, one prepayment) against contacts that also have open invoices → run CreditSweep → it lists the proposed oldest-first allocation plan → human clicks Approve → it posts the allocations → aged-receivables total drops on screen.
- **API calls:** reads `list-aged-receivables`, `list-invoices`, `list-contacts`; writes `PUT /CreditNotes|Overpayments|Prepayments/{id}/Allocations` via `xero-node` (build this adapter first — it is the whole demo).
- **What to mock:** nothing external. If the Demo Company ships without unallocated credits, **seed them via `create-credit-note` + `create-payment`/overpayment in a setup step** (native data, no vendor file). Do not mock the allocation write — it is the wow.
- **90-second wow:** "£X of debtors is fake — it is cash you already hold, unapplied. One approval." Aged receivables falls from a fat number to a clean one, live. Show the lock-date refusal on a fourth, prior-period credit as the honesty beat.

---

### 2. DepositDesk — 66 · B01 Productivity Powerhouse (secondary B02)

**One-liner.** Turns a "take X% upfront" instruction into a linked deposit invoice + prepayment against an unearned-revenue liability, then auto-applies the held deposit to the final invoice.

**⚠️ Correctness flag (load-bearing).** The idea's headline — *"income **and** VAT are never recognised early"* — is **verified FALSE**. Under **HMRC VAT Notice 700 §14.2.2(a)** (corroborated by haysmac.com, marcusward.co), receiving a deposit or advance payment **creates a tax point and output VAT is due at that point**. Only the P&L revenue-deferral half (unearned-revenue liability) is correct. The VAT half of the value proposition is legally wrong and an accountant judge on this panel will challenge it live. **Build this only with the VAT claim struck out**, positioned purely as income-deferral + a proper invoice-shaped deposit document.

**The problem + why Xero natively lacks it.** Deposit-taking SMBs (trades, events, spa/beauty, agencies, bespoke goods) have no clean deposit workflow. A normal sales invoice recognises income too early; a Receive Money prepayment gives the customer no invoice-shaped document and must be hand-applied later. **Source (verified):** the Xero Product Idea *"Customers to pay deposits on invoices"* is a real active thread on productideas.xero.com (the exact "fudge the system" quote could not be verbatim-confirmed, but the gap and demand are genuine). No first-class deposit object links a deposit to a final invoice or shows a per-job liability view. Caveat from red-team: this white-space is **narrower than framed** — manual workarounds and third-party invoicing apps exist; the exclusion list simply names none.

**Xero-central angle.** Read `list-contacts` + `list-invoices`. Post the deposit as a prepayment against an Unearned Revenue liability; hold it per contact; on the delivery invoice, apply the held credit so the liability unwinds into revenue. Human-in-loop approval + idempotency keys before each ledger write. Runs on native Demo Company contacts and invoices.

**Sub-scores.** F1 **86** · F2 **71** · F3 **55** · F4 **52** · F5 **60** · F6 **58**

**Diversity 2nd-opinion.** 90 vs 66 → gap **24** → **FLAGGED (>20)**. The novelty model rates DepositDesk near the top of the set; the win-confidence model does not. The divergence is fully explained by the red-team hits: the novelty read doesn't price in the **false VAT premise** or the **unproven allocation path**, both of which the win-confidence read (correctly) penalizes. Trust the lower number.

**Red-team weaknesses.**
- Core claim "income and VAT are never recognised early" is **FALSE for VAT** (HMRC §14.2.2a). *(demoWow 63→52)*
- Auto-applying the held deposit to the final invoice is prepayment/overpayment allocation (`PUT …/Allocations`), **absent from MCP** — raw `xero-node` only. *(feasibility 65→55)*
- Once the VAT premise is stripped, the benefit collapses to ordinary income-deferral, already covered by the deferred-revenue path. *(impact 67→58)*
- No first-class deposit object means three chained writes (deposit invoice + prepayment + allocation) — more failure surface for a 3-minute golden path. *(differentiation 70→60)*

**Weekend build sketch.**
- **Golden path:** "Take 30% deposit on this job" → posts a deposit invoice + prepayment to Unearned Revenue → later, raise the delivery invoice → held deposit auto-applies → liability unwinds to revenue.
- **API calls:** `list-contacts`, `list-invoices`, `create-invoice`, `create-payment`/prepayment; the auto-apply needs `PUT …/Allocations` via `xero-node`.
- **What to mock:** nothing external — a native Demo Company contact + a job. Do **not** put any VAT-timing claim on screen.
- **90-second wow:** show the Unearned Revenue liability balance rise on the deposit and fall to revenue on delivery — a clean liability round-trip. Keep the narration to income-recognition timing only.

---

### 3. DeferDesk — 66 · B01 Productivity Powerhouse

**One-liner.** Assign a recognition schedule to any prepaid invoice; it auto-posts the monthly deferred-revenue release journals plus a rollforward report — the revenue-recognition engine Xero has said is not on its near-term roadmap.

**The problem + why Xero natively lacks it.** Agencies, training providers, membership bodies, maintenance and annual-retainer businesses invoice cash upfront but must recognise revenue over time. Xero has **zero native revenue recognition**; owners either do nothing (misstated P&L) or run fragile spreadsheets + monthly manual journals. **Source (verified, primary):** the Xero Product Ideas thread *"Invoices — Ability to recognise future revenue"* (108 votes) is officially marked **"Not in pipeline"**; Community Manager Kelly Munro (Mar 7 2023) wrote it is *"not something we'll be developing in the near term"* and directed users to connected apps. *(Honesty correction: the idea's "publicly said it will not build" framing is an overstatement — the real status is "not in pipeline / not near-term," which is softer than "never.")*

**Xero-central angle.** Read a native sales invoice; user picks a schedule (or delivery date); post **idempotent monthly `create-manual-journal`** entries moving value from a deferred-revenue liability into sales; render a deferred-revenue rollforward from `list-trial-balance` reads. Deterministic, replayable journals + audit trail = strong architecture score. 100% native demo, no external files.

**Sub-scores.** F1 **85** · F2 **40** · F3 **75** · F4 **72** · F5 **40** · F6 **68**

**Diversity 2nd-opinion.** 93 vs 66 → gap **27** → **FLAGGED (>20)**, the widest gap in the set. The novelty model loves it (most buildable, cleanest native demo); the win-confidence model caps it because **three vendors already ship it**. The gap is the incumbent-saturation penalty (F5 40) doing its job — "the engine Xero said it won't build" is true but creates no edge when ScaleXP, Flowrev and Mayday already built it. This one survives on **buildability, not novelty**.

**Red-team weaknesses.**
- Differentiation capped by a **real, saturated incumbent category** — Xero itself directs users to these connected apps. *(differentiation 45→40)*
- **Single distinct write type** (`create-manual-journal` repeated); `create-account` absent from MCP — well short of the ≥3-distinct-writes bar. *(apiDepth 50→40)*
- Its main virtue is feasibility, not edge.

**Weekend build sketch.**
- **Golden path:** pick a seeded £12,000 annual-plan invoice → choose "recognise over 12 months" → DeferDesk posts month-1 journal now and previews the schedule → show the deferred-revenue rollforward.
- **API calls:** `list-invoices`, `list-trial-balance`, `create-manual-journal` (idempotent, one per period).
- **What to mock:** nothing — a native Demo Company sales invoice drives it. To make the wow legible, fast-forward and post several months' journals in the demo (idempotency keys make re-runs safe).
- **90-second wow:** the P&L before shows £12,000 booked in one month; after, a clean £1,000/month line and a liability that draws down to zero. Deterministic journals + audit trail is the architecture story judges reward.

---

### 4. RetentionLedger — 64 · B01 Productivity Powerhouse

**One-liner.** Automates construction retention — splits held-back cash off each invoice/bill into retention-receivable and retention-payable accounts, ages it, and posts release journals at practical completion and end of the defects period.

**The problem + why Xero natively lacks it.** UK construction contracts withhold ~2.5–5% retention from every interim payment, half released at practical completion and half after a ~12-month defects period, tracked separately for customers (receivable) and subcontractors (payable). Today it is manual: hand-built retainage accounts, negative invoice lines, release dates in spreadsheets that get missed. **Source (verified):** Xero's own construction-accounting guide tells users to list retainage manually on a separate invoice line, and third-party tools exist specifically to add the logic (Sage Construction Management "Track retainage in Xero", WorkGuru "Manually Handling Retentions in Xero"). No Xero-native retention product found. This is **explicitly not CIS** (excluded #8): retention is a contractual holdback, not a tax deduction. *(Minor: the idea says "3–5%"; sources put the floor at 2.5% — immaterial.)*

**Xero-central angle.** Read `list-invoices` + `list-bills`; compute the retention slice per contract; post `create-manual-journal` moving it into a Retention Receivable asset / Retention Payable liability; tag each with a per-contract `tracking-category`; on the due date create the release invoice/bill + clearing journal. Aged-retention report derived from balances. **Toolkit note:** hits the **max-2-active-tracking-categories** constraint for per-contract tagging at scale.

**Sub-scores.** F1 **80** · F2 **72** · F3 **48** · F4 **45** · F5 **74** · F6 **58**

**Diversity 2nd-opinion.** 73 vs 64 → gap **9**, no flag. Both reads agree: strong differentiation, weak demoability.

**Red-team weaknesses.**
- Retention %, practical-completion date and defects-liability period are **contract metadata absent from the Demo Company** — the demo needs fabricated input, against the native-data-first directive. *(feasibility 61→48)*
- The differentiating step (release journals at completion / end of defects) is **future-dated and cannot fire live**; a 3-minute demo can only show the invoice-time split, not the aging/release that is the actual product. *(demoWow 62→45)*
- Construction retention is a **narrow vertical** against the 4.4M general base. *(impact 68→58)*
- Per-contract tagging collides with the max-2-active-tracking-categories limit.

**Weekend build sketch.**
- **Golden path:** open a seeded subcontractor bill → RetentionLedger computes the 5% holdback → posts the split journal into Retention Payable, tagged to the contract → shows the aged-retention balance.
- **API calls:** `list-invoices`, `list-bills`, `create-manual-journal`, `create-tracking-category`, `create-invoice` (release).
- **What to mock:** the contract metadata (%, completion date, defects period) is the one unavoidable mock — supply it as a small typed input, **not** a vendor file. Everything downstream runs on native Demo Company bills.
- **90-second wow:** show a bill's cash split into "pay now" vs "Retention Payable," then trigger a release journal (fast-forward the completion date) so the held-back amount moves to payable-due. Be honest that release is time-gated — narrate it, don't fake a live clock.

---

### 5. PartialVAT — 62 · B02 Vibe Integrator

**One-liner.** Runs the VAT partial-exemption standard method over a period — direct attribution, residual apportionment, de minimis test — and posts the Box 4 recovery adjustment back into Xero.

**The problem + why Xero natively lacks it.** Businesses mixing VAT-exempt and standard-rated work (dental, physio, aesthetics, opticians, plus finance, education, property) must split input VAT into taxable/exempt/residual, apportion residual VAT by the taxable-to-total turnover ratio, apply the £625/month + 50% de minimis tests, and true up annually. **Source (verified):** the live Xero Product Ideas request *"VAT — Partial Exemption Calculation"*, plus practitioner sources (fhpaccounting.co.uk) confirming the recovery calc must be done **outside** Xero, usually in a spreadsheet. De minimis thresholds confirmed against **GOV.UK VAT Notice 706**, ACCA, Charity Tax Group. This is distinct from transaction-level rate calc (Avalara) — it is a **period recovery calculation Xero has no engine for**, and JAX is banned from constructing or posting it.

**Xero-central angle.** Pull transactions-by-tax-rate + the P&L; classify supplies exempt vs taxable; compute the recovery percentage and de minimis result with visible working; post a `create-manual-journal` Box 4 adjustment (and the annual true-up). Native tax-coded invoices/bills feed the calc.

**Sub-scores.** F1 **74** · F2 **42** · F3 **52** · F4 **58** · F5 **80** · F6 **62**

**Diversity 2nd-opinion.** 67 vs 62 → gap **5**, no flag — the tightest agreement in the set. Both reads see the same thing: best-in-set differentiation, thin API depth and a hard-to-seed demo.

**Red-team weaknesses.**
- Partial exemption needs a genuine exempt/standard supply mix the **UK Demo Company almost certainly lacks** — a self-seeding step is required before the calc runs, weakening the native-data-first story. *(feasibility 60→52)*
- The standard method is hard to make legible in 180 seconds even to API-literate judges; the visible output is a **single Box-4 journal**, not a self-evident before/after. *(demoWow 68→58)*
- **Single distinct write type** (`create-manual-journal`) — thin on the axis rewarding ≥3 coordinated writes. *(apiDepth 48→42)*
- The xeroAngle overstates that seeded tax-coded invoices "drive the whole calc natively" — the exempt supplies the calc needs are exactly what is missing.

**Weekend build sketch.**
- **Golden path:** seed a handful of exempt-coded and standard-coded transactions → run PartialVAT over the period → it shows the direct-attribution split, the residual apportionment %, and the de minimis pass/fail → posts the Box-4 recovery journal.
- **API calls:** transactions-by-tax-rate read, `list-profit-and-loss`, `create-manual-journal`.
- **What to mock:** the exempt/standard **mix** must be seeded (native `create-invoice`/`create-bank-transaction` with exempt tax codes) — no vendor file. Show the calc working, not just the answer.
- **90-second wow:** put the **visible working** on screen — "£X residual input VAT × 63% recovery ratio, de minimis passed → reclaim £Y" — then the one journal. The differentiator is that Xero and JAX literally cannot do this; make the calc transparency the hero, not the single write.

---

## What got culled and why

**Scored, but below the top-5 line (also-rans):**
- **VATVault — 61 · B03.** Tax-reserve "jar" (set aside VAT/tax cash) — competent but one notch under CreditSweep; merged in the TaxReserve variant.
- **PayRunPilot — 58 · B03.** Payroll-adjacent; payroll is a saturated incumbent space (Gusto/Employment Hero/Deputy), which caps its ceiling.
- **TroncClear — 54 · B01.** Tips/tronc allocation; narrow hospitality niche, absorbed the TroncBooks variant.
- **MoneyStory — 51 · B02.** Narrative/reporting framing; overlaps saturated reporting incumbents (Fathom/Syft/Spotlight).

**Merged for family overlap at curation (near-dups, folded into a survivor):**
- **DepositDesk (quote-to-deposit-invoice)** + **DepositDesk (bank-feed deposit-detector)** → merged into **N01 DepositDesk** (kept the liability-correctness framing).
- **DepositLedger, DepositDefer, RetainerLedger, RetainerMeter** → deferred-revenue family, merged into **N02 DeferDesk** (RetainerMeter also needed external time data).
- **CreditClear, ClearCredit** → unapplied-credit allocation family, merged into **N03 CreditSweep**.
- **TroncBooks** → tips/tronc family, merged into TroncClear.
- **TaxReserve** → tax-reserve jar family, merged into VATVault.
- **FXTrace** → multi-currency FX family, merged into FXClarity.
- **FXClarity** → dropped from the top-14: the Demo Company is likely GBP-only, so the native-data demo risk is disqualifying (the source itself flagged the weakest native fit).
- **CommishCalc** → rejected: internal sales-rep commission accrual is the same **excluded family #1** (payout & commission reconciliation, any vertical).
- **PipelinePulse** → rejected: AR/quote-expiry reminders are saturated (Paidnice already ships them).
- **ViDA Guard** → rejected: near-dup of PeppolReady (same e-invoice-mandate audit mechanism, EU-jurisdiction variant).

---

## Verdict (3 lines)

1. **No fresh idea justifies switching off PayoutBridge.** The champion's 81 is 13 points clear of the best fresh score (CreditSweep, 68); this run did not surface a new front-runner, it confirmed the incumbent.
2. **If the team wants distance from the payout-recon crowd, CreditSweep is the hedge** — highest Xero-centrality here (88) and it autonomously *fixes* rather than flags, but only if the `PUT …/Allocations` adapter and seeded unallocated clutter are both nailed down early.
3. **Two of the five carry honesty landmines** — DepositDesk's VAT claim is verified false and DeferDesk's space is already shipped by three App Store vendors; either can be built, but only with the false/overstated claim removed from the pitch.

---

# Appendix A — Independent Verifier (fresh-context, provenance-hardened)

## Main fresh-ranking verification

**Overall verdict:** Independent verification of the "Fresh Ideas Run" document. I checked the ~15 most load-bearing factual claims via live web search (Perplexity was out of quota; used Firecrawl). Headline finding: the document is unusually rigorous and self-critical — its most consequential factual claims check out, and its own red-team correctly flags DepositDesk's VAT premise as false. Every externally-checkable external-world fact I tested is SUPPORTED: the UK-VAT deposit tax-point rule, the three Xero Allocations API endpoints, the deferred-revenue incumbent trio (ScaleXP/Flowrev/Mayday all on the Xero App Store), the partial-exemption de minimis thresholds (£625/mo + 50%, VAT Notice 706), the Xero 2-active-tracking-category limit, the 4.4M FY25 subscriber figure, and the construction-retainage-is-manual gap. No invented external statistic or non-existent API surfaced. The genuine soft spots are internal/unverifiable specifics I could not confirm: the "108 votes / Kelly Munro / Mar 7 2023" attribution on the revenue-recognition product idea, the exact existence of the named CreditSweep and DepositDesk product-idea threads, the claim that the MCP toolkit specifically lacks PUT .../Allocations, and JAX's contractual ban — these are hackathon-internal or forum-specific and default to UNSUPPORTED (not disproven). The Win-Confidence scores themselves are rubric outputs, not factual claims, so I do not label them true/false; they are internally consistent and, per the provenance note, correctly not compared against excluded-family docs. Bottom line: the document does not contain the failure modes the brief hunts for — no wrong "Xero lacks X" claim, no incumbent that actually already fills the claimed gap unacknowledged, no misstated VAT rule, no fabricated external number. Its one deliberately surfaced false claim (DepositDesk VAT) is labelled false by the authors themselves and is genuinely false — which is the correct call.

**Per-claim verdicts:**
- **SUPPORTED** — Receiving a deposit/advance payment under UK VAT creates a tax point and output VAT is due at that point (HMRC VAT Notice 700 §14.2.2a) — therefore DepositDesk's headline 'income AND VAT are never recognised early' is FALSE.  
  _evidence:_ marcusward.co (VAT treatment of deposits): 'any advance payment ... creates a tax point on which output tax is due to the extent of the deposit amount.' Confirms the deposit VAT-timing rule; the document's own red-team labels DepositDesk's VAT claim false, which is correct.
- **SUPPORTED** — Xero API exposes PUT CreditNotes/{id}/Allocations, PUT Overpayments/{id}/Allocations, PUT Prepayments/{id}/Allocations to allocate credits/overpayments/prepayments to invoices.  
  _evidence:_ developer.xero.com Accounting API docs: Credit Notes ('PUT method can be used to ... allocate CreditNotes to outstanding invoices'), Overpayments ('allocate part or full amounts of an overpayment to outstanding invoices'), Prepayments ('allocate ... a prepayment to outstanding invoices'). All three endpoints exist.
- **SUPPORTED** — Xero has no native revenue recognition / deferred revenue; ScaleXP, Flowrev and Mayday all ship deferred revenue for Xero via the App Store (so DeferDesk's differentiation is capped by incumbent saturation).  
  _evidence:_ Flowrev and ScaleXP both have live Xero App Store listings (apps.xero.com/us/app/flowrev, /scalexp) for 'deferred revenue recognition'; Mayday (getmayday.com/product/deferred-revenue) automates deferred-revenue schedules. Three real incumbents confirmed.
- **SUPPORTED** — UK VAT partial-exemption de minimis test: exempt input tax under £625/month average AND under 50% of total input tax (VAT Notice 706); the recovery calc is done outside Xero, usually in a spreadsheet.  
  _evidence:_ taxadvisermagazine.com: 'exempt input tax must be less than £625 per month on average and also less than 50% of total input tax.' GOV.UK VAT Notice 706 exists; Xero Product Idea 'VAT - Partial Exemption Calculation' is live on productideas.xero.com; accountingweb answer: 'I do the partial exemption calculation outside Xero.'
- **SUPPORTED** — Xero limits users to 2 active tracking categories (RetentionLedger's per-contract tagging collides with this).  
  _evidence:_ blog.accountingprose.com: 'Each business can set up two active Tracking Categories'; calxa.com confirms 'You can have 2 Xero tracking categories lists.' A Xero Product Idea requests increasing the max, confirming the current cap is 2.
- **SUPPORTED** — Xero has ~4.4M subscribers (the reachable segment for the Impact factor).  
  _evidence:_ Xero FY25 Annual Report (via listcorp.com ASX:XRO): 'Xero added 414,000 net new subscribers in FY25 ... bringing total subscribers to 4.4 million.' Figure is current and accurate (note Xero also cites ~4.9M 'customers', but 4.4M 'subscribers' is the correct paid-subscriber count).
- **SUPPORTED** — UK construction retention has no Xero-native product; users track retainage manually and third-party tools (e.g. Sage Construction Management) add the logic.  
  _evidence:_ Sage Construction Management Help Center 'Track retainage in Xero' (help.sagecm.intacct.com) confirms retainage is handled via export/sync, not native Xero. No Xero-native retention product found in search; ecosystem tools fill the gap, matching the document's claim.
- **SUPPORTED** — Retention is a contractual holdback distinct from CIS (a tax deduction), so RetentionLedger does not fall in excluded family #8 (CIS).  
  _evidence:_ Standard UK construction-accounting knowledge, consistent with retainage sources: retention is a percentage withheld pending completion/defects, not a statutory tax deduction. Distinction is valid; no evidence contradicts it.
- **SUPPORTED** — Xero community managers mark declined ideas 'Not in the pipeline' — supporting the DeferDesk product-idea status framing.  
  _evidence:_ productideas.xero.com thread returned in search uses exactly this language from a Xero rep: 'To be upfront, this idea is currently Not in the pipeline.' Confirms the status phrasing is real Xero-community wording. The document also honestly corrects its own 'will not build' overstatement to 'not in pipeline'.
- **UNSUPPORTED** — The specific revenue-recognition product idea 'Invoices — Ability to recognise future revenue' has 108 votes and was marked Not-in-pipeline by Community Manager Kelly Munro on Mar 7 2023.  
  _evidence:_ Could not locate this exact thread, vote count, name or date in search results. The underlying gap (no native rev-rec) and the 'Not in pipeline' status language are both independently confirmed, but the precise attribution (108 / Kelly Munro / date) is unverified and defaults to UNSUPPORTED — a fabrication-risk detail even if the surrounding claim is sound.
- **UNSUPPORTED** — A Xero Product Idea 'Lock dates — Allocate past years overpayments to invoices' (and a 'Customers to pay deposits on invoices' thread) exist at exact URLs on productideas.xero.com.  
  _evidence:_ Not directly confirmed in my searches; the document itself concedes the DepositDesk 'fudge the system' quote 'could not be verbatim-confirmed.' Plausible given how the Xero ideas forum works, but unverified — default UNSUPPORTED, not disproven.
- **SUPPORTED** — Xero requires credit notes/overpayments/prepayments to be allocated manually one transaction at a time, with no bulk 'apply all outstanding credits' action (CreditSweep's core white-space).  
  _evidence:_ Consistent with the Xero API design (per-transaction Allocations endpoints confirmed above) and Xero Central guidance on per-transaction, lock-date-blocked allocation. No bulk apply-all feature found in search; claim is well-founded, though the specific 'Can't apply a customer credit' Central article was not individually opened.
- **UNSUPPORTED** — The verified MCP toolkit lacks PUT .../Allocations, reachable only via raw xero-node — a load-bearing feasibility caveat repeated across CreditSweep and DepositDesk.  
  _evidence:_ This is a claim about a hackathon-internal MCP toolkit's surface, not externally checkable via web search. The document treats it as a known limitation and penalizes feasibility accordingly (a conservative direction), but I cannot independently confirm the toolkit's endpoint coverage — default UNSUPPORTED.
- **UNSUPPORTED** — JAX (Xero's AI assistant) is contractually banned from forecasting/advice and from constructing/posting calculations like partial-exemption recovery — used as a differentiation lever for PartialVAT and CreditSweep.  
  _evidence:_ JAX's contractual constraints are hackathon/context-internal and not verifiable from public sources in my searches. Not disproven; simply unconfirmable here, so defaults to UNSUPPORTED.
- **SUPPORTED** — No fresh idea beats the excluded champion PayoutBridge (81); best fresh score is CreditSweep at 68 — a 13-point gap that is the run's finding.  
  _evidence:_ This is an internal arithmetic/rubric claim, not an external fact: 81 minus 68 equals 13, matching the stated gap. Per the provenance note these scores are this run's own rubric outputs and are not to be compared against excluded-family docs. Internally consistent; no external verification applicable.

**Slop / weakness flags:**
- Specific-but-unverifiable attribution: '108 votes' + 'Community Manager Kelly Munro (Mar 7 2023)' on the revenue-recognition idea is the single highest fabrication-risk detail — precise numbers/names/dates that I could not confirm; the surrounding claim stands without them.
- Several 'exact URL match' product-idea claims (CreditSweep lock-date idea, DepositDesk deposit idea) are asserted as verified but were not independently confirmable; the document at least hedges the deposit-quote one honestly.
- Repeated load-bearing reliance on an unverifiable internal premise ('MCP toolkit lacks PUT .../Allocations', 'JAX contractual ban') — reasonable within the hackathon frame but presented with more certainty than external evidence supports.
- No AI-slop prose tells of concern (no buzzword clusters, no false rule-of-three padding); the writing is concrete and the self-flagging of DepositDesk's false VAT claim is a genuine honesty signal rather than slop.


**Curation rejections (family overlap):** DepositDesk (quote-to-deposit-invoice variant) → Deposit/prepayment family - near-dup, merged into N01 DepositDesk (kept liability-correctness framing) · DepositDesk (bank-feed deposit-detector variant) → Deposit/prepayment family - near-dup, merged into N01 DepositDesk · DepositLedger → Deferred-revenue recognition family - near-dup, merged into N02 DeferDesk · DepositDefer → Deferred-revenue recognition family - near-dup, merged into N02 DeferDesk · RetainerLedger → Deferred-revenue recognition family (retainer-drawdown variant) - near-dup, merged into N02 DeferDesk · RetainerMeter → Deferred-revenue recognition family (WIP/burn-down variant, needs external time data) - near-dup, merged into N02 DeferDesk · CreditClear → Unapplied-credit allocation family - near-dup, merged into N03 CreditSweep · ClearCredit → Unapplied-credit allocation family - near-dup, merged into N03 CreditSweep · TroncBooks → Tips/tronc allocation family - near-dup, merged into N09 TroncClear · TaxReserve → Tax-reserve 'jar' family - near-dup, merged into N11 VATVault · FXTrace → Multi-currency FX explain/revalue family - merged into FXClarity · FXClarity → Multi-currency FX family - runner-up dropped from top-14: Demo Company is likely GBP-only, so native-data demo risk (source itself flags weakest native fit) · CommishCalc → Excluded family #1 - payout & commission reconciliation (internal sales-rep commission calc/accrual is the same commission family, 'any vertical') · PipelinePulse → Saturated - AR/quote reminders (Paidnice incumbent already ships quote-expiry reminders; chasing is the core mechanism) · ViDA Guard → Near-dup of N06 PeppolReady - same e-invoice-mandate audit mechanism, EU-jurisdiction variant, folded into PeppolReady

> Diversity 2nd-opinion source: `ollama-cloud,deepseek-v4-pro`. All agents opus; orchestrator fable-5. 40 raw novel ideas generated, 14 scored after novelty gate. Companion: [TOP3-FRESH-OPTIMIZED.md](TOP3-FRESH-OPTIMIZED.md). Prior-family champion for comparison: PayoutBridge 81 in [IDEAS-RANKED-POWERFUL.md](IDEAS-RANKED-POWERFUL.md).

---
*Generated by /dispatch fresh-ideas workflow (wf_8014dea4-853): 70 agents, 6 exclusion-aware scouts (perplexity multi-mode) + novelty-gated curation + score→fact-check pipeline + red-team + ollama diversity + provenance-hardened verifier + top-3 optimization loop. Demo-data directive enforced: demos designed on Demo Company pre-seeded data, no external vendor files.*
