"""
Tier 2 API tests: GET /health  (AH1-AH2)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import pytest


# ── AH1: Healthy — Xero connected ─────────────────────────────────────────
def test_AH1_healthy(api_client):
    resp = api_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["xero_connected"] is True
    assert body["organisation"] == "Demo Company (UK)"


# ── AH2: Degraded — list_organisation_details raises ─────────────────────
def test_AH2_degraded_on_xero_error(api_client, mock_xero):
    mock_xero.list_organisation_details.side_effect = Exception("MCP connection lost")

    resp = api_client.get("/health")
    # Health always returns 200 (degraded state expressed in body)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "degraded"
    assert body["xero_connected"] is False
