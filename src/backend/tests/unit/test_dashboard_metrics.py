"""
Tier 1 unit tests: persona_metrics + run_history (CONTRACT.md §1).

Pure functions over local JSON state — no Xero, no FastAPI TestClient.
Each test writes posted.json / audit.json / proposals/<hash>.json directly
under tmp_path, mirroring the shapes produced by /propose and /approve.
"""

import json
from datetime import datetime, timezone

from backend.dashboard_metrics import _load_proposal, compute_persona_metrics, compute_run_history


def _seed_proposal(state_dir, file_hash, payout, step_kinds):
    proposals_dir = state_dir / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps(
            {
                "payout": payout,
                "plan": {"steps": [{"kind": k} for k in step_kinds], "invariant_check": True},
            }
        ),
        encoding="utf-8",
    )


def _seed_posted(state_dir, file_hash, completed_steps, **extra):
    posted_path = state_dir / "posted.json"
    data = json.loads(posted_path.read_text()) if posted_path.exists() else {}
    data[file_hash] = {"completed_steps": completed_steps, **extra}
    posted_path.write_text(json.dumps(data), encoding="utf-8")


def _append_audit(state_dir, entries):
    audit_path = state_dir / "audit.json"
    data = json.loads(audit_path.read_text()) if audit_path.exists() else []
    data.extend(entries)
    audit_path.write_text(json.dumps(data), encoding="utf-8")


_STEPS = ["create-invoice", "create-bank-transaction", "create-payment"]


# ── Empty state — must be None, never an error or an empty-but-present object ──

def test_persona_metrics_none_when_no_data(tmp_path):
    assert compute_persona_metrics(tmp_path) is None


def test_run_history_none_when_no_data(tmp_path):
    assert compute_run_history(tmp_path) is None


# ── Basic computation: fees/turnover/YTD/new-vs-repeat from one posted statement ──

def test_persona_metrics_basic_computation(tmp_path):
    file_hash = "a" * 64
    payout = {
        "payout_ref": "MC-PAYOUT-0407",
        "period": "16-30 Jun 2026",
        "gross": "1340.00",
        "commission": "445.90",
        "fees": "47.10",
        "refunds": "0.00",
        "net": "847.00",
        "bookings": [
            {
                "date": "2026-06-20", "client": "Client A", "client_type": "New",
                "service": "Cut", "gross_amount": "200.00", "commission_rate": "35%",
                "commission": "70.00",
            },
            {
                "date": "2026-06-22", "client": "Client B", "client_type": "Repeat",
                "service": "Colour", "gross_amount": "1140.00", "commission_rate": "33%",
                "commission": "375.90",
            },
        ],
    }
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)
    _append_audit(
        tmp_path,
        [
            {"timestamp": "2026-07-04T15:30:00Z", "file_hash": file_hash, "action": "create-invoice", "status": "success"},
            {"timestamp": "2026-07-04T15:30:05Z", "file_hash": file_hash, "action": "create-bank-transaction", "status": "success"},
            {"timestamp": "2026-07-04T15:30:10Z", "file_hash": file_hash, "action": "create-payment", "status": "success"},
        ],
    )

    now = datetime(2026, 7, 5, 8, 0, 0, tzinfo=timezone.utc)
    metrics = compute_persona_metrics(tmp_path, now=now)

    assert metrics is not None
    assert metrics.fees_this_month == "493.00"
    assert metrics.gross_turnover_vat_safe == "1340.00"
    assert metrics.ytd_income == "1340.00"
    assert metrics.ytd_deductible_fees == "493.00"
    assert metrics.new_vs_repeat.new.count == 1
    assert metrics.new_vs_repeat.new.commission == "70.00"
    assert metrics.new_vs_repeat.repeat.count == 1
    assert metrics.new_vs_repeat.repeat.commission == "375.90"


# ── UK tax year boundary: 6 April cutoff (ALX-1) ──────────────────────────────

def test_persona_metrics_uk_tax_year_boundary(tmp_path):
    """A statement posted 5 Apr belongs to the PRIOR tax year (excluded from YTD);
    one posted exactly 6 Apr belongs to the NEW tax year (included)."""
    hash_before = "b" * 64
    payout_before = {
        "payout_ref": "MC-PAYOUT-PRE", "period": "p", "gross": "100.00",
        "commission": "20.00", "fees": "5.00", "refunds": "0.00", "net": "75.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "New", "service": "s",
                       "gross_amount": "100.00", "commission_rate": "20%", "commission": "20.00"}],
    }
    hash_after = "c" * 64
    payout_after = {
        "payout_ref": "MC-PAYOUT-POST", "period": "p", "gross": "200.00",
        "commission": "40.00", "fees": "10.00", "refunds": "0.00", "net": "150.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "Repeat", "service": "s",
                       "gross_amount": "200.00", "commission_rate": "20%", "commission": "40.00"}],
    }

    for h, payout, ts in (
        (hash_before, payout_before, "2026-04-05T10:00:00Z"),
        (hash_after, payout_after, "2026-04-06T10:00:00Z"),
    ):
        _seed_proposal(tmp_path, h, payout, _STEPS)
        _seed_posted(tmp_path, h, completed_steps=_STEPS)
        _append_audit(
            tmp_path,
            [{"timestamp": ts, "file_hash": h, "action": k, "status": "success"} for k in _STEPS],
        )

    now = datetime(2026, 7, 5, 8, 0, 0, tzinfo=timezone.utc)  # tax_year_start = 2026-04-06
    metrics = compute_persona_metrics(tmp_path, now=now)

    assert metrics is not None
    # Unconditional across all fully-posted statements, regardless of tax year:
    assert metrics.gross_turnover_vat_safe == "300.00"
    # YTD must include ONLY the 6-Apr-or-later statement:
    assert metrics.ytd_income == "200.00"
    assert metrics.ytd_deductible_fees == "50.00"


# ── Month vs. tax-year granularity are independent filters ───────────────────

def test_persona_metrics_fees_this_month_only_current_month(tmp_path):
    hash_prev_month = "d" * 64
    payout_prev = {
        "payout_ref": "MC-PAYOUT-JUN", "period": "p", "gross": "50.00",
        "commission": "8.00", "fees": "2.00", "refunds": "0.00", "net": "40.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "New", "service": "s",
                       "gross_amount": "50.00", "commission_rate": "16%", "commission": "8.00"}],
    }
    hash_this_month = "e" * 64
    payout_this = {
        "payout_ref": "MC-PAYOUT-JUL", "period": "p", "gross": "80.00",
        "commission": "15.00", "fees": "3.00", "refunds": "0.00", "net": "62.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "Repeat", "service": "s",
                       "gross_amount": "80.00", "commission_rate": "18%", "commission": "15.00"}],
    }

    for h, payout, ts in (
        (hash_prev_month, payout_prev, "2026-06-01T10:00:00Z"),
        (hash_this_month, payout_this, "2026-07-05T10:00:00Z"),
    ):
        _seed_proposal(tmp_path, h, payout, _STEPS)
        _seed_posted(tmp_path, h, completed_steps=_STEPS)
        _append_audit(
            tmp_path,
            [{"timestamp": ts, "file_hash": h, "action": k, "status": "success"} for k in _STEPS],
        )

    now = datetime(2026, 7, 5, 8, 0, 0, tzinfo=timezone.utc)
    metrics = compute_persona_metrics(tmp_path, now=now)

    assert metrics is not None
    assert metrics.fees_this_month == "18.00"  # only the July statement
    assert metrics.gross_turnover_vat_safe == "130.00"  # both, unconditional
    assert metrics.ytd_income == "130.00"  # both fall within the same tax year
    assert metrics.ytd_deductible_fees == "28.00"


# ── run_history statuses (PRI-5) ──────────────────────────────────────────────

def test_run_history_status_posted(tmp_path):
    file_hash = "1" * 64
    payout = {"payout_ref": "MC-PAYOUT-0407", "net": "847.00"}
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)
    _append_audit(
        tmp_path,
        [
            {"timestamp": "2026-07-04T15:30:00Z", "file_hash": file_hash, "action": "create-invoice", "status": "success"},
            {"timestamp": "2026-07-04T15:30:05Z", "file_hash": file_hash, "action": "create-bank-transaction", "status": "success"},
            {"timestamp": "2026-07-04T15:30:10Z", "file_hash": file_hash, "action": "create-payment", "status": "success"},
        ],
    )

    history = compute_run_history(tmp_path)
    assert history is not None
    assert len(history) == 1
    entry = history[0]
    assert entry.hash == file_hash[:12]
    assert entry.status == "posted"
    assert entry.payout_ref == "MC-PAYOUT-0407"
    assert entry.net == "847.00"
    assert entry.timestamp == "2026-07-04T15:30:10Z"


def test_run_history_status_partial(tmp_path):
    file_hash = "2" * 64
    payout = {"payout_ref": "MC-PAYOUT-PARTIAL", "net": "847.00"}
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=["create-invoice"])
    _append_audit(
        tmp_path,
        [{"timestamp": "2026-07-04T15:30:00Z", "file_hash": file_hash, "action": "create-invoice", "status": "success"}],
    )

    history = compute_run_history(tmp_path)
    assert history is not None
    entry = next(e for e in history if e.hash == file_hash[:12])
    assert entry.status == "partial"


def test_run_history_status_failed(tmp_path):
    file_hash = "3" * 64
    payout = {"payout_ref": "MC-PAYOUT-FAILED", "net": "847.00"}
    # Proposal exists (from /propose) but no step ever completed in posted.json.
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _append_audit(
        tmp_path,
        [{"timestamp": "2026-07-04T15:30:00Z", "file_hash": file_hash, "action": "create-invoice", "status": "error"}],
    )

    history = compute_run_history(tmp_path)
    assert history is not None
    entry = next(e for e in history if e.hash == file_hash[:12])
    assert entry.status == "failed"


def test_run_history_status_skipped_idempotent(tmp_path):
    file_hash = "4" * 64
    payout = {"payout_ref": "MC-PAYOUT-DUP", "net": "847.00"}
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)
    _append_audit(
        tmp_path,
        [
            {"timestamp": "2026-07-04T15:30:00Z", "file_hash": file_hash, "action": "create-invoice", "status": "success"},
            {"timestamp": "2026-07-04T15:30:05Z", "file_hash": file_hash, "action": "create-bank-transaction", "status": "success"},
            {"timestamp": "2026-07-04T15:30:10Z", "file_hash": file_hash, "action": "create-payment", "status": "success"},
            {"timestamp": "2026-07-05T09:00:00Z", "file_hash": file_hash, "action": "skipped-idempotent", "status": "success"},
        ],
    )

    history = compute_run_history(tmp_path)
    assert history is not None
    statuses = sorted(e.status for e in history if e.hash == file_hash[:12])
    assert statuses == ["posted", "skipped-idempotent"]


# ── MED-6: repeated re-uploads of a fully-posted file must not grow run_history
# unboundedly — only the LATEST skipped-idempotent event per hash survives ──

def test_run_history_dedupes_repeated_skipped_idempotent_events(tmp_path):
    file_hash = "7" * 64
    payout = {"payout_ref": "MC-PAYOUT-DUP2", "net": "847.00"}
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)
    _append_audit(
        tmp_path,
        [
            {"timestamp": "2026-07-04T15:30:00Z", "file_hash": file_hash, "action": "create-invoice", "status": "success"},
            {"timestamp": "2026-07-04T15:30:05Z", "file_hash": file_hash, "action": "create-bank-transaction", "status": "success"},
            {"timestamp": "2026-07-04T15:30:10Z", "file_hash": file_hash, "action": "create-payment", "status": "success"},
            {"timestamp": "2026-07-05T09:00:00Z", "file_hash": file_hash, "action": "skipped-idempotent", "status": "success"},
            {"timestamp": "2026-07-06T09:00:00Z", "file_hash": file_hash, "action": "skipped-idempotent", "status": "success"},
            {"timestamp": "2026-07-07T09:00:00Z", "file_hash": file_hash, "action": "skipped-idempotent", "status": "success"},
        ],
    )

    history = compute_run_history(tmp_path)
    assert history is not None
    skip_entries = [
        e for e in history if e.hash == file_hash[:12] and e.status == "skipped-idempotent"
    ]
    assert len(skip_entries) == 1
    assert skip_entries[0].timestamp == "2026-07-07T09:00:00Z"


# ── HIGH-2: malformed proposals/<hash>.json must never crash the computation ──

def test_persona_metrics_skips_unparseable_proposal_json(tmp_path):
    file_hash = "f" * 64
    proposals_dir = tmp_path / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text('{"payout": {"gross": "13', encoding="utf-8")
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)

    # No valid proposal anywhere -> None, never an exception.
    assert compute_persona_metrics(tmp_path) is None


def test_run_history_tolerates_unparseable_proposal_json(tmp_path):
    file_hash = "g" * 64
    proposals_dir = tmp_path / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text("not json at all", encoding="utf-8")
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)

    history = compute_run_history(tmp_path)
    assert history is not None
    entry = next(e for e in history if e.hash == file_hash[:12])
    assert entry.payout_ref is None
    assert entry.net is None


def test_persona_metrics_skips_proposal_missing_expected_keys(tmp_path):
    """Valid JSON but missing the 'plan'/'steps' structure — must be skipped,
    not raise KeyError."""
    file_hash = "h" * 64
    proposals_dir = tmp_path / "proposals"
    proposals_dir.mkdir(parents=True, exist_ok=True)
    (proposals_dir / f"{file_hash}.json").write_text(
        json.dumps({"payout": {"gross": "100.00"}}), encoding="utf-8"
    )
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)

    assert compute_persona_metrics(tmp_path) is None


# ── MED-5: dashboard_metrics._load_proposal must reject path-traversal hashes ──

def test_load_proposal_rejects_malformed_hash(tmp_path):
    assert _load_proposal(tmp_path, "../../etc/passwd") is None
    assert _load_proposal(tmp_path, "not-hex!!") is None
    assert _load_proposal(tmp_path, "a" * 65) is None
    assert _load_proposal(tmp_path, "") is None


# ── HIGH-3: UK tax year / month bucket must use Europe/London local dates ────

def test_persona_metrics_uk_tax_year_uses_london_local_time(tmp_path):
    """2026-04-05T23:30:00Z is 2026-04-06T00:30 BST — already the NEW UK tax
    year in Europe/London, even though the UTC calendar date is still 5 Apr."""
    file_hash = "9" * 64
    payout = {
        "payout_ref": "MC-PAYOUT-BST", "period": "p", "gross": "500.00",
        "commission": "100.00", "fees": "20.00", "refunds": "0.00", "net": "380.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "New", "service": "s",
                       "gross_amount": "500.00", "commission_rate": "20%", "commission": "100.00"}],
    }
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)
    _append_audit(
        tmp_path,
        [{"timestamp": "2026-04-05T23:30:00Z", "file_hash": file_hash, "action": k, "status": "success"}
         for k in _STEPS],
    )

    now = datetime(2026, 7, 5, 8, 0, 0, tzinfo=timezone.utc)
    metrics = compute_persona_metrics(tmp_path, now=now)

    assert metrics is not None
    assert metrics.ytd_income == "500.00"
    assert metrics.ytd_deductible_fees == "120.00"


def test_persona_metrics_fees_this_month_uses_london_local_time(tmp_path):
    """2026-06-30T23:30:00Z is 2026-07-01T00:30 BST — already July locally,
    even though the UTC calendar date is still 30 June."""
    file_hash = "0" * 64
    payout = {
        "payout_ref": "MC-PAYOUT-MONTH-BST", "period": "p", "gross": "60.00",
        "commission": "10.00", "fees": "2.00", "refunds": "0.00", "net": "48.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "New", "service": "s",
                       "gross_amount": "60.00", "commission_rate": "16%", "commission": "10.00"}],
    }
    _seed_proposal(tmp_path, file_hash, payout, _STEPS)
    _seed_posted(tmp_path, file_hash, completed_steps=_STEPS)
    _append_audit(
        tmp_path,
        [{"timestamp": "2026-06-30T23:30:00Z", "file_hash": file_hash, "action": k, "status": "success"}
         for k in _STEPS],
    )

    now = datetime(2026, 7, 5, 8, 0, 0, tzinfo=timezone.utc)
    metrics = compute_persona_metrics(tmp_path, now=now)

    assert metrics is not None
    assert metrics.fees_this_month == "12.00"


# ── MED-7: gross_turnover_vat_safe is a ROLLING 12-month window ──────────────

def test_gross_turnover_vat_safe_rolling_12_month_window(tmp_path):
    """A statement posted more than 12 months before `now` must be excluded
    from gross_turnover_vat_safe (HMRC VAT-threshold monitoring is rolling,
    not an all-time sum) even though it still fully qualifies otherwise."""
    old_hash = "5" * 64
    old_payout = {
        "payout_ref": "MC-PAYOUT-OLD", "period": "p", "gross": "1000.00",
        "commission": "200.00", "fees": "50.00", "refunds": "0.00", "net": "750.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "New", "service": "s",
                       "gross_amount": "1000.00", "commission_rate": "20%", "commission": "200.00"}],
    }
    recent_hash = "6" * 64
    recent_payout = {
        "payout_ref": "MC-PAYOUT-RECENT", "period": "p", "gross": "100.00",
        "commission": "20.00", "fees": "5.00", "refunds": "0.00", "net": "75.00",
        "bookings": [{"date": "d", "client": "c", "client_type": "New", "service": "s",
                       "gross_amount": "100.00", "commission_rate": "20%", "commission": "20.00"}],
    }
    for h, payout, ts in (
        (old_hash, old_payout, "2025-01-01T10:00:00Z"),       # > 12 months before `now`
        (recent_hash, recent_payout, "2026-06-01T10:00:00Z"),  # within the last 12 months
    ):
        _seed_proposal(tmp_path, h, payout, _STEPS)
        _seed_posted(tmp_path, h, completed_steps=_STEPS)
        _append_audit(
            tmp_path,
            [{"timestamp": ts, "file_hash": h, "action": k, "status": "success"} for k in _STEPS],
        )

    now = datetime(2026, 7, 5, 8, 0, 0, tzinfo=timezone.utc)
    metrics = compute_persona_metrics(tmp_path, now=now)

    assert metrics is not None
    assert metrics.gross_turnover_vat_safe == "100.00"
