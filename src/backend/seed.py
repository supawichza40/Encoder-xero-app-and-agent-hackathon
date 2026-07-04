"""
Idempotent seed script for the Xero Demo Company.

Sets up everything the golden path needs, then captures the BEFORE P&L
snapshot. Safe to run multiple times — re-run creates nothing new.

What it creates (once):
  1. Account: Platform Clearing (code 810, BANK type, enable payments)
  2. Account: Platform Commission & Fees (code 418, expense)
  3. Contact: MarketplaceCo (Marketplace)
  4. RECEIVE bank transaction: £847.00 into Platform Clearing, ref MC-PAYOUT-0407
  5. P&L BEFORE snapshot → state/pnl-before.json

Usage:
  python -m backend.seed          # standalone run
  await seed_demo_company(client) # called from main.py /seed endpoint
"""

import asyncio
import json
import logging
import sys
from decimal import Decimal
from pathlib import Path

logger = logging.getLogger(__name__)


async def seed_demo_company(client: "XeroClient") -> dict:  # type: ignore[name-defined]
    """
    Idempotent seed. Returns a summary dict of what was created/found.
    """
    from .config import (
        CLEARING_ACCOUNT_CODE,
        CLEARING_ACCOUNT_NAME,
        FEES_ACCOUNT_CODE,
        FEES_ACCOUNT_NAME,
        CONTACT_NAME,
        PAYOUT_REFERENCE,
        NET_DEPOSIT_AMOUNT,
        STATE_DIR,
    )

    summary: dict = {
        "clearing_account": None,
        "fees_account": None,
        "contact_id": None,
        "receive_txn_id": None,
        "pnl_before_captured": False,
        "warnings": [],
    }

    # ── 1. Check / create Platform Clearing account ──────────────────────
    logger.info("Checking Platform Clearing account (code %s)…", CLEARING_ACCOUNT_CODE)
    clearing_id = await client.find_or_create_account(
        name=CLEARING_ACCOUNT_NAME,
        code=CLEARING_ACCOUNT_CODE,
        account_type="BANK",
    )
    summary["clearing_account"] = clearing_id
    if clearing_id == CLEARING_ACCOUNT_CODE:
        summary["warnings"].append(
            f"Platform Clearing (code {CLEARING_ACCOUNT_CODE}) not found. "
            "Create it in Xero UI → Settings → Chart of Accounts → Add Account "
            "(Type: Bank, Code: 810, Name: Platform Clearing, enable payments)."
        )

    # ── 2. Check / create Platform Commission & Fees account ─────────────
    logger.info("Checking Platform Commission & Fees account (code %s)…", FEES_ACCOUNT_CODE)
    fees_id = await client.find_or_create_account(
        name=FEES_ACCOUNT_NAME,
        code=FEES_ACCOUNT_CODE,
        account_type="EXPENSE",
    )
    summary["fees_account"] = fees_id
    if fees_id == FEES_ACCOUNT_CODE:
        summary["warnings"].append(
            f"Platform Commission & Fees (code {FEES_ACCOUNT_CODE}) not found. "
            "Create it in Xero UI (Type: Expense, Code: 418, Name: Platform Commission & Fees)."
        )

    # ── 3. Check / create MarketplaceCo contact ───────────────────────────
    logger.info("Checking contact '%s'…", CONTACT_NAME)
    contact_id = await client.create_contact(CONTACT_NAME)
    summary["contact_id"] = contact_id

    # ── 4. Check / create RECEIVE bank transaction ────────────────────────
    logger.info("Checking for seeded RECEIVE bank transaction (ref %s)…", PAYOUT_REFERENCE)
    existing_txns = await client.list_bank_transactions()
    seeded_txn_id: str | None = None
    for txn in existing_txns:
        ref = txn.get("Reference") or txn.get("reference") or ""
        txn_type = txn.get("Type") or txn.get("type") or ""
        bank_code = (
            (txn.get("BankAccount") or txn.get("bankAccount") or {}).get("Code")
            or (txn.get("BankAccount") or txn.get("bankAccount") or {}).get("code")
            or ""
        )
        if ref == PAYOUT_REFERENCE and txn_type == "RECEIVE" and str(bank_code) == CLEARING_ACCOUNT_CODE:
            seeded_txn_id = (
                txn.get("BankTransactionID")
                or txn.get("bankTransactionID")
                or txn.get("id")
                or "FOUND"
            )
            logger.info("Seeded RECEIVE transaction already exists: %s", seeded_txn_id)
            break

    if not seeded_txn_id:
        logger.info(
            "Creating seeded RECEIVE £%s in Platform Clearing…", NET_DEPOSIT_AMOUNT
        )
        seeded_txn_id = await client.create_receive_transaction(
            amount=Decimal(NET_DEPOSIT_AMOUNT),
            reference=PAYOUT_REFERENCE,
            account_code=CLEARING_ACCOUNT_CODE,
            contact_name=CONTACT_NAME,
        )
        logger.info("Created seeded RECEIVE transaction: %s", seeded_txn_id)

    summary["receive_txn_id"] = seeded_txn_id

    # ── 5. Capture BEFORE P&L snapshot ───────────────────────────────────
    pnl_before_path = Path(STATE_DIR) / "pnl-before.json"
    if pnl_before_path.exists() and pnl_before_path.stat().st_size > 2:
        logger.info("pnl-before.json already exists — skipping recapture")
        summary["pnl_before_captured"] = True
    else:
        logger.info("Capturing BEFORE P&L snapshot…")
        try:
            raw_pnl = await client.list_profit_and_loss()
            snapshot = client.extract_pnl_snapshot(raw_pnl)
            pnl_before_path.parent.mkdir(parents=True, exist_ok=True)
            pnl_before_path.write_text(
                json.dumps(snapshot, indent=2), encoding="utf-8"
            )
            summary["pnl_before_captured"] = True
            logger.info("BEFORE P&L snapshot saved: revenue=%s", snapshot.get("revenue"))
        except Exception as exc:
            logger.warning("Failed to capture BEFORE P&L: %s", exc)
            summary["warnings"].append(f"BEFORE P&L capture failed: {exc}")

    return summary


if __name__ == "__main__":
    import logging as _logging
    _logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    async def _run() -> None:
        from .xero_client import XeroClient
        from .config import require_xero_creds

        try:
            require_xero_creds()
        except RuntimeError as e:
            print(f"ERROR: {e}")
            sys.exit(1)

        client = XeroClient()
        await client.connect()
        try:
            result = await seed_demo_company(client)
            print("\n=== Seed complete ===")
            for key, val in result.items():
                if key == "warnings":
                    if val:
                        print("\n⚠  SETUP REQUIRED:")
                        for w in val:
                            print(f"   {w}")
                else:
                    print(f"  {key}: {val}")
        finally:
            await client.disconnect()

    asyncio.run(_run())
