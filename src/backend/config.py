from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# ── Xero credentials ───────────────────────────────────────────────────────
XERO_CLIENT_ID: str = os.getenv("XERO_CLIENT_ID", "")
XERO_CLIENT_SECRET: str = os.getenv("XERO_CLIENT_SECRET", "")
XERO_SCOPES: str = os.getenv(
    "XERO_SCOPES",
    "accounting.transactions accounting.contacts accounting.settings "
    "accounting.reports.read offline_access",
)

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
STATE_DIR = BASE_DIR / "state"
DATA_DIR = BASE_DIR / "data"

# ── Xero account constants ─────────────────────────────────────────────────
CLEARING_ACCOUNT_CODE = "810"
CLEARING_ACCOUNT_NAME = "Platform Clearing"
FEES_ACCOUNT_CODE = "418"
FEES_ACCOUNT_NAME = "Platform Commission & Fees"
CONTACT_NAME = "MarketplaceCo (Marketplace)"
PAYOUT_REFERENCE = "MC-PAYOUT-0407"
NET_DEPOSIT_AMOUNT = "847.00"

# ── Dev flags ─────────────────────────────────────────────────────────────
ALLOW_SEED = os.getenv("ALLOW_SEED", "true").lower() == "true"


def require_xero_creds() -> None:
    """Raise at startup if Xero credentials are missing."""
    missing = [k for k, v in {"XERO_CLIENT_ID": XERO_CLIENT_ID, "XERO_CLIENT_SECRET": XERO_CLIENT_SECRET}.items() if not v]
    if missing:
        raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")
