# PAYOUTBRIDGE — MASTER BUILD DOC (BUILD.md)
## Rise of the Builder: The Xero App & Agent Hackathon · Encode Hub, London · 4–5 July 2026

> **What this file is:** the consolidated, single master build document for PayoutBridge — the doc Claude Fable executes against and the team works from. It supersedes the scattered `docs/` research files and folds their build-relevant content into one place.
>
> **How to use it:** every section is prescriptive — amounts are locked, file names are fixed, the schedule has hard gates. Fable executes **Section 10 (Ordered Build Task List)** in order, consulting Sections 2–4 for specs. Humans own Section 5 (admin/schedule), Section 6 (pitch), Section 7 (submission).

---

# SECTION 0 — INTEGRITY & PROVENANCE (read first)

## 0.A How this document was produced (composition audit trail)

This BUILD.md was **reconstructed by the PATCHER stage** after the upstream COMPOSER stage failed to persist its output to disk. At review time an independent critic verified — via case-insensitive `find`, `ls`, and `git status` — that **no `BUILD.md` existed anywhere in the repo**; the composer had produced its master doc only in a chat response and never called Write. The correct interim status was **BLOCKED: input artifact missing**, and that is now resolved by this reconstruction.

- **Backbone source:** `PAYOUTBRIDGE-MASTERPLAN.md` (repo root), which is itself the "single source of truth for the build" and already a lossless consolidation of the 18 research files enumerated in its Part 0.1. The build-relevant substance of those files is carried through this document; nothing correct was dropped.
- **Also on disk (supporting sources, not re-transcribed here):** `docs/TOP3-OPTIMIZED.md`, `docs/PAYOUTBRIDGE-MAX-BRIEF.md`, `docs/TOOLING.md`, `docs/INSIGHTS.md`, `docs/IDEAS-RANKED.md`, `docs/IDEAS-RANKED-POWERFUL.md`, `docs/IDEAS-RANKED-FRESH.md`, `docs/RESEARCH.md`, `docs/HACKATHON.md`, `docs/FINDINGS.md`, `docs/JUDGE-SIGNALS.md`, `docs/PLATFORM.md`, `docs/SETUP.md`, `docs/XERO-PRODUCT-PORTFOLIO.md`, `docs/SESSION-OPS-NOTES.md`, `docs/usefulinfo.md`, `docs/PHOTO-NOTES.md`, `docs/TOP3-FRESH-OPTIMIZED.md`, plus `xero.md` (live UK plan purchase) and the Encode dashboard PDF / venue slides.
- **Forward risk the critic flagged (now handled):** the sources are Treatwell-heavy. Section 0.C records exactly how the Treatwell hard rule was applied so the demo doc does not carry fabricated demo content.

## 0.B Integrity flags — UNSUPPORTED / illustrative claims (do not launder into "facts")

These are re-flagged here so no one downstream treats them as verified. They are fine to USE, but must be spoken/handled with the honesty they carry:

| Claim in this doc | Status | Handling rule |
|---|---|---|
| Demo figures **£1,340 gross / £493 commission+fees / £847 net** and the whole `marketplaceco-payout-0407.csv` | **SYNTHETIC / illustrative** — hand-authored demo fixture, not a real settlement statement | Present on stage as a **representative Treatwell-format statement with synthetic figures**. Never claim it is a real/own statement (see 0.C). |
| Internal scores **74 honest / 76–78 defensible / 81 optimistic** | **INTERNAL ESTIMATE / opinion**, from two external LLM critiques — not an external or objective fact | Never quote **81** externally; the honest number to reason with is **74**. It is a self-assessment, not a judge's score. |
| Treatwell market numbers: **55,000–75,000 UK/EU partners**, **~1M bookings/month**, commission **~35% new-client / 0% repeat within 365 days**, **~2.5%+VAT prepayment fee**, **twice-monthly settlement** | **SOURCED but UNVERIFIED at reconstruction time** — attributed to Treatwell partner pricing; not independently re-confirmed here | Cite the source ([Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/)); do not present exact figures as gospel — round and hedge ("tens of thousands of partners"). |
| Xero **4.4M subscribers (FY25)**, **1,000+ App Store apps** | **SOURCED but UNVERIFIED here** | Attribute to Xero FY25 reporting; hedge if challenged. |
| "**Treatwell has zero Xero integration** / absent from Xero's salon collection" | **RESEARCH claim, load-bearing for the moat** | This is competitive analysis, not demo content. If a judge produces a Treatwell↔Xero connector, concede instantly and fall back to "every platform that hasn't shipped native sync." |
| "**Fresha HAS a native paid Xero integration**" | **RESEARCH claim** — stated as true in-plan | Must be honored as true in Q&A (Section 6.3). Never claim Fresha lacks one. |
| "~**70% of Saturday's code reuses** into the LedgerMedic pivot" | **ESTIMATE** | Planning figure only. |
| Win-Confidence **68 → 81** across runs, plus a **84–86** MAX-BRIEF projection | **INTERNAL ESTIMATE — large cross-run drift; 84–86 is a HYPOTHETICAL from an interrupted run that never finished** | Quote as a **range**, never a single point; **never present 84–86 as achieved** (see §14). |
| Prize pool **$9,000 / $3,000 each** vs **£9,000 / £3,000 each** | **UNRESOLVED currency discrepancy** across official sources (Luma/CompeteHub/dashboard say USD; Encode programme + on-site slides say GBP) | Say "$3,000 (confirm GBP vs USD on the day)"; never state one currency as certain (see §13). |
| MCP server surfaces **51 tools**; v0.0.17 broke `update-bank-transaction` (#206/#184); other issue numbers | **SOURCED to the public repo/issues at digest time — not re-verified on the day** | Re-check the repo/issues before relying on any specific tool at build time (see §11). |
| JAX is **"beta", never formally GA**; **Anthropic–Xero product integration "coming months", NOT shipped** as of 4 Jul 2026 | **SOURCED (Xero blog Mar 2026) but time-sensitive** | Hedge; re-check after Xerocon 8–9 Jul 2026 (see §11.7–11.8). |
| Mentor architecture patterns (per-tenant 5-min cache, AES-256-GCM, skills-as-markdown, etc.) | **SOURCED to Ashish Nangia's public `Tax-Insights` repo — his personal build, NOT official Xero guidance** | Attribute as "the pattern the on-site mentor himself used," not as Xero policy (see §12). |
| Research stats: duplicate-invoice **1.29% / $2,034**; payments-fraud **76% hit / 17% use AI**; **~864,000 HMRC landlord letters**; "Custom Connection M2M is **free**" | **FABRICATED / UNCONFIRMED / UNSUPPORTED** (flagged by the research verifier) | **Do NOT cite these as fact.** Custom Connection is free ONLY on the Demo Company (~£5/mo per org in production) (see §16). |

## 0.C Treatwell hard-rule scrub — what was removed and why

**Hard rule enforced:** no fabricated **Treatwell demo content** in the shared deliverable.

- **REMOVED (fabrication):** the pitch line *"We know — this is our own Treatwell statement."* This presented invented demo CSV data as the team's **real** Treatwell settlement statement — a fabricated real-data claim. It is deleted from the Section 6 script and replaced with an explicit "synthetic, representative statement" framing.
- **RETAINED (legitimate research):** Treatwell as a named **market / competitive reference** — partner counts, commission mechanics, and the "no native Xero integration" moat argument. These are sourced competitive facts (flagged in 0.B), not demo content, so removing them would drop correct, material information. They stay, with source flags.
- **Demo fixtures** (`marketplaceco-payout-0407.csv`, the "Treatwell (Marketplace)" seeded contact) are retained as clearly-labelled **synthetic** demo data. If the organisers require full de-branding of demo fixtures, swap the brand token to a neutral placeholder ("MarketplaceCo") — the accounting and every amount are brand-independent.

---

# SECTION 1 — WHAT WE ARE BUILDING

## 1.1 One-sentence product

> **PayoutBridge converts opaque platform settlement statements into auditable, Xero-native gross-up accounting — restoring real turnover, fee visibility, and a zero-balance clearing account, with a human approving every write.**

## 1.2 The problem (pitch language, plain English)

A salon does **£1,340** of client work through Treatwell in a settlement period. Treatwell wires **£847** after commission and fees. Xero's bank feed sees one deposit and books £847 as revenue. Result: real turnover understated by £493, commission expense invisible, VAT trail wrong from day one — and every downstream report and tax filing inherits the error.

> _(Amounts above are the **synthetic demo scenario** — see 0.B/0.C.)_

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
| Treatwell coverage | **YES** | No | No | No | **No — Treatwell has zero Xero integration** (research claim, 0.B) |

**One-sentence moat (survives adversarial pushback):**
> "PayoutBridge is the only Xero-native agent that ingests a Treatwell-style payout statement, applies gross-up accounting through a clearing account with mandatory human approval, and proves the correction with a live zero-balance verification — fixing the turnover lie that bank feeds create and that processor-focused or auto-recon tools never see."

**JAX boundary (never compete on):** NL Q&A over books · auto-reconciliation of high-confidence bank lines · auto-categorisation · analytics/charts. **Our lane:** messy external documents JAX doesn't ingest + gross-up accounting judgement + autonomous fix with audit trail.

## 1.5 Market numbers for the pitch (sourced — see 0.B integrity flags)

- Treatwell: **55,000–75,000** UK/EU salon partners, ~1M bookings/month; **zero Xero integration**; commission ~35% on new-client bookings, 0% on repeats within 365 days, ~2.5%+VAT prepayment fee, settled twice-monthly ([Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/)) — _figures sourced but not independently re-verified; hedge on stage._
- Xero: **4.4M subscribers** (FY25); UK is its largest international market; 1,000+ App Store apps = distribution path
- Broader wedge: Fresha 140k+ partners (has native sync — excluded honestly), Booksy, Uber (381k UK private-hire licences), Deliveroo (~100k couriers), Fiverr/Upwork — every platform settling by bank transfer + statement export
- Accountant angle: one bookkeeper serves ~30 salon clients → 30 manual gross-ups per fortnight become 30 approve-clicks

---

# SECTION 2 — ARCHITECTURE (build spec for Fable)

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

## 6.1 Script

**[0:00–0:30] THE LIE (no UI on screen yet — problem first)**
> "Imagine you run a salon. Your team just delivered **£1,340** of real client work through MarketplaceCo — a Treatwell-style booking platform — this month. The platform wires you **£847** — after their cut and fees. Xero's bank feed sees that single deposit and records your entire month's revenue as £847. Your real turnover is missing £493. Your commission expense is invisible. Your VAT position is wrong from day one. That is the lie your bank feed tells you every single payout — and today we'll fix it live, on a representative marketplace-format statement."

> _**Hard-rule note (0.C):** the earlier scripted line "We know — this is our own Treatwell statement" was REMOVED. The demo figures are synthetic/illustrative; never claim the CSV is a real or own settlement statement._

**[0:30–1:45] THE GOLDEN PATH (live)**
- Upload `marketplaceco-payout-0407.csv` → **Approval Drawer** opens: plain-English breakdown + "What Xero will do" 3-item checklist
- Click **Approve & Post to Xero** → live progress "Posting to Xero… 1/3 → 2/3 → 3/3" with green ticks
- **THE PAYOFF:** Clearing Reconciliation panel renders the equation `Gross £1,340 − Commission & fees £493 = Net £847` and beneath it, from a **live verification read**: **Platform Clearing: £0.00 ✓**

**[1:45–2:15] PROOF IT'S REAL**
- Split-screen P&L pulled live from Xero: BEFORE (revenue £847, no commission line) vs AFTER (revenue £1,340, commission expense visible)
- **Idempotency beat (live):** re-upload the same file → "Already posted — skipped." One line: *"It will never double-post your books."*

**[2:15–2:40] ARCHITECTURE (the 20% bucket, spoken over the trace panel)**
> "Every write carries an idempotency key, sits behind a human approval gate, and lands in this audit trail with real Xero IDs. Reads drive the decision, writes execute it, and a verification read proves it. Closed-loop accounting — not a script that hopes."

**[2:40–3:00] SCALE**
> "Treatwell alone: tens of thousands of salon partners and zero native Xero integration. The same clearing pattern extends to every service platform that settles by bank transfer — Booksy, Uber, Deliveroo. Millions of Xero subscribers, and the App Store is the distribution path. We're the corrective agent for every platform that hasn't shipped native sync."

> _Market figures hedged per 0.B — say "tens of thousands" and "millions," not exact unverified counts, unless you have the source open._

## 6.2 Visual assets (build Sat night / Sun morning)

1. **Clearing Reconciliation panel** — THE visual (both critiques ranked it above the P&L diff)
2. Split-screen P&L before/after (live data, not screenshots)
3. Proof-of-exclusion table slide (Section 1.4)
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
| "Is the LLM parsing reliable?" | Honesty rule: "On stage you saw a deterministic recipe for the demo marketplace's known format. Schema inference for unseen formats is the roadmap — we deliberately kept it off the demo path because your books deserve determinism." |
| "Is that a real platform statement?" | Honesty rule (0.C): "It's a **synthetic, representative** Treatwell-format statement — the figures are illustrative so the accounting is easy to follow. The parser and clearing logic are format-real; the numbers are demo fixtures." |

## 6.4 Honesty rules (judges detect hand-waving)

- Anything not built (VAT splits, multi-platform, PDF ingestion, auto-recovery beyond the step-map) is **"explicit roadmap"** — never implied as shipped.
- Demo data is **synthetic** — never presented as a real/own customer statement (0.C).
- Internal score talk: the honest number is **74**, defensible at **76–78** with the three consensus upgrades shipped. Never quote 81 externally. (This is a self-assessment, not a judge's score — 0.B.)

---

# SECTION 7 — SUBMISSION PACKAGE (due Sunday 11:00)

From the venue submission slide — prepare ALL fields Saturday night, finalise 09:45 Sunday. **Submit a draft early** so a last-minute cutoff cannot disqualify the entry.

**The basics**
1. **Project details:** "PayoutBridge — an AI agent that fixes the books for platform-paid businesses. Platforms like Treatwell pay salons net of commission; Xero's bank feed books that net deposit as revenue, understating turnover and hiding fees. PayoutBridge ingests the platform settlement statement, proposes a clearing-account gross-up in plain English, and — after one human approval — posts the corrected accounting to Xero and proves it with a live zero-balance verification and before/after P&L."
2. **Development platform:** "Claude Fable (Cursor) agent core in TypeScript · Xero MCP Server · Lovable (UI) · Make (automation)"
3. **Presentation link:** Google Slides / Canva (assets Section 6.2)
4. **Demo video:** **NO length limit** on the submission recording — make it as long as it needs to cover everything. **Recommended ~3 minutes** as a guide only (optional — go longer or shorter as you like). Separately keep a tight **60–90s cut** as the on-stage live-failure fallback (that one must fit inside the 3-minute live pitch; it is a different artifact from the submission video).

**The Xero questions (REQUIRED — 3 questions on the submission form)**
1. **How did your project use the Xero API?** "Corrective gross-up accounting for marketplace payouts: reads locate the net bank deposit and baseline P&L; the agent proposes a clearing-account gross-up; on human approval it posts a gross revenue invoice, fee expenses, and the clearing payment; a post-write verification read proves the clearing account nets to £0.00; before/after P&L is rendered from live Xero data."
2. **Endpoints:** `POST /Invoices` (create-invoice) · `POST /BankTransactions` (create-bank-transaction) · `POST /Payments` (create-payment) · `POST /Contacts` (seed) · `GET /BankTransactions` · `GET /Accounts` · `GET /Reports/ProfitAndLoss`
3. **OAuth scopes:** `accounting.transactions` (or granular `accounting.invoices` + `accounting.banktransactions` + `accounting.payments`) · `accounting.contacts` · `accounting.settings` · `accounting.reports.profitandloss.read`

---

# SECTION 8 — PARTNER PRIZE SURFACES (one build, three prizes)

## 8.1 Lovable
The **Approval Drawer IS the Lovable entry** — no separate build. Panes: parsed payout · proposed actions checklist · live posting progress · audit trail. Scaffolded from the [Lovable 2026 template](https://github.com/XeroAPI/xero-prompt-library/tree/main/lovable); backend secrets via edge-function pattern from the workshop. Zero extra demo time: it's the golden path's face.

**Lovable prompt sketch (give to Lovable, adapt):**
> "Build a single-page financial approval app called PayoutBridge. Dark professional theme. Main element: an 'Approval Drawer' card showing (1) an uploaded payout summary — gross sales £1,340, commission £445.90, fees £47.10, net payout £847; (2) a 'What Xero will do' checklist with three items (create gross revenue invoice, book commission & fees, clear £847 against the bank deposit); (3) a large green 'Approve & Post to Xero' button that calls POST /approve on my backend and then shows live step progress 1/3, 2/3, 3/3 with green ticks; (4) after completion, a 'Clearing Reconciliation' panel showing the equation and 'Platform Clearing: £0.00 ✓' fetched from GET /status; (5) a side-by-side P&L before/after panel fetched from GET /pnl; (6) a collapsible audit-trail table (timestamp, action, Xero ID, status). Also handle the duplicate case: if /propose returns already-posted, show an amber banner 'Already posted — skipped (idempotent)' with the existing Xero IDs."

## 8.2 Make (Sunday 09:00, 45-minute cap)
**Scenario:** Gmail/Drive watch for "Treatwell Sales Proceeds" attachment → HTTP POST file to agent `/propose` → receive breakdown + idempotency status → post Slack (or email) approval card with a link to the Approval Drawer. **Approval and all Xero writes stay in the agent** (control + audit). Make owns ingestion + notification — positioned as **agentic orchestration**, the exact tier their own workshop slide promoted over brittle zaps. Screenshot into the deck; 5 seconds of pitch: "payout statements arrive by email — Make catches them."

## 8.3 Main track: B01 (everything above)

---

# SECTION 9 — RISK REGISTER & PIVOT PLAN

## 9.1 Live-failure modes and mitigations

| # | Failure mode | Mitigation |
|---|---|---|
| R1 | Seed drift / Demo Company state changed | Idempotent one-command re-seed; final re-seed at 13:30 Sunday; all amounts hardcoded |
| R2 | £0.01 rounding mismatch (the classic) | Golden file is VAT-free; invariant checked in `planner.ts`; amounts sum exactly by construction |
| R3 | MCP write fails mid-demo (scope / 429 / transient) | All scopes granted at connect; golden path ≤10 calls vs 60/min budget; per-step audit allows narrated recovery ("step 2 of 3 committed — rerunning step 3"); fallback video on phone AND in deck |
| R4 | CSV parse failure | Deterministic hardcoded map; file locked at 18:30 Sat and never edited again |
| R5 | Venue wifi dies | Agent + MCP run locally; only Xero API needs internet → phone hotspot tested Sunday 13:30 |
| R6 | Lovable credit wall / build stalls | Core flow must also run from a minimal local page or CLI — Lovable is the face, never the spine |
| R7 | Payment semantics fight the Demo Company | Decision window in Spike 2 with the manual-journal alternative pre-approved (Section 2.3 note) |
| R8 | Judge Q&A ambush | Section 6.3 drilled out loud twice; honesty rules (6.4) prevent over-claim traps |

## 9.2 Pivot plan: LedgerMedic (executes ONLY if the 21:00 Saturday gate fails)

- **What:** pre-seeded miscoding (a £2,400 laptop booked to Office Supplies + a stuck £500 suspense balance) → agent diagnoses → drafts the correcting `create-manual-journal` with reversal and plain-English reasoning → human approves → suspense drops to £0.00, audit trail visible.
- **Why it's the pivot:** deterministic (no parsing at all), single write type, same Approval Drawer UI, same idempotency/audit code, same architecture story — **~70% of Saturday's code reuses** (estimate, 0.B). Win-Confidence 73 vs PayoutBridge 81 (internal estimates) — lower ceiling, far lower variance.
- **Rule:** the 21:00 decision is one-way. No flip-flopping. If pivoted, Section 6's script is rewritten Sunday 08:00 around "suspense to zero" as the payoff.

## 9.3 Score ledger (internal honesty — ESTIMATES, not external facts; see 0.B)

| Claim | Number |
|---|---|
| Honest internal score (both external LLM critiques) | **74** |
| Defensible after Upgrades 1–3 ship | **76–78** |
| Do not claim externally | 81 |
| Pivot floor (LedgerMedic) | ~73 |

---

# SECTION 10 — ORDERED BUILD TASK LIST FOR CLAUDE FABLE

Execute strictly in order. Each task has acceptance criteria. Do not start a task until the previous one's criteria pass.

1. **Project scaffold** — `package.json`, TS config, folder tree per Section 4. ✓ `npm run build` clean.
2. **MCP connectivity** — `src/xero.ts` connects via Custom Connection env vars; `list-organisation-details` returns the Demo Company. ✓ Org name printed.
3. **Seed script** — `seed/seed.ts` per Section 2.3: accounts, contact, £847 net deposit, BEFORE P&L snapshot. Idempotent (re-run = no duplicates). ✓ All objects visible in Xero UI; second run creates nothing new.
4. **Golden CSV + parser** — `data/marketplaceco-payout-0407.csv` per Section 2.4 (SYNTHETIC demo data); `src/parser.ts` hardcoded map → `CanonicalPayout`. ✓ Parsed output matches locked amounts; invariant holds.
5. **Planner** — `src/planner.ts` → `JournalPlan`; throws on invariant failure. ✓ Unit check: tampered CSV rejected.
6. **Three writes** — `src/xero.ts` executes the plan in order, captures Xero IDs. Payment-semantics decision locked here (Section 2.3 note). ✓ Human confirms in Xero UI: invoice, fees, clearing at £0.00. **This is Checkpoint Alpha (18:30).**
7. **Verification read (consensus #1)** — post-write clearing-balance query; expose in `/status`. ✓ Returns 0.00 after a clean run.
8. **Idempotency step-map (consensus #2)** — `src/idempotency.ts` + wiring; duplicate `/propose` returns `already-posted` with IDs. ✓ Second run of the same file performs zero writes.
9. **Audit trail (consensus #3)** — `src/audit.ts`; every call appended; `/status` returns trace-panel shape. ✓ audit.json shows full run with IDs.
10. **HTTP server** — `src/server.ts` with `/propose` `/approve` `/status` `/pnl`. ✓ curl walkthrough of the full flow works.
11. **PIVOT GATE 21:00** — one-screen demo achievable? Owner decision. If NO → switch to Section 9.2 backlog (reuse tasks 1–3, 8–10; replace 4–7 with miscoding seed + manual-journal flow).
12. **Lovable Approval Drawer** — prompt per Section 8.1, wired to endpoints. ✓ Full golden path clickable in the browser, payoff panel renders live £0.00 ✓.
13. **P&L split-screen** — AFTER snapshot post-run; `/pnl` feeds the before/after panel. ✓ Revenue 847→1,340 visible, commission line appears.
14. **Reset rehearsal script** — `scripts/reset-rehearsal.ts`: seed → propose → approve → verify, one command. ✓ Clean run end-to-end; run once Sat 22:30, once Sun 08:00.
15. **Fallback video** — 60–90s screen recording of the working flow. ✓ On phone + embedded in deck.
16. **(Sunday) Make scenario** — Section 8.2, 45-minute cap. ✓ Screenshot in deck.
17. **(Sunday) Submission package** — Section 7 fields finalised, submitted by 10:45. ✓ Confirmation received.

**Definition of done (the Perplexity threshold, verbatim):** one screen shows seeded file → human approval gate → three distinct Xero writes → live £0.00 clearing verification → before/after P&L. Everything else is garnish.

---

## Consensus upgrades (why the three headline features exist)

Both external critiques (Grok, Perplexity — internal honest score **74/100**, an estimate, not a judge's score) agreed on the same three highest-ROI upgrades. They are the backbone of Sections 2.5, 6, and 10:

1. **#1 — closed-loop verification read.** After the final write, READ the clearing account balance back from Xero and display a live **£0.00 ✓**. Turns "one clever journal" into "closed-loop accounting." Est. 1–1.5h. Lifts the 30% API pillar, the 20% Architecture pillar, and demo wow simultaneously.
2. **#2 — idempotency guard, demoed live.** File-hash check before any write; duplicate upload shows "Already posted — skipped (idempotent)." Est. 0.75–1h. Pre-answers "what happens on duplicate upload?"
3. **#3 — transaction-trace / audit panel.** Every CSV row mapped to its accounting action with returned Xero IDs and the idempotency key visible. Est. 2–4h. Lifts API depth, architecture, production credibility.

**Unanimous kill list:** live LLM schema inference on stage · refund/credit-note handling on the golden path · multi-platform recipe UI · tracking categories · PDF OCR · any "smart categorisation" not needed to zero the clearing account. **Recipe cache verdict:** a hardcoded Treatwell JSON column-map (~45 min) is a production signal worth having; an LLM fallback + "add new platform" UI is theater — cut it.

---

# ENRICHMENT ADDENDA (Sections 11–16)

> Folded in by the ENRICHER stage from the six lossless digests of all 18 repo docs. These sections ADD platform truth, judge-signal architecture, event logistics, honest score history, the locked demo design, and pitch research. Nothing here supersedes the locked build spec in Sections 1–10 **except** where a **⚠ superseded:** flag says so. Every new hedged claim is registered in §0.B.

---

# SECTION 11 — PLATFORM TRUTH (MCP reality · JAX boundary · Xero roadmap)

> Load-bearing for the Architecture (20%) pillar and Q&A. Sourced-but-unverified — see extended §0.B. Re-check the repo/issues on the day.

## 11.1 The MCP tool surface — exactly 51 tools (v0.0.17)

- Repo `github.com/XeroAPI/xero-mcp-server` (MIT); npm `@xeroapi/xero-mcp-server` **v0.0.17, published 2026-05-26**. "52" was a miscount — corrected to **51**.
- Decomposition: **25 list + 11 create + 10 update + 5 timesheet = 51.** By domain: invoicing 3 · quotes 3 · credit notes 3 · payments 2 · contacts 4 · bank transactions 3 · manual journals 3 · items 3 · tracking 5 · read-only reports 5 (P&L, BS, TB, aged AR/AP) · settings 3 · payroll leave read-only 6 · timesheets full-CRUD 8 (NZ/UK payroll only).
- **README tool names are STALE — do not code against the README.**
- **Golden-path tools that matter:** `create-invoice`, `create-bank-transaction`, `create-payment`; reads `list-bank-transactions`, `list-accounts`, `list-profit-and-loss`. **Manual journals are the one fully-CRUD, voidable doc type = the safest write surface** (kept in reserve for the LedgerMedic pivot).
- **Irrelevant to our golden path:** all payroll (6 leave-read + 8 timesheet), tracking (5), items, quotes, credit-notes.

## 11.2 The draft-invoice dead-end — what MCP CANNOT do

MCP **cannot**: approve `DRAFT → AUTHORISED` (**"the draft-invoice dead-end"**) · reconcile a bank line (no statement-line access) · attach files/receipts · email/send an invoice · void/delete anything (only payroll timesheets are deletable) · POs, batch payments, repeating invoices, expense claims, fixed assets, bank feeds, pay runs, AU/US payroll. `update-invoice` / `update-quote` / `update-credit-note` touch **DRAFT only** (already noted in §3.4). This is WHY our path uses `create-*` writes end to end and never relies on approve/send/reconcile.

## 11.3 Known broken / limited in v0.0.17 (issue numbers)

- **`update-bank-transaction` 400s in v0.0.17 — issues #206 / #184. Avoid it live.** Our path uses `create-bank-transaction` (unaffected) — do NOT improvise an update path.
- **No PKCE** (#203). · List tools **paginate ~10 records/page** (#193). · New Custom Connections **lose `accounting.journals.read`** under granular V2 (#175).

## 11.4 MCP-vs-REST gaps (fall back to REST only if forced)

- **RepeatingInvoices POST/PUT** exist in core REST since ~Aug 2022 (`developer.xero.com/documentation/api/accounting/repeatinginvoices`); only the MCP wrapper lacks them (`xero-mcp-server#113`).
- **`PUT …/Allocations`** (credit-note/overpayment allocation) is **absent from MCP** — raw `xero-node` only.
- Bank reconciliation, attachments, send-email = **REST-only**. None are on our golden path.

## 11.5 JAX (Just Ask Xero) — capabilities and the contractual boundary

- **Ships (labelled "beta" throughout, never formally GA, free until FY27):** invoice/quote create-edit-approve-send via chat (since Aug 2024; web/email/WhatsApp all regions, SMS AU/US/UK/NZ) · cash-flow/P&L/BS Q&A + 30-day projection + benchmarking (Syft-powered, all regions Dec 2025) · auto bank reconciliation "powered by JAX" (beta, high-confidence lines only) · web research (OpenAI-powered) · **JAX in Microsoft 365 Copilot shipped 1 Jul 2026** (Q&A/insights only at launch).
- **JAX CANNOT / is contractually banned from:** *"JAX is unable to give financial forecasts, financial advice or recommendations"* (Xero disclaimer) · cannot edit line items, void/delete invoices, or create invoices where US auto-sales-tax is on · operates only on **structured in-Xero data** (not messy external multi-doc onboarding) · **"doesn't run in the background — it needs your prompts to perform"** · contact-management via chat NOT supported · payment-chasing / reminder emails = **announced-only, unshipped through Jul 2026** · **no third-party plugin model — you cannot extend JAX.**
- **Our lane:** gross-up is accounting judgement over a messy external document → position PayoutBridge as **"the correcting-accounting layer JAX is contractually banned from."**

## 11.6 Native-feature overlap verdicts (HIGH = Xero already does it; LOW = white space)

| Candidate feature | Verdict | Note |
|---|---|---|
| Gross-up / clearing-account correction (PayoutBridge) | **LOW — white space** | No service/gig payout connector exists; JAX banned from the judgement (§11.5) |
| DeferDesk / revenue recognition | **LOW** | Rev-rec "Not in pipeline" since Mar 2023; re-confirmed live 4 Jul 2026 |
| DepositDesk (customer deposits) | **HIGH** (native, GA 15 Jun 2026, Stripe-powered) | Residual **LOW** carve-out: deposit-as-liability treatment |
| CreditSweep (bulk credit allocation) | **MEDIUM** | "Not planned short term"; New Credit Notes UI rebuild may absorb it |
| RetentionLedger (construction retentions) | **LOW** | Not planned as of May 2024 |
| TroncClear (tronc/tips) | **LOW** | Payroll-adjacency caution |
| PartialExemption / VAT | **LOW** | Open since Sep 2018 |
| BillOptimizer (AP prioritisation) | **HIGH US / MEDIUM UK** | LOW decisioning carve-out |
| Generic "chat with your books" | **HIGH — head-on JAX collision, AVOID** | — |

## 11.7 Anthropic–Xero partnership positioning ("build alongside JAX, not on top")

- Announced **Mar 2026** (`blog.xero.com/news-events/anthropic-xero-partnership-claude-ai/`, 27 Mar 2026): "Claude-powered insights within Xero, and the integration of Xero into Claude.ai … available in the coming months" = **NOT shipped as of 4 Jul 2026.**
- **Anthropic powers JAX itself.** Xero wants partners *alongside* JAX via **MCP + Agentic SDK + webhooks + App Store**; there is **no JAX plugin surface**.
- **Judge-resonant framing:** *"We build alongside JAX, not on top of it"* — an agent that helps Xero win, not a JAX competitor. (AFR, 14 May 2026, frames AI/Anthropic as a threat to Xero's outlook — being additive answers that anxiety.)

## 11.8 Xerocon / roadmap re-check + strategy context

- **Xerocon London 8–9 Jul 2026 (DevDay 7 Jul) — re-check the product map on 9 Jul 2026.** This ENCODE hackathon (4–5 Jul) is on Xero's official dev calendar. Xerocon Denver 19–20 Aug 2026.
- **3×3 strategy:** win **accounting / payments / payroll** in **US / UK / AU** — anything core to those in those markets risks collision.
- **API terms PROHIBIT training models on Xero API data** (inference is fine). Developer pricing (Mar 2026) = **5 tiers on connections + egress**; read-heavy agents pay more. **Smart Document Capture** (Hubdoc successor) launched 1 Jul 2026.

---

# SECTION 12 — ARCHITECTURE JUDGE-SIGNALS (mirror the on-site mentor)

> **Mentor = Ashish Nangia, Principal PM AI Products (on-site).** Signals sourced from his own public build **`github.com/anangia261089/Tax-Insights`** (`ARCHITECTURE.md`, Apr 2026) — an AI chat assistant on Xero data. His stack: **Next.js 16 · Claude API · Xero API (full OAuth 2.0) · Neon Postgres (Drizzle ORM) · iron-session · Vercel/Netlify.** Attribute as his personal build, not Xero policy (§0.B).

## 12.1 Eight named patterns to mirror (name them on the architecture slide, in his words)

1. **Per-tenant 5-minute in-memory Xero cache** — his explicit answer to the 60/min rate limit (mirror in `xero.ts`).
2. **Skills-loader:** domain knowledge as versioned **markdown `.md` skills** (`persona.md`, `irs-reference.md`, `formatting.md`, section files) composed into the system prompt and **prompt-cached via `cache_control`** — not hardcoded strings.
3. `persona.md` is literally **"JAX's voice, guardrails, hard rules"** — **"guardrails / hard-rules" is judge vocabulary**; use it.
4. **Per-tenant AES-256-GCM encryption** of stored chat/messages; token refresh isolated in a dedicated `xero-auth.ts`.
5. **Deterministic engine layer between Xero and the LLM** (`tax-engine.ts` categorises transactions) → **"the deterministic engine decides, the LLM only explains."** (This is exactly our `planner.ts` invariant story.)
6. A **"what Claude gives you free vs what we built" capability table** (reproduced in §12.2).
7. Streaming (SSE), follow-up-question suggestions, Recharts charts = his baseline AI-finance UI affordances.
8. He has a **"Planned: Agent Architecture"** section — an entry that is *already* agent-native lands ahead of his own roadmap.
- **Dual-persona UI to mirror:** `/dashboard` (small-business plain-English view) **+** `/ab/dashboard` (accountant, data-dense, with references + risk flags). PayoutBridge = plain-English Approval Drawer for the owner + audit/trace panel for the accountant.
- **His likely Q&A probe:** *"How do you stop hallucinated ledger writes?"* → **deterministic engine decides, LLM explains; human approves every write; idempotency keys.**

## 12.2 Capability table (mirror the "Claude native ✅ / what we built" two-column format)

| Claude / MCP gives you free ✅ | What PayoutBridge built on top |
|---|---|
| Raw `create-*` / `list-*` Xero calls | Deterministic parser → canonical `{gross, commission, fees, refunds, net}` model |
| One-shot LLM text generation | `planner.ts` that **refuses to propose books that don't balance** (invariant throw) |
| Stateless tool calls | `sha256(file)` idempotency step-map (`posted.json`) — crash-safe, per-step re-run |
| No audit surface | `audit.json` trail: every call → request → Xero ID → status |
| No verification | Post-write **verification read** proving Platform Clearing = £0.00 ✓ |

## 12.3 Scaffold state on disk (exact — what Fable inherits)

- **Prereqs present:** Node **v22.23.1**, npm **10.9.8**.
- **`package.json`:** name `xero-hackathon`, `"type":"module"`; deps **`dotenv ^17.4.2`, `xero-node ^18.0.0`**; devDeps **`@types/node ^26.1.0`, `tsx ^4.23.0`, `typescript ^6.0.3`**; scripts `dev` (`tsx watch src/index.ts`), `start`, `build` (`tsc -p tsconfig.json`), `typecheck` (`tsc --noEmit`), `check-env` (**identical to `start`** — only checks `XERO_CLIENT_ID`+`XERO_CLIENT_SECRET`, NOT `XERO_SCOPES`).
- **`.mcp.json`:** only `xero` wired — `npx -y @xeroapi/xero-mcp-server@latest` (**floating `@latest`, not pinned**), env `${XERO_CLIENT_ID}` / `${XERO_CLIENT_SECRET}` / `${XERO_SCOPES}`. **Make and Lovable are NOT pre-wired.**
- **`.env.example` default scopes:** `accounting.transactions accounting.contacts accounting.settings accounting.reports.read offline_access` (comment: "narrow to the minimum once the idea is locked").
- **`tsconfig.json`:** target ES2022, module/moduleResolution NodeNext (ESM), `strict:true`, outDir `dist`, rootDir `src`.
- **Env-pickup ritual:** `set -a; source .env; set +a` then relaunch `claude` from the same shell; verify `/mcp` shows **xero** connected. Add Make MCP: `claude mcp add --transport sse make "$MAKE_MCP_URL"` (URL `https://<zone>.make.com/mcp/api/v1/u/<TOKEN>/sse`, scope `mcp:use`). Lovable: `/plugin install lovable@claude-plugins-official` (OAuth on first tool call). `src/index.ts` is a **stub** (credential-presence check only — not the feature).

---

# SECTION 13 — EVENT DETAIL (people · schedule · prize · venue)

## 13.1 Day-1 schedule (PLATFORM.md, AUTHORITATIVE, Europe/London)

| Time | Item | Who |
|---|---|---|
| 10:00 | Doors open & registration (barista 10:00–14:00) | — |
| 10:30 | Welcome & introductions from Xero | Corey Leung & Madhu Gupta |
| 10:45 | Overview of the Xero API | Sharon Ball |
| 10:50 | Overview of Make | Sonia Calvo |
| 10:55 | Overview of Lovable | TBC |
| **11:00** | **Hacking begins** — ⚠ CONFLICT: photo slide + HACKATHON.md say **12:15**; PLATFORM.md (authoritative) says **11:00**. Treat as "start as early as you're set up." | — |
| 12:00 | Lunch | — |
| 13:00 | Mastering the Xero AI Toolkit | Regan Ashworth |
| 13:30 | Scaffolding for Small Business | Annie Terry |
| 14:00 | Vibecoding 101 | Regan Ashworth |
| 14:30 | Make Deep Dive | Sonia Calvo |
| ~14:15–14:45 | Lovable deep dive (⚠ time disputed — Adam's slide says **2:45pm**) + **"Pitch Perfect" workshop 14:45**; **100 free Lovable credits handed out at the 2:45pm workshop** | Adam Oskwarek |
| **16:00** | **Checkpoint 1 — Project Creation** (must be on the platform with a project = the hard deadline) | — |
| 16:30 | Brain Break: LEGO Builder Challenge | — |
| 19:00 | Dinner | — |
| 21:00 | Brain Break: Slot Car Racing | — |
| 22:00 | Checkpoint 2 — mid-hack submission / Late-Night Snacks | — |
| 23:00 | Venue closes (reopens 08:00 Sun) | — |

**Day 2:** 08:00 breakfast/building · **11:00 submissions due** · 14:45 pitches (3-min) · **15:00 happy hour** · 15:30 awards · 16:00 hack ends. (The live "Events" widget separately showed Make deep dive 13:45 and Scaffolding 14:45 — "schedule is fluid, check the live widget.")

## 13.2 People (name → role)

Madhu Gupta — GM & VP Product, Developer Ecosystem · Annie Terry — Global Head of Platform Marketing, Xero Developer (workshop: Scaffolding for Small Business) · Regan Ashworth — Head of Ecosystem Governance (workshops: Xero AI Toolkit + Vibecoding 101) · **Sharon Ball** — Developer Evangelist / Sr Ecosystem Governance Analyst, does app certification (workshop: Overview of Xero API; **photos misread her badge as "Wall"/"Bell" — correct name is Sharon Ball**) · Corey Leung — Developer Marketing Manager, Ecosystem · **Ashish Nangia — Principal PM, AI Products (mentor — see §12)** · Robin Blackstone — API Support Team Lead · Matt Ramsay — API Compliance Analyst · Anthony Beaumont — CEO, Encode Club · Sonia Calvo — Community Events Manager, Make (workshop: Make Deep Dive) · Adam Oskwarek — Ambassador, Lovable (workshop: Lovable deep dive). **Judges = Xero API / Product / Eng staff.**

## 13.3 Prize discrepancy (unresolved)

- **$9,000 total / $3,000 each** — per Luma, CompeteHub, and the official PLATFORM.md dashboard.
- **£9,000 total / £3,000 each** — per the Encode programme page (HACKATHON.md) and on-site photo slides.
- Both HACKATHON.md and PLATFORM.md say **"confirm GBP vs USD on the day."** Speak it as "$3,000" with the currency caveat.

## 13.4 Venue / logistics

Encode Hub, **41 Pitfield St, London N1 6DA, UK**; hosts Encode Club × Xero; partners **Xero Developer · Lovable · Make · Replit** (Replit is a 4th partner, platform-confirmed). **Wi-Fi SSID "encode hub"**; hashtag **#XEROHACKATHON**; hours 10:00–17:00 BST; Discord **#hack-help** (join via QR); app certification available on-site; registration approval-required via Luma `luma.com/vvvnk7bs`; programme `encodeclub.com/programmes/xero-hackathon`. Extras: PS5, brain-break games, Sat-night DJ, energy-drink popup.

## 13.5 Submission form fields (photo 3707 — net-new detail vs §7)

Basics: (1) project details · (2) dev platform used (Lovable/Make/Claude) · (3) link to presentation (Google Slides/Canva) · (4) demo video (**recommended**). **3 required Xero questions:** (1) How did your project use the Xero API? (2) Which endpoints + methods? e.g. `POST /Invoices`, `GET /Contacts`. (3) Which OAuth 2.0 scopes? e.g. `accounting.invoices`, `accounting.contacts`.
Also: the **Xero AI Toolkit (`developer.xero.com/ai`) is "Powered by Xero's MCP Server, CLI, OpenAI Agents SDK and LangChain"** (named agent frameworks worth citing in the submission).

---

# SECTION 14 — SCORE HONESTY (win-confidence as a RANGE)

> Extends §9.3. The robust signal is the **ranking order**, not any absolute number. **Quote ranges, never a point.**

## 14.1 Win-Confidence history (68 → 81; per-run provenance)

- **68** = Run 1 (`wf_6828d781-ce6`, mixed-model; 43 agents, 2.34M tokens, ~30 min) — idea then named **GigLedger**.
- **81** = Run 2 (`wf_e9450746-52c`, all-opus, opus-max synth; 73 agents, 3.57M tokens, ~49 min) — renamed **PayoutBridge**.
- **81, converged** = TOP3-OPTIMIZED variation pass — no variant beat baseline by ≥2; its genuine measured gain was small: **avg 75.3 → 76.3 (+1.0)** (only LeakSeal improved 72→75; PayoutBridge & LedgerMedic converged at baseline).
- **84–86** = MAX-BRIEF (interrupted Run 3, `wf_ac040e02-91c`, stopped ~1 min into Wave 1) — a **projected hypothetical, self-flagged UNVERIFIED. Never present 84–86 as achieved.**
- **Cross-run uplift sequence:** GigLedger/PayoutBridge **68→81**, LedgerMedic **66→73**, RevenueGuard/LeakSeal **58→72**. **Ranking ORDER was stable across both runs (payout-recon #1, LedgerMedic #2) — that consistency is the robust signal.**

## 14.2 Red-team caveats that SURVIVED (carry into the pitch)

- The moat's F5 does **not** fully exclude Synder-adjacent overlap (Synder indirectly reconciles Stripe/PayPal-routed payouts; JAX auto-reconciles the raw bank line).
- Multi-format schema inference is the real fragility (conservative run scored that factor 47) → **the demo MUST pin to ONE seeded format.**
- The clearing/settlement **pattern itself is not novel — A2X does it for ecommerce**; "no connector reads service/gig schemas" remains an assertion of absence, not positively proven.
- A claimed 4th write (refund credit-note) adds risk beyond the 3 demoed — keep it off the golden path.

## 14.3 Cross-run calibration-drift warning

- All-opus rescored the same ideas **+7…+14** vs the mixed run → **rule: quote score ranges across runs; do NOT quote 81/73/75 as if both runs agree.**
- **Verifier trap (real):** a fresh-context verifier declared the optimization baselines "fabricated/inflated" — **FALSE verdicts caused by the verifier reading the repo before Run-2's doc existed.** TOP3-OPTIMIZED's Appendix-A verifier similarly rated the 81 sub-scores FALSE. **Treat those verifier passes as internally disputed/unresolved, not clean confirmations. Always check a verifier's evidence before accepting a FALSE verdict.**
- **Ollama 2nd-opinions run systematically higher (optimism bias)** — good for spotting *underrated* ideas, useless for absolute levels.
- Method caveat: "integer 0–100 sub-scores encode **judgement, not measurement** — calibrated ranking, not a true probability." Generic variation is exhausted at ~81; only mechanism-level engineering has remaining headroom.

---

# SECTION 15 — DEMO-DESIGN LOCK (90-second 4-beat + seeding reconciliation)

> Reconciles the MAX-BRIEF demo lock with the locked spec in §2.3 / §2.4 / §6.1. **BUILD.md's VAT-free amounts WIN; the HARD RULE is absolute.**

## 15.1 The 90-second 4-beat demo core (inside the 3-min pitch)

1. **Hook (pre-seeded):** the agent scans the Demo Company bank feed live, finds the net deposit, flags on screen — "booked as net revenue → turnover understated, commission costs invisible." BEFORE-P&L shown.
2. **Input:** upload the ONE synthetic marketplace statement; a decomposition table appears (gross / commission / fees / VAT / refunds / net).
3. **Action (human-in-loop):** one-click approve → the gross-up posts live = gross sales invoice + commission/fee journal + payment clearing the deposit. **Three distinct write types, idempotency keys.**
4. **Payoff:** the clearing account hits **£0.00 on screen** + AFTER-P&L side-by-side with BEFORE. "Wrong books → right books, self-evident to an accountant judge."

## 15.2 Reconciliation with the locked spec (conflicts resolved)

- **Amounts:** the §2.3/§2.4 VAT-free set (**£1,340 / £445.90 / £47.10 / £847.00**) WINS. **⚠ superseded:** the MAX-BRIEF seed line "MARKETPLACE PAYOUT — **£1,234.56**" — do NOT use; seed the **£847.00** net deposit per §2.3.
- **Marketplace branding (HARD RULE):** the demo statement must carry a **synthetic FICTIONAL marketplace** name (e.g. "MarketplaceCo"), NOT Treatwell. **⚠ superseded:** any "Treatwell (Marketplace)" contact / `TW-PAYOUT-0407` token in the §2.3/§2.4/§0.C demo fixtures — swap the brand token to a neutral placeholder for the shared demo. **Treatwell remains ONLY as sourced market-research context (§0.C, §16).** The accounting and every amount are brand-independent.
- **Schema inference stays OFF the golden path** — deterministic recipe for the one seeded format only (consensus kill-list, §10).

---

# SECTION 16 — RESEARCH AMMO (sourced market stats · incumbent one-liners)

> Additive to §1.5. Pitch-ready, source-bearing. Flags carried from the research verifier — do NOT launder into fact.

- **A2X / Link My Books / Synder are ECOMMERCE-ONLY.** A2X (13,000+ businesses): Amazon, Shopify, eBay, Etsy, Walmart, PayPal. Link My Books (UK): Amazon, eBay, Shopify, Etsy, Walmart, WooCommerce, TikTok, Square. Synder: 30+ ecommerce + Stripe/PayPal/Square. Verifier verdict: **SUPPORTED — "no service/gig payout connector exists."** (a2xaccounting.com/integrations · linkmybooks.com · synder.com/integrations)
- **A2X has run per-payout journals since 2014** — mature incumbent; differentiate on the connector-free / service-gig angle, not "another A2X."
- **Booke AI** (AI bookkeeper) + **XBert** (24/7 AI audit, flags 80+ data-quality issues): verifier flagged the "flag-only" framing as **OVERSTATED** (XBert markets "auto-resolve"; Booke does auto categorisation/reconciliation). The narrower surviving gap = **auto-posting an audit-trailed correcting manual journal.**
- **Salon-platform dashboards (Phorest/Fresha/GlossGenius) live outside the ledger** and never tie to marketplace-commission economics. Phorest syncs financial totals daily at 1am; Fresha syncs at mapped-account/journal level — neither gives per-booking commission detail. Treatwell has **zero Xero integration** (absent from Xero's salon collection) — the cleanest no-incumbent-connector story.
- **Service/gig scale (essentially unserved):** UK Uber private-hire **381,092 licences** (Apr 2024, Zego); Deliveroo **~100,000 couriers**; Fresha **140,000+ partners**; Airbnb **5M+ hosts**; Fiverr **~3M+ sellers**; Upwork **18M+ freelancers**; UK gig economy **~4.4M** weekly platform workers; global online gig workers **154M–435M** (World Bank).
- **Platform fee drag:** Amazon referral 8–15%; Etsy ~12–20% all-in; Uber Eats UK 30% (13% pickup); Deliveroo up to 35%.
- **UK / US market baseline:** UK ~**5.5M+** private-sector businesses (ONS 2024 — the "5.7M" figure was verifier-flagged high; say "~5.5M+"); SMEs = 99.8% of businesses / 60% of employment / 52% of turnover (£2.8tn) (gov.uk BPE 2025). US: **36.2M** small businesses = 99.9% of firms (SBA, Jun 2025).
- **Xero depth:** 4.4M subscribers FY25 = **ANZ 2.6M + International 1.8M** (UK largest international market); revenue **$2.1bn (+23%)** (ASX FY25); marketing rounds to "4.2M".
- **Confidence-gap hook (strong line):** 95% of owners feel confident on cash flow, yet **90% faced unexpected cash-flow issues and 76% say it hurt the company** (Relay / QuickBooks 2025) — "confident but wrong."
- **Past-winner pattern:** XDHax 2018 winners (Curve, Xero Huginn, Exsalerate) all filled a **workflow gap around the API, not another dashboard** (devblog.xero.com).
- **⚠ CARRY THE FLAGS — do NOT cite as fact (see §0.B):** duplicate-invoice "1.29% / $2,034" = **FABRICATED**; payments-fraud "76% hit / 17% use AI" = **UNCONFIRMED**; "~864,000 HMRC landlord letters" = **UNSUPPORTED**; "Custom Connection M2M is free" = **UNSUPPORTED blanket claim** (~£5/mo per org in production; free ONLY on the Demo Company).

---

*Sources referenced throughout: [Grok critique](https://grok.com/share/c2hhcmQtNA_0bb61135-db9b-4dad-922c-c8b98fd2eacc) · [Perplexity critique](https://www.perplexity.ai/search/critique-request-payoutbridge-Xjf7bDNSQsW4egrbqCondA) · [Xero Prompt Library](https://github.com/XeroAPI/xero-prompt-library) · [Xero MCP Server](https://github.com/XeroAPI/xero-mcp-server) · [Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/) · [Xero API Explorer](https://api-explorer.xero.com/) · Encode Dashboard PDF · venue slides (`Pictures/`) · repo research (`docs/`). ChatGPT/DeepSeek/Gemini/Claude/Z.ai critique shares were login-walled or empty and could not be read — if their text is pasted later, fold novel points into Sections 6.3 and 9.1. Backbone: `PAYOUTBRIDGE-MASTERPLAN.md`. Reconstructed by the PATCHER stage after the COMPOSER stage failed to persist BUILD.md; integrity flags in Section 0.*
