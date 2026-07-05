"""
Persona metrics + run history — pure functions over local JSON state only.

No new Xero calls, no schema change to posted.json. Both entry points take an
explicit `state_dir: Path` so tests (and callers) can point at any directory
without relying on module-level STATE_DIR imports — important because tests
monkeypatch STATE_DIR on `backend.main`, not on a freshly-imported module.
"""

import json
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from .models import NewVsRepeat, NewVsRepeatBucket, PersonaMetrics, RunHistoryEntry


def _read_json(path: Path, default: Any) -> Any:
    """Same missing/empty-file guard used by idempotency.py and audit.py."""
    if not path.exists() or path.stat().st_size == 0:
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def _load_proposal(state_dir: Path, file_hash: str) -> dict[str, Any] | None:
    proposal_path = state_dir / "proposals" / f"{file_hash}.json"
    if not proposal_path.exists():
        return None
    return json.loads(proposal_path.read_text(encoding="utf-8"))


def _uk_tax_year_start(d: date) -> date:
    """UK tax year starting 6 April of year Y runs Y-04-06..(Y+1)-04-05 inclusive."""
    if (d.month, d.day) >= (4, 6):
        return date(d.year, 4, 6)
    return date(d.year - 1, 4, 6)


def _parse_ts(ts: str) -> datetime:
    """Audit timestamps are UTC '...Z' strings written by audit.append_entry."""
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def compute_persona_metrics(
    state_dir: Path, now: datetime | None = None
) -> PersonaMetrics | None:
    now = now or datetime.now(timezone.utc)
    posted = _read_json(state_dir / "posted.json", {})
    audit_entries = _read_json(state_dir / "audit.json", [])

    qualifying: list[tuple[dict[str, Any], datetime]] = []

    for file_hash, entry in posted.items():
        proposal = _load_proposal(state_dir, file_hash)
        if proposal is None:
            continue

        expected_kinds = {step["kind"] for step in proposal["plan"]["steps"]}
        completed = set(entry.get("completed_steps", []))
        if not expected_kinds.issubset(completed):
            continue

        success_events = [
            e
            for e in audit_entries
            if e.get("file_hash") == file_hash
            and e.get("status") == "success"
            and e.get("action") in expected_kinds
        ]
        if not success_events:
            continue

        posted_at = max(_parse_ts(e["timestamp"]) for e in success_events)
        qualifying.append((proposal, posted_at))

    if not qualifying:
        return None

    fees_this_month = Decimal("0")
    gross_turnover_vat_safe = Decimal("0")
    ytd_income = Decimal("0")
    ytd_deductible_fees = Decimal("0")
    new_count = 0
    new_commission = Decimal("0")
    repeat_count = 0
    repeat_commission = Decimal("0")

    tax_year_start = _uk_tax_year_start(now.date())

    for proposal, posted_at in qualifying:
        payout = proposal["payout"]
        gross = Decimal(payout["gross"])
        commission = Decimal(payout["commission"])
        fees = Decimal(payout["fees"])

        gross_turnover_vat_safe += gross

        if posted_at.year == now.year and posted_at.month == now.month:
            fees_this_month += commission + fees

        if posted_at.date() >= tax_year_start:
            ytd_income += gross
            ytd_deductible_fees += commission + fees

        for booking in payout.get("bookings", []):
            client_type = (booking.get("client_type") or "").strip().lower()
            booking_commission = Decimal(booking["commission"])
            if client_type == "new":
                new_count += 1
                new_commission += booking_commission
            else:
                repeat_count += 1
                repeat_commission += booking_commission

    return PersonaMetrics(
        fees_this_month=str(fees_this_month),
        gross_turnover_vat_safe=str(gross_turnover_vat_safe),
        ytd_income=str(ytd_income),
        ytd_deductible_fees=str(ytd_deductible_fees),
        new_vs_repeat=NewVsRepeat(
            new=NewVsRepeatBucket(count=new_count, commission=str(new_commission)),
            repeat=NewVsRepeatBucket(count=repeat_count, commission=str(repeat_commission)),
        ),
    )


def compute_run_history(state_dir: Path) -> list[RunHistoryEntry] | None:
    posted = _read_json(state_dir / "posted.json", {})
    audit_entries = _read_json(state_dir / "audit.json", [])

    if not posted and not audit_entries:
        return None

    all_hashes = set(posted.keys()) | {
        e.get("file_hash") for e in audit_entries if e.get("file_hash")
    }

    results: list[RunHistoryEntry] = []

    for file_hash in all_hashes:
        entry = posted.get(file_hash, {})
        completed = set(entry.get("completed_steps", []))
        hash_audit = [e for e in audit_entries if e.get("file_hash") == file_hash]
        proposal = _load_proposal(state_dir, file_hash)
        expected_kinds = (
            {step["kind"] for step in proposal["plan"]["steps"]} if proposal else None
        )
        payout_ref = proposal["payout"]["payout_ref"] if proposal else None
        net = proposal["payout"]["net"] if proposal else None

        write_events = [e for e in hash_audit if e.get("action") != "skipped-idempotent"]

        if write_events or completed:
            status: str | None = None
            if expected_kinds is not None and expected_kinds.issubset(completed):
                status = "posted"
            elif completed:
                status = "partial"
            elif any(e.get("status") == "error" for e in write_events):
                status = "failed"

            if status is not None:
                timestamp = max(e["timestamp"] for e in write_events) if write_events else None
                results.append(
                    RunHistoryEntry(
                        hash=file_hash[:12],
                        status=status,
                        payout_ref=payout_ref,
                        timestamp=timestamp,
                        net=net,
                    )
                )

        for e in hash_audit:
            if e.get("action") == "skipped-idempotent":
                results.append(
                    RunHistoryEntry(
                        hash=file_hash[:12],
                        status="skipped-idempotent",
                        payout_ref=payout_ref,
                        timestamp=e.get("timestamp"),
                        net=net,
                    )
                )

    results.sort(key=lambda r: r.timestamp or "", reverse=True)
    return results
