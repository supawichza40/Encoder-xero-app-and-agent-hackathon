# Make Integration — Setup Guide

PayoutBridge uses **Make** (the hackathon partner) for automated ingestion:

> Gmail/Drive detects a new payout CSV → Make POSTs it to `/propose` → PayoutBridge parses and plans → Make sends a Slack/email approval card → human approves in the React UI.

**Make never calls `/approve`.** Every Xero write stays inside the backend (human-in-the-loop).

---

## Architecture

```
Gmail (new email with CSV attachment)
  │
  ▼
Make — Module 1: Gmail Watch
  │  criteria: subject:"Treatwell Sales Proceeds" has:attachment
  │
  ▼
Make — Module 2+3: Get & iterate attachments
  │
  ▼
Make — Module 4: Filter (CSV only)
  │
  ▼
Make — Module 5: HTTP POST /propose (multipart/form-data)
  │  body: file = <csv attachment>
  │
  ▼  response: { status, file_hash, payout: { gross, net, … } }
  │
  ▼
Make — Module 6: Router / Filter
  │  status == "new"           → continue
  │  status == "already-posted" → STOP (idempotency, no duplicate card)
  │
  ▼
Make — Module 7: Slack message
       "New payout £1,340 from MarketplaceCo — Review & Approve [link]"
```

---

## Step-by-step setup (~45 minutes)

### 1. Expose the backend publicly (ngrok)

Make's HTTP module runs from Make's cloud — it can't reach `localhost`.
Use ngrok (or any tunnel) during the demo:

```bash
# Install: https://ngrok.com/download
ngrok http 8000
# Copy the https URL, e.g. https://abc123.ngrok.io
```

### 2. Allow Make's traffic through CORS

In your `.env` file:

```
CORS_ALLOW_ORIGINS=*
```

Restart the backend:

```bash
cd src/backend
uvicorn main:app --reload --port 8000
```

Verify: `curl https://abc123.ngrok.io/health` should return `{"status":"ok", ...}`.

### 3. Import the scenario blueprint

1. Sign in to [make.com](https://make.com)
2. **Scenarios → Create a new scenario → Import blueprint**
3. Upload `src/make/scenario.json` from this repo
4. The 7-module canvas appears — proceed to configure each connection below

### 4. Module 1 — Gmail Watch

- **Connection**: connect your Gmail account (OAuth prompt)
- **Search criteria**: `subject:"Treatwell Sales Proceeds" has:attachment`
- **Label**: `INBOX`
- **Max results**: `1`

> For the demo: send yourself a test email with `marketplaceco-payout-0407.csv` attached and the subject "Treatwell Sales Proceeds".

### 5. Module 5 — HTTP POST /propose

- **URL**: replace `{{YOUR_BACKEND_URL}}` with your ngrok URL, e.g.
  `https://abc123.ngrok.io/propose`
- **Method**: `POST`
- **Body type**: `Multipart/Form-Data`
- **Field name**: `file` (must match FastAPI parameter name)
- **Parse response**: ✅ enabled

### 6. Module 7 — Slack notification

- **Connection**: connect your Slack workspace (OAuth prompt)
- **Channel**: `#payouts` (or any channel you want)
- **Message text** (already pre-filled in the blueprint):
  ```
  :bank: *New payout ready for approval*
  Gross: £{{5.data.payout.gross}}
  Net:   £{{5.data.payout.net}}
  Ref:   {{5.data.payout.payout_ref}}

  Review & Approve: {{YOUR_APPROVAL_DRAWER_URL}}?hash={{5.data.file_hash}}
  ```
- Replace `{{YOUR_APPROVAL_DRAWER_URL}}` with your React app URL
  (e.g. `http://localhost:5173` for the demo)

> **No Slack?** Replace module 7 with a **Gmail: Send Email** module instead.
> Send to your own address with the same text as the message body.

### 7. Test run

1. Click **Run once** (top-left of the scenario canvas)
2. Send yourself the test email with the golden CSV attached
3. Watch the bubble counts light up on each module
4. Confirm the Slack card arrives with `£1,340.00` gross and the approval link
5. Re-send the same email → scenario stops at Module 6 (already-posted) — no second card ✅

### 8. Screenshot for the demo deck

Capture two screenshots for the submission:

| Screenshot | What to show |
|---|---|
| **Scenario canvas** | All 7 modules connected with green tick marks |
| **Slack card** | The approval card with £1,340.00 and the approval link |

---

## Key selling points for the pitch

| Point | What it shows |
|---|---|
| **Email-to-approval** | Payout lands in Gmail → Make catches it → zero manual upload |
| **Idempotency** | Re-run the same email → no duplicate card. The backend handles it, Make just stops. |
| **Human-in-the-loop** | Make never calls `/approve`. The human always has the final click. |
| **Make never touches Xero** | All 3 Xero writes stay inside PayoutBridge. Make owns only ingestion + notification. |

---

## Quick reference — tokens / IDs needed

| Value | Where to find it |
|---|---|
| ngrok URL | Terminal output after `ngrok http 8000` |
| Gmail OAuth | Prompted by Make when you click the connection in Module 1 |
| Slack OAuth | Prompted by Make when you click the connection in Module 7 |
| Approval Drawer URL | `http://localhost:5173` (or your deployed Lovable URL) |
