# Xero Hackathon — Idea Research Dossier

**Nothing is locked.** This is the full information set to decide from. Bounty 01 = any scalable real-world SMB problem (help many businesses). Bounty 03 = cash-flow. Judging = **50% Xero-connection / 30% API integration / 20% architecture**; a clear 3-min demo of one flow decides ties.

Compiled 2026-07-04 from four parallel research streams. Every statistic carries its source URL. Recency/methodology caveats are in §7.

---

## 0. Critical competitive context — Xero already shipped its own agent (JAX)

**JAX ("Just Ask Xero")** launched Sept 2025 (OpenAI-powered). It natively does: natural-language finance Q&A, auto-reconciliation of high-confidence bank transactions, AR/AP actions, data entry, and on-demand analytics/charts. Building any of those = competing with the platform.
- [Xero media release](https://www.xero.com/us/media-releases/xeros-ai-financial-superagent-jax-launches-powerful-new-features/) · [JAX product page](https://www.xero.com/us/ai-in-accounting/jax/) · [Accounting Today](https://www.accountingtoday.com/news/xeros-jax-ai-gains-agentic-capacities)

**JAX's stated limits = the openings** ([Xero Central — About JAX](https://central.xero.com/s/article/About-Just-Ask-Xero-JAX)):
- *"JAX is unable to give financial forecasts, financial advice or recommendations."* → forecasting/advisory is deliberately off-limits.
- Cannot edit line items, void/delete invoices, or create invoices where US auto-sales-tax is on.
- Q&A only — it answers about your data, it does not run messy multi-source, multi-document external workflows.

Two AI apps hold adjacent ground: **Booke AI** (AI bookkeeper — categorises, matches bills/receipts, flags exceptions) and **XBert** (24/7 AI audit — flags 80+ data-quality issues). Both **flag/suggest**; neither autonomously runs an end-to-end external workflow. [Booke AI](https://apps.xero.com/us/app/booke-ai) · [XBert](https://www.xbert.io/)

**Rule of thumb:** build agents that **act across messy external documents/parties** and **forecast → recommend → execute** — the parts JAX, Booke and XBert leave open.

---

## 1. Candidate problem spaces (scored)

Scored 1–5 on **Scale**, **Pain**, **Xero-fit (the 50%)**, **Weekend-feasibility**, **Beats JAX/incumbents**. "Adj." accounts for saturation, not raw pain alone.

| Candidate | Bounty | Scale | Pain | Xero-fit | Feasible | Beats JAX/incumbents | Notes |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| **Marketplace/gig payout reconciliation** | 01 | 4 | 4 | 5 | 4 | 5 | Generalizes the Treatwell pain; service/gig platforms unserved |
| **CFO Copilot — forecast + act** | 03 | 5 | 5 | 4 | 3 | 5 | JAX contractually banned from forecasting → clean gap |
| **VAT / Making Tax Digital pre-filing review** | 01 | 5 | 4 | 4 | 3 | 4 | MTD-for-Income-Tax mandatory Apr 2026; tax-correctness = liability |
| **Supplier-statement + missing-bill recon (AP close)** | 01 | 4 | 4 | 4 | 5 | 4 | No native Xero feature; cleanest/lowest-risk build |
| **Books-cleanup / month-end remediation** | 01 | 5 | 4 | 4 | 3 | 3 | Overlaps XBert/Booke (they flag; you'd *fix* w/ audit trail) |
| **Predictive + adaptive credit control** | 03 | 5 | 5 | 4 | 3 | 2 | Contested (Chaser/Satago/Paidnice + JAX); only via prediction+negotiation |
| **Fraud / duplicate-payment detection** | 01/03 | 4 | 5 | 4 | 3 | 4 | High per-incident loss; only 17% use AI today |
| **Cross-processor payout recon (Stripe/PayPal/Square)** | 01 | 4 | 4 | 4 | 4 | 3 | A2X-style but for non-ecommerce; incumbents may extend down |

**AVOID (high raw pain, already owned):** natural-language chat over books, auto-categorisation, bank auto-recon (all = **JAX**); receipt/bill OCR capture (**Hubdoc free in Xero**, Dext, AutoEntry); employee spend/cards (Pleo, Ramp, Expensify); get-paid-faster payment rails (Stripe, GoCardless); generic AR reminder tools (Chaser, Satago, Paidnice); reporting/BI dashboards (Fathom, Spotlight, **Syft — now Xero-owned**); inventory (Unleashed, Cin7, Katana); payroll/HR (Gusto, Employment Hero, Deputy); ecommerce marketplace recon (A2X, Link My Books own Amazon/Shopify/Etsy); sales-tax/VAT *calculation* (Avalara + native).

---

## 2. Market baseline (the addressable "many")

- **UK:** 5.7M private-sector businesses (start 2025); 5.64M small (0–49 staff); SMEs = 99.8% of businesses, 60% of employment, 52% of turnover (£2.8tn). [gov.uk BPE 2025](https://www.gov.uk/government/statistics/business-population-estimates-2025/business-population-estimates-for-the-uk-and-regions-2025-statistical-release)
- **US:** 36.2M small businesses = 99.9% of all US firms. [SBA Advocacy, Jun 2025](https://advocacy.sba.gov/2025/06/30/new-advocacy-report-shows-the-number-of-small-businesses-in-the-u-s-exceeds-36-million/)
- **Global:** SMEs ~90% of businesses, >50% of employment. [World Bank](https://www.worldbank.org/ext/en/topic/competitiveness/small-and-medium-enterprises-smes-finance)
- **Xero's own reach (distribution):** 4.4M subscribers FY25 (ANZ 2.6M, International 1.8M — UK its largest international market), revenue $2.1bn (+23%); 1,000+ App Store apps. [ASX FY25 filing](https://announcements.asx.com.au/asxpdf/20250515/pdf/06jrf2qltfk4xr.pdf) · [1,000 apps](https://blog.xero.com/news-events/celebrating-1000-apps/)
- **Why this domain:** cash-flow problems cited in ~82% of SMB failures (U.S. Bank via SCORE — legacy but ubiquitous). [SCORE](https://www.score.org/articles/1-reason-small-businesses-fail-and-how-avoid-it/) UK company insolvencies: 23,872 (2024), 23,938 (2025). [gov.uk insolvency](https://www.gov.uk/government/statistics/company-insolvencies-december-2025/commentary-company-insolvency-statistics-december-2025)

---

## 3. Ranked SMB financial pains (evidence)

### 1. Late payments / credit control / getting paid faster
- ~£11bn/yr cost to UK economy; 1.5M businesses (28%) affected; ~14,000 extra closures/yr (≈38/day). [UK gov 2025 PDF](https://assets.publishing.service.gov.uk/media/688a089a6478525675738ff9/late_payments_research_impact_on_uk_economy.pdf) · [Small Business Commissioner](https://www.smallbusinesscommissioner.gov.uk/late-payments-research-2/)
- 90% of UK companies hit late payments in the past year; avg delay 32 days. [Coface UK Payment Survey, Oct 2025](https://www.coface.com/news-economy-and-insights/2025-uk-payment-survey-companies-face-rising-payment-delays-amid-buyer-cash-flow-concerns)
- Sage/CEBR (May 2025): 44% of invoices paid late; smallest firms owed avg £42,000; £112bn locked up. [Sage](https://www.sage.com/en-gb/company/digital-newsroom/2025/05/14/addressing-late-payments-could-unlock-112-billion-in-cashflow-for-small-businesses/)
- US: 47% of businesses had invoices 30+ days overdue. [QuickBooks 2025](https://quickbooks.intuit.com/r/small-business-data/small-business-late-payments-report-2025/)
- 65% of businesses spend ~14 hrs/week on payment-collection admin. [QuickBooks midsize](https://quickbooks.intuit.com/r/midsize-business/midsize-payments-research/)
- Xero data: "pay now" button → paid up to 2× faster; automated reminders save ~3 hrs/week. [Xero XSBI](https://blog.xero.com/data-insights/small-business-insights-data-late-payment-results/)
- *Saturation:* Chaser, Satago, Paidnice + JAX AR actions. Only open slice = prediction + autonomous negotiation.

### 2. Cash-flow forecasting & runway visibility
- 50% of SMBs hold <15 "cash-buffer days". [JPMorgan Chase Institute, 2020](https://www.jpmorganchase.com/institute/all-topics/business-growth-and-entrepreneurship/small-business-cash-liquidity-in-25-metro-areas)
- 61% struggle with cash flow; 32% couldn't pay vendors/loans/staff/themselves. [Intuit, 2019](https://investors.intuit.com/news-events/press-releases/detail/282/quickbooks-study-cash-flow-woes-mean-a-third-of-small-businesses-cant-make-payroll-pay-bills)
- 43% consider cash flow a problem; 74% say worse/flat YoY. [QuickBooks 2025 via Relay](https://relayfi.com/blog/the-confidence-gap/)
- Comfort fell 72%→63% in one quarter. [US Chamber/MetLife Index](https://www.uschamber.com/co/run/finance/metlife-small-business-index)
- *Open gap:* **JAX is contractually barred from forecasting/advice** — Xero left this open. Float/Fathom forecast but don't act.

### 3. VAT/tax prep & Making Tax Digital
- MTD for Income Tax mandatory in phases: >£50k income from 6 Apr 2026, >£30k 2027, >£20k 2028 — one annual return becomes 4 quarterly updates + final declaration. [gov.uk MTD](https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax)
- HMRC estimates ~2.916M taxpayers affected. [Smailes Goldie](https://www.smailesgoldie.co.uk/making-tax-digital-for-income-tax-how-many-will-be-impacted/)
- Avg UK small firm: £4,500 + 44 hrs/yr on tax compliance; ~£25bn/yr across all small firms. [FSB "Taking a Toll" 2025](https://www.fsb.org.uk/media-centre/press-release/tax-red-tape-s-huge-cost-to-small-firms-revealed-in-new-report-MCWJAS4MAQ7FEQ5PJJFZ5DW4ZP6M)
- US post-Wayfair economic nexus spans ~45 states w/ differing thresholds. [Avalara nexus guide](https://www.avalara.com/us/en/learn/guides/state-by-state-guide-economic-nexus-laws.html)
- *Open gap:* calculation is solved (Avalara/native); pre-filing *review* + quarterly MTD assembly is not. Tax-correctness = liability.

### 4. Marketplace / gig payout & commission reconciliation
- Net payout hides gross sales + commission + fees + refunds + ad spend + tax; booked as revenue it's "wrong nine ways at once" + month-end accrual timing trap. [ecomcpa](https://ecomcpa.com/the-payout-reconciliation-gap-why-amazon-shopify-and-tiktok-shop-deposits-are-wrecking-ecommerce-books-in-2026/)
- Fee drag: Amazon referral 8–15% ([Amazon](https://sellercentral.amazon.com/help/hub/reference/external/G200336920)); Etsy ~12–20% all-in ([Craftybase](https://craftybase.com/blog/the-complete-guide-to-etsy-fees)); Uber Eats UK 30% ([Uber Eats](https://merchants.ubereats.com/gb/en/pricing/)); Deliveroo up to 35% ([CNBC](https://www.cnbc.com/2020/05/01/restaurant-owners-in-britain-call-on-deliveroo-to-drop-commission-fees.html)).
- Full deep-dive in §4.

### 5. Bookkeeping categorisation & error correction
- 18% of accountants make errors daily; a third several/week under capacity strain. [Gartner, Feb 2024](https://www.gartner.com/en/newsroom/press-releases/2024-02-21-gartner-survey-shows-that-a-third-of-accountants-make-several-error-per-weeo-due-to-capacity-constraints)
- 4 hrs 46 min/week correcting bad client data. [Dext / IAB](https://www.internationalaccountingbulletin.com/news/checking-data-manually/)
- HMRC 2024-25: error 16% + failure to take reasonable care 35% of the £59.2bn tax gap; small businesses = 62% of the gap. [HMRC via mynewsdesk](https://www.mynewsdesk.com/uk/hm-revenue-customs-hmrc/pressreleases/tax-gap-2024-25-estimated-at-6-dot-4-percent-3455752) · [gov.uk tax gaps](https://www.gov.uk/government/statistics/measuring-tax-gaps/1-tax-gaps-summary)
- *Overlap:* XBert/Booke flag & categorise new items; neither autonomously remediates history with an audit trail.

### 6. Financial visibility — "do I understand my numbers?"
- 42% of owners had limited/no financial literacy before starting. [QuickBooks](https://quickbooks.intuit.com/r/small-business-data/financial-literacy-statistics/)
- Confidence gap: 95% feel confident on cash flow, yet 90% faced unexpected cash-flow issues; 76% say it hurt the company. [Relay](https://relayfi.com/blog/the-confidence-gap/)
- Only ~33% realise they hold >$20k in receivables. [Intuit](https://investors.intuit.com/news-events/press-releases/detail/282/quickbooks-study-cash-flow-woes-mean-a-third-of-small-businesses-cant-make-payroll-pay-bills)
- *Note:* strongest single narrative — owners are "confident but wrong." But NL Q&A overlaps JAX; edge must be proactive/unprompted interpretation + action.

### 7. Fraud / duplicate-payment / error detection
- ACFE 2024: median loss $145,000/case; small firms (<100 staff) median $141,000; ~12 months to detect. [ACFE](https://legacy.acfe.com/report-to-the-nations/2024/) · [Ivey PDF](https://www.ivey.uwo.ca/media/kjljj5cy/2024-report-to-the-nations.pdf)
- 76% of US orgs hit by payments fraud in 2025; only 17% use AI to fight it. [AFP 2026 via PRNewswire](https://www.prnewswire.com/news-releases/over-75-of-us-firms-experienced-payments-fraud-in-2025-while-ai-adoption-for-fraud-mitigation-lags-302738857.html)
- Duplicate/erroneous payments 0.8–2%+ of disbursements; 1.29% of invoices duplicates, avg $2,034. [HighRadius](https://www.highradius.com/resources/Blog/duplicate-payments/)
- UK invoice/mandate scams: £35.0m of losses (70%) on business accounts. [UK Finance 2024 PDF](https://www.ukfinance.org.uk/system/files/2024-06/UK%20Finance%20Annual%20Fraud%20report%202024.pdf)

### 8. Expense & receipt admin
- Of 371,381 UK claims (2024–25): only 2.6% approved immediately, ~27% took 30+ days; 78% of rejections for vague/incomplete info. [CaptureExpense 2025](https://captureexpense.com/resources/expense-trends-2025-report/)
- ~$58 and 20 min to process a report; 19% contain errors ($52 + 18 min to fix). [GBTA](https://gbta.org/pain-points-and-expense-reports/)
- *Saturation:* receipt scanners (Hubdoc free, Dext, AutoEntry) already digitise; capture is solved.

### Runners-up
- **Payroll / IR35:** 84% of small businesses hit payroll errors, 40% incurred penalties. [Employment Hero 2025](https://www.internationalaccountingbulletin.com/news/sme-payroll-compliance-challenges/) IR35: 26% of UK contractors not working in 2025. [IPSE](https://www.ipse.co.uk/campaigns/ir35/ir35-spotlight-2025) *Lower rank:* well-solved/regulated.
- **Loan/funding readiness:** UK external-finance usage 50%→43% (2023→24); global MSME finance gap US$5.7tn. [British Business Bank](https://www.british-business-bank.co.uk/about/research-and-publications/small-business-finance-markets-report-2025/factsheet) · [SME Finance Forum](https://www.smefinanceforum.org/data-sites/msme-finance-gap) *Lower rank:* value indirect, gated by lender integrations.
- **Supplier/bill (AP) management:** 25%+ of AP staff time on correcting duplicate/invoice errors. [HighRadius](https://www.highradius.com/resources/Blog/duplicate-payments/)

---

## 4. Deep dive — universal marketplace/gig payout reconciliation

**Problem:** sellers/traders get one net payout bundling gross sales, platform commission, fees, VAT and refunds; reconciling that into Xero is manual and error-prone. A salon that can't reconcile Treatwell's per-booking commission is one instance of a population in the hundreds of millions.

**Scale:**
- Amazon ~1.9M active 3P sellers (UK #2, ~281k sellers). [amzprep](https://amzprep.com/amazon-marketplace-seller-statistics/) · eBay ~17.6M sellers (~80% small biz). [Business of Apps](https://www.businessofapps.com/data/ebay-statistics/) · Etsy 5.6M active sellers (2024/25 10-K). [Etsy IR](https://investors.etsy.com/sec-filings/all-sec-filings/content/0001370637-26-000019/etsy-20251231.htm) · Shopify "millions in 175+ countries". [Shopify](https://www.shopify.com/news/about-us)
- Service/gig (essentially unserved): UK Uber private-hire 381,092 licences (Apr 2024) ([Zego](https://www.zego.com/uk-uber-driver-statistics/)); Deliveroo ~100,000 couriers ([Business of Apps](https://www.businessofapps.com/data/deliveroo-statistics/)); Fresha 140,000+ partner businesses ([PRNewswire](https://www.prnewswire.com/news-releases/fresha-secures-long-term-global-industry-partnerships-across-the-worlds-leading-hairdressing-and-beauty-events-302735599.html)); Treatwell 55,000–75,000 salon partners, ~1M bookings/month ([Treatwell](https://www.treatwell.co.uk/partners/)); Airbnb 5M+ hosts ([sqmagazine](https://sqmagazine.co.uk/airbnb-statistics/)); Fiverr ~3M+ sellers, Upwork 18M+ freelancers ([jobbers](https://www.jobbers.io/freelance-platform-statistics-2026-users-fees-market-share-analysis/)).
- UK gig economy: ~4.4M people do platform work at least weekly. [ComputerWeekly](https://www.computerweekly.com/news/252509210/Gig-economy-workforce-nearly-trebles-over-five-years) Global online gig workers 154M–435M (World Bank). [World Bank](https://openknowledge.worldbank.org/entities/publication/ebc4a7e2-85c6-467b-8713-e2d77e954c6c)

**Existing tools & the gap:**
| Tool | Channels | Focus |
|---|---|---|
| **A2X** (13,000+ businesses) | Amazon, Shopify, eBay, Etsy, Walmart, PayPal | **Ecommerce only** |
| **Link My Books** (UK) | Amazon, eBay, Shopify, Etsy, Walmart, WooCommerce, TikTok, Square | **Ecommerce only** |
| **Synder** | 30+ ecommerce + Stripe/PayPal/Square | Ecommerce + processors |

[A2X](https://www.a2xaccounting.com/integrations) · [Link My Books](https://linkmybooks.com/) · [Synder](https://synder.com/integrations/). **None cover service/gig/per-booking platforms** (Uber, Deliveroo, Fresha, Booksy, Treatwell, Airbnb, Fiverr, Upwork). Each is a hand-built connector against a platform's settlement API/schema — so the long tail is uneconomic to cover. Xero's own forums show traders manually splitting Deliveroo/Just Eat/Uber deposits via "Add details". [Xero Central thread](https://central.xero.com/s/question/0D58V00008zarrRSAQ/how-to-record-transactions-involving-deliveroo-just-eat-and-uber)

**AI-agent moat:** LLM ingests ANY raw CSV/PDF/XLSX payout with no pre-built connector, infers the schema (which column is gross/commission/fee/VAT/refund/net), adapts when a platform changes its export, applies VAT reasoning, and auto-posts clean Xero entries (bank transactions, manual journals, tracking categories per platform) + net-margin analytics. Defensible *because* these platforms only give PDFs/CSVs, not APIs.

**Feasibility risks:** accuracy/trust (needs confidence scoring + human-in-loop before posting); VAT correctness = real tax liability (scope demo to clean cases); data access uneven (clean CSV vs messy PDF).

---

## 5. Xero App Store saturation map

| Category | Status | Incumbents | Verdict |
|---|---|---|---|
| Invoicing & payments | Saturated | Stripe, GoCardless, Crezco, native pay-now | Avoid |
| Debtor/credit control | Saturated | Chaser, Satago, Paidnice, CreditorWatch | Mostly avoid |
| Bills/expense OCR | Saturated | Dext, Hubdoc (free), AutoEntry | Avoid |
| Employee spend/cards | Saturated | Pleo, Ramp, Expensify, Soldo, Weel | Avoid |
| Cash-flow **forecasting** | **Underserved for agents** | Float, Fluidly, Fathom (read-only) | **Open** — JAX banned from forecasting |
| AP / supplier-statement recon | **Underserved** | *no native Xero feature* | **Open** — strongest clean gap |
| Tax/VAT | Calc saturated, review open | Avalara, native | Pre-filing review = **open** |
| Reporting/analytics | Saturated | Fathom, Syft (Xero-owned), Spotlight, Futrli | Avoid |
| Inventory | Saturated | Unleashed, Cin7, Katana | Avoid |
| Ecommerce marketplace recon | Saturated | A2X, Link My Books | Marketplaces avoid; **service/gig open** |
| Payroll/HR | Saturated + regulated | Gusto, Employment Hero, Deputy | Avoid |
| Books cleanup / remediation | **Underserved** | XBert/Booke *flag*, don't *fix* | **Open** — remediate w/ audit trail |

Sources: [Xero App Store](https://apps.xero.com/) · [supplier-statement product-idea request](https://productideas.xero.com/forums/967133-reports-tax/suggestions/47618621-reporting-checkbox-to-reconcile-bills-against-su) · [Caseron on messy supplier recon](https://caseron.co.uk/xero-messy-supplier-account-reconciliations/) · [Float](https://apps.xero.com/uk/app/float-cashflow-forecasting) · [Fathom](https://apps.xero.com/us/app/fathom) · [A2X](https://apps.xero.com/us/app/a2x)

---

## 6. Prior-art already solved (avoid rebuilding)

- **Receipt capture / email-in / OCR / duplicate detection = Xero Hubdoc, free on every plan** — venue photo capture, personalised email-in address, data extraction, "Potential Duplicate" warning, bank matching. [Hubdoc in Xero](https://central.xero.com/s/article/Hubdoc-in-Xero) · [Smart Document capture](https://www.xero.com/us/accounting-software/capture-data-with-hubdoc/) Dext/AutoEntry cover the paid tier. [Datamolino comparison 2026](https://www.datamolino.com/blog/pricing-and-features-autoentry-vs-hubdoc-vs-dext-vs-datamolino-in-2026/)
- Salon-profitability dashboards exist **inside** booking platforms (Phorest, Fresha, GlossGenius) — never in the ledger, never tied to marketplace-commission economics.
- Past Xero Developer Challenge (XDHax 2018) winners all filled a workflow gap around the API (Curve, Xero Huginn, Exsalerate) — not another dashboard. [Xero Dev blog](https://devblog.xero.com/xd-hax-winners-announced-b4b74ef42d5a)

---

## 7. Feasibility facts (build constraints)

- **Toolkit writes, not just reads:** Xero MCP server has `create-*`/`update-*` (invoice, contact, payment, credit-note, bank-transaction, quote, manual-journal, tracking-category…). Full list in `HACKATHON.md`. Agents that *act* are supported.
- **Custom Connection (OAuth2 M2M) works FREE on a Demo Company** — the one official free exception; full Accounting API read+write; can POST to seed demo data. [custom-connections](https://developer.xero.com/documentation/guides/oauth2/custom-connections/)
- **Rate limits:** 5 concurrent · 60/min · 5,000/day per org; 10,000/min app-wide; HTTP 429 on exceed. [limits](https://developer.xero.com/faq/limits)
- **Demo Company:** resettable sample data (contacts, invoices, bills, bank transactions); set region **UK** for payroll.
- **Treatwell data:** no public API, but Treatwell Connect exports **sales-proceeds CSV** + client list → file ingestion is the demo path (no OAuth).
- **Stack:** TypeScript/Node rides Xero's first-party MCP + `xero-node` SDK. Build via Claude Code + Lovable (UI) + Make (automation) for partner-prize eligibility.

---

## 8. Sourcing caveats to carry into any pitch

- "82% of failures = cash flow" (U.S. Bank via SCORE), Intuit "State of Cash Flow" (2019), JPMorgan cash-buffer-days (2020) are older but the most-cited primary figures — pair with 2025 data (Coface, QuickBooks 2025, Sage/CEBR, Xero XSBI) for freshness.
- UK late-payment closures/cost: current gov 2025 (£11bn / ~14k closures) vs legacy FSB (£2.5bn / ~50k) — different methodology; use the gov figure, note FSB legacy.
- Xero marketing rounds subscribers to "4.2M"; FY25 ASX filing states **4.4M** — filing figure used.
- Shopify no longer discloses an official merchant count ("millions in 175+ countries" is official; ~5.5M is a third-party estimate).
- Prize currency ($9k vs £9k) and partner-prize amounts remain unconfirmed — see `HACKATHON.md`.
