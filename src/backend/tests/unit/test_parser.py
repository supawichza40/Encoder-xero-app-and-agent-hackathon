"""
Tier 1 unit tests: CSV Parser (P1-P12)
"""

from decimal import Decimal
from pathlib import Path

import pytest

from backend.parser import parse_payout_csv

GOLDEN = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "data"
    / "marketplaceco-payout-0407.csv"
)


@pytest.fixture
def golden_bytes() -> bytes:
    return GOLDEN.read_bytes()


# ── P1: Golden CSV parses ─────────────────────────────────────────────────
def test_P1_golden_parses(golden_bytes):
    p = parse_payout_csv(golden_bytes)
    assert p.gross == Decimal("1340.00")
    assert p.net == Decimal("847.00")
    assert len(p.bookings) == 9


# ── P2: Summary amounts match ──────────────────────────────────────────────
def test_P2_summary_amounts(golden_bytes):
    p = parse_payout_csv(golden_bytes)
    assert p.commission == Decimal("445.90")
    assert p.fees == Decimal("47.10")
    assert p.refunds == Decimal("0.00")


# ── P3: First booking row ──────────────────────────────────────────────────
def test_P3_first_booking(golden_bytes):
    p = parse_payout_csv(golden_bytes)
    b = p.bookings[0]
    assert b.client == "Client A"
    assert b.client_type == "New"
    assert b.service == "Cut & Colour"
    assert b.gross_amount == Decimal("180.00")
    assert b.commission == Decimal("63.00")


# ── P4: Tampered net rejects ───────────────────────────────────────────────
def test_P4_tampered_net_rejects(golden_bytes):
    tampered = golden_bytes.replace(b"847.00", b"846.00")
    with pytest.raises(ValueError):
        parse_payout_csv(tampered)


# ── P5: Tampered gross rejects ─────────────────────────────────────────────
def test_P5_tampered_gross_rejects(golden_bytes):
    tampered = golden_bytes.replace(b"1340.00", b"1350.00", 1)
    with pytest.raises(ValueError):
        parse_payout_csv(tampered)


# ── P6: Empty file rejects ─────────────────────────────────────────────────
def test_P6_empty_rejects():
    with pytest.raises(ValueError, match="empty"):
        parse_payout_csv(b"")


# ── P7: Header only — missing summary row rejects ─────────────────────────
def test_P7_header_only_rejects():
    csv = b"PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout\n"
    with pytest.raises(ValueError, match="CSV parse error"):
        parse_payout_csv(csv)


# ── P8: Wrong column count rejects ────────────────────────────────────────
def test_P8_wrong_column_count_rejects():
    # Summary row has fewer columns than expected (only 4)
    csv = b"PayoutRef,Period,GrossSales,NetPayout\nMC-001,Jun,1340.00,847.00\n"
    with pytest.raises(ValueError, match="CSV parse error"):
        parse_payout_csv(csv)


# ── P9: Non-numeric amount rejects ────────────────────────────────────────
def test_P9_non_numeric_rejects(golden_bytes):
    tampered = golden_bytes.replace(b",1340.00,", b",abc,")
    with pytest.raises(ValueError):
        parse_payout_csv(tampered)


# ── P10: UTF-8 BOM handled ─────────────────────────────────────────────────
def test_P10_bom_handled(golden_bytes):
    bom = b"\xef\xbb\xbf" + golden_bytes
    p = parse_payout_csv(bom)
    assert p.gross == Decimal("1340.00")


# ── P11: Windows line endings handled ─────────────────────────────────────
def test_P11_windows_line_endings(golden_bytes):
    crlf = golden_bytes.replace(b"\n", b"\r\n")
    p = parse_payout_csv(crlf)
    assert len(p.bookings) == 9


# ── P12: Trailing whitespace handled ──────────────────────────────────────
def test_P12_trailing_whitespace(golden_bytes):
    spaced = golden_bytes.replace(b"1340.00", b"1340.00  ")
    # The invariant should still hold (amount stripped)
    p = parse_payout_csv(spaced)
    assert p.gross == Decimal("1340.00")
