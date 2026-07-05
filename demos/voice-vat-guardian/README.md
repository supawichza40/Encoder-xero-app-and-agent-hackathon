# VAT Guardian — standalone voice demo

A one-page voice demo: the PayoutBridge assistant proactively calls Sarah, warns her that a
netted MarketplaceCo payout is hiding ~37% of a sale (£493 of £1,340) and nudging her turnover
toward the £90,000 VAT line, then posts a correction only on a spoken "yes". The approval lights
a badge on the page (in the full app the same token drives the real Xero posting).

Call script and judge Q&A: **[DEMO-SCRIPT.md](./DEMO-SCRIPT.md)**.

## Run it

```bash
# from this folder
export BIMPEAI_API_KEY=sk_xxx            # Team-scoped key — server-side only, never in a served file
export VAT_GUARDIAN_AGENT_ID=<agent id>  # printed by ./provision.sh (optional; page runs without it)
node server.mjs                          # → http://localhost:5173
```

`node server.mjs` **fails loudly and exits** if `BIMPEAI_API_KEY` is unset — no silent fallback.
Requires Node 18+ (uses built-in `fetch`); zero npm dependencies.

## The two manual steps (both plan-gated)

The static page + widget need only a **public client id** — no key in the browser. But getting
there needs two one-time actions, and **both require a Pro/Team plan**:

1. **Create the agent.** Run `BIMPEAI_API_KEY=sk_xxx ./provision.sh`. On a free plan this returns
   *"Agent limit reached"* — free a slot or upgrade first. See **[PROVISION.md](./PROVISION.md)**.
2. **Activate Web Voice.** In the agent dashboard: **Channels → Web Voice → Activate**, copy the
   generated **client id**, paste it into **`config.js`** (replacing `PASTE_CLIENT_ID_HERE`).

Until both are done, the page shows a **setup checklist** instead of a broken widget — that is
the intended idle state, not an error.

## If the plan gate bites (fallbacks, in order)

1. **Offline walkthrough (always available).** Click **"Play offline walkthrough"** on the page.
   It plays the exact golden-path transcript and lights the approval badge. It is clearly
   labelled *simulated — not the live agent*; never present it as the live call.
2. **Recorded fallback video.** Record one flawless golden-path run the night before (screen +
   audio) and play it if the network or widget fails on stage. Treat this as mandatory kit.
3. **Web Chat widget** (`agent.bimpe.ai/widget.js`, same client-id pattern) or the dashboard
   **Playground** voice, if Web Voice specifically is locked but chat/playground is not.

## Reset between runs

End the voice session and start a new one — a fresh conversation is fresh state, and the agent
re-opens with the warning every time. On the page, click **"Reset for next run"** to clear the
badge locally. `/api/status` reports the newest conversation, so a new session shows
unapproved again until the next spoken "yes".

## Files

| File | What it is |
|---|---|
| `index.html` | The demo page (scenario card, live status/badge, setup + fallback states). |
| `config.js` | Public client id for the voice widget (dashboard step). No secrets. |
| `server.mjs` | Zero-dep node server: serves the page + `/api/status` (marker poll). |
| `provision.sh` | One command: create agent → patch prompt → verify → smoke test. |
| `call-me.sh` | **Bonus, untested on stage** — makes the agent phone a number (PSTN add-on). |
| `.env.example` | Template for `.env` (gitignored). |
| `PROVISION.md` | Live provisioning status + receipts. |
| `AGENT-PROMPT-VAT.md` · `FACTS-BIMPEAI.md` · `PREFLIGHT.md` · `DEMO-SCRIPT.md` | Design + facts + guardrails + script (do not delete). |

## Naming rule (hard)

To judges this is *"our voice assistant"* / *"VAT Guardian, PayoutBridge's voice feature."*
Never say the platform vendor's name on stage; the agent never says it either. The live vendor
widget may show its own small branding — the offline walkthrough does not, so prefer it if that
matters for your run.
