# PROVISION — VAT Guardian agent bring-up status

Recorded 2026-07-05. All ids below are non-secret. The API key is never stored here.

## Status: BLOCKED at agent creation (plan limit). Everything else is built and ready.

The agent could **not** be created. The account is at its plan's agent cap, and the
guardrails forbid deleting or reusing any existing agent, so provisioning cannot proceed
without a business decision (upgrade the plan or free a slot).

## Receipts (HTTP codes only — no key printed, ever)

| Step | Call | Result |
|---|---|---|
| List public templates | `GET /workflows?scope=public` | **HTTP 200** — 14 workflows. Chosen template: **Marketplace Support** `cml4wyixp000bs422avsvdqn2` (public, generic support). |
| Create agent | `POST /agents` (name "VAT Guardian — demo", workflow_id = Marketplace Support) | **HTTP 400** — `"Agent limit reached for your plan. Please upgrade to create more agents."` |
| Inventory | `GET /agents` | **HTTP 200** — 3/3 slots used: `Refund Concierge — demo` (`cmqtuq8xu010fpc6ekpx596ux`), `test` (no workflow), `Supavich Aussawaauschariyakul's Agent` (`cmqtsuvcu008npc6e1j25ehrf`). |
| Patch prompt | `PATCH /workflows/{id}` | **NOT RUN** — no agent/workflow to patch. |
| Inline KB | `POST /agents/{id}/knowledge_bases` | **NOT RUN** — no agent. (Prompt already carries the KB; step is optional anyway.) |
| Smoke test | `POST /agents/{id}/conversations/messages` "Hello?" | **NOT RUN** — no agent, and I will not smoke-test against the existing agents (guardrail). |

**Note on the guardrail list:** PREFLIGHT named the third protected agent as
`Beauty & Stylist Booking`. On this account that name is a *public workflow template*, not an
agent — the actual third agent is `Supavich Aussawaauschariyakul's Agent`. No existing agent
was touched either way.

## What is proven vs. not

- **PROVEN this session:** the auth key works (`GET /workflows`, `GET /agents` → HTTP 200);
  the exact create call is correct in shape (it reached validation and returned the *plan*
  error, not a schema error); the §2 prompt is HTML-entity-clean (no `&amp;`/`&lt;`/`&gt;`).
- **PROVEN by prior recon (FACTS-BIMPEAI, PROVEN-BY-CODE):** `PATCH /workflows` system-prompt,
  inline KB creation, and the webchat conversation smoke test all ran live on the reference
  build. Our `provision.sh` reuses those exact calls.
- **NOT proven live here:** the VAT-Guardian agent's actual reply text (no agent to talk to).
  The system prompt and expected behavior are designed in AGENT-PROMPT-VAT.md; the local
  marker-regex check passes 5/5, but the model's live wording is unverified until an agent exists.

## To unblock (one decision, then one command)

1. **Free a slot or upgrade.** Either upgrade the account to Pro/Team, or delete one agent
   (the `test` agent has no workflow and looks disposable — but deleting is the owner's call).
   *Pro/Team is likely needed regardless: the Web Voice widget is Pro/Team-gated (FACTS §3).*
2. **Run the one-command provisioner:**
   ```bash
   BIMPEAI_API_KEY=sk_xxx ./provision.sh
   ```
   It creates the agent from the Marketplace Support template, PATCHes the §2 VAT-Guardian
   prompt into the private clone, re-GETs to confirm `[[APPROVE_CORRECTION]]` and
   "thirteen hundred and forty" are present, and runs the "Hello?" smoke test — printing the
   agent id, workflow id, and test code.
3. **Wire it up:** `export VAT_GUARDIAN_AGENT_ID=<printed id>`, activate Web Voice in the
   dashboard and paste the client id into `config.js`, then `node server.mjs`.

Until then the page runs in offline-demo mode (setup checklist + labeled offline walkthrough),
so the story is always presentable.
