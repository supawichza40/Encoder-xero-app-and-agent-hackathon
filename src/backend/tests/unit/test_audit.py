"""
Tier 1 unit tests: Audit trail (AU1-AU7)
"""

from datetime import datetime

import pytest

from backend.audit import append_entry, get_entries, get_trace_panel


# ── AU1: Append to empty file ─────────────────────────────────────────────
def test_AU1_append_to_empty(tmp_state):
    append_entry("h1", "create-invoice", {"amount": "1340"}, "INV-001", "success")
    entries = get_entries("h1")
    assert len(entries) == 1


# ── AU2: Append multiple ──────────────────────────────────────────────────
def test_AU2_multiple(tmp_state):
    for i in range(3):
        append_entry(f"h{i}", "action", {}, f"ID-{i}", "success")
    # All under different hashes
    for i in range(3):
        assert len(get_entries(f"h{i}")) == 1


# ── AU3: Entry has correct structure ──────────────────────────────────────
def test_AU3_entry_structure(tmp_state):
    append_entry("hash_x", "create-invoice", {"amount": "1340"}, "INV-001", "success")
    entry = get_entries("hash_x")[0]
    for field in ("timestamp", "file_hash", "action", "request", "xero_id", "status"):
        assert field in entry, f"Missing field: {field}"


# ── AU4: Timestamp is ISO 8601 ────────────────────────────────────────────
def test_AU4_timestamp_iso(tmp_state):
    append_entry("ts_hash", "test", {}, None, "success")
    ts = get_entries("ts_hash")[0]["timestamp"]
    # Should parse without error
    datetime.fromisoformat(ts.replace("Z", "+00:00"))


# ── AU5: Filter by hash ───────────────────────────────────────────────────
def test_AU5_filter_by_hash(tmp_state):
    append_entry("alpha", "create-invoice", {}, "INV-A", "success")
    append_entry("beta", "create-invoice", {}, "INV-B", "success")
    alpha_entries = get_entries("alpha")
    assert len(alpha_entries) == 1
    assert alpha_entries[0]["xero_id"] == "INV-A"


# ── AU6: Unknown hash returns empty ───────────────────────────────────────
def test_AU6_unknown_returns_empty(tmp_state):
    assert get_entries("nonexistent_hash") == []


# ── AU7: get_trace_panel returns same shape ───────────────────────────────
def test_AU7_trace_panel_same_shape(tmp_state):
    append_entry("tp_hash", "create-payment", {"invoice_id": "INV-X"}, "PMT-1", "success")
    entries = get_entries("tp_hash")
    trace = get_trace_panel("tp_hash")
    assert entries == trace
