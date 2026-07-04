# PAYOUTBRIDGE — MASTER WIN PLAN
## Rise of the Builder: The Xero App & Agent Hackathon · Encode Hub, London · 4–5 July 2026

> **How to use this document:** This is the single source of truth for the build. It is written to be fed directly to Claude Fable (the build agent). Every section is prescriptive: amounts are locked, file names are fixed, the schedule has hard gates. Fable should execute Part 10 (Build Task List) in order, consulting Parts 2–4 for specs. Humans own Part 5 (admin/schedule), Part 6 (pitch), and Part 7 (submission).
>
> **Status at plan time:** Saturday 4 July, ~14:40 BST.
> - Project creation on the Encode platform closes **16:00 TODAY** (hard deadline, from the Encode dashboard).
> - Submissions due **Sunday 11:00 BST**.
> - Pitches **Sunday 14:45** — 3-minute demo + Q&A. Awards 15:30. Hack ends 16:00.

---

# PART 0 — SOURCE SYNTHESIS (what this plan is built from)

## 0.1 Sources ingested

| Source | Status | Contribution |
|---|---|---|
| [Grok critique](https://grok.com/share/c2hhcmQtNA_0bb61135-db9b-4dad-922c-c8b98fd2eacc) (42 sources) | FULL | Honest score **74**, pitch target 76–78; verification read = #1 improvement; Approval Drawer spec; Make email-trigger scenario; Fresha Q&A defense; rewritten 30-second opening |
| [Perplexity critique](https://www.perplexity.ai/search/critique-request-payoutbridge-Xjf7bDNSQsW4egrbqCondA) (29 sources) | FULL | Honest score **74**; closed-loop clearing proof; transaction-trace audit panel; explicit pivot threshold; "bank rec vs correcting accounting" Q&A answer |
| ChatGPT / DeepSeek / Gemini / Claude / Z.ai shares | LOGIN-WALLED or blocked — content not retrievable | If their text is pasted later, fold novel points into Part 9 (risk) and Part 6 (Q&A) |
| [Xero Prompt Library](https://github.com/XeroAPI/xero-prompt-library) | FULL | Lovable 2026 prompt template; single-account Custom Connection SKILL; granular-scope migration guidance (broad scopes sunset Sept 2027) |
| Encode Dashboard PDF (`Dashboard - Encode Club.pdf`) | FULL | Official bounty briefs; 16:00 project-creation deadline; partners: Xero Developer, Lovable, Make, Replit |
| Venue slides (`Pictures/IMG_3679–3708`) | FULL | Submission form fields (3 required Xero questions); Sunday 11:00 deadline; Make "agentic automation spectrum"; Lovable 100 credits; Discord `#hack-help` |
| Repo research (`docs/TOP3-OPTIMIZED.md`, `docs/PAYOUTBRIDGE-MAX-BRIEF.md`, `docs/TOOLING.md`, `docs/INSIGHTS.md`, `docs/IDEAS-RANKED.md`, `docs/IDEAS-RANKED-POWERFUL.md`, `docs/RESEARCH.md`, `docs/HACKATHON.md`, `docs/FINDINGS.md`) | FULL | Baseline design (Win-Confidence 81/68 dispute), factor headroom analysis, verified MCP tool surface, Treatwell commission mechanics, JAX competitive boundaries, rate limits, demo playbook |

## 0.2 The consensus across external critiques (both agree on all of these)

1. **Honest internal score: 74/100.** The optimistic 81 assumes near-perfect architecture marks; the conservative 68 underweights how cleanly the clearing pattern maps to the official 50/30/20 rubric. Shipping the three consensus upgrades below defends **76–78**.
2. **#1 upgrade — closed-loop verification read.** After the final write, READ the clearing account balance back from Xero and display a live **£0.00 ✓**. Turns "one clever journal" into "closed-loop accounting." Est. 1–1.5h. Lifts the 30% API pillar, the 20% Architecture pillar, and demo wow simultaneously. Highest rubric ROI in the entire plan.
3. **#2 upgrade — idempotency guard, demoed live.** File-hash check before any write; on duplicate upload the UI shows "Already posted — skipped (idempotent)." Est. 0.75–1h. Pre-answers the killer judge question "what happens on duplicate upload?"
4. **#3 upgrade — transaction-trace / audit panel.** Every CSV row mapped to its accounting action with returned Xero IDs and the idempotency key visible. Est. 2–4h. Lifts API depth, architecture, and production credibility.
5. **Unanimous kill list:** live LLM schema inference on stage · refund/credit-note handling on the golden path · multi-platform recipe UI · tracking categories · PDF OCR · any "smart categorisation" not needed to zero the clearing account.
6. **Recipe cache verdict:** a hardcoded Treatwell JSON column-map (~45 min) is a production signal worth having. An LLM fallback + "add new platform" UI is **theater** — cut it.
7. **Lead with Treatwell** (dogfood specificity beats breadth). Broaden to "any service/gig platform" only in the final 30 seconds.
8. **Fresha defense must be ready:** Fresha HAS a native paid Xero integration — never claim otherwise. **Treatwell has ZERO Xero integration** and is absent from Xero's salon collection. Position: "the corrective agent for every platform that hasn't shipped native sync."
9. **Pivot threshold (hard gate):** if by **Saturday ~21:00** the team cannot show seeded-file → approval gate → 3 writes → zeroed clearing account **on one screen**, pivot to LedgerMedic (Part 9.2). The decision is one-way.

---

# PART 1 — WHAT WE ARE BUILDING

## 1.1 One-sentence product

> **PayoutBridge converts opaque platform settlement statements into auditable, Xero-native gross-up accounting — restoring real turnover, fee visibility, and a zero-balance clearing account, with a human approving every write.**

## 1.2 The problem (pitch language, plain English)

A salon does **£1,340** of client work through Treatwell in a settlement period. Treatwell wires **£847** after commission and fees. Xero's bank feed sees one deposit and books £847 as revenue. Result: real turnover understated by £493, commission expense invisible, VAT trail wrong from day one — and every downstream report and tax filing inherits the error.

**Tagline: "Your bank feed has been lying about your turnover."**

## 1.3 Track and official rubric mapping

**Track: Bounty 01 — The Small Business Productivity Powerhouse ($3,000).** Official brief (Encode PDF p.6): automate a real painful workflow; reliable and accurate; easy for non-technical users; clearly time-saving; **Xero central to the workflow, not an add-on**; strong entries use AI to handle edge cases, messy data, real-world variability.

| Official criterion | Weight | How PayoutBridge scores it |
|---|---|---|
| **Xero Connection** | 50% | The flow STARTS from a Xero bank-feed problem and ENDS with corrected Xero reports rendered from live Xero data. Deletion test passes: remove Xero and the product ceases to exist. |
| **API Integration** | 30% | Coordinated reads (`list-bank-transactions`, `list-accounts`, `list-profit-and-loss`) feed three distinct writes (`create-invoice`, `create-bank-transaction`, `create-payment`), closed by a post-write verification read proving a single accounting invariant (clearing = £0.00). Not "one journal and done." |
| **Architecture** | 20% | Idempotency key per file (demoed live), mandatory human approval gate before every write, audit trail with real Xero IDs, deterministic parser, idempotent re-seed script. |
| **Tie-breaker: first 90 seconds** | — | The clearing account hitting **£0.00 ✓ live** is the payoff moment, visible and self-evident on a projector. |

## 1.4 Competitive moat — proof-of-exclusion (one slide, from both critiques)

| Aspect | **PayoutBridge** | Synder | JAX (Just Ask Xero) | A2X / Link My Books | Fresha native sync |
|---|---|---|---|---|---|
| Service/gig **bank-transfer** payouts (Treatwell-style CSV) | **YES — core** | No (payment processors only) | Partial (reconciles the net line only) | No (ecommerce channels only) | Fresha platform only |
| Gross-up via clearing account | **YES + mandatory approval** | Partial (their processors) | No | Yes (their channels) | Summary-level |
| Ingests non-API CSV/PDF statements | **YES** | Limited | No | No | No |
| Human-in-loop before every ledger write | **YES** | Mostly auto | Auto | Auto | Auto |
| Treatwell coverage | **YES** | No | No | No | **No — Treatwell has zero Xero integration** |

**One-sentence moat (survives adversarial pushback):**
> "PayoutBridge is the only Xero-native agent that ingests a Treatwell-style payout statement, applies gross-up accounting through a clearing account with mandatory human approval, and proves the correction with a live zero-balance verification — fixing the turnover lie that bank feeds create and that processor-focused or auto-recon tools never see."

**JAX boundary (never compete on):** NL Q&A over books · auto-reconciliation of high-confidence bank lines · auto-categorisation · analytics/charts. **Our lane:** messy external documents JAX doesn't ingest + gross-up accounting judgement + autonomous fix with audit trail.

## 1.5 Market numbers for the pitch (sourced)

- Treatwell: **55,000–75,000** UK/EU salon partners, ~1M bookings/month; **zero Xero integration**; commission ~35% on new-client bookings, 0% on repeats within 365 days, ~2.5%+VAT prepayment fee, settled twice-monthly ([Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/))
- Xero: **4.4M subscribers** (FY25); UK is its largest international market; 1,000+ App Store apps = distribution path
- Broader wedge: Fresha 140k+ partners (has native sync — excluded honestly), Booksy, Uber (381k UK private-hire licences), Deliveroo (~100k couriers), Fiverr/Upwork — every platform settling by bank transfer + statement export
- Accountant angle: one bookkeeper serves ~30 salon clients → 30 manual gross-ups per fortnight become 30 approve-clicks

---

# PART 2 — ARCHITECTURE (build spec for Fable)

## 2.1 System diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INGESTION                                                              │
│  data/treatwell-payout-0407.csv (locked golden file)                    │
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
| Automation | **Make** free tier (1,000 ops, 2 scenarios) — ONE scenario | Partner prize; Part 8.2 |
| State | Local JSON files: `state/posted.json`, `state/audit.json` | No DB for a demo; resettable |
| Secrets | `.env` (never committed): `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` | Client secret shown once at app creation — copy immediately |

## 2.3 Xero object model (exact amounts, locked forever)

**The invariant:** `1340.00 − 445.90 − 47.10 = 847.00` — sums exactly, no VAT on the golden file (VAT is the #1 rounding landmine both critiques flagged; a £0.01 mismatch on stage = demo death). VAT handling is narrated as roadmap.

**Seed script creates (idempotent — safe to re-run):**
1. Account **"Platform Clearing"** — type: current asset / bank-adjacent (code e.g. `810`)
2. Account **"Platform Commission & Fees"** — type: expense (code e.g. `418`) if not already present
3. Contact **"Treatwell (Marketplace)"**
4. Bank transaction: **RECEIVE £847.00** into the Demo Company bank account, reference `TW-PAYOUT-0407`, dated in-period — this is the "wrong books" starting state (net booked as revenue)
5. Captures the BEFORE P&L snapshot to `state/pnl-before.json`

**Golden-path writes (exact order, all via MCP):**

| # | MCP tool | What it does | Amount |
|---|---|---|---|
| 1 | `create-invoice` | ACCREC invoice, contact Treatwell, line "Gross marketplace sales — period 16–30 Jun", coded to Sales, **paid into Platform Clearing** | **£1,340.00** |
| 2 | `create-bank-transaction` | SPEND from Platform Clearing → "Platform Commission & Fees": two lines — new-client commission £445.90 + prepayment fees £47.10 | **£493.00** |
| 3 | `create-payment` | Applies/clears **£847.00** from Platform Clearing against the seeded net deposit | **£847.00** |
| 4 | **VERIFICATION READ** | Query Platform Clearing balance → render live **£0.00 ✓** | — |
| 5 | `list-profit-and-loss` | AFTER snapshot → split-screen diff vs BEFORE | — |

> Implementation note for Fable: if `create-payment` semantics against a seeded bank line prove awkward in the Demo Company, the accepted alternative is a `create-bank-transaction` transfer or a `create-manual-journal` moving £847 Clearing→Bank — keep THREE DISTINCT WRITE TYPES on the demo path whichever route is chosen. Decide during Spike 2, lock by 18:30, never revisit.

## 2.4 The golden CSV (create by hand, lock, never edit after 18:30 Sat)

`data/treatwell-payout-0407.csv`:

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
- **Duplicate upload (DEMOED LIVE):** second upload of the same file → UI banner "Already posted at 14:52 — skipped (idempotent). Xero IDs: INV-0042, BT-0117, PMT-0089."
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

# PART 3 — OAUTH SCOPES, RATE LIMITS, AND SETUP FACTS

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
- Custom Connection is free **only** on the Demo Company; production = paid/monthly or standard OAuth via App Store — the pitch must not imply free production M2M (Q&A defense in Part 6.3)
- MCP `update-invoice` touches DRAFT only; no delete/void anywhere in MCP — irrelevant to golden path but do not improvise flows that need them

---

# PART 4 — REPO STRUCTURE FOR FABLE

```
payoutbridge/
├── .env                      # XERO_CLIENT_ID, XERO_CLIENT_SECRET (never commit)
├── package.json
├── data/
│   └── treatwell-payout-0407.csv     # LOCKED golden file (Part 2.4)
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

# PART 5 — HOUR-BY-HOUR EXECUTION SCHEDULE

## Saturday (now → 23:00 venue close)

| Time | Block | Deliverable | Owner |
|---|---|---|---|
| **14:40–15:00** | ADMIN — CRITICAL | Register project on Encode platform (**16:00 hard deadline**); name it; join code to teammate | Human |
| **15:00–15:30** | Xero app setup | Custom Connection created; secrets in `.env`; Demo Company (UK) connected; API Explorer sanity check | Human |
| 14:45–15:15 | (parallel) Lovable workshop | Collect 100 credits; note the edge-function secrets pattern Adam shows | Human #2 / same human after |
| 15:15–15:45 | (parallel) Pitch Perfect workshop | Judge names; submission platform details; anything that changes Part 7 | Human |
| **15:30–17:00** | SPIKE 1 — hello Xero + seed | MCP server runs; `list-organisation-details` + `list-accounts` succeed; `seed/seed.ts` v1 creates accounts, contact, £847 net deposit; BEFORE P&L captured | Fable |
| **17:00–18:30** | SPIKE 2 — golden path writes | `parser.ts` + `planner.ts` + `xero.ts`: 3 writes fire in order against Demo Company; Xero IDs captured; payment-semantics decision locked (Part 2.3 note) | Fable |
| **18:30–19:00** | CHECKPOINT ALPHA | Human verifies in the Xero UI: invoice exists, fees booked, clearing at £0.00. If broken → this hour is debug, dinner slips | Both |
| 19:00–19:45 | Dinner | Mandatory — judges notice zombie teams | Human |
| **19:45–21:00** | CONSENSUS UPGRADES 1+2 | Verification read + live £0.00 ✓ render; idempotency step-map + duplicate-upload demo path | Fable |
| **21:00 — PIVOT GATE (hard)** | Seeded file → approve → 3 writes → zeroed clearing, on ONE screen? | **NO → execute Part 9.2 pivot to LedgerMedic. YES → continue. One-way decision.** | Both |
| 21:00–22:30 | UPGRADE 3 + UI | Transaction-trace panel; Lovable Approval Drawer wired to `/propose` `/approve` `/status`; P&L split-screen from `/pnl` | Fable |
| **22:30–23:00** | NIGHTLY SAFETY | `reset-rehearsal.ts` full run once; commit all; record 60-second fallback video of the working flow on a phone; write down endpoints+scopes used so far | Both |

## Sunday (08:00 → submit 11:00 → pitch 14:45)

| Time | Block | Deliverable |
|---|---|---|
| **08:00–09:00** | FULL RESET REHEARSAL | Re-seed → golden path clean run → time it. Fix breakages ONLY — zero new features |
| 09:00–09:45 | Make scenario (Part 8.2) | Built, run once, screenshotted for the deck. Cap at 45 min — it's a garnish |
| **09:45–10:30** | SUBMISSION PACKAGE (Part 7) | All form fields drafted; deck link live; demo video uploaded |
| **10:30–11:00** | SUBMIT with buffer. CODE FREEZE | — |
| 11:00–12:30 | Pitch rehearsal ×4 minimum | Timed to **2:50**; roles fixed (who drives, who narrates) |
| 12:30–13:30 | Q&A drill (Part 6.3) + lunch | Each defense answered out loud twice |
| 13:30–14:30 | FINAL PREP | Re-seed Demo Company one last time; chargers; backup video on phone AND embedded in deck; hotspot tested |
| **14:45** | PITCH (Part 6) | — |
| 15:30 | Awards | — |

---

# PART 6 — THE PITCH (3:00, engineered)

## 6.1 Script

**[0:00–0:30] THE LIE (no UI on screen yet — problem first)**
> "Imagine you run a salon. Your team just delivered **£1,340** of real client work through Treatwell this month. Treatwell wires you **£847** — after their cut and fees. Xero's bank feed sees that single deposit and records your entire month's revenue as £847. Your real turnover is missing £493. Your commission expense is invisible. Your VAT position is wrong from day one. That is the lie your bank feed tells you every single payout. We know — this is our own Treatwell statement."

**[0:30–1:45] THE GOLDEN PATH (live)**
- Upload `treatwell-payout-0407.csv` → **Approval Drawer** opens: plain-English breakdown + "What Xero will do" 3-item checklist
- Click **Approve & Post to Xero** → live progress "Posting to Xero… 1/3 → 2/3 → 3/3" with green ticks
- **THE PAYOFF:** Clearing Reconciliation panel renders the equation `Gross £1,340 − Commission & fees £493 = Net £847` and beneath it, from a **live verification read**: **Platform Clearing: £0.00 ✓**

**[1:45–2:15] PROOF IT'S REAL**
- Split-screen P&L pulled live from Xero: BEFORE (revenue £847, no commission line) vs AFTER (revenue £1,340, commission expense visible)
- **Idempotency beat (live):** re-upload the same file → "Already posted — skipped." One line: *"It will never double-post your books."*

**[2:15–2:40] ARCHITECTURE (the 20% bucket, spoken over the trace panel)**
> "Every write carries an idempotency key, sits behind a human approval gate, and lands in this audit trail with real Xero IDs. Reads drive the decision, writes execute it, and a verification read proves it. Closed-loop accounting — not a script that hopes."

**[2:40–3:00] SCALE**
> "Treatwell alone: 55,000+ salon partners and zero Xero integration. The same clearing pattern extends to every service platform that settles by bank transfer — Booksy, Uber, Deliveroo. 4.4 million Xero subscribers, and the App Store is the distribution path. We're the corrective agent for every platform that hasn't shipped native sync."

## 6.2 Visual assets (build Sat night / Sun morning)

1. **Clearing Reconciliation panel** — THE visual (both critiques ranked it above the P&L diff)
2. Split-screen P&L before/after (live data, not screenshots)
3. Proof-of-exclusion table slide (Part 1.4)
4. Transaction-trace/audit panel (backdrop for the architecture beat)
5. Equation slide: `£1,340 − £493 = £847 → fully traced in Xero`

## 6.3 Q&A kill-shot defenses (drilled out loud Sunday 12:30)

| Judge attack | Crisp answer |
|---|---|
| "Fresha already has native Xero sync — why do you exist?" | "Correct — and Fresha users should use it. **Treatwell, the platform we actually pay commission to, has zero Xero connector** and settles by bank transfer plus CSV. We're the corrective layer for every platform that hasn't shipped native sync." |
| "Why not just bank rec / JAX?" | "Bank rec matches the net cash line. It cannot recover the gross/fee split — that truth only lives in the platform statement, which JAX doesn't ingest. This is correcting accounting, not matching." |
| "What happens on duplicate upload?" | Demo it live (the idempotency beat pre-answers this). |
| "Network drop after write 1, before write 3?" | "The audit log marks the last completed step; re-run skips completed Xero IDs — the idempotency map is per-step, not per-file." |
| "Why human-in-loop instead of full automation?" | "A wrong journal is worse than none. The approval gate is exactly the production control the architecture criterion rewards; confidence scoring can raise the auto-threshold later." |
| "My bookkeeper does this in 10 minutes." | "A bookkeeper with 30 salon clients does 30 manual gross-ups a fortnight. This makes that 30 approve-clicks with a consistent audit trail — cheaper than hourly judgement time." |
| "This is niche." | "It's a wedge, not a niche. Treatwell today; the recipe pattern generalises to every bank-transfer marketplace. A2X built an entire company on this exact pattern for ecommerce." |
| "Custom Connections cost money in production." | "Free on the Demo Company for development; the production path is standard OAuth through an App Store listing — which is the distribution plan anyway." |
| "Is the LLM parsing reliable?" | Honesty rule: "On stage you saw a deterministic recipe for Treatwell's known format. Schema inference for unseen formats is the roadmap — we deliberately kept it off the demo path because your books deserve determinism." |

## 6.4 Honesty rules (judges detect hand-waving)

- Anything not built (VAT splits, multi-platform, PDF ingestion, auto-recovery beyond the step-map) is **"explicit roadmap"** — never implied as shipped.
- Internal score talk: the honest number is **74**, defensible at **76–78** with the three consensus upgrades shipped. Never quote 81 externally.

---

# PART 7 — SUBMISSION PACKAGE (due Sunday 11:00)

From the venue submission slide — prepare ALL fields Saturday night, finalise 09:45 Sunday:

**The basics**
1. **Project details:** "PayoutBridge — an AI agent that fixes the books for platform-paid businesses. Platforms like Treatwell pay salons net of commission; Xero's bank feed books that net deposit as revenue, understating turnover and hiding fees. PayoutBridge ingests the platform settlement statement, proposes a clearing-account gross-up in plain English, and — after one human approval — posts the corrected accounting to Xero and proves it with a live zero-balance verification and before/after P&L."
2. **Development platform:** "Claude Fable (Cursor) agent core in TypeScript · Xero MCP Server · Lovable (UI) · Make (automation)"
3. **Presentation link:** Google Slides / Canva (assets Part 6.2)
4. **Demo video (recommended):** 60–90s screen recording of the golden path — doubles as the live-failure fallback

**The Xero questions (REQUIRED)**
1. **How did your project use the Xero API?** "Corrective gross-up accounting for marketplace payouts: reads locate the net bank deposit and baseline P&L; the agent proposes a clearing-account gross-up; on human approval it posts a gross revenue invoice, fee expenses, and the clearing payment; a post-write verification read proves the clearing account nets to £0.00; before/after P&L is rendered from live Xero data."
2. **Endpoints:** `POST /Invoices` (create-invoice) · `POST /BankTransactions` (create-bank-transaction) · `POST /Payments` (create-payment) · `POST /Contacts` (seed) · `GET /BankTransactions` · `GET /Accounts` · `GET /Reports/ProfitAndLoss`
3. **OAuth scopes:** `accounting.transactions` (or granular `accounting.invoices` + `accounting.banktransactions` + `accounting.payments`) · `accounting.contacts` · `accounting.settings` · `accounting.reports.profitandloss.read`

---

# PART 8 — PARTNER PRIZE SURFACES (one build, three prizes)

## 8.1 Lovable
The **Approval Drawer IS the Lovable entry** — no separate build. Panes: parsed payout · proposed actions checklist · live posting progress · audit trail. Scaffolded from the [Lovable 2026 template](https://github.com/XeroAPI/xero-prompt-library/tree/main/lovable); backend secrets via edge-function pattern from the workshop. Zero extra demo time: it's the golden path's face.

**Lovable prompt sketch (give to Lovable, adapt):**
> "Build a single-page financial approval app called PayoutBridge. Dark professional theme. Main element: an 'Approval Drawer' card showing (1) an uploaded payout summary — gross sales £1,340, commission £445.90, fees £47.10, net payout £847; (2) a 'What Xero will do' checklist with three items (create gross revenue invoice, book commission & fees, clear £847 against the bank deposit); (3) a large green 'Approve & Post to Xero' button that calls POST /approve on my backend and then shows live step progress 1/3, 2/3, 3/3 with green ticks; (4) after completion, a 'Clearing Reconciliation' panel showing the equation and 'Platform Clearing: £0.00 ✓' fetched from GET /status; (5) a side-by-side P&L before/after panel fetched from GET /pnl; (6) a collapsible audit-trail table (timestamp, action, Xero ID, status). Also handle the duplicate case: if /propose returns already-posted, show an amber banner 'Already posted — skipped (idempotent)' with the existing Xero IDs."

## 8.2 Make (Sunday 09:00, 45-minute cap)
**Scenario:** Gmail/Drive watch for "Treatwell Sales Proceeds" attachment → HTTP POST file to agent `/propose` → receive breakdown + idempotency status → post Slack (or email) approval card with a link to the Approval Drawer. **Approval and all Xero writes stay in the agent** (control + audit). Make owns ingestion + notification — positioned as **agentic orchestration**, the exact tier their own workshop slide promoted over brittle zaps. Screenshot into the deck; 5 seconds of pitch: "payout statements arrive by email — Make catches them."

## 8.3 Main track: B01 (everything above)

---

# PART 9 — RISK REGISTER & PIVOT PLAN

## 9.1 Live-failure modes and mitigations

| # | Failure mode | Mitigation |
|---|---|---|
| R1 | Seed drift / Demo Company state changed | Idempotent one-command re-seed; final re-seed at 13:30 Sunday; all amounts hardcoded |
| R2 | £0.01 rounding mismatch (the classic) | Golden file is VAT-free; invariant checked in `planner.ts`; amounts sum exactly by construction |
| R3 | MCP write fails mid-demo (scope / 429 / transient) | All scopes granted at connect; golden path ≤10 calls vs 60/min budget; per-step audit allows narrated recovery ("step 2 of 3 committed — rerunning step 3"); fallback video on phone AND in deck |
| R4 | CSV parse failure | Deterministic hardcoded map; file locked at 18:30 Sat and never edited again |
| R5 | Venue wifi dies | Agent + MCP run locally; only Xero API needs internet → phone hotspot tested Sunday 13:30 |
| R6 | Lovable credit wall / build stalls | Core flow must also run from a minimal local page or CLI — Lovable is the face, never the spine |
| R7 | Payment semantics fight the Demo Company | Decision window in Spike 2 with the manual-journal alternative pre-approved (Part 2.3 note) |
| R8 | Judge Q&A ambush | Part 6.3 drilled out loud twice; honesty rules (6.4) prevent over-claim traps |

## 9.2 Pivot plan: LedgerMedic (executes ONLY if the 21:00 Saturday gate fails)

- **What:** pre-seeded miscoding (a £2,400 laptop booked to Office Supplies + a stuck £500 suspense balance) → agent diagnoses → drafts the correcting `create-manual-journal` with reversal and plain-English reasoning → human approves → suspense drops to £0.00, audit trail visible.
- **Why it's the pivot:** deterministic (no parsing at all), single write type, same Approval Drawer UI, same idempotency/audit code, same architecture story — **~70% of Saturday's code reuses**. Win-Confidence 73 vs PayoutBridge 81 — lower ceiling, far lower variance.
- **Rule:** the 21:00 decision is one-way. No flip-flopping. If pivoted, Part 6's script is rewritten Sunday 08:00 around "suspense to zero" as the payoff.

## 9.3 Score ledger (internal honesty)

| Claim | Number |
|---|---|
| Honest internal score (both external critiques) | **74** |
| Defensible after Upgrades 1–3 ship | **76–78** |
| Do not claim externally | 81 |
| Pivot floor (LedgerMedic) | ~73 |

---

# PART 10 — ORDERED BUILD TASK LIST FOR CLAUDE FABLE

Execute strictly in order. Each task has acceptance criteria. Do not start a task until the previous one's criteria pass.

1. **Project scaffold** — `package.json`, TS config, folder tree per Part 4. ✓ `npm run build` clean.
2. **MCP connectivity** — `src/xero.ts` connects via Custom Connection env vars; `list-organisation-details` returns the Demo Company. ✓ Org name printed.
3. **Seed script** — `seed/seed.ts` per Part 2.3: accounts, contact, £847 net deposit, BEFORE P&L snapshot. Idempotent (re-run = no duplicates). ✓ All objects visible in Xero UI; second run creates nothing new.
4. **Golden CSV + parser** — `data/treatwell-payout-0407.csv` per Part 2.4; `src/parser.ts` hardcoded map → `CanonicalPayout`. ✓ Parsed output matches locked amounts; invariant holds.
5. **Planner** — `src/planner.ts` → `JournalPlan`; throws on invariant failure. ✓ Unit check: tampered CSV rejected.
6. **Three writes** — `src/xero.ts` executes the plan in order, captures Xero IDs. Payment-semantics decision locked here (Part 2.3 note). ✓ Human confirms in Xero UI: invoice, fees, clearing at £0.00. **This is Checkpoint Alpha (18:30).**
7. **Verification read (consensus #1)** — post-write clearing-balance query; expose in `/status`. ✓ Returns 0.00 after a clean run.
8. **Idempotency step-map (consensus #2)** — `src/idempotency.ts` + wiring; duplicate `/propose` returns `already-posted` with IDs. ✓ Second run of the same file performs zero writes.
9. **Audit trail (consensus #3)** — `src/audit.ts`; every call appended; `/status` returns trace-panel shape. ✓ audit.json shows full run with IDs.
10. **HTTP server** — `src/server.ts` with `/propose` `/approve` `/status` `/pnl`. ✓ curl walkthrough of the full flow works.
11. **PIVOT GATE 21:00** — one-screen demo achievable? Owner decision. If NO → switch to Part 9.2 backlog (reuse tasks 1–3, 8–10; replace 4–7 with miscoding seed + manual-journal flow).
12. **Lovable Approval Drawer** — prompt per Part 8.1, wired to endpoints. ✓ Full golden path clickable in the browser, payoff panel renders live £0.00 ✓.
13. **P&L split-screen** — AFTER snapshot post-run; `/pnl` feeds the before/after panel. ✓ Revenue 847→1,340 visible, commission line appears.
14. **Reset rehearsal script** — `scripts/reset-rehearsal.ts`: seed → propose → approve → verify, one command. ✓ Clean run end-to-end; run once Sat 22:30, once Sun 08:00.
15. **Fallback video** — 60–90s screen recording of the working flow. ✓ On phone + embedded in deck.
16. **(Sunday) Make scenario** — Part 8.2, 45-minute cap. ✓ Screenshot in deck.
17. **(Sunday) Submission package** — Part 7 fields finalised, submitted by 10:45. ✓ Confirmation received.

**Definition of done (the Perplexity threshold, verbatim):** one screen shows seeded file → human approval gate → three distinct Xero writes → live £0.00 clearing verification → before/after P&L. Everything else is garnish.

---

*Sources referenced throughout: [Grok critique](https://grok.com/share/c2hhcmQtNA_0bb61135-db9b-4dad-922c-c8b98fd2eacc) · [Perplexity critique](https://www.perplexity.ai/search/critique-request-payoutbridge-Xjf7bDNSQsW4egrbqCondA) · [Xero Prompt Library](https://github.com/XeroAPI/xero-prompt-library) · [Xero MCP Server](https://github.com/XeroAPI/xero-mcp-server) · [Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/) · [Xero API Explorer](https://api-explorer.xero.com/) · Encode Dashboard PDF · venue slides (`Pictures/`) · repo research (`docs/`). The ChatGPT, DeepSeek, Gemini, Claude and Z.ai share links were login-walled or returned empty pages and could not be read — paste their text and any novel points will be folded into Parts 6.3 and 9.1.*
