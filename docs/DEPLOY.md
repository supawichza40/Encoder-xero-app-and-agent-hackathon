# DEPLOY — hosted URLs for judges

Two independent targets. **Demo (GitHub Pages) is the guaranteed judge URL** — it is
100% client-side mock data, so it works even if the backend or live Xero is down.
Render (backend) is best-effort and only matters if you want the **Real** toggle to
hit an actual Xero Demo Company.

## Live URL

- Frontend (Demo, GitHub Pages): **https://supawichza40.github.io/Encoder-xero-app-and-agent-hackathon/**
- Backend (Render): not deployed yet — follow "2. Backend → Render" below, then update
  `VITE_API_URL` per "3. Point the frontend at the deployed backend".

## 1. Frontend → GitHub Pages (already wired)

The build is a static SPA prerender (TanStack Start, `nitro: false`, `spa.enabled: true`
in `src/frontend/vite.config.ts`) — output lands in `src/frontend/dist/client/`, but
only as `_shell.html` (no `index.html`). GitHub Pages needs `index.html` (and a
`404.html` fallback, since this is a client-side router with no server), so the deploy
step copies `_shell.html` to both names before publishing.

To redeploy after frontend changes:

```bash
cd src/frontend
bun install
bun run build                       # → dist/client/_shell.html + assets/

cd dist/client
cp _shell.html index.html
cp _shell.html 404.html
touch .nojekyll                     # stop Jekyll from mangling the _shell.html-derived assets

# Publish this directory as the gh-pages branch root.
git init -q
git add -A
git commit -q -m "Deploy PayoutBridge static Demo build to GitHub Pages"
git push -q --force <your-remote-url> HEAD:gh-pages
```

(`<your-remote-url>` — use `git remote get-url origin` from the repo root, or just
`git push --force origin HEAD:gh-pages` if run from inside a worktree of this repo.)

GitHub Pages is already configured (Settings → Pages → source: `gh-pages` branch, root)
and serving at the URL above — a push to `gh-pages` is all a redeploy needs.

**Base path:** the repo is served from a subpath (`/Encoder-xero-app-and-agent-hackathon/`),
which `vite.config.ts` reads from `PUBLIC_BASE_PATH` (falls back to `/` for local dev). Set
it when building for Pages:

```bash
PUBLIC_BASE_PATH="/Encoder-xero-app-and-agent-hackathon/" bun run build
```

**Demo is the default mode** — no env var needed. The app boots into mock data
(`src/lib/payout-mock.ts`) unless `VITE_API_URL`/`VITE_PAYOUTBRIDGE_MOCK=0`/`?mock=0`
points it at a live backend, and it auto-falls-back to Demo if `/health` is unreachable.

## 2. Backend → Render (best-effort, Docker)

`src/backend/Dockerfile` bundles Python 3.12 + Node 22 (the Xero MCP server runs as an
`npx` subprocess — see `src/backend/xero_client.py`). `render.yaml` at the repo root is
a [Render Blueprint](https://render.com/docs/blueprint-spec) that defines both services.

1. Render dashboard → **New** → **Blueprint** → connect this GitHub repo. Render finds
   `render.yaml` automatically and shows both services (`payoutbridge-backend`,
   `payoutbridge-frontend`).
2. Fill in the `sync: false` env vars when prompted (or later under each service →
   Environment):
   - `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` — from your Xero Custom Connection
     (developer.xero.com → your app), authorised on the **Demo Company only**.
   - `XERO_SCOPES` — copy the default from `.env.example`, or the narrower list also
     documented there.
   - `CORS_ALLOW_ORIGINS` — the frontend origin(s) that will call this backend, e.g.
     `https://supawichza40.github.io` (GitHub Pages) and/or the Render static site URL.
     Comma-separated, no trailing slash.
3. Click **Apply**. Render builds the Docker image and deploys
   `payoutbridge-backend`; `GET /health` is wired as the health-check path.
4. `ALLOW_SEED` defaults to `"false"` on Render — the Demo Company is seeded once,
   locally, via `src/scripts/reset_rehearsal.py`; don't re-seed from a public deploy.

The `payoutbridge-frontend` static service in the same blueprint is an optional second
host for the same build (Render instead of/alongside Pages); it ships with no
`VITE_API_URL` set, so it also defaults to Demo mode until you set one.

## 3. Point the frontend at the deployed backend

Once the backend has a Render URL (e.g. `https://payoutbridge-backend.onrender.com`):

- **GitHub Pages build:** rebuild with the var set, then redeploy per step 1:
  ```bash
  VITE_API_URL="https://payoutbridge-backend.onrender.com" \
  PUBLIC_BASE_PATH="/Encoder-xero-app-and-agent-hackathon/" \
  bun run build
  ```
- **Render static service:** set `VITE_API_URL` in its Environment tab and trigger a
  manual deploy (build-time var — a redeploy is required for it to take effect).
- **At runtime, no rebuild:** the in-app Real/Demo toggle also accepts `?mock=0` (uses
  whatever `VITE_API_URL` was baked in at build time) or a manual URL entry, per
  `src/hooks/usePayoutBridge.ts`. If `/health` on the real backend fails, the app
  auto-falls-back to Demo — the judge URL never hard-fails.

Demo mode remains the safe default everywhere above: skip all of step 2–3 and the
GitHub Pages link still works end-to-end on mock data.
