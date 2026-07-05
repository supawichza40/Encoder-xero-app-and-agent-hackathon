# PayoutBridge — Pitch Script

Spoken script for `docs/deck/PayoutBridge.pptx` (8 slides, ~5 minutes).
The same text is embedded in each slide's speaker notes.

## Slide 1 — Title — PayoutBridge (~20s)

Your bank feed has been lying about your turnover. Every salon, tutor, and seller that gets paid through a marketplace has this problem, and most of them do not know it yet. We are PayoutBridge. We fix it inside Xero, with a human approving every entry. Let me show you what the lie looks like.

## Slide 2 — The problem — £1,340 earned, Xero saw £847 (~45s)

Here is a settlement statement from our demo marketplace, MarketplaceCo. Customers paid one thousand three hundred and forty pounds. The platform kept four hundred and forty-five ninety in commission and forty-seven ten in fees, then wired eight hundred and forty-seven pounds to the bank. Xero's bank feed sees one line: 847. So the books say revenue was 847. That means four hundred and ninety-three pounds of turnover, thirty-seven percent of it, is invisible. The commission expense never appears, the VAT position is wrong from day one, and every report downstream inherits the error. Today the fix is a bookkeeper reverse-engineering each statement by hand, line by line, for every client, every payout period.

## Slide 3 — What PayoutBridge is (~45s)

PayoutBridge is a Xero-native agent that turns that statement into correct books. You drop in the CSV. It parses it deterministically, a hardcoded column map, no LLM guessing at your money. It proposes a three-write clearing-account gross-up in plain English. Nothing touches Xero until a human clicks Approve. And the whole thing is built around one invariant: gross minus commission minus fees minus refunds must equal net. Thirteen forty minus four forty-five ninety minus forty-seven ten equals eight forty-seven. If a statement fails that check, the planner refuses to propose. The agent is structurally unable to post books that do not add up.

## Slide 4 — Live demo — the golden path (~60s)

Here is the live flow. I drag the CSV in. PayoutBridge hashes the file first; upload the same statement twice and it skips, so you can never double-post. It shows me exactly what it will do: invoice one thousand three hundred and forty pounds of gross revenue into a Platform Clearing account, book four hundred and ninety-three pounds of commission and fees out of it, then clear eight forty-seven against the bank deposit already sitting in Xero. I click Approve. Three writes, live progress, each one audit-logged with the Xero ID it came back with. Then the payoff: PayoutBridge reads the clearing balance back from Xero. Zero pounds, zero pence. The three entries offset exactly. The P&L before-and-after shows revenue corrected from 847 to 1,340, with 493 of expenses now visible. Under a minute, end to end. If it crashes after write one, it resumes at write two; idempotency is per step.

## Slide 5 — Architecture (~35s)

One pass over how it works. The React frontend calls a FastAPI backend. Propose parses and plans; nothing is written. Approve executes the plan step by step through the official Xero MCP server: create-invoice, create-bank-transaction, create-payment, with per-step idempotency, so a crash after write one resumes at write two instead of double-posting. Then a verification read confirms Platform Clearing is at exactly zero. The plan is deterministic, the writes are ordered, and the proof comes from Xero itself, not from us.

## Slide 6 — How we built it (~35s)

This was one overnight session: 74 commits across roughly 28 hours, four builders. Claude Code ran the planning and most of the implementation against eight written specs; VS Code was the editor for the whole build. Lovable generated the React frontend, which we run with Bun. The backend is FastAPI talking to Xero through the official Xero MCP server, and a Make scenario feeds statements straight into the propose endpoint for email ingestion. We finished with 104 backend tests green, including a fix for a bug where verification could silently pass when it should not have.

## Slide 7 — Xero API usage (~40s)

On the Xero side. We use the official Xero MCP server for everything it covers: the three golden-path writes, credit notes for the refund path, contact and tracking setup, and report reads for P&L, trial balance, balance sheet, and aged receivables. Two operations MCP does not expose, attachments and history notes, we call over raw REST, which is how the source CSV ends up attached to the very invoice it produced. Auth is a client-credentials Custom Connection against the Demo Company, six OAuth scopes. The golden path costs at most ten API calls; the worst case with refunds and every feature on is fifteen, against a sixty-per-minute limit.

## Slide 8 — Impact + ask (~35s)

What this means in practice: real turnover on the books, fee visibility, and a VAT trail that is right from day one, plus a full audit trail from CSV row to Xero ID. Sellers get correct accounts. Bookkeepers stop reverse-engineering statements. And because every marketplace pays out on the same gross-minus-fees-equals-net shape, one deterministic pattern covers them all. Our ask: help us take PayoutBridge from the Demo Company to a certified Xero app. Try it yourself, upload a statement and watch the clearing account hit zero. Thank you.
