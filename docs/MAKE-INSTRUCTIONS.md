# Make Integration — Instructions

**PayoutBridge × Make (hackathon partner prize)**  
**Time estimate:** ~45 minutes  
**Status:** Blueprint and backend hook are in the repo — **no backend code to write**. You configure Make in the browser.

---

## What this does

When a marketplace payout CSV arrives by email, Make automatically:

1. Detects the email and attachment
2. Sends the CSV to PayoutBridge (`POST /propose`)
3. Sends you a Slack (or email) approval card with a link to the UI

**Make never calls `/approve`.** All Xero writes stay inside the PayoutBridge backend. A human always clicks Approve in the React UI.

```
Gmail (CSV attachment)
  → Make: Gmail Watch
  → Make: HTTP POST /propose
  → Make: filter (new vs already-posted)
  → Make: Slack approval card
  → Human: opens UI → Approve
  → Backend: 3 Xero writes (invoice → bank txn → payment)
```

---

## What's already built (you don't code this)

| Item | Location |
|---|---|
| Make scenario blueprint (7 modules) | `src/make/scenario.json` |
| Backend `/propose` endpoint (multipart CSV upload) | `src/backend/main.py` |
| CORS env var for ngrok / Make | `CORS_ALLOW_ORIGINS` in `.env` |
| Golden demo CSV | `src/data/marketplaceco-payout-0407.csv` |

---

## Before you start — prerequisites

Check these off first:

- [ ] **Backend running** on port 8000 with Xero credentials in `.env`
- [ ] **Demo Company seeded** — run `POST /seed` or use the rehearsal script
- [ ] **Make account** — sign up at [make.com](https://make.com) (free tier: 1,000 ops, 2 scenarios)
- [ ] **ngrok installed** — [ngrok.com/download](https://ngrok.com/download) (Make's cloud can't reach `localhost`)
- [ ] **Gmail account** — for the watch trigger
- [ ] **Slack workspace** (optional) — or use Gmail Send Email instead of Slack in Module 7
- [ ] **Frontend running** (optional but recommended) — so the approval link in Slack opens the Approval Drawer

> **Not blocking:** If Make isn't ready by demo time, the core demo still works via manual CSV upload. Make is a bonus / partner prize surface.

---

## Step 1 — Start the backend and expose it publicly

### 1a. Start the backend

```bash
cd src/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Confirm locally:

```bash
curl http://localhost:8000/health
# → {"status":"ok","xero_connected":true,...}
```

### 1b. Open CORS for Make / ngrok

Add to your `.env` file (repo root):

```env
CORS_ALLOW_ORIGINS=*
```

Restart the backend after saving.

### 1c. Start ngrok

In a **second terminal**:

```bash
ngrok http 8000
```

Copy the **https** URL from the output, e.g.:

```
https://abc123.ngrok-free.app
```

Verify the tunnel works:

```bash
curl https://abc123.ngrok-free.app/health
# → {"status":"ok",...}
```

Write your URLs here before continuing:

| Variable | Your value |
|---|---|
| `BACKEND_URL` | `https://_____________.ngrok-free.app` |
| `APPROVAL_UI_URL` | `http://localhost:5173` (or your Lovable URL) |

---

## Step 2 — Import the Make scenario

1. Go to [make.com](https://make.com) and sign in
2. Click **Scenarios** → **Create a new scenario**
3. Click the **⋯** menu (top right) → **Import blueprint**
4. Upload: **`src/make/scenario.json`** from this repo
5. The 7-module canvas appears — continue to Step 3

---

## Step 3 — Configure each module

### Module 1 — Gmail: Watch emails

| Setting | Value |
|---|---|
| Connection | Click **Add** → sign in with Google (OAuth) |
| Search criteria | `subject:"Treatwell Sales Proceeds" has:attachment` |
| Folder | `INBOX` |
| Max results | `1` |
| Mark as read | Off (optional) |

### Modules 2–4 — Attachments + CSV filter

These are pre-wired in the blueprint. Open each module and confirm:

- **Module 2** maps `messageId` from Module 1
- **Module 3** iterates over `attachments`
- **Module 4** filters: filename ends with `.csv`

No changes needed unless your CSV uses a different filename pattern.

### Module 5 — HTTP: POST /propose

| Setting | Value |
|---|---|
| URL | `{{BACKEND_URL}}/propose` — e.g. `https://abc123.ngrok-free.app/propose` |
| Method | `POST` |
| Body type | `Multipart/form-data` |
| Field name | `file` |
| Field value | attachment data from Module 3 |
| Filename | `{{3.filename}}` |
| MIME type | `text/csv` |
| Parse response | ✅ On |
| Timeout | `30` seconds |

> The field name **must** be `file` — that matches the FastAPI parameter in `main.py`.

### Module 6 — Filter: new payouts only

Pre-configured: continues only when `status == "new"`.

If the same file was already processed, the backend returns `status: "already-posted"` and Make **stops here** — no duplicate Slack message. This is intentional idempotency.

### Module 7 — Slack: Send approval card

| Setting | Value |
|---|---|
| Connection | Click **Add** → sign in with Slack (OAuth) |
| Channel | `#payouts` (or any channel you have access to) |
| Message | See template below |

**Message template** (replace the placeholder URL):

```
:bank: *New payout ready for approval*

>*Gross:* £{{5.data.payout.gross}}
>*Net:* £{{5.data.payout.net}}
>*Reference:* {{5.data.payout.payout_ref}}
>*Period:* {{5.data.payout.period}}

:white_check_mark: <{{APPROVAL_UI_URL}}/?hash={{5.data.file_hash}}|Review & Approve in PayoutBridge>

_File hash: {{5.data.file_hash}}_
```

Example with real values:

```
http://localhost:5173/?hash=abc123def456...
```

#### No Slack? Use Gmail instead

Delete Module 7 and add **Gmail → Send an email**:

- **To:** your own address
- **Subject:** `PayoutBridge: new payout £{{5.data.payout.gross}} ready for approval`
- **Body:** same text as the Slack message above

---

## Step 4 — Test the scenario

### 4a. Send a test email

Email yourself (or the watched inbox) with:

| Field | Value |
|---|---|
| **Subject** | `Treatwell Sales Proceeds` |
| **Attachment** | `src/data/marketplaceco-payout-0407.csv` |

### 4b. Run once in Make

1. In Make, click **Run once** (bottom-left of the scenario canvas)
2. Watch each module light up with a green tick and a `1` bubble
3. Check Slack (or your inbox) for the approval card

**Expected Slack card:**

- Gross: **£1,340.00**
- Net: **£847.00**
- Reference: **MC-PAYOUT-0407**
- A working link to the Approval Drawer

### 4c. Test idempotency

Send the **same email again** (same CSV attachment) and run once.

**Expected:** Module 6 stops the scenario. **No second Slack card.** The backend returns `already-posted`.

---

## Step 5 — Screenshots for the demo deck

Capture these before submission:

| # | Screenshot | What to show |
|---|---|---|
| 1 | **Make scenario canvas** | All 7 modules connected, green ticks after a successful run |
| 2 | **Slack approval card** | £1,340.00 gross, approval link visible |
| 3 | **Idempotency** (optional) | Module 6 filter stopping on second run — no duplicate card |

**Pitch line (5 seconds):** *"Payout statements arrive by email — Make catches them, PayoutBridge parses and plans, and the bookkeeper gets one click to approve."*

| Talking point | What it shows |
|---|---|
| **Email-to-approval** | Payout lands in Gmail → Make catches it → zero manual upload |
| **Idempotency** | Re-run the same email → no duplicate card. Backend handles it; Make stops at Module 6 |
| **Human-in-the-loop** | Make never calls `/approve`. The human always has the final click |
| **Make never touches Xero** | All 3 Xero writes stay inside PayoutBridge. Make owns ingestion + notification only |

---

## Acceptance checklist

Use this to confirm the integration is complete:

- [ ] Scenario triggers on inbound email with a CSV attachment
- [ ] `POST /propose` succeeds with the CSV as multipart
- [ ] Router branches correctly: `new` → Slack card; `already-posted` → no card
- [ ] Slack/email card shows gross **£1,340.00** and a link to the Approval Drawer
- [ ] Re-sending the same file produces **no second card**
- [ ] Make performs **zero Xero writes** and **never calls `/approve`**

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Module 5 returns connection error | ngrok not running, or URL wrong — re-check `BACKEND_URL` |
| Module 5 returns 400 | Attachment isn't a `.csv`, or field name isn't `file` |
| Module 5 returns 422 | CSV amounts tampered — use the golden file unchanged |
| Module 5 returns 503 | Backend can't reach Xero — check `.env` creds and restart |
| No Slack message but Module 5 is green | Check Module 6 filter — response may be `already-posted` from a prior run. Reset `state/posted.json` and retry |
| Approval link goes nowhere | Frontend not running — start with `cd src/frontend && npm run dev` |
| ngrok URL changed | ngrok free tier gives a new URL each restart — update Module 5 URL |

---

## What Make does NOT do

| Action | Who owns it |
|---|---|
| Parse CSV | PayoutBridge backend (`parser.py`) |
| Build 3-write plan | PayoutBridge backend (`planner.py`) |
| Call `/approve` | **Never Make** — human in React UI only |
| Write to Xero | PayoutBridge backend via MCP |
| Verify clearing = £0.00 | PayoutBridge backend |

Make owns **ingestion + notification only**.

---

## Quick reference

| File / setting | Purpose |
|---|---|
| `src/make/scenario.json` | Import this into Make |
| `.env` → `CORS_ALLOW_ORIGINS=*` | Allow ngrok traffic |
| `.env` → `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` | Backend Xero connection |
| `src/data/marketplaceco-payout-0407.csv` | Golden test attachment |
| `docs/specs/03-API-SPEC.md` §7 | API contract for Make |
| `BUILD.md` §8.2 | Original partner prize brief |

---

## Related docs

- [SETUP.md](./SETUP.md) — Xero app and Demo Company setup
- [07-BACKEND-TEST-PLAN.md](./specs/07-BACKEND-TEST-PLAN.md) — backend test suite (no Make needed)
- [BUILD.md](../BUILD.md) §8.2 — original partner prize brief
