> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 8.

## 8.1 Lovable
The **Approval Drawer IS the Lovable entry** — no separate build. Panes: parsed payout · proposed actions checklist · live posting progress · audit trail. Scaffolded from the [Lovable 2026 template](https://github.com/XeroAPI/xero-prompt-library/tree/main/lovable); backend secrets via edge-function pattern from the workshop. Zero extra demo time: it's the golden path's face.

**Lovable prompt sketch (give to Lovable, adapt):**
> "Build a single-page financial approval app called PayoutBridge. Dark professional theme. Main element: an 'Approval Drawer' card showing (1) an uploaded payout summary — gross sales £1,340, commission £445.90, fees £47.10, net payout £847; (2) a 'What Xero will do' checklist with three items (create gross revenue invoice, book commission & fees, clear £847 against the bank deposit); (3) a large green 'Approve & Post to Xero' button that calls POST /approve on my backend and then shows live step progress 1/3, 2/3, 3/3 with green ticks; (4) after completion, a 'Clearing Reconciliation' panel showing the equation and 'Platform Clearing: £0.00 ✓' fetched from GET /status; (5) a side-by-side P&L before/after panel fetched from GET /pnl; (6) a collapsible audit-trail table (timestamp, action, Xero ID, status). Also handle the duplicate case: if /propose returns already-posted, show an amber banner 'Already posted — skipped (idempotent)' with the existing Xero IDs."

## 8.2 Make (Sunday 09:00, 45-minute cap)
**Scenario:** Gmail/Drive watch for "Treatwell Sales Proceeds" attachment → HTTP POST file to agent `/propose` → receive breakdown + idempotency status → post Slack (or email) approval card with a link to the Approval Drawer. **Approval and all Xero writes stay in the agent** (control + audit). Make owns ingestion + notification — positioned as **agentic orchestration**, the exact tier their own workshop slide promoted over brittle zaps. Screenshot into the deck; 5 seconds of pitch: "payout statements arrive by email — Make catches them."

## 8.3 Main track: B01 (everything above)

---

# SECTION 9 — RISK REGISTER & PIVOT PLAN

