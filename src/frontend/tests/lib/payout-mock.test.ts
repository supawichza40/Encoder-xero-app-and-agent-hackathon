import { beforeEach, describe, expect, it } from "vitest";
import {
  mockAuditExport,
  mockDashboard,
  mockEvidencePack,
  mockPropose,
  resetMockState,
} from "@/lib/payout-mock";

function csvFile(name: string) {
  return new File(["a,b,c"], name, { type: "text/csv", lastModified: 1 });
}

describe("payout-mock — CONTRACT.md §1 persona_metrics + run_history", () => {
  it("mockDashboard returns persona_metrics matching the frozen contract demo figures", async () => {
    const dash = await mockDashboard();
    expect(dash.persona_metrics).not.toBeNull();
    expect(dash.persona_metrics).toMatchObject({
      fees_this_month: "493.00",
      gross_turnover_vat_safe: "1340.00",
      ytd_income: "1340.00",
      ytd_deductible_fees: "493.00",
      new_vs_repeat: {
        new: { count: 3, commission: "334.43" },
        repeat: { count: 2, commission: "111.47" },
      },
    });
  });

  it("new_vs_repeat commission splits sum to the total commission (£445.90)", async () => {
    const dash = await mockDashboard();
    const nv = dash.persona_metrics!.new_vs_repeat;
    const sum = Number(nv.new.commission) + Number(nv.repeat.commission);
    expect(sum).toBeCloseTo(445.9, 2);
  });

  it("mockDashboard returns a non-empty run_history with valid status values", async () => {
    const dash = await mockDashboard();
    expect(dash.run_history).not.toBeNull();
    expect(dash.run_history!.length).toBeGreaterThan(0);
    const validStatuses = ["posted", "failed", "skipped-idempotent", "partial"];
    for (const entry of dash.run_history!) {
      expect(validStatuses).toContain(entry.status);
      expect(entry.hash).toBeTruthy();
      expect(entry.payout_ref).toBeTruthy();
      expect(entry.net).toBeTruthy();
    }
  });
});

describe("payout-mock — GET /audit/export (PRI-1)", () => {
  it("returns CSV with the contract's exact header row", async () => {
    const res = await mockAuditExport("csv");
    expect(res.contentType).toBe("text/csv");
    expect(res.filename).toMatch(/\.csv$/);
    const [header] = res.content.split("\n");
    expect(header).toBe("timestamp,action,payout_ref,xero_id,status,summary");
  });

  it("returns valid JSON array for format=json", async () => {
    const res = await mockAuditExport("json");
    expect(res.contentType).toBe("application/json");
    const parsed = JSON.parse(res.content) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("defaults to csv format when none is given", async () => {
    const res = await mockAuditExport();
    expect(res.contentType).toBe("text/csv");
  });
});

describe("payout-mock — GET /evidence-pack/{hash} (PRI-2)", () => {
  beforeEach(() => {
    resetMockState();
  });

  it("returns a full evidence pack for a hash that has been posted", async () => {
    const file = csvFile("golden-evidence.csv");
    const proposal = await mockPropose(file);
    // mockApprove marks it posted; simulate directly via propose+approve flow.
    const { mockApprove } = await import("@/lib/payout-mock");
    await mockApprove(proposal.file_hash);

    const pack = await mockEvidencePack(proposal.file_hash);
    expect(pack).not.toBeNull();
    expect(pack).toMatchObject({
      payout_ref: "MC-PAYOUT-0407",
      amounts: {
        gross: "1340.00",
        commission: "445.90",
        fees: "47.10",
        refunds: "0.00",
        net: "847.00",
      },
      clearing_balance: "0.00",
      verified: true,
    });
    expect(pack!.xero_ids.invoice_id).toBeTruthy();
    expect(pack!.csv_sha256).toBeTruthy();
  });

  it("returns null (404 equivalent) for an unknown hash", async () => {
    const pack = await mockEvidencePack("mock-doesnotexist");
    expect(pack).toBeNull();
  });

  it("sets credit_note_id only for a refund statement", async () => {
    const file = csvFile("2107-refund-evidence.csv");
    const proposal = await mockPropose(file);
    const { mockApprove } = await import("@/lib/payout-mock");
    await mockApprove(proposal.file_hash);

    const pack = await mockEvidencePack(proposal.file_hash);
    expect(pack!.xero_ids.credit_note_id).toBeTruthy();
  });
});
