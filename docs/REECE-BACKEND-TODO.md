# Backend Expansion TODO — Reece

> **Owner:** Reece (@XreeceX) · **Created:** 2026-07-05
> **Source of truth:** [`docs/specs/11-EXPANSION-SPEC.md`](specs/11-EXPANSION-SPEC.md) (feature detail), [`docs/specs/03-API-SPEC.md`](specs/03-API-SPEC.md) (contracts), [`docs/specs/12-ENDPOINTS-AND-SCOPES.md`](specs/12-ENDPOINTS-AND-SCOPES.md) (Xero call inventory), [`docs/specs/07-BACKEND-TEST-PLAN.md`](specs/07-BACKEND-TEST-PLAN.md) (cases EX1–EX8).
> **Base code:** `src/backend/` — golden path already works (main.py, parser.py, planner.py, xero_client.py, idempotency.py, seed.py). These tasks EXTEND it; don't break the 3-write golden path.
> The frontend (new Lovable pages) already expects every endpoint/field below — backend is the blocker.

## Ground rules (unchanged)

- All money = `Decimal`, never float. Amounts serialise as **strings** in JSON.
- Invariant `gross − commission − fees − refunds === net` — planner refuses otherwise.
- Golden CSV `src/data/marketplaceco-payout-0407.csv` is **locked**. New fixture is a separate file.
- Xero writes only after human approve. Rate budget ≤15 calls worst case (see `11` §rate-limit).
- `update-bank-transaction` is broken in MCP v0.0.17 — `create-*` only.

## Task 1 — E1: Refund flow (`create-credit-note`) — BIGGEST, DO FIRST

- [ ] New fixture `src/data/marketplaceco-payout-2107.csv`: header row `MC-PAYOUT-2107, 1-15 Jul 2026, gross 1180.00, commission 383.50, fees 41.50, refunds 60.00, net 695.00` + a few booking rows (same column map as golden CSV). Invariant: `1180.00 − 383.50 − 41.50 − 60.00 = 695.00` ✓
- [ ] `models.py`: `StepKind` gains `"create-credit-note"`; `ExistingIds`/status models gain optional `credit_note_id`.
- [ ] `planner.py`: when `payout.refunds > 0` insert credit-note step **after** create-invoice → 4-step plan (invoice → credit-note → bank-txn → payment). Zero-refund files still produce exactly 3 steps.
- [ ] `idempotency.py`: step-map is built from the plan's step list (dynamic 3 or 4 keys), not a hardcoded trio. Crash after step 2 of 4 must resume at steps 3–4 only.
- [ ] `xero_client.py`: `create_credit_note(contact, amount, account)` via MCP `create-credit-note`, tracking param included (Task 3).
- [ ] `seed.py`: add second net deposit RECEIVE £695.00 ref `MC-PAYOUT-2107` (idempotent — check-before-create like the existing one).
- [ ] `main.py /approve`: results array length = plan length; audit rows for the new step.
- Tests: **EX1–EX4** in `07`.

## Task 2 — E2: Attach source CSV to invoice (raw REST)

- [ ] `xero_client.py`: `attach_file(invoice_id, filename, content_bytes)` → `PUT https://api.xero.com/api.xro/2.0/Invoices/{id}/Attachments/{filename}`, `Content-Type: text/csv`. Token: client-credentials mint from existing env creds (`POST https://identity.xero.com/connect/token`, basic-auth `client_id:client_secret`). Use `httpx`. Scope `accounting.attachments` must be in `XERO_SCOPES` (.env).
- [ ] `main.py /approve`: call after step 1 success. **Non-fatal**: on failure, audit `attach-source: failed`, continue. Response gains optional `"attachment": {"invoice_id", "filename", "status"}` (see `03`).
- [ ] Keep original upload bytes retrievable by hash (store alongside `posted.json`, e.g. `state/uploads/<hash>.csv`) so /approve can attach them.
- Tests: **EX5**.

## Task 3 — E3: Channel tracking category

- [ ] `config.py`: `TRACKING_CATEGORY = "Channel"`, `TRACKING_OPTION = "MarketplaceCo"`.
- [ ] `seed.py`: `list-tracking-categories` → create "Channel" + option "MarketplaceCo" only if absent (org cap = 2 active categories — never create blindly).
- [ ] `xero_client.py`: all line items on invoice / bank-txn / credit-note carry `tracking: [{name: "Channel", option: "MarketplaceCo"}]`.
- Tests: **EX8**.

## Task 4 — E4: `GET /dashboard`

- [ ] New endpoint in `main.py` per `03` §2.6. Aggregates `list-trial-balance`, `list-aged-receivables-by-contact`, `list-report-balance-sheet` + `recent_payouts` from `state/posted.json` + `state/audit.json`.
- [ ] In-process cache 60 s (module-level `(data, fetched_at)` tuple is fine). Never call Xero more than once per minute from here.
- [ ] 503 with `{"detail": ...}` when Xero disconnected (frontend falls back to illustrative data).
- Tests: **EX6**.

## Task 5 — E5: `GET /vat-check`

- [ ] New endpoint per `03` §2.7: `list-tax-rates` → `{"org_rates": [{"name", "rate"}], "golden_path_tax_type": "NONE", "consistent": true}`. `consistent` = golden-path lines post VAT-free and a zero/none rate exists on the org.
- [ ] Cache with same 60 s pattern as /dashboard.
- Tests: **EX7**.

## Task 6 — E6: History notes (raw REST)

- [ ] `xero_client.py`: `add_history_note(endpoint, guid, note)` → `PUT /api.xro/2.0/{Endpoint}/{guid}/History` body `{"HistoryRecords": [{"Details": "<note>"}]}`. Same token path as Task 2.
- [ ] `main.py /approve`: after each successful write, note `Posted by PayoutBridge from <payout_ref> sha256:<first-8>`. Non-fatal; audit rows `history-note`.
- Endpoint names: `Invoices`, `CreditNotes`, `BankTransactions`, `Payments`.

## Task 7 — Wire-up + regression

- [ ] `.env` / `config.py`: add `accounting.attachments` (+ granular report scopes if needed — see `12` §3 note) to `XERO_SCOPES`.
- [ ] Full run: seed → propose golden CSV → approve → verify £0.00 → propose refund CSV → approve (4 steps) → verify.
- [ ] `pytest` green: existing suite + EX1–EX8.
- [ ] Confirm rate budget: worst-case flow ≤15 calls.

## Done =

1. Both CSVs post end-to-end on Demo Company, clearing £0.00 both times.
2. Invoice in Xero shows the attached source CSV + history note (screenshot for pitch).
3. `GET /dashboard` + `GET /vat-check` return live data; frontend dashboard flips to "Live from Xero".
4. All tests green, golden path untouched.

Order matters: Task 1 → 3 → 2 → 6 → 4 → 5 → 7. Tasks 4–5 are independent — parallelise if time-boxed.
