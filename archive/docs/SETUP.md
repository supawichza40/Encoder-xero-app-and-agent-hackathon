# SETUP — environment & tool connections

> Goal: every connection Claude Code needs (Xero SDK + MCP, Make MCP, Lovable MCP, Replit) is wired or one action away. ★ = only you can do it (login/OAuth/token). Verified against live docs 2026-07-04.

## Prerequisites (already present on this machine)
- Node **v22.23.1**, npm **10.9.8**, git — ✅ ready.
- Repo scaffolded: `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`, `.mcp.json`, `src/index.ts`.
- Run once: `npm install` (installs `xero-node` SDK + TypeScript toolchain).

## Secrets rule
Repo is **public**. Real keys go in **`.env`** only (gitignored). Never commit secrets; `.env.example` holds names only.

---

## 1. Xero — SDK + local MCP (core; build here)
**Connection:** local MCP server `@xeroapi/xero-mcp-server` (wired in `.mcp.json`) + `xero-node` SDK.
- ★ developer.xero.com → **New app → "Custom connection"** (free on the Demo Company).
- ★ Select scopes (default set is in `.env.example`) → **authorise on Demo Company (region UK)**.
- ★ Copy **client ID + secret** → paste into `.env` (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`).
- ★ Export them so the MCP picks them up, then restart Claude Code:
  ```bash
  set -a; source .env; set +a      # loads .env into the shell
  # relaunch `claude` from this same shell
  ```
- Verify: `/mcp` shows **xero** connected; or `npm run check-env` prints "✅ ready".
- What it gives me: live `list-*` / `create-*` / `update-*` tools against the Demo Company (see docs/TOOLING.md §1.8 for the full tool list + limits).

## 2. Make — official MCP (only if building on Make)
**Connection:** Make MCP server via an MCP token URL.
- ★ Make → your name (top-right) → **Profile → API access → Add token** → tick scope **`mcp:use`** → copy the token + the **connection URL** shown (format `https://<zone>.make.com/mcp/api/v1/u/<TOKEN>/sse`).
- Put the URL in `.env` as `MAKE_MCP_URL`, then add it to Claude Code:
  ```bash
  claude mcp add --transport sse make "$MAKE_MCP_URL"
  ```
- Verify: `/mcp` shows **make**. It exposes your Make scenarios as callable tools.

## 3. Lovable — official MCP (build/deploy real web apps from here)
**Connection:** Lovable MCP at `https://mcp.lovable.dev` (OAuth). Claude Code connects via a plugin.
- ★ In Claude Code run:
  ```
  /plugin install lovable@claude-plugins-official
  ```
  Restart Claude Code. First Lovable tool call opens a browser to **sign in to Lovable (OAuth)**.
- Verify: `/mcp` shows **lovable**, or ask "list my Lovable workspaces".
- What it gives me: `create_project`, `send_message` (iterate), `get_diff`, `read_file`, `deploy_project` (live URL), `enable_database` / `query_database` (Lovable Cloud Postgres), analytics. Works on the Free plan; `create_project`/`send_message` spend Lovable credits.
- Note: connecting grants **full-account** access (all your Lovable projects); calls are live and spend credits.

## 4. Replit — connect via GitHub (not an inbound MCP)
Replit does **not** expose itself as an MCP to control from here; it *consumes* MCP servers (Stripe, Notion, …) inside Replit Agent.
- To use Replit as a run/host env: ★ Replit → **Create → Import from GitHub** → this repo (`supawichza40/Encoder-xero-app-and-agent-hackathon`). Edits sync via git.
- Inside Replit, its Agent can add external MCPs (Stripe etc.) with one click if needed.

---

## Who does what
| Task | Who | Notes |
|---|---|---|
| Create ENCODE project (by 4pm) | ★ you | your login |
| Xero Custom Connection + creds → `.env` | ★ you | OAuth consent = human only |
| Make MCP token, Lovable OAuth, Replit import | ★ you | your accounts |
| `npm install`, scaffold, `.mcp.json`, all code, seeding, tests | me | once creds/decisions exist |
| Pick track + idea | ★ you | or ask me to recommend from docs/RESEARCH.md |

## Verify everything
```bash
npm install
npm run check-env      # env creds present?
# in Claude Code:  /mcp   → xero (+ make/lovable if added) connected
```
