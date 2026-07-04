# Xero Commercial Portfolio Map (as of 4 July 2026)

> **Purpose:** Single reference so the hackathon team never builds what Xero already ships or has announced.
> **Method:** Synthesis of five Wave-1 research reports (core features, SKUs/plans, acquisitions, AI/JAX/MCP, roadmap). No new research. Every material claim carries its source URL or an `UNVERIFIED` tag from the inputs. `VERIFIED` = live URL fetched 4 Jul 2026; `UNVERIFIED` = prior knowledge, re-check before relying on it.
> **⚠️ Warning — Xerocon London is 8–9 Jul 2026 (days after this map), preceded by DevDay 7 Jul.** Product announcements are promised. **Re-check this map on 9 Jul 2026 before locking in an idea.** Smart Document Capture and M365 Copilot both landed 1 Jul 2026, so the surface is moving fast.

Boundary items resolved using the freshest reports (Report 4/5 override Report 2a priors) — see conflict log at the end of §8.

---

## 1. Core product features

Consolidated inventory of Xero's native business-edition features. Where a report marked an item `UNVERIFIED this session`, that tag is preserved.

| Feature | What it does | Status | Source |
|---|---|---|---|
| Invoicing (incl. online payments) | Send invoices; "accept online invoice payments" in ALL UK plans incl. entry Ignite (20-invoice cap on Ignite) | GA, all UK plans | VERIFIED — xero.com/uk/pricing-plans/ |
| Quotes | "Send invoices and quotes" in every UK plan | GA, all UK plans | VERIFIED — xero.com/uk/pricing-plans/ |
| Bank reconciliation | "Reconcile transactions" — included Grow+; *(optional)* on Ignite | GA | VERIFIED — xero.com/uk/pricing-plans/ |
| Auto-reconcile transactions | AI/automated reconciliation ("powered by JAX", see §4) | **Beta** — on every UK plan as "Auto-reconcile transactions (Beta)"; ALSO £3.50/mo add-on (Ignite) | VERIFIED — xero.com/uk/pricing-plans/ |
| Find & Match (1-to-many bank matching) | Match one statement line to many invoices/transactions & vice versa | Native | UNVERIFIED this session — central.xero.com/s/article/Find-and-match-bank-transactions |
| Bank rules / cash coding / suggested matches | Reconciliation automation | Native, long-standing | UNVERIFIED this session |
| Smart Document Capture | AI bill/receipt/statement capture; "automate bill entry and track bills" (successor to Hubdoc branding, see §3) | GA — in ALL US/UK plans; **launched 1 Jul 2026** ("most markets"; AU/NZ beta) | VERIFIED — xero.com/uk/pricing-plans/ ; blog.xero.com/product-updates/smart-document-capture/ |
| UK VAT / MTD VAT | "Submit VAT returns to HMRC" | GA, all UK plans | VERIFIED — xero.com/uk/pricing-plans/ |
| MTD for Income Tax (ITSA) | Quarterly updates + final declaration to HMRC; Apr 2026 mandate (sole traders/landlords >£50k) | **GA — "filing capability now available to everyone"**; all UK plans; multi-business shipped | VERIFIED — blog.xero.com/product-updates/making-tax-digital-for-income-tax/ ; blog.xero.com/product-updates/mtd-it-multi-business-is-here/ |
| CIS (UK) | Subcontractor CIS calcs/reports all UK plans; **contractor** CIS filing = £5/mo add-on | GA | VERIFIED — xero.com/uk/pricing-plans/ |
| Payroll (UK/AU) | Bundled seats by tier (UK: Ignite £1.50/person, Grow 1, Comprehensive 5, Ultimate 10). US payroll = Gusto (see §3/§5) | GA (UK/AU) | VERIFIED — xero.com/uk/pricing-plans/ |
| Expenses & mileage | Plan-gated seats (Grow 1, Comprehensive 5, Ultimate 10) | GA | VERIFIED — xero.com/uk/pricing-plans/ |
| Projects | Time/cost tracking; Ultimate 10 users | GA, top-tier gated | VERIFIED — xero.com/uk/pricing-plans/ |
| Multi-currency | Comprehensive & Ultimate only (UK) | GA | VERIFIED — xero.com/uk/pricing-plans/ |
| Reporting / dashboards | Real-time reports, graphs, customisable dashboards (basic on Ignite) | GA | VERIFIED — xero.com/uk/pricing-plans/ |
| Analytics (powered by Syft) | Cash-flow forecast 30/60/90/180 days by tier; Ultimate adds KPIs/ratios, benchmarking, scorecards. **Delivered by Syft, replacing legacy Analytics Plus** (see §3) | GA, tier-gated | VERIFIED — xero.com/uk/pricing-plans/ |
| Bill payments (native) | Domestic online bill/payroll payments — 5/10/15/mo by tier; £0.20/payment Ignite; international on Comprehensive/Ultimate. US = Melio-powered (see §3) | GA | VERIFIED — xero.com/uk/pricing-plans/ |
| JAX AI assistant | Conversational AI Q&A + task automation ("superagent") — full matrix in §4 | Beta label throughout | xero.com/us/ai-in-accounting/jax/ |
| Xero Simple | Sub-Ignite UK plan for MTD-IT sole traders/landlords (beta from Apr 2025) | Shipped as plan | VERIFIED — blog.xero.com/product-updates/introducing-xero-simple/ |
| eInvoicing (Peppol) | UK Peppol shipped ~Dec 2025; AU/NZ/SG long-standing (powered by Tickstar, see §3) | UNVERIFIED this session |
| Deposits on invoices | Request a deposit / prepayment on an invoice; separate deposit due-date field; Stripe-powered collection | **GA — shipped all AU/NZ/UK/CA/SG/US orgs (admin 15 Jun 2026)** | VERIFIED — productideas.xero.com/.../44960308 (see §5) |
| Fixed assets, tracked inventory, budgets, purchase orders, bills, batch payments, credit notes, prepayments/overpayments, contacts/statements/smartlists, repeating invoices, invoice reminders | Long-standing native modules | Native | UNVERIFIED this session |
| Tap to Pay; GST/BAS (AU); US sales tax; 1099/W-9; Xero Me/mobile | Regional/mobile features | Native | UNVERIFIED this session |

**Note on classic reminders vs JAX chasing:** Classic (non-AI) invoice reminders are the shipped feature. JAX-drafted payment chasing is announced-only (see §4/§7).

---

## 2. Plans, SKUs & paid add-ons

Scraped 4 Jul 2026. All headline prices are **promo** (80% off first 3 months); implied list prices are UNVERIFIED estimates.

### US — Early / Growing / Established (VERIFIED — xero.com/us/pricing-plans/)
Legacy lineup retained (NOT the Ignite lineup).
- **Early $25/mo:** 20 invoices, 5 bills, bank rec, Smart Document Capture, W-9 + 1099, sales tax, 30-day forecast, online bill payments (free domestic ACH + cross-border, Melio-powered)
- **Growing $55/mo:** unlimited invoices/bills, auto-reconcile (Beta), 60-day forecast, dashboards, scorecards
- **Established $90/mo:** + multi-currency, projects, expenses/mileage, 180-day forecast, KPIs, benchmarking, international bill payments
- Bill pay at every US tier = **Melio-powered**.

### UK — Ignite / Grow / Comprehensive / Ultimate (VERIFIED — xero.com/uk/pricing-plans/)
**£3.20 / £7.40 / £10 / £13** promo (implied full ~£16 / £37 / £50 / £65 — UNVERIFIED).

### AU — Grow / Comprehensive / Ultimate (VERIFIED partial — xero.com/au/pricing-plans/)
**AU$15.60 / AU$21.40 / AU$28.60** promo. All tiers bundle GST/BAS, payroll (2/5/10), super automation, **Hubdoc capture**, auto-reconcile (Beta). AU Ignite existence UNVERIFIED.

### Add-on table

| Add-on / SKU | Terms | Status | Source |
|---|---|---|---|
| Xero Projects | Bundled top tiers; +£5/user (UK), +AU$7/user | GA | VERIFIED pricing pages |
| Xero Expenses | Bundled by tier; +£2.50/user (UK), +AU$5/user | GA | VERIFIED |
| Xero Payroll (UK/AU) | Bundled seats; UK +£1.50/person | GA | VERIFIED |
| CIS contractor returns (UK) | £5/mo | GA add-on | VERIFIED |
| Auto-reconcile (Beta) | Bundled Grow+; UK Ignite add-on £3.50/mo | Beta | VERIFIED |
| International bill payments | Comprehensive/Ultimate (UK); per-transaction FX fees likely | GA | VERIFIED (fees UNVERIFIED) |
| Inventory Plus (US) | Add-on on Growing/Established; price not shown on page (~US$39/mo per Report 3) | GA | VERIFIED listing |
| Analytics (powered by Syft) | **Now tier-differentiated plan feature lines, NOT a separate SKU** (replaces Analytics Plus) | GA | VERIFIED as feature lines |
| Hubdoc | Bundled AU; superseded by "Smart Document Capture" branding in US/UK | GA | VERIFIED |
| Xero Simple (UK) | MTD-ITSA sole-trader plan | GA | VERIFIED via blog |
| Xero Tax, XPM/Practice Manager, Xero HQ, Workpapers, Ledger/Cashbook | Partner/practice tools (see Partner Hub unification, §5) | Partner tools | UNVERIFIED this session |
| Xero Go | Retired ~Sept 2024 | Killed | UNVERIFIED |
| **JAX** | Did NOT appear as a SKU/feature line on any pricing page — not yet monetised (monetization begins FY27, see §4) | Not monetised | **absence VERIFIED** |

**Gap not closed by Wave-1:** apps.xero.com first-party app census was not completed.

---

## 3. Acquired products commercialised

Xero's live US "Our Brands" page (VERIFIED 4 Jul 2026 — xero.com/us/about/our-brands/) lists **exactly six** acquired brands.

### The six branded acquisitions

| Brand | Year / price | What it does | How commercialised today | Regions | Source |
|---|---|---|---|---|---|
| **Melio** | Announced 25 Jun 2025, completed 15 Oct 2025; US$2.5B + $500M earnout | US SMB bill pay / AP+AR automation | (1) embedded "Xero online bill payments" launched US 23 Mar 2026, free ACH all US plans; (2) melio.com standalone continues (incl. QuickBooks integration) | US only | listcorp.com/.../xero-completes-acquisition-of-melio ; xero.com/us/media-releases/.../online-bill-payments |
| **Syft Analytics** | 2024; up to US$70M | AI-first reporting/analytics, consolidation, budgeting, forecasting | (1) "Analytics powered by Syft" embedded, **replacing Analytics/Analytics Plus** (early 2025→); (2) full Syft bundled free on higher plans; (3) standalone (~$19–$119/user/mo, third-party figure) | Global | xero.com/us/syft-from-xero/ |
| **Planday** | 2021; €183.5M | Workforce mgmt: scheduling, time tracking, connected payroll | Standalone SKU, **Europe only** — **AU retired 30 Sep 2024**, replaced by Deputy partnership (Xero invested US$25M) | Europe | blog.xero.com/news-events/xero-retire-planday-au-partnership-deputy/ |
| **TaxCycle** | 2021; CA$75M | Canadian professional tax prep | Standalone SKU | Canada | xero.com/us/about/our-brands/ |
| **Hubdoc** | 2018 | Doc/data capture | Bundled free in business plans; **superseded by Smart Document Capture branding in US/UK** (still bundled AU; deprecation UNVERIFIED) | Global | xero.com/us/about/our-brands/ |
| **Tickstar** | 2021 | Peppol e-invoicing access point | Powers Xero eInvoicing + sold as infra to third parties | Global | xero.com/us/about/our-brands/ |

### Absorbed (no longer standalone brands)

| Product | Year / price | Now | Source |
|---|---|---|---|
| **LOCATE Inventory** | 2021; US$19M | Became **Xero Inventory Plus** (~US$39/mo add-on, US) | en.wikipedia.org/wiki/Xero ; central.xero.com/.../Xero-product-releases-US |
| Paycycle | 2011 | Xero Payroll AU | en.wikipedia.org/wiki/Xero |
| Spotlight Workpapers | 2012 | Xero Workpapers | en.wikipedia.org/wiki/Xero |
| Instafile | 2018 | Xero Tax UK | en.wikipedia.org/wiki/Xero |

### Divested / killed
- **WorkflowMax** — retired 2023, shut 26 Jun 2024, brand sold to BlueRock.
- **Waddle** (invoice finance) — wound down by 2023 (details UNVERIFIED).
- **Planday AU** — retired Sep 2024 (Deputy partnership instead).
- **Monchilla / US-native payroll** — exited; Gusto partnership now (detail UNVERIFIED).
- No acquisitions after Melio (Tracxn Apr 2026: 11 total).

### Melio deep-dive (the payments pillar)
Embedded US bill pay (launched 23 Mar 2026): "unified bill management, payment and reconciliation in one automated workflow", with **automatic reconciliation via JAX**. Per xero.com/us/accounting-software/bill-payments-faqs/: future-dated scheduling (user-selected dates), batch payments, approval workflows, pay-by-bank/ACH free, card (fee), delivery via ACH/check/virtual card/wire, international. Melio standalone adds bill capture, vendor mgmt, W-9/1099.

**Critical white-space finding:** **intelligent payment prioritisation** (cash-flow-aware "which bills to pay when" decisioning) is **NOT in evidence** — but Xero's stated direction ("system of action and decision-making") + JAX point straight at it. **US-only** today.

**Strategic context:** AFR (14 May 2026) — Melio-driven US expansion drags profit; **AI/Anthropic framed as a threat to Xero's outlook** (afr.com/.../xero-s-3-9b-us-expansion-drags-down-profit). Judge-resonant angle: an agent that helps Xero win rather than compete with JAX.

---

## 4. AI & agent surface

**Meta-finding: JAX was never formally GA — every Xero Central help article still says "beta" (Jul 2026), even where media releases say features "launch". Free until FY27 monetization.**

### JAX capability matrix — shipped vs announced

| Capability | Status | Surfaces | Source |
|---|---|---|---|
| Invoice create/edit/approve/send via chat (multi-currency, item codes) | **SHIPPED** (beta label) since Aug 2024 | Web chat, email, WhatsApp (all regions); SMS AU/US/UK/NZ | central.xero.com/.../Release-notes-for-Just-Ask-Xero-JAX |
| Quote create/edit/approve/send | **SHIPPED** (beta label) since Aug 2024 | Same | JAX release notes |
| Cash-flow / business Q&A (owed amounts, P&L trends, 30-day projection, benchmarking) | **SHIPPED** — AU/US/UK Oct 2025, all regions Dec 2025; projections+benchmarking Jul 2026 (powered by Syft) | Global | blog.xero.com/product-updates/jax-xerocon-2025/ |
| Auto bank reconciliation "powered by JAX" | **BETA** (open, gradual) — high-confidence lines only; rest stay suggestions | Grow/Growing/Standard+ plans, selected orgs | central.xero.com/.../About-auto-bank-reconciliation-powered-by-JAX |
| Web research (OpenAI-powered) | **SHIPPED** Oct 2025 | Beta regions | JAX release notes |
| Xero how-to help | **SHIPPED** Mar 2025 | | JAX release notes |
| Invoice search / summarization | **SHIPPED** Apr 2025 | | JAX release notes |
| JAX in Microsoft 365 Copilot | **SHIPPED 1 Jul 2026** — Q&A/insights only at launch; Excel/Word/PPT drafting = future | Copilot users | xero.com/us/media-releases/.../microsoft-365 |
| Payment chasing / JAX-drafted reminder emails | **ANNOUNCED-ONLY** ("coming soon" Sep 2025; unshipped through Jul 2026). JAX can *identify* who to chase; classic non-AI reminders are the shipped feature | — | blog.xero.com/product-updates/jax-xerocon-2025/ |
| Bill workflows via chat | **NOT SHIPPED via JAX** — Melio bill pay is a separate US-only UI; JAX only auto-reconciles the resulting transactions | — | xero.com/us/media-releases (23 Mar 2026) |
| Contact management via chat | **NOT SUPPORTED** (absent from all capability lists) | — | central.xero.com About-JAX |

**Timeline / model / pricing:** announced ~Mar 2024 → beta Aug 2024 → "AI financial superagent" relaunch Xerocon Brisbane 3 Sep 2025 → global insights Dec 2025. Multi-LLM (AWS/Azure/GCP/OpenAI) + **Anthropic multi-year partnership Mar 2026** (Claude for agentic JAX + Xero inside Claude.ai — "coming months", **NOT shipped as of Jul 2026**; blog.xero.com/news-events/anthropic-xero-partnership-claude-ai/). "JAX Assure" accuracy layer. Free now; **AI monetization begins FY27** (2M+ subscribers touching AI, 300K using GenAI tools — FY26 results May 2026).

### Other first-party AI

| Feature | Status |
|---|---|
| Legacy ML bank-rec suggestions | SHIPPED (longstanding); being superseded by JAX auto-rec |
| **Smart Document Capture** (AI bill/receipt/statement ingestion; email-in/upload/mobile; learns; roadmap: tax extraction, bank-statement conversion, contact rules) | **LAUNCHED 1 Jul 2026** ("most markets"; AU/NZ beta) — blog.xero.com/product-updates/smart-document-capture/ |
| Report commentary AI ("Analytics powered by Syft": dashboard insights, "Explain this to me", AI profitability summaries) | SHIPPED; free on eligible AU/UK/US plans (Sep 2025) |
| Cash Flow Manager (ML forecasting in Syft) | SHIPPED |
| Anomaly detection as a discrete product | WEAK/UNVERIFIED — marketing language only |
| **Revenue recognition automation** | **Still NOT in pipeline** — no roadmap commitment (third-party fills it: scalexp.com, finlens.app, puzzle.io) |

### Developer / MCP toolkit

**Official MCP server** (github.com/XeroAPI/xero-mcp-server, MIT, npm `@xeroapi/xero-mcp-server` v0.0.17 pub 2026-05-26): **exactly 51 tools** (machine-verified; "52" was a miscount). Domains: invoicing 3, quotes 3, credit notes 3, payments 2, contacts 4, bank transactions 3, manual journals 3, items 3, tracking 5, read-only reports 5 (P&L, BS, TB, aged AR/AP), settings 3, payroll leave read-only 6, timesheets full-CRUD 8 (NZ/UK payroll only). **README tool names are stale — don't code against README.**

**Auth & gotchas:** Custom Connections (OAuth2 client_credentials, single org) or bearer token; no PKCE (#203). Connections on/after 29 Apr 2026 must use granular V2 scopes (#175). **`update-bank-transaction` 400s in v0.0.17 (#206/#184) — avoid in live demos.** List tools return ~10 records/page (#193).

**Workflows ENABLED via MCP:** quote→invoice→payment lifecycle (payment needs an AUTHORISED invoice); bill entry (ACCPAY); spend/receive money; manual journals (the only voidable doc type); reporting agents; NZ/UK timesheets; deep links into the Xero UI for human handoff.

**Workflows IMPOSSIBLE via MCP:** reconcile a bank line (no statement-line access); attach files/receipts; email/send an invoice; **approve DRAFT→AUTHORISED — the "draft-invoice dead-end"**; void/delete; POs, batch payments, repeating invoices, expense claims, fixed assets, bank feeds; AU/US payroll; pay runs.

**AI Toolkit** (developer.xero.com/ai): (1) MCP server; (2) Agentic SDK `xero-agent-toolkit` (Aug 2025; OpenAI Agents SDK, LangChain, Google ADK); (3) Xero CLI (Mar 2026, alpha); (4) `xero-prompt-library`. **Horizon** eventing GA for partners (credit-note webhooks). Developer pricing (Mar 2026): 5 tiers on connections + API egress — read-heavy agents pay more. **API terms prohibit training models on Xero API data; inference is fine.**

**"Xero OS" positioning:** Xero frames itself as an **"AI-native financial operating system orchestrating multiple agents"**, with JAX as the first-party superagent (blog.xero.com/news-events/xero-os-ai-native-operating-system/). CPTO Diya Jolly: accounting "available wherever the user works"; the data/workflow/compliance layer is the moat. Xero wants partners **alongside** JAX via MCP + Agentic SDK + webhooks + App Store — **there is no JAX plugin model** (no third-party surface inside JAX). **This hackathon is on Xero's official dev calendar** (4–5 Jul London ENCODE), with DevDay 7 Jul and Xerocon London 8–9 Jul.

**Xero-hosted remote MCP:** none found (third-party hosts Composio / StackOne only) — UNVERIFIED.

---

## 5. Roadmap: announced-coming vs explicitly-not-building

### Announced / coming

| Item | Where | Timing | Source |
|---|---|---|---|
| JAX superagent expansion: instant cashflow/P&L/BS Q&A w/ charts, strategic decision support w/ external data, auto bank rec | Xerocon Brisbane 3 Sep 2025 | From Sep 2025, AU first | blog.xero.com/product-updates/xerocon-2025-new-features-announcement/ |
| **Xero Partner Hub** — unifies Xero HQ, Practice Manager, Tax, Workpapers; JAX built in | Xerocon Brisbane | Rolling out | xero.com/media-releases/xerocon-brisbane-... |
| Analytics powered by Syft: AI health insights (beta US), business health score, external-data import, forecasting, multi-entity consolidations | Xerocon Brisbane | Beta/coming | same |
| **US payroll "Xero Payroll powered by Gusto"** (Gusto Embedded) | Announced 17 Dec 2024; beta FAQ live | Beta 2026, GA unannounced | gusto.com/company-news/xero-to-launch-... |
| **Deposits on invoices — remaining regions + expanded functionality** | Product Ideas (Kelly Munro) 15 Jun 2026 | "Soon" | productideas.xero.com/.../44960308 |
| **New Credit Notes experience** (UI rebuild of existing features) | Admin 19 Sep 2025 | Underway | productideas.xero.com/.../44961307 |
| Manual journals — contact per line | Product Ideas "work now underway" | Underway | productideas.xero.com/.../44960605 |
| New payroll features across all 3×3 markets FY26 | FY25 results deck | FY26 (not itemised) | listcorp.com/.../fy25-annual-results |
| Payments as an owned pillar — "Owning Payments critical to our 3×3" | FY26 interim results Nov 2025 | Ongoing | AFR-hosted PDF (context UNVERIFIED) |
| **Xerocon London 8–9 Jul 2026 + Denver 19–20 Aug 2026** — announcements promised | Events pages | **DAYS AWAY** | blog.xero.com/news-events/xerocon-london-denver-2026/ |

**3×3 strategy = win accounting, payments, payroll in US/UK/AU.** Anything core to those three, in those three markets, is a collision course.

### Recently shipped (2025–26)
- US online bill payments (Melio) — 23 Mar 2026.
- **Deposits on invoices** — all AU/NZ/UK/CA/SG/US orgs (admin 15 Jun 2026); separate deposit due-date field; Stripe-powered collection staged since ~Mar 2026.
- Syft free with eligible plans (Sep 2025); JAX rollout began Sep 2025.
- Xero + Microsoft 365 integration (~Feb 2026 → full launch 1 Jul 2026).
- Xero Coaches (US onboarding help) — 5 May 2026.
- Smart Document Capture — 1 Jul 2026.

### Explicitly NOT building / no signal

| Feature | Status | Evidence |
|---|---|---|
| **Revenue recognition / recognise future revenue** | **"Not in pipeline"** — live-fetched 4 Jul 2026; last admin reply 7 Mar 2023 ("not near term… look into connected apps"); no 2025–26 mention anywhere | productideas.xero.com/.../44960389 |
| Retentions on sales invoices (construction) | Admin 22 May 2024: "isn't something we have planned"; workaround = negative invoice line; 55 votes since 2022 | productideas.xero.com/.../45636571 |
| VAT partial-exemption calculation | Open since Sep 2018; admin Dec 2023 workaround-only | productideas.xero.com/.../44961385 |
| Tronc / tips PAYE (UK hospitality) | "Gaining Support" (Jul 2025), no commitment | productideas.xero.com/.../50106273 |
| Credit notes bulk allocation | "Accepted" but admin 19 Sep 2025 "not planned for the short term" (UI rebuild first); 482 votes since 2017 | productideas.xero.com/.../44961307 |
| Custom fields | "Not planned near term" | productideas.xero.com/.../44960422 |
| Global payroll | "Not planned" | productideas.xero.com/.../45510076 |

---

## 6. Overlap verdicts for our candidate ideas

Verdicts apply the Wave-1 RED/AMBER/GREEN signals plus synthesizer judgment. **Overlap-risk = how much of the idea Xero already ships or has clearly announced** (HIGH = mostly done by Xero; LOW = clear white space).

| Idea | Overlap-risk | Justification | Evidence |
|---|---|---|---|
| **DeferDesk** — deferred-revenue / rev-rec automation (schedules + auto manual journals) | **LOW** | Rev-rec is explicitly "Not in pipeline" (live-fetched 4 Jul), a stance unchanged since Mar 2023, and never mentioned in any 2025–26 material. Xero itself points customers to "connected apps"; third parties (scalexp, finlens, puzzle) already fill it. Manual journals are the one doc type the MCP server can fully create — so an auto-journal scheduler is buildable on the official surface. | productideas.xero.com/.../44960389 |
| **DepositDesk** — customer deposit/prepayment lifecycle | **HIGH (with a residual LOW carve-out)** | The deposit-**REQUEST/collection** UX is now native and GA — "Deposits on invoices" shipped to all AU/NZ/UK/CA/SG/US orgs (15 Jun 2026), Stripe-powered, with a dedicated deposit due-date field, and expanded functionality is "coming soon". Building the take-a-deposit flow clones native = HIGH. **Residual white space:** the *accounting treatment* — recognising the deposit as a liability and deferring it until the final invoice — is NOT addressed by the native feature (UNVERIFIED, needs product testing). A tool scoped strictly to deposit-as-liability/deferral tracking could be LOW-risk, but the collection UX is off-limits. | productideas.xero.com/.../44960308 |
| **CreditSweep** — automated credit-note / overpayment allocation cleanup (incl. locked periods) | **MEDIUM** | Bulk/auto credit-note allocation is "not planned for the short term" (admin 19 Sep 2025) — so it is open *today* — but the **New Credit Notes experience UI rebuild is underway**, which may absorb this in 12–24 months, and third party Allocat.io already sells auto-allocation. The **locked-period cleanup** angle (reallocating across closed periods via reversing journals) is genuinely residual white space Xero shows no sign of touching. Window may close; build for the judgment/locked-period edge, not vanilla allocation. | productideas.xero.com/.../44961307 |
| **RetentionLedger** — construction retentions tracking | **LOW** | Retentions on sales invoices are explicitly "isn't something we have planned" (admin May 2024); the only Xero answer is a manual negative-invoice-line workaround; 55 votes unmoved since 2022. Construction is not a 3×3 focus market. Clear, durable white space. | productideas.xero.com/.../45636571 |
| **TroncClear** — hospitality tips/tronc allocation to payroll | **LOW (payroll-adjacency caution)** | Tronc/tips PAYE is only "Gaining Support" (Jul 2025) with no commitment — clear white space. **Caution:** it touches UK payroll, which IS a 3×3 pillar, and note US/AU payroll actions are unavailable via MCP; keep the tool to tronc *allocation/calculation* and hand the payroll posting to the human or the payroll module. | productideas.xero.com/.../50106273 |
| **PartialExemption** — VAT partial-exemption calculation | **LOW** | Open request since Sep 2018; Xero's standing position is workaround-only (admin Dec 2023). An 8-year-old, never-actioned niche tax calc — durable white space. Compliance-flavoured, which fits Xero's "partners handle the edges" framing. | productideas.xero.com/.../44961385 |
| **BillOptimizer** — AP payment prioritisation / scheduling | **HIGH in US, MEDIUM in UK — with a LOW decisioning carve-out** | Payment **scheduling** is native: Melio-powered US bill pay (23 Mar 2026) already does future-dated scheduling, batch, approvals; UK native bill payments exist (scheduling depth UNVERIFIED). Payments is THE strategic pillar ("Owning Payments critical to our 3×3") — cloning scheduling is HIGH (US) / MEDIUM (UK). **But cash-flow-aware payment PRIORITISATION ("which bills to pay when, given runway") is explicitly NOT in evidence** in Melio or JAX — that decisioning layer is real white space, though Xero's stated direction points straight at it (build fast, expect a Xerocon collision). | xero.com/us/accounting-software/bill-payments-faqs/ (Melio deep-dive, §3) |
| **Generic "chat with your Xero books" agent** (vs JAX) | **HIGH** | Head-on collision. JAX is Xero's "AI financial superagent" doing cash-flow/P&L/BS Q&A, projections and benchmarking across all regions (shipped), and "Xero OS" positioning explicitly raises the bar for "yet another chat agent". There is no JAX plugin model to ride, and Anthropic is powering JAX itself. Avoid. | xero.com/us/ai-in-accounting/jax/ ; blog.xero.com/news-events/xero-os-ai-native-operating-system/ |

---

## 7. White space — areas Xero clearly does NOT cover natively

| # | White-space area | Why it's open | Evidence |
|---|---|---|---|
| 1 | **Revenue recognition / deferred revenue** | Explicitly "Not in pipeline" since Mar 2023, re-confirmed live 4 Jul 2026; Xero defers to "connected apps"; MCP *can* create manual journals, so a scheduler is buildable. | productideas.xero.com/.../44960389 |
| 2 | **Payment chasing (announced-unshipped)** | JAX-drafted reminder chasing was announced "coming soon" Sep 2025 and remains unshipped through Jul 2026; only classic non-AI reminders ship. JAX can identify who to chase but not send the AI-drafted chase. | blog.xero.com/product-updates/jax-xerocon-2025/ |
| 3 | **Background / scheduled agency** | JAX FAQ: "JAX only functions when opened and asked; doesn't run in the background." Anthropic's proactive-monitoring vision is announced, not shipped. Any always-on/scheduled agent is open. | central.xero.com About-JAX |
| 4 | **Cash-flow-aware AP prioritisation** | Melio does scheduling/batch but intelligent "which bills to pay when given runway" decisioning is NOT in evidence; JAX gives no financial advice/recommendations. | xero.com/us/accounting-software/bill-payments-faqs/ |
| 5 | **Construction retentions** | Explicitly not planned (May 2024), manual workaround only, not a 3×3 market. | productideas.xero.com/.../45636571 |
| 6 | **Tronc / tips allocation (UK hospitality)** | Only "Gaining Support", no commitment. | productideas.xero.com/.../50106273 |
| 7 | **VAT partial exemption** | 8-year-old request, workaround-only stance. | productideas.xero.com/.../44961385 |
| 8 | **Judgment work — fixing miscoded history** | JAX does no journals, consolidation, or reclassifying miscoded transactions; "you always have the final say". Cleanup/reclassification of historical coding is untouched. | central.xero.com About-JAX |
| 9 | **Cross-system orchestration** | JAX has no third-party surface and doesn't reach outside Xero; orchestrating external systems (booking platforms → Xero, e.g. Treatwell) into Xero via the API/webhooks is squarely partner territory. | Report 4 build-safe territory |

**Top-3 picks:** (1) **Revenue recognition / deferred revenue** — clearest, most durable "not-building" signal with a real accounting pain and a buildable MCP path (manual journals). (2) **Proactive payment chasing + background/scheduled agency** — JAX explicitly can't run in the background and hasn't shipped AI chasing; combine into a scheduled receivables-chaser. (3) **Cash-flow-aware AP prioritisation** — Melio schedules but doesn't *decide*; the runway-aware "pay-this-not-that" layer is open (build fast; Xerocon-collision risk).

---

## 8. Build-safety rules of thumb

### 3×3 collision zones (avoid the core in these market/pillar cells)
The 3×3 strategy is **win accounting, payments, payroll in US / UK / AU.** Anything core to a pillar, in one of those markets, collides.

| Pillar | US | UK | AU |
|---|---|---|---|
| **Accounting** | Core ledger, invoicing, rec — collision | same | same |
| **Payments** | Melio bill pay (shipped) — **hard collision** | Native bill payments — collision | Native — collision |
| **Payroll** | Gusto-powered (beta) — collision | Xero Payroll — collision | Xero Payroll — collision |

Safer: non-3×3 markets/verticals (construction, hospitality niches), the **judgment/decisioning layer** on top of a pillar rather than the pillar itself, and compliance edges Xero defers on.

### JAX exclusivity zones (Xero first-party only — don't rebuild)
- Invoice/quote create-edit-approve-send via chat (shipped).
- Cash-flow / P&L / BS Q&A, projections, benchmarking (shipped, Syft-powered).
- Auto bank reconciliation (JAX beta) — plus the MCP can't reconcile anyway.
- Generic "chat with your books" — "Xero OS" positioning makes this a losing pitch.
- No JAX plugin model — you cannot extend JAX; you build **alongside** it via MCP + Agentic SDK + webhooks + App Store.

### MCP hard limits to design around
- **Draft-invoice dead-end:** cannot approve DRAFT→AUTHORISED via MCP → design a human-in-the-loop approval handoff (deep link to Xero UI).
- **No reconcile:** no bank statement-line access → don't promise auto-reconciliation.
- **No attachments/files:** can't attach receipts via MCP → use the raw Files/Attachments API directly if receipt handling is core.
- **No send:** can't email/send an invoice via MCP.
- **`update-bank-transaction` 400s in v0.0.17** — avoid in live demos.
- **Read-heavy agents pay more** (developer pricing tiers on connections + API egress); pagination ~10 records/page.
- **Manual journals are the one fully-CRUD, voidable doc type** — the safest write surface for automation (helps DeferDesk/CreditSweep).
- **Don't train on Xero API data** (terms prohibit); inference is fine.

### Conflict log — how boundary items were resolved (freshest report wins)
1. **Hubdoc vs Smart Document Capture** (2a left unresolved): Report 4 resolves — **Smart Document Capture is the successor branding, launched 1 Jul 2026** ("most markets"; AU/NZ beta); Hubdoc still bundled in AU, deprecation UNVERIFIED.
2. **Analytics Plus vs Syft** (2a listed "Analytics (Plus)"): Report 3 resolves — it is now **"Analytics powered by Syft", which replaced Analytics/Analytics Plus** (early 2025→); a tier-differentiated feature line, not a separate SKU.
3. **MCP tool count** ("52" prior): Report 4 machine-verified — **exactly 51 tools**.
4. **JAX GA-vs-beta** (2a deferred to Report 4): Report 4 resolves — **never formally GA; beta label throughout**, free until FY27.
5. **Deposits** (not flagged in 2a/2b): Report 5 resolves — **shipped globally 2026 (RED)**, reshaping DepositDesk to the residual accounting-treatment carve-out.

---

## Appendix: Unverified items to re-check (esp. after Xerocon London, 9 Jul 2026)

Everything below carried an `UNVERIFIED` tag in Wave-1. Re-confirm before relying on any of it.

- **UK full (non-promo) list prices** (~£16/£37/£50/£65 implied only).
- **Find & Match, bank rules / cash coding / suggested matches** — native but not re-verified this session.
- **eInvoicing (Peppol) UK** shipped ~Dec 2025 — not re-verified.
- **Long-standing native modules** (fixed assets, tracked inventory, budgets, POs, batch payments, credit notes, prepayments/overpayments, contacts/smartlists, repeating invoices, invoice reminders) — not re-verified.
- **Tap to Pay; GST/BAS (AU); US sales tax; 1099; Xero Me/mobile** — not re-verified.
- **AU Ignite plan existence** — unknown.
- **International bill-payment FX fees** — likely but not confirmed.
- **Partner/practice tools** (Xero Tax, XPM, Xero HQ, Workpapers, Ledger/Cashbook) — not re-verified (but Partner Hub unification announced).
- **Xero Go** retired ~Sept 2024 — not re-verified.
- **Waddle** wind-down details; **Monchilla / US-native payroll** exit detail.
- **Deposit accounting treatment** (deferred/liability recognition) — needs product testing; core to DepositDesk carve-out.
- **UK bill-payment scheduling depth** — core to BillOptimizer UK verdict.
- **Anthropic-powered JAX ship state** (Claude for JAX + Xero-in-Claude.ai — "coming months", not shipped).
- **JAX in the mobile app; Hubdoc deprecation; anomaly detection; auto-rec global-beta date; AI pricing detail; MCP server support tier; Custom Connections plan gating.**
- **Xero-hosted remote MCP** — none found (only third-party hosts Composio/StackOne).
- **FY26 interim "Owning Payments" quote** — wording verified, surrounding context not.
- **"New payroll features FY26"** — announced but not itemised.

---

## Verification appendix (adversarial pass, 4 Jul 2026)

Independent fact-checker with fresh context re-derived each material claim from the live source (Firecrawl scrape/search, 4 Jul 2026). **Result: all 10 material claims SUPPORTED. No FALSE claims found; no body edits required. Every cited URL spot-checked exists and matches its content — no hallucinated citations.**

| # | Claim | Verdict | Live evidence |
|---|---|---|---|
| 1 | Revenue recognition still "Not in pipeline" | **SUPPORTED** | productideas.xero.com/.../44960389 — status label reads **"Not in pipeline"**; last admin reply Kelly Munro **Mar 7, 2023**: "this is not something we'll be developing in the near term… best to look into connected apps". No 2025–26 admin update. |
| 2 | Deposits on invoices shipped AU/NZ/UK/CA/SG/US by Jun 2026 | **SUPPORTED** | productideas.xero.com/.../44960308 — Kelly Munro **Jun 15, 2026**: "the ability to accept deposits has now rolled out to **all AU, NZ, UK, CA, SG and US organisations**… added a due date field". Stripe-powered (Mar 3 2026 reply). (Idea status label is "In development" pending remaining regions, but the 6 named regions are live.) |
| 3 | Melio US bill pay launched Mar 2026, scheduling but NO cash-flow-aware prioritisation | **SUPPORTED** | Media release "March 23, 2026"; xero.com/us/accounting-software/bill-payments-faqs/ confirms schedule ("schedule your USD bills for a future payment date"), batch, approvals ("more flexible approvals workflow planned later in 2026"). **No** runway-aware "which bills to pay when" prioritisation anywhere on the page. |
| 4 | JAX can't run in background; payment chasing announced-but-unshipped | **SUPPORTED** (substance; wording paraphrased) | central.xero.com/s/article/About-Just-Ask-Xero-JAX: "It **needs your prompts to perform**… JAX keeps the conversation live until you log out" (not a background/scheduled agent — exact phrase "doesn't run in the background" is a paraphrase). blog.xero.com/product-updates/jax-xerocon-2025/ (Sep 3 2025): "**soon**, JAX will… intelligently **draft invoice emails**" = announced, not shipped. |
| 5 | Official MCP server: 51 tools; can't approve DRAFT invoices, send invoices, or access bank statement lines | **SUPPORTED** | github.com/XeroAPI/xero-mcp-server — README "Available MCP Commands" list counts **exactly 51** (25 list + 11 create + 10 update + 5 timesheet). No `approve-invoice`/send/email tool; `update-invoice` = "Update an existing draft invoice" only; `list-bank-transactions` ≠ statement lines and no reconcile tool. package.json last changed May 25 2026 (consistent with v0.0.17). |
| 6 | Credit-note bulk allocation "not planned for the short term" | **SUPPORTED** | productideas.xero.com/.../44961307 — status "Accepted"; Kelly Munro **Sep 19, 2025**: "enhancements like bulk allocations… **this isn't planned for the short term**" (new Credit Notes UI first). **482 votes**, idea from Nov 2017. |
| 7 | Retentions / tronc / VAT partial exemption all not-planned / no-commitment | **SUPPORTED** | Retentions productideas.xero.com/.../45636571 — Kelly Munro **May 22, 2024**: "this **isn't something we have planned** for development at this time", negative-line workaround, **55 votes** since 2022. Tronc .../50106273 ("UK Payroll – PAYE only Tronc Pay Item") and VAT partial exemption .../44961385 ("VAT – Partial Exemption Calculation") both exist; topics and workaround-only stance corroborated (exact status labels not re-scraped this pass). |
| 8 | Anthropic–Xero partnership announced Mar 2026; agentic JAX not shipped | **SUPPORTED** | blog.xero.com/news-events/anthropic-xero-partnership-claude-ai/ published **Mar 27, 2026**: "Claude-powered insights within Xero, and the integration of Xero into Claude.ai, will be **available in the coming months**" = not shipped as of 4 Jul 2026. |
| 9 | Smart Document Capture launched 1 Jul 2026 | **SUPPORTED** | blog.xero.com/product-updates/smart-document-capture/ — article published_time **2026-07-01**; "available across **most markets**, and now rolling out in **beta for Australia and New Zealand**"; powered by JAX. |
| 10 | M365 Copilot integration shipped 1 Jul 2026 (Q&A/insights only at launch) | **SUPPORTED** | xero.com/us/media-releases/xero-launches-integration-with-microsoft-365/ + blog.xero.com/product-updates/xero-microsoft-365-integration/ + CPA Practice Advisor (Jul 1, 2026): "At launch, JAX… will **enable actions within Microsoft 365 Copilot to answer** businesses' financial questions"; Excel/Word/PPT drafting framed as future. |

**Hallucinated-citation hunt (spot-checks):** every URL fetched resolved and matched — rev-rec, deposits, credit-notes, retentions, tronc and VAT-partial-exemption Product Ideas pages; the MCP GitHub repo; the Anthropic, Smart-Document-Capture and JAX-Xerocon blogs; the bill-payments FAQ; and the About-JAX Central article. No invented files, APIs, or citations detected.

**Minor notes (not corrections):** (a) claim 4's quoted phrase "doesn't run in the background" is a paraphrase of the live "It needs your prompts to perform"; (b) the deposits idea's own status *label* is "In development" (remaining regions pending) even though the 6 named regions are live — the map's "GA to those regions" reading is substantively correct; (c) About-JAX confirms JAX *can* create/edit/approve/send invoices via chat, which is a first-party capability distinct from the MCP server's draft-invoice dead-end (§4 already draws this distinction).
