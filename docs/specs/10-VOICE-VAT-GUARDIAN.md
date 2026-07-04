# PayoutBridge — Voice VAT-Guardian + JAX Chat (Extension Spec)

> **Status: OPTIONAL Phase-2 extension. NOT part of the locked core MVP.** Build the core golden path (£0.00 clearing) first (see BUILD.md); this layers on the approval gate and must be **toggleable** so it can never break the core demo.

## 1. What this adds

Two conversational channels bolted onto the existing `propose → approve → post` flow. Xero stays the system of record; these are just how the human is warned and says "yes".

| Channel | Tool | Direction | Purpose |
|---|---|---|---|
| **Voice / outreach** | **BimpeAI** (bimpe.ai) | **Proactive, outbound** | The "VAT-Guardian" — reaches the owner, explains the under-reporting in plain English, takes voice approval → triggers the Xero correction. |
| **In-app chat** | **JAX** (Xero's Just Ask Xero) | Reactive, in-Xero | "Ask about your books." **We do NOT build a chatbot — we build alongside JAX** and let it own the reactive Q&A. |

**Why this split is strong (and safe for the Xero judges):**
- **BimpeAI does what JAX cannot:** run in the **background** and **reach out** to the user (outbound WhatsApp / voice), and **forecast** (JAX is contractually banned from forecasting + advice). Proactive outreach + threshold projection is genuine white-space.
- **JAX owns reactive chat** — building our own chat-with-your-books would compete with Xero's own agent. We coexist. Xero-centrality is preserved: the *action* is always the Xero correction.

## 2. The VAT-Guardian value (the wow)

When a marketplace payout lands, the agent detects that booking it **net** under-reports turnover, and warns the owner **before HMRC would**:

- **The number:** true sales £1,340 vs netted £847 → **£493 hidden = ~37% of true turnover** understated (£493 ÷ £1,340). Commission £445.90 + fees £47.10.
- **The risk:** UK VAT registration is based on **turnover (£90,000/yr)**, not profit. Under-reporting can put a business that *thinks* it's under the line **actually over it** → late-registration means paying the VAT owed out of pocket **plus a penalty**.
- **The projection:** at the current run-rate the agent estimates when turnover crosses £90k (a forecast JAX can't give).

**Legal framing (mandatory):** this is a **flag/estimate, not tax advice.** Language must hedge — "you *may be* under-reporting", "on current trend you *could* approach the threshold", "confirm with your accountant." The **user approves** the bookkeeping correction (which is factual, correct accounting); we never assert an HMRC outcome. This mirrors why JAX itself avoids advice.

## 3. Use-case flow

```
Marketplace payout lands (upload or scheduled Xero bank-feed read)
   │
   ▼  PayoutBridge backend builds the gross-up proposal + VAT-Guardian check
   │
   ▼  (BimpeAI API) agent reaches owner via Web Voice widget / WhatsApp
BimpeAI agent speaks the warning + corrected figures  ──▶  owner: "yes" / "no"
   │  (BimpeAI tool-action fires on approval)
   ▼
PayoutBridge  POST /approve  ──▶  3 Xero writes  ──▶  clearing £0.00
   │
   ▼  confirmation back through BimpeAI ("done — turnover now £1,340, £493 logged")
   │
Separately: owner can open Xero and ASK JAX follow-ups ("what did MarketplaceCo cost me?")
```

## 4. Voice scripts (hedged — flag, not advice)

**Not VAT-registered (threshold hook):**
> "Hi Sarah — heads up. A £1,340 marketplace payout came in, but only the £847 net is in your books, so you're under-reporting your sales by about 37%. On your last 3 months' pattern, your true turnover looks close to the £90,000 VAT line — if you cross it and don't register you can end up paying the VAT out of pocket, plus a penalty. I've prepared the correction so your real numbers are visible. Post it? You can check with your accountant first."

**Already VAT-registered (accuracy + reclaim hook):**
> "Hi Sarah — your £1,340 marketplace sale is only showing as £847 net, so your VAT return is under-reporting turnover, and you're not reclaiming the VAT on the £493 commission you paid. I've prepared the correction — gross sales, commission as an expense, VAT captured. Approve?"

Both end with **approve / decline** — human-in-loop, their call. (Pitch team: mirror these into `build/06` Q&A.)

## 5. BimpeAI integration (grounded in the `AgenticHackathonNightLondon/` reference)

BimpeAI is a multi-channel AI agent platform: **WhatsApp · web chat · Instagram · Messenger · Web Voice widget**. Model = **workflow → agent → conversation**; the agent reasons over an inline KB and calls **tool-actions**; it POSTs **webhook events** back to your backend.

- **Auth:** Team API key (prefix `sk_`) from agent.bimpe.ai → `BIMPEAI_API_KEY` in `.env` (gitignored). SDK: `@bimpeai/sdk`. Docs: docs.bimpe.ai.
- **Key locality (BFF pattern):** `BIMPEAI_API_KEY` lives ONLY in the backend process. The browser/voice widget authenticates with a **signed session token**, never the raw key.
- **Wiring to PayoutBridge (the one integration point = the approval gate):**
  1. Backend builds proposal + VAT-Guardian summary → passes it to a BimpeAI agent as the conversation KB/context.
  2. BimpeAI agent runs the conversation (Web Voice widget or WhatsApp), speaks the warning, and exposes a tool-action `approve_correction`.
  3. On the user's "yes", BimpeAI calls the tool → BimpeAI **webhook** POSTs to our backend → backend calls the existing **`POST /approve`** → the 3 Xero writes run → clearing £0.00.
  4. Confirmation event flows back through BimpeAI to the user.
- **Reference build:** `refund-concierge` in the same folder does exactly this shape (voice agent → tool-action → webhook → dashboard). Mirror its BFF + webhook + SSE pattern; swap the refund tool for our `approve_correction` → `/approve`.

**⚠ To confirm from docs.bimpe.ai before building:** whether BimpeAI does literal **outbound PSTN phone calls**, or whether "call" = the **Web Voice widget** (talk in-app/browser) + **WhatsApp** outreach (phone-number-based). The scripts work on any of them; the demo should use whichever is most reliable on venue wifi.

## 6. Safety / scope guardrails

- **Toggleable** (like the Spline switch) — off by default; the core £0.00 golden path never depends on it.
- **Stage safety:** prefer the **Web Voice widget** or a **recorded/simulated call** over a live outbound call that can drop; keep BimpeAI's own in-memory/seed reset for clean demo runs.
- **Xero stays the hero** — voice is the delivery channel; the £0.00 clearing is still the pitch climax.
- **Core first** — do not let this delay the locked golden path. This is the cherry, not the cake.

## 7. Open items
- Confirm BimpeAI outbound-call vs WhatsApp/web-voice capability (docs.bimpe.ai).
- Seed the Demo Company near ~£85–95k turnover so the threshold-crossing warning is numerically real.
- Decide demo channel (web voice widget recommended for reliability).
- Pull §4 scripts into the pitch Q&A (`build/06`).

## 8. Demo posture + production privacy architecture

**BimpeAI is a DEMO stand-in, not the product.** For the hackathon we use BimpeAI to *demonstrate* the voice/outreach experience fast — because building the whole voice stack in a weekend isn't feasible, and BimpeAI lets judges *feel* the experience today.

**Production = built with / alongside Xero, no third-party service.** The real product builds the **same capability natively on Xero** (proactive voice/outreach + approval) — either inside the Xero-integrated agent or as a tool that works alongside Xero. That is the whole privacy answer: because production carries no third-party conversation cloud, **customer data never leaves the Xero-governed environment**, so a privacy-conscious owner has nothing to worry about. The demo shows *what* it does; production changes *who runs it* (us on Xero, not a third party).

**Self-contained demo (no connection to our production web).** The demo runs standalone against the Xero Demo Company + synthetic data — it does **not** call our production backend/site. It exists so judges *understand the experience*. The voice layer is **optional and has zero dependency**: toggle it off and the core £0.00 golden path is completely unaffected.

**Production privacy architecture (design intent — shown conceptually, not fully built in the demo):**
- Sensitive customer data (conversation content, PII) is **encrypted**; **decryption happens only inside our private/local model environment.**
- Third-party services in the pipeline (voice/transport) handle **ciphertext only** — they never see decrypted customer data.
- Encryption keys **never leave the private environment**; the local model is the **sole decryption point**.
- **Scope:** this protects the data *we* process through the AI/voice layer. The **Xero ledger itself lives in Xero** and is governed by Xero's own security/compliance — we don't claim to re-secure Xero's data.

**Honesty guardrails (so a security-minded judge can't poke a hole):**
- **NEVER name BimpeAI (or any third-party vendor) in the pitch or live demo.** Present the voice as **our own assistant / our voice feature** — BimpeAI is internal demo plumbing only, kept in this spec for the team, not shown to judges. Selling another company's product to Xero judges dilutes Xero-centrality and can annoy them. Just *show the voice working*; don't attribute it.
- **Do NOT claim "impossible to intercept / cannot be extracted."** No system is absolute; that invites attack. Say instead: *"third parties in the pipeline only ever handle ciphertext; the private local model is the only place data is decrypted, and keys never leave it."*
- Because BimpeAI is a **third-party cloud**, the **demo uses synthetic data only** (Sarah / MarketplaceCo) — no real customer data flows to BimpeAI. The encrypted + local-model privacy model describes the **native production build**, not the BimpeAI demo. State this openly; it resolves the otherwise-contradiction of "we protect data" while using a cloud voice tool.
- Present the privacy architecture as the **production design** (a diagram / spoken explanation), never as something fully wired in the running demo. Pitching the vision is fine; claiming the demo *is* the secured production system is not.

**One-line pitch framing:** *"Today's voice is a stand-in so you can feel it; in production we build this natively on Xero — no third-party service, so your customer data never leaves the Xero-governed environment. The voice is optional; the correction works with or without it."*
