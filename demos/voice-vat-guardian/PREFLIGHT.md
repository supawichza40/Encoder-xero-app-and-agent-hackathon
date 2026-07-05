# PREFLIGHT — Voice VAT-Guardian standalone demo — 2026-07-05

## Verdict: READY (0 decisions open — all answered at plan gate)

Scope: `demos/voice-vat-guardian/` only. Standalone BimpeAI web-voice demo of spec
`docs/specs/10-VOICE-VAT-GUARDIAN.md`. Zero imports/calls to `src/frontend` or
`src/backend`. Core golden path untouched.

| Class | Instance | Status | Evidence |
|---|---|---|---|
| 1 External reality | BimpeAI console API (`https://api.bimpe.ai/api/v1/console`) | PROVEN | `GET /agents` → HTTP 200, `GET /workflows` → HTTP 200 with Team key (`sk_…`, from AgenticHackathonNightLondon/.env). Existing agents visible incl. `Refund Concierge — demo` (`cmqtuq8xu010fpc6ekpx596ux`). Key is Team-scoped; same key worked 2026-06-25 → today (no observed expiry). |
| 1 External reality | Outbound PSTN phone-call capability | OPEN → Wave-1 recon | Spec 10 §7 open item. Channel decision already made (web-voice widget); recon confirms phone as bonus only, never a blocker. |
| 2 Cold-boot | Demo page from clean checkout | WAVE-1 GATE | Greenfield. Definition of done: `README` one-command start; page loads with no prior state; missing `.env` fails LOUDLY with a printed message, no silent fallback. |
| 3 Decision forcing | Channel / location / scenario | DECIDED at plan gate | web-voice widget · `demos/voice-vat-guardian/` · not-VAT-registered threshold warning primary, VAT-registered reclaim as bonus branch. |
| 3 Decision forcing | Xero turnover seeding (spec §7 "seed near £85–95k") | DECIDED | Standalone demo ⇒ numbers live in the agent's inline KB (synthetic "last 3 months" pattern), NOT in Xero. No Xero dependency for this demo. |
| 3 Decision forcing | Vendor naming | DECIDED (spec §8) | Judges never hear "BimpeAI". Agent self-identifies as the PayoutBridge voice assistant ("VAT Guardian"). |
| 4 Contract freezing | Approval marker token | FROZEN | Literal `[[APPROVE_CORRECTION]]`, case-insensitive detect, emitted exactly once, last line of the turn where the owner says yes; never in refusal/decline turns; never spoken aloud. Mirrors proven `[[ISSUE_REFUND]]` contract (reference AGENT-PROMPT.md §1 — token-only detection; loose phrase regex is known-unsafe). Producer: agent prompt. Consumers: demo page transcript badge + Wave-3 verifier. |
| 5 State completeness | Demo page surfaces | ENUMERATED | idle (pre-widget), widget-loading, voice-active, agent-speaking, approved (marker badge), declined, error (widget/network fail → on-screen fallback instructions). |
| 6 Gates at zero | Static page, no CI suite | LIGHT GATE | Gate = page serves with zero console errors; grep proves no `sk_` string in any client-served file; Wave-3 verifier is the runtime gate. |
| 7 Environment | node v22.23.1, npx 10.9.8, curl OK | PROVEN | `node -v` / `npx --version` from executing shell; BimpeAI curl round-trip above. |
| 8 Artifact durability | This file + AGENT-PROMPT-VAT.md + FACTS-BIMPEAI.md + DEMO-SCRIPT.md | ENFORCED | All committed under `demos/voice-vat-guardian/`. No scratchpad-only decisions. |

## Security finding (fixed forward at preflight)

Root `.env` (Xero creds) was **tracked by git** on a public repo (`.gitignore` covered
only `.env.local`). Fix applied with this commit: `.env` added to `.gitignore`,
`git rm --cached .env`. History still contains old values — covered by the planned
post-hackathon rotation. New `BIMPEAI_API_KEY` goes only in gitignored env files.

## Forced decisions

None open — all three answered at the plan gate (see Class 3 rows).

## Wave-1 gates carried forward

- Cold-boot: one-command start; loud failure on missing env.
- Recon: confirm widget embed mechanism + session-token flow + whether PSTN calling exists (bonus info only).
- No-secret-in-client gate re-checked at build and verify waves.

## Hard guardrails for every worker

- Operate ONLY on the newly created VAT-Guardian agent/workflow. **Never modify** existing
  agents `Refund Concierge — demo`, `test`, `Beauty & Stylist Booking`.
- `BIMPEAI_API_KEY`: read from env, never print, never commit, never send anywhere
  except `api.bimpe.ai`.
- Do not touch `src/frontend`, `src/backend`, or the golden CSV.
- Shared artifacts in `demos/voice-vat-guardian/` are pipeline state — not yours to clean.
