# FACTS-BIMPEAI — BimpeAI platform fact sheet for Voice VAT-Guardian

Recon date: 2026-07-05. Sources: (a) local proven reference build
`~/…/AgenticHackathonNightLondon/` (refund-concierge + `@bimpeai/sdk@0.4.1` in its
node_modules), (b) live read-only GET probes against `https://api.bimpe.ai/api/v1/console`
(Team key from that project's `.env`, never printed, sent only to api.bimpe.ai),
(c) public docs `https://docs.bimpe.ai`, (d) the public console app bundle + widget script
served from `https://agent.bimpe.ai` (fetched without any key).

Confidence tags: **PROVEN-BY-CODE** (reference project ran it against the real API, or the
shipped platform JS does it), **PROVEN-BY-API** (observed directly in a live probe today),
**DOCS-ONLY** (documented at docs.bimpe.ai, not exercised), **UNKNOWN**.

Conventions used below:

```bash
BASE=https://api.bimpe.ai/api/v1/console
KEY=...   # BIMPEAI_API_KEY (sk_ prefix, Team-scoped) — env only, never in client files
# Auth header: "Authorization: Bearer $KEY"  (docs: "X-Api-Key: $KEY" also accepted)
```

---

## 1. AGENT CREATION — direct `POST /agents`; public workflows auto-clone

**Confidence: DOCS-ONLY for the POST itself (creation was out of scope this wave), cross-proven
by SDK types (PROVEN-BY-CODE) and by the live response shape of GET /agents (PROVEN-BY-API).**

- Endpoint: `POST $BASE/agents`. Required body: `workflow_id` (≤50 chars), `name` (≤255),
  `description`. Optional: `language`, `persona` (`professional|friendly|concise`), `timezone`,
  `logo`, `business_*`, `escalation_email`.
  Evidence: docs https://docs.bimpe.ai/docs/api/agents/createAgent/ ; SDK types
  `node_modules/@bimpeai/sdk/dist/index.d.ts:208-221` (`CreateAgentBody`), `:578-593` (`Agents.create`).
- **You do NOT need a separate clone step.** Docs (createAgent page): *“Create an agent linked
  to a workflow. Public workflows are cloned for the team when needed.”* — pass a public
  template `workflow_id` and the platform clones it into a team-owned private copy.
  An explicit clone also exists: `POST $BASE/workflows/clone` with `{"source_workflow_id":"…"}`
  → 201, *“Returns a new team-owned copy with source_workflow_id set”*
  (https://docs.bimpe.ai/docs/api/workflows/cloneWorkflow/). From-scratch:
  `POST $BASE/workflows` with `{name, system_prompt}` (SDK `index.d.ts:131-147, 846-856`).
- The reference agent was made by cloning the public “Marketplace Support” workflow
  (`refund-concierge/docs/AGENT-PROMPT.md:13`, `docs/SUBMISSION.md:45`); its workflow is now
  `visibility:"private"`, `system_prompt` 4300 chars (live probe of
  `GET /workflows/cmqtuq8ys010hpc6e8kz3aoab`, HTTP 200, PROVEN-BY-API).
- **Response (201)** = full agent object **plus nested `workflow`**:
  `data.id` (agent id), `data.workflow_id` (the team-owned clone’s id — PATCH this one),
  `data.test_channel_code` (8-char code, e.g. `D623LVU7` on the live refund agent),
  `data.status: "development"`, timestamps, plus `data.workflow.{id, system_prompt, rules, flows, …}`.
  Evidence: docs createAgent 201 sample; live `GET $BASE/agents` HTTP 200 shows exactly these
  fields (probe 2026-07-05); SDK `AgentCreateResponse extends Agent { workflow }` (`index.d.ts:205-207`).
- Public templates to clone from: `GET $BASE/workflows` → HTTP 200, 18 workflows, most
  `visibility:"public"` with `is_owner` flag (PROVEN-BY-API). Docs: `?scope=accessible|owned|public`.

```bash
# CREATE AGENT (pick a public workflow id from GET $BASE/workflows first)
curl -s -X POST "$BASE/agents" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "<public-or-owned-workflow-id>",
    "name": "VAT Guardian — demo",
    "description": "PayoutBridge voice assistant for VAT-threshold monitoring (hackathon demo)."
  }'
# 201 → data.id (AGENT_ID), data.workflow_id (WORKFLOW_ID = your private clone),
#        data.test_channel_code, data.status="development", data.workflow.system_prompt
```

---

## 2. SYSTEM PROMPT — `PATCH /workflows/{workflow_id}`; no prompt cap; 2500 cap is the KB, and it IS real

**Confidence: PROVEN-BY-CODE (reference ran it, HTTP 200 confirmed) + DOCS-ONLY details.**

- `PATCH $BASE/workflows/{workflow_id}` with `{"system_prompt": "…"}` → HTTP 200,
  `"Workflow updated successfully"`, field readable back at `data.system_prompt`.
  Evidence: `refund-concierge/docs/AGENT-PROMPT.md:195-198` (actually applied to workflow
  `cmqtuq8ys010hpc6e8kz3aoab`, verified live afterwards); docs
  https://docs.bimpe.ai/docs/api/workflows/updateWorkflow/ — *“If name or system_prompt is
  sent, they must be non-blank.”*
- **`system_prompt` has NO documented length cap** (docs list caps for `name` ≤255,
  `description` ≤2000, `category` ≤100 — none for `system_prompt`), and the live reference
  workflow carries a **4300-char** prompt (PROVEN-BY-API). The reference’s “≤2500” figure does
  **not** apply to the prompt.
- **The 2500-char cap is real but belongs to the inline KB `content` field** — platform-enforced
  per docs https://docs.bimpe.ai/docs/api/agents/createKnowledgeBases/ : *“content … Raw text
  content. Required when type=text. **Max 2500 characters.***” (`name` ≤255, `description` ≤1000,
  `type: "text"|"url"`, file coming soon). Reference created its KB this way live:
  `POST /agents/{id}/knowledge_bases` → HTTP 201, KB id returned (`AGENT-PROMPT.md:199,214-217`,
  PROVEN-BY-CODE).

```bash
# SET SYSTEM PROMPT (workflow-level; must be non-blank)
curl -s -X PATCH "$BASE/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  --data-binary @system_prompt_payload.json
#   system_prompt_payload.json: {"system_prompt":"<full VAT-Guardian prompt>"}
# 200 → {"message":"Workflow updated successfully","data":{"system_prompt":…}}

# CREATE INLINE KB on the agent (content ≤ 2500 chars — platform limit)
curl -s -X POST "$BASE/agents/$AGENT_ID/knowledge_bases" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  --data-binary @kb_payload.json
#   kb_payload.json: {"type":"text","name":"VAT ledger — synthetic 3-month turnover","content":"<≤2500 chars>"}
# 201 → data.id (KB id)
```

---

## 3. WEB VOICE WIDGET — script-tag embed, public `client_id`, NO server token; activation is dashboard-side + plan-gated

**Confidence: PROVEN-BY-CODE (embed template + auth flow read out of the shipped platform JS:
console bundle `agent.bimpe.ai/assets/index-DEEvNSea.js` and the live public
`agent.bimpe.ai/voice-widget.js`, HTTP 200, 38,275 bytes, fetched 2026-07-05).
The reference project never embedded it (its voice was “flag-gated later upgrade”,
`refund-concierge/app/components/TalkPanel.tsx:13-14`), so this comes from the platform itself.**

**Exact embed snippet** (verbatim template the BimpeAI console generates — copy-pasteable once
you substitute the `client_id`):

```html
<script>
  window.BimpeAIVoiceWidgetConfig = {
    clientId: "<client_id from Web Voice channel activation>",
    primaryColor: "#0f766e",
    userWaveColor: "#f59e0b",
    position: "right"
  };
</script>
<script src="https://agent.bimpe.ai/voice-widget.js"></script>
```

(Web **Chat** widget analog, also live at `https://agent.bimpe.ai/widget.js` (203 KB):
`window.BimpeAIChatWidgetConfig = { clientId, primaryColor, position, welcomeMessage, autoOpen }`.)

- **Browser auth: the public `client_id` is sufficient — a static page works.** Inside
  `voice-widget.js`: config requires only `clientId` (throws without it); default
  `apiBase = https://api.bimpe.ai`; it opens a session by `POST
  https://api.bimpe.ai/api/v1/agents/public/voice/browser-session` with body
  `{client_id, session_id}` and **no Authorization header**, then streams audio over
  WebSocket + `getUserMedia`. No server-minted token, no API key in the browser.
- **How you get the `client_id`: activate the Web Voice channel for the agent.** Console flow
  (from the dashboard bundle UI strings): agent → Channels → Voice → *“Activate voice widget”* →
  *“Activating creates your webchat channel and generates a unique client ID for the embeddable
  widget”* → copy embed code. Docs dashboard page: *“Voice — Web Voice lets customers talk to the
  agent from your site (Enable).”* (https://docs.bimpe.ai/docs/getting-started/dashboard/)
- **No documented console-API endpoint performs this activation** — the SDK/docs only expose
  read-only `GET /agents/{id}/channels` (live probe: HTTP 200, `data: []` on the refund agent).
  Treat activation + client_id copy as a **one-time manual dashboard step**. (DOCS-ONLY gap.)
- **Plan gate: “The embeddable voice widget is available on Pro and Team plans”** (bundle UI
  string; unactivated state also renders a “paid_plan → Upgrade plan” branch). Whether this
  team’s account clears the gate is UNKNOWN until the dashboard is opened. Fallbacks if blocked:
  Web Chat Widget embed (same pattern, `widget.js`), or the console **Playground** voice
  (docs: *“configure and test an agent in real time, over Chat or Voice”*), or webchat + browser TTS.
- **`test_channel_code` is NOT the widget mechanism.** It is the messaging-channel test code:
  `GET $BASE/agents/{id}/deployment/agent-test-code` → HTTP 200 (PROVEN-BY-API) returns
  `{code:"D623LVU7", channels:{whatsapp:{url:"https://wa.me/442070975887?text=start%20D623LVU7",…},
  instagram, messenger, telephony:{is_enabled}}}` — testers message “start <code>” on those
  channels. *“Creates a code on first request if the agent does not have one yet”* (docs
  getAgentTestCode). No webchat/voice URL is in that payload.

---

## 4. CONVERSATION API (automated text testing) — the exact calls behind the reference’s 3/3 verification

**Confidence: PROVEN-BY-CODE (live-verified 201 in the reference, `refund-concierge/server/bff/bimpe.ts:110-162`)
+ DOCS-ONLY field details + PROVEN-BY-API (listing endpoints probed live today).**

```bash
# SEND A TEXT TURN (creates the conversation on first call for a new channel_user_id)
curl -s -X POST "$BASE/agents/$AGENT_ID/conversations/messages" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "message": "Hi, can you check my VAT position?",
    "channel_type": "webchat",
    "channel_user_id": "'"$(uuidgen | tr A-Z a-z)"'",
    "is_test_channel": true
  }'
# 201 (synchronous — the agent reply is IN this response):
#   outer "message" = status string ("Message sent successfully")
#   data.message         = the assistant's reply text   <-- scan THIS for [[APPROVE_CORRECTION]]
#   data.conversation_id = conversation id (observed live by the reference; docs sample also
#                          shows data.{id, role, message, message_type, created_at, attachments})

# READ THE FULL TRANSCRIPT
curl -s -H "Authorization: Bearer $KEY" \
  "$BASE/agents/$AGENT_ID/conversations/$CONVERSATION_ID/messages"
# 200 → data[] rows: {role, message|content, message_type (may be null), created_at}
```

- Field rules (docs createOrSendMessages): `message` required, **≤4096 chars**; `role` defaults
  `"user"`; `channel_type` required when `conversation_id` omitted, one of
  `whatsapp|webchat|telephony`; `channel_user_id` = *“E.164 phone (whatsapp/telephony) or **UUID
  (webchat)**”*; `is_test_channel:true` = *“Use BimpeAI test channel infrastructure”*. To continue
  the same conversation, pass `conversation_id` (or reuse the same `channel_user_id`).
- This exact call (webchat + `is_test_channel:true`, marker-token scan of `data.message`) is how
  the reference proved its `[[ISSUE_REFUND]]` contract **3/3 live runs, 0 false fires on the
  refusal case** (`AGENT-PROMPT.md:43,177-189`) — our Wave-3 verifier should mirror it for
  `[[APPROVE_CORRECTION]]`.
- Also live-probed today (PROVEN-BY-API): `GET $BASE/agents/{id}/conversations` → HTTP 200
  (19 rows on the refund agent, fields incl. `channel_type`, `is_test_channel`,
  `last_message_preview`). Top-level `GET $BASE/conversations` → 404 (agent-scoped only).
- Response is FINAL-TEXT-centric — *no* tool-call/trace array (bimpe.ts:11-13). Optional SSE
  streaming exists (`POST …/conversations/{id}/stream-ticket` then `GET …/stream`; docs
  Streaming guide + SDK paths) — not needed for the demo.
- Parser caution: one probe of `GET /workflows` needed lenient JSON parsing (possible raw control
  chars inside `system_prompt` strings); Python `json.loads(body, strict=False)` is safe.

---

## 5. OUTBOUND — literal PSTN calling EXISTS (API-driven), separate from the web widget

**Confidence: PROVEN-BY-API (this very account has 1 real call record + a `telephony`
conversation from `+447…` dated 2026-06-27) + DOCS-ONLY/SDK for the call-placing API.**

- “Voice” on BimpeAI is three distinct things: (1) console **Playground** voice, (2) the
  embeddable **Web Voice widget** (§3), (3) **Telephony** — real phone numbers + calls.
- Outbound call API: `POST $BASE/agents/{agentId}/calls` with `{destination:"+44…",
  is_test_call:true|false}` (SDK `Calls.make`, `index.d.ts:635-653`; docs makeCall;
  `is_test_call:true` uses BimpeAI’s test telephony). Call logs: `GET …/calls` (live probe:
  HTTP 200, fields `source, destination, status, direction, duration_seconds, is_test_call,
  ringing_at, ended_at`). Numbers: `POST $BASE/phone-numbers/request` (region `us|uk|eu|ng`),
  then link to an agent; usage-based paid add-on (docs dashboard page).
- WhatsApp: inbound test via the wa.me deep link in §3’s test-code payload. **No public outbound
  WhatsApp-send API found**; the reference explicitly stubbed it (*“dashboard-connect-only
  today”*, `server/orchestrator/whatsapp.ts:23-27,94-99`).
- **Demo impact: none.** Channel is already decided (web voice widget); PSTN is a credible
  “and it can literally phone the owner” bonus line for judges, not a dependency.

---

## 6. WEBHOOKS (informational — we don’t need them)

**Confidence: DOCS-ONLY; the reference never built one.** The platform’s tool-action direction is
**outbound from the agent to your HTTP endpoint**: register a Custom API integration
(`POST $BASE/agents/{id}/integrations/custom_api/configure` with `{name, base_url, auth_type,
auth_config}`) then add tools (`…/tools` with `{name, http_method, url_template, params,
timeout}`) — the agent invokes these during conversation (docs
use-cases/configuring-integrations; SDK paths in `dist/index.js`). The console also lists
“Webhooks” and “Scheduled Events” tabs under Integrations (docs dashboard page), but no inbound
event-push (BimpeAI → your server) contract is publicly documented; the reference planned one
(`ARCHITECTURE.md:134`, `BIMPE_WEBHOOK_SECRET`) and shipped without it — its `app/api/` has no
webhook route, and it detected the refund decision by scanning the synchronous reply for the
literal marker token instead. That marker-in-transcript pattern is exactly our
`[[APPROVE_CORRECTION]]` contract, so the standalone demo needs no webhooks.

---

## Build-plan impacts (deltas vs. plan assumptions)

1. **Static demo page is viable** for the widget itself: the embed needs only a public
   `client_id` — no server, no token minting, no key in the client. (§3, PROVEN-BY-CODE.)
2. **But two manual/one-time risks sit in front of it:** Web Voice activation appears
   **dashboard-only** (no documented API), and it is **Pro/Team-plan gated**. Wave-2 must budget
   a manual dashboard step (activate → copy client_id into the page’s config) and a fallback
   (chat widget / Playground voice / webchat+TTS) if the plan gate bites.
3. Agent bring-up is fully scriptable end-to-end otherwise: `POST /agents` (public workflow
   auto-clones) → `PATCH /workflows/{wid}` system_prompt → `POST /agents/{aid}/knowledge_bases`
   (content ≤2500 chars — real platform cap; the system prompt itself has no cap, 4300 observed).
4. Wave-3 verification: reuse the reference’s proven loop — webchat POST with
   `is_test_channel:true`, assert `[[APPROVE_CORRECTION]]` in `data.message` on the approve turn
   and its absence on the decline turn.
5. Never `PATCH`/`POST` against agents `cmqtuq8xu010fpc6ekpx596ux` (Refund Concierge), `test`,
   or `Beauty & Stylist Booking` — all writes go only to the newly created VAT-Guardian ids.
