# Xero Hackathon — Field Notes & Extra Intelligence

Everything useful found across research that is **not** already in [HACKATHON.md](HACKATHON.md) (event brief, toolkit, plan, feasibility) or [RESEARCH.md](RESEARCH.md) (JAX, candidate problems, market stats, saturation map). No repeats. Ordered roughly most-actionable first.

---

## 1. Demo & pitch execution playbook (from real judges) ⭐ highest ROI on Sunday

The scoring *weights* are in HACKATHON.md; these are the **tactical moves** that decide ties, pulled from judge interviews ([JetBrains — Notes From the Judging Table, 2026](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)):

**Before building**
- Read the rules; find out **who's judging** and what they care about; if you can talk to them before building, do it. (Judges here are Xero API/Product/Eng — see HACKATHON.md guests.)
- Limit unknowns: use tools + teammates you already know. Don't stack a new framework + new team + new domain at once.
- Start from the annoyance, not the tool: "what can I build now that I couldn't before?"

**Scope**
- Do **one** thing well, not five half-built. If the demo runs long, that's a scope problem — cut features, not narration.
- One clear "oh, this is possible now" moment beats a feature tour.

**The demo IS the pitch (3-min + Q&A here)**
- Lead with the **problem** — make judges *feel* it before showing anything.
- Show something **working within ~90 seconds**.
- Put the judge **in the user's shoes** — walk them through what actually happens.
- **Mock everything you can**: pre-fill forms, stub the slow/flaky API call, remove every place the demo could stall.
- Be **honest** about what works vs. doesn't — reads as confidence; judges detect hand-waving.
- A working demo beats clean architecture nobody sees.

**Rehearse**
- "Visualize winning and work backwards" — build toward the exact demo that wins.
- Run it out loud at least once; **time it** to 3:00. The pitch is part of the product.
- Enthusiasm is visible and persuasive — let it show.

---

## 2. Build-tool free-tier limits (plan around these)

- **Lovable Free:** ~5 build credits/day (up to 30/month), ~20 cloud credits/month, **public projects only**. Real apps burn credits fast — fine for a UI shell, may wall on a heavy build. Grab sponsor promo credits on the day. [Lovable pricing](https://lovable.dev/pricing)
- **Make Free:** $0, **1,000 operations/month**, **2 active scenarios**. Enough for one demo automation flow. [Make pricing](https://www.make.com/en/pricing)
- Implication: hand-code the core (Claude Code + TS), use Lovable for the shell (Lovable prize), Make for one automation (Make prize) — see partner-prize plan in HACKATHON.md.

---

## 3. Xero technical gotchas for building (not in the other docs)

- **Tracking categories cap:** Xero allows a **maximum of 2 active tracking categories**, ~100 options each. This is the mechanism for per-treatment / per-platform / per-channel analytics — but you get only 2 dimensions. Design around it. *(Verify exact limits on Xero Central before relying on it.)*
- **Correct reconciliation pattern = "gross up through a clearing account":** post the full **gross** sale, book commission/fees as expense, and the residual **net** must equal the bank-feed line. A bank feed alone books the **net** deposit as revenue by default — the root cause of mis-stated marketplace books. [socialcommerceaccountants](https://www.socialcommerceaccountants.com/blog/shopify-payout-reconciliation)
- **Agent idempotency is a scoring point (the 20% architecture):** never double-post a booking / double-chase / double-pay. Keep an external id → Xero id map and a run/audit log. "Financially trustworthy" is explicitly what the judges want.
- **Human-in-the-loop before posting:** for anything touching tax or the ledger, add confidence scoring + a review/approve step rather than blind auto-post. A wrong journal is worse than none.
- **OAuth scopes you'll likely request** (Custom Connection): `accounting.transactions`, `accounting.contacts`, `accounting.settings`, `accounting.reports.read`, plus `.read` variants; payroll needs `payroll.*`. Granular scopes apply to connections created from 29 Apr 2026 (broad scopes usable until Sept 2027). [Xero scopes](https://developer.xero.com/documentation/guides/oauth2/scopes/)

---

## 4. Marketplace / commission mechanics (build-relevant detail)

RESEARCH.md has the scale + the A2X/Link My Books gap. These are the **mechanics** you'd model:

- **Treatwell commission model:** ~**35%** on a new client's first marketplace booking (some sources cite 42.5% inc VAT), **0%** on repeat bookings within a **365-day** rebooking window, plus ~**2.5% + VAT** online-prepayment fee; billed on **twice-monthly** invoices. [Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/) · [how commission works](https://partners.treatwell.com/hc/en-gb/articles/360015011760-How-does-Treatwell-s-commission-work-)
- **Platform commission spread** (for a "net margin after fees" engine): Amazon referral 8–15%, Etsy ~12–20% all-in, Uber Eats UK 30% (13% pickup), Deliveroo up to 35%. (Sources in RESEARCH.md §3.4.)
- **Mixed-VAT trap:** ~15–20% of Amazon sellers struggle with mixed standard/zero/reduced VAT rates and often **overpay**; since Jan 2021 the marketplace is liable for UK VAT on many overseas-seller sales, but the **seller remains responsible for their own records**. [Link My Books — Amazon VAT](https://linkmybooks.com/blog/amazon-vat) · [gov.uk marketplace VAT](https://www.gov.uk/guidance/vat-and-overseas-goods-sold-to-customers-in-the-uk-using-online-marketplaces)
- **Month-end accrual timing trap:** a sale settling Mar 30 but paid out Apr 4 — revenue belongs in March, cash in April; matching them is wrong in both months. Most cash-basis sellers don't apply accrual. [ecomcpa](https://ecomcpa.com/the-payout-reconciliation-gap-why-amazon-shopify-and-tiktok-shop-deposits-are-wrecking-ecommerce-books-in-2026/)
- **A2X** has done per-payout journals since 2014 — mature incumbent for ecommerce, so differentiate on the **connector-free / service-gig** angle, not "another A2X."

---

## 5. Per-opportunity build sketches (the "how would you actually build it in a weekend")

RESEARCH.md scores the candidates; these are the concrete build shapes (from the App Store gap analysis):

- **Supplier-statement reconciliation:** ingest statement (PDF/email/photo) → LLM extracts line items → fuzzy-match against Xero bills/payments via Accounting API → discrepancy report (missing bills, part-payments, duplicates) → **draft the supplier chase email**. Demoable with one messy statement.
- **CFO Copilot (forecast + act):** pull AR/AP/bank via API → rolling forecast weighted by each customer's real pay-lateness → NL scenario layer ("what if my top client pays 30 days late?") → detect shortfall → recommend/execute levers (chase X, delay bill Y). Late-payment prediction is reportedly high-accuracy. [MaxCredible](https://www.maxcredible.com/kennisbank/can-ai-predict-which-invoices-will-be-paid-late/)
- **VAT/MTD pre-filing review:** pull the VAT report + underlying transactions → LLM anomaly pass with jurisdiction rules → plain-English explanations + one-click reclassification → hand a filing-ready return to MTD.
- **Books-cleanup / remediation:** API pull of coded transactions → LLM classifies error patterns (Uncategorised pile, COGS-in-expenses, loan principal/interest split) → generate correcting journals → approve-and-post with audit trail. (Differentiate from XBert/Booke which only *flag*.)
- **Marketplace/gig reconciliation:** LLM infers any payout CSV/PDF schema → decompose into gross/commission/fee/VAT/refund/net → post clearing-account journal or per-transaction lines with a per-platform tracking category → net-margin analytics. Demo with 2–3 real *unconnected* statements.

---

## 6. Salon / booking ecosystem (context if the spa angle resurfaces)

- Xero's official **"Salon management software"** collection lists **Timely, Zenoti, ChiDesk**; ecosystem apps advertising Xero links: Phorest, Kitomba, You'reOnTime, Pabau, Mangomint. [Xero salon collection](https://apps.xero.com/uk/collection/salon-management-software)
- Integration granularity is **summary-level, not per-treatment**: Phorest syncs financial **totals** daily at 1am; Fresha syncs at mapped-account/journal level. Neither gives per-booking commission detail. [Phorest×Xero](https://support.phorest.com/hc/en-us/articles/7555464310546-How-do-I-integrate-Phorest-with-Xero-or-QuickBooks)
- **Treatwell has no Xero integration at all** and is absent from Xero's salon collection — the cleanest "no incumbent connector" story.
- Treatment-profitability reports exist **inside** Phorest/Fresha/GlossGenius — never in the ledger, never tied to marketplace commission.

---

## 7. Misc signals worth knowing

- **Xero distribution reality:** 4.4M subscribers, UK is Xero's largest *international* market, 1,000+ App Store apps — a winning build has a real distribution path post-hackathon (good for the pitch's "impact" beat). (Full figures in RESEARCH.md §2.)
- **Past-winner pattern:** Xero Developer Challenge winners filled a **workflow gap around the API** for SMBs (not another dashboard). Frame the pitch as "unserved workflow," not "nicer report." (RESEARCH.md §6.)
- **API Explorer** lets you hit real endpoints against your Demo Company from the browser before writing code — fast way to see response shapes. [API Explorer](https://api-explorer.xero.com/) (link also in HACKATHON.md).
- **Confidence-gap narrative** ("owners are confident but wrong": 95% feel in control, 90% hit surprise crunches) is the single strongest *story* hook for any cash-flow pitch. (Stats in RESEARCH.md §3.6.)
- **Submission unknowns to confirm on arrival:** submission platform (Devpost?), required deliverables (repo / demo video / deployed URL?), and whether one project can win multiple bounties — these shape how you package. (Tracked in HACKATHON.md.)
