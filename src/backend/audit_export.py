"""
Audit export + evidence pack — read-only aggregation over local state.

Pure functions, each taking an explicit `state_dir: Path` (mirrors the pattern
already used across the module: `.config` is never imported here so tests
can point at any tmp_path without monkeypatching this module directly).
"""

import csv
import io
import json
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any


def _is_valid_hash(file_hash: str) -> bool:
    """Same guard as main.py's _load_proposal(): hex-only chars, len <= 64.

    file_hash is joined into a filesystem path below, so anything containing
    `../`, `/`, `.` etc. must never reach the filesystem.
    """
    return bool(file_hash) and len(file_hash) <= 64 and all(
        c in "0123456789abcdef" for c in file_hash
    )


def load_audit_entries(state_dir: Path) -> list[dict[str, Any]]:
    """Return the full audit.json array, or [] if the file is missing/empty."""
    path = Path(state_dir) / "audit.json"
    if not path.exists() or path.stat().st_size == 0:
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _load_payout_ref(state_dir: Path, file_hash: str | None) -> str:
    """Look up payout_ref via proposals/<hash>.json; '' if missing/invalid."""
    if not file_hash or not _is_valid_hash(file_hash):
        return ""
    proposal_path = Path(state_dir) / "proposals" / f"{file_hash}.json"
    if not proposal_path.exists():
        return ""
    try:
        data = json.loads(proposal_path.read_text(encoding="utf-8"))
        return data.get("payout", {}).get("payout_ref") or ""
    except Exception:
        return ""


def _flatten_request(request: dict[str, Any] | None) -> str:
    """'key1=value1, key2=value2' in dict-iteration order; '' if empty/missing."""
    if not request:
        return ""
    return ", ".join(f"{k}={v}" for k, v in request.items())


def entries_to_csv(entries: list[dict[str, Any]], state_dir: Path) -> str:
    """
    Render audit entries as CSV text.

    Columns exactly: timestamp,action,payout_ref,xero_id,status,summary
    Uses the csv module so a comma inside `summary` round-trips correctly.
    """
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["timestamp", "action", "payout_ref", "xero_id", "status", "summary"])
    for entry in entries:
        payout_ref = _load_payout_ref(state_dir, entry.get("file_hash"))
        xero_id = entry.get("xero_id") or ""
        summary = _flatten_request(entry.get("request"))
        writer.writerow(
            [
                entry.get("timestamp", ""),
                entry.get("action", ""),
                payout_ref,
                xero_id,
                entry.get("status", ""),
                summary,
            ]
        )
    return buf.getvalue()


def build_evidence_pack(state_dir: Path, file_hash: str) -> dict[str, Any] | None:
    """
    Build the evidence pack dict for a posted file_hash.

    Returns None when the hash is malformed, unknown, or its proposal record
    is missing — the caller (GET /evidence-pack/{file_hash}) turns None
    into a 404.
    """
    if not _is_valid_hash(file_hash):
        return None

    posted_path = Path(state_dir) / "posted.json"
    if not posted_path.exists() or posted_path.stat().st_size == 0:
        return None
    posted = json.loads(posted_path.read_text(encoding="utf-8"))
    posted_entry = posted.get(file_hash)
    if posted_entry is None:
        return None

    proposal_path = Path(state_dir) / "proposals" / f"{file_hash}.json"
    if not proposal_path.exists():
        return None
    try:
        proposal = json.loads(proposal_path.read_text(encoding="utf-8"))
        payout = proposal["payout"]
    except Exception:
        return None

    clearing_balance = posted_entry.get("clearing_balance")
    verified = False
    if clearing_balance is not None:
        try:
            verified = Decimal(str(clearing_balance)) == Decimal("0.00")
        except Exception:
            verified = False

    return {
        "payout_ref": payout.get("payout_ref", ""),
        "csv_sha256": file_hash,
        "xero_ids": {
            "invoice_id": posted_entry.get("invoice_id"),
            "bank_txn_id": posted_entry.get("bank_txn_id"),
            "payment_id": posted_entry.get("payment_id"),
            "credit_note_id": posted_entry.get("credit_note_id"),
        },
        "amounts": {
            "gross": str(payout.get("gross", "0")),
            "commission": str(payout.get("commission", "0")),
            "fees": str(payout.get("fees", "0")),
            "refunds": str(payout.get("refunds", "0")),
            "net": str(payout.get("net", "0")),
        },
        "clearing_balance": clearing_balance,
        "verified": verified,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
