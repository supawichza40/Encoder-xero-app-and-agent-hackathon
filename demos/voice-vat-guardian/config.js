// config.js — client-side config for the VAT Guardian demo page.
// This file is served to the browser. It contains NO secrets (never put the API key here).
//
// clientId is the PUBLIC Web Voice channel id. Getting it is a ONE-TIME DASHBOARD STEP:
//   1. Open the agent dashboard (agent.bimpe.ai) and pick the VAT Guardian agent.
//   2. Channels -> Web Voice -> Activate voice widget   (requires a Pro/Team plan).
//   3. Copy the generated client id and paste it below, replacing the placeholder.
//
// Until a real client id is pasted here, the page deliberately shows a friendly
// setup checklist instead of a broken widget. That IS the idle/setup state.
window.VAT_GUARDIAN_CONFIG = {
  clientId: "PASTE_CLIENT_ID_HERE"
};
