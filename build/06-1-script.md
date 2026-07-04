> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 6.

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
4. **Demo video (recommended):** 60–90s screen recording of the golden path — doubles as the live-failure fallback

**The Xero questions (REQUIRED — 3 questions on the submission form)**
1. **How did your project use the Xero API?** "Corrective gross-up accounting for marketplace payouts: reads locate the net bank deposit and baseline P&L; the agent proposes a clearing-account gross-up; on human approval it posts a gross revenue invoice, fee expenses, and the clearing payment; a post-write verification read proves the clearing account nets to £0.00; before/after P&L is rendered from live Xero data."
2. **Endpoints:** `POST /Invoices` (create-invoice) · `POST /BankTransactions` (create-bank-transaction) · `POST /Payments` (create-payment) · `POST /Contacts` (seed) · `GET /BankTransactions` · `GET /Accounts` · `GET /Reports/ProfitAndLoss`
3. **OAuth scopes:** `accounting.transactions` (or granular `accounting.invoices` + `accounting.banktransactions` + `accounting.payments`) · `accounting.contacts` · `accounting.settings` · `accounting.reports.profitandloss.read`

---

# SECTION 8 — PARTNER PRIZE SURFACES (one build, three prizes)

