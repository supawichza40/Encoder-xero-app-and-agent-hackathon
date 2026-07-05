// Real CSV bytes for the one-click sample buttons.
//
// These are byte-exact copies of the locked backend fixtures
// (src/data/marketplaceco-payout-0407.csv / …-2107.csv, LF line endings,
// trailing newline) so that in Live mode POST /propose parses them with the
// real deterministic parser and produces the same sha256 as the owner's
// manual golden-path run. In Demo mode the mock proposer routes on filename
// only, so real content is harmless there.
//
// lastModified is pinned so repeat clicks of a sample button hash
// identically in the mock layer (name:size:lastModified), keeping the
// idempotency showcase deterministic in both modes.

export const GOLDEN_SAMPLE_CSV = `PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
MC-PAYOUT-0407,16-30 Jun 2026,1340.00,445.90,47.10,0.00,847.00
BookingDate,Client,ClientType,Service,GrossAmount,CommissionRate,Commission
2026-06-17,Client A,New,Cut & Colour,180.00,35%,63.00
2026-06-18,Client B,New,Full Head Highlights,260.00,35%,91.00
2026-06-19,Client C,New,Balayage,240.00,35%,84.00
2026-06-20,Client D,Repeat,Blow Dry,26.00,0%,0.00
2026-06-21,Client E,New,Colour Correction,220.00,35%,77.00
2026-06-24,Client F,New,Cut & Colour,200.00,35%,70.00
2026-06-25,Client G,Repeat,Cut & Finish,22.00,0%,0.00
2026-06-26,Client H,New,Highlights,174.00,35%,60.90
2026-06-28,Client I,Repeat,Fringe Trim,18.00,0%,0.00
`;

export const REFUND_SAMPLE_CSV = `PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
MC-PAYOUT-2107,1-15 Jul 2026,1180.00,383.50,41.50,60.00,695.00
BookingDate,Client,ClientType,Service,GrossAmount,CommissionRate,Commission
2026-07-01,Client J,New,Cut & Colour,180.00,35%,63.00
2026-07-02,Client K,New,Full Head Highlights,240.00,35%,84.00
2026-07-03,Client L,New,Balayage,220.00,35%,77.00
2026-07-04,Client M,Repeat,Blow Dry,28.00,0%,0.00
2026-07-05,Client N,New,Cut & Colour,200.00,35%,70.00
2026-07-07,Client O,Repeat,Cut & Finish,22.00,0%,0.00
2026-07-08,Client P,New,Colour Correction,160.00,35%,56.00
2026-07-09,Client Q,Repeat,Fringe Trim,18.00,0%,0.00
2026-07-10,Client R,New,Highlights,112.00,35%,39.20
`;

// Fixed timestamp (2026-07-04T00:00:00Z) so mock hashing is stable per sample.
const SAMPLE_LAST_MODIFIED = 1783209600000;

export function makeSampleFile(kind: "golden" | "refund"): File {
  const isRefund = kind === "refund";
  // Filename must keep "2107" for the refund sample — the Demo-mode mock
  // proposer routes the 4-write credit-note flow on it.
  const name = isRefund ? "MC-Payout-2107-refunds.csv" : "MC-Payout-0407.csv";
  const content = isRefund ? REFUND_SAMPLE_CSV : GOLDEN_SAMPLE_CSV;
  return new File([content], name, {
    type: "text/csv",
    lastModified: SAMPLE_LAST_MODIFIED,
  });
}
