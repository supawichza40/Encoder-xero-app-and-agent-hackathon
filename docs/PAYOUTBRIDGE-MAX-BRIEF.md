# PayoutBridge Max — Interrupted Optimization Run (design brief + resume state)

_Captured 2026-07-04. The third /dispatch run (`wf_ac040e02-91c`) was **stopped by the user ~1 minute into Wave 1**. This file preserves everything designed for it that exists nowhere else on disk, plus how to resume it without re-paying for completed work._

## Goal

Push **PayoutBridge** (current champion, Win-Confidence **81**) so that **all six** rubric factors increase — via per-factor Pareto engineering, not generic variation (the generic loop in [TOP3-OPTIMIZED.md](TOP3-OPTIMIZED.md) already converged at 81).

## Headroom analysis (the reasoning behind the run)

Baseline factors: **F1=90 · F2=87 · F3=68 · F4=82 · F5=84 · F6=68** (weights 25/15/20/15/15/10).

| Factor | Baseline | Realistic ceiling | Why |
|---|:---:|:---:|---|
| F1 Xero-Centrality | 90 | ~93 | Near ceiling; only marginal deepening left |
| F2 API-Depth | 87 | ~92 | Already ≥3 distinct writes; small adds only |
| **F3 Feasibility** | **68** | **75+** | **Biggest drag.** Gains must be mechanisms, not assertions (conservative run scored the same fragility 47) |
| F4 Demo-Wow | 82 | ~88 | Demo engineering, no new moving parts |
| F5 Differentiation | 84 | ~88 | Needs explicit Synder/JAX exclusion proof |
| **F6 Impact** | **68** | **78+** | Under-quantified framing; fixable without scope creep |

Key insight: "all six up" is achievable but asymmetric — the prize is F3 + F6; F1/F2 gains are cosmetic.

## The six factor briefs (as given to the Wave-1 engineers)

- **F1 (90):** make Xero even more inseparable — tracking-category per platform for in-Xero per-platform P&L; two-way state (read aged receivables to detect unpaid marketplace invoices). Only moves with zero feasibility cost.
- **F2 (87):** add DISTINCT write types exercised live in the demo — credit-note for refund lines; create-payment to clear the clearing account against the bank transaction. Must fit the 90-second demo without bloating it.
- **F3 (68, the key):** de-risking **mechanisms**: deterministic **recipe cache** (pre-built schema mappings shipped for Treatwell + 2 more platforms; the LLM is invoked only for UNSEEN formats, and that path is OFF the demo golden path); pinned single-format golden path; idempotency keys; resettable Demo Company re-seed script; recorded fallback video. Target honest 68→75+.
- **F4 (82):** make 90 seconds unmissable — live before/after P&L delta; "wrong books vs right books" side-by-side; **the clearing account hitting exactly 0.00 as the payoff moment**; one-click approve. No new fragile parts.
- **F5 (84):** exclude the overlap explicitly — target platforms with **no processor integration** (Treatwell/Fresha/Booksy settle by bank transfer with PDF/CSV statements → outside Synder's Stripe/PayPal scope); position as the correcting-accounting layer **JAX is contractually banned from** (gross-up = accounting judgement). Deliverable: proof-of-exclusion table.
- **F6 (68):** raise quantified scale without scope creep — recipe architecture generalizes to any payout marketplace (UK ~5.5M SMEs per ONS 2024; Xero 4.4M subscribers; salon/beauty marketplace + gig-economy segment sizes with sources); App Store distribution path; **accountant/bookkeeper multi-client angle (one bookkeeper serves ~30 clients)**. Every number sourced or marked estimate.

## Workflow design (5 waves, --mode saver)

1. **Engineer** — 6 opus factor specialists (2–4 Pareto moves each: mechanism + side-effect check on the other 5 factors) **+ ollama `deepseek-v4-pro` move-scout** (independent move-space, via `ccr_safe`).
2. **Reconcile** — opus-max composes "PayoutBridge Max" spec. **Hard no-regression rule:** no factor may drop below baseline; regressive moves rejected with reasons. Demo stays 90 seconds (demo bloat = F3/F4 regression).
3. **Rescore** — opus score → opus fact-check, ∥ **ollama independent rescore** (same rubric).
4. **Red-team** — opus attacks every claimed gain (self-grading guard); corrections applied downward in code.
5. **Verify** — fresh-context opus **with explicit provenance note** naming the 81 baseline (prevents the run-2 verifier trap of conflating GigLedger=68 from the mixed run).

Acceptance: every factor ≥2 proposed moves; composed spec raises every factor or documents proven ceiling; gains survive fact-check + red-team; output doc `PAYOUTBRIDGE-MAX.md`.

## Resume state (do this to continue without re-paying)

- **Run ID:** `wf_ac040e02-91c` · task `wad9bx03e` — stopped 2026-07-04 ~09:23 during Wave 1.
- **Script (persisted, editable):** `~/.claude/projects/<this-project>/83ccda38-d80d-462d-adcc-1c1b285688d4/workflows/scripts/payoutbridge-max-wf_ac040e02-91c.js`
- **Resume:** `Workflow({scriptPath: <above>, resumeFromRunId: "wf_ac040e02-91c"})` — completed agents replay from cache; agents killed mid-run re-run live.
- **Partial state:** 6 Wave-1 engineer transcripts (~100–125k each, incomplete, no returned results — journal had only "started" lines) under `subagents/workflows/wf_ac040e02-91c/`.
- Ollama egress consent (public-market idea text → `ollama-cloud,deepseek-v4-pro`) was granted for this run's two external arms.

## Expected outcome (unverified — the run never finished)

Directional estimate if the mechanisms hold: F3 68→~74, F6 68→~76, F4 82→~86, F5 84→~86, F1/F2 +2–3 → total roughly **84–86**. Treat as hypothesis only; the rescore/red-team/verify chain exists precisely because such estimates self-inflate.
