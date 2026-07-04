# Tooling Reference — Xero · Lovable · Make

> **Purpose:** complete, source-verified "what it can and cannot do" for the three build tools, so a research/build agent can plan without guessing. Every non-obvious fact carries a source. Facts I could not verify are marked `⚠️ UNVERIFIED`.
>
> **Verified:** 2026-07-04 against live docs + the hackathon session transcripts.
> **Primary sources:** developer.xero.com (scopes, limits, custom-connections, accounting overview), github.com/XeroAPI/xero-mcp-server, make.com/en/integrations/xero, Lovable docs (via research), Xero Central (JAX), and the ENCODE/Xero hackathon Day-1 recordings.

---

## 0. The frame (why capability limits matter)

- **Every project MUST call the Xero API to be eligible.** No Xero = disqualified. (hackathon rules)
- Judging: **50%** Xero connection / real problem · **30%** API integration · **20%** production-ready architecture.
- Build in the **Demo Company** sandbox (free, resettable). Do not need a paying Xero org.
- Two build shapes: **Intelligent Apps** (extend Xero) and **Autonomous Agents** (background workers acting on Xero data).

---

# 1. XERO API

Xero serves 4M+ (stage said "5M") businesses. The API exposes invoices, contacts, payments, bank transactions, payroll, reports and more. Docs: developer.xero.com · test tool: api-explorer.xero.com · AI toolkits: developer.xero.com/ai

## 1.1 App types — pick before you build

| App type | Tenancy | Secret? | Free tier | Use when | Grant type |
|---|---|---|---|---|---|
| **Web App** | multi-tenant (many orgs) | yes (client id + secret) | **5 connections** (starter) | web app that connects other people's Xero orgs | OAuth2 Authorization Code |
| **Mobile/Desktop (PKCE)** | multi-tenant | no secret | — | public clients; good for **remote MCP** | OAuth2 PKCE |
| **Custom Connection** | **single org only (1:1)** | yes | free **only on Demo Company** | machine-to-machine, one org; good for **local MCP** | Client Credentials |

- "Organisation" = "tenant" (interchangeable). (transcript, Sharon Wall)
- Redirect URLs: up to **50** per app; typically `http://localhost...` in dev. (transcript)
- App creation asks: "Do you use Xero to train AI models?" and to accept security requirements. (transcript)
- **Client secret shown once** — copy immediately into your env file. (transcript + rules)

### Custom Connection — the pricing trap (VERIFIED, corrects earlier notes)
- Custom Connections are a **premium** option: an org needs a **paid monthly subscription** per connection. Only **AU / NZ / UK / US** orgs. **Cannot** connect Practice Manager or Xero HQ. (developer.xero.com/documentation/guides/oauth2/custom-connections)
- **Free exception:** a Custom Connection can connect to the **Xero Demo Company for free** for development, and does **not** count toward the "2 uncertified apps per org" cap. → **This is the free path for the hackathon.**
- Token flow: `POST https://identity.xero.com/connect/token`, `grant_type=client_credentials`, Basic-auth `base64(client_id:client_secret)`, space-separated `scope`. Returns bearer `access_token` (+ `expires_in`).

## 1.2 Sandbox — Xero Demo Company (build here)
- Free org with pre-loaded sample data: contacts, sales invoices, bills, bank transactions. (transcript)
- Create/switch via top-left org dropdown → My Xero. **Resettable** any time; **auto-resets ~every 28 days**; country changeable. (FINDINGS.md verified — note: there is **no** "60-minute reset")
- **Payroll works only if org region = UK or NZ.** London teams: set Demo Company region to **UK** to keep payroll ideas alive. (xero-mcp-server README + HACKATHON.md)

## 1.3 Rate limits (VERIFIED — exact)
Per **tenant** (org):
- **Concurrent:** 5 calls in flight
- **Minute:** **60 calls/min**  ← now confirmed (was previously flagged unverified)
- **Daily:** **1,000/day** (Starter tier) · **5,000/day** (Core+)
Per **app** (all tenants): **10,000 calls/min**.
- Limits are **per tenant** — each connected org gets its own 5,000/day.
- Response headers: `X-DayLimit-Remaining`, `X-MinLimit-Remaining`, `X-AppMinLimit-Remaining`.
- On exceed → **HTTP 429** + `X-Rate-Limit-Problem` (which limit) + `Retry-After` (seconds to wait). **Honor `Retry-After`.**
- **Request size:** max 10MB; batch elements in bundles of **~50 nodes** (you can create many invoices in one POST/PUT).
- Bulk reads: paginate 100 at a time (invoices, credit notes, contacts, bank transactions, manual journals support pagination).
- Source: developer.xero.com/documentation/guides/oauth2/limits
- **Design rule:** stay under 60/min on the golden path; pre-seed/cache bulk analysis, never live-loop the API during the demo.

## 1.4 OAuth 2.0 scopes (VERIFIED — current granular set)
- **Scopes are additive**; you can't remove one from a token (revoke + re-auth to reduce). Request the minimum needed.
- **`offline_access`** required to get a refresh token.
- **OpenID:** `openid`, `profile`, `email` (SSO / identity).
- **Granular migration:** broad scopes are being replaced by granular ones. Web/PKCE apps got granular from **March 2026**; Custom Connections from **29 Apr 2026**. Broad scopes still work until **Sept 2027**. New Custom Connections lose `accounting.journals.read`. (scopes page + custom-connections page)

**Accounting scopes** (write scope implies read; `.read` = GET only):
| Scope | Grants (resources) |
|---|---|
| `accounting.transactions` *(deprecated → split below)* | BankTransactions, BankTransfers, BatchPayments, CreditNotes, ExpenseClaims, Invoices, LinkedTransactions, ManualJournals, Overpayments, Quotes, Payments, Prepayments, PurchaseOrders, Receipts, RepeatingInvoices |
| `accounting.invoices` | CreditNotes, Invoices, LinkedTransactions, Quotes, PurchaseOrders, RepeatingInvoices, Items |
| `accounting.payments` | BatchPayments, Overpayments, Payments, Prepayments |
| `accounting.banktransactions` | BankTransactions, BankTransfers |
| `accounting.manualjournals` | ManualJournals |
| `accounting.contacts` | Contacts, ContactGroups |
| `accounting.settings` | Accounts, BrandingThemes, Currencies, Items, InvoiceReminders, Organisation, TaxRates, TrackingCategories, Users |
| `accounting.attachments` | attachments across most resources |
| `accounting.journals.read` | Journals (general ledger) — *removed for new Custom Connections* |
| `accounting.budgets.read` | Budgets |
| `accounting.reports.*.read` | granular reports: `aged`, `balancesheet`, `banksummary`, `budgetsummary`, `executivesummary`, `profitandloss`, `trialbalance`, `taxreports`, `tenninetynine` |

**Other API scopes:** `payroll.employees`/`.payruns`/`.payslip`/`.timesheets`/`.settings` (AU/UK/NZ, each with `.read`) · `files` / `files.read` · `assets` / `assets.read` · `projects` / `projects.read` · `einvoicing`.
**Certification-gated:** `paymentservices`, `bankfeeds`, `finance.*.read` (accountingactivity, cashvalidation, statements, bankstatementsplus). **Client-credentials-only (non-tenanted):** `app.connections`, `marketplace.billing`.

## 1.5 Accounting API endpoints (VERIFIED — full list)
Accounts · Attachments · Bank Statements · **Bank Transactions** · Bank Transfers · Batch Payments · Branding Themes · Budgets · Contact Groups · **Contacts** · **Credit Notes** · Currencies · Expense Claims *(deprecated)* · History & Notes · Invoice Reminders · **Invoices** · **Items** · **Journals** · Linked Transactions · **Manual Journals** · Organisation · Overpayments · Payment Services · **Payments** · Prepayments · **Purchase Orders** · **Quotes** · Receipts *(deprecated)* · **Repeating Invoices** · **Reports** · Tax Rates · **Tracking Categories** · Types · Users.
(developer.xero.com/documentation/api/accounting/overview)

- **Repeating Invoices support POST/PUT** (create/update templates) via REST — corrects an earlier "GET-only / impossible" claim. The **MCP wrapper** just doesn't expose it. (scopes page lists RepeatingInvoices under write scope; FINDINGS.md verification)
- Other APIs: **Payroll AU / UK / NZ**, **Files**, **Assets**, **Bank Feeds** (cert), **Finance** (cert), **Projects**, **Practice Manager 3.0/3.1** (cert), **eInvoicing**, **Xero App Store**.

## 1.6 System / plan limits (may bite seeded demos)
- Designed for ≤ **5,000 sales invoices/mo**, ≤ **5,000 bills/mo**, ≤ **5,000 bank txns/mo**, ≤ **4,000 tracked inventory items**, ≤ **10,000 contacts**, ≤ **500 fixed assets**. (limits page)
- **Starter ("Early") Xero plans** cap **20 approved AR invoices + 5 approved AP bills per month** → API returns HTTP 400 "reached the limit of invoices you can approve". Demo Company is not on this cap, but real client orgs may be.

## 1.7 JAX — the incumbent you must not rebuild (competitive boundary)
**JAX ("Just Ask Xero")**, launched Sept 2025, is Xero's own AI agent. It natively does: natural-language finance Q&A, **auto-reconciliation** of high-confidence bank transactions (>~80%), AR/AP actions, data entry, on-demand analytics/charts. Building any of these = competing with the platform. (RESEARCH.md, Xero media release / product page)

**JAX CANNOT (verified openings):**
- **No financial forecasts, advice, or recommendations** — Xero's own disclaimer. → forecasting/advisory is deliberately off-limits.
- Cannot edit line items, void/delete invoices, or create invoices where US auto-sales-tax is on.
- Operates on **structured, in-Xero data** — not messy external multi-document onboarding.
→ **Aim your build at:** forecast→recommend→act, messy external documents/parties, or autonomously *fixing* (with audit trail) where JAX only flags. (Xero Central — About JAX)

## 1.8 Xero AI toolkit (developer.xero.com/ai)
Four pieces (stage-announced): **Agentic SDK**, **MCP servers** (local + **remote in beta**), **CLI**, **prompt libraries**.

### Xero MCP server — the agent's actual tool surface (VERIFIED)
Repo `@xeroapi/xero-mcp-server` (github.com/XeroAPI/xero-mcp-server). Node ≥18. Run: `npx -y @xeroapi/xero-mcp-server@latest`.
- **Auth mode A — Custom Connection:** env `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, optional `XERO_SCOPES` (space-separated). Best for dev + 3rd-party MCP clients (Claude Desktop). Auto-tries V1 (bundled) scopes, falls back to V2 (granular).
- **Auth mode B — Bearer token:** env `XERO_CLIENT_BEARER_TOKEN` (takes precedence). Best for multi-org + PKCE at runtime.

**MCP CAN (tools exposed):**
- **Read:** `list-accounts`, `list-contacts`, `list-invoices`, `list-items`, `list-credit-notes`, `list-manual-journals`, `list-payments`, `list-quotes`, `list-tax-rates`, `list-bank-transactions`, `list-organisation-details`, `list-profit-and-loss`, `list-trial-balance`, `list-report-balance-sheet`, `list-aged-receivables-by-contact`, `list-aged-payables-by-contact`, `list-contact-groups`, `list-tracking-categories`, plus payroll: `list-payroll-employees`, `list-timesheets`, `list-payroll-employee-leave[-balances]`, `list-(payroll-)leave-types`, `list-payroll-leave-periods`.
- **Create:** `create-invoice`, `create-contact`, `create-credit-note`, `create-bank-transaction`, `create-item`, `create-manual-journal`, `create-payment`, `create-quote`, `create-tracking-category`, `create-tracking-option`, `create-payroll-timesheet`.
- **Update:** `update-contact`, `update-item`, `update-manual-journal`, `update-tracking-category`, `update-tracking-options`, `update-invoice` **(draft only)**, `update-quote` **(draft only)**, `update-credit-note` **(draft only)**.
- **Payroll timesheet lifecycle:** add/update line, `approve-`, `revert-`, `delete-`, `get-payroll-timesheet`.

**MCP CANNOT (gaps — use raw REST for these):**
- **No delete/void** of invoices, contacts, payments, credit notes, etc. (only payroll timesheets can be deleted).
- **Updates only touch DRAFT** invoices/quotes/credit notes — can't edit an authorised invoice.
- **No repeating invoices, no attachments, no send-email, no reports beyond P&L / balance sheet / trial balance / aged**, no bank feeds, no reconciliation endpoint.
- → If your idea needs any of the above, call the **Accounting REST API directly** (all of it is supported by the API even when the MCP wrapper isn't).

## 1.9 Webhooks
Supported and recommended (dev portal). Subscribe to events (e.g. invoices, contacts) instead of polling — saves rate limit. (transcript + limits guidance)

## 1.10 Xero — one-line gotchas
- Custom Connection free **only** on Demo Company; real orgs pay monthly.
- Payroll needs UK/NZ region on the Demo Company.
- Update-invoice (MCP) = draft only; no delete/void anywhere in MCP.
- 60/min, 5/concurrent, 5,000/day — pre-seed, don't live-loop.
- Don't rebuild JAX (NL Q&A, auto-recon, categorisation) — aim at forecast/act, messy external docs, autonomous fix.

---

# 2. LOVABLE (lovable.dev)

AI web-app builder: describe in plain English → it writes real code, asks clarifying questions, previews, iterate. Barrier is the brief, not the code. Hackathon: **100 free credits** from Adam at the 2:45pm workshop. (transcript + Lovable docs)

## 2.1 Stack it generates
- **Frontend:** standard **Vite + React**, **Tailwind CSS** default, component-based, mobile-first.
- **Backend:** **Lovable Cloud** (managed hosting, previews, visual editor, **secure secrets store**) or **Supabase** (Postgres + auth + storage + **edge functions**).
- **Source code** is editable; **continuous GitHub sync**; can migrate off Lovable Cloud later.

## 2.2 CAN
- Build full-stack apps with real DB, auth, and UI from chat; prototypes, internal tools, marketing sites, landing pages.
- **Call the Xero API from a backend** (Supabase/Lovable Cloud **edge functions**) and **handle Xero OAuth env vars + secrets securely** — Adam explicitly called out spinning up a backend to call Xero "elegantly." (transcript)
- **Stripe** payments; ship a **Xero App Store-ready** web app; publish instantly; custom domains.
- "Try to Fix" debugging loop (scans logs, attempts fixes); "Plan mode" before building.

## 2.3 CANNOT / weak spots
- **No first-party, opinionated Xero connector** — you (via the AI) write the integration against Xero's REST API yourself; it's generic HTTP, not pre-built modules (contrast Make).
- Not an automation/scheduler engine — for background cron/agent workflows watching a second app, Make fits better.
- Generated code quality still needs review for production; complex multi-step accounting logic can be brittle (seed + constrain).

## 2.4 LIMITS
- **Credit/message-based pricing.** Free tier exists but exact daily/monthly message caps `⚠️ UNVERIFIED` — check lovable.dev/pricing. Hackathon grants **100 credits**; spend them on the golden path, not exploration.
- Best fit here: **Productivity Powerhouse** and **Cashflow Accelerator** (a polished Xero-connected web app/agent UI).

---

# 3. MAKE (make.com, formerly Integromat)

No-code visual automation: **scenarios** built from **modules** (triggers + actions) that pass **bundles** of data between 3,000+ apps. Three tiers: traditional (deterministic), workflow+AI (one model for a task), and **AI Agents** (agent decides which tools to use). Hackathon: free credits via QR/Sonia (bonus credits for existing users). (transcript + make.com)

## 3.1 Xero connector — the pre-built advantage (VERIFIED counts)
**96 Xero modules: 12 triggers · 65 actions · 19 searches.** (make.com/en/integrations/xero — full list at apps.make.com/xero)
- **Triggers (watch):** new invoices, payments, contact updates, etc.
- **Actions (do):** Create a Contact / Contact Group / Bank Transaction / Bank Transfer / Batch Payment / Credit Note / Folder; Add Contact to Group; Archive a Contact; create invoices from upstream events; log payments (e.g. from Stripe); etc.
- **Searches:** list/find records.
→ **This is Make's edge over Lovable for the Vibe Integrator track:** you get typed Xero modules instead of hand-writing REST calls.

## 3.2 CAN
- Watch a **second app** (Shopify, Stripe, CRM, Sheets, Gmail, a marketplace) and **sync into Xero** with no API code — squarely the **Vibe Integrator** brief.
- **AI Agents** on the same canvas: agent reasons, picks tools/modules across 3,000+ apps, with a visible step-by-step Reasoning panel (not black-box); reusable across scenarios.
- **Code modules:** embed **JavaScript or Python** inside a scenario for custom logic/transforms.
- **Make AI Toolkit** (free Make-hosted AI provider, no third-party API key) and **Make AI Web Search** (web data, no key). **MakeGrid** (org-wide view), **scenario sharing** (publish + copy-paste between teams).

## 3.3 CANNOT / weak spots
- **Not a UI/app builder** — no frontend framework; you can't ship a customer-facing web app with it (pair with Lovable for UI).
- Bound to the connector's module set + generic HTTP module; deep custom flows can get fiddly.
- **Operations = cost:** every module run per bundle consumes an operation → loops/large syncs burn quota fast.

## 3.4 LIMITS
- **Operations-based** execution/pricing; each module run per bundle = 1+ operations.
- **Free plan** exists ("no time limit", no card). Exact free quota (commonly cited ~1,000 ops/mo, 2 active scenarios) and **min scheduling interval (~15 min on lower tiers)** are `⚠️ UNVERIFIED` — confirm at make.com/pricing. Templates in the wild default to a **15-minute** run interval.
- Best fit here: **Vibe Integrator** (second-app → Xero sync) and background **Autonomous Agents**.

---

# 4. Which tool for which track (quick map)

| Track (£3,000 each) | Best tool | Why |
|---|---|---|
| **Productivity Powerhouse** — automate a manual SMB workflow | **Lovable** (UI+agent) or **Make** (pure automation) | receipt categorising, stock prediction as a polished app or a scenario |
| **Vibe Integrator** — agent monitors a 2nd app, syncs into Xero | **Make** | pre-built Xero modules + AI Agents = the brief verbatim |
| **Cashflow Accelerator** — use Xero payments data to find/act on revenue | **Lovable** frontend + Xero REST | forecasting/act sits in JAX's banned zone; needs custom logic + UI |

**General:** demo on the **Demo Company** via **Custom Connection (free)** or Web App; keep the golden path under the rate limits; log the endpoints + scopes you use (the submission form asks).

---

# 5. Sources
- Xero scopes — developer.xero.com/documentation/guides/oauth2/scopes/
- Xero limits — developer.xero.com/documentation/guides/oauth2/limits/
- Xero custom connections — developer.xero.com/documentation/guides/oauth2/custom-connections/
- Xero accounting endpoints — developer.xero.com/documentation/api/accounting/overview
- Xero MCP server — github.com/XeroAPI/xero-mcp-server
- Make Xero connector — make.com/en/integrations/xero (full modules: apps.make.com/xero)
- Lovable — lovable.dev + docs (via research synthesis; pricing to be confirmed)
- JAX limits — central.xero.com/s/article/About-Just-Ask-Xero-JAX (via RESEARCH.md)
- Hackathon facts — ENCODE/Xero Day-1 recordings (Notion) + HACKATHON.md / FINDINGS.md
