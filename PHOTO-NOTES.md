# Photo Notes — extracted from event photos

> Source: `Pictures/IMG_3679–3708.png` (30 photos of hackathon slides/screens/signage), extracted 2026-07-04 by reading each image. Slide/screen text is verbatim; `[unreadable]` / "approx" mark low-confidence reads. Image refs in `(…)`.
> Most of this confirms the Notion Day-1 notes; **NEW / conflicting** items are flagged.

## Event identity
- **Official name: "Rise of the Builder — The Xero App & Agent Hackathon."** London, **4–5 July 2026**. Hashtag **#XEROHACKATHON**. Run with **Encode Club**. Wi-Fi `encode hub`. (3681, 3682, 3685, 3692, 3707)

## Speakers (NEW — names)
- **Corey Leung** — Developer Marketing Manager, Ecosystem (Xero). (3681)
- **Annie Terry** — Head of Platform Marketing (Xero). (Notion + stage)
- **Sharon Wall** — Senior Ecosystem Governance Analyst (Xero); gave the API overview + does app certification. (3687; badge partly legible)
- **Sonia Calvo** — Community Events Manager @ Make; linkedin.com/in/soniatoqqe. (3695)
- **Adam Oskwarek** — Lovable ambassador; adamoskwarek.com. (3702)

## Schedule — Saturday 4 July (BST) (3679, 3708) — NEW detail
| Time | Item |
|---|---|
| 10:00 | Doors open: registration & swag · breakfast & snacks · barista (10am–2pm) |
| 11:00 | Intros by Encode (logistics & agenda) |
| 11:15 | Welcome from Xero (schedule & prizes) |
| 11:25 | Intro: Head of Platform Marketing |
| 11:30 | Overview of the Xero API |
| 11:45 | Overview of Make |
| 12:00 | Overview of Lovable |
| **12:15** | **Hackathon starts** |
| 12:30 | Lunch |
| 13:00 | Team formation · Workshop: Xero AI Toolkit / Vibecoding 101 |
| 13:30 | Workshop: Scaffolding for Small Business |
| 13:45 | Workshop: Make deep dive |
| 14:15 | Workshop: Lovable deep dive |
| 14:45 | Workshop: Pitch Perfect |
| **16:00** | **Checkpoint 1: Project Creation (must be on platform with project)** |
| 19:00 | Dinner · 22:00 Night munchies · 23:00 Venue closes for the night |

⚠️ **Conflict — Lovable workshop time:** schedule slide shows "Lovable deep dive **14:15**"; Adam's own slide + Notion say **"2:45pm"** (14:45, which the schedule labels "Pitch Perfect"). Treat Lovable workshop as **~14:15–14:45 — confirm on the day.** (glare made some minute-times approximate)

## Schedule — Sunday 5 July (BST) (3680)
| Time | Item |
|---|---|
| 08:00 | Breakfast & building continues |
| **11:00** | **Submissions due! Building complete** |
| 14:45 | Pitches — 3-minute demos to judges |
| 15:00 | Happy hour |
| 15:30 | Awards & winners |
| 16:00 | Hack ends |

## Submission requirements (3707) — NEW detail vs Notion
**The basics:** 1) project details (what you built); 2) dev platform used (Lovable / Make / Claude); 3) **link to your presentation** (Google Slides, Canva, etc.); 4) **demo video (recommended)**.
**The Xero questions (required):**
1. How did your project use the Xero API? (e.g. automated invoicing, expense syncing, AI bank reconciliation)
2. Which endpoints + methods? (e.g. `POST /Invoices`, `GET /Contacts`)
3. Which OAuth 2.0 scopes? (e.g. `accounting.invoices`, `accounting.contacts`)

⚠️ **Differs from Notion:** the on-site slide lists a **presentation link as a basic** (not "only if finalist") and a **demo video as recommended**. Plan for both.

## Why Xero (3685)
- 4M+ businesses; API data = **invoices, transactions, bank feeds, payroll** via a stable REST API; first-class SDKs, docs, active community.
- ⚠️ **Business-count varies by slide:** 4M+ ("Why Xero"), **4.4M** (Lovable), 5M (stage/anniversary). Use ~4.4M subscribers as the safe figure.

## Getting started — developer portal (3686)
developer.xero.com configures: Redirect URIs · Client ID/Secret · connection & usage stats · webhooks · team collaborators. Resources: **API Documentation · Official SDKs · API Explorer · AI Toolkit**. Support: Discord + in-person.

## Xero AI Toolkit (3687, 3688) — KEY NEW DETAIL
- Page: **developer.xero.com/ai** — "The Rise of the Builder: Build Next-Gen Xero Integrations with Xero's AI toolkit."
- **"Powered by Xero's MCP Server, Command Line Interface, OpenAI Agents SDK and LangChain."** ← OpenAI Agents SDK + LangChain named as the supported agent frameworks.
- Four components:
  - **Agentic SDK** — examples building AI agents with various agentic frameworks + the Xero MCP Server.
  - **MCP Servers (local & remote)** — open source; securely connect LLMs to Xero data.
  - **Xero CLI** — wraps the Xero API; "high-performance bridge for autonomous systems."
  - **Prompt Library & Code Samples.**
- → folded into `TOOLING.md` §1.8.

## API Explorer (3689, 3690, 3691)
- **api-explorer.xero.com** — builds/views requests against Xero's public APIs; **driven by the Xero OpenAPI specification**; authorise an org to run live requests.
- OAuth consent screen (against **Demo Company (UK)**) requested scopes: pay runs, payslips, timesheets, projects, attachments, fixed assets, business transactions, payroll settings, contacts, org settings, file library, employees (view+manage); read-only budgets + general ledger. (3691)

## Support & certification (3683)
- **#hack-help** channel on the hackathon Discord (join via QR). Slide title: "Hack Support & Certification" — app certification available.

## Make — session slides (3693–3701)
- Presenter Sonia Calvo. Make = no-code integration / visual automation **since 2016**, now **agentic AI orchestration**; **300+ Makers**; **200k+ customers** (Amazon, BambooHR, Walt Disney, Stellantis, Bolt); reviews Capterra 4.8 / G2 4.7 / GetApp 4.8 / Gartner 4.6; **part of Celonis (process-mining, ~$13B valuation)**. (3696)
- Scale: **400+ AI apps, 3000+ apps, 9,000+ pre-built solutions**, drag-and-drop. (3697)
- **Agentic automation spectrum:** traditional workflows → AI-in-workflows → agentic (deterministic ↔ non-deterministic). (3698)
- **Library of Agents — make.com/ai-agents-library** — 9 pre-made AI-agent scenario templates (Customer Order Management, Event Comms, Brand Voice Consistency, Content Draft Creator, Slack Search, Product Release Automation). Usable as build foundations. (3700)
- Learning: **academy.make.com** (free), **make.com/en/webinars**. (3699)
- Xero connector **make.com/en/integrations/xero** — "Verified," "supported and maintained by Make"; free plan = no card / no time limit; use cases: sync invoices/expenses/contacts, payment alerts, CRM updates, reconcile transactions. (3701)

## Lovable — session slides (3702–3706)
- Presenter Adam Oskwarek. Deck: **"Xero x Lovable — Building real apps just by chatting"** (17 slides).
- AI app builder: chat → real working software.
- **What you can build (slide 07):** Prototypes · Internal tools · **Full-stack apps (DB + auth + hosting included)** · **AI agents (that call APIs like Xero and act)** · Integrations · Feature-rich websites. Framing: "anything that helps 4.4M small businesses run better." (3704)
- **100 free Lovable credits** at the **2:45pm** workshop. (3705, 3706)

## Venue extras (3684, 3707)
- Brain-break games + prizes: Heads or Tails, Lego Build Challenge, Drift Car Racing. Sat-night DJ; energy-drink popup (Sat afternoon); barista Sat 10am–2pm; **Sunday prize raffle**.
- Perk: **PS5** via the Encode Club account — games: COD, EAFC 26, Rocket League. (3707)

## Photos with no extra data
Venue/speaker/branding shots and near-duplicates: 3681, 3682, 3692, 3694 (dup of 3693), 3703, 3706 (dup of 3705).
