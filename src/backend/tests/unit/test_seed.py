"""
Tier 1 unit tests: XeroClient.ensure_tracking_category() + seed.seed_demo_company()
(SD1-SD5). Covers the E3 tracking-category check-before-create logic and the
2-category org cap, plus a seed smoke test. Uses a real XeroClient instance
with its `list_tracking_categories`/`_call` I/O methods stubbed (no MCP
subprocess, no Xero credentials). This was the only production module (per
COVERAGE-CONTRACT-FINDINGS.md) with zero test coverage.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

import backend.config as cfg_mod
from backend.seed import seed_demo_company
from backend.xero_client import XeroClient


@pytest.fixture
def client():
    return XeroClient()


@pytest.fixture(autouse=True)
def isolated_state(tmp_path, monkeypatch):
    monkeypatch.setattr(cfg_mod, "STATE_DIR", tmp_path)


# ── SD1: No matching category → check-before-create, category is created ──
async def test_SD1_creates_category_when_absent(client, monkeypatch):
    client.list_tracking_categories = AsyncMock(return_value=[])
    client._call = AsyncMock(
        return_value={"TrackingCategories": [{"TrackingCategoryID": "TC-1"}]}
    )

    await client.ensure_tracking_category("Channel", "MarketplaceCo")

    client._call.assert_any_call("create-tracking-category", {"name": "Channel"})


# ── SD2: Category + option already exist → no write call made ────────────
async def test_SD2_skips_create_when_category_and_option_exist(client):
    client.list_tracking_categories = AsyncMock(
        return_value=[
            {
                "Name": "Channel",
                "Status": "ACTIVE",
                "TrackingCategoryID": "TC-1",
                "Options": [{"Name": "MarketplaceCo"}],
            }
        ]
    )
    client._call = AsyncMock()

    await client.ensure_tracking_category("Channel", "MarketplaceCo")

    client._call.assert_not_called()


# ── SD3: Category exists, option missing → only the option is created ────
async def test_SD3_creates_option_when_category_exists_without_it(client):
    client.list_tracking_categories = AsyncMock(
        return_value=[
            {
                "Name": "Channel",
                "Status": "ACTIVE",
                "TrackingCategoryID": "TC-1",
                "Options": [],
            }
        ]
    )
    client._call = AsyncMock()

    await client.ensure_tracking_category("Channel", "MarketplaceCo")

    client._call.assert_called_once_with(
        "create-tracking-options", {"trackingCategoryId": "TC-1", "name": "MarketplaceCo"}
    )


# ── SD4: Org already at 2-category cap → creation skipped, non-fatal ─────
async def test_SD4_two_category_cap_blocks_creation(client):
    client.list_tracking_categories = AsyncMock(
        return_value=[
            {"Name": "Region", "Status": "ACTIVE", "Options": []},
            {"Name": "Team", "Status": "ACTIVE", "Options": []},
        ]
    )
    client._call = AsyncMock()

    await client.ensure_tracking_category("Channel", "MarketplaceCo")

    client._call.assert_not_called()


# ── SD5: seed_demo_company smoke test — surfaces tracking result, idempotent ─
async def test_SD5_seed_demo_company_smoke(monkeypatch):
    m = AsyncMock()
    m.find_or_create_account.return_value = "ACC-1"
    m.create_contact.return_value = "CONTACT-1"
    m.list_bank_transactions.return_value = []
    m.create_receive_transaction.return_value = "TXN-1"
    m.list_profit_and_loss.return_value = {"Revenue": "0.00"}
    m.extract_pnl_snapshot = MagicMock(return_value={"revenue": "0.00"})
    m.ensure_tracking_category = AsyncMock()

    summary = await seed_demo_company(m)

    assert summary["clearing_account"] == "ACC-1"
    assert summary["contact_id"] == "CONTACT-1"
    assert summary["receive_txn_id"] == "TXN-1"
    assert summary["tracking_category"] == "Channel/MarketplaceCo"
    assert summary["pnl_before_captured"] is True
    m.ensure_tracking_category.assert_called_once_with("Channel", "MarketplaceCo")
