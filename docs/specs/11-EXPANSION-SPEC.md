# PayoutBridge — Expansion Spec (API Depth + Personas)

> **Status: APPROVED 2026-07-05.** Six API-depth features plus the three-persona entry system. This doc is the single source for the expansion; docs `01`–`10` carry pointer edits back here. Feature #7 (webhooks) is explicitly deferred — roadmap only.
>
> **Why this exists:** judging is 50% Xero-centrality, 30% API integration depth, 20% production-readiness. The base golden path uses 3 write types; this expansion takes us to 4 write types + 2 raw-REST calls + 4 additional read surfaces, without touching the locked golden CSV or breaking the ≤60 calls/min budget.

---

## E1 — Refund flow via `create-credit-note` **[UC-R3 → Supported]**

**What.** A second CSV variant (`marketplaceco-payout-2107.csv`, new fixture — golden CSV stays locked) contains `Refunds > 0`. The planner emits a **4-step plan**: the existing 3 writes plus a `create-credit-note` step for the refund amount against the MarketplaceCo contact, posted to Platform Clearing.

**Invariant unchanged:** `gross − commission − fees − refunds === net`. The refunds term finally becomes non-zero; the planner already validates it.

**Plan step (new kind):**

```
- kind: "create-credit-note"
  amount: <refunds>          # e.g. 60.00
  account: "Platform Clearing"
  contact: "MarketplaceCo (Marketplace)"
```

Step order: invoice → credit-note → bank-transaction → payment. Idempotency step-map grows to 4 keys for refund files; 3-step files are unaffected.

**New fixture (values chosen so the invariant holds):**
`gross 1180.00 − commission 383.50 − fees 41.50 − refunds 60.00 = net 695.00`

- Backend: `planner.py` (conditional 4th step), `models.py` (StepKind enum + credit_note_id), `idempotency.py` (dynamic step list), `xero_client.py` (`create-credit-note` MCP call), `seed.py` (second net deposit £695.00, ref `MC-PAYOUT-2107`).
- Frontend: ApprovalDrawer checklist renders 4 items when plan has 4 steps; StepProgress `totalSteps` = plan length (not hardcoded 3); refund row shown in payout summary when `refunds != "0.00"`.
- API: `POST /propose` may return 4 steps; `POST /approve` results array length matches; `credit_note_id` in status/existing_ids when present.

## E2 — Attach source CSV to the invoice (raw REST)

**What.** After write 1 succeeds, upload the original CSV bytes to the created invoice via the Accounting API Attachments endpoint (the MCP wrapper does not expose attachments — this is a deliberate beyond-MCP REST call, TOOLING.md §1.8).

```
PUT https://api.xero.com/api.xro/2.0/Invoices/{InvoiceID}/Attachments/{FileName}
Content-Type: text/csv        body: raw file bytes
```

- Auth: same client-credentials token; scope `accounting.attachments`.
- Failure is **non-fatal**: log to audit as `attach-source: failed`, never block the golden path.
- Backend: `xero_client.py` gains `attach_file(invoice_id, filename, content)` using direct `httpx` call (token minted from existing env creds); called from `main.py` after step 1; audit entry `attach-source`.
- API: `POST /approve` response gains optional `"attachment": {"invoice_id": ..., "filename": ..., "status": "success" | "failed"}`.
- Frontend: AuditTrail shows the `attach-source` row; InvoiceDetails shows a paperclip badge "Source CSV attached".
- Judge line: *"the original statement lives on the Xero invoice — open Xero and see it."*

## E3 — Channel tracking category

**What.** Seed creates tracking category **"Channel"** with option **"MarketplaceCo"** (`create-tracking-category` + `create-tracking-options`). Every write's line items carry `tracking: [{name: "Channel", option: "MarketplaceCo"}]`. P&L becomes filterable per sales channel in Xero.

- Backend: `seed.py` (idempotent category creation), `xero_client.py` (tracking param on invoice/bank-txn/credit-note lines), `config.py` (`TRACKING_CATEGORY = "Channel"`).
- Frontend: channel chip "MarketplaceCo" in ApprovalDrawer summary; dashboard fee pie gets per-channel framing.
- Xero cap warning: max 2 active tracking categories per org — seed must check-before-create.
- Persona tie: Priya (bookkeeper) sees per-client/per-channel books.

## E4 — Live dashboard reads (`GET /dashboard`)

**What.** New backend endpoint aggregating three MCP reads so the frontend dashboard shows **real Demo Company data** instead of hardcoded numbers:

```
GET /dashboard  →  200
{
  "trial_balance":   { "clearing": "0.00", "fees_expense": "493.00", "revenue": "1340.00" },
  "aged_receivables": [ { "contact": "MarketplaceCo (Marketplace)", "outstanding": "0.00" } ],
  "balance_sheet":   { "bank": "...", "current_assets": "..." },
  "recent_payouts":  [ ...from state/posted.json + audit.json... ],
  "fetched_at": "2026-07-05T00:00:00Z"
}
```

- Reads: `list-trial-balance`, `list-aged-receivables-by-contact`, `list-report-balance-sheet` (all MCP, cached 60s in-process — never live-loop, rate-limit rule).
- 404/degraded → frontend falls back to illustrative figures WITH the "illustrative" footer; live data removes the footer and shows "Live from Xero · fetched HH:MM".
- Frontend: dashboard KPI cards + activity feed consume `/dashboard`; hardcoded Amazon/Etsy strings die (constraint: MarketplaceCo brand only).

## E5 — VAT-rate check in assistant (`list-tax-rates`)

**What.** The chat assistant (spec `10`) answers "is VAT handled right?" with a **real** `list-tax-rates` read: confirms the org's rates and that golden-path lines post NONE/zero-VAT — consistent with the VAT-free-by-design demo. Scripted response template, real data interpolated.

- Backend: `GET /vat-check` → `{ "org_rates": [...], "golden_path_tax_type": "NONE", "consistent": true }`.
- Frontend: Chatbot canned Q&A list gains "Check my VAT" entry that calls `/vat-check` (mock fallback in mock mode).
- Guardrail (spec 10 §6 applies): *flag, never advise.* Wording: "Rates on file: 20% Standard, 0% Zero, No VAT. This payout posted VAT-free — consistent. Ask your accountant to confirm treatment."

## E6 — History note on every created object (raw REST)

**What.** After each successful write, `PUT /api.xro/2.0/{Endpoint}/{Guid}/History` with `{"Details": "Posted by PayoutBridge from MC-PAYOUT-0407 row-set sha256:<8-char>"}`. Visible in Xero UI history panel of the invoice / bank transaction / credit note / payment.

- Backend: `xero_client.py` `add_history_note(endpoint, guid, note)` — same httpx path as E2; non-fatal on failure; audit rows `history-note`.
- Frontend: no UI change required (visible inside Xero); AuditTrail shows the rows.
- Judge line: *"every object self-documents its provenance inside Xero."*

## E7 — Webhooks **[DEFERRED — roadmap only]**

Needs public callback URL live on demo day; unacceptable risk. Mentioned in `09` roadmap table only. No code.

---

## P — Three-persona entry system

Personas from `09` §1.2: **Sam (owner)**, **Priya (bookkeeper)**, **Alex (freelancer)**. Decision: **3 doors, 1 room** — one shared app, persona-tinted; no separate per-persona builds (UC-R4 multi-client stays roadmap).

### P1 — Landing page: 3 persona cards
"I run the business" / "I keep the books" / "I work for myself" — pain + value copy from `09` §2 table. Card click → sign-up with persona pre-selected.

### P2 — Persona stored with demo auth
`localStorage` auth record becomes `{ name, persona: "owner" | "bookkeeper" | "freelancer" }`. Sign-up dialog gains the 3-way choice (default: owner).

### P3 — Persona switcher in navbar
Dropdown to re-tint live (judges see all 3 views in 90s). Switching persona never changes data — only emphasis.

### P4 — Persona tinting map

| Surface | Owner (Sam) | Bookkeeper (Priya) | Freelancer (Alex) |
|---|---|---|---|
| Dashboard KPI order | Real turnover first | Clearing balance + audit count first | "Income for Self Assessment" first |
| Dashboard greeting | "Your real turnover" | "Client books status" | "Your income, correctly" |
| /app emphasis | P&L before/after auto-expanded | AuditTrail auto-expanded | Simplest copy, jargon-free |
| Checklist copy | "What Xero will do" | "Writes with Xero IDs" | "What we'll record" |
| Chat suggested prompts | "What did the platform take?" | "Show me the audit trail" | "Is my income right for taxes?" |

### P5 — Implementation status + persona requirement backlog (audited 2026-07-05)

Of the P4 map, only four branches are actually implemented: KPI #1 **label** (freelancer only — order never changes), checklist heading, AuditTrail default-open (bookkeeper), and chat prompt set/order. Dashboard KPI *order*, greeting tinting, and P&L auto-expand (owner) are **spec-only**. Known bug: the Log-in flow hard-codes persona `"owner"` (`Navbar.tsx:282`); only Sign-up honors the door choice.

The full per-persona journey spec, dashboard gap analysis, and requirement backlog (`GEN-1..4`, `SAM-1..6`, `PRI-1..6`, `ALX-1..6`) live in [`09-USE-CASES-AND-PERSONAS.md`](09-USE-CASES-AND-PERSONAS.md) **§7** — that section is the source of truth for persona build work; this table stays the quick-reference tint map.

---

## Rate-limit budget (all features, worst case refund file)

| Call | Count |
|---|---|
| Golden-path writes (E1: 4) | 4 |
| Attachment PUT (E2) | 1 |
| History notes (E6) | 4 |
| Verification read + P&L | 2 |
| Dashboard reads (E4, cached) | 3 |
| VAT read (E5) | 1 |
| **Total worst case** | **15 / 60-per-min** ✓ |

## Scope additions to OAuth (delta vs `01` §8.1)

- `accounting.attachments` (E2)
- credit notes already covered by `accounting.transactions` / granular `accounting.invoices`
- reports covered by `accounting.reports.read` (or granular `trialbalance`, `balancesheet` reads)

## Doc sync map (done in this change-set)

| Doc | Change |
|---|---|
| `01` §8.1, §10 | scopes delta; out-of-scope list: refunds/tracking removed, pointer here |
| `03` | new step kind, `/dashboard`, `/vat-check`, attachment field |
| `09` | UC-R3 → [Supported]; persona entry-point note; UC-4 note (E2/E6) |
| `10` | §3 flow: VAT answer backed by `list-tax-rates` via `/vat-check` |
| `12-ENDPOINTS-AND-SCOPES.md` | full inventory (submission form requires) |
| `02`, `04`, `07`, `08` | implementation/test detail pointers (kept lean; this doc is the source) |
