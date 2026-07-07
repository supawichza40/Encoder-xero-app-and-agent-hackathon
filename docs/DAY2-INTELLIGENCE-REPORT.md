# Xero Hackathon Day 2 — Complete Intelligence Report (5 July 2026)

> Source: [Notion — Xero Hackathon Day 2 Complete Intelligence Report](https://app.notion.com/p/Xero-Hackathon-Day-2-Complete-Intelligence-Report-5-July-2026-30fee674da4e40cdad5de80d31d5e76c),
> compiled from three meeting recordings: Finalist Pitches & Event Wrap-Up (13:56–14:26), Demo Pitches (14:28–14:58), Customer Compass Demo (14:59–15:02).
> Winners announcement source: organizer Discord message, 5 July 2026.

## Official results

122 participants · 61 submitted projects · 3 track winners:

| Track | Winner |
|---|---|
| 🏆 Productivity Powerhouse | **Reel Take** (RealTake) |
| 🏆 The Vibe Integrator | **Kite** |
| 🏆 The Cash Flow Accelerator | **Customer Compass** |

Organizer post-event notes: developer accounts + Xero AI Toolkit stay open; certification process encouraged; Discord stays open.

## 1. Event Context & Logistics

- Xero-themed hackathon at ENCODE Hub, wrapping up after "a day and a half" of building.
- A highlight reel recapped the event before the finalist pitches; raffle prizes: Raspberry Pi starter kit, Meta Ray-Ban glasses, a printer.
- **Pitch format: 3 minutes + 1 minute judges' questions.**
- Pre-pitch logistics were chaotic — organizers struggled to locate finalist teams/submissions ("Claim back", "Customer Compass", "Risk-wise" called out; one submission was buried in email and hard to find; backups queued when teams didn't respond).

### Competition categories (3 awards)

| Category | Definition |
|---|---|
| **Powerhouse** | Best app or agent that automates manual small-business workflows |
| **Vibe Integrator** | Best integrator/workflow-automation tool using an agent to monitor a second app and intelligently sync data into Xero |
| **Cash Flow Accelerator** | Best growth app or agent that uses Xero payments data to identify and act on revenue opportunities for small businesses |

### The organizers' headline observation

> "It seems like you know all of this is agentic AI, all of it. You just set up an agent, let it do the work. Most of the thing that wins from what I'm seeing in the hackathon is agentic AI. The reason for it is just the popularity of this right now."

## 2. Finalist Pitches (Recording 1)

### Pitch 1: RealTake (Arad & Katie) — Box office receipt automation — 🏆 WON Productivity Powerhouse

**Problem:** small-to-medium movie distributors receive messy, inconsistent box office receipts from cinemas/exhibitors; formats vary constantly; exhibitors often submit only totals, losing per-ticket-type granularity — reconciliation is painful.

**Solution — a two-scenario Make.com pipeline:**
1. **Box Office Data Extraction:** mailbox webhook → on new email, extracts exhibitor/customer/date-range, runs **Anthropic (Claude)** on the attached file, stores structured records in **Supabase**. A successful run was shown live from Make history.
2. **Deal Mapping & Billing:** matches every box office record to a **deal** (e.g. 70/30 first-week split), processes records, generates insights.

**Xero integration & outcome:** after user confirmation, data is uploaded into Xero under the relevant **contact**. Deal-adjusted billing demoed: **£100,000 gross → £52,000 invoiced** after per-record deal splits. Invoices incl. tax info previewed and sent — removing manual reconciliation and billing.

**Q&A/moments:** ran out of time mid-demo; a judge jokingly asked "How does the Xero part work?" as "a healthy hand" to let them continue. Judge praise: **full integration pipeline onto the sponsor platform**.

### Pitch 2: Project Treasure — Automated late-fee charging

- Persona: Pascoe's Boat Yard — like **95% of UK small businesses**, <10 staff. Their ToS allow daily-accrued interest but the manual process (track overdue → check BoE rate → raise in Xero → update daily → keep telling the client) means it never happens.
- **1,000+ votes** on Xero's product-ideas tool for automated late fees.
- Upload your ToS → **GPT-4.5** extracts the late-payment policy (falls back to statutory policy). Overdue Xero invoices pulled; eligible ones get the policy applied; generated late-fee invoices push into the Xero invoice list, each referencing the original invoice.
- Q&A: recalculation currently manual. Roadmap: auto-detect overdue, email/Outlook alerts, fully automated application.

### Pitch 3: Don (Timothy) — Autonomous credit controller

- **~£26bn** late payments outstanding at any moment (UK); late payments **close 38 UK businesses/day**. Example business: £17,000 stuck overdue.
- Key insight: *every existing tool automates the easy part — the reminder. The hard part starts when the customer replies* ("half now, half later?") because that takes judgment.
- Don chases invoices; on reply, **classifies the response against the company's payment policy**: within policy → agrees, **updates the invoice in Xero**, writes an auditable history into notes; outside policy → **escalates to a human**; still unpaid → keeps chasing.
- Reads the **aged receivables report** to classify repeat offenders. Split payments currently handled as part-payment.

## 3. Demo Pitches Session (Recording 2) — 5 products

### AI Business Pet
Interactive AI pet personifying the business's financial health; 30 metrics pulled live from Xero + market data; gamified tasks; conversational AI. Q&A weak spots: subjective "trust score" derivation unresolved; validation = personal experience.

### TraceSoft
- **57% of 500 surveyed UK owners lose £3,000–£15,000/month** on un-invoiced work; **~£11bn/year** UK-wide.
- Connect Xero → scans for un-invoiced quotes/bad debts → dashboard drafts invoices into the Xero sales page. **Human-in-the-loop by design** — never auto-sends.
- **Voice call agent** phones the client who owes money, asks when they'll pay, logs responses; webhook gates the call flow. Solvency screening via **HMRC + Companies House**.
- Q&A: webhooks via Make (acknowledged as needing enhancement); supports both direct Xero APIs and MCP server route.

### Kite ("Bruno" the agent) — 🏆 WON The Vibe Integrator
- Tagline: *"The money work minus the mess."* Persona: Alice, small independent coffee roastery.
- Stack: **Xero + Make + AI agents + Gmail + Slack**. Ask Bruno anything → ranks top invoices to chase → drafts pre-populated email → send via Gmail. Make pushes cash-flow alerts into Slack.
- **Two architecture routes:** Xero MCP layer (toolset Bruno calls) or Make automation.
- Vision: Bruno proactively volunteers recommendations. Next: payroll APIs, invoice-paid webhooks, Stripe.
- **Hit technical issues right before presenting — recovered using the recorded demo.**
- Q&A: bills (not just invoices) acknowledged as roadmap; real Xero webhooks likely not used under the hood (Make abstraction) — flagged for enhancement.

### ShawMill (Ivan & Sebastian Topchiy)
On-the-spot mobile invoicing for tradespeople; mascot Skip the grasshopper; missing-fees engine scanning Xero invoice history for patterns; Telegram bot. Q&A: challenged hardest — "Xero already has a mobile app for this, what's different?" — conceded "a bit ambitious". Pattern logic deliberately **hard-coded, not AI** ("didn't trust AI"). Built essentially solo.

### Twice ("Risk-wise") — Economic shock simulator
- Founder's own business failed during COVID. "War room" simulation for shocks (wars, commodity spikes, tax changes).
- Niche: London food wholesalers ("Mr. Marco"), **4–6% margins**; commodity shocks hit P&L only **2–3 months later**.
- **6 agents: 1 LLM + 5 rule-based** (explicit token-efficiency design). LLM agent auto-labels high-exposure products from Xero cash flow data. Risk analysis in **60 seconds**, re-runs daily, alerts with tailored actions.
- Q&A: deliberately narrowed from "all businesses" to one niche cluster.

## 4. Customer Compass Demo (Recording 3) — 🏆 WON The Cash Flow Accelerator

- Positioning: *"Xero showed you numbers, but nobody told you what to do about them."*
- Target: small service businesses — clients going quiet, underpaying, underpriced jobs, customers who overstay their welcome. **Not** an invoice-chaser: a proactive read on cash flow, judging every customer's true value.
- **Connected live to a Xero demo company mid-presentation**, pulling real data.
- Dashboard: cash conversion lifecycle, **revenue at risk**, **business runway**; four sections — Overview, **Actions This Week** (the "key bit": dangerous customer behaviors, contracts to renegotiate because servicing time exceeds pay, segmented by revenue contribution), Ideal Customer Profile, Business KPIs (incl. MRR variants).
- Closed exactly on time. Q&A on how recommendations are generated was cut off by the recording end (unresolved).

## 5. Cross-Cutting Insights & Patterns

1. **Agentic AI won the day** — organizers said it outright.
2. **Everyone attacked SMB cash flow** — 7 of 8 products; differentiation = *where in the lifecycle* they intervene (before invoice / chase time / penalty time / strategic layer).
3. **"Automate the easy part" is table stakes; winners automate judgment** (Don's reply-classification; Customer Compass's "nobody told you what to do").
4. **Human-in-the-loop as a trust feature, not a limitation** (TraceSoft, Treasure, Don, ShawMill).
5. **Two integration architectures dominated: Make vs Xero MCP.** Make was fastest to demo but repeatedly exposed in Q&A — three teams admitted Make abstracted webhooks they should own. Judges consistently probed exactly this.
6. **Niching down beats generality** (Twice → wholesalers; RealTake → movie distributors; ShawMill → tradespeople). The team challenged hardest (ShawMill) overlapped an existing generic Xero feature.
7. **Recurring judge questions to prepare for:**
   - "How does the Xero integration actually work under the hood?"
   - "Did you use real Xero webhooks or did Make hide that from you?"
   - "How is your AI trained / how are metrics or scores derived?"
   - "How is this different from what Xero already does?"
   - "How did you validate the problem?"
   - "What about bills, not just invoices?"

## 6. Every Statistic Cited

| Stat | Source pitch |
|---|---|
| 57% of 500 surveyed UK owners lose £3,000–£15,000/month on un-invoiced work | TraceSoft |
| ~£11bn/year lost UK-wide to un-invoiced work | TraceSoft |
| ~£26bn late payments outstanding at any moment (UK) | Don |
| Late payments close 38 UK businesses/day | Don |
| £17,000 stuck in overdue invoices (example) | Don |
| 95% of UK small businesses <10 staff | Project Treasure |
| 1,000+ votes for automated late fees on Xero product-ideas | Project Treasure |
| £100,000 gross → £52,000 billed after deal splits | RealTake |
| 4–6% margins for wholesale food traders | Twice |
| Commodity shocks hit P&L after 2–3 months | Twice |
| 6 agents (1 LLM + 5 rule-based); analysis in 60s, daily re-run | Twice |
| 30 metrics tracked from Xero | AI Business Pet |
| 3-min pitch + 1-min Q&A | Event rules |

## 7. Winners vs the stated mark scheme (analysis)

Stated rubric (from day-1 slides, recorded in `archive/docs/HACKATHON.md`): **50% Xero Connection · 30% API Integration · 20% Architecture.**

- **50% Xero Connection — held, but reinterpreted.** All three winners solve a real SMB problem with Xero as the **system of record** — yet in every winner the intelligence lives *outside* Xero (Make, Claude, Supabase, Gmail, Slack). "Xero central" in practice meant *real data lands in Xero as the outcome*, not *only Xero is used*.
- **30% API Integration — diluted.** Judges probed hard ("real webhooks or did Make hide it?") and three teams — including winner Kite — admitted Make abstracted the webhooks. Honest admission + roadmap was forgiven. One demonstrated real write beat claimed API breadth.
- **20% Architecture — barely enforced.** Winners were Make pipelines and a recorded-demo fallback; none showed production-grade reliability. The *trust story* (human-in-the-loop, policy-bounded autonomy) substituted for actual architecture.
- **What actually discriminated (unwritten):** track-sentence fit (each winner is nearly a verbatim instantiation of its track's one-line definition), agentic-AI framing, tight niche + named persona, sourced problem statistics, one live wow moment (Make run history; live Xero connect mid-pitch), and 3-minute comprehension — all as predicted by the "unwritten multiplier" section of our own day-1 strategy doc.
