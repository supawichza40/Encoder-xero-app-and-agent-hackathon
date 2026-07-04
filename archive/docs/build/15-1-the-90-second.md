> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 15.

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

