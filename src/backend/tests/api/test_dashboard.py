"""
Tier 2 API tests: GET /dashboard  (AD1-AD7)  [E4]
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

from unittest.mock import MagicMock

import pytest


def _wire_success(mock_xero):
    """Wire mock_xero for a successful /dashboard read."""
    mock_xero.list_trial_balance.return_value = {}
    mock_xero.list_aged_receivables_by_contact.return_value = {}
    mock_xero.list_report_balance_sheet.return_value = {}
    mock_xero.extract_trial_balance_summary = MagicMock(
        return_value={"clearing": "0.00", "fees_expense": "493.00", "revenue": "1340.00"}
    )
    mock_xero.extract_aged_receivables_summary = MagicMock(
        return_value=[{"contact": "MarketplaceCo (Marketplace)", "outstanding": "0.00"}]
    )
    mock_xero.extract_balance_sheet_summary = MagicMock(
        return_value={"bank": "847.00", "current_assets": "847.00"}
    )


# ── AD1: Success shape ─────────────────────────────────────────────────────
def test_AD1_success_shape(api_client, mock_xero):
    _wire_success(mock_xero)

    resp = api_client.get("/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "xero"
    assert body["trial_balance"] == {
        "clearing": "0.00", "fees_expense": "493.00", "revenue": "1340.00",
    }
    assert body["balance_sheet"] == {"bank": "847.00", "current_assets": "847.00"}
    assert body["aged_receivables"] == [
        {"contact": "MarketplaceCo (Marketplace)", "outstanding": "0.00"}
    ]
    assert body["recent_payouts"] == []
    assert "fetched_at" in body


# ── AD2: 60s cache — second call within TTL does not re-hit Xero ─────────
def test_AD2_cache_hits_within_ttl(api_client, mock_xero):
    _wire_success(mock_xero)

    resp1 = api_client.get("/dashboard")
    assert resp1.status_code == 200
    mock_xero.list_trial_balance.assert_called_once()
    mock_xero.list_aged_receivables_by_contact.assert_called_once()
    mock_xero.list_report_balance_sheet.assert_called_once()

    resp2 = api_client.get("/dashboard")
    assert resp2.status_code == 200
    # Still called exactly once — second request served from cache
    mock_xero.list_trial_balance.assert_called_once()
    mock_xero.list_aged_receivables_by_contact.assert_called_once()
    mock_xero.list_report_balance_sheet.assert_called_once()
    assert resp1.json() == resp2.json()


# ── AD3: Cache expired (TTL elapsed) → re-fetches Xero ────────────────────
def test_AD3_cache_expires_after_ttl(api_client, mock_xero, monkeypatch):
    import backend.main as main_mod

    _wire_success(mock_xero)

    resp1 = api_client.get("/dashboard")
    assert resp1.status_code == 200
    mock_xero.list_trial_balance.assert_called_once()

    # Force the cached entry to look stale by rewriting its timestamp
    data, _fetched_at = main_mod._dashboard_cache
    monkeypatch.setattr(main_mod, "_dashboard_cache", (data, 0.0))

    resp2 = api_client.get("/dashboard")
    assert resp2.status_code == 200
    assert mock_xero.list_trial_balance.call_count == 2


# ── AD4: Xero disconnected (client is None) → degraded, still 200 ────────
def test_AD4_degraded_when_disconnected(api_client):
    from backend.main import app

    app.state.xero = None
    resp = api_client.get("/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "degraded"
    assert body["trial_balance"]
    assert body["balance_sheet"]


# ── AD5: Xero read raises → degraded, still 200 ───────────────────────────
def test_AD5_degraded_on_xero_read_failure(api_client, mock_xero):
    mock_xero.list_trial_balance.side_effect = Exception("MCP connection lost")

    resp = api_client.get("/dashboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "degraded"


# ── AD6: Degraded response is not cached — retries on every call ─────────
def test_AD6_degraded_not_cached(api_client, mock_xero):
    mock_xero.list_trial_balance.side_effect = Exception("MCP connection lost")

    api_client.get("/dashboard")
    api_client.get("/dashboard")
    # Both calls attempted a real fetch (not served from a cached degraded body)
    assert mock_xero.list_trial_balance.call_count == 2


# ── AD7: recent_payouts reflects posted.json state ────────────────────────
def test_AD7_recent_payouts_from_state(api_client, mock_xero, tmp_path):
    import json

    _wire_success(mock_xero)
    (tmp_path / "posted.json").write_text(
        json.dumps({
            "abc123": {
                "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"],
                "clearing_balance": "0.00",
            }
        }),
        encoding="utf-8",
    )

    resp = api_client.get("/dashboard")
    assert resp.status_code == 200
    payouts = resp.json()["recent_payouts"]
    assert len(payouts) == 1
    assert payouts[0]["file_hash"] == "abc123"
    assert payouts[0]["clearing_balance"] == "0.00"
