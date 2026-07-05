# PayoutBridge Backend — Security Review Findings

Scope: `src/backend/` FastAPI app (CSV ingest → Xero MCP + raw REST writes).
Review type: READ-ONLY. No code changed. Date: 2026-07-05.
Method: manual source review of `main.py`, `config.py`, `xero_client.py`, `parser.py`,
`planner.py`, `idempotency.py`, `audit.py`, `models.py` + git-tracked-file check.

Severity legend: HIGH = exploitable now / real damage. MEDIUM = exploitable under
plausible config or amplifies another issue. LOW = hardening / defense-in-depth.

---

## HIGH

### H1 — Real Xero OAuth client credentials committed to a (self-declared) public repo
- **Where:** tracked file `/.env` (repo root); loaded by `config.py:5-9` via `load_dotenv()`.
- **Evidence:** `git ls-files` lists `.env` (not just `.env.example`). `.gitignore`
  ignores only `.env.local` and `*.secret` — plain `.env` is **not** ignored, yet its
  own header comment says "repo is public — never commit real values." The tracked
  `.env` contains non-empty, real-shaped values distinct from `.env.example`:
  `XERO_CLIENT_ID` (32-char hex), `XERO_CLIENT_SECRET` (48-char token), plus a second
  `_WEB` pair of the same shapes. Remote: `github.com/supawichza40/Encoder-...`.
- **Exploit:** anyone with repo read access (or anyone scraping public GitHub / the git
  history) obtains both Xero client-credential pairs. With `client_credentials` grant
  (see `xero_client.py:170-186`) they can mint write-scoped tokens
  (`accounting.transactions`, `accounting.attachments`, …) and read/write the connected
  Xero tenant directly, bypassing the app entirely. Scope is the Demo Company today, but
  the `_WEB` pair and any future live binding make this a standing credential leak.
- **Fix:** `git rm --cached .env`, add `.env` (and `.env.*` except `.env.example`) to
  `.gitignore`, **rotate all four secrets in the Xero developer portal now** (they are
  compromised the moment they hit a remote), and purge them from git history
  (`git filter-repo`/BFG) since rotation alone leaves old shas exploitable until revoked.

### H2 — Path traversal / arbitrary `.json` read via unvalidated `file_hash` in POST /approve
- **Where:** `models.py:128-129` (`ApproveRequest.file_hash: str`, no validation) →
  `main.py:220` `_load_proposal(file_hash)` → `main.py:685-690`
  `proposal_file = proposals_dir / f"{file_hash}.json"` then `.exists()` / `.read_text()`.
  Same tainted value also builds `_UPLOADS_DIR / f"{file_hash}.csv"` at `main.py:350`.
- **Exploit:** `file_hash` comes straight from the request body and is never checked to be
  a 64-char hex sha256. `POST /approve {"file_hash": "../../../../../../etc/passwd%00"}`
  style input — concretely any `../`-laden string — makes `Path(state/proposals) / "../../…/x"`
  resolve outside the state dir. Any file ending in `.json` on the host becomes readable /
  probeable (200 vs 404 vs 500 is an existence oracle). Unauthenticated (see H4).
- **Fix:** validate `file_hash` against `^[0-9a-f]{64}$` in `ApproveRequest` (Pydantic
  `pattern=`) and reject otherwise; apply the same guard on the `/status/{file_hash}`
  path param and anywhere `file_hash` is joined into a path.

### H3 — Attacker-controlled `filename` injected into an authenticated Xero REST PUT URL (E2 attach)
- **Where:** `xero_client.py:202`
  `url = f"{XERO_API_BASE}/Invoices/{invoice_id}/Attachments/{filename}"` then
  `http.put(url, content=csv_bytes, headers={Authorization: Bearer <write token>})`.
  `filename` = `f"{payout_ref}.csv"` (`main.py:353`); `payout_ref` = column 0 of the
  uploaded CSV summary row (`parser.py:84`) — **fully attacker-controlled, unsanitized,
  unbounded** (only the 1 MB upload cap applies).
- **Exploit:** a CSV whose `PayoutRef` is e.g. `x/../../Contacts/<guid>/Attachments/y` or
  contains `?`/`#`/extra path segments lets the uploader steer the path (and query) of an
  authenticated, write-scoped PUT to `api.xero.com`, redirecting the request off the
  intended invoice-attachment endpoint. The host is hardcoded (`XERO_API_BASE`,
  `xero_client.py:48`) so this is **not** arbitrary-host SSRF, but it is request-path
  injection carrying a bearer token — a server-side write primitive against other Xero
  resources of the same tenant.
- **Fix:** sanitize `filename` before interpolation — strip `/`, `\`, `..`, control chars,
  and URL-encode it (or derive the attachment name from a server-side constant, not from
  `payout_ref`). Also cap `payout_ref` length in the parser.

### H4 — No authentication/authorization on any endpoint (incl. state-changing writes)
- **Where:** all routes in `main.py` — `/propose`, `/approve`, `/status`, `/pnl`,
  `/dashboard`, `/vat-check`, `/health`, and `/seed` (gated only by `ALLOW_SEED`, which
  **defaults to `true`** at `config.py:56`). No `Depends`, API key, or auth header anywhere.
- **Exploit:** anyone who can reach the process can drive Xero writes via `/approve`,
  re-seed the tenant via `/seed`, and read financial reports via `/dashboard` / `/pnl`.
  `config.py:40-53` explicitly documents setting `CORS_ALLOW_ORIGINS="*"` for an
  ngrok-tunnelled demo, i.e. the design intends to expose these unauthenticated write
  endpoints to the public internet. This is also the delivery vector that makes H2/H3
  remotely reachable.
- **Fix:** require a shared secret / API key (or the Make token) on `/propose`, `/approve`,
  `/seed`; keep `ALLOW_SEED` defaulting to `false`; never expose the app publicly without
  auth even for a demo.

---

## MEDIUM

### M1 — Internal error detail leaked to the client on /approve failure
- **Where:** `main.py:295-312`. A broad `except (XeroMCPError, ValueError, Exception)`
  catches everything, then `raise HTTPException(503, detail=f"... {err_msg}")` where
  `err_msg = str(exc)` (line 296, 311).
- **Exploit:** any downstream/Xero/programming error message (account codes, GUIDs, Xero
  API validation text, KeyError internals) is echoed verbatim to the unauthenticated
  caller. No stack traces (FastAPI debug is off), but the raw message is still info leak.
- **Fix:** log the detail server-side; return a generic `"Xero write failed at step N"`
  to the client. Don't list `Exception` alongside the specific types — catch narrowly.

### M2 — Whole request body read into memory before the size check (DoS)
- **Where:** `main.py:146` `file_bytes = await file.read()` (reads the entire upload into
  memory) executes **before** the size guard at `main.py:149-150`. No uvicorn/Starlette
  upstream body-size limit is configured.
- **Exploit:** `POST /propose` with a multi-GB body forces the whole payload into memory
  (Starlette spools >1 MB to a temp file, but `.read()` pulls it all back into RAM) before
  the 1 MB check ever runs → memory/disk exhaustion, unauthenticated.
- **Fix:** enforce a body-size limit at the ASGI/proxy layer, or stream-read with an early
  abort once `> 1 MB` is seen, before materializing the full bytes.

### M3 — CORS can be opened to `*` by documented demo guidance
- **Where:** `config.py:40-53` + `main.py:124-129`. Default is a safe localhost allowlist,
  but the comment tells operators to set `CORS_ALLOW_ORIGINS="*"` for tunnelled demos.
- **Exploit:** with `*`, any web origin can call the API from a victim's browser. Credentials
  are not enabled (`allow_credentials` unset), which limits classic cookie CSRF — but given
  H4 (no auth at all), an open CORS policy simply widens who can reach the unauthenticated
  write endpoints from arbitrary pages.
- **Fix:** keep an explicit origin allowlist even for demos; never pair `*` with any future
  credentialed/authenticated mode.

---

## LOW

- **L1 — `/approve` 409 leaks Xero GUIDs** in the `X-Existing-IDs` response header
  (`main.py:224-228`) to an unauthenticated caller. Minor info disclosure.
- **L2 — Tenant (org) UUID logged** at `xero_client.py:290` (`logger.info("Xero tenant ID: %s", …)`).
  Not a secret, but avoid emitting tenant identifiers to logs.
- **L3 — Decimal input hardening.** `parser.py:76-80` builds `Decimal(cell)` with no bound;
  huge exponents flow to `float(amount)` in `xero_client.py` (e.g. `:379,:435,:458,:499`) and
  can overflow, and the default Decimal context (28 sig figs) silently rounds oversized
  amounts during the invariant check. Signaling-NaN is caught by the surrounding
  `try/except` (`parser.py:118-130`). Bounded by the 1 MB cap; correctness > security.
- **L4 — Silent row skipping / broad swallow.** `parser.py:113-115` drops malformed booking
  rows silently; `main.py:533-548` (`_build_recent_payouts`) and `main.py:702-708` swallow all
  exceptions and return `[]`/`None`. Low security impact, but can mask tampering/errors.

---

## Reviewed and assessed SAFE

- **Upload storage path is safe:** `state/uploads/<sha256>.csv` is derived from the computed
  file hash (`main.py:152-157`), not the user-supplied filename — no traversal on write.
- **E6 history note is not attacker-influenced:** endpoint comes from the hardcoded
  `_HISTORY_ENDPOINTS` map (`main.py:85-90`, `:328`) and `guid` is a Xero-generated ID; URL
  built at `xero_client.py:245` is not steerable by upload content.
- **Xero API host is pinned:** `XERO_API_BASE`/`XERO_TOKEN_URL` are constants
  (`xero_client.py:47-48`); no arbitrary-host SSRF is possible (path injection in H3 aside).
- **Audit trail does not persist secrets:** `audit.append_entry` call sites
  (`main.py:298,315,332,364`) log only amount/reference/endpoint/guid/invoice_id/filename —
  no client secret or bearer token. Tokens/secrets are never returned in any response body.
- **No SQL:** state is JSON files (`posted.json`, `audit.json`) — no SQL-injection surface.
- **Accounting invariant enforced twice:** `models.py:30-38` (validator) and
  `planner.py:42-47` (defense-in-depth) both refuse to proceed if the gross-up doesn't balance.
