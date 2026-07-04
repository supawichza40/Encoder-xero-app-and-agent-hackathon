> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 1.

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

