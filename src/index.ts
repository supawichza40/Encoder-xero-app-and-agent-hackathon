import "dotenv/config";

// Environment check stub (not the feature). Confirms creds are wired before building.
const required = ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"] as const;
const missing = required.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.log(
    `⏳ Not ready — missing: ${missing.join(", ")}.\n` +
      `   Copy .env.example → .env and fill from your Xero Custom Connection (see docs/SETUP.md).`,
  );
} else {
  console.log("✅ Xero credentials present. SDK + MCP ready to build.");
  console.log(`   Scopes: ${process.env.XERO_SCOPES ?? "(default)"}`);
}
