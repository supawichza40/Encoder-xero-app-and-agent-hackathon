# PayoutBridge — Build History & Xero Integration Fact Sheet

Source: `git log --oneline --stat`, `git shortlog -sne`, `docs/specs/`, and the backend
source (`xero_client.py`, `planner.py`, `seed.py`, `main.py`, `config.py`). All figures below
are read directly off the repo as of commit `7ef9f26` (2026-07-05 02:53 BST) plus the
`docs/specs/12-ENDPOINTS-AND-SCOPES.md` reconciliation pass. 74 commits total, spanning
2026-07-04 00:36 to 2026-07-05 04:54 (~28.3 hours, one overnight hackathon session).

## 1. Team (by commit count)

| Author | Commits | Primary contribution area (by commit content) |
|---|---:|---|
| supawichza40 (project owner) | 42 | Research/planning docs, specs 01-12, backend seed data, integration docs, security hardening |
| Talha Mansoor | 17 | Repo restructuring, data file, merges, `.gitignore` |
| Reece Rodrigues | 10 | Backend build-out (Xero execution path, E1-E6 expansion, Make integration, planner tests) |
| OrestisKap (+ "Arbaaz" co-credit in messages) | 6 | Frontend (React/Vite/TanStack) versions 1-5, dashboard animation/motion polish |

## 2. Tech + tooling stack actually used

Confirmed by reading the installed dependency manifests and config in the repo (not just
docs claims):

**Backend** — Python 3.12+, FastAPI (`fastapi>=0.115.0`), Uvicorn, Pydantic v2
(`pydantic>=2.10.0`), `python-multipart`, `mcp>=1.9.0` (official MCP Python SDK), `httpx`
(raw REST calls Xero MCP doesn't cover), `requests`. `src/backend/requirements.txt`.

**Frontend** — React 19.2.0, Vite 8.0.16, TypeScript 5.8.3, TanStack Router, Tailwind CSS —
built with **Lovable** (per `.env.example`: *"connect via the Claude Code plugin (OAuth)"*)
and run locally with **Bun** (`bun.lock` present; `package-lock.json` kept as an npm
fallback). `src/frontend/package.json`, `src/frontend/AGENTS.md`.

**Xero integration** — `@xeroapi/xero-mcp-server@latest` run as an MCP subprocess via
`npx` (official MCP client SDK, stdio transport) for all standard accounting operations,
plus hand-rolled raw REST (`httpx`) for the two operations the MCP server does not expose
(attachments, history notes) — see §4.

**Automation (optional partner-prize surface)** — **Make** (make.com): a 7-module scenario
blueprint (`src/make/scenario.json`) wired to `POST /propose` via `CORS_ALLOW_ORIGINS`;
requires ngrok to expose localhost. Documented in `docs/MAKE-INSTRUCTIONS.md`. Make never
calls `/approve` — human approval always happens in the React UI.

**Dev tooling** — Claude Code (used throughout for planning/specs/implementation per
`.mcp.json`, `CLAUDE.md`, and the Lovable-via-Claude-Code-plugin note above) and VS Code as
the editor. `.mcp.json` configures the Xero MCP server for local dev.

**Ollama Cloud** — **not found anywhere in this repository.** No mention in code, `.env`,
specs, or docs; no Ollama dependency in either `requirements.txt` or `package.json`. The
project's voice/LLM assistant work (`docs/specs/10-VOICE-VAT-GUARDIAN.md`,
`demos/voice-vat-guardian/`) is built on a third-party platform called **BimpeAI**
(`api.bimpe.ai`), explicitly kept unnamed to judges per commit `a97d967` ("never name
BimpeAI to judges — present voice as our own feature"). If Ollama Cloud is required for the
submission narrative, it was not actually wired into this codebase — flag before citing it.

## 3. Build timeline (by commit timestamp, local time BST)

**Day 1 — 2026-07-04, research & ideation (00:36–14:11, ~14h)**
- `00:36` Initial commit.
- `00:41–01:56` Hackathon research phase: `HACKATHON.md`, scoring-strategy notes, full idea
  research dossier (`RESEARCH.md`), field notes (`INSIGHTS.md`) — no idea locked yet.
- `12:24–14:11` Second research pass: ranked idea shortlists (`IDEAS-RANKED*.md`), verified
  tooling reference for Xero API / Lovable / Make (`TOOLING.md`), event photos, platform
  notes — all later archived to `docs/archieve/`.

**Day 1 — idea lock & specs (14:51–18:16, ~3.4h)**
- `14:51` PayoutBridge master win plan synthesized from AI critiques + event intel.
- `14:57` Node/TS scaffold: Xero SDK + MCP config (`.mcp.json`), setup guide.
- `15:46` Verified Xero portfolio map, fresh-idea rankings, judge signals.
- `16:50` `BUILD.md` master build doc.
- `17:36–17:56` Full spec suite written: 01-APP-OVERVIEW, 02-BACKEND-SPEC, 03-API-SPEC,
  04-FRONTEND-SPEC, 05/06-IMPLEMENTATION-PLAN (backend+frontend), 07/08-TEST-PLAN
  (backend+frontend) — six specs in twenty minutes, clearly template-driven planning.
- `18:16` Initial backend + frontend file scaffold (all empty placeholder files).
- `18:27` `CLAUDE.md` added for agent guidance.

**Day 1 — parallel build tracks (18:37–23:27, ~4.8h)**
- `18:48` Golden CSV fixture added (`marketplaceco-payout-0407.csv`).
- `18:55` **Backend Workstream 2 shipped**: full Xero execution path (Reece Rodrigues).
- `19:14` Tier 1 (48) + Tier 2 (33) backend tests — 81 passing, no credentials needed.
- `19:19–20:56` Design system pass: `design.md`, `design-references.md` (21st.dev
  components, light/dark tokens), Make integration docs, hero-video prompts.
- `19:57` Golden CSV reconciliation fix (booking rows now tie to summary commission).
- `20:12` Planner invariant guard test (PL10) — defence-in-depth on the gross-up equation.
- `20:56–23:17` **Frontend versions 1-3** shipped by OrestisKap (front-end v1/v2/v3), plus
  an optional Spline 3D toggle (default OFF, zero-impact).
- `23:17` Spec 10 added: Voice VAT-Guardian (BimpeAI) as an optional Phase-2 extension,
  immediately hedged with privacy/production notes and a "never name the vendor" rule.

**Day 2 — 2026-07-05, expansion + hardening + frontend consolidation (00:38–04:54, ~4.3h)**
- `00:38–00:56` Frontend update (HeroReceipt component); Specs 11 (API-depth expansion
  E1-E6) + 12 (endpoints/scopes) written; three-persona system synced across specs 01-10.
- `01:24` **Backend E1-E6 expansion shipped**: 4-step refund plan, tracking categories,
  attachments, history notes, dashboard, VAT check.
- `01:46–02:10` **Frontend v4/v5**: component/lib/route updates, animated dashboard charts
  + motion polish, then relocated wholesale into `src/frontend` (v5 = current location).
- `02:53` **Backend hardening**: full test coverage reaches **104 passing**; fixes a silent
  false-verified bug.
- `04:20` Security hardening: path-traversal + filename-injection fixes (see
  `xero_client.py::attach_file`, which now strips path segments and URL-encodes the
  attachment filename before it reaches the authenticated PUT).
- `04:54` Voice-VAT-Guardian Wave-0 preflight (8 invariants) committed; `.env` untracked.

## 4. Xero integration — endpoints, HTTP methods, and scopes

Reconciled directly against `src/backend/xero_client.py`, `planner.py`, `seed.py`, and
`main.py` (call-site grep, §4a below) plus `docs/specs/12-ENDPOINTS-AND-SCOPES.md`. Two
surfaces are used: the **Xero MCP server** (`@xeroapi/xero-mcp-server`, stdio JSON-RPC —
no raw HTTP verb) and **raw REST** (`httpx`, real HTTP verbs) for the two operations MCP
doesn't expose.

### Writes

| Operation | Surface / HTTP | Called from | Feature |
|---|---|---|---|
| `create-invoice` | MCP tool call | `main.py:256` (golden path step 1 — gross revenue) | base |
| `create-credit-note` | MCP tool call | `main.py:266` (refund plan step 2) | E1 |
| `create-bank-transaction` | MCP tool call | `main.py:275`, `seed.py:106,126` (fees step; seed net-deposit RECEIVE) | base |
| `create-payment` | MCP tool call | `main.py:288` (golden path final step) | base |
| `create-contact` | MCP tool call | `seed.py:92` (MarketplaceCo contact) | base |
| `create-tracking-category` / `create-tracking-options` | MCP tool call | `seed.py:142` via `ensure_tracking_category` (2-category org cap checked first) | E3 |
| `PUT /Invoices/{id}/Attachments/{filename}` | **raw REST PUT** | `main.py:355` → `xero_client.py:attach_file` | E2 |
| `PUT /{Endpoint}/{guid}/History` | **raw REST PUT** | `main.py:331` → `xero_client.py:add_history_note` | E6 |

### Reads

| Operation | Surface / HTTP | Called from | Feature |
|---|---|---|---|
| `list-accounts` | MCP tool call | `seed.py:63,78` (find-or-create), `xero_client.py:get_clearing_balance` (verification) | base |
| `list-profit-and-loss` | MCP tool call | `main.py:389`, `seed.py:156` (P&L before/after) | base |
| `list-organisation-details` | MCP tool call | `main.py:647` (`GET /health`) | base |
| `list-trial-balance` | MCP tool call | `main.py:516` (`GET /dashboard`) | E4 |
| `list-aged-receivables-by-contact` | MCP tool call | `main.py:517` (`GET /dashboard`) | E4 |
| `list-report-balance-sheet` | MCP tool call | `main.py:518` (`GET /dashboard`) | E4 |
| `list-tax-rates` | MCP tool call | `main.py:573` (`GET /vat-check`) | E5 |
| `list-bank-transactions` | MCP tool call | `seed.py:99` (idempotency check) | base |
| `list-contacts` | MCP tool call | `xero_client.py:create_contact` (idempotency check) | base |
| `list-tracking-categories` | MCP tool call | `xero_client.py:ensure_tracking_category` (seed check-before-create) | E3 |
| `GET /connections` | **raw REST GET** | `xero_client.py:_get_tenant_id` (tenant-id lookup for E2/E6 headers) | base |
| `POST https://identity.xero.com/connect/token` | **raw REST POST** | `xero_client.py:_get_access_token` (client-credentials token mint for E2/E6) | base |

Backend's 8 REST endpoints (`main.py`, confirmed by route grep): `POST /propose`,
`POST /approve`, `GET /status/{file_hash}`, `GET /pnl`, `GET /dashboard`, `GET /vat-check`,
`GET /health`, `POST /seed`.

### OAuth2 scopes

Confirmed against `src/backend/config.py` and `.env.example`:

```
accounting.transactions accounting.contacts accounting.settings accounting.reports.read
accounting.attachments offline_access
```

| Scope | Why (verified against code) |
|---|---|
| `accounting.transactions` | Invoices, credit notes, bank transactions, payments — reads and writes |
| `accounting.contacts` | MarketplaceCo contact create/list |
| `accounting.settings` | Chart of accounts, tax rates, tracking categories |
| `accounting.reports.read` | P&L, trial balance, balance sheet, aged receivables |
| `accounting.attachments` | E2 — source CSV attached to the created invoice |
| `offline_access` | Refresh-token support for the client-credentials Custom Connection |

**Granular-scope note** (from `.env.example` and spec 12): Custom Connections created from
29 Apr 2026 onward may require split scopes instead of the umbrella ones above —
`accounting.invoices`, `accounting.banktransactions`, `accounting.payments` in place of
`accounting.transactions`; `accounting.reports.trialbalance.read`,
`accounting.reports.balancesheet.read`, `accounting.reports.profitandloss.read`,
`accounting.reports.aged.read` in place of `accounting.reports.read`. `XERO_SCOPES` in
`.env` is the single adjustment point.

**Auth model**: Custom Connection (client-credentials, machine-to-machine) against the
**Xero Demo Company (UK)** only — confirmed by `CLAUDE.md` constraint and no other tenant
reference in code. Rate-limit posture: golden path ≤10 Xero calls, worst-case full flow
(refund + all features) ≤15 calls/min against the 60/min tenant limit.

## 5. Accounting invariant (core correctness claim)

`gross − commission − fees − refunds === net`, i.e.
`1340.00 − 445.90 − 47.10 − 0.00 === 847.00`. Enforced in `planner.py`; the planner refuses
to propose a plan if this fails (test `PL10`, added 2026-07-04 20:12, is a defence-in-depth
guard on top of the main check). All amounts are `Decimal`, never `float`.

## 6. Test status at time of writing

104 pytest tests passing (`src/backend`), reached in the 2026-07-05 02:53 commit
(`7ef9f26`) which also fixed a "silent false-verified" bug. No automated frontend test
runner is wired yet — the Lovable-built frontend has no vitest config; `tests/mocks/data.ts`
holds fixtures for when one is added.
