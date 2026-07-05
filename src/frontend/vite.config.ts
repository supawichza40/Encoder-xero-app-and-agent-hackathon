// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Static Demo deploy (GitHub Pages): set PUBLIC_BASE_PATH to the repo subpath, e.g.
// "/Encoder-xero-app-and-agent-hackathon/". Empty/unset keeps root base "/" for local dev.
const basePath = process.env.PUBLIC_BASE_PATH || "/";

export default defineConfig({
  vite: {
    base: basePath,
    // Dev-only proxy so the chatbot (src/lib/ollama.ts) can call Ollama Cloud
    // same-origin — the browser can never reach ollama.com directly (no CORS
    // support, probe-verified in PREFLIGHT.md §9). Stripped by the Lovable
    // sandbox wrapper (isSandboxEnvironment()) but active for local `bun dev`.
    server: {
      proxy: {
        "/api/ollama": {
          target: "https://ollama.com",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/ollama/, ""),
        },
      },
    },
  },
  // Disable the Cloudflare-worker nitro preset for the static Demo build. It relocates the
  // server bundle to .output/server, which breaks SPA prerender (it expects dist/server/server.js).
  // With nitro off, TanStack Start uses its native output layout and prerenders the shell cleanly.
  nitro: false,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // SPA mode prerenders just the root shell to a static index.html so the app can be
    // hosted as fully client-side static files (no SSR runtime needed) — Demo mode is
    // 100% client-side mock, so this is the GitHub Pages target.
    spa: { enabled: true },
  },
});
