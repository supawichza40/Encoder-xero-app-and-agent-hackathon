"""
Shared filesystem-path-safety guard for file_hash values.

file_hash is joined into a filesystem path in three places — main.py's
_load_proposal, audit_export.py (payout_ref lookup + evidence pack), and
dashboard_metrics.py's _load_proposal — so anything containing `../`, `/`,
`.` etc. must never reach the filesystem. One shared helper avoids the guard
drifting out of sync across call sites.
"""


def is_valid_hash(file_hash: str | None) -> bool:
    """True when file_hash is a non-empty, <=64-char, all-lowercase-hex string."""
    return bool(file_hash) and len(file_hash) <= 64 and all(
        c in "0123456789abcdef" for c in file_hash
    )
