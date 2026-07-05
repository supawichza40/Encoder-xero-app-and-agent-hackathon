# Sample upload CSVs

These are **new, unlocked** sample files for manually exercising the upload flow in the
frontend. They are separate from the two locked demo fixtures
(`marketplaceco-payout-0407.csv`, `marketplaceco-payout-2107.csv`), which must never be
edited. All amounts are MarketplaceCo synthetic data — no real brand/customer data.

| File | Scenario | Invariant check | Expected UI screen |
|---|---|---|---|
| `sample-1-standard-3writes.csv` | Standard payout, no refunds. `1000.00 − 266.00 − 25.00 − 0.00 = 709.00` ✓ | Holds | Upload → **Propose** screen shows a 3-step plan (create-invoice → create-bank-transaction → create-payment). Approving walks the golden path to a verified £0.00 clearing balance. |
| `sample-2-refunds-4writes.csv` | Payout with refunds. `900.00 − 280.00 − 35.00 − 45.00 = 540.00` ✓ | Holds | Upload → **Propose** screen shows a 4-step plan (create-invoice → **create-credit-note** → create-bank-transaction → create-payment). Approving walks the refund path to a verified £0.00 clearing balance. |
| `sample-3-wont-balance-REFUSED.csv` | Deliberately broken payout. `1200.00 − 400.00 − 50.00 − 0.00 = 750.00`, but `NetPayout` column says `800.00` — mismatch. | **Fails** | Upload → **REFUSED** screen (UC-6). The backend's `CanonicalPayout` model validator raises a `ValueError` invariant-violation during parse, before any plan or Xero write is attempted; the API returns an error and the UI must show the refusal state, not a plan. |

## Column format (from `backend/parser.py`)

```
Row 0 (header):  PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
Row 1 (summary): <ref>,<period>,<gross>,<commission>,<fees>,<refunds>,<net>
Row 2 (booking header): BookingDate,Client,ClientType,Service,GrossAmount,CommissionRate,Commission
Rows 3+: individual booking rows
```

## Verification (run against the real parser + planner)

Verified with `backend.parser.parse_payout_csv` and `backend.planner.create_plan` from the
project's own venv:

```
--- sample-1-standard-3writes.csv ---
PARSED OK: gross=1000.00 commission=266.00 fees=25.00 refunds=0.00 net=709.00
invariant: 1000.00 - 266.00 - 25.00 - 0.00 = 709.00 (net=709.00) MATCH=True
plan: 3 steps -> ['create-invoice', 'create-bank-transaction', 'create-payment']

--- sample-2-refunds-4writes.csv ---
PARSED OK: gross=900.00 commission=280.00 fees=35.00 refunds=45.00 net=540.00
invariant: 900.00 - 280.00 - 35.00 - 45.00 = 540.00 (net=540.00) MATCH=True
plan: 4 steps -> ['create-invoice', 'create-credit-note', 'create-bank-transaction', 'create-payment']

--- sample-3-wont-balance-REFUSED.csv ---
REFUSED (ValueError): 1 validation error for CanonicalPayout
Value error, Invariant violation: 1200.00 - 400.00 - 50.00 - 0.00 = 750.00, expected 800.00
```
