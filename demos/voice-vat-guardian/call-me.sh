#!/usr/bin/env bash
# call-me.sh — BONUS, UNTESTED ON STAGE. Makes the agent literally phone a number.
# Outbound PSTN calling exists on this platform (FACTS-BIMPEAI §5) but is a paid telephony
# add-on and was NOT exercised for this demo. Do not rely on it during the pitch — it is a
# "and it can also call you" flourish, not part of the golden path.
#
# Usage:   BIMPEAI_API_KEY=sk_xxx VAT_GUARDIAN_AGENT_ID=<id> ./call-me.sh +447700900123
# Reads the key from the environment only; never prints it.
set -euo pipefail
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH"

BASE="https://api.bimpe.ai/api/v1/console"
DEST="${1:-}"
: "${BIMPEAI_API_KEY:?set BIMPEAI_API_KEY in the environment}"
: "${VAT_GUARDIAN_AGENT_ID:?set VAT_GUARDIAN_AGENT_ID (from provision.sh)}"
if [ -z "$DEST" ]; then echo "Usage: ./call-me.sh +<E164 number>" >&2; exit 1; fi

HTTP=$(curl -s -o /tmp/vatg_call.json -w "%{http_code}" -X POST \
  "$BASE/agents/$VAT_GUARDIAN_AGENT_ID/calls" \
  -H "Authorization: Bearer $BIMPEAI_API_KEY" -H "Content-Type: application/json" \
  -d "{\"destination\":\"$DEST\",\"is_test_call\":true}")
echo "POST /agents/$VAT_GUARDIAN_AGENT_ID/calls -> HTTP $HTTP"
cat /tmp/vatg_call.json 2>/dev/null; echo
rm -f /tmp/vatg_call.json
