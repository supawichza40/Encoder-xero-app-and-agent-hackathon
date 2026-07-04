"""
Audit trail: append-only log in state/audit.json.

Each entry:
{
    "timestamp": "2026-07-04T15:30:00Z",
    "file_hash": "abc123...",
    "action": "create-invoice",
    "request": { ... },
    "xero_id": "INV-0042",
    "status": "success"
}
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _audit_file() -> Path:
    from .config import STATE_DIR
    return STATE_DIR / "audit.json"


def _read() -> list[dict[str, Any]]:
    path = _audit_file()
    if not path.exists() or path.stat().st_size == 0:
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _write(entries: list[dict[str, Any]]) -> None:
    path = _audit_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(entries, indent=2), encoding="utf-8")


def append_entry(
    file_hash: str,
    action: str,
    request: dict[str, Any],
    xero_id: str | None,
    status: str,
) -> None:
    """Append one audit entry to audit.json."""
    entries = _read()
    entries.append(
        {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "file_hash": file_hash,
            "action": action,
            "request": request,
            "xero_id": xero_id,
            "status": status,
        }
    )
    _write(entries)


def get_entries(file_hash: str) -> list[dict[str, Any]]:
    """Return all audit entries for a given file hash."""
    return [e for e in _read() if e.get("file_hash") == file_hash]


def get_trace_panel(file_hash: str) -> list[dict[str, Any]]:
    """
    Return audit entries shaped for the Transaction Trace panel.
    Same shape as get_entries — the frontend renders them directly.
    """
    return get_entries(file_hash)
