# Session Ops Notes — how the ranking runs were built, what they cost, and what we learned

_Captured 2026-07-04. Operational knowledge from the /dispatch session that produced [IDEAS-RANKED.md](IDEAS-RANKED.md), [FINDINGS.md](FINDINGS.md), [IDEAS-RANKED-POWERFUL.md](IDEAS-RANKED-POWERFUL.md), [TOP3-OPTIMIZED.md](TOP3-OPTIMIZED.md), and [PAYOUTBRIDGE-MAX-BRIEF.md](PAYOUTBRIDGE-MAX-BRIEF.md). Nothing here is in those files._

## 1. Run ledger

| Run | Run ID | Agents | Tokens | Wall time | Config | Status |
|---|---|---:|---:|---:|---|---|
| 1 · Mixed-model ranking | `wf_6828d781-ce6`* | 43 | 2.34M | ~30 min | sonnet workers, opus curator/red-team, fable synth, ollama diversity | ✅ done |
| 2 · All-opus ranking + top-3 loop | `wf_e9450746-52c` | 73 | 3.57M | ~49 min | all-opus, opus-max synth (fable fallback unused), ollama ×2 | ✅ done |
| 3 · PayoutBridge-Max | `wf_ac040e02-91c` | 7 started | — | stopped @1 min | 6 opus engineers + ollama scout | ⏸ stopped, resumable |

*Run 1's first launch (`wf_ef6005ca-5b7`) was stopped pre-completion to patch in model-fallback ladders; the completed run reused its script. Session cost crossed ~$76 by mid-session (cost hooks flagged; user authorized continuing).

All runs: 0 agent errors. Both ollama `deepseek-v4-pro` calls succeeded for real (no claude-fallback triggered).

## 2. Post-processing recipe (needed every time a Workflow finishes)

The Workflow task output file (`tasks/<taskid>.output`) is JSON with the script's return value under **`.result`** (sometimes double-encoded as a JSON string — parse again if `typeof === "string"`). String fields carry **HTML-entity escaping** (`&amp;` `&lt;` `&gt;` `&quot;` `&#39;`) — unescape before writing to docs. Per-agent raw returns live in `subagents/workflows/<runId>/journal.jsonl` (one `{"type":"result",...}` line per completed agent) — mine it for data the return value dropped (e.g. run 1's 32 raw scout ideas).

Filter trap: `!/SUPPORT/i.test(label)` drops `UNSUPPORTED` too (substring match) — anchor the regex or compare `label !== "SUPPORTED"`.

Pattern that worked: write a one-off node script to scratchpad, run it against the output file, write the repo `.md`s from there (keeps 100k+ chars out of conversation context), delete the script.

## 3. Verifier lessons (the big one)

- **Fresh-context verifiers can mislabel provenance.** Run 2's final verifier read the repo, found only run-1 docs (run-2's doc wasn't written yet), and declared the optimization baselines "fabricated/inflated" — FALSE verdicts that were themselves wrong about provenance, while correctly exposing real cross-run drift. **Fix applied in run 3: the verifier prompt names the exact baseline and warns which repo docs NOT to conflate.** Always check a verifier's evidence before accepting FALSE.
- **Verifiers earn their cost.** Run 1's verifier caught a genuinely FALSE kill-shot (RepeatingInvoices "read-only" — actually POST/PUT exist in core REST since ~Aug 2022; only the MCP wrapper lacks the tool), which un-suppressed ContractToCashline 42→64 in run 2.
- **Feed corrections forward.** Run 2 embedded run-1's verifier corrections in every agent's context — that's why it didn't repeat the mistakes.

## 4. Scoring/measure lessons

- **Cross-run calibration drift is real:** all-opus rescored the same ideas +7…+14 vs the mixed run. Ranking ORDER was stable (payout-recon #1, LedgerMedic #2 in both). Quote score RANGES across runs, not single numbers.
- **Variation loops converge fast near the ceiling:** run 2's top-3 loop improved only LeakSeal (+3) in 2 rounds under a ≥+2-pts keep-rule. Generic variation is exhausted at ~81; only mechanism-level engineering (run 3's design) has remaining headroom.
- **Ollama 2nd opinions run systematically higher** (optimism bias) — useful for catching UNDER-rated ideas (flagged RevenueGuard at 83 vs Claude 58 in run 1; run 2 confirmed 72), not for absolute levels.

## 5. Model + infra config that worked

- **Fallback ladders** (self-healing overnight runs): synth = primary ×2 → next tier (`fable,fable,opus-max` in run 1; `opus-max,opus-max,fable` in run 2 per user rule); verifier = `opus-high → opus-max`; plus a code-level fallback markdown assembled from scored data so the deliverable survives total synthesizer failure.
- **Ollama-cloud external arm:** wrapper agent writes prompt to a scratchpad file, then `export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH"` and `cat <file> | ~/dev/claude-best/skills/dispatch/bin/ccr_safe --task "<desc>" --payload-stdin -- ccr code -p --model ollama-cloud,deepseek-v4-pro`; on BLOCKED/error → the wrapper scores itself and marks `source="claude-fallback"`. Consent scope granted this session: **public-market idea text only** (Class-2, owner-consented).
- **Workflow scripts persist** under `<session>/workflows/scripts/` — edit + relaunch with `{scriptPath, resumeFromRunId}` replays completed agents from cache (used to patch fallback ladders into run 1 at zero re-cost).
- Perplexity MCP is installed and worked for scouts this session (`perplexity_research`, `perplexity_ask`); an earlier session had found it missing — resolved.

## 6. Decision log (user-approved, binding on future runs)

- **Measure weights locked:** F1 Xero-Centrality 25 · F2 API-Depth 15 · F3 Feasibility 20 · F4 Demo-Wow 15 · F5 Differentiation 15 · F6 Impact 10. Keep identical across runs for comparability.
- Deliverable shape: ranked table + per-idea weekend build sketch.
- Ollama-cloud egress: approved for idea text (twice re-confirmed).
- Overnight autonomy: on questions, proceed with recommendation; fable failure → retry ×2 → opus max; nothing may block delivery of report + docs.
- Run-2 config: all spawned agents opus; orchestrator fable-5.

## 7. Doc map (what lives where)

- [HACKATHON.md](HACKATHON.md) — event, rubric, toolkit, schedule, strategy · [RESEARCH.md](RESEARCH.md) / [INSIGHTS.md](INSIGHTS.md) — pre-run research
- [IDEAS-RANKED.md](IDEAS-RANKED.md) — run-1 ranking (+corrections banner) · [FINDINGS.md](FINDINGS.md) — run-1 rubric/factor matrix/32-idea pool
- [IDEAS-RANKED-POWERFUL.md](IDEAS-RANKED-POWERFUL.md) — run-2 all-opus ranking + run-1 comparison · [TOP3-OPTIMIZED.md](TOP3-OPTIMIZED.md) — top-3 variation loop + lineage
- [PAYOUTBRIDGE-MAX-BRIEF.md](PAYOUTBRIDGE-MAX-BRIEF.md) — run-3 design + resume state · this file — ops knowledge
