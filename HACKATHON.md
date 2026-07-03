# Rise of the Builder: The Xero App & Agent Hackathon

Build AI-powered apps and autonomous agents on Xero for 4.4M+ small businesses.

- **Registration (Luma):** https://luma.com/vvvnk7bs
- **Programme page (Encode):** https://www.encodeclub.com/programmes/xero-hackathon
- **Sign up:** https://www.encodeclub.com/programmes/xero-hackathon

## Essentials

| | |
|---|---|
| **Dates** | Sat 4 July → Sun 5 July 2026 |
| **Hours** | 10:00–17:00 BST (venue closes 23:00 Sat, reopens 08:00 Sun) |
| **Format** | In-person, 2 days, beginner-friendly |
| **Venue** | Encode Hub, 41 Pitfield St, London N1 6DA, UK |
| **Hosts** | Encode Club × Xero |
| **Partners / Sponsors** | Xero Developer, Lovable, Make, Replit |
| **Prizes** | 9,000 across 3 bounty tracks ($3,000 each) — *currency inconsistent across sources: Luma/CompeteHub say $9,000, Encode says £9,000. Confirm on the day.* |
| **Registration** | Approval-required via Luma |

> **Note:** No accounting background needed. Target profile: comfortable with APIs + already using AI-native tools (Cursor, LLM orchestration).

## Mission

Build next-gen apps and autonomous agents on Xero (cloud accounting platform, 4.4M small-business users) that work in the real world — not just demo-ware. Vibe-code to scaffold ideas fast, then solidify into production-ready architecture.

**Small business pain points to solve:** manual data entry, fragmented tools/workflows, constant tab-switching → lost time, inefficiency, missed opportunities.

**Two build categories:**
- **Intelligent Apps** — extend Xero with high-utility tools (inventory management, contractor time tracking)
- **Autonomous Agents** — background workers that take action on Xero data (chasing overdue invoices, managing vendor interactions)

## Bounty Tracks ($3,000 each)

### 🏆 Bounty 01 — The Small Business Productivity Powerhouse
Automate a real, painful workflow that is reliable/accurate, easy for non-technical users, clearly time-saving. **Xero must be central, not a bolt-on.**
Examples: auto-categorise receipts/expenses/transactions · smart invoice reconciliation/matching · predict stock shortages from sales trends · automate payroll/contractor payments · end-to-end workflows (receipt → expense → reconciliation → reporting). Strong entries use AI to handle edge cases, messy data, real-world variability.

### 🔗 Bounty 02 — The Vibe Integrator
AI-powered integrations that adapt to messy data instead of brittle "if-this-then-that" logic. Focus on flexibility + intelligence, not just connectivity.
Examples: sync CRM deals → Xero invoices with smart field mapping · connect Shopify/Stripe-style data into Xero with AI categorisation · monitor another app and trigger Xero actions · a "universal translator" for business data between tools.

### 💸 Bounty 03 — The Cash Flow Accelerator
Don't just track money — grow it. Analyse Xero data + take proactive autonomous action on revenue opportunities.
Examples: detect lapsed high-value customers → trigger outreach · identify upsell/cross-sell opportunities · recommend subscription conversions · predict late payments + automate follow-up · highlight underperforming products/services. Best solutions combine data analysis + autonomous action.

## Judging Criteria

| Weight | Criterion | What it means |
|---|---|---|
| **50%** | Xero Connection | Real problem + strong use of Xero (Xero must be central) |
| **30%** | API Integration | Effective use of Accounting / Payments APIs |
| **20%** | Architecture | Reliable, production-ready design |

**Strategic read:** 50% rides on Xero being the beating heart of the solution — pick one genuinely painful small-biz workflow and make Xero central, not a data source. Use MCP server to get a working agent fast; spend saved time on reliability/edge cases (the 20% architecture bucket = what separates real from demo-ware).

## Toolkit & Developer Resources

| Tool | Link |
|---|---|
| **MCP Server** | https://github.com/XeroAPI/xero-mcp-server |
| **Agentic SDK** | https://github.com/XeroAPI/xero-agent-toolkit |
| **Prompt Library** | https://github.com/XeroAPI/xero-prompt-library |
| **AI Toolkit hub** | https://developer.xero.com/ai |
| **Developer site** | https://developer.xero.com/ |
| **Getting Started Guide** | https://developer.xero.com/documentation/getting-started-guide/ |
| **API Reference (Accounting)** | https://developer.xero.com/documentation/api/accounting/overview |
| **API Explorer** | https://api-explorer.xero.com/ |
| **SDKs & Tools** | https://developer.xero.com/documentation/sdks-and-tools/libraries/overview/ |
| **Best Practices (cert matrix)** | https://developer.xero.com/documentation/best-practices/overview/cert-matrix |
| **AI YouTube learning series** | https://www.youtube.com/playlist?list=PLuDv48k-nc-9MmUYWCfIGp6ukAH3V2huC |
| **Vibe-code platforms** | Lovable · Make · Replit |

### Xero MCP Server — available tools
`list-accounts` · `list-contacts` · `list-credit-notes` · `list-invoices` · `list-items` · `list-manual-journals` · `list-organisation-details` · `list-profit-and-loss` · `list-quotes` · `list-tax-rates` · `list-payments` · `list-trial-balance` · `list-bank-transactions` · `list-report-balance-sheet` · `list-aged-receivables-by-contact`

**Payroll:** `list-payroll-employees` · `list-payroll-employee-leave` · `list-payroll-employee-leave-balances` · `list-payroll-employee-leave-types` · `list-payroll-leave-periods` · `list-payroll-leave-types` · `list-timesheets`

**Auth — Custom Connections** (recommended for Claude Desktop / 3rd-party MCP clients): specify client id + secret per organisation. Setup: https://developer.xero.com/documentation/guides/oauth2/custom-connections/
- Scopes: SCOPES_V1 (before Apr 29 2026, bundled) vs SCOPES_V2 (from Apr 29 2026, granular). Server tries V1 first, falls back to V2. Override with `XERO_SCOPES` env var (space-separated list).

## Schedule

### Saturday 4 July
| Time | Item |
|---|---|
| 10:00 | Doors open — registration, breakfast, mingling |
| 11:00 | Intros by Encode: logistics, platform overview, agenda |
| 11:15 | Welcome from Xero: workshops & prizes — Corey Leung & Madhu Gupta |
| 11:30 | Overview of the Xero API — Sharon Ball |
| 11:45 | Overview of Make — Sonia Calvo |
| 12:00 | Overview of Lovable |
| 12:15 | **Hackathon starts** |
| 12:30 | Lunch |
| 13:00 | Team formation |
| 13:00–13:30 | Mastering the Xero AI Toolkit / Vibecoding 101 — Regan Ashworth |
| 13:30 | Scaffolding for Small Business — Annie Terry |
| 14:30 | Make Deep Dive — Sonia Calvo |
| 16:00 | Check-in 1: all hackers should be in a team |
| 16:30 | Brain break: LEGO builder challenge |
| 19:00 | Dinner |
| 22:00 | Checkpoint 2: mid-hack submission |
| 23:00 | Venue closes for the night |

### Sunday 5 July
| Time | Item |
|---|---|
| 08:00 | Breakfast |
| 11:00 | Build complete — submissions announced (Check-in 3) |
| 12:00 | Lunch |
| 13:00 | Pitch training |
| 14:30 | Pitch order announced |
| 14:45 | **Pitches: 3-minute demos + Q&A** |
| 15:30 | Judge deliberation |
| 15:45 | Honourable mentions |
| 15:50 | Partner prizes: Make & Lovable |
| 16:00 | Awards & winners announced |
| 17:00 | Hack ends |

## People / Mentors (on-site all weekend)

- **Madhu Gupta** — GM & VP Product, Developer Ecosystem
- **Annie Terry** — Global Head of Platform Marketing, Xero Developer (workshop: Scaffolding for Small Business)
- **Regan Ashworth** — Head of Ecosystem Governance (workshops: Xero AI Toolkit, Vibecoding 101)
- **Sharon Ball** — Developer Evangelist (workshop: Overview of Xero API)
- **Corey Leung** — Developer Marketing Manager
- **Ashish Nangia** — Principal Product Manager, AI Products
- **Robin Blackstone** — API Support Team Lead
- **Matt Ramsay** — API Compliance Analyst
- **Anthony Beaumont** — CEO, Encode Club
- **Sonia Calvo** — Community Events Manager, Make (workshop: Make Deep Dive)
- **Adam Oskwarek** — Ambassador, Lovable

## Data Discrepancies to Verify On-Site

- **Prize currency:** $9,000 (Luma, CompeteHub) vs £9,000 (Encode programme page).
- **Year:** CompeteHub mirror misprints "July 4-5, 2024" — correct year is **2026** (per Encode + Luma).
- **Some schedule times** differ slightly between Luma and Encode pages (both listed above where they diverge).

---
*Sources: Luma event page, Encode Club programme page, CompeteHub mirror, XeroAPI GitHub repos, developer.xero.com. Compiled 2026-07-04.*
