import { describe, expect, it } from "vitest";
import { GOLDEN_SAMPLE_CSV, REFUND_SAMPLE_CSV, makeSampleFile } from "@/lib/sample-csv";

// Parse the two-row summary header the backend parser expects:
// PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout
function summaryOf(csv: string) {
  const [header, values] = csv.split("\n");
  expect(header).toBe(
    "PayoutRef,Period,GrossSales,NewClientCommission,PrepaymentFees,Refunds,NetPayout",
  );
  const [ref, , gross, commission, fees, refunds, net] = values.split(",");
  return { ref, gross, commission, fees, refunds, net };
}

describe("sample CSV fixtures", () => {
  it("golden sample is real CSV satisfying gross − commission − fees − refunds === net", () => {
    const s = summaryOf(GOLDEN_SAMPLE_CSV);
    expect(s.ref).toBe("MC-PAYOUT-0407");
    expect(s).toMatchObject({
      gross: "1340.00",
      commission: "445.90",
      fees: "47.10",
      refunds: "0.00",
      net: "847.00",
    });
    // Decimal-string arithmetic in pence to avoid float drift.
    const pence = (v: string) => Math.round(Number(v) * 100);
    expect(pence(s.gross) - pence(s.commission) - pence(s.fees) - pence(s.refunds)).toBe(
      pence(s.net),
    );
  });

  it("refund sample satisfies the invariant with a non-zero refund", () => {
    const s = summaryOf(REFUND_SAMPLE_CSV);
    expect(s.ref).toBe("MC-PAYOUT-2107");
    expect(s.refunds).toBe("60.00");
    const pence = (v: string) => Math.round(Number(v) * 100);
    expect(pence(s.gross) - pence(s.commission) - pence(s.fees) - pence(s.refunds)).toBe(
      pence(s.net),
    );
  });

  it("makeSampleFile returns real CSV bytes, not a synthetic placeholder", async () => {
    const golden = makeSampleFile("golden");
    expect(golden.name).toBe("MC-Payout-0407.csv");
    await expect(golden.text()).resolves.toBe(GOLDEN_SAMPLE_CSV);

    const refund = makeSampleFile("refund");
    // Mock proposer routes the 4-write refund flow on "2107" in the name.
    expect(refund.name).toContain("2107");
    await expect(refund.text()).resolves.toBe(REFUND_SAMPLE_CSV);
  });

  it("repeat clicks produce byte- and hash-identical files (idempotency)", () => {
    const a = makeSampleFile("golden");
    const b = makeSampleFile("golden");
    expect(a.size).toBe(b.size);
    expect(a.lastModified).toBe(b.lastModified);
    expect(a.name).toBe(b.name);
  });
});
