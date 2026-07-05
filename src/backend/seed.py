"""
Idempotent seed script for the Xero Demo Company.

Sets up everything the golden path needs, then captures the BEFORE P&L snapshot.
Safe to run multiple times — re-run creates nothing new.

What it creates (once each):
  1. Account: Platform Clearing (code 092, real BANK account, via raw REST)
  2. Account: fees expense — reuses the Demo Company's "Bank Fees" (404)
  3. Contact: MarketplaceCo (Marketplace)
  4. Bank transfer: £847.00 Platform Clearing → Business Bank (the net payout
     deposit landing in the bank; Dr Bank / Cr Clearing, so Clearing opens −847
     and the 3 golden-path writes close it to exactly £0.00)
  5. [optional, SEED_REFUND_DEPOSIT=true] £695.00 transfer for the refund CSV.
     Off by default: pre-seeding it would leave Clearing at −695 after the
     golden path and break the zero-balance verification.                    [E1]
  6. Tracking category "Channel" + option "MarketplaceCo"                    [E3]
  7. P&L BEFORE snapshot → state/pnl-before.json

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
        BANK_ACCOUNT_CODE,
        CLEARING_ACCOUNT_CODE,
        CLEARING_ACCOUNT_NAME,
        CLEARING_BANK_ACCOUNT_NUMBER,
        FEES_ACCOUNT_CODE,
        FEES_ACCOUNT_NAME,
        CONTACT_NAME,
        NET_DEPOSIT_AMOUNT,
        REFUND_NET_DEPOSIT_AMOUNT,
        SEED_REFUND_DEPOSIT,
        TRACKING_CATEGORY,
        TRACKING_OPTION,
        STATE_DIR,
    )

    summary: dict = {
        "clearing_account": None,
        "fees_account": None,
        "contact_id": None,
        "net_transfer_id": None,
        "refund_net_transfer_id": None,
        "tracking_category": None,
        "pnl_before_captured": False,
        "warnings": [],
    }

    # ── 1. Check / create Platform Clearing account (real BANK account) ──
    logger.info("Checking Platform Clearing account (code %s)…", CLEARING_ACCOUNT_CODE)
    summary["clearing_account"] = await client.find_or_create_account(
        name=CLEARING_ACCOUNT_NAME,
        code=CLEARING_ACCOUNT_CODE,
        account_type="BANK",
        bank_account_number=CLEARING_BANK_ACCOUNT_NUMBER,
    )

    # ── 2. Check / create fees expense account (reuses Demo "Bank Fees") ─
    logger.info("Checking fees expense account (code %s)…", FEES_ACCOUNT_CODE)
    summary["fees_account"] = await client.find_or_create_account(
        name=FEES_ACCOUNT_NAME,
        code=FEES_ACCOUNT_CODE,
        account_type="EXPENSE",
    )

    # ── 3. Check / create MarketplaceCo contact ───────────────────────────
    logger.info("Checking contact '%s'…", CONTACT_NAME)
    contact_id = await client.create_contact(CONTACT_NAME)
    summary["contact_id"] = contact_id

    # ── 4. Seed net deposit — bank transfer Clearing → Business Bank ─────
    # Dr Business Bank £847 / Cr Platform Clearing £847: the marketplace's net
    # payout landing in the real bank. Clearing opens at −847 so the golden
    # path (+gross via payment, −fees via SPEND) closes it to exactly £0.00.
    logger.info("Checking for seeded net-deposit transfer (£%s)…", NET_DEPOSIT_AMOUNT)
    summary["net_transfer_id"] = await client.find_bank_transfer(
        CLEARING_ACCOUNT_CODE, BANK_ACCOUNT_CODE, Decimal(NET_DEPOSIT_AMOUNT)
    )
    if not summary["net_transfer_id"]:
        summary["net_transfer_id"] = await client.create_bank_transfer(
            CLEARING_ACCOUNT_CODE, BANK_ACCOUNT_CODE, Decimal(NET_DEPOSIT_AMOUNT)
        )
        logger.info("Created net-deposit transfer: %s", summary["net_transfer_id"])
    else:
        logger.info("Net-deposit transfer already exists: %s", summary["net_transfer_id"])

    # ── 5. Refund-path deposit £695 — opt-in only [E1] ────────────────────
    if SEED_REFUND_DEPOSIT:
        summary["refund_net_transfer_id"] = await client.find_bank_transfer(
            CLEARING_ACCOUNT_CODE, BANK_ACCOUNT_CODE, Decimal(REFUND_NET_DEPOSIT_AMOUNT)
        )
        if not summary["refund_net_transfer_id"]:
            summary["refund_net_transfer_id"] = await client.create_bank_transfer(
                CLEARING_ACCOUNT_CODE, BANK_ACCOUNT_CODE, Decimal(REFUND_NET_DEPOSIT_AMOUNT)
            )
            logger.info(
                "Created refund net-deposit transfer: %s", summary["refund_net_transfer_id"]
            )
    else:
        logger.info(
            "Refund deposit not seeded (SEED_REFUND_DEPOSIT=false) — seeding it "
            "before the golden path would break the £0.00 clearing verification."
        )

    # ── 6. Tracking category "Channel" + option "MarketplaceCo" ──────────
    logger.info(
        "Ensuring tracking category '%s' / '%s'…", TRACKING_CATEGORY, TRACKING_OPTION
    )
    try:
        await client.ensure_tracking_category(TRACKING_CATEGORY, TRACKING_OPTION)
        summary["tracking_category"] = f"{TRACKING_CATEGORY}/{TRACKING_OPTION}"
    except Exception as exc:
        logger.warning("Tracking category setup failed (non-fatal): %s", exc)
        summary["warnings"].append(f"Tracking category setup failed: {exc}")

    # ── 7. Capture BEFORE P&L snapshot ───────────────────────────────────
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
