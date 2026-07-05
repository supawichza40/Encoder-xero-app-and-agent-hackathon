# FROZEN API CONTRACT — persona build (2026-07-05)
Shared pipeline artifact. NOT yours to clean or delete. Both tracks build against this exactly.
All monetary values: str(Decimal), never float. UK tax year (6 Apr–5 Apr) for YTD fields.

## 1. GET /dashboard — ADDITIVE optional fields (existing fields unchanged)

```jsonc
{
  // ...all existing fields stay exactly as-is (trial_balance, recent_payouts, aged_receivables, balance_sheet, source)...
  "persona_metrics": {
    "fees_this_month": "493.00",           // commission+fees posted this calendar month (SAM-2)
    "gross_turnover_vat_safe": "1340.00",  // rolling 12-month gross turnover (VAT-threshold-relevant) (SAM-3)
    "ytd_income": "1340.00",               // gross income, UK tax year to date (ALX-1)
    "ytd_deductible_fees": "493.00",       // commission+fees, UK tax year to date (ALX-1)
    "new_vs_repeat": {                     // from booking client_type + commission per row (SAM-5)
      "new":    { "count": 3, "commission": "334.43" },
      "repeat": { "count": 2, "commission": "111.47" }
    }
  },
  "run_history": [                         // from state/posted.json + audit.json (PRI-5)
    {
      "hash": "<sha256-prefix-12>",
      "status": "posted",                  // "posted" | "failed" | "skipped-idempotent" | "partial"
      "payout_ref": "PO-0407",
      "timestamp": "2026-07-05T08:00:00Z",
      "net": "847.00"
    }
  ]
}
```
Nullability: `persona_metrics` and `run_history` may be null/absent when no data — frontend must handle both.

## 2. GET /audit/export?format=csv|json  (PRI-1)
- `format=csv` (default): `text/csv`, `Content-Disposition: attachment; filename="payoutbridge-audit.csv"`.
  Columns: `timestamp,action,payout_ref,xero_id,status,summary`
- `format=json`: full audit entries array (same data as audit.json).
- No audit data → 200 with empty CSV (header row only) / empty JSON array. Never 500.

## 3. GET /evidence-pack/{hash}  (PRI-2)
```jsonc
{
  "payout_ref": "PO-0407",
  "csv_sha256": "<full sha256>",
  "xero_ids": {
    "invoice_id": "INV-...",
    "bank_txn_id": "BT-...",
    "payment_id": "PMT-...",
    "credit_note_id": null                 // non-null only for refund statements
  },
  "amounts": { "gross": "1340.00", "commission": "445.90", "fees": "47.10", "refunds": "0.00", "net": "847.00" },
  "clearing_balance": "0.00",
  "verified": true,
  "generated_at": "2026-07-05T08:00:00Z"
}
```
Unknown hash → 404 `{"detail": "no posted statement with that hash"}`.

## 4. Frontend mock parity (MANDATORY)
- `src/frontend/src/lib/payout-types.ts`: add `PersonaMetrics`, `RunHistoryEntry`, `EvidencePack` interfaces mirroring above.
- `src/frontend/src/lib/payout-mock.ts`: mock returns for all three surfaces with the demo figures above.
- `src/frontend/src/lib/usePayoutBridge.ts`: fetch wiring; degrade gracefully (null persona_metrics ⇒ hide, never crash).

## 5. Hard rules (from PREFLIGHT.md — read it first)
- Decimal never float. Planner invariant + 3-write golden path UNTOUCHED.
- No live Xero this run (mock Xero only). Demo data synthetic, brand "MarketplaceCo" only.
- src/frontend: NO file moves/renames. New files allowed.
- Backend env: use main checkout venv python:
  `/Users/supavichaussawaauschariyakul/Library/Mobile Documents/com~apple~CloudDocs/Documents/University/Projects/Hackathon/Encoder-xero-app-and-agent-hackathon/src/backend/.venv/bin/python -m pytest`
- Worktree root (ALL work happens here, never the main checkout):
  `/Users/supavichaussawaauschariyakul/Library/Mobile Documents/com~apple~CloudDocs/Documents/University/Projects/Hackathon/Encoder-xero-app-and-agent-hackathon/.claude/worktrees/persona-usecases`
