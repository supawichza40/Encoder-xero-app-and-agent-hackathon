from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# ── Xero credentials ───────────────────────────────────────────────────────
XERO_CLIENT_ID: str = os.getenv("XERO_CLIENT_ID", "")
XERO_CLIENT_SECRET: str = os.getenv("XERO_CLIENT_SECRET", "")
# A client-credentials Custom Connection must request the token with NO scope:
# the umbrella auth-code scopes (accounting.transactions, accounting.reports.read,
# offline_access…) fail with invalid_scope. When scope is omitted, Xero mints a
# token carrying the connection's own granular scopes (invoices, banktransactions,
# payments, contacts, settings, reports.*). Default to empty and pass empty through —
# never fall back to the umbrella string.
XERO_SCOPES: str = os.getenv("XERO_SCOPES", "")

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
STATE_DIR = BASE_DIR / "state"
DATA_DIR = BASE_DIR / "data"

# ── Xero account constants (Demo Company UK chart, verified live 2026-07-05) ─
# Platform Clearing is a real BANK account (created via raw REST — MCP has no
# create-account tool). BANK type is required so fees can be SPENT from it and
# the invoice payment can be received INTO it.
CLEARING_ACCOUNT_CODE = "092"
CLEARING_ACCOUNT_NAME = "Platform Clearing"
CLEARING_BANK_ACCOUNT_NUMBER = "00000000"  # dummy — BANK accounts require one
# Reuse the Demo Company's existing "Bank Fees" overhead account for the
# marketplace commission + fees expense (minimises tenant changes).
FEES_ACCOUNT_CODE = "404"
FEES_ACCOUNT_NAME = "Bank Fees"
# Invoice lines post to real revenue so turnover is recognised on the P&L.
REVENUE_ACCOUNT_CODE = "200"
REVENUE_ACCOUNT_NAME = "Sales"
# The business's real bank account the marketplace net deposit lands in.
BANK_ACCOUNT_CODE = "090"
BANK_ACCOUNT_NAME = "Business Bank Account"
CONTACT_NAME = "MarketplaceCo (Marketplace)"

# Golden path (0407) — net deposit seeded as a bank transfer
# Platform Clearing → Business Bank (Dr Bank / Cr Clearing).
PAYOUT_REFERENCE = "MC-PAYOUT-0407"
NET_DEPOSIT_AMOUNT = "847.00"

# Refund path (2107) — second net deposit for E1 demo. NOT seeded by default:
# a second pre-seeded deposit would leave Platform Clearing at -695 after the
# golden path and break its zero-balance verification. Set SEED_REFUND_DEPOSIT
# =true and re-run the seed just before demoing the refund CSV.
REFUND_PAYOUT_REFERENCE = "MC-PAYOUT-2107"
REFUND_NET_DEPOSIT_AMOUNT = "695.00"
SEED_REFUND_DEPOSIT = os.getenv("SEED_REFUND_DEPOSIT", "false").lower() == "true"

# ── E3 — Channel tracking category ────────────────────────────────────────
TRACKING_CATEGORY = "Channel"
TRACKING_OPTION = "MarketplaceCo"

# ── CORS ──────────────────────────────────────────────────────────────────
# Comma-separated list of allowed origins.  Set to "*" during a demo where
# the backend is exposed via ngrok/tunnel so Make's HTTP module can reach it.
_cors_env = os.getenv("CORS_ALLOW_ORIGINS", "")
CORS_ALLOW_ORIGINS: list[str] = (
    [o.strip() for o in _cors_env.split(",") if o.strip()]
    if _cors_env.strip()
    else [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:8080",
    ]
)

# ── Dev flags ─────────────────────────────────────────────────────────────
ALLOW_SEED = os.getenv("ALLOW_SEED", "true").lower() == "true"


def require_xero_creds() -> None:
    """Raise at startup if Xero credentials are missing."""
    missing = [
        k for k, v in {
            "XERO_CLIENT_ID": XERO_CLIENT_ID,
            "XERO_CLIENT_SECRET": XERO_CLIENT_SECRET,
        }.items()
        if not v
    ]
    if missing:
        raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")
