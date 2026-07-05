# PayoutBridge — Remaining Tasks to Production-Ready

> **Goal:** a flawless, end-to-end working full-stack web app to show judges. Backend
> (Reece) and frontend (Lovable, now at `src/frontend/`) both largely built; the gaps
> are **integration, testing, a real/demo safety toggle, labeled sample data, and a
> runtime-verified golden path.** Presentation/slides are out of scope (owner does them).

## Decisions locked (2026-07-05)
- **Where it runs:** hand off to a **fresh `/dispatch`** session (clean budget), not inline.
- **Deploy target:** **deploy to a hosted URL** for judges (add deploy config; T7 owns it).
- **3rd sample file:** **approved** — create `sample-3-wont-balance-REFUSED.csv` (UC-6 refusal demo).
- **Live-Xero verification:** default = agents verify **demo/mock + tests**; the **owner runs the
  one live-Xero golden path by hand** after seeding the Demo Company. Flip only if backend+`.env`
  +seed are confirmed reachable in the run environment.

## Status snapshot (already done — do NOT rebuild)

- Backend: 8 endpoints — `/propose`, `/approve`, `/status/{hash}`, `/pnl`, `/dashboard`,
  `/vat-check`, `/health`, `/seed`. Expansion E1–E6 code present (credit-note, attachment,
  tracking, history notes) across `main/models/planner/seed/xero_client/config`.
- Backend tests: 10 files (unit: parser, models, planner, idempotency, audit; api: approve…).
- Frontend (`src/frontend/`, Bun + Vite + TanStack Router): golden-path states, persona
  system (3 cards + navbar switcher), mock layer (`payout-mock.ts`), live health badge,
  passive Demo/Live chip, dashboard live-fetch with fallback, assistant with "Check my VAT".
- Data: `src/data/marketplaceco-payout-0407.csv` (golden, 3 writes) and
  `marketplaceco-payout-2107.csv` (refund, 4 writes).

## Remaining tasks

### T1 — Front↔back integration (the "plug them together" task)
- Verify/fix `GET /status` call: frontend must hit `/status/{file_hash}` (path param),
  not `?file_hash=` (query). Regression-guard it.
- In **real mode** (`?mock=0`), confirm every screen consumes the live endpoint correctly:
  propose → approve (3 and 4 step) → status → pnl → dashboard → vat-check → health.
- CORS: backend `CORS_ALLOW_ORIGINS` must include the Vite dev origin (5173).
- Acceptance: with backend on :8000 + seeded Demo Company, the full golden path runs from
  the UI in real mode with zero console errors and clearing reads £0.00.

### T2 — Real/Demo toggle on the front page (safety valve)
- Explicit, visible **switch** (not just the passive chip) on the landing/app header that
  flips between Live (real backend) and Demo (mock). Persist choice (localStorage/URL).
- If Live is selected but `/health` is unreachable, auto-fall-back to Demo with a visible
  notice — so a backend failure mid-demo can't brick the pitch.
- Acceptance: toggling flips data source live; killing the backend auto-drops to Demo.

### T3 — Frontend tests (TDD; none exist today)
- Add vitest + React Testing Library (+ jsdom); wire a `test` script in `package.json`.
- Unit tests for main components: ApprovalDrawer (3- and 4-step), StepProgress (dynamic
  total), ClearingReconciliation, PnLComparison, AuditTrail (incl. attach-source/
  history-note rows), IdempotencyBanner, FileUpload, PersonaCard, Navbar mode toggle.
- Hook test: `usePayoutBridge` (idle→proposed→verified, idempotent, partial_error, reset).
- Integration: full App flow against the mock layer (upload→approve→verify).
- Acceptance: `bun run test` green; main components + hook covered; ~80% on touched code.

### T4 — Backend tests: expansion coverage + full green
- Confirm/author EX1–EX8 from `07-BACKEND-TEST-PLAN.md` (refund 4-step plan, dynamic
  idempotency step-map, non-fatal attachment, `/dashboard` cache + 503, `/vat-check`,
  tracking check-before-create).
- Acceptance: `cd src/backend && pytest` fully green (unit + api tiers); live tier skipped.

### T5 — Labeled sample data + manifest (3 upload scenarios)
- Provide three clearly-named upload files so the operator knows which triggers which screen:
  1. `sample-1-standard-3writes.csv` — new golden payout → 3 writes, £0.00 verified.
  2. `sample-2-refunds-4writes.csv` — refund payout → 4 writes incl. credit note.
  3. `sample-3-wont-balance-REFUSED.csv` — invariant violation → planner refuses (UC-6).
  (Re-uploading sample-1 after posting demos the idempotent/duplicate screen.)
- Keep the locked originals (`…-0407`, `…-2107`) untouched; new files are content-verified
  against the real parser. Add `src/data/SAMPLES.md` mapping file → scenario → expected screen.
- Acceptance: each file, uploaded through the UI, produces its documented screen.

### T6 — End-to-end runtime verification
- Drive both stacks together and OBSERVE real behavior (not just green tests): golden,
  refund, duplicate, and refusal flows; dashboard live; VAT check; health badge.
- Acceptance: a recorded pass of all four flows in real mode + demo mode.

### T7 — Production polish + review
- Loading / empty / error states on every screen; no dead links; projector-readable at
  1280×720; keyboard + WCAG-AA basics.
- Red-team pass: `code-review` + `security-review` on the integrated app; fix blockers.
- Acceptance: review findings triaged; no high-severity open; golden path can't crash.

## Non-functional acceptance (all must hold)
- No uncaught console errors in either mode. Amounts are decimal strings, tabular-nums.
- Only marketplace brand shown anywhere is "MarketplaceCo".
- Backend golden path ≤10 Xero calls; worst-case (refund + all features) ≤15/min.
- App survives backend outage by falling back to Demo (T2).

## Things you may have missed (flagged)
- **Deploy target:** judges need a URL or a laptop. Decide: local (`bun dev` + backend) or
  a deployed URL. Local is lowest-risk for a hackathon; deploying adds failure surface.
- **Seed state:** the Demo Company must be seeded before the live demo (`POST /seed` /
  rehearsal script). Re-seed resets idempotency so the golden path is clean each run.
- **`.env` / Xero creds** must be present for real mode; Demo Company only (never live tenant).
- **Recorded fallback video** of the golden path (belongs to demo-polish) in case Wi-Fi/Xero
  dies on stage — cheap insurance; do it once the golden path is green.
- Issue #18 (Reece expansion) still shows OPEN though code exists — close it once T4 passes.

---

## Ready-to-paste /dispatch prompt

Paste this into a fresh `/dispatch` (ideally a clean session with budget headroom):

```
/dispatch Take PayoutBridge (this repo) to a flawless, production-ready, end-to-end
working web app for hackathon judges. Backend is at src/backend (FastAPI, 8 endpoints,
E1–E6 built); frontend is at src/frontend (Bun + Vite + TanStack Router, Lovable-built,
mock layer + persona system). Do NOT rebuild what exists — read docs/REMAINING-TASKS.md
and execute tasks T1–T7 against its acceptance criteria, TDD-first.

Enforce:
- Plug frontend and backend together and verify every connection in real mode
  (?mock=0), including fixing the GET /status path-param call. CORS to :5173.
- Add a visible Real/Demo toggle on the front page that persists and auto-falls-back to
  Demo if the backend/health is unreachable, so a live failure can't sink the demo.
- TDD: frontend gets vitest + RTL with unit tests for every main component and the
  usePayoutBridge hook + one integration flow; backend pytest (unit+api) must run fully
  green including expansion cases EX1–EX8. Both functional and non-functional criteria
  in REMAINING-TASKS.md must pass.
- Generate three clearly-named sample upload files (standard 3-write, refunds 4-write,
  won't-balance refusal) verified against the real parser, plus src/data/SAMPLES.md
  mapping each file to the screen it triggers. Keep the locked originals untouched.
- Runtime-verify the golden, refund, duplicate, and refusal flows end-to-end (observe
  real behavior, not just green tests) in both real and demo mode.
- Finish with a code-review + security-review red-team pass; fix high-severity findings.
- Deploy the app to a hosted URL for judges (frontend + backend), with the Real/Demo
  toggle defaulting to Demo so the hosted link always works even if live Xero is down.

Constraints: add no new runtime dependencies without approval (dev-only test deps —
vitest/RTL/jsdom — are allowed); MarketplaceCo is the only marketplace brand; Xero Demo
Company only, never the live tenant; presentation/slides are out of scope. Loop the
engineering until all acceptance criteria in REMAINING-TASKS.md are met or budget is hit.
```
