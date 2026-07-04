> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 2.

## 2.1 System diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INGESTION                                                              │
│  data/marketplaceco-payout-0407.csv (locked golden file — SYNTHETIC demo)   │
│        │                                                                │
│        ▼                                                                │
│  src/parser.ts — hardcoded column map → canonical model                 │
│        {gross, commission, fees, refunds, net, bookings[]}              │
└────────┬────────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AGENT CORE (TypeScript/Node)                                           │
│  src/idempotency.ts — sha256(file) → posted.json step-map check         │
│  src/planner.ts — builds the 3-write journal plan + amounts             │
│  src/audit.ts — appends every action + Xero ID to audit.json            │
└────────┬────────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  HUMAN GATE (Lovable UI — Approval Drawer)                              │
│  Plain-English breakdown │ "What Xero will do" 3-item checklist         │
│  [Approve & Post to Xero] → live progress 1/3 → 2/3 → 3/3               │
└────────┬────────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  XERO (via MCP server, Custom Connection, UK Demo Company)              │
│  READ  list-bank-transactions  → locate net deposit £847                │
│  WRITE create-invoice          → gross revenue £1,340 → Clearing        │
│  WRITE create-bank-transaction → fees £493 out of Clearing              │
│  WRITE create-payment          → £847 Clearing ↔ bank deposit           │
│  READ  clearing balance        → VERIFY £0.00 ✓  (consensus #1)         │
│  READ  list-profit-and-loss    → AFTER snapshot                         │
└────────┬────────────────────────────────────────────────────────────────┘
         ▼
   UI PAYOFF: Clearing Reconciliation panel £0.00 ✓ + P&L before/after
```

## 2.2 Stack decisions (locked)

| Layer | Choice | Rationale |
|---|---|---|
| Agent core | **TypeScript/Node ≥18**, built by Claude Fable | MCP client native; team preference |
| Xero access | `@xeroapi/xero-mcp-server` local (`npx -y @xeroapi/xero-mcp-server@latest`), **Custom Connection** auth (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`) | Free on Demo Company; verified tool surface in `docs/TOOLING.md` §1.8 |
| REST fallback | Direct Accounting API only if an MCP gap blocks | No gap expected on the golden path |
| UI shell | **Lovable** (100 credits from the 14:45 workshop) — Vite + React + Tailwind | Partner prize; scaffold from the [Lovable 2026 template](https://github.com/XeroAPI/xero-prompt-library/tree/main/lovable) |
| Automation | **Make** free tier (1,000 ops, 2 scenarios) — ONE scenario | Partner prize; Section 8.2 |
| State | Local JSON files: `state/posted.json`, `state/audit.json` | No DB for a demo; resettable |
| Secrets | `.env` (never committed): `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` | Client secret shown once at app creation — copy immediately |

## 2.3 Xero object model (exact amounts, locked forever)

**The invariant:** `1340.00 − 445.90 − 47.10 = 847.00` — sums exactly, no VAT on the golden file (VAT is the #1 rounding landmine both critiques flagged; a £0.01 mismatch on stage = demo death). VAT handling is narrated as roadmap.

**Seed script creates (idempotent — safe to re-run):**
1. Account **"Platform Clearing"** — type: current asset / bank-adjacent (code e.g. `810`)
2. Account **"Platform Commission & Fees"** — type: expense (code e.g. `418`) if not already present
3. Contact **"MarketplaceCo (Marketplace)"** _(synthetic demo fixture)_
4. Bank transaction: **RECEIVE £847.00** into the Demo Company bank account, reference `TW-PAYOUT-0407`, dated in-period — this is the "wrong books" starting state (net booked as revenue)
5. Captures the BEFORE P&L snapshot to `state/pnl-before.json`

**Golden-path writes (exact order, all via MCP):**

| # | MCP tool | What it does | Amount |
|---|---|---|---|
| 1 | `create-invoice` | ACCREC invoice, contact MarketplaceCo, line "Gross marketplace sales — period 16–30 Jun", coded to Sales, **paid into Platform Clearing** | **£1,340.00** |
| 2 | `create-bank-transaction` | SPEND from Platform Clearing → "Platform Commission & Fees": two lines — new-client commission £445.90 + prepayment fees £47.10 | **£493.00** |
| 3 | `create-payment` | Applies/clears **£847.00** from Platform Clearing against the seeded net deposit | **£847.00** |
| 4 | **VERIFICATION READ** | Query Platform Clearing balance → render live **£0.00 ✓** | — |
| 5 | `list-profit-and-loss` | AFTER snapshot → split-screen diff vs BEFORE | — |

> Implementation note for Fable: if `create-payment` semantics against a seeded bank line prove awkward in the Demo Company, the accepted alternative is a `create-bank-transaction` transfer or a `create-manual-journal` moving £847 Clearing→Bank — keep THREE DISTINCT WRITE TYPES on the demo path whichever route is chosen. Decide during Spike 2, lock by 18:30, never revisit.

## 2.4 The golden CSV (create by hand, lock, never edit after 18:30 Sat)

> **This is SYNTHETIC demo data** — a representative marketplace-format statement with hand-authored figures. It is NOT a real settlement statement (integrity flag 0.B/0.C).

`data/marketplaceco-payout-0407.csv`:

```csv
PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
TW-PAYOUT-0407,16-30 Jun 2026,1340.00,445.90,47.10,0.00,847.00
BookingDate,Client,ClientType,Service,GrossAmount,CommissionRate,Commission
2026-06-17,Client A,New,Cut & Colour,180.00,35%,63.00
2026-06-18,Client B,Repeat,Blow Dry,45.00,0%,0.00
2026-06-19,Client C,New,Full Head Highlights,220.00,35%,77.00
2026-06-20,Client D,Repeat,Cut,55.00,0%,0.00
2026-06-21,Client E,New,Balayage,240.00,35%,84.00
2026-06-24,Client F,New,Cut & Colour,175.00,35%,61.25
2026-06-25,Client G,Repeat,Treatment,60.00,0%,0.00
2026-06-26,Client H,New,Colour Correction,290.00,35%,101.50
2026-06-28,Client I,Repeat,Cut & Finish,75.00,0%,0.00
```

- Booking rows exist to feed the **transaction-trace panel** (consensus upgrade #3) — each row maps to its share of the plan.
- Commission mechanics mirror documented reality (~35% new client, 0% repeat within 365 days, prepayment fee ~2.5%+VAT) so accountant judges recognise it as genuine.
- Header-row totals are authoritative for the plan; booking rows are display detail. Commission detail sums approximate the header — the parser reads ONLY the header row for amounts (deterministic).

## 2.5 Idempotency + audit design (the 20% bucket — demoed, not claimed)

- **Key:** `sha256(fileBytes)`. Before any write, check `state/posted.json`.
- **Step-map, not file-flag:** `posted.json` stores per-step completion: `{hash: {invoiceId, bankTxnId, paymentId, completedSteps: [...]}}`. A crash after write 1 re-runs writes 2–3 only. This is the Q&A answer to "network drop mid-sequence?"
- **Duplicate upload (DEMOED LIVE):** second upload of the same file → UI banner "Already posted at 14:52 — skipped (idempotent). Xero IDs: INV-0042, BT-0117, PMT-0089." _(Example IDs are placeholders; real IDs come from the live run.)_
- **Audit trail:** `state/audit.json` appends `{timestamp, fileHash, action, request, xeroId, status}` for every call. Rendered in the Transaction Trace panel: CSV row → planned action → Xero ID → green tick.

## 2.6 Agent endpoints (thin HTTP server for Lovable + Make)

| Endpoint | Method | Behaviour |
|---|---|---|
| `/propose` | POST (file) | Parse → idempotency check → return plan JSON + breakdown + status (`new` / `already-posted`) |
| `/approve` | POST (hash) | Execute the 3 writes + verification read; stream/step status; append audit |
| `/status` | GET (hash) | Current step-map + audit entries for the trace panel |
| `/pnl` | GET | Returns `{before, after}` P&L snapshots for the split-screen |

## 2.7 Explicitly OUT of scope (scope shield — cite when tempted)

LLM schema inference (any, anywhere) · refunds / `create-credit-note` · PDF parsing/OCR · tracking categories · multi-platform UI or recipe management · live Treatwell connection (no API exists) · VAT splitting · email sending · JAX-territory features (NL Q&A, auto-recon, categorisation) · delete/void (MCP cannot anyway) · multi-client/bookkeeper views · forecasting.

---

# SECTION 3 — OAUTH SCOPES, RATE LIMITS, AND SETUP FACTS

