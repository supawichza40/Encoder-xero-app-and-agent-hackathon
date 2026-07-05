"""
Tier 2 API tests: GET /audit/export?format=csv|json  (PRI-1)
Real FastAPI TestClient, mocked XeroClient. No Xero credentials required.
"""

import csv
import io

import pytest


# ── Default format (csv) ──────────────────────────────────────────────────
def test_audit_export_default_is_csv(api_client):
    resp = api_client.get("/audit/export")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert 'attachment; filename="payoutbridge-audit.csv"' in resp.headers["content-disposition"]


def test_audit_export_explicit_csv(api_client):
    resp = api_client.get("/audit/export?format=csv")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")


def test_audit_export_csv_header_row(api_client):
    resp = api_client.get("/audit/export?format=csv")
    rows = list(csv.reader(io.StringIO(resp.text)))
    assert rows[0] == ["timestamp", "action", "payout_ref", "xero_id", "status", "summary"]


def test_audit_export_csv_has_entries_after_approve(api_client, golden_csv):
    fh_resp = api_client.post(
        "/propose", files={"file": ("payout.csv", io.BytesIO(golden_csv), "text/csv")}
    )
    file_hash = fh_resp.json()["file_hash"]
    api_client.post("/approve", json={"file_hash": file_hash})

    resp = api_client.get("/audit/export?format=csv")
    assert resp.status_code == 200
    rows = list(csv.reader(io.StringIO(resp.text)))
    assert len(rows) > 1
    actions = [r[1] for r in rows[1:]]
    assert "create-invoice" in actions


# ── JSON format ────────────────────────────────────────────────────────────
def test_audit_export_json(api_client, golden_csv):
    fh_resp = api_client.post(
        "/propose", files={"file": ("payout.csv", io.BytesIO(golden_csv), "text/csv")}
    )
    file_hash = fh_resp.json()["file_hash"]
    api_client.post("/approve", json={"file_hash": file_hash})

    resp = api_client.get("/audit/export?format=json")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/json")
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) > 0
    assert body[0]["file_hash"] == file_hash


# ── Empty state — never 500 ───────────────────────────────────────────────
def test_audit_export_empty_csv_200(api_client):
    resp = api_client.get("/audit/export?format=csv")
    assert resp.status_code == 200
    rows = list(csv.reader(io.StringIO(resp.text)))
    assert rows == [["timestamp", "action", "payout_ref", "xero_id", "status", "summary"]]


def test_audit_export_empty_json_200(api_client):
    resp = api_client.get("/audit/export?format=json")
    assert resp.status_code == 200
    assert resp.json() == []


# ── Unknown format value → treated as csv, never 500/422 ──────────────────
def test_audit_export_unknown_format_defaults_to_csv(api_client):
    resp = api_client.get("/audit/export?format=garbage")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
