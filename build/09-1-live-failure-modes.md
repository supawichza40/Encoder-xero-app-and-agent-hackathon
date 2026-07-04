> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 9.

## 9.1 Live-failure modes and mitigations

| # | Failure mode | Mitigation |
|---|---|---|
| R1 | Seed drift / Demo Company state changed | Idempotent one-command re-seed; final re-seed at 13:30 Sunday; all amounts hardcoded |
| R2 | £0.01 rounding mismatch (the classic) | Golden file is VAT-free; invariant checked in `planner.ts`; amounts sum exactly by construction |
| R3 | MCP write fails mid-demo (scope / 429 / transient) | All scopes granted at connect; golden path ≤10 calls vs 60/min budget; per-step audit allows narrated recovery ("step 2 of 3 committed — rerunning step 3"); fallback video on phone AND in deck |
| R4 | CSV parse failure | Deterministic hardcoded map; file locked at 18:30 Sat and never edited again |
| R5 | Venue wifi dies | Agent + MCP run locally; only Xero API needs internet → phone hotspot tested Sunday 13:30 |
| R6 | Lovable credit wall / build stalls | Core flow must also run from a minimal local page or CLI — Lovable is the face, never the spine |
| R7 | Payment semantics fight the Demo Company | Decision window in Spike 2 with the manual-journal alternative pre-approved (Section 2.3 note) |
| R8 | Judge Q&A ambush | Section 6.3 drilled out loud twice; honesty rules (6.4) prevent over-claim traps |

## 9.2 Pivot plan: LedgerMedic (executes ONLY if the 21:00 Saturday gate fails)

- **What:** pre-seeded miscoding (a £2,400 laptop booked to Office Supplies + a stuck £500 suspense balance) → agent diagnoses → drafts the correcting `create-manual-journal` with reversal and plain-English reasoning → human approves → suspense drops to £0.00, audit trail visible.
- **Why it's the pivot:** deterministic (no parsing at all), single write type, same Approval Drawer UI, same idempotency/audit code, same architecture story — **~70% of Saturday's code reuses** (estimate, 0.B). Win-Confidence 73 vs PayoutBridge 81 (internal estimates) — lower ceiling, far lower variance.
- **Rule:** the 21:00 decision is one-way. No flip-flopping. If pivoted, Section 6's script is rewritten Sunday 08:00 around "suspense to zero" as the payoff.

## 9.3 Score ledger (internal honesty — ESTIMATES, not external facts; see 0.B)

| Claim | Number |
|---|---|
| Honest internal score (both external LLM critiques) | **74** |
| Defensible after Upgrades 1–3 ship | **76–78** |
| Do not claim externally | 81 |
| Pivot floor (LedgerMedic) | ~73 |

---

# SECTION 10 — ORDERED BUILD TASK LIST FOR CLAUDE FABLE

Execute strictly in order. Each task has acceptance criteria. Do not start a task until the previous one's criteria pass.

1. **Project scaffold** — `package.json`, TS config, folder tree per Section 4. ✓ `npm run build` clean.
2. **MCP connectivity** — `src/xero.ts` connects via Custom Connection env vars; `list-organisation-details` returns the Demo Company. ✓ Org name printed.
3. **Seed script** — `seed/seed.ts` per Section 2.3: accounts, contact, £847 net deposit, BEFORE P&L snapshot. Idempotent (re-run = no duplicates). ✓ All objects visible in Xero UI; second run creates nothing new.
4. **Golden CSV + parser** — `data/marketplaceco-payout-0407.csv` per Section 2.4 (SYNTHETIC demo data); `src/parser.ts` hardcoded map → `CanonicalPayout`. ✓ Parsed output matches locked amounts; invariant holds.
5. **Planner** — `src/planner.ts` → `JournalPlan`; throws on invariant failure. ✓ Unit check: tampered CSV rejected.
6. **Three writes** — `src/xero.ts` executes the plan in order, captures Xero IDs. Payment-semantics decision locked here (Section 2.3 note). ✓ Human confirms in Xero UI: invoice, fees, clearing at £0.00. **This is Checkpoint Alpha (18:30).**
7. **Verification read (consensus #1)** — post-write clearing-balance query; expose in `/status`. ✓ Returns 0.00 after a clean run.
8. **Idempotency step-map (consensus #2)** — `src/idempotency.ts` + wiring; duplicate `/propose` returns `already-posted` with IDs. ✓ Second run of the same file performs zero writes.
9. **Audit trail (consensus #3)** — `src/audit.ts`; every call appended; `/status` returns trace-panel shape. ✓ audit.json shows full run with IDs.
10. **HTTP server** — `src/server.ts` with `/propose` `/approve` `/status` `/pnl`. ✓ curl walkthrough of the full flow works.
11. **PIVOT GATE 21:00** — one-screen demo achievable? Owner decision. If NO → switch to Section 9.2 backlog (reuse tasks 1–3, 8–10; replace 4–7 with miscoding seed + manual-journal flow).
12. **Lovable Approval Drawer** — prompt per Section 8.1, wired to endpoints. ✓ Full golden path clickable in the browser, payoff panel renders live £0.00 ✓.
13. **P&L split-screen** — AFTER snapshot post-run; `/pnl` feeds the before/after panel. ✓ Revenue 847→1,340 visible, commission line appears.
14. **Reset rehearsal script** — `scripts/reset-rehearsal.ts`: seed → propose → approve → verify, one command. ✓ Clean run end-to-end; run once Sat 22:30, once Sun 08:00.
15. **Fallback video** — 60–90s screen recording of the working flow. ✓ On phone + embedded in deck.
16. **(Sunday) Make scenario** — Section 8.2, 45-minute cap. ✓ Screenshot in deck.
17. **(Sunday) Submission package** — Section 7 fields finalised, submitted by 10:45. ✓ Confirmation received.

**Definition of done (the Perplexity threshold, verbatim):** one screen shows seeded file → human approval gate → three distinct Xero writes → live £0.00 clearing verification → before/after P&L. Everything else is garnish.

---

## Consensus upgrades (why the three headline features exist)

Both external critiques (Grok, Perplexity — internal honest score **74/100**, an estimate, not a judge's score) agreed on the same three highest-ROI upgrades. They are the backbone of Sections 2.5, 6, and 10:

1. **#1 — closed-loop verification read.** After the final write, READ the clearing account balance back from Xero and display a live **£0.00 ✓**. Turns "one clever journal" into "closed-loop accounting." Est. 1–1.5h. Lifts the 30% API pillar, the 20% Architecture pillar, and demo wow simultaneously.
2. **#2 — idempotency guard, demoed live.** File-hash check before any write; duplicate upload shows "Already posted — skipped (idempotent)." Est. 0.75–1h. Pre-answers "what happens on duplicate upload?"
3. **#3 — transaction-trace / audit panel.** Every CSV row mapped to its accounting action with returned Xero IDs and the idempotency key visible. Est. 2–4h. Lifts API depth, architecture, production credibility.

**Unanimous kill list:** live LLM schema inference on stage · refund/credit-note handling on the golden path · multi-platform recipe UI · tracking categories · PDF OCR · any "smart categorisation" not needed to zero the clearing account. **Recipe cache verdict:** a hardcoded Treatwell JSON column-map (~45 min) is a production signal worth having; an LLM fallback + "add new platform" UI is theater — cut it.

---

# ENRICHMENT ADDENDA (Sections 11–16)

> Folded in by the ENRICHER stage from the six lossless digests of all 18 repo docs. These sections ADD platform truth, judge-signal architecture, event logistics, honest score history, the locked demo design, and pitch research. Nothing here supersedes the locked build spec in Sections 1–10 **except** where a **⚠ superseded:** flag says so. Every new hedged claim is registered in §0.B.

---

# SECTION 11 — PLATFORM TRUTH (MCP reality · JAX boundary · Xero roadmap)

> Load-bearing for the Architecture (20%) pillar and Q&A. Sourced-but-unverified — see extended §0.B. Re-check the repo/issues on the day.

