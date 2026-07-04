> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 12.

## 12.1 Eight named patterns to mirror (name them on the architecture slide, in his words)

1. **Per-tenant 5-minute in-memory Xero cache** — his explicit answer to the 60/min rate limit (mirror in `xero.ts`).
2. **Skills-loader:** domain knowledge as versioned **markdown `.md` skills** (`persona.md`, `irs-reference.md`, `formatting.md`, section files) composed into the system prompt and **prompt-cached via `cache_control`** — not hardcoded strings.
3. `persona.md` is literally **"JAX's voice, guardrails, hard rules"** — **"guardrails / hard-rules" is judge vocabulary**; use it.
4. **Per-tenant AES-256-GCM encryption** of stored chat/messages; token refresh isolated in a dedicated `xero-auth.ts`.
5. **Deterministic engine layer between Xero and the LLM** (`tax-engine.ts` categorises transactions) → **"the deterministic engine decides, the LLM only explains."** (This is exactly our `planner.ts` invariant story.)
6. A **"what Claude gives you free vs what we built" capability table** (reproduced in §12.2).
7. Streaming (SSE), follow-up-question suggestions, Recharts charts = his baseline AI-finance UI affordances.
8. He has a **"Planned: Agent Architecture"** section — an entry that is *already* agent-native lands ahead of his own roadmap.
- **Dual-persona UI to mirror:** `/dashboard` (small-business plain-English view) **+** `/ab/dashboard` (accountant, data-dense, with references + risk flags). PayoutBridge = plain-English Approval Drawer for the owner + audit/trace panel for the accountant.
- **His likely Q&A probe:** *"How do you stop hallucinated ledger writes?"* → **deterministic engine decides, LLM explains; human approves every write; idempotency keys.**

## 12.2 Capability table (mirror the "Claude native ✅ / what we built" two-column format)

| Claude / MCP gives you free ✅ | What PayoutBridge built on top |
|---|---|
| Raw `create-*` / `list-*` Xero calls | Deterministic parser → canonical `{gross, commission, fees, refunds, net}` model |
| One-shot LLM text generation | `planner.ts` that **refuses to propose books that don't balance** (invariant throw) |
| Stateless tool calls | `sha256(file)` idempotency step-map (`posted.json`) — crash-safe, per-step re-run |
| No audit surface | `audit.json` trail: every call → request → Xero ID → status |
| No verification | Post-write **verification read** proving Platform Clearing = £0.00 ✓ |

## 12.3 Scaffold state on disk (exact — what Fable inherits)

- **Prereqs present:** Node **v22.23.1**, npm **10.9.8**.
- **`package.json`:** name `xero-hackathon`, `"type":"module"`; deps **`dotenv ^17.4.2`, `xero-node ^18.0.0`**; devDeps **`@types/node ^26.1.0`, `tsx ^4.23.0`, `typescript ^6.0.3`**; scripts `dev` (`tsx watch src/index.ts`), `start`, `build` (`tsc -p tsconfig.json`), `typecheck` (`tsc --noEmit`), `check-env` (**identical to `start`** — only checks `XERO_CLIENT_ID`+`XERO_CLIENT_SECRET`, NOT `XERO_SCOPES`).
- **`.mcp.json`:** only `xero` wired — `npx -y @xeroapi/xero-mcp-server@latest` (**floating `@latest`, not pinned**), env `${XERO_CLIENT_ID}` / `${XERO_CLIENT_SECRET}` / `${XERO_SCOPES}`. **Make and Lovable are NOT pre-wired.**
- **`.env.example` default scopes:** `accounting.transactions accounting.contacts accounting.settings accounting.reports.read offline_access` (comment: "narrow to the minimum once the idea is locked").
- **`tsconfig.json`:** target ES2022, module/moduleResolution NodeNext (ESM), `strict:true`, outDir `dist`, rootDir `src`.
- **Env-pickup ritual:** `set -a; source .env; set +a` then relaunch `claude` from the same shell; verify `/mcp` shows **xero** connected. Add Make MCP: `claude mcp add --transport sse make "$MAKE_MCP_URL"` (URL `https://<zone>.make.com/mcp/api/v1/u/<TOKEN>/sse`, scope `mcp:use`). Lovable: `/plugin install lovable@claude-plugins-official` (OAuth on first tool call). `src/index.ts` is a **stub** (credential-presence check only — not the feature).

---

# SECTION 13 — EVENT DETAIL (people · schedule · prize · venue)

