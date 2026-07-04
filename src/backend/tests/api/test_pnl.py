"""
Tier 2 API tests: GET /pnl  (APL1-APL5)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import io
import json
from decimal import Decimal
from pathlib import Path

import pytest


def _write_snapshot(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data), encoding="utf-8")


_BEFORE = {
    "revenue": "847.00",
    "commission_expense": None,
    "other_expenses": {},
    "net_profit": "847.00",
}

_AFTER = {
    "revenue": "1340.00",
    "commission_expense": "493.00",
    "other_expenses": {},
    "net_profit": "847.00",
}


# ── APL1: Both before and after snapshots present ─────────────────────────
def test_APL1_before_and_after(api_client, tmp_path):
    _write_snapshot(tmp_path / "pnl-before.json", _BEFORE)
    _write_snapshot(tmp_path / "pnl-after.json", _AFTER)

    resp = api_client.get("/pnl")
    assert resp.status_code == 200
    body = resp.json()
    assert body["before"]["revenue"] == "847.00"
    assert body["after"]["revenue"] == "1340.00"


# ── APL2: Before present, after missing → after is null ───────────────────
def test_APL2_before_only(api_client, tmp_path):
    _write_snapshot(tmp_path / "pnl-before.json", _BEFORE)

    resp = api_client.get("/pnl")
    assert resp.status_code == 200
    body = resp.json()
    assert body["before"] is not None
    assert body["after"] is None


# ── APL3: Neither snapshot exists → 404 ──────────────────────────────────
def test_APL3_no_data_404(api_client):
    resp = api_client.get("/pnl")
    assert resp.status_code == 404


# ── APL4: Commission expense visible in after ─────────────────────────────
def test_APL4_commission_expense_in_after(api_client, tmp_path):
    _write_snapshot(tmp_path / "pnl-before.json", _BEFORE)
    _write_snapshot(tmp_path / "pnl-after.json", _AFTER)

    resp = api_client.get("/pnl")
    assert resp.status_code == 200
    assert resp.json()["after"]["commission_expense"] == "493.00"


# ── APL5: Net profit equal before and after (gross-up is revenue + expense) ─
def test_APL5_net_profit_unchanged(api_client, tmp_path):
    _write_snapshot(tmp_path / "pnl-before.json", _BEFORE)
    _write_snapshot(tmp_path / "pnl-after.json", _AFTER)

    resp = api_client.get("/pnl")
    assert resp.status_code == 200
    body = resp.json()
    assert body["before"]["net_profit"] == "847.00"
    assert body["after"]["net_profit"] == "847.00"
