"""
Tier 2 API tests: GET /vat-check  (AV1-AV7)  [E5]
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import pytest


# ── AV1: Success shape — "No VAT" rate present → consistent ──────────────
def test_AV1_success_consistent(api_client, mock_xero):
    mock_xero.list_tax_rates.return_value = [
        {"Name": "Standard Rate", "TaxType": "OUTPUT", "EffectiveRate": "20"},
        {"Name": "No VAT", "TaxType": "NONE", "EffectiveRate": "0"},
    ]

    resp = api_client.get("/vat-check")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "xero"
    assert body["golden_path_tax_type"] == "NONE"
    assert body["consistent"] is True
    assert len(body["org_rates"]) == 2
    assert "Ask your accountant" in body["note"]


# ── AV2: No zero/none rate present → inconsistent ─────────────────────────
def test_AV2_inconsistent_without_zero_rate(api_client, mock_xero):
    mock_xero.list_tax_rates.return_value = [
        {"Name": "Standard Rate", "TaxType": "OUTPUT", "EffectiveRate": "20"},
        {"Name": "Reduced Rate", "TaxType": "OUTPUT2", "EffectiveRate": "5"},
    ]

    resp = api_client.get("/vat-check")
    assert resp.status_code == 200
    body = resp.json()
    assert body["consistent"] is False
    assert "inconsistent" in body["note"].lower()


# ── AV3: 60s cache — second call within TTL does not re-hit Xero ─────────
def test_AV3_cache_hits_within_ttl(api_client, mock_xero):
    mock_xero.list_tax_rates.return_value = [{"Name": "No VAT", "EffectiveRate": "0"}]

    resp1 = api_client.get("/vat-check")
    assert resp1.status_code == 200
    mock_xero.list_tax_rates.assert_called_once()

    resp2 = api_client.get("/vat-check")
    assert resp2.status_code == 200
    mock_xero.list_tax_rates.assert_called_once()
    assert resp1.json() == resp2.json()


# ── AV4: Cache expired (TTL elapsed) → re-fetches Xero ────────────────────
def test_AV4_cache_expires_after_ttl(api_client, mock_xero, monkeypatch):
    import backend.main as main_mod

    mock_xero.list_tax_rates.return_value = [{"Name": "No VAT", "EffectiveRate": "0"}]

    resp1 = api_client.get("/vat-check")
    assert resp1.status_code == 200
    mock_xero.list_tax_rates.assert_called_once()

    data, _fetched_at = main_mod._vat_cache
    monkeypatch.setattr(main_mod, "_vat_cache", (data, 0.0))

    resp2 = api_client.get("/vat-check")
    assert resp2.status_code == 200
    assert mock_xero.list_tax_rates.call_count == 2


# ── AV5: Xero disconnected (client is None) → degraded, still 200 ────────
def test_AV5_degraded_when_disconnected(api_client):
    from backend.main import app

    app.state.xero = None
    resp = api_client.get("/vat-check")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "degraded"
    assert body["consistent"] is True
    assert "not connected" in body["note"].lower()


# ── AV6: Xero read raises → degraded, still 200 ───────────────────────────
def test_AV6_degraded_on_xero_read_failure(api_client, mock_xero):
    mock_xero.list_tax_rates.side_effect = Exception("MCP connection lost")

    resp = api_client.get("/vat-check")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "degraded"


# ── AV7: Degraded response is not cached — retries on every call ─────────
def test_AV7_degraded_not_cached(api_client, mock_xero):
    mock_xero.list_tax_rates.side_effect = Exception("MCP connection lost")

    api_client.get("/vat-check")
    api_client.get("/vat-check")
    assert mock_xero.list_tax_rates.call_count == 2
