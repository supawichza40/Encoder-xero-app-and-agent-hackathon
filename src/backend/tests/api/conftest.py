"""
Tier 2 API test fixtures.

Provides:
  mock_xero   — AsyncMock XeroClient pre-loaded with golden-path return values
  api_client  — FastAPI TestClient with mocked Xero and isolated STATE_DIR
  golden_csv  — raw bytes of the locked golden CSV

Xero credentials are NOT required. All writes are intercepted by mock_xero.
"""

import json
from decimal import Decimal
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

GOLDEN_CSV_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "marketplaceco-payout-0407.csv"
)


@pytest.fixture
def golden_csv():
    return GOLDEN_CSV_PATH.read_bytes()


@pytest.fixture
def mock_xero():
    """
    AsyncMock of XeroClient pre-wired for the golden path.
    Tests may override individual return_values / side_effects before
    making requests — the same instance is injected into app.state.xero.
    """
    from backend.xero_client import XeroClient

    m = AsyncMock(spec=XeroClient)
    m.connect = AsyncMock()
    m.disconnect = AsyncMock()

    # Golden-path write return values
    m.create_invoice.return_value = "INV-0042"
    m.create_bank_transaction.return_value = "BT-0117"
    m.create_payment.return_value = "PMT-0089"

    # Verification / read return values
    m.get_clearing_balance.return_value = Decimal("0.00")
    m.list_profit_and_loss.return_value = {
        "Revenue": "1340.00",
        "Expenses": "493.00",
        "NetProfit": "847.00",
    }
    m.list_organisation_details.return_value = {"Name": "Demo Company (UK)"}

    # extract_pnl_snapshot is synchronous — use MagicMock
    m.extract_pnl_snapshot = MagicMock(
        return_value={
            "revenue": "1340.00",
            "commission_expense": "493.00",
            "other_expenses": {},
            "net_profit": "847.00",
        }
    )
    return m


@pytest.fixture
def api_client(mock_xero, tmp_path, monkeypatch):
    """
    TestClient with:
      - STATE_DIR → tmp_path  (isolated per test)
      - XeroClient → mock_xero (no npx / no credentials)
      - Fresh posted.json + audit.json
      - _proposals cache cleared
    """
    import backend.config as cfg_mod
    import backend.main as main_mod
    import backend.idempotency as idem_mod
    import backend.audit as audit_mod

    # ── Redirect all state I/O to tmp_path ──────────────────────────────
    monkeypatch.setattr(cfg_mod, "STATE_DIR", tmp_path)
    monkeypatch.setattr(main_mod, "STATE_DIR", tmp_path)
    monkeypatch.setattr(idem_mod, "_state_file", lambda: tmp_path / "posted.json")
    monkeypatch.setattr(audit_mod, "_audit_file", lambda: tmp_path / "audit.json")

    # Init empty state files
    (tmp_path / "posted.json").write_text("{}", encoding="utf-8")
    (tmp_path / "audit.json").write_text("[]", encoding="utf-8")

    # ── Patch XeroClient so lifespan uses mock_xero ──────────────────────
    # XeroClient() → mock_xero, then lifespan calls mock_xero.connect()
    monkeypatch.setattr(main_mod, "XeroClient", lambda: mock_xero)

    # Clear module-level proposal cache between tests
    main_mod._proposals.clear()

    from backend.main import app

    with TestClient(app) as client:
        yield client
