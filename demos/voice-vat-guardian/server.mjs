// server.mjs — VAT Guardian demo server. Zero npm dependencies (node http + global fetch).
//
// Responsibilities:
//   1. Serve the static demo files (index.html, config.js).
//   2. GET /api/status — server-side, using BIMPEAI_API_KEY, poll our agent's newest
//      conversation for the literal [[APPROVE_CORRECTION]] marker in agent messages.
//      Returns {approved, conversationId?, status}. The page polls this to light the badge.
//
// SECURITY: the sk_ API key lives ONLY in the environment. It is never written to a
// served file, never returned in any response, and only ever sent to api.bimpe.ai.
//
// Run:  BIMPEAI_API_KEY=sk_xxx  VAT_GUARDIAN_AGENT_ID=<agent id>  node server.mjs
//   (or export both first, then `node server.mjs`)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const BASE = "https://api.bimpe.ai/api/v1/console";
const MARKER = /\[\[APPROVE_CORRECTION\]\]/i; // token-only, case-insensitive (frozen contract)

// Agent id is NOT a secret — safe to hardcode/commit. Filled in after provisioning.
// Placeholder until then; /api/status reports 'unconfigured' so the badge poller stays quiet.
const AGENT_ID = process.env.VAT_GUARDIAN_AGENT_ID || "PASTE_AGENT_ID_HERE";

// ---- COLD-BOOT GATE: no key => LOUD failure, no silent fallback ----
const KEY = process.env.BIMPEAI_API_KEY;
if (!KEY) {
  console.error("\n" + "=".repeat(68));
  console.error("  VAT GUARDIAN DEMO — CANNOT START");
  console.error("=".repeat(68));
  console.error("  BIMPEAI_API_KEY is not set in the environment.");
  console.error("");
  console.error("  Fix it one of these ways, then re-run:");
  console.error("    BIMPEAI_API_KEY=sk_xxx node server.mjs");
  console.error("  or:");
  console.error("    export BIMPEAI_API_KEY=sk_xxx");
  console.error("    node server.mjs");
  console.error("");
  console.error("  The key is the Team-scoped sk_ token. See .env.example.");
  console.error("  NEVER paste the key into config.js or any file the browser loads.");
  console.error("=".repeat(68) + "\n");
  process.exit(1);
}

const STATIC = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/config.js": { file: "config.js", type: "text/javascript; charset=utf-8" },
};

function j(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}

async function bimpe(path) {
  // The ONLY outbound use of the key. Never logged, never returned.
  const r = await fetch(BASE + path, { headers: { Authorization: "Bearer " + KEY } });
  if (!r.ok) throw new Error("upstream " + r.status);
  return r.json();
}

// Poll the newest conversation of our agent for the approval marker.
async function checkApproval() {
  if (AGENT_ID === "PASTE_AGENT_ID_HERE") return { approved: false, status: "unconfigured" };

  const list = await bimpe(`/agents/${AGENT_ID}/conversations`);
  const convs = Array.isArray(list?.data) ? list.data : [];
  if (convs.length === 0) return { approved: false, status: "ok" };

  // Newest first (defensive sort by created/updated timestamp).
  const ts = (c) => Date.parse(c?.updated_at || c?.created_at || 0) || 0;
  convs.sort((a, b) => ts(b) - ts(a));

  // Scan the newest few so a just-started session still resolves quickly.
  for (const c of convs.slice(0, 3)) {
    const cid = c.id || c.conversation_id;
    if (!cid) continue;
    const msgs = await bimpe(`/agents/${AGENT_ID}/conversations/${cid}/messages`);
    const rows = Array.isArray(msgs?.data) ? msgs.data : [];
    for (const m of rows) {
      const role = (m.role || "").toLowerCase();
      if (role === "user") continue; // markers only count in agent turns
      const text = m.message || m.content || "";
      if (MARKER.test(text)) return { approved: true, status: "ok", conversationId: cid };
    }
  }
  return { approved: false, status: "ok" };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  if (path === "/api/status") {
    try {
      const out = await checkApproval();
      return j(res, 200, out);
    } catch (e) {
      // Best-effort: never 500 the badge poller — the voice widget must keep working.
      return j(res, 200, { approved: false, status: "error" });
    }
  }

  const hit = STATIC[path];
  if (hit) {
    try {
      const abs = normalize(join(HERE, hit.file));
      if (!abs.startsWith(HERE)) { res.writeHead(403); return res.end("forbidden"); }
      const buf = await readFile(abs);
      res.writeHead(200, { "content-type": hit.type });
      return res.end(buf);
    } catch {
      res.writeHead(404); return res.end("not found");
    }
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

server.listen(PORT, () => {
  const agentReady = AGENT_ID !== "PASTE_AGENT_ID_HERE";
  console.log(`VAT Guardian demo → http://localhost:${PORT}`);
  console.log(`  agent id: ${agentReady ? AGENT_ID : "NOT SET (run provision.sh, then set VAT_GUARDIAN_AGENT_ID) — badge poller idle"}`);
  console.log(`  /api/status is live; open the page and start a voice session.`);
});
