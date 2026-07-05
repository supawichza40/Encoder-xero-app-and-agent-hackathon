# Backend coverage, test-quality & API-contract audit

Scope: `parser.py`, `planner.py`, `models.py`, `idempotency.py`, `audit.py`,
`config.py`, `main.py`, `seed.py`, `xero_client.py` + all tests under
`tests/unit/` and `tests/api/`, compared against `docs/specs/03-API-SPEC.md`.

Baseline: `./.venv/bin/python -m pytest --cov=. --cov-report=term-missing -q`
→ **104 passed, 0 failed**, total coverage **74%**.

## 1. Coverage table

| Module | Stmts | Miss | Cover | Notes |
|---|---:|---:|---:|---|
| `models.py` | 56 | 0 | **100%** | target met |
| `planner.py` | 17 | 0 | **100%** | target met |
| `idempotency.py` | 45 | 2 | **96%** | target met |
| `parser.py` | 62 | 4 | **94%** | target met |
| `audit.py` | 24 | 2 | 92% | — |
| `main.py` | 306 | 38 | 88% | see gaps below |
| `config.py` | 28 | 3 | 89% | `require_xero_creds()` fully untested |
| `seed.py` | 94 | 94 | **0%** | zero tests; not in the target-4 list but is production code |
| `xero_client.py` | 397 | 341 | **14%** | MCP subprocess wrapper — only signatures exercised, consistent with prior audit note ("Tier 3 live-only") |
| **TOTAL** | 1841 | 485 | 74% | |

The four modules the task calls out (`parser`/`planner`/`idempotency`/`models`)
all clear the 85% bar. `main.py`, `audit.py`, `config.py` are also healthy.
`seed.py` and `xero_client.py` drag the total down but that's expected for a
subprocess-driven Xero wrapper and a demo-seeding script — flagged as a gap,
not a defect.

### Meaningful uncovered lines (main.py, 38 missed)

Ignoring trivial branches (e.g. `_decimal_or_none`'s except at 707-708), the
lines that matter:

| Lines | What's uncovered | Why it matters |
|---|---|---|
| 110-112 | `lifespan()` — Xero connect failure at startup → `app.state.xero = None` (degraded boot) | Never proven the app actually boots and serves when Xero can't connect at startup |
| 150 | `/propose` — file >1MB → 400 | Untested error path (also undocumented in spec, see §3) |
| 170-171 | `/propose` — `create_plan()` raising `ValueError` → 422 | The planner's own defence-in-depth guard, reachable via the API, is untested at this layer (only unit-tested directly in `test_planner.py::PL10`) |
| 232 | `/approve` — `client is None` → 503 "not connected" | No test disconnects Xero before calling `/approve` (dashboard/vat-check both have this test shape; approve doesn't) |
| 284 | `/approve` — `create-payment` with no `invoice_id` → `ValueError` | Untested edge case (corrupted step-map / invoice never recorded) |
| 339-341, 357-359 | E6 history-note / E2 attach-file exception handlers | Non-fatal failure paths never exercised — can't prove they're actually non-fatal |
| 394-395 | AFTER P&L capture failure handler | Untested — approve() must still return 200 even if P&L capture fails; never proven |
| 537, 547-548 | `_build_recent_payouts()` exception/edge branch | Untested |
| 587-588 | `/vat-check` — `EffectiveRate` parse exception | Untested |
| 644 | `/health` — `client is None` → degraded | **Asymmetric gap**: `/dashboard` and `/vat-check` both test the "client is None" disconnected case explicitly; `/health` only tests the "client raises" case (`AH2`), never the "never connected" case |
| 668-675 | `POST /seed` — entire endpoint body | **Zero test coverage.** No `test_seed.py` exists at all |
| 688-694 | `_load_proposal()` — disk-cache reload branch | Simulates a server restart between `/propose` and `/approve` (proposal read back from `state/proposals/<hash>.json` instead of the in-memory dict) — never tested, yet this is exactly the crash-recovery scenario the idempotency design exists for |

`config.py` lines 61-69 (`require_xero_creds()`) are also fully untested —
the fail-fast credential check has no test proving it raises when
`XERO_CLIENT_ID`/`SECRET` are missing.

## 2. Test-quality audit

Overall the suite is well-structured (clear AAA pattern, one behavior per
test, descriptive IDs referenced in comments) and mostly exercises real
behavior through the FastAPI `TestClient` rather than mocking internals.
Specific issues:

### Weak / misleading test

- **`tests/unit/test_models.py::test_M5_negative_gross_rejected`** (line
  84-98) — the name and framing imply Pydantic rejects negative gross
  amounts. It does not: the test passes `gross=-100.00, net=50.00` (a
  mismatched pair) and the invariant validator fires — the same mechanism
  `test_M2` already covers. A payout with `gross=-100, commission=0, fees=0,
  refunds=0, net=-100` (fully negative but internally consistent) would pass
  validation, as `AUDIT-FINDINGS.md` itself documents under "Findings noted
  but left OPEN." The test's docstring hedges this ("Pydantic Decimal fields
  accept negatives but the invariant still fires...") but the test *name*
  overclaims a business rule that doesn't exist. Low risk (it's honest in
  the body), but a reader scanning test names would conclude negative
  amounts are categorically blocked, which is false.

### Contract-shape checks that don't check the shape

- **`tests/api/test_approve.py::test_AA4_already_completed_409`** (line
  61-68) — asserts `status_code == 409` only. It never inspects the response
  body, so it cannot catch that the body's `existing_ids` field the spec
  requires (§3 below) is actually absent — the test would pass identically
  whether the endpoint returned the documented body or an empty one.
- **`tests/api/test_approve.py::test_AA7_xero_write_failure_503`** (line
  105-112) — asserts `status_code == 503` and that "step 2" or "bank"
  appears in `detail`, but never checks for the `completed` array the spec's
  503 body documents. Same blind spot as AA4: this test cannot detect the
  missing field noted in §3.
- No test anywhere asserts the full JSON shape of a 4xx/5xx error body
  against the spec's documented schema (`{"detail": ..., "existing_ids":
  ...}` / `{"detail": ..., "completed": [...]}`)  — every error-path test
  checks `status_code` and a substring of `detail` only.

### `test_edge_cases.py` — genuinely driving failure paths

Reviewed in full: yes, these are real, not tautological. `EC3` proves a 422
leaves no cached proposal (via a real subsequent `/approve` 404, not an
internal state peek). `EC6` reproduces the actual verification bug found and
fixed during a prior audit pass with a real mock side-effect. `EC7`/`EC8`
drive genuine crash-recovery/failure-at-step-1 scenarios through the real
`/propose → /approve` flow rather than manually seeding state. No complaints
here — this file is the strongest evidence-driving file in the suite.

### Gaps in what's tested (behavior, not just lines)

- No test for `/health` with `app.state.xero = None` (see coverage table,
  line 644) — only the "connected but raises" degraded path is covered.
- No `test_seed.py` — the `/seed` endpoint (gated by `ALLOW_SEED`) has no
  tests at all, success or failure.
- No test for `_load_proposal()`'s disk-fallback path (proposal read back
  from `state/proposals/<hash>.json`) — every test's `/propose` and
  `/approve` calls happen within the same test/process, so the in-memory
  `_proposals` dict always has the entry; the "read it back from disk after
  a restart" branch that idempotency's crash-safety design depends on is
  unexercised.
- No test for `require_xero_creds()` (config.py) raising on missing
  credentials.

## 3. API-contract conformance vs `docs/specs/03-API-SPEC.md`

Checked all 8 endpoints present in `main.py` (`/propose`, `/approve`,
`/status/{file_hash}`, `/pnl`, `/dashboard`, `/vat-check`, `/health`,
`/seed`) against spec §2.1-2.7 (spec has no §2.8 for `/seed` — see below).

### HIGH — real behavioral divergences

1. **`GET /health` never returns 503.** Spec §2.5 explicitly documents a
   `503 — Xero not connected` response. Implementation (`main.py:639-655`)
   always returns HTTP 200, encoding the degraded state in the body
   (`{"status": "degraded", ...}`). This is deliberate — the docstring says
   "Health check — always 200; degraded state expressed in body" and
   `tests/api/test_health.py::test_AH2` explicitly asserts `status_code ==
   200` for the degraded case. The spec was never updated to match. Any
   client built against the documented contract (poll `/health`, treat 503
   as down) will silently misread a degraded backend as healthy.

2. **`GET /dashboard` never returns 503 either**, for the same reason
   (`main.py:480-482`, `_degraded_dashboard()` returns 200). Spec §2.6:
   "503 when Xero disconnected." Tests `AD4`/`AD5` confirm 200 is
   intentional. Same client-trust risk as #1.

3. **`GET /dashboard` → `recent_payouts` shape doesn't match the spec at
   all.** Spec §2.6 documents each entry as
   `{ "payout_ref", "net", "status", "posted_at" }`. The actual
   `RecentPayout` model (`models.py:150-153`) and `_build_recent_payouts()`
   (`main.py:533-548`) produce
   `{ "file_hash", "completed_steps", "clearing_balance" }` — a completely
   different set of fields. A frontend built from the spec's example
   (`payout.net`, `payout.status`) would get `undefined` for every field.

4. **`POST /approve` 409 body is missing `existing_ids`.** Spec §2.2:
   `{"detail": "All steps already completed", "existing_ids": {...}}`.
   Implementation (`main.py:222-228`) puts the IDs in a custom
   `X-Existing-IDs` response **header** (JSON-encoded string), not in the
   JSON body — the body is just `{"detail": "All steps already
   completed"}`. `test_AA4` never checks the body, so this divergence is
   completely untested (see §2).

5. **`POST /approve` 503 body is missing `completed`.** Spec §2.2:
   `{"detail": "Xero write failed at step 2: <error>", "completed":
   [...]}`. Implementation (`main.py:309-312`) returns only `{"detail":
   "Xero write failed at step {n} ({kind}): {err}"}` — no `completed` array.
   A frontend that wants to show "steps 1 succeeded, step 2 failed" from
   this response alone cannot do so; it would have to separately call
   `/status/{hash}`.

### MEDIUM — undocumented additions / message-format drift

6. **`POST /propose` — file-size limit (400, "File too large (max 1 MB)")**
   is not documented anywhere in spec §2.1's error table (`main.py:149-150`).
   Not wrong, just not part of the contract as written.
7. **`POST /propose` — content-type rejection message** ("Only .csv files
   are accepted", `main.py:141-144`) doesn't follow the spec's `"CSV parse
   error: <message>"` convention used for the other 400 cases in §2.1.
   Still a 400, just a different message family.
8. **`POST /approve` 404 message has an extra sentence.** Spec: `"No
   proposal found for hash: <hash>"`. Implementation
   (`main.py:696-699`): `"No proposal found for hash: {hash}. Call POST
   /propose first."` — functionally fine, textually non-conforming if a
   client string-matches the exact message.
9. **`GET /dashboard` and `GET /vat-check` responses carry extra fields**
   not in the spec's example JSON: `source` (both), `note`/`fetched_at`
   (vat-check also has `fetched_at`/`source` beyond the documented 3
   fields). Additive and non-breaking, but the spec doc doesn't reflect
   what ships.
10. **`GET /status/{file_hash}` returns `credit_note_id`**, not in the
    spec's §2.3 example (spec predates the E1 refund-path expansion). Same
    "spec not updated" pattern as #9 — additive, not breaking.
11. **CORS origins list has grown** to 4 entries (`config.py:47-52`:
    5173, 3000, 5174, 8080) vs. the 2 documented in spec §6. Non-breaking,
    just stale documentation.

### LOW / informational

12. **`POST /seed` is entirely absent from spec 03.** No §2.8 exists for it.
    It's a dev-only endpoint gated by `ALLOW_SEED`, so this is arguably
    correct to exclude from the public contract doc — but the task's brief
    named it as one of the 8 endpoints to check, so noting it here: there is
    nothing in the spec to conform to, and (per §1/§2) it also has zero test
    coverage.

## 4. Prioritized fix list

**HIGH**
- Decide and reconcile `/health` and `/dashboard` degraded status codes:
  either update spec 03 to say "always 200, `source`/`status` field
  expresses degraded," or change the implementation to actually return 503.
  Right now code and spec actively disagree, and both are covered by
  passing tests — nothing will catch a future regression either way.
- Fix `/dashboard`'s `recent_payouts` — either update the spec's documented
  shape to match `RecentPayout` (`file_hash`/`completed_steps`/
  `clearing_balance`), or change the model to emit `payout_ref`/`net`/
  `status`/`posted_at` as documented, whichever is the real frontend
  contract. As-is, any consumer coded from spec 03 breaks.
- Put `existing_ids` (409) and `completed` (503) into the `/approve`
  response **bodies**, not just headers/omitted — and add body-shape
  assertions to `test_AA4`/`test_AA7` so this can't regress silently again.

**MEDIUM**
- Add a `test_seed.py` (success + `ALLOW_SEED`-gated + Xero-not-connected
  503 case) — currently the only endpoint of the 8 with no tests at all.
- Add the disconnected-`/health` test (`app.state.xero = None`) to close
  the asymmetry with `/dashboard`/`/vat-check`.
- Add a test for `_load_proposal()`'s disk-reload branch (propose in one
  `TestClient` context / clear `_proposals` / approve — proves the
  crash-recovery design actually survives a process restart, not just an
  in-memory cache hit).
- Reconcile spec 03 with the additive fields already shipping (`source`,
  `fetched_at`, `note`, `credit_note_id`) so the doc stops silently
  understating the real contract.
- Add a test for `require_xero_creds()`.

**LOW**
- Rename/reword `test_M5_negative_gross_rejected` (or add a real negative-
  amount test) so the name matches what it actually proves — it currently
  documents a rule the code doesn't enforce.
- Align the `/propose` 400 message families (content-type / file-too-large)
  with the spec's `"CSV parse error: ..."` convention, or document the two
  extra 400 conditions in spec 03 §2.1.
- Trim the `/approve` 404 message to match spec exactly, or update the spec
  to include the "Call POST /propose first" hint.
- Update spec §6 CORS origins list to the 4 origins actually configured.
