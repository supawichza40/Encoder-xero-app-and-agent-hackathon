# Powerful-Model Run — all-opus agents

> **Verifier status (read first):** 14/16 material claims SUPPORTED. Two minor nits: the "17% use AI vs fraud" stat is actually verifiable (AFP 2026 — keep it), and "UK ~5.7M businesses" runs slightly high vs current ONS (~5.5M, 2024) — say "~5.5M+" on stage.
> **⚠ Cross-run calibration drift:** this all-opus run scores the SAME ideas +7…+14 higher than the mixed-model run ([IDEAS-RANKED.md](IDEAS-RANKED.md)): GigLedger/PayoutBridge 68→81, LedgerMedic 66→73, RevenueGuard/LeakSeal 58→72. Score shifts are argued case-by-case in §3 (corrections + fresh verification), but treat this run as the **optimistic scale** and run 1 as the **conservative scale**. The ranking ORDER is consistent across both runs — that consistency, not the absolute number, is the robust signal.

**Xero App & Agent Hackathon · Win-Confidence ranking of the top 10 ideas**

> **Honest framing.** These are **Win-Confidence** scores, not win probabilities. Each 0–100 number is a calibrated estimate of how well an idea maps to the *published rubric* under an honest 24-hour build — hardened by an adversarial red-team pass (caps applied, shown un-rounded) and cross-checked by an independent second-opinion (diversity) scorer. Material external claims were verified against live sources where noted. The score **cannot** predict execution on the day, judge subjectivity, or what the rest of the field brings. Treat it as *where to place your bet*, not a guarantee. Ranks are relative within this 13-idea field only.

---

## 1 · The measure (what we optimised for)

Weights map directly onto the stated judging pillars: **50% Xero-Connection → F1**, **30% API → F2**, **20% Architecture → F3 + human-in-loop**, with F4/F5/F6 as the tie-breakers judges reward.

| Factor | Weight | What a **100** means |
|---|---:|---|
| **F1 · Xero-Centrality** | 25% | Delete Xero and the product ceases to exist — ledger is source of truth **and** destination of every write. *Deletion test: if a spreadsheet swap leaves the demo intact, F1 caps at 40.* |
| **F2 · API-Depth** | 15% | Coordinated multi-endpoint reads feeding **≥3 distinct** create/update write types, correct accounting pattern (clearing-account gross-up), idempotent, human-in-loop. *Only distinct writes exercised live count.* |
| **F3 · Weekend-Feasibility** | 20% | One flow, fully demoable on the resettable UK Demo Company via Custom-Connection M2M; every dependency mock-input-safe (CSV/PDF upload, not live scrape); under rate limits. |
| **F4 · Demo-Wow / Legibility** | 15% | 90-second single flow where a messy input becomes a **correct Xero ledger state on screen** — the before/after diff is self-evident to an accountant judge. *The tie-breaker.* |
| **F5 · Differentiation** | 15% | Verified white-space **and** inside a JAX contractual ban (forecast/advice), or autonomously **fixes** where others only flag. *Unexcluded incumbent overlap caps F5 at 50.* |
| **F6 · Real-World-Impact** | 10% | Quantified pain across a large Xero-reachable segment; plausible App-Store distribution to millions of SMEs. |

---

## 2 · Top 10 by Win-Confidence

| Rank | Idea | Bounty | Win-Conf | Run-1 | Why it wins | #1 Risk |
|---:|---|:--:|:--:|:--:|---|---|
| **1** | **PayoutBridge** | B01 | **81** | 68 *(GigLedger)* | Textbook clearing-account **gross-up** = the F2=100 pattern; 3 distinct writes demoed; verified untouched white-space (service/gig payouts) and the owner's own Treatwell pain. | LLM schema-inference across 6 heterogeneous CSV/PDF formats — must pin to a seeded file; a "upload a novel format" judge is a landmine. |
| **2** | **LedgerMedic** | B01 | **73** | 66 | Closes the loop no incumbent does: auto-**posts** an audit-trailed correcting manual journal behind human-approve; deterministic on the resettable Demo Company. | Thin wedge — XBert auto-resolves, Booke auto-categorises; only the *post* step is white-space. Detection needs carefully seeded miscodings. |
| **3** | **LeakSeal** | B03 | **72** | 58 *(RevenueGuard; 2nd-op 83)* | Genuine white-space: detects revenue **never invoiced** (outside JAX, Float/Fathom, Chaser); the exact B03 "proactive action" mandate; RepeatingInvoices now feasible via REST. | Cadence-inference across 3 leak types is fragile, demoable only on hand-seeded history; REST auth plumbing sits on the golden path. |
| **4** | **ClaimReconcileHealth** | B02 | **71** | *new* | The payout-reconciler pattern in an **untouched vertical** (insurer remittance, not a gig CSV); 3 distinct writes; highest apiDepth in the mid-field (82). | Heaviest seeding burden in the field — fabricate Bupa/AXA/Vitality remittance **and** matching patient invoices; concept opaque to non-healthcare judges. |
| **5** | **StatementMatch** | B01 | **67** | 63 | No native Xero supplier-statement recon; highest feasibility (76) — ACCPAY draft-first is safe; real monthly AP pain. | Differentiation capped: Dext/AutoEntry now ship SME statement recon, so only the autonomous **bill-draft** is the true wedge; parsing is ledger-agnostic (weak F1). |
| **6** | **FundGuardian** | B01 | **64** | 59 | Xero *literally cannot* produce a SoFA (2-active-tracking-category cap is a confirmed constraint); no app does fund-balance + overspend + SoFA together. | The 2-active-tracking-category cap can break the build; SoFA reconstruction is domain-heavy; charity fund data is unseeded on the Demo Company. |
| **7** | **ContractToCashline** | B02 | **64** | 42 *(suppressed)* | Biggest correction unlock — RepeatingInvoices POST is real; high feasibility (74); clean Vibe-Integrator. | **No UPDATE** support on RepeatingInvoices → any uplift/escalation-refresh flow is un-buildable; "LLM extracts a contract" is an easily-copied pattern (F5=52). |
| **8** | **DupliGuard** | B03 | **62** | *new* | Highest-impact fraud framing (76% of orgs hit); the **post-payment recovery** step is the genuine twist. | Anti-gaming cap bites: Traild/ApprovalMax already do Xero duplicate detection pre-payment → F5 pinned to 50; fuzzy-match logic is platform-agnostic (weak F1). |
| **9** | **CISAutopilot** | B01 | **61** | *new* | High Xero-centrality (82) and timely (6 Apr 2026 mandatory nil-return reform, verified). | Xero's **native CIS Contractor add-on already** verifies + deducts + files CIS300 → 3 of 4 subsystems duplicate shipped features; toolkit exposes no CIS tools (feasibility 44, lowest). |
| **10** | **QuarterClose** | B01 | **58** | 54 *(Section-24)* | Highest impact (83) — MTD ITSA mandatory 6 Apr 2026 at £50k; real dual pain (gross-scope + "what will I owe"). | Flagship in-year tax estimate is **verified unsound** (needs allowance/PAYE/POA/NIC the ledger lacks) **and** non-required by HMRC; read-heavy, one thin write (F1=55, F2=42). |

*Field total: 13 scored ideas. Also-rans below the cut: RateGuard 53 (B02), CashPilot 50 (B03), GiftAidAutopilot 50 (B03).*

---

## 3 · What changed vs the mixed-model run (and why)

The all-opus run **re-rated the payout/reconciler family up hard** and **corrected two suppressions the mixed-model run got factually wrong**. Net effect: the top of the board is more confident, and three new entrants displaced the run-1 tail (LedgerSense 55, PayoutClarity 46 dropped out).

**Score shifts on shared lineage**
- **GigLedger 68 → PayoutBridge 81 (+13).** Live search confirmed no connector reads service/gig settlement schemas (A2X/LMB/Synder are ecommerce-only), and the clearing-account gross-up is the rubric's own F2=100 exemplar. Red-team still trimmed feasibility 72→**68** and demoWow 86→**82** (6-format inference is fragile; wow only on the pre-seeded golden path).
- **RevenueGuard 58 → LeakSeal 72 (+14).** The run-1 ollama second-opinion (83) flagged this as underrated; the opus run confirms it — no incumbent detects *never-invoiced* recurring revenue, and RepeatingInvoices REST (run-1 correction #1) makes the write path real. Red-team trimmed demoWow 75→**70**.
- **ContractToCashline 42 → 64 (+22, biggest mover).** Run-1 suppressed it on a **FALSE** "RepeatingInvoices has no POST" claim. Correction #1 restores feasibility (70→**74**). Red-team then capped differentiation 60→**52** (generic extraction pattern) and surfaced the hard caveat: **no UPDATE** endpoint exists, so only fresh-template creation is buildable.
- **LedgerMedic 66 → 73 (+7).** Feasibility bumped (+3) once the seeded resettable Demo Company was recognised as making the golden path deterministic; differentiation trimmed 69→**62** (XBert auto-resolve + Booke are unexcluded live incumbents — only the *post* step is white-space, per correction #2).
- **StatementMatch 63 → 67 (+4).** Confirmed no native statement recon, but differentiation dropped 72→**62** on a **FALSE** claim: Dext/AutoEntry now ship SME-priced statement reconciliation, narrowing the wedge to autonomous bill-drafting.
- **Fund Guardian 59 → 64 (+5)**, **Section-24 54 → QuarterClose 58 (+4, subsumes).** Modest lifts; both carry heavy red-team caps (FundGuardian feasibility 63→**56**; QuarterClose feasibility 56→**48**, apiDepth 50→**42**, xeroCentrality 74→**55** — the estimate is unsound and the tool is read-heavy).
- **Cross-Border FX 62** folded into the payout-reconciler family; not separately carried — **ClaimReconcileHealth** is the family's new, higher-value vertical instance.

**New entrants (no run-1 lineage)**
- **ClaimReconcileHealth 71 (#4)** — payout-reconciler pattern ported to private-clinic insurer remittance; verified real domain (Healthcode). Red-team is heaviest here: feasibility 63→**55**, demoWow 75→**66**, impact 64→**60**.
- **DupliGuard 62 (#8)** — fraud/duplicate detection. The anti-gaming rule caps differentiation 68→**50** (Traild/ApprovalMax are unexcluded live Xero incumbents) and xeroCentrality 70→**58** (platform-agnostic logic).
- **CISAutopilot 61 (#9)** — verified **down** hard: differentiation 72→**47** because Xero ships native CIS. Kept for its Xero-centrality and Apr-2026 timeliness, but honestly narrow.

**Corrections carried from the run-1 verifier**
1. **RepeatingInvoices POST/PUT is supported via core REST** (only the MCP wrapper lacks it) → lifts ContractToCashline and LeakSeal.
2. **XBert/Booke are not flag-only** → caps LedgerMedic & DupliGuard differentiation; redefines the books-cleanup wedge as *auto-posting* the journal.
3. **Custom-Connection pricing/rate-limits are UNVERIFIED** → not asserted as fact anywhere in this deck.

**Diversity second-opinion check.** No idea's second-opinion diverged by more than the **>20-point flag threshold**. Widest gaps (all *optimistic* — the diversity scorer rated higher than the primary): QuarterClose +14, ContractToCashline +12, DupliGuard +12, StatementMatch +10, CISAutopilot +10. Read these as "the harsh red-team caps may be slightly conservative," not as disagreement worth re-scoring.

---

## 4 · Per-idea profiles

### 🥇 1 · PayoutBridge — B01 — **81** *(run-1 68)*
**Problem (scale).** Service & gig operators get one **lumped net payout** to their bank; Xero shows nothing that matches it, so they hand-split gross / commission / fees / refunds every cycle in a spreadsheet and understate revenue by the commission they never see. UK ~5.7M businesses, Xero ~4.4M subscribers — the pain is horizontal across every marketplace seller.
**Xero-central angle.** LLM maps arbitrary payout CSV/PDF → canonical model, then `create-invoice` (gross) + `create-bank-transaction` (fees/commission) + `create-payment` against a **dedicated clearing account** so the bank feed reconciles to zero. `list-accounts` confirms the clearing account. Xero is ledger of record.
**Sub-scores.** F1 **90** · F2 **87** · F3 **68** · F4 **82** · F5 **84** · F6 **68**.
**Diversity 2nd-opinion.** 80 (Δ1 — tight agreement, no flag).
**Red-team weaknesses.** "Drop *any* marketplace report" is unverifiable in 24h — 6-format inference is the real fragility. The claimed 4th write (refund credit-note) adds risk beyond the 3 demoed. Concept generalises to any ledger, but clearing-account gross-up genuinely lives in Xero, so F1 holds. *Applied un-rounded: feasibility 72→**68**, demoWow 86→**82**.*
**Weekend build sketch.**
- **Golden path (90s):** upload one *seeded* Treatwell settlement file → app shows parsed gross/commission/fees/net → one click → three writes post → **the bank deposit that matched nothing now reconciles to £0 and the clearing account nets to zero on screen.**
- **API calls:** `list-accounts` → `create-invoice` → `create-bank-transaction` → `create-payment`; idempotency keys on every write.
- **Mock:** pin to ONE seeded Treatwell CSV. Do **not** invite live novel-format upload — that is the landmine.
- **Wow:** the before/after reconcile-to-zero diff, self-evident to any accountant.

### 🥈 2 · LedgerMedic — B01 — **73** *(run-1 66)*
**Problem (scale).** Month-end close is judgment-heavy manual work: an accountant reviews the ledger, decides the treatment, and hand-posts every correcting journal. Detection tools stop at flagging; the human still composes and posts each fix.
**Xero-central angle.** Reads `P&L` + `trial-balance` + `list-accounts` + `list-bank-transactions` to diagnose miscoded accounts / wrong tax codes / stuck suspense, then `create-manual-journal` (with reasoning + a reversal) — the one write no incumbent automates end-to-end — behind a mandatory approve step. Idempotency keys + native journal audit trail = the 20% architecture points.
**Sub-scores.** F1 **90** · F2 **58** · F3 **73** · F4 **74** · F5 **62** · F6 **66**.
**Diversity 2nd-opinion.** 78 (Δ5 — no flag).
**Red-team weaknesses.** Wedge is thin — XBert auto-resolves and Booke auto-categorises (verified live incumbents); only auto-*posting* an audit-trailed journal with human-approve is true white-space. F2=58 under-scopes: a second write type (`update-bank-transaction`/`update-invoice` re-coding) is available but not counted. *Applied un-rounded: differentiation 69→**62**.*
**Weekend build sketch.**
- **Golden path (90s):** open the seeded Demo Company with a stuck suspense balance + one miscoded line → app diagnoses both, drafts the exact correcting journal with plain-English reasoning → one approve → **journal posts, suspense clears to zero, audit trail visible.**
- **API calls:** `get-profit-and-loss` + `get-trial-balance` + `list-accounts` + `list-bank-transactions` → `create-manual-journal`.
- **Mock:** self-seed deterministic miscodings on the resettable Demo Company; make detection deterministic for the single demoed flow.
- **Wow:** the suspense-to-zero + reversal + audit-trail sequence after one click.

### 🥉 3 · LeakSeal — B03 — **72** *(run-1 58; 2nd-op 83)*
**Problem (scale).** Recurring-revenue businesses silently leak money — a repeating invoice that quietly ended, a contractual 5% annual uplift never applied, a still-serviced customer whose billing lapsed. This un-billed revenue never enters the AR pipeline, so no chaser tool ever sees it. (UK late payments ~£11bn/yr is the adjacent, *visible* half; this is the invisible half.)
**Xero-central angle.** Reads `list-invoices` + **RepeatingInvoices (via REST)** + `list-contacts` + `list-bank-transactions` to model expected-vs-actual cadence, flags gaps and stale prices, then `create-invoice` / `RepeatingInvoice POST` behind a mandatory approve — the exact B03 mandate.
**Sub-scores.** F1 **85** · F2 **58** · F3 **62** · F4 **70** · F5 **82** · F6 **70**.
**Diversity 2nd-opinion.** 81 (Δ9 — no flag).
**Red-team weaknesses.** Cadence inference across 3 leak types is fragile and demoable only on hand-seeded history. Only 2 distinct write types, no clearing-account pattern. Relies on RepeatingInvoices REST auth plumbing on the golden path. *Applied un-rounded: demoWow 75→**70**.*
**Weekend build sketch.**
- **Golden path (90s):** run the audit → app surfaces **"You stopped billing Client X £Y/mo three months ago — here is the catch-up invoice"** → one approve → invoice created.
- **API calls:** `list-invoices` + `GET /RepeatingInvoices` (REST) + `list-contacts` + `list-bank-transactions` → `create-invoice` (and optionally `POST /RepeatingInvoices`).
- **Mock:** hand-seed the customer history so one lapse reads as unmistakably genuine; pre-wire the REST token.
- **Wow:** legible money-recovery line ("you left £Y on the table") → one-click fix.

### 4 · ClaimReconcileHealth — B02 — **71** *(new)*
**Problem (scale).** UK private physio/dental/GP practices bill insurers (Bupa/AXA/Vitality via Healthcode) and get remittance advice listing per-claim billed/allowed/paid/adjustment. Staff manually match each line to the patient invoice, post the insurer payment, write off the contractual difference and chase the patient shortfall — a documented back-office time sink. (PMI claim volumes reported growing; no £ market figure supplied.)
**Xero-central angle.** LLM normalises each insurer's remittance schema, matches to open Xero invoices, then `create-payment` (insurer portion) + write-off (`credit-note` or `manual-journal`) + `create-invoice` (patient shortfall). Three distinct writes; Xero is the patient ledger and cash of record.
**Sub-scores.** F1 **85** · F2 **82** · F3 **55** · F4 **66** · F5 **71** · F6 **60**.
**Diversity 2nd-opinion.** 75 (Δ4 — no flag).
**Red-team weaknesses.** Heaviest seeding burden in the field — the Demo Company has no insurer remittance, so you must fabricate realistic remittance docs **and** matching patient invoices. Parse→normalise→match→3-writes is a lot for a weekend. PMI reconciliation is opaque to non-healthcare judges — the aha needs narration. Narrow segment. *Applied un-rounded: feasibility 63→**55**, demoWow 75→**66**, impact 64→**60**.*
**Weekend build sketch.**
- **Golden path (90s):** upload a seeded remittance advice → app matches each line to a patient invoice, splits insurer-paid vs contractual write-off vs patient shortfall → one approve → **three writes post; the patient ledger is fully settled.**
- **API calls:** `list-invoices` + `list-contacts` → `create-payment` + `create-credit-note`/`create-manual-journal` + `create-invoice`.
- **Mock:** the remittance doc AND the matching patient invoices (both fabricated, deterministic). Narrate the domain up front.
- **Wow:** one opaque insurer document → a fully reconciled patient account in one click.

### 5 · StatementMatch — B01 — **67** *(run-1 63)*
**Problem (scale).** Supplier-statement reconciliation is monthly manual spreadsheet work — comparing a vendor statement to your AP ledger is how you catch a bill you never entered (underpay) or one entered twice (overpay). Xero core has no native statement-reconciliation feature.
**Xero-central angle.** Reads `list-invoices` (ACCPAY) + `list-contacts`, matches the parsed statement on amount/date/reference, produces an exception report, then `create-invoice` (draft missing bills) + `create-credit-note` (stage owed credits) behind approve. Draft-first, idempotent = the architecture points.
**Sub-scores.** F1 **58** · F2 **68** · F3 **76** · F4 **72** · F5 **62** · F6 **72**.
**Diversity 2nd-opinion.** 77 (Δ10 — no flag; diversity scorer more optimistic).
**Red-team weaknesses.** Dext/AutoEntry now ship SME-priced statement reconciliation (**verified**) — the only true wedge is autonomous bill-drafting, so differentiation is genuinely capped. Statement parsing is platform-agnostic (works identically on QuickBooks), weakening the 50% pillar. *Applied un-rounded: xeroCentrality 66→**58**.*
**Weekend build sketch.**
- **Golden path (90s):** upload a seeded supplier statement → app diffs it against the AP ledger, flags **one missing bill + one duplicate + one price mismatch** → one approve → **the missing bill is drafted into Xero.**
- **API calls:** `list-invoices` (ACCPAY) + `list-contacts` → `create-invoice` (draft) + `create-credit-note`.
- **Mock:** seed the AP ledger + statement so exactly one bill is missing and one is duplicated.
- **Wow:** "this bill was never entered — I've drafted it" is instantly legible to an accountant. Lead the pitch on the *fix*, not the match.

### 6 · FundGuardian — B01 — **64** *(run-1 59)*
**Problem (scale).** UK charities must report income/spend split by fund type under Charities SORP, but Xero caps you at **2 active tracking categories** and has no native fund accounting — so charities hand-code every line, rebuild the SoFA in spreadsheets, and catch restricted-fund overspends only after the fact. (Charity base is large: ~168–171k in England & Wales alone; ~400k+ UK-wide across all three regulators — but the SoFA-relevant slice is accruals-basis charities only.)
**Xero-central angle.** `tracking-category` writes + `create-manual-journal` fund transfers; reads `P&L` and `balance-sheet` by tracking category; layers fund-balance + overspend logic to generate SORP columns Xero won't produce.
**Sub-scores.** F1 **72** · F2 **60** · F3 **56** · F4 **62** · F5 **68** · F6 **58**.
**Diversity 2nd-opinion.** 68 (Δ4 — no flag).
**Red-team weaknesses.** The 2-active-tracking-category cap is a verified collision risk that can break the build if any other tracking dimension is needed. SoFA multi-column reconstruction is domain-heavy and opaque to non-charity judges. Charity fund data is unseeded on the Demo Company — real setup burden. Only 2 write types. *Applied un-rounded: feasibility 63→**56**.* (Note: impact evidence mislabels "~168k" as the UK-wide charity total — it's England & Wales only; the niche-vs-SME framing still holds.)
**Weekend build sketch.**
- **Golden path (90s):** app assigns seeded transactions to restricted/unrestricted/endowment funds → shows a live fund-balance panel → attempt an over-spend on a restricted fund → **overspend warning fires before it posts** → generate the multi-column SoFA on screen.
- **API calls:** `list-bank-transactions` + `get-profit-and-loss`/`get-balance-sheet` by tracking category → `create-tracking-category`/assignment + `create-manual-journal` (fund transfer).
- **Mock:** seed charity fund transactions; keep to exactly 2 active tracking categories to dodge the cap.
- **Wow:** the restricted-fund overspend alert + the SoFA Xero itself can't render.

### 7 · ContractToCashline — B02 — **64** *(run-1 42, suppressed)*
**Problem (scale).** Recurring billing is set up by hand from unstructured contracts — someone reads the PDF, finds the fee/start-date/uplift clause, and manually builds a repeating invoice. Slow, error-prone, and forgotten uplift clauses are a direct cause of revenue leakage.
**Xero-central angle.** LLM turns legal prose into a valid **RepeatingInvoice** payload (Period, Unit, DueDate, LineItems, Contact) + `create-contact` — via direct core Accounting REST (`createRepeatingInvoices` → `POST /RepeatingInvoices`). Textbook Vibe-Integrator with a human approve step.
**Sub-scores.** F1 **72** · F2 **50** · F3 **74** · F4 **66** · F5 **52** · F6 **56**.
**Diversity 2nd-opinion.** 76 (Δ12 — no flag; diversity scorer notably more optimistic).
**Red-team weaknesses.** **Verified caveat: RepeatingInvoices has NO UPDATE** — any escalation/uplift-refresh workflow is un-buildable; only fresh template creation works, which narrows the product. "LLM extracts contract terms" is an obvious, easily-copyable pattern, not locked white-space. Only 2 write types; generalises to QuickBooks; no quantified impact figure. Residual risk = extraction accuracy on messy prose + M2M scope. *Applied un-rounded: differentiation 60→**52**.*
**Weekend build sketch.**
- **Golden path (90s):** drop a seeded signed contract/SOW → app extracts party, fee, cadence, start/end, uplift → shows the structured payload → one approve → **a live Xero RepeatingInvoice template + Contact appear.**
- **API calls:** `POST /Contacts` (`create-contact`) + `POST /RepeatingInvoices` (REST, create only).
- **Mock:** the contract PDF (upload-safe input); pre-wire the REST token. Do **not** demo any "update the template" flow — that endpoint doesn't exist.
- **Wow:** messy legal PDF → valid recurring-invoice object on screen, no manual keying.

### 8 · DupliGuard — B03 — **62** *(new)*
**Problem (scale).** Xero's built-in duplicate alert fires only on an **exact** match of contact+reference+amount at bill-entry time, so near-duplicates slip through and get paid twice, and nobody re-scans the paid ledger. **76% of organisations were hit by payment fraud** (AFP 2026, 2025 data — confirmed).
**Xero-central angle.** Reads `list-invoices` (paid bills) + `list-bank-transactions` + `list-contacts` to fuzzy-fingerprint duplicates (INV-1234 vs 1234, split amounts, fuzzy supplier names) and detect supplier bank-detail drift, then `create-credit-note` (draft) or a reversing `manual-journal` as gated remediation.
**Sub-scores.** F1 **58** · F2 **64** · F3 **66** · F4 **68** · F5 **50** · F6 **71**.
**Diversity 2nd-opinion.** 74 (Δ12 — no flag).
**Red-team weaknesses.** Traild and ApprovalMax are **live Xero apps already doing duplicate/near-duplicate detection pre-payment** — unexcluded incumbent overlap forces F5 to the 50 cap; only post-payment recovery is white-space, and that's a thin twist. Fuzzy-match logic is entirely platform-agnostic. Demo hinges on hand-seeded near-duplicate + bank-detail-drift data reading as genuine. Realistically 1–2 write types, short of the 3+ bar. The "only 17% use AI" punchline is **unverified** — drop it. *Applied un-rounded: differentiation 68→**50** (anti-gaming rule), xeroCentrality 70→**58**.*
**Weekend build sketch.**
- **Golden path (90s):** scan the ledger → app flags **"£X paid twice to Supplier Y (INV-1234 vs 1234)"** + a changed supplier bank detail → one approve → **recovery credit note drafted.**
- **API calls:** `list-invoices` (paid) + `list-bank-transactions` + `list-contacts` → `create-credit-note` (draft).
- **Mock:** hand-seed a convincing near-duplicate pair + one bank-detail change on the static Demo Company.
- **Wow:** the caught double-payment + drafted recovery. Pitch the *post-payment* recovery angle — that's the only defensible wedge in Q&A.

### 9 · CISAutopilot — B01 — **61** *(new)*
**Problem (scale).** UK construction contractors must deduct CIS tax from every subcontractor payment, verify each subbie with HMRC, issue a per-subbie deduction statement and file a monthly CIS300 by the 19th. Subbie invoices arrive as messy PDFs mixing labour (deductible) and materials (not). **From 6 Apr 2026 nil returns are mandatory again** unless inactivity is pre-notified (verified real reform).
**Xero-central angle.** Agent creates/updates the supplier contact, posts each bill with the labour/materials split + CIS deduction, reads `list-bank-transactions` to reconcile, and generates the deduction statement + CIS300 summary. `create-invoice`/`create-contact`/`create-payment` carry the flow.
**Sub-scores.** F1 **82** · F2 **68** · F3 **44** · F4 **57** · F5 **47** · F6 **60**.
**Diversity 2nd-opinion.** 71 (Δ10 — no flag).
**Red-team weaknesses (major, verified).** Xero's **native CIS Contractor add-on already** (a) verifies subbies with HMRC, (b) auto-calculates 0/20/30% labour-vs-materials deductions, and (c) files CIS300 directly to HMRC — so **3 of the 4 proposed subsystems duplicate shipped Xero features.** Only messy-PDF split-inference is genuine white-space. The verified toolkit exposes **no CIS-specific tools**, so programmatic access to those native flows is unverified (feasibility 44, lowest in the top 10). Xero-staff judges *know* Xero already does this. *No further red-team caps applied — the verification already gutted differentiation to 47.*
**Weekend build sketch.**
- **Golden path (90s):** upload a seeded messy subbie invoice → app infers the labour/materials split → posts the bill with the correct 20%/30% CIS deduction to the right accounts → shows the deduction statement.
- **API calls:** `create-contact` + `create-invoice` (bill with CIS split) + `create-payment`.
- **Mock:** the subbie PDF; the split-inference IS the demoed wedge — narrate it as *the* novel bit and be honest that verify/deduct/file are native Xero.
- **Wow:** messy PDF → correct labour/materials split on the bill. Keep the scope claim narrow or a Xero judge will name the native add-on in Q&A.

### 10 · QuarterClose — B01 — **58** *(run-1 54, Section-24)*
**Problem (scale).** MTD ITSA is mandatory from **6 Apr 2026** for >£50k qualifying income (£30k 2027, £20k 2028) — five quarterly updates + a final declaration. Two unsolved pains: "qualifying income" is *gross turnover before expenses* (owners get scope wrong), and quarterly filing gives visibility but no answer to "what will I owe?"
**Xero-central angle.** Reads `list-invoices` + `list-bank-transactions` + `P&L` + `trial-balance` scoped to the quarter; uses the 2 tracking categories to separate trade vs rental; flags uncoded/misclassified lines; computes rolling gross qualifying income + a running estimated liability; on approval uses `create-manual-journal` to fix before figures lock.
**Sub-scores.** F1 **55** · F2 **42** · F3 **48** · F4 **62** · F5 **72** · F6 **83**.
**Diversity 2nd-opinion.** 72 (Δ14 — widest in the field, still under the 20-point flag; diversity scorer materially more optimistic on the MTD impact).
**Red-team weaknesses.** The flagship in-year estimate is **verified unsound** — a correct UK liability needs personal allowance, PAYE/other income, payments on account, student loan, pension relief, Class 4 NIC, none of which are in the Xero ledger — so a probing judge breaks the headline number. It's also **not required** by HMRC (only quarterly updates + final declaration). Category-mapping is essentially spreadsheet-doable off a Xero export, weakening the deletion test. Single thin write. Carried almost entirely by MTD-ITSA timeliness/impact. *Applied un-rounded: feasibility 56→**48**, apiDepth 50→**42**, xeroCentrality 74→**55**.*
**Weekend build sketch.**
- **Golden path (90s):** point at a seeded quarter → app maps each transaction to self-employment vs property, flags misclassified lines, tracks gross qualifying income against £50k → one approve → `create-manual-journal` fixes a misclassification before lock.
- **API calls:** `list-invoices` + `list-bank-transactions` + `get-profit-and-loss` + `get-trial-balance` → `create-manual-journal`.
- **Mock:** seed a quarter of trade + rental transactions with one misclassification and one uncoded line.
- **Wow:** the MTD-readiness pack + threshold tracker. **Demo the gross-scope detection, not the tax estimate** — the estimate is the part that loses in Q&A.

---

## 5 · If I had to pick ONE

**Build PayoutBridge (81).** It is the only idea that hits the rubric's own F2=100 exemplar — a clearing-account gross-up with three distinct, human-approved writes that leave the bank feed reconciling to zero on screen — and it sits in verified, incumbent-free white-space that happens to be the owner's real weekly Treatwell pain. Lock the demo to one seeded settlement file, never invite a live novel-format upload, and the single biggest risk is neutralised.

---

*Scores are Win-Confidence, not win probability. Red-team caps shown un-rounded. External claims verified against live sources where noted; unverified items (Custom-Connection pricing/limits, DupliGuard "17% use AI") are flagged, not asserted.*

---

# Appendix A — Independent Verifier (fresh-context, adversarial)

## Main ranking verification

**Overall verdict:** Independent verification of the top-10 ranking against live sources found it well-grounded and, notably, correct on both run-1 traps. No fabricated statistics and no material FALSE claims surfaced. Every hard external fact I checked holds: the 2-active-tracking-category cap, MTD-ITSA thresholds/dates (£50k Apr-2026 → £30k 2027 → £20k 2028), mandatory CIS nil returns from 6 Apr 2026, Xero's native CIS Contractor add-on (verify + deduct + file CIS300), the AFP 76% payment-fraud figure, Dext supplier-statement reconciliation, Traild/ApprovalMax + Xero-native duplicate detection, the ecommerce-only scope of A2X/Link My Books/Synder, and Healthcode as the UK insurer-remittance clearing service. The document handles the RepeatingInvoices nuance PRECISELY — it correctly asserts POST/PUT create IS supported via core REST (only the MCP wrapper lacks it, per XeroAPI issue #113) while ALSO correctly stating there is NO update endpoint, so the uplift/escalation-refresh flow is genuinely un-buildable. That is the run-1 trap resolved the right way, not the wrong way. It also correctly credits XBert (Auto-Resolve) and Booke AI (auto-categorise/reconcile-in-Xero) as live incumbents that do more than flag. Two minor honesty notes, neither harmful: (1) the DupliGuard '17% use AI' punchline the deck flags as UNVERIFIED and recommends dropping is in fact SUPPORTED by the same AFP 2026 survey (17% leverage AI) — the deck under-claims rather than over-claims; (2) the AFP 76% is US treasury/large-org data being mapped onto a UK Xero-SME framing, and the UK '~5.7M businesses' figure runs slightly high versus current ONS (~5.5M) — context stretches, not fabrications. Hard-to-prove negatives (LeakSeal 'no incumbent detects never-invoiced recurring revenue', PayoutBridge 'no connector reads service/gig settlement schemas') are plausible and I found no counter-evidence, but they remain assertions of absence rather than positively proven. Verdict: the scoring rests on real, correctly-stated facts; the red-team caps are applied to genuine incumbent overlaps; slop is confined to prose mannerisms, not to invented substance.

**Per-claim verdicts:**
- **SUPPORTED** — RepeatingInvoices POST/PUT (create) is supported via core Accounting REST; only the Xero MCP wrapper lacks it.  
  _evidence:_ Xero dev docs (developer.xero.com/documentation/api/accounting/repeatinginvoices): POST creates repeating invoice templates, PUT creates new only. XeroAPI/xero-mcp-server issue #113 is an open feature request to ADD repeating-invoice support to the MCP server, confirming the wrapper gap. Lifts ContractToCashline/LeakSeal correctly.
- **SUPPORTED** — RepeatingInvoices has NO UPDATE endpoint, so any uplift/escalation-refresh workflow is un-buildable; only fresh-template creation works.  
  _evidence:_ Multiple sources confirm 'no current accounting API endpoint to allow updating repeating invoice templates (only retrieve and create)'; the only way to change one is to set Status=DELETED and recreate (new RepeatingInvoiceID). The deck's ContractToCashline F5=52 cap and 'do not demo an update flow' caveat are correctly grounded — this is the run-1 trap resolved correctly.
- **SUPPORTED** — XBert auto-resolves and Booke AI auto-categorises — they are live Xero incumbents that do more than flag, so LedgerMedic/DupliGuard differentiation is capped.  
  _evidence:_ XBert ships an 'Auto-Resolve' feature that actions suggested changes onto the Xero file (xbert.io/blog + support.xbert.io). Booke AI reviews bank feeds, categorises transactions (~98% accuracy) and reconciles in-Xero in bulk (booke.ai/xero). Matches the run-1 correction; caps on LedgerMedic (diff 62) and DupliGuard (F5=50) are justified.
- **SUPPORTED** — Xero caps you at 2 active tracking categories and has no native fund accounting.  
  _evidence:_ Xero Central + multiple sources: 'maximum of two active tracking categories at any time, with up to 100 options per category' (up to 4 total, only 2 active). FundGuardian's central premise and its feasibility-collision red-team cap are valid.
- **SUPPORTED** — MTD ITSA is mandatory from 6 Apr 2026 for >£50k qualifying income, £30k from 2027, £20k from 2028.  
  _evidence:_ GOV.UK + Deloitte TaxScape + ICAEW: April 2026 mandates >£50k business receipts, April 2027 >£30k, April 2028 >£20k. Thresholds and dates exact.
- **SUPPORTED** — From 6 Apr 2026 CIS nil returns are mandatory again unless inactivity is pre-notified.  
  _evidence:_ Cavendish/Chippendale/Planyard/UK Construction Online: from 6 Apr 2026 filing nil returns is mandatory (reinstated after 2015); alternative is pre-notifying HMRC of no payments. £100+ automated penalties. Verified reform.
- **SUPPORTED** — Xero's native CIS Contractor add-on already verifies subbies with HMRC, auto-calculates 0/20/30% labour-vs-materials deductions, and files CIS300 directly to HMRC — so 3 of CISAutopilot's 4 subsystems duplicate shipped features.  
  _evidence:_ Xero Central: the CIS contractor add-on files monthly CIS returns direct to HMRC, verifies subcontractors online (SVN + deduction rate confirmation), defaults 30% without UTR, and generates Payment & Deduction Statements. Confirms CISAutopilot's F5→47 gutting.
- **SUPPORTED** — 76% of organisations were hit by payment fraud (AFP 2026 survey, 2025 data).  
  _evidence:_ AFP 2026 Payments Fraud & Control Survey (financialprofessionals.org, PR Newswire): 76% of US organisations experienced attempted/actual payments fraud in 2025 (465 US treasury practitioners, surveyed Jan 2026). Number is accurate; caveat — it is US treasury/large-org data, applied here to a UK Xero-SME framing.
- **SUPPORTED** — Dext/AutoEntry now ship SME-priced supplier-statement reconciliation, narrowing StatementMatch's wedge.  
  _evidence:_ Dext ships a Supplier Statements reconciliation feature that cross-references statements against invoices/credit notes recorded in Xero and flags missing/duplicate/discrepant lines, on all Dext plans (dext.com + help.dext.com). AutoEntry is Dext-owned. StatementMatch F5=62 cap justified.
- **SUPPORTED** — Traild and ApprovalMax are live Xero apps already doing duplicate/near-duplicate detection pre-payment, forcing DupliGuard F5 to the 50 cap.  
  _evidence:_ Traild AI anomaly detection catches duplicate invoices + changed banking details before fraud (traildsoftware.com); ApprovalMax flags potential duplicate bills at approval stage before money leaves (support.approvalmax.com). Both integrate with Xero. Anti-gaming cap justified.
- **SUPPORTED** — Xero's built-in duplicate alert fires only on an exact match of contact+reference+amount at bill-entry time.  
  _evidence:_ Xero's native duplicate-bills detection compares contact, reference and amount of bills/credit notes and surfaces a review banner above the bills list (ApprovalMax help centre citing native Xero behaviour). Matches the deck's characterisation; the post-payment/fuzzy gap it claims is real.
- **SUPPORTED** — No connector reads service/gig settlement schemas — A2X/Link My Books/Synder are ecommerce-only — leaving PayoutBridge in white-space.  
  _evidence:_ All three are ecommerce settlement-to-GL reconcilers for Amazon/Shopify/Etsy/eBay/PayPal (apps.xero.com, a2xaccounting.com, linkmybooks.com). None target service/gig marketplace payouts (e.g. Treatwell). Vertical white-space holds; note the clearing/settlement PATTERN itself is not novel (A2X does it for ecommerce).
- **SUPPORTED** — UK private clinics bill insurers (Bupa/AXA/Vitality) via Healthcode and receive per-claim electronic remittance advice — the ClaimReconcileHealth domain.  
  _evidence:_ Healthcode is the official UK clearing service for private medical insurers; it provides electronic remittances used for invoice payment assignment and covers physiotherapists and other practitioners (healthcode.co.uk/electronic-remittances, Aviva provider pages). Domain is real.
- **SUPPORTED** — QuarterClose's flagship in-year tax estimate is unsound and not required by HMRC (which requires only quarterly updates + a final declaration).  
  _evidence:_ GOV.UK/ICAEW MTD guidance: MTD ITSA requires quarterly digital updates of receipts/expenses plus a final declaration — there is no in-year liability computation requirement. A correct UK liability requires personal allowance, other/PAYE income, payments on account and Class 4 NIC, none of which live in a single-trade Xero ledger. Reasoning is valid.
- **UNSUPPORTED** — The DupliGuard '17% use AI' punchline is unverified and should be dropped.  
  _evidence:_ This deck claim is itself wrong-in-the-conservative-direction: the AFP 2026 survey explicitly states 'Just 17% of organizations leverage AI to combat payments fraud' (PR Newswire / financialprofessionals.org). The 17% figure IS verifiable from the same source as the 76% stat; flagging it as unverified under-claims. Not harmful, but the caution is misplaced.
- **UNSUPPORTED** — UK ~5.7M businesses (PayoutBridge scale framing).  
  _evidence:_ Current ONS business-population estimates put UK private-sector businesses at roughly 5.5M (2024), down from a ~5.9-6.0M 2020 peak; ~5.7M is on the high side and undated. Directionally fine for a horizontal-market framing but the exact figure is not tightly sourced. Xero '~4.4M subscribers' checks out (sources give 4.2-4.6M global).

**Slop / weakness flags:**
- Prose mannerisms present but confined to style, not substance: heavy em-dash usage, rule-of-three cadences ('detects, flags, then posts'), and reflex intensifiers ('textbook', 'genuine white-space', 'the tie-breaker', 'landmine').
- Bolding-as-emphasis is dense throughout; can read as machine-generated confidence, though the underlying numbers are real.
- 'Verified' / 'confirmed' used as rhetorical stamps in a few places (e.g. LeakSeal incumbent-absence) where the underlying claim is an unprovable negative, not a positively verified fact — softer language ('no counter-evidence found') would be more honest.
- Minor context-stretch (not fabrication): a US treasury/large-org fraud stat (76%) and a slightly-high UK business count (~5.7M) are presented in a UK-Xero-SME frame without flagging the population mismatch.


> Diversity 2nd-opinion source: `ollama-cloud,deepseek-v4-pro`. All scoring/red-team agents ran on **opus**; orchestrator on fable-5. Companion optimization report: [TOP3-OPTIMIZED.md](TOP3-OPTIMIZED.md). Mixed-model baseline: [IDEAS-RANKED.md](IDEAS-RANKED.md).

---
*Generated by /dispatch powerful-model workflow (wf_e9450746-52c): 73 agents (all opus), 5 idea scouts + superset curation (run-1 top-10 seeded) + per-candidate score→fact-check + opus-max red-team + ollama diversity + independent verifier + top-3 optimization loop.*
