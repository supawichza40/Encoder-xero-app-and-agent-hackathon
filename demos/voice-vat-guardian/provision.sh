#!/usr/bin/env bash
# provision.sh — ONE command to bring the VAT Guardian agent to life.
# Creates a NEW agent from the public "Marketplace Support" workflow (auto-clones a private
# copy), PATCHes the VAT-Guardian system prompt into that clone, verifies it stuck, and runs
# one text smoke test. Prints the ids you paste into server.mjs / config.js.
#
# SAFETY: only creates NEW resources. Never modifies existing agents. Reads BIMPEAI_API_KEY
# from the environment only; never prints it, never sends it anywhere except api.bimpe.ai.
#
# Usage:   BIMPEAI_API_KEY=sk_xxx ./provision.sh
#   (This will FAIL until a plan slot is free — see PROVISION.md. On a free/3-agent plan the
#    create step returns HTTP 400 "Agent limit reached". Upgrade or free a slot first.)
set -euo pipefail
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH"

BASE="https://api.bimpe.ai/api/v1/console"
PUBLIC_WF="cml4wyixp000bs422avsvdqn2"   # public "Marketplace Support" template
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_SRC="$HERE/AGENT-PROMPT-VAT.md"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

if [ -z "${BIMPEAI_API_KEY:-}" ]; then
  echo "ERROR: BIMPEAI_API_KEY is not set. Run:  BIMPEAI_API_KEY=sk_xxx ./provision.sh" >&2
  exit 1
fi
KEY="$BIMPEAI_API_KEY"

# --- Extract the §2 system prompt (single source of truth) ---
python3 - "$PROMPT_SRC" "$TMP/prompt.txt" <<'PY'
import sys,re
md=open(sys.argv[1],encoding='utf-8').read()
# grab the first fenced block after the "## 2. THE SYSTEM PROMPT" heading
seg=md.split("## 2.",1)[1]
block=re.search(r"```([^\n]*)\n(.*?)\n```", seg, re.S)
if not block: sys.exit("could not locate §2 fenced prompt block")
open(sys.argv[2],'w',encoding='utf-8').write(block.group(2))
print("prompt chars:", len(block.group(2)))
PY

echo "== 1. Create agent from public workflow =="
python3 - "$TMP/agent_payload.json" <<'PY'
import json,sys
json.dump({
 "workflow_id":"cml4wyixp000bs422avsvdqn2",
 "name":"VAT Guardian — demo",
 "description":"PayoutBridge VAT-Guardian voice assistant for VAT-threshold monitoring (Encode hackathon demo)."
}, open(sys.argv[1],'w'))
PY
CREATE_HTTP=$(curl -s -o "$TMP/create.json" -w "%{http_code}" -X POST "$BASE/agents" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" --data-binary @"$TMP/agent_payload.json")
echo "  POST /agents -> HTTP $CREATE_HTTP"
if [ "$CREATE_HTTP" != "201" ] && [ "$CREATE_HTTP" != "200" ]; then
  echo "  FAILED. Response message:"; python3 -c "import json,sys;print('   ',json.load(open(sys.argv[1])).get('message'))" "$TMP/create.json" 2>/dev/null || cat "$TMP/create.json"
  echo "  (On a free/3-agent plan this is the expected 'Agent limit reached' 400 — see PROVISION.md.)"
  exit 1
fi
read AGENT_ID WORKFLOW_ID TEST_CODE < <(python3 -c "import json;d=json.load(open('$TMP/create.json'))['data'];print(d['id'],d['workflow_id'],d.get('test_channel_code',''))")
echo "  AGENT_ID=$AGENT_ID  WORKFLOW_ID=$WORKFLOW_ID  TEST_CODE=$TEST_CODE"

echo "== 2. PATCH system prompt into the private clone =="
python3 - "$TMP/prompt.txt" "$TMP/patch.json" <<'PY'
import json,sys
json.dump({"system_prompt":open(sys.argv[1],encoding='utf-8').read()}, open(sys.argv[2],'w'))
PY
PATCH_HTTP=$(curl -s -o "$TMP/patch_resp.json" -w "%{http_code}" -X PATCH "$BASE/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" --data-binary @"$TMP/patch.json")
echo "  PATCH /workflows/$WORKFLOW_ID -> HTTP $PATCH_HTTP"

echo "== 3. Re-GET workflow and verify the prompt stuck =="
curl -s -H "Authorization: Bearer $KEY" "$BASE/workflows/$WORKFLOW_ID" -o "$TMP/wf.json"
python3 - "$TMP/wf.json" <<'PY'
import json,sys
sp=json.load(open(sys.argv[1]))['data'].get('system_prompt','')
for needle in ("[[APPROVE_CORRECTION]]","thirteen hundred and forty"):
    print(f"   {'OK ' if needle in sp else 'MISSING'} :: {needle}")
PY

echo "== 4. Smoke test — one text turn 'Hello?' =="
python3 - "$TMP/msg.json" <<'PY'
import json,sys,uuid
json.dump({"message":"Hello?","channel_type":"webchat","channel_user_id":str(uuid.uuid4()),"is_test_channel":True}, open(sys.argv[1],'w'))
PY
SMOKE_HTTP=$(curl -s -o "$TMP/smoke.json" -w "%{http_code}" -X POST "$BASE/agents/$AGENT_ID/conversations/messages" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" --data-binary @"$TMP/msg.json")
echo "  POST conversations/messages -> HTTP $SMOKE_HTTP"
python3 - "$TMP/smoke.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1])).get('data',{})
reply=(d.get('message') or '')
print("   reply:", reply[:400])
print("   mentions 'thirteen hundred and forty':", "thirteen hundred and forty" in reply.lower())
print("   contains marker (should be NO on opener):", "[[approve_correction]]" in reply.lower())
PY

echo ""
echo "=================================================================="
echo " DONE. Now wire it up:"
echo "   1. Serve with the agent id:   export VAT_GUARDIAN_AGENT_ID=$AGENT_ID"
echo "   2. Activate Web Voice in the dashboard, copy the client id into config.js"
echo "   3. node server.mjs"
echo "=================================================================="
