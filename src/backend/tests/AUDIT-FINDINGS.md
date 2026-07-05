# Backend hardening audit — findings

Scope: `parser.py`, `planner.py`, `models.py`, `idempotency.py`, `audit.py`,
`main.py`, `xero_client.py` (signatures only) + all existing tests under
`tests/unit/` and `tests/api/`. Baseline before this pass: 82 passed, 0 failed.

## Gaps found (addressed in this pass)

1. **`/dashboard` had zero API tests.** Added `tests/api/test_dashboard.py`
   (success shape, 60s cache hit, cache expiry, disconnected-degraded,
   read-failure-degraded, degraded-not-cached, recent_payouts from state).
2. **`/vat-check` had zero API tests.** Added `tests/api/test_vat_check.py`
   (consistent/inconsistent shape, 60s cache hit, cache expiry,
   disconnected-degraded, read-failure-degraded, degraded-not-cached).
3. **Refund CSV (`marketplaceco-payout-2107.csv`) had no API-level coverage.**
   Only the unit-level planner test (`PL9`) exercised the 4-step
   `create-credit-note` path; nothing drove it through `/propose` or
   `/approve`. Added `EC1`/`EC2` in `tests/api/test_edge_cases.py`.
4. **Duplicate-upload ("already-posted") was only exercised via manually
   injected `idem.record_step` calls (`AP4`)**, never through a real
   `/propose → /approve → /propose` round trip using IDs the mock actually
   produced. Added `EC4`.
5. **Invariant-violation (422) response was never checked for "no plan
   cached."** `AP6`/`test_M2`/`test_P4` confirm the 422 itself, but nothing
   proved a subsequent `/approve` for that content's hash 404s (i.e. no
   proposal was persisted). Added `EC3`.
6. **No test for a Xero write failure at step 1** (only step 2 was covered
   by `AA7`/`AA8`) — verifying zero steps get recorded when the very first
   write fails. Added `EC7`.
7. **No test explicitly re-verifying `create_payment` receives the
   invoice ID recovered from a prior crash** (as opposed to one produced in
   the same run — `AA10` only covers the same-run case). Added `EC8`.

## Real bugs found and fixed

### BUG-1 (fixed): verification-read failure silently reported as `verified: true`

`main.py` `approve()`, post-write verification block:

```python
try:
    clearing_balance = await client.get_clearing_balance()
except Exception as exc:
    logger.warning("Clearing balance check failed: %s", exc)
    clearing_balance = Decimal("0")

verified = clearing_balance == Decimal("0.00")
```

If the Xero read for the clearing-balance verification itself failed (network
blip, MCP error, etc.), the exception handler defaulted `clearing_balance` to
`Decimal("0")`, which then made `verified` evaluate to `True` — a classic
silent-failure/bad-fallback: an unverified state was reported as *verified*.
Given the whole point of the golden path is "verify with a zero-balance
check" (CLAUDE.md), this directly undermines the demo's core guarantee.

**Fix** (`main.py`, verification-read block): track whether the read
succeeded and require it in the `verified` computation:

```python
try:
    clearing_balance = await client.get_clearing_balance()
    balance_read_succeeded = True
except Exception as exc:
    logger.warning("Clearing balance check failed: %s", exc)
    clearing_balance = Decimal("0")
    balance_read_succeeded = False

verified = balance_read_succeeded and clearing_balance == Decimal("0.00")
```

`clearing_balance` in the response body is left as `Decimal("0")` on failure
(best-effort value, response schema is non-optional `Decimal`), but
`verified` now correctly reports `False`. Reproduced with a failing test
first (RED), confirmed the fix turns it GREEN:
`tests/api/test_edge_cases.py::test_EC6_balance_check_failure_not_reported_verified`.

### BUG-2 (fixed): `_dashboard_cache` / `_vat_cache` leak across tests

`tests/api/conftest.py`'s `api_client` fixture cleared `main_mod._proposals`
between tests but never reset the module-level `_dashboard_cache` /
`_vat_cache` globals in `backend.main`. Since the `backend.main` module is
only imported once per test session, any dashboard/vat-check test that
populated the cache would leak state into every later test in the same run —
undetected until this pass because no tests exercised those two endpoints at
all. Fixed by resetting both to `None` via `monkeypatch.setattr` in the same
fixture that already resets `_proposals`. This is a test-infrastructure fix,
not a production-code change — necessary before `test_dashboard.py` /
`test_vat_check.py` could be written without becoming order-dependent and
flaky.

## Findings noted but left OPEN (not fixed — out of scope / need a product decision)

- **No non-negative constraint on money fields.** `CanonicalPayout` (and
  `PlanStep`/`FeeLineItem`) only enforce
  `gross - commission - fees - refunds == net`; a fully negative payout
  (e.g. `gross=-100, net=-100`, all else 0) passes validation because the
  invariant still holds. Whether marketplace payouts should categorically
  reject negative gross/commission/fees is a business-rule decision not
  specified in CLAUDE.md or the specs — left OPEN rather than guessed at.
- **Unused imports in `planner.py`**: `CLEARING_ACCOUNT_CODE`,
  `FEES_ACCOUNT_CODE`, `CONTACT_NAME` are imported but never referenced
  (only `CLEARING_ACCOUNT_NAME` is used). Cosmetic/lint-only, no behavioral
  impact — left as-is per "minimal scope, don't touch code outside the task."
- **`except (XeroMCPError, ValueError, Exception)` in `main.py`'s `approve()`
  step loop** is redundant (`Exception` already covers the other two
  listed types) but not incorrect — it doesn't change behavior. Left as-is
  to avoid an unrelated refactor.
- **Parser silently skips malformed booking rows** (`except
  (InvalidOperation, IndexError): continue` in `parser.py`). This is
  documented as intentional in the existing comment, and the accounting
  entries are driven entirely from the summary row (not individual
  bookings), so a fully-empty `bookings` list cannot cause an incorrect
  posting — informational only, not fixed.

## Test additions summary

| File | Tests added | Covers |
|---|---|---|
| `tests/api/test_dashboard.py` | 7 (AD1–AD7) | `/dashboard` success, cache hit/expiry, disconnected & read-failure degraded paths, degraded-not-cached, recent_payouts |
| `tests/api/test_vat_check.py` | 7 (AV1–AV7) | `/vat-check` consistent/inconsistent, cache hit/expiry, disconnected & read-failure degraded paths, degraded-not-cached |
| `tests/api/test_edge_cases.py` | 8 (EC1–EC8) | refund CSV 4-step plan + full approve, invariant-violation leaves no cached plan, full duplicate-via-approve flow, malformed-header CSV, verification-read-failure bug (BUG-1), write-failure at step 1, crash-recovery invoice ID reuse |
| `tests/api/conftest.py` | fixture fix | resets `_dashboard_cache`/`_vat_cache` between tests (BUG-2) |
| `main.py` | bug fix | `verified` no longer true on a failed balance read (BUG-1) |

## Final result

`./.venv/bin/python -m pytest -q` → **104 passed, 0 failed** (82 baseline + 22 new).

## Coverage

`pytest-cov` is **not installed** in `.venv` (confirmed via
`pip list | grep -i cov` — no output). Per the hard constraint against adding
new dependencies, it was not installed. No coverage percentages reported.
