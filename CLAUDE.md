# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Refer to the @docs/specs for any architectural/design decision. To find any documentation relevant to the solution being implemented, use web search.

## What This Is

PayoutBridge — a Xero-native agent for the Encode Hub hackathon (4–5 July 2026). It ingests marketplace CSV settlement statements, proposes clearing-account gross-up accounting, executes 3 Xero writes after human approval, and verifies with a zero-balance check.

The core accounting invariant: `gross - commission - fees - refunds === net` (1340.00 - 445.90 - 47.10 - 0.00 === 847.00). The planner must refuse to propose if this fails.

## Build & Run Commands

### Backend (Python/FastAPI)

`backend` is a package (modules use relative imports), so run uvicorn from `src/` with the
package-qualified path — `uvicorn main:app` from inside `src/backend` fails with a relative-import error.

```bash
cd src/backend
pip install -r requirements.txt
cd ..                                   # back to src/
uvicorn backend.main:app --reload --port 8000
```

### Frontend (React / Vite / TanStack Router / Tailwind — Bun)

Built with Lovable; package manager is **Bun** (`bun.lock`). A `package-lock.json` also exists, so `npm` works as a fallback.

```bash
cd src/frontend
bun install
bun dev              # vite dev server (talks to backend at VITE_API_URL, default :8000)
bun run build        # production build (vite build)
bun run preview      # preview the production build
bun run lint         # eslint
```

### Root-level (legacy TypeScript scaffold — not the main app)

```bash
npm install
npm run dev          # tsx watch src/index.ts (env-check stub only)
npm run typecheck    # tsc --noEmit
```

### Xero MCP Server

```bash
npx -y @xeroapi/xero-mcp-server@latest
```

Configured in `.mcp.json`. Requires `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_SCOPES` in `.env`.

### Tests

```bash
# Backend
cd src/backend
pytest                         # all tests
pytest tests/unit/             # Tier 1: unit tests
pytest tests/api/              # Tier 2: API tests (mock Xero)
pytest tests/integration/ -m live  # Tier 3: live Xero (manual only)
pytest -k "test_parser"       # single test file/pattern

# Frontend
# No automated test runner is wired yet (the Lovable app has no vitest config).
# The frontend runs against a built-in mock layer by default (src/lib/payout-mock.ts):
#   bun dev                       # opens with mock data, no backend needed
#   open the app with ?mock=0     # hit the real backend at VITE_API_URL instead
# tests/mocks/data.ts holds shared fixtures for when a vitest suite is added.
```

## Architecture

Two independent codebases under `src/`:

**Backend** (`src/backend/`) — Python 3.12+ / FastAPI. Modules:

- `main.py` — FastAPI app with 5 endpoints: `POST /propose`, `POST /approve`, `GET /status/{hash}`, `GET /pnl`, `GET /health`
- `parser.py` — deterministic CSV parser (hardcoded column map, no LLM)
- `planner.py` — builds 3-write journal plan; throws on invariant failure
- `xero_client.py` — wraps Xero MCP server subprocess (`npx -y @xeroapi/xero-mcp-server@latest`); handles connect/disconnect/read/write
- `idempotency.py` — `sha256(file_bytes)` step-map in `state/posted.json`; per-step crash recovery
- `audit.py` — appends to `state/audit.json`
- `seed.py` — idempotent Demo Company setup (accounts, contact, net deposit, BEFORE P&L)
- `models.py` — Pydantic models (`CanonicalPayout`, `JournalPlan`, etc.)
- `config.py` — env vars and constants

**Frontend** (`src/frontend/`) — React / Vite / TanStack Router / Tailwind / TypeScript, built with Lovable and run with Bun. Routes live in `src/routes/` (`index.tsx` landing+dashboard, `app.tsx` golden path, `chat.tsx` assistant); the API hook + mock layer are in `src/lib/` (`usePayoutBridge.ts`, `payout-mock.ts`, `payout-types.ts`). Key pieces:

- `src/hooks/usePayoutBridge.ts` — central state machine hook (IDLE → UPLOADING → PROPOSED → APPROVING → VERIFIED)
- `src/components/` — 7 components: FileUpload, ApprovalDrawer, ClearingReconciliation, PnLComparison, StepProgress, AuditTrail, IdempotencyBanner
- `src/types/index.ts` — shared TypeScript interfaces matching the API spec

**Shared state files** (`src/state/`) — local JSON, no database:

- `posted.json` — idempotency step-map
- `audit.json` — full audit trail
- `pnl-before.json` / `pnl-after.json` — P&L snapshots

**Golden CSV** (`src/data/marketplaceco-payout-0407.csv`) — locked synthetic demo fixture. Never edit after lock.

**Scripts** (`src/scripts/reset_rehearsal.py`) — seed → propose → approve → verify in one command.

## Golden Path (the demo flow)

3 writes in strict order:

1. `create-invoice` — gross revenue £1,340.00 into Platform Clearing
2. `create-bank-transaction` — commission £445.90 + fees £47.10 out of Clearing
3. `create-payment` — £847.00 clears against the bank deposit

Then: verification read (clearing = £0.00) + P&L before/after snapshot.

## Critical Constraints

- **All amounts are Decimal, never float.** The demo is VAT-free by design to avoid rounding mismatches.
- **Human-in-the-loop:** every Xero write requires explicit approval. No auto-posting.
- **Idempotency is per-step, not per-file.** A crash after write 1 re-runs only writes 2–3.
- **Demo runs on the Xero Demo Company only.** Custom Connection is free only on the Demo Company. Never build against or risk the paid live tenant.
- **Demo data is SYNTHETIC.** Never present as a real customer statement. Use "MarketplaceCo" as the brand, not Treatwell (Treatwell appears only as market research).
- **Xero rate limits:** 60 calls/min, 5 concurrent, 5,000/day. Golden path uses ≤10 calls.
- **`update-bank-transaction` is broken** in MCP v0.0.17 (issues #206/#184). Use `create-bank-transaction` only.
- **MCP cannot:** approve DRAFT→AUTHORISED, reconcile bank lines, attach files, void/delete. This is why the path uses `create-*` end to end.
- **API terms prohibit training models on Xero API data** (inference is fine).

## Specs & Plans

All specs live in `docs/specs/`:

- `01-APP-OVERVIEW.md` — product spec, user journey, processing flow
- `02-BACKEND-SPEC.md` — Python module breakdown with Pydantic models
- `03-API-SPEC.md` — REST endpoints, request/response schemas, error codes
- `04-FRONTEND-SPEC.md` — components, state machine, design system
- `05-BACKEND-IMPLEMENTATION-PLAN.md` — parallel tracks (A: pure logic, B: Xero client, C: read endpoints)
- `06-FRONTEND-IMPLEMENTATION-PLAN.md` — parallel tracks (A: upload/approval, B: panels, C: feedback)
- `07-BACKEND-TEST-PLAN.md` — pytest, 3 tiers
- `08-FRONTEND-TEST-PLAN.md` — Vitest + RTL + MSW, 3 tiers
