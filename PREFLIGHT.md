# PREFLIGHT — PayoutBridge production-ready dispatch (2026-07-05)

Every worker on this build reads this file FIRST. These invariants are locked. Do not
violate them, do not "improve" past them, do not rebuild what already works.

## 1. Scope boundary (what NOT to touch)
- Backend (`src/backend/`) is DONE and green (104 pytest passing). Do **not** rebuild it.
  Only additive test confirmation (T4) or a bugfix a red-team pass proves is needed.
- Locked demo fixtures `src/data/marketplaceco-payout-0407.csv` and `…-2107.csv` are
  FROZEN. Never edit them. New sample files are separate, new filenames.
- No new **runtime** dependencies (frontend or backend) without lead approval. Dev-only
  test deps (vitest, @testing-library/*, jsdom, happy-dom) ARE allowed.
- **HARD RULE — do NOT move, rename, or relocate ANY existing file in `src/frontend/`.**
  It is Lovable-generated; the owner re-pastes whole files back into Lovable, which needs
  the original paths/filenames intact. Editing a file's CONTENTS in place is allowed.
  Adding NEW sibling files (tests, vitest config) is allowed **only if** it forces no
  existing file to move. Keep every change paste-back-friendly. Record each Lovable source
  file you edit so the owner can re-apply it. If a task truly cannot be done without moving
  a file, SKIP that part, keep going, and flag it in your report — do not stop the build.

## 2. Accounting invariant (never break)
- `gross − commission − fees − refunds === net` (1340.00 − 445.90 − 47.10 − 0.00 === 847.00).
- All amounts are **Decimal / decimal strings**, never float. Render with tabular-nums.
- Golden path = 3 writes in strict order: create-invoice → create-bank-transaction →
  create-payment, then a zero-balance verification read (clearing == £0.00).
- Refund path = 4 writes (adds a credit-note). Planner REFUSES if the invariant fails.

## 3. Xero / data safety
- **Xero Demo Company only. Never the live/paid tenant.** As of 2026-07-05 the owner
  AUTHORIZED agents to post the REAL golden-path writes to the **Demo Company** to prove
  the live end-to-end flow. Before any write, confirm `/health` org reads "Demo Company";
  if it is NOT a Demo Company, ABORT — never operate on the paid tenant.
- Golden path ≤ 10 Xero calls; worst case (refund + all features) ≤ 15/min. Serial only —
  no parallel live-write storms.
- **Live-Xero connection facts (learned 2026-07-05):** the backend uses a client-credentials
  **Custom Connection**. `XERO_SCOPES` MUST be empty (omit `scope`) — the connection's own
  granular scopes are granted automatically. The auth-code umbrella scopes
  (`accounting.transactions`, `offline_access`) are INVALID for M2M → `invalid_scope`.
  The `@xeroapi/xero-mcp-server@latest` returns **multiple TEXT content blocks**
  (`block[0]`=header, `block[1..N]`=`Key: Value` records), not JSON — parse accordingly.
- Demo data is SYNTHETIC. Only marketplace brand shown anywhere is **"MarketplaceCo"**.
  (Current landing shows Amazon/Etsy/Shopify/eBay/Stripe — these MUST be removed/genericised.)

## 4. Frontend contract
- API base: `VITE_API_URL` (default `http://localhost:8000`). Mock default ON.
  Real mode via `?mock=0`, `VITE_PAYOUTBRIDGE_MOCK=0`, or localStorage `payoutbridge.mock`.
- `GET /status/{file_hash}` is a PATH param (already correct — regression-guard it).
- Real/Demo toggle must PERSIST and AUTO-FALL-BACK to Demo when `/health` is unreachable.
- 8 endpoints: `/propose /approve /status/{hash} /pnl /dashboard /vat-check /health /seed`.

## 5. Design contract (see DESIGN.md once written)
- Every interactive element gives immediate feedback — **no dead clicks**. Click → visible
  progress/state change within 100ms (press state, spinner, optimistic update, toast).
- Motion is purposeful and restrained: 150–250ms, standard easing, honors
  `prefers-reduced-motion`. Professional, not a fireworks show.
- Loading / empty / error / skeleton states on every screen. Projector-readable at 1280×720.
  WCAG-AA basics: focus rings, keyboard nav, contrast, labels.

## 6. Deploy contract
- Guaranteed judge URL = static Demo build on **GitHub Pages** (gh is authed). Toggle
  defaults Demo so the hosted link always works even if live Xero/backend is down.
- Backend deploy = Render Docker (Python + Node for the Xero-MCP npx subprocess),
  config + verified build, one-command-ready. Best-effort live.

## 7. Definition of done (per subtask)
- Backend: `cd src/backend && pytest` stays fully green.
- Frontend: `cd src/frontend && bun run test` green; touched code ~80% covered.
- Behavior-changing work is RUNTIME-verified (observed), not just green tests.
- No high-severity code/security/design finding left open.

## 8. Shared-state note
- `docs/`, `DESIGN.md`, `PREFLIGHT.md`, `src/data/SAMPLES.md`, and the research fact sheets
  are SHARED pipeline state — not any worker's temp files. Never delete them to "clean up".
