# Judge Signals — the mentor's own reference architecture

_Captured 2026-07-04 from [usefulinfo.md](usefulinfo.md) link #1: `github.com/anangia261089/Tax-Insights/ARCHITECTURE.md` — **Ashish Nangia is Principal PM, AI Products at Xero and an on-site mentor** (see HACKATHON.md people list). This is his own AI-on-Xero build. Treat every pattern here as a direct signal of what the judging panel considers good architecture (the 20% rubric bucket) — and mirror the vocabulary in the pitch._

## His stack (April 2026)
Next.js 16 · Claude API (Anthropic) · Xero API (full OAuth 2.0) · Neon Postgres (Drizzle ORM) · iron-session · Vercel/Netlify. Product: AI chat assistant on Xero data for tax deductions, dual-persona (`/dashboard` small-business plain-English vs `/ab/dashboard` accountant data-dense with IRS refs + risk flags).

## Patterns he demonstrably values (mirror these)

1. **Per-tenant 5-min in-memory Xero cache** — his answer to the 60/min rate limit. Any agent hitting Xero repeatedly should show this.
2. **Skills-loader**: 5 markdown files composed into the system prompt (`persona.md`, `irs-reference.md`, `formatting.md`, section files) — **prompt-cached via `cache_control`**. Domain knowledge as versioned .md skills, not hardcoded prompt strings.
3. **`persona.md` is literally "JAX's voice, guardrails, hard rules"** — he prototypes with JAX's persona + guardrails. Guardrails/hard-rules framing = judge vocabulary.
4. **Per-tenant AES-256-GCM encryption** of stored chat/messages; token refresh handled in a dedicated `xero-auth.ts`. Security of ledger-adjacent data is on his checklist.
5. **A deterministic engine layer between Xero and the LLM** (`tax-engine.ts` categorises transactions into IRS sections) — grounding is code + authoritative reference docs, NOT raw-LLM guesses. This matches our idempotency/human-in-loop architecture story.
6. **"What Claude gives you free vs what we built" capability table** — crisp engineering framing; steal this table format for the pitch/README (judges have seen him use it).
7. **Streaming (SSE), follow-up-question suggestions, Recharts charts** — the UI affordances he considers baseline for an AI finance assistant.
8. **Has a "Planned: Agent Architecture" section** — he's thinking about agentic evolution; an entry that already IS agent-native lands ahead of his roadmap.

## How to use this

- **Build phase:** adopt patterns 1, 2, 4, 5 explicitly (cache, skills-as-md + prompt caching, encryption-at-rest note, deterministic engine + human-in-loop). Name them in the architecture slide with the same words.
- **Pitch:** include his capability table format ("Claude native ✅ / what we built"); mention per-tenant cache + rate limits unprompted — it answers the question before a judge asks it.
- **Q&A prep:** he will likely probe grounding (how do you stop hallucinated ledger writes?) — answer: deterministic engine decides, LLM explains; human approves writes; idempotency keys.

## Other usefulinfo.md links (already integrated)
- `apps.xero.com` + `productideas.xero.com` — already baked into the fresh-ideas scouts' prompts (app-store-gap + xero-cant-do-it lenses).
- `XeroAPI/xero-prompt-library` — already in HACKATHON.md toolkit list.

_Full architecture doc indexed in session knowledge base (source: `tax-insights-architecture`); re-fetch: raw.githubusercontent.com/anangia261089/Tax-Insights/main/ARCHITECTURE.md_
