# TOP3-FRESH-OPTIMIZED

*Optimization synthesis of the fresh-run cohort (N01–N03). Built only from this run's lineage + final-state data and the win-confidence rubric.*

---

## 1. Honest framing

Read every number here as **calibrated judgement against the rubric, not a probability of winning**. Each total is a weighted sum of six sub-factors (F1 25% · F2 15% · F3 20% · F4 15% · F5 15% · F6 10%). I recomputed all three totals from their sub-scores; they reconcile to the reported figures (67.6→68, 71.9→72, 65.8→66, 65.9→66), so the scores are internally consistent and not asserted.

- **Baselines are THIS run's fresh-idea scores** — the red-teamed round-0 ranking, cohort average **66.7**. They are *not* inherited from the earlier PayoutBridge runs.
- **PayoutBridge (81)** is a **different family and is excluded from this cohort**. It appears only as the standing bar to clear, not as a baseline or a member.
- **Convergence rule:** a round-N variant replaced its parent only if it beat the parent by **≥2 points on the same rubric**. Otherwise the parent stood and the idea converged. One idea improved (CreditSweep, +4); two produced no surviving variant.
- **Anti-gaming check applied:** the one improvement that stuck did so by *changing the build* (scope cut) and simultaneously *accepting* a differentiation loss — mechanism, not re-assertion. That is why it is a modest +4, not an inflated jump.

---

## 2. Before / after (cohort)

| Idea | Bounty | Baseline (this run) | Final | Δ | Opt. rounds | Converged | Outcome |
|---|---|---|---|---|---|---|---|
| **N03 CreditSweep AR** (Stop Over-Chasing) | B03 (sec B01) | 68 | **72** | **+4** | 2 (improved r1, held r2) | ✅ at 72 | Rescope stuck — cohort winner |
| **N01 DepositDesk** | B01 (sec B02) | 66 | 66 | 0 | 1 (held r1) | ✅ at 66 | No surviving variant |
| **N02 DeferDesk** | B01 | 66 | 66 | 0 | 1 (held r1) | ✅ at 66 | No surviving variant |

**Cohort average: 66.7 → 68.0 (+1.3).** The entire cohort lift comes from one idea: N03's +4, divided across three ideas (+1.33). N01 and N02 contributed nothing.

---

## 3. Per-idea deep dives

### N03 — CreditSweep AR (Stop Over-Chasing) — **cohort winner, 72**

*Scans customer receivables, finds every unapplied credit note / overpayment sitting on a contact that also has open invoices, and one-click allocates them oldest-invoice-first so the business stops chasing money it already holds.*

**Lineage (full)**

| Round | Name | Score | What happened |
|---|---|---|---|
| 0 | CreditSweep | 68 | Baseline (fresh-run ranking). Red-team had docked the base: feasibility 58→50 (two shaky moving parts: needs seeded credits across AR+AP; allocation writes only via raw xero-node), demoWow 70→62 (result is an aged-receivables numeric delta, not an on-screen messy-in/clean-out). |
| 1 | CreditSweep AR (Stop Over-Chasing) | **72** | **Improvement stuck (+4).** Cut scope from AR+AP and three credit types down to **customer-side credit-notes + overpayments only**; retargeted **B01→B03** (overstated debtors is a revenue-side story); **deleted the un-demoable lock-date prior-period slice** (no sanctioned workaround); concentrated the demo on **one over-chased customer** so before/after is a single legible AR row. Directly answered baseline weaknesses 1, 3 and 4. |
| 2 | CreditSweep AR (Stop Over-Chasing) | 72 | No round-2 variant beat the parent by ≥2 — **converged**. |

**Final sub-scores (base → final)**

| Factor | Weight | Base | Final | Δ | Contribution |
|---|---|---|---|---|---|
| F1 Xero-Centrality | 25% | 88 | **87** | −1 | 21.75 |
| F2 API-Depth | 15% | 60 | **60** | 0 | 9.00 |
| F3 Weekend-Feasibility | 20% | 50 | **67** | **+17** | 13.40 |
| F4 Demo-Wow | 15% | 62 | **74** | **+12** | 11.10 |
| F5 Differentiation | 15% | 73 | **68** | −5 | 10.20 |
| F6 Impact | 10% | 64 | **64** | 0 | 6.40 |
| **Total** | | **68** | **72** | **+4** | **71.85 → 72** |

**Why the +4 is real, not gamed:** the round-1 rescope traded −5 differentiation (dropped the lock-date headline) and −1 centrality for +17 feasibility and +12 demo-wow. Weighted, that is −0.75 −0.25 +3.40 +1.80 ≈ **+4.2**. It earned feasibility *above* even the pre-red-team value (58) because a genuinely narrower build (one customer, one credit family, no AP, no lock-date) is more buildable than the original broad version — and it booked the differentiation loss honestly rather than hand-waving it.

**Final weaknesses (carried):**
1. Demo legibility depends on the UK Demo Company shipping (or the team seeding) an over-covered customer — open invoice *and* an unapplied credit note/overpayment. Unconfirmed; without visible clutter the before/after is invisible.
2. The magic write (applying existing credits) needs `PUT /CreditNotes/{id}/Allocations` and `PUT /Overpayments/{id}/Allocations`, **absent from the verified MCP toolkit** — reachable only via raw xero-node core REST, an extra integration path to prove in 24h.
3. "Unallocated cash cleared" surfaces only as an aged-receivables delta — abstract for a 3-minute judge unless the seeded scenario is exaggerated.

**Updated WEEKEND BUILD SKETCH (reflects the optimized scope)**

- **Connect:** Custom Connection M2M to a resettable UK Demo Company. No external files, no third-party OAuth.
- **Read:** aged receivables + each contact's outstanding **credit notes and overpayments** (core REST reads / MCP reads). *Prepayments and the entire AP side are out of scope now.*
- **Detect (pure logic, unit-testable):** contacts holding **both** open invoices **and** unapplied credits/overpayments; compute an **oldest-open-invoice-first** allocation plan per over-covered contact.
- **Approve:** human-in-loop gate on the proposed plan; idempotency key per allocation; reversible.
- **Write (the risk):** apply each allocation via **raw xero-node** `PUT /CreditNotes/{id}/Allocations` + `PUT /Overpayments/{id}/Allocations` (MCP lacks these).
- **Golden path on screen:** one seeded customer — "£420 due, £500 credit sits unapplied" → **Apply** → that aged-receivables row drops to zero live.
- **De-risk order:** **Day-1 first task = spike the raw xero-node `PUT …/Allocations` write against the Demo Company** (the single highest-risk moving part). If that lands, everything downstream is reads + planner + one screen. Then seed the single over-chased customer deterministically; then build detector + planner; then the one-screen before/after.

---

### N01 — DepositDesk — converged, 66 (no movement)

*Turns "take X% upfront" into a linked deposit invoice + prepayment against an unearned-revenue liability, then auto-applies the held deposit to the final invoice.*

**Lineage (full)**

| Round | Name | Score | What happened |
|---|---|---|---|
| 0 | DepositDesk | 66 | Baseline. Red-team applied: demoWow 63→52 (headline "no early VAT" is false — wow moment shows an incorrect accounting claim to judges), feasibility 65→55 (held-deposit auto-apply needs `PUT Allocations`, absent from MCP; three chained writes), impact 67→58 (value narrows to income-deferral once the false VAT benefit is removed), differentiation 70→60 (shrinks to a guided wrapper over the standard prepayment path). |
| 1 | DepositDesk | 66 | No variant beat baseline by ≥2 — **converged**. |

**Final sub-scores** (base = final; no variant survived)

| Factor | Weight | Final | Contribution |
|---|---|---|---|
| F1 Xero-Centrality | 25% | 86 | 21.50 |
| F2 API-Depth | 15% | 71 | 10.65 |
| F3 Weekend-Feasibility | 20% | 55 | 11.00 |
| F4 Demo-Wow | 15% | 52 | 7.80 |
| F5 Differentiation | 15% | 60 | 9.00 |
| F6 Impact | 10% | 58 | 5.80 |
| **Total** | | **66** | **65.75 → 66** |

**Why it didn't move:** the headline is **verified FALSE** — "income *and VAT* are never recognised early" contradicts HMRC VAT Notice 700 §14.2.2(a): a deposit creates a tax point and output VAT is due on receipt. Strip that and the benefit collapses to ordinary income-deferral, which N02 already covers. No rescope could rescue demoWow (52) or feasibility (55) enough to clear +2, because the false half was load-bearing for the value prop and the auto-apply step still needs the missing `PUT Allocations`.

**Final weaknesses (carried):**
1. Core on-screen claim is false for VAT — an accountant judge catches it.
2. Auto-apply-held-deposit is prepayment/overpayment allocation (`PUT Allocations`), absent from MCP — raw xero-node only.
3. Once the VAT premise is stripped, benefit is ordinary income-deferral (overlaps DeferDesk).
4. Three chained writes (deposit invoice + prepayment + allocation) = more failure surface for a 3-min golden path.

**Updated WEEKEND BUILD SKETCH (corrected framing)**

- **First, fix the copy:** remove every "no early VAT" claim from UI and pitch. Position strictly as **P&L income-deferral via an Unearned Revenue liability**. This is non-negotiable for an accountant panel.
- **Connect:** M2M to Demo Company.
- **Read:** contacts + open invoices.
- **Write chain:** create deposit invoice → post prepayment against Unearned Revenue → on delivery, **apply the held credit** (allocation) so the liability unwinds to revenue. MCP has `create-payment` but **not** the allocation write → the auto-apply leg needs raw xero-node.
- **Spike first:** the allocation/unwind leg (same MCP gap as CreditSweep). If it won't land, the demo has no payoff.
- **Honest note:** after de-VATing, this is a guided wrapper over the standard prepayment path and competes with N02's territory — hard to differentiate.

---

### N02 — DeferDesk — converged, 66 (no movement)

*Assign a recognition schedule to any prepaid invoice; it auto-posts the monthly deferred-revenue release journals plus a rollforward.*

**Lineage (full)**

| Round | Name | Score | What happened |
|---|---|---|---|
| 0 | DeferDesk | 66 | Baseline. Red-team applied: apiDepth 50→40 (one distinct write type — manual journal — repeated; `create-account` not in MCP; well short of coordinated multi-write), differentiation 45→40 (at/over the unexcluded-incumbent cap: ScaleXP, Flowrev, Mayday occupy this exact rev-rec space on the Xero App Store). |
| 1 | DeferDesk | 66 | No variant beat baseline by ≥2 — **converged**. |

**Final sub-scores** (base = final; no variant survived)

| Factor | Weight | Final | Contribution |
|---|---|---|---|
| F1 Xero-Centrality | 25% | 85 | 21.25 |
| F2 API-Depth | 15% | 40 | 6.00 |
| F3 Weekend-Feasibility | 20% | **75** | 15.00 |
| F4 Demo-Wow | 15% | 72 | 10.80 |
| F5 Differentiation | 15% | **40** | 6.00 |
| F6 Impact | 10% | 68 | 6.80 |
| **Total** | | **66** | **65.85 → 66** |

**Why it didn't move:** the ceiling here is **structural differentiation, not buildability**. F3 is the cohort's best (75) and F4 is strong (72), but F5 is floored at 40 by a **real, saturated incumbent category** — Xero itself directs users to ScaleXP / Flowrev / Mayday. Rescoping the build cannot un-saturate the market, so no variant could add ≥2. F2 (40) is also capped: a single distinct write type (`create-manual-journal` repeated) fails the ≥3-distinct-writes bar, and `create-account` is absent from MCP.

**Final weaknesses (carried):**
1. Differentiation capped by a live saturated incumbent category — the build is a me-too of shipping products.
2. Single distinct write type (`create-manual-journal` repeated) — fails the ≥3-distinct-write-types bar.
3. "The engine Xero said it won't build" framing is true but creates no edge when three vendors already built it. (Note: the actual Xero response is the softer "Not in pipeline / not in the near term," not a flat "never.")
4. Survives on buildability, not novelty.

**Updated WEEKEND BUILD SKETCH**

- **Connect:** M2M to Demo Company. **100% native, no external files** — its structural strength.
- **Setup step:** ensure a Deferred Revenue liability account exists (**`create-account` is not in MCP** — pre-seed it in the UI or use an existing account; do not assume API creation).
- **Read:** a native sales invoice; user picks a recognition schedule (or delivery date).
- **Write:** post **idempotent monthly manual journals** moving value from the deferred-revenue liability into sales (`create-manual-journal`, repeated — the one write type MCP gives you). Deterministic, replayable, audit-trailed.
- **Read/render:** deferred-revenue **rollforward** from trial-balance reads.
- **Play to its strength:** lean the pitch on **architecture quality** (idempotent replayable journals + audit trail + fully native demo), because differentiation and API-breadth are the caps you cannot lift this weekend. This is the **safe fallback build**, not the trophy build.

---

## 4. Cohort average, best pick, and the champion check

- **Average: 66.7 → 68.0 (+1.3).** All of it from N03.
- **Single best final pick: N03 CreditSweep AR (Stop Over-Chasing) — 72.** It is the only idea whose optimization stuck, and it improved on exactly the axes a hackathon judges live (feasibility +17, demo-wow +12) while paying an honest differentiation cost.
- **Does it challenge the champion? No.** PayoutBridge stands at **81**; CreditSweep AR sits **9 points below** it. PayoutBridge is a **different family and is excluded from this cohort**, so this is a "best of the fresh bench" result, not a new #1.
  - Because it is a different family, CreditSweep reads as a **complementary second bet**, not a replacement. On these numbers, if the team backs one horse, **PayoutBridge remains it**; CreditSweep is the strongest fresh alternative if a second, revenue-side angle is wanted.
  - **Watch-out before committing to CreditSweep:** both of its live risks (seeded over-covered customer; `PUT …/Allocations` via raw xero-node) must be retired on Day 1 — it is a 72 *only if* the allocation write and the seed data both land.

---

## 5. What did NOT work — convergence evidence

The convergence rule (variant kept only if it beats parent by ≥2) makes the failures explicit. Failed variants are the evidence that the surviving scores are floors, not hopes.

- **N03, round 2 — failed.** After the round-1 rescope banked +4, no further variant found ≥2 more points. The remaining risks (seed dependency, raw-REST allocation write) are execution risks a re-score can't remove. **Converged at 72.** *(This is the good kind of failure: it caps an honest ceiling.)*
- **N01, round 1 — no surviving variant.** The false "no early VAT" premise was load-bearing; removing it drops the value to plain income-deferral and cannot lift demoWow (52) or feasibility (55) by +2. **Converged at 66** — a signal to either kill it or hard-pivot the framing before build.
- **N02, round 1 — no surviving variant.** The differentiation floor (40) is set by a live, saturated incumbent category that no rescope touches; API-depth (40) is capped by a single write type. **Converged at 66** — feasible and safe, but structurally unable to climb.

**Bottom line:** two of three ideas hit hard structural ceilings (a false premise; a saturated market) and could not be optimized upward — that is why the cohort moved only +1.3. The one idea that moved did so by cutting scope and telling the truth about the tradeoff, landing at **72**, the fresh cohort's best but still short of the excluded champion (81).


---

# Appendix A — Machine-captured lineage + final verification

## Lineage (raw, per idea)

### 1. CreditSweep AR (Stop Over-Chasing) — final 72 (ollama 2nd-opinion 85)
- lineage:
  - r0: **CreditSweep** = 68 — baseline (fresh-run ranking)
  - r1: **CreditSweep AR (Stop Over-Chasing)** = 72 — Cuts scope from AR+AP and three credit types down to customer-side credit-notes + overpayments only; retargets B01→B03 (overstated debtors is a revenue-side story); deletes the un-demoable lock-date prior-period slice entirely; concentrates the demo on a single over-chased customer so the before/after is one legible aged-receivables row instead of an abstract portfolio delta. Directly answers weaknesses 1, 3 and 4 by shrinking what must be seeded and dropping the slice with no sanctioned workaround.
  - r2: **CreditSweep AR (Stop Over-Chasing)** = 72 — no variant beat parent by >=2 pts — converged
- final factors: F1=87 F2=60 F3=67 F4=74 F5=68 F6=64
- converged: yes

### 2. DepositDesk — final 66 (ollama 2nd-opinion 81)
- lineage:
  - r0: **DepositDesk** = 66 — baseline (fresh-run ranking)
  - r1: **DepositDesk** = 66 — no variant beat parent by >=2 pts — converged
- final factors: F1=86 F2=71 F3=55 F4=52 F5=60 F6=58
- converged: yes

### 3. DeferDesk — final 66 (ollama 2nd-opinion 74)
- lineage:
  - r0: **DeferDesk** = 66 — baseline (fresh-run ranking)
  - r1: **DeferDesk** = 66 — no variant beat parent by >=2 pts — converged
- final factors: F1=85 F2=40 F3=75 F4=72 F5=40 F6=68
- converged: yes

## Final diversity 2nd-opinion
Source: `ollama-cloud,deepseek-v4-pro` — F1=85 · F2=81 · F3=74

## Optimization-report verification (fresh-context, provenance-hardened)

**Overall verdict:** test

**Per-claim verdicts:**
- **SUPPORTED** — a  
  _evidence:_ b



---
*Optimization loop: 2 round(s), keep-rule ≥+2 pts on the same rubric; average Win-Confidence 66.7 → 68. Part of workflow wf_8014dea4-853.*
