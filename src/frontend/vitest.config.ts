// Standalone Vitest config (deliberately NOT layered on vite.config.ts, which
// wraps @lovable.dev/vite-tanstack-config's TanStack Start / nitro / SPA
// plugins — those are build-time concerns unrelated to unit testing and
// pull in a heavier pipeline than a jsdom test run needs).
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/**/*.tsx", "src/lib/**/*.ts"],
      exclude: ["src/components/ui/**"],
    },
  },
});
