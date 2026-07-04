"""Shared test fixtures."""

import pytest
from pathlib import Path

GOLDEN_CSV_PATH = (
    Path(__file__).resolve().parent.parent.parent / "data" / "marketplaceco-payout-0407.csv"
)


@pytest.fixture
def golden_csv_bytes() -> bytes:
    return GOLDEN_CSV_PATH.read_bytes()


@pytest.fixture
def tmp_state(tmp_path, monkeypatch):
    """Redirect STATE_DIR to a temporary directory for isolation."""
    import backend.config as cfg
    import backend.idempotency as idem
    import backend.audit as aud

    monkeypatch.setattr(cfg, "STATE_DIR", tmp_path)
    monkeypatch.setattr(idem, "_state_file", lambda: tmp_path / "posted.json")
    monkeypatch.setattr(aud, "_audit_file", lambda: tmp_path / "audit.json")
    return tmp_path
