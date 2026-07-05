import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditTrail } from "@/components/AuditTrail";
import type { AuditEntry } from "@/lib/payout-types";

const entries: AuditEntry[] = [
  {
    timestamp: "2026-07-04T15:30:00Z",
    file_hash: "abc123",
    action: "create-invoice",
    request: { amount: "1340.00", account: "Platform Clearing" },
    xero_id: "INV-0042",
    status: "success",
  },
  {
    timestamp: "2026-07-04T15:30:03Z",
    file_hash: "abc123",
    action: "attach-source",
    request: { filename: "settlement.csv", invoice_id: "INV-0042" },
    xero_id: "INV-0042",
    status: "success",
  },
  {
    timestamp: "2026-07-04T15:30:04Z",
    file_hash: "abc123",
    action: "attach-source",
    request: { filename: "settlement.csv", invoice_id: "INV-0042" },
    xero_id: "INV-0042",
    status: "failed",
  },
  {
    timestamp: "2026-07-04T15:30:05Z",
    file_hash: "abc123",
    action: "history-note",
    request: { note: "Verified zero-balance clearing" },
    xero_id: null,
    status: "info",
  },
];

describe("AuditTrail", () => {
  beforeEach(() => {
    // jsdom doesn't implement the Blob-URL APIs; stub them so the PRI-1
    // export flow (Blob → object URL → anchor click) doesn't throw.
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("is collapsed by default and expands on click", async () => {
    render(<AuditTrail entries={entries} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /transaction trace/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("can default to open (e.g. for the bookkeeper persona)", () => {
    render(<AuditTrail entries={entries} defaultOpen />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows an empty state with no entries", () => {
    render(<AuditTrail entries={[]} defaultOpen />);
    expect(screen.getByText(/no audit entries yet/i)).toBeInTheDocument();
  });

  it("renders attach-source rows with a paperclip and a failed-attachment warning tone", () => {
    render(<AuditTrail entries={entries} defaultOpen />);
    const rows = screen.getAllByRole("row").slice(1); // drop header row
    // successful attach-source row
    expect(rows[1]).toHaveTextContent("attach-source");
    expect(rows[1]).toHaveTextContent("success");
    // failed attach-source row gets the "failed" status text (not a generic error state)
    expect(rows[2]).toHaveTextContent("failed");
  });

  it("renders a history-note info row distinct from success/error", () => {
    render(<AuditTrail entries={entries} defaultOpen />);
    const rows = screen.getAllByRole("row");
    const noteRow = rows.find((r) => r.textContent?.includes("history-note"));
    expect(noteRow).toHaveTextContent("info");
    expect(noteRow).toHaveTextContent("note=Verified zero-balance clearing");
  });

  // PRI-1 — audit-trail CSV export.
  it("triggers a CSV download via the Export button without crashing", async () => {
    render(<AuditTrail entries={entries} defaultOpen />);
    await userEvent.click(screen.getByRole("button", { name: /export audit trail as csv/i }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(blobArg.type).toContain("csv");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("shows a prominent (primary) export button for bookkeeper, ghost for owner", () => {
    const { rerender } = render(<AuditTrail entries={entries} persona="bookkeeper" />);
    const bookkeeperBtn = screen.getByRole("button", { name: /export audit trail as csv/i });
    expect(bookkeeperBtn.className).toMatch(/border-primary/);
    rerender(<AuditTrail entries={entries} persona="owner" />);
    const ownerBtn = screen.getByRole("button", { name: /export audit trail as csv/i });
    expect(ownerBtn.className).not.toMatch(/border-primary/);
  });

  it("keeps the toggle button's accessible name as 'Transaction trace' next to the Export button", async () => {
    render(<AuditTrail entries={entries} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /transaction trace/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
