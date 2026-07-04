> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 3.

## 3.1 App setup (human does at 15:00)

1. developer.xero.com → New app → **Custom Connection** type
2. Copy Client ID + **Secret (shown once)** into `.env`
3. Authorise against **Demo Company (UK)** — region must be UK (payroll irrelevant here but keep the convention)
4. Verify at [API Explorer](https://api-explorer.xero.com/) before writing code

## 3.2 Scopes to request (log for the submission form)

- `accounting.transactions` (bundled; or granular: `accounting.invoices`, `accounting.banktransactions`, `accounting.payments`)
- `accounting.contacts`
- `accounting.settings` (account creation in seed)
- `accounting.reports.profitandloss.read` (or `accounting.reports.read`)
- Note for submission: aware of the **granular scope migration** (Custom Connections granular from 29 Apr 2026; broad scopes sunset Sept 2027) per the [prompt library skills](https://github.com/XeroAPI/xero-prompt-library)

## 3.3 Rate limits (never breach on stage)

- **60 calls/min · 5 concurrent · 5,000/day** per tenant; 429 + `Retry-After` on breach
- Golden path total ≤ ~10 calls — hugely under budget; NEVER live-loop or poll during the demo
- Honor `Retry-After` in the MCP wrapper anyway (architecture credibility)

## 3.4 Demo Company gotchas

- Auto-resets ~every 28 days and on manual reset → **seed script must be one command, idempotent, rehearsed**
- Custom Connection is free **only** on the Demo Company; production = paid/monthly or standard OAuth via App Store — the pitch must not imply free production M2M (Q&A defense in Section 6.3)
- MCP `update-invoice` touches DRAFT only; no delete/void anywhere in MCP — irrelevant to golden path but do not improvise flows that need them

## 3.5 Live Xero UK plan context (from `xero.md`)

For real-account context beyond the free Demo Company: the team's live UK entity (S A Therapeutic Ltd, ref `DC8062614UK`) is on the **Grow plan — £37/mo, discounted to £7.40/mo (80% off for 6 months, ex VAT), £8.88/mo incl. VAT**. This is background only; **all hackathon development runs against the free Demo Company via Custom Connection** — do not build against or risk the paid live tenant.

---

# SECTION 4 — REPO STRUCTURE FOR FABLE

```
payoutbridge/
├── .env                      # XERO_CLIENT_ID, XERO_CLIENT_SECRET (never commit)
├── package.json
├── data/
│   └── marketplaceco-payout-0407.csv     # LOCKED golden file (Section 2.4) — SYNTHETIC demo data
├── seed/
│   └── seed.ts               # idempotent Demo Company setup + BEFORE P&L capture
├── src/
│   ├── parser.ts             # hardcoded column map → CanonicalPayout
│   ├── idempotency.ts        # sha256 + step-map (posted.json)
│   ├── planner.ts            # CanonicalPayout → JournalPlan (3 writes, amounts)
│   ├── xero.ts               # MCP client wrapper: reads, 3 writes, VERIFICATION read
│   ├── audit.ts              # audit.json appender + trace-panel shape
│   └── server.ts             # /propose /approve /status /pnl
├── state/
│   ├── posted.json           # idempotency step-map
│   ├── audit.json            # audit trail
│   ├── pnl-before.json
│   └── pnl-after.json
├── scripts/
│   └── reset-rehearsal.ts    # one command: reset assumptions → seed → run → verify
└── README.md                 # endpoints+scopes list (submission), run instructions
```

**Key types (planner contract):**

```ts
type CanonicalPayout = {
  payoutRef: string;        // "TW-PAYOUT-0407" — part of idempotency identity
  period: string;
  gross: number;            // 1340.00
  commission: number;       // 445.90
  fees: number;             // 47.10
  refunds: number;          // 0.00
  net: number;              // 847.00  (invariant: gross - commission - fees - refunds === net)
  bookings: BookingRow[];   // trace-panel display only
};

type JournalPlan = {
  steps: [
    { kind: "create-invoice";           amount: 1340.00; account: "Platform Clearing" },
    { kind: "create-bank-transaction";  amount: 493.00;  lines: [{desc: "New-client commission", amount: 445.90}, {desc: "Prepayment fees", amount: 47.10}] },
    { kind: "create-payment";           amount: 847.00;  clears: "TW-PAYOUT-0407" }
  ];
  invariantCheck: boolean;  // refuse to propose if the sum doesn't hold
};
```

**Hard rule:** `planner.ts` throws if the invariant fails. The agent must be structurally unable to propose books that don't balance.

---

# SECTION 5 — HOUR-BY-HOUR EXECUTION SCHEDULE

## Saturday (now → 23:00 venue close)

| Time | Block | Deliverable | Owner |
|---|---|---|---|
| **14:40–15:00** | ADMIN — CRITICAL | Register project on Encode platform (**16:00 hard deadline**); name it; join code to teammate | Human |
| **15:00–15:30** | Xero app setup | Custom Connection created; secrets in `.env`; Demo Company (UK) connected; API Explorer sanity check | Human |
| 14:45–15:15 | (parallel) Lovable workshop | Collect 100 credits; note the edge-function secrets pattern Adam shows | Human #2 / same human after |
| 15:15–15:45 | (parallel) Pitch Perfect workshop | Judge names; submission platform details; anything that changes Section 7 | Human |
| **15:30–17:00** | SPIKE 1 — hello Xero + seed | MCP server runs; `list-organisation-details` + `list-accounts` succeed; `seed/seed.ts` v1 creates accounts, contact, £847 net deposit; BEFORE P&L captured | Fable |
| **17:00–18:30** | SPIKE 2 — golden path writes | `parser.ts` + `planner.ts` + `xero.ts`: 3 writes fire in order against Demo Company; Xero IDs captured; payment-semantics decision locked (Section 2.3 note) | Fable |
| **18:30–19:00** | CHECKPOINT ALPHA | Human verifies in the Xero UI: invoice exists, fees booked, clearing at £0.00. If broken → this hour is debug, dinner slips | Both |
| 19:00–19:45 | Dinner | Mandatory — judges notice zombie teams | Human |
| **19:45–21:00** | CONSENSUS UPGRADES 1+2 | Verification read + live £0.00 ✓ render; idempotency step-map + duplicate-upload demo path | Fable |
| **21:00 — PIVOT GATE (hard)** | Seeded file → approve → 3 writes → zeroed clearing, on ONE screen? | **NO → execute Section 9.2 pivot to LedgerMedic. YES → continue. One-way decision.** | Both |
| 21:00–22:30 | UPGRADE 3 + UI | Transaction-trace panel; Lovable Approval Drawer wired to `/propose` `/approve` `/status`; P&L split-screen from `/pnl` | Fable |
| **22:30–23:00** | NIGHTLY SAFETY | `reset-rehearsal.ts` full run once; commit all; record 60-second fallback video of the working flow on a phone; write down endpoints+scopes used so far | Both |

## Sunday (08:00 → submit 11:00 → pitch 14:45)

| Time | Block | Deliverable |
|---|---|---|
| **08:00–09:00** | FULL RESET REHEARSAL | Re-seed → golden path clean run → time it. Fix breakages ONLY — zero new features |
| 09:00–09:45 | Make scenario (Section 8.2) | Built, run once, screenshotted for the deck. Cap at 45 min — it's a garnish |
| **09:45–10:30** | SUBMISSION PACKAGE (Section 7) | All form fields drafted; deck link live; demo video uploaded |
| **10:30–11:00** | SUBMIT with buffer. CODE FREEZE | — |
| 11:00–12:30 | Pitch rehearsal ×4 minimum | Timed to **2:50**; roles fixed (who drives, who narrates) |
| 12:30–13:30 | Q&A drill (Section 6.3) + lunch | Each defense answered out loud twice |
| 13:30–14:30 | FINAL PREP | Re-seed Demo Company one last time; chargers; backup video on phone AND embedded in deck; hotspot tested |
| **14:45** | PITCH (Section 6) | — |
| 15:30 | Awards | — |

> **Hard external deadlines (Encode dashboard + venue slides):** project creation closes **16:00 Saturday**; submissions due **Sunday 11:00 BST**; pitches **Sunday 14:45** (3-minute demo + Q&A); awards **15:30**; hack ends **16:00**.

---

# SECTION 6 — THE PITCH (3:00, engineered)

