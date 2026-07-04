"""
Idempotency manager: sha256(file_bytes) → step-map in state/posted.json.

Step-map structure per hash:
{
    "invoice_id": "INV-0042",
    "bank_txn_id": "BT-0117",
    "payment_id": "PMT-0089",
    "completed_steps": ["create-invoice", "create-bank-transaction", "create-payment"],
    "clearing_balance": "0.00"
}

A crash after write 1 → re-run skips write 1 and executes writes 2-3 only.
"""

import hashlib
import json
from pathlib import Path
from typing import Any

from .models import JournalPlan, PlanStep, StepKind

_STEP_ID_MAP = {
    StepKind.CREATE_INVOICE: "invoice_id",
    StepKind.CREATE_BANK_TRANSACTION: "bank_txn_id",
    StepKind.CREATE_PAYMENT: "payment_id",
}


def _state_file() -> Path:
    from .config import STATE_DIR
    return STATE_DIR / "posted.json"


def _read() -> dict[str, Any]:
    path = _state_file()
    if not path.exists() or path.stat().st_size == 0:
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _write(data: dict[str, Any]) -> None:
    path = _state_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def compute_file_hash(file_bytes: bytes) -> str:
    """Return the sha256 hex digest of the file contents."""
    return hashlib.sha256(file_bytes).hexdigest()


def check_already_posted(file_hash: str) -> dict[str, Any] | None:
    """
    Return the step-map for this hash if it exists, else None.
    A truthy result means at least one step was previously completed.
    """
    return _read().get(file_hash)


def record_step(file_hash: str, step_kind: str, xero_id: str) -> None:
    """
    Record a completed step in posted.json.
    Safe to call multiple times for the same step (idempotent write).
    """
    data = _read()
    entry = data.setdefault(file_hash, {"completed_steps": []})

    kind = StepKind(step_kind)
    id_key = _STEP_ID_MAP[kind]
    entry[id_key] = xero_id

    if step_kind not in entry["completed_steps"]:
        entry["completed_steps"].append(step_kind)

    _write(data)


def record_clearing_balance(file_hash: str, balance: str) -> None:
    """Store the verified clearing balance alongside the step-map."""
    data = _read()
    entry = data.setdefault(file_hash, {"completed_steps": []})
    entry["clearing_balance"] = balance
    _write(data)


def get_remaining_steps(file_hash: str, plan: JournalPlan) -> list[PlanStep]:
    """Return only the plan steps not yet recorded as completed."""
    entry = check_already_posted(file_hash) or {}
    completed: list[str] = entry.get("completed_steps", [])
    return [step for step in plan.steps if step.kind.value not in completed]


def all_steps_complete(file_hash: str, plan: JournalPlan) -> bool:
    """True when every step in the plan is recorded as complete."""
    return len(get_remaining_steps(file_hash, plan)) == 0


def get_step_ids(file_hash: str) -> dict[str, str | None]:
    """Return the stored Xero IDs for all three steps."""
    entry = check_already_posted(file_hash) or {}
    return {
        "invoice_id": entry.get("invoice_id"),
        "bank_txn_id": entry.get("bank_txn_id"),
        "payment_id": entry.get("payment_id"),
        "clearing_balance": entry.get("clearing_balance"),
        "completed_steps": entry.get("completed_steps", []),
    }
