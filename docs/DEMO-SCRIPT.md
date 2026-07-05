# PayoutBridge — Master Demo Script

**Target: 5:00 stage slot — script written to ~4:30 so the close is unhurried.**
Single presenter. Every stat is sourced (see [Sources](#sources)).
Reflects repo state at `1c18f44` (persona merge) + live golden-path run of 2026-07-05.

> Delivery marks: **[pause]** = 2 beats of silence. **[slow]** = drop the pace. **[emphasis]** = the sticky line, punch it.

---

## 0:00–0:45 — Hook: the invisible 37%

*(Screen: persona dashboard, owner view — the "£493 they quietly kept" count-up visible but muted. Don't touch anything yet. Look at the judges.)*

> "A salon owner sells £1,340 of treatments through a marketplace this week.
> The marketplace keeps £445.90 in commission and £47.10 in fees, and deposits £847 in her bank.
>
> Her books record £847. That's it. One bank line.
>
> **[slow]** Thirty-seven percent of that sale — £493 — has just vanished from her accounts. The revenue is understated. The costs are invisible. And she did nothing wrong — that's just what the bank feed shows.
>
> **[pause]**
>
> This is not a niche problem. The UK has over 45,000 hair and beauty businesses; nearly two-thirds turn over less than £99,000 a year — living right around the £90,000 VAT registration line. Treatwell alone partners with over 50,000 salons across 13 countries, charges 35% commission on new-client bookings plus a 2.5% processing fee, and pays out net. Every one of those payouts does to a salon's books exactly what you just saw."

## 0:45–1:20 — Why it hurts: HMRC sees what the books don't

> "Here's why this is dangerous, not just untidy.
>
> VAT registration is triggered by **turnover**, not profit — £90,000 on a rolling 12-month test.
>
> Book the net, and a salon with this payout every week hides about £25,600 of turnover a year. Take a real shape: £45,000 of walk-in sales plus a year of these payouts. True turnover: £114,680 — well over the line. The books say £89,044.
>
> **[slow]** Nine hundred and fifty-six pounds *under* the threshold. The breach is invisible to the person who's liable for it.
>
> And she's the last to know. Since 2024, platforms must report every seller's earnings to HMRC, fees itemised — last year HMRC received data on almost four million online sellers and started sending nudge letters. HMRC can reconcile the platform's numbers. Her books can't.
>
> When it surfaces: VAT backdated to the day she should have registered — roughly £19,000 on a year like that — plus a failure-to-notify penalty of up to 30% of the tax. If HMRC decides it was deliberate: up to 70%.
>
> **[emphasis]** Careless bookkeeping isn't a bookkeeping problem. It's a tax liability with her name on it."

*(Illustrative-figure note, not spoken: ~£19k = VAT fraction (1/6) of £114,680 VAT-inclusive takings for one unregistered year. Say "roughly". If pressed, the arithmetic is in the Q&A bank.)*

## 1:20–1:35 — Insight + solution

> "Here's what everyone misses: the fix is three specific accounting entries — a gross invoice, the deducted costs, and a settlement through a clearing account. Accountants call it a clearing-account gross-up. Owners have never heard of it.
>
> PayoutBridge is a Xero-native agent that reads the settlement statement, proposes those entries, and posts them — **only after a human approves**."

## 1:35–3:10 — Live demo: the golden path

*(Navigate to `/app`. Real mode: backend on :8000, seeded Demo Company. If the health check fails the app visibly drops to Demo mode and everything still works — keep talking either way.)*

**Beat 1 — Upload (1:35).** Drag `marketplaceco-payout-0407.csv` in.

> "MarketplaceCo's settlement statement. The parser is deterministic — no LLM touches the numbers."

**Beat 2 — The proposal + invariant (1:50).** Plan preview appears.

> "PayoutBridge proposes the three entries: invoice £1,340 of gross revenue, £493 of commission and fees, settle through a clearing account. And it proves its own arithmetic — gross minus commission minus fees equals net, to the penny, or it **refuses to post anything**."

**Beat 3 — Human approval (2:05).** Open the approval drawer. Point at it.

> "Nothing writes to Xero without this. Every entry, itemised, one explicit human yes."

Click Approve.

**Beat 4 — The wow moment (2:15).** StepProgress runs the 3 writes; ClearingReconciliation ticks down.

> "Three real writes to a real Xero organisation. Invoice… spend transaction… payment into clearing. The clearing account opened at minus £847 — the deposit we couldn't explain. Watch it."
>
> **[slow]** "…and there it is. **Zero pounds, zero pence.** The books now agree with reality, and the £493 the marketplace kept is sitting in expenses where it belongs — tax-deductible."
>
> **[pause — let the £0.00 sit on screen]**

**Beat 5 — Proof it's real (2:40).** Switch to the Xero Demo Company tab (pre-opened): the paid £1,340 invoice, the £493 spend transaction (ref `MC-PAYOUT-0407`), the payment into Platform Clearing — plus the audit history notes PayoutBridge left on each record.

> "Same records, inside Xero itself. And every write carries an audit note — this agent signs its work."

**Beat 6 — Safety (2:55).** Drag the same CSV in again.

> "Run it twice? It won't double-post — it recognises the file by hash and shows the three Xero IDs it already created. Idempotent, per step: crash after write one, it resumes at write two."

## 3:10–3:40 — One product, three humans

*(Back to `/`, switch persona in the navbar as you speak.)*

> "Who reads this screen matters. The **owner** gets plain English — what they kept from you, whether you're drifting toward the VAT line. The **bookkeeper** gets run history, hashes, and a one-click evidence pack — the file her accountant asks for at year-end. The **freelancer** — and 58% of this sector's workforce is self-employed — gets no jargon at all: money in, what you can deduct, one amber warning if real turnover says register.
>
> And the assistant answers questions about *these* numbers — it knows this payout, this P&L." *(Type one question into the chat, e.g. "where did the £493 go?" — let two lines stream, move on.)*

## 3:40–4:15 — The voice agent (video)

*(Play the pre-recorded call video — ~30s cut. See the recording checklist below. **Naming rule, hard: it is "our voice assistant" / "VAT Guardian". Never say the vendor's name on stage — the agent won't either.**)*

> "Dashboards only work if you open them. So VAT Guardian doesn't wait — it calls the owner."

*(Video plays: the agent warns Supa that only £847 of a £1,340 payout is in her books, that her real turnover is edging toward the £90,000 line, and offers the prepared correction; she asks where the £493 went; it explains; she says "yes, post it".)*

> "A phone call that catches a VAT-threshold breach her own books can't see — and the fix is one spoken yes. That's the loop closed: statement in, truth in Xero, human in control, zero balance proved."

## 4:15–4:45 — Impact + close

> "Zoom out. Small businesses account for 62% of the UK's £59.2 billion tax gap — and the single biggest behaviour behind that gap isn't evasion. It's *failure to take reasonable care*: 35%. Booking the net instead of the gross is exactly that, at national scale. The industry body has told Parliament that salons restructure their whole businesses just to stay under the VAT threshold — while their books mis-state where they actually are.
>
> And from April 2026, Making Tax Digital pulls sole traders over £50,000 into quarterly digital filing — the books have to be right all year, not just in January.
>
> PayoutBridge makes the real numbers show — proposed by an agent, approved by a human, proved to zero.
>
> **[emphasis]** Thirty-seven percent of every sale shouldn't be invisible. Now it isn't."

---

## Q&A objection bank

**"Is this real or faked?"**
Honest split: the three Xero writes, the £0.00 clearing verification, the idempotency, the audit notes — all real, live against the Xero Demo Company (record IDs on file, run artifacts committed). The dashboard trend charts are labelled illustrative demo data. The voice agent is a real live agent (verified 6/6 on its script), shown by video for stage reliability; it doesn't write to Xero — it triggers the same approval flow.

**"Why not just use the Xero MCP server directly?"**
We do — plus raw REST where MCP can't reach: authorising invoices, bank transfers, account creation, attachments, and history notes are all MCP gaps we bridged. The agent layer adds the invariant check, human approval, idempotency, and audit trail that raw API access doesn't give you.

**"What was actually hard?"**
Xero MCP v0.0.17 has broken and missing tools (`update-bank-transaction` broken; no account creation, no invoice authorisation) — we built a raw-REST client-credentials layer around it. And getting a *provable* zero: the clearing-account design means the demo ends in an arithmetic proof, not a claim.

**"How is this different from A2X / Link My Books?"**
Those are settlement-sync tools for e-commerce channels (Amazon/Shopify-centric), sync-only. PayoutBridge is agentic with human-in-the-loop approval, explains itself to three personas in their own language, proactively warns on the VAT threshold, and reaches the owner by voice — not only the bookkeeper by dashboard.

**"Business model?"**
Per-seat SaaS on the Xero App Store; the wedge is beauty/wellness marketplaces (45,000+ UK businesses, and 53% of UK small businesses use an online platform), expanding to any net-settling platform.

**"Does it scale? What breaks at 100×?"**
Xero rate limits (60/min, 5,000/day) bound one tenant; the golden path uses ≤10 calls, so hundreds of payouts per tenant per day fit. The state layer is local JSON for the demo — first production change is a real database and OAuth per tenant.

**"Walk me through the £19,000."**
£114,680 of VAT-inclusive takings in an unregistered year → VAT fraction is 1/6 ≈ £19,100 owed back, before penalties (failure-to-notify: up to 30% non-deliberate, 20–70% deliberate — gov.uk factsheet CC/FS11). Illustrative, stated as "roughly" on stage.

**"Doesn't HMRC's platform reporting fix this anyway?"**
It makes it worse for the seller: HMRC now holds the platform's itemised numbers, but the seller's own books still show net — the mismatch is machine-detectable on HMRC's side and invisible on hers. Reporting created the enforcement risk; PayoutBridge fixes the books.

**"Why would she not just notice the threshold herself?"**
Her books literally read £89,044 — £956 under. The under-statement is small per payout (£493) and compounds silently. That's the core insight of the demo.

**"What would you do with one more week?"**
Hosted backend (Render config written, not deployed), real OAuth for any Xero org, and the refund/4-write path live-verified (built and tested; only the golden path is live-proven).

---

## Pre-demo checklist (run morning-of)

1. Backend: from `src/`, `uvicorn backend.main:app --port 8000`; check `GET /health`.
2. Demo Company can reset — verify the 3 records still exist (IDs in `src/state/posted.json`); if wiped, re-run `src/scripts/reset_rehearsal.py`.
3. Pre-open tabs: app `/` (owner persona), app `/app`, Xero Demo Company (invoice + bank transaction + clearing account), video file.
4. Frontend `bun dev`; confirm which port it binds and that backend CORS covers it. Hosted fallback: https://supawichza40.github.io/Encoder-xero-app-and-agent-hackathon/ (mock mode — safe, visibly labelled; confirm Pages serves the post-persona build).
5. Chatbot: needs `VITE_OLLAMA_API_KEY` / `VITE_OPENROUTER_API_KEY` in `src/frontend/.env.local` at build/dev time; without keys it visibly falls back to scripted answers — still demoable.
6. Golden CSV at `src/data/marketplaceco-payout-0407.csv`; same file ready again for the idempotency beat. `sample-3-wont-balance-REFUSED.csv` on hand if a judge asks to see the refusal.
7. Video plays with sound from the demo machine (test venue audio).

## Voice-agent video — recording checklist (do the night before)

1. `cd demos/voice-vat-guardian && export BIMPEAI_API_KEY=… && node server.mjs` → http://localhost:5173.
2. Fresh session; grant mic permission **before** recording.
3. Record screen + audio of the golden path in `demos/voice-vat-guardian/DEMO-SCRIPT.md` (beats 1–5, under 90s): agent opens with the £493 warning → "where does the £493 go?" → threshold explanation → "is this tax advice?" hedge-check → "yes, post it" lights the badge.
4. Cut to ~30s for stage: keep the opening warning, the £493 answer, and the spoken approval.
5. Fallback order on stage: video → live session → "Play offline walkthrough" (labelled simulated).
6. **Never the vendor's name** — on the recording or from your mouth. "Our voice assistant" / "VAT Guardian".

## Do NOT claim on stage (audited 2026-07-05)

- **Live P&L before/after** — the committed live snapshots read zeros; the 847→1,340 P&L story is mock-mode only unless you re-run and re-verify first.
- Hosted backend — not deployed; Real mode = localhost only.
- Voice agent writing to Xero — it doesn't (standalone; badge only).
- Refund 4-write path as "live-proven" — tested, not live-verified.
- Owner/freelancer trend charts as real data — labelled illustrative.
- "Platforms report gross to HMRC" — imprecise; they report earnings **with fees itemised** (script wording already safe).

---

## One-card cheat sheet

- **Hook:** "£1,340 sold. £847 in the books. 37% of the sale just vanished."
- **The metric:** clearing account **£0.00** — say it slowly, let it sit.
- **Sticky close:** "Thirty-seven percent of every sale shouldn't be invisible. Now it isn't."
- **Three likely questions:** real-or-faked (split is in the bank) · different-from-A2X (agentic + HITL + voice) · the £19k arithmetic (1/6 of £114,680).

---

## Sources

| Claim | Source |
|---|---|
| 45,000+ UK hair & beauty businesses (current NHBF headlines range ~51k–61k depending on definition); ~64% turn over < £99k; 95% employ < 10; 58–63% of workforce self-employed | NHBF Industry Statistics — nhbf.co.uk/about-the-nhbf/campaigning-for-you/industry-research-reports-and-statistics/nhbf-industry-statistics/ (2021 & 2024); icaew.com/library/industry-profiles/hairdressing-and-beauty-treatment (updated 26 May 2026, citing NHBF 2024). Wider definitions give ~61k businesses (policybee.co.uk, 2025 — secondary) |
| Salons deliberately stay under the VAT threshold / restructure to avoid it | NHBF written evidence to Commons Business and Trade Committee — committees.parliament.uk/writtenevidence/143545/pdf/ (2025); alternate verifiable link: committees.parliament.uk/writtenevidence/128936 |
| 53% of UK small businesses use an online platform | FSB "Net Benefits?" policy report — fsb.org.uk (16 Oct 2023) |
| 50,000+ Treatwell salon partners, 13 countries | Treatwell corporate boilerplate via indeed.com/cmp/Treatwell (2025), builtinlondon.uk (2026: "over 55,000"). Treatwell's own pricing page claims "over 150,000 salons across Europe" (incl. software users) — treatwell.co.uk/partners/pricing (2026); 50k used as the conservative floor |
| Half a million customers search Treatwell daily | treatwell.co.uk/partners (2026) |
| 35% new-client commission; 0% repeat; 2.5% processing fee (+VAT); net payouts, fees settled by invoice | treatwell.co.uk/partners/pricing (2026); treatwell.co.uk/info/supplier-terms-and-conditions (2026) |
| £90,000 VAT registration threshold; rolling 12-month test; register within 30 days; backdated VAT if late | gov.uk/register-for-vat/when-register-for-vat (verified live 2026); gov.uk/vat-registration-thresholds |
| Inaccuracy penalties: careless 0–30%, deliberate 20–70%, concealed 30–100% of potential lost revenue | gov.uk factsheet CC/FS7a (updated 30 Apr 2025) |
| Failure-to-notify penalties: non-deliberate up to 30%, deliberate 20–70% | gov.uk factsheet CC/FS11 (updated 19 Mar 2026) |
| Tax gap 2024–25: £59.2bn / 6.4%; small businesses 62%; failure to take reasonable care 35%, error 16%; VAT gap £12.1bn | Measuring tax gaps 2026 edition — gov.uk/government/statistics/measuring-tax-gaps (23 Jun 2026) + gov.uk press release "Tax gap 2024-25 estimated at 6.4%" |
| Platform reporting: in force 1 Jan 2024, first reports Jan 2025; earnings reported with fees itemised; 31 Jan annual deadline | gov.uk/guidance/selling-goods-or-services-on-a-digital-platform (2025); gov.uk reporting-rules-for-digital-platforms policy paper; SI 2023/817 for platform-side penalties |
| HMRC received reports on ~3.99m online sellers (~£55bn) for 2025; nudge letters under way | BDO — bdo.co.uk "HMRC plans fresh tax crackdown…" (17 Mar 2026) — reputable tax press, MED confidence |
| MTD for Income Tax: 6 Apr 2026 for qualifying income > £50,000 (then £30k 2027, £20k 2028) | gov.uk/guidance/check-if-youre-eligible-for-making-tax-digital-for-income-tax (updated 26 Mar 2026) |
| £1,340 / £445.90 / £47.10 / £847; clearing £0.00; 3 Xero write IDs | This repo: `src/data/marketplaceco-payout-0407.csv`, `src/state/posted.json`, `src/state/audit.json` (live run 2026-07-05) |
| Worked example (£25,636/yr hidden; £114,680 true vs £89,044 booked) | Computed: £493 × 52 = £25,636; + £45,000 assumed direct sales; £847 × 52 + £45,000 = £89,044. Assumptions labelled |
