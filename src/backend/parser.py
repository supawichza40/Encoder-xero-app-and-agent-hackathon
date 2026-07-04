"""
Deterministic CSV parser for the MarketplaceCo payout settlement format.

Expected CSV structure:
  Row 0 (header): PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
  Row 1 (summary): MC-PAYOUT-0407,16-30 Jun 2026,1340.00,445.90,47.10,0.00,847.00
  Row 2 (booking header): BookingDate,Client,ClientType,Service,GrossAmount,CommissionRate,Commission
  Rows 3+ : individual booking rows

No LLM inference — column positions are hardcoded.
"""

import csv
import io
from decimal import Decimal, InvalidOperation

from .models import BookingRow, CanonicalPayout

# Column indices for the summary row
_SUMMARY_PAYOUT_REF = 0
_SUMMARY_PERIOD = 1
_SUMMARY_GROSS = 2
_SUMMARY_COMMISSION = 3
_SUMMARY_FEES = 4
_SUMMARY_REFUNDS = 5
_SUMMARY_NET = 6

# Column indices for booking rows
_BOOKING_DATE = 0
_BOOKING_CLIENT = 1
_BOOKING_CLIENT_TYPE = 2
_BOOKING_SERVICE = 3
_BOOKING_GROSS = 4
_BOOKING_RATE = 5
_BOOKING_COMMISSION = 6

SUMMARY_HEADER = "PayoutRef"
BOOKING_HEADER = "BookingDate"


def parse_payout_csv(file_bytes: bytes) -> CanonicalPayout:
    """
    Parse a marketplace payout CSV into a CanonicalPayout.

    Raises ValueError on:
    - Empty file
    - Missing expected headers
    - Non-numeric amounts
    - Invariant violation (gross - commission - fees - refunds != net)
    """
    if not file_bytes:
        raise ValueError("CSV parse error: empty file")

    # Strip UTF-8 BOM if present and normalise line endings
    text = file_bytes.decode("utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    reader = csv.reader(io.StringIO(text))
    rows = [row for row in reader if any(cell.strip() for cell in row)]

    if len(rows) < 2:
        raise ValueError("CSV parse error: missing summary row")

    # Validate summary header
    if not rows[0] or rows[0][0].strip() != SUMMARY_HEADER:
        raise ValueError(
            f"CSV parse error: expected header row starting with '{SUMMARY_HEADER}', "
            f"got '{rows[0][0] if rows[0] else ''}'"
        )

    summary = [cell.strip() for cell in rows[1]]
    if len(summary) < 7:
        raise ValueError(
            f"CSV parse error: summary row has {len(summary)} columns, expected 7"
        )

    try:
        gross = Decimal(summary[_SUMMARY_GROSS])
        commission = Decimal(summary[_SUMMARY_COMMISSION])
        fees = Decimal(summary[_SUMMARY_FEES])
        refunds = Decimal(summary[_SUMMARY_REFUNDS])
        net = Decimal(summary[_SUMMARY_NET])
    except InvalidOperation as exc:
        raise ValueError(f"CSV parse error: non-numeric amount — {exc}") from exc

    payout_ref = summary[_SUMMARY_PAYOUT_REF]
    period = summary[_SUMMARY_PERIOD]

    # Parse booking rows (everything after the booking header row)
    bookings: list[BookingRow] = []
    booking_section = False
    for row in rows[2:]:
        cells = [c.strip() for c in row]
        if not cells or cells[0] == BOOKING_HEADER:
            booking_section = True
            continue
        if not booking_section:
            booking_section = True  # treat rows after summary as bookings

        if len(cells) < 7:
            continue  # skip short/blank rows

        try:
            bookings.append(
                BookingRow(
                    date=cells[_BOOKING_DATE],
                    client=cells[_BOOKING_CLIENT],
                    client_type=cells[_BOOKING_CLIENT_TYPE],
                    service=cells[_BOOKING_SERVICE],
                    gross_amount=Decimal(cells[_BOOKING_GROSS]),
                    commission_rate=cells[_BOOKING_RATE],
                    commission=Decimal(cells[_BOOKING_COMMISSION]),
                )
            )
        except (InvalidOperation, IndexError):
            # Non-numeric booking rows are skipped silently
            continue

    # CanonicalPayout model_validator fires the invariant check here
    try:
        return CanonicalPayout(
            payout_ref=payout_ref,
            period=period,
            gross=gross,
            commission=commission,
            fees=fees,
            refunds=refunds,
            net=net,
            bookings=bookings,
        )
    except Exception as exc:
        raise ValueError(str(exc)) from exc
