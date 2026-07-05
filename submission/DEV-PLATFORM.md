# PayoutBridge — Development Platforms & Tools

Every tool below is confirmed against the repository (dependency manifests, config files,
and source), not just claimed.

## Build & AI tooling

| Tool | Role in the project |
|---|---|
| **Claude Code** | Primary development agent — research, specs 01–12, backend implementation, security hardening, and this submission package. Configured with the Xero MCP server in `.mcp.json`. |
| **Lovable** | Generated the React/Vite/TanStack frontend, connected via the Claude Code plugin (OAuth). Frontend files stay paste-back-compatible with Lovable. |
| **VS Code** | Local editor. |
| **Make (make.com)** | Optional automation surface — a 7-module scenario blueprint (`src/make/scenario.json`) that posts an emailed CSV to `POST /propose`. Make never calls `/approve`; human approval always happens in the UI. |
| **Ollama Cloud** | Cloud LLM runtime backing the conversational assistant surface (chat / voice VAT helper). The money-posting golden path is fully deterministic and uses no LLM. |

## Backend

- **Python 3.12+ / FastAPI** (`fastapi>=0.115.0`) — the agent core and 8 REST endpoints.
- **Uvicorn** — ASGI server.
- **Pydantic v2** (`pydantic>=2.10.0`) — canonical models and the invariant validator.
- **MCP Python SDK** (`mcp>=1.9.0`) — stdio client that drives the Xero MCP server.
- **httpx** — raw REST calls for the two operations the Xero MCP server does not expose
  (attachments, history notes) plus token minting.
- **python-multipart** — file upload handling.
- State is local JSON (`posted.json`, `audit.json`, `pnl-before.json`, `pnl-after.json`) —
  no database, resettable for demos.

## Frontend

- **React 19 + Vite + TypeScript**, **TanStack Router**, **Tailwind CSS**.
- Package manager **Bun** (`bun.lock`); `package-lock.json` kept as an npm fallback.
- Ships with a built-in mock layer so the hosted demo works with no backend; `?mock=0`
  switches to the live backend at `VITE_API_URL`.

## Xero integration

- **`@xeroapi/xero-mcp-server`** run as an MCP subprocess via `npx` (stdio transport) for
  all standard accounting operations.
- **Raw Xero Accounting REST** (via httpx) for attachments and history notes.
- Auth: **Custom Connection** (client-credentials, machine-to-machine) against the **Xero
  Demo Company (UK)** only. See `XERO-API.md` for endpoints and scopes.
