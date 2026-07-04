> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 14.

## 14.1 Win-Confidence history (68 → 81; per-run provenance)

- **68** = Run 1 (`wf_6828d781-ce6`, mixed-model; 43 agents, 2.34M tokens, ~30 min) — idea then named **GigLedger**.
- **81** = Run 2 (`wf_e9450746-52c`, all-opus, opus-max synth; 73 agents, 3.57M tokens, ~49 min) — renamed **PayoutBridge**.
- **81, converged** = TOP3-OPTIMIZED variation pass — no variant beat baseline by ≥2; its genuine measured gain was small: **avg 75.3 → 76.3 (+1.0)** (only LeakSeal improved 72→75; PayoutBridge & LedgerMedic converged at baseline).
- **84–86** = MAX-BRIEF (interrupted Run 3, `wf_ac040e02-91c`, stopped ~1 min into Wave 1) — a **projected hypothetical, self-flagged UNVERIFIED. Never present 84–86 as achieved.**
- **Cross-run uplift sequence:** GigLedger/PayoutBridge **68→81**, LedgerMedic **66→73**, RevenueGuard/LeakSeal **58→72**. **Ranking ORDER was stable across both runs (payout-recon #1, LedgerMedic #2) — that consistency is the robust signal.**

## 14.2 Red-team caveats that SURVIVED (carry into the pitch)

- The moat's F5 does **not** fully exclude Synder-adjacent overlap (Synder indirectly reconciles Stripe/PayPal-routed payouts; JAX auto-reconciles the raw bank line).
- Multi-format schema inference is the real fragility (conservative run scored that factor 47) → **the demo MUST pin to ONE seeded format.**
- The clearing/settlement **pattern itself is not novel — A2X does it for ecommerce**; "no connector reads service/gig schemas" remains an assertion of absence, not positively proven.
- A claimed 4th write (refund credit-note) adds risk beyond the 3 demoed — keep it off the golden path.

## 14.3 Cross-run calibration-drift warning

- All-opus rescored the same ideas **+7…+14** vs the mixed run → **rule: quote score ranges across runs; do NOT quote 81/73/75 as if both runs agree.**
- **Verifier trap (real):** a fresh-context verifier declared the optimization baselines "fabricated/inflated" — **FALSE verdicts caused by the verifier reading the repo before Run-2's doc existed.** TOP3-OPTIMIZED's Appendix-A verifier similarly rated the 81 sub-scores FALSE. **Treat those verifier passes as internally disputed/unresolved, not clean confirmations. Always check a verifier's evidence before accepting a FALSE verdict.**
- **Ollama 2nd-opinions run systematically higher (optimism bias)** — good for spotting *underrated* ideas, useless for absolute levels.
- Method caveat: "integer 0–100 sub-scores encode **judgement, not measurement** — calibrated ranking, not a true probability." Generic variation is exhausted at ~81; only mechanism-level engineering has remaining headroom.

---

# SECTION 15 — DEMO-DESIGN LOCK (90-second 4-beat + seeding reconciliation)

> Reconciles the MAX-BRIEF demo lock with the locked spec in §2.3 / §2.4 / §6.1. **BUILD.md's VAT-free amounts WIN; the HARD RULE is absolute.**

