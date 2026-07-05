import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClearingReconciliation } from "@/components/ClearingReconciliation";

describe("ClearingReconciliation", () => {
  it("renders a verified zero-balance state", () => {
    render(
      <ClearingReconciliation
        gross="1340.00"
        feesTotal="493.00"
        net="847.00"
        clearingBalance="0.00"
        verified
      />,
    );
    expect(screen.getByText("£0.00")).toBeInTheDocument();
    expect(screen.getByText(/fully reconciled/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Verified zero")).toBeInTheDocument();
  });

  it("renders a non-zero/unverified warning state", () => {
    render(
      <ClearingReconciliation
        gross="1340.00"
        feesTotal="493.00"
        net="847.00"
        clearingBalance="12.34"
        verified={false}
      />,
    );
    expect(screen.getByText("£12.34")).toBeInTheDocument();
    expect(screen.getByText(/not zero — investigate/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Non-zero balance")).toBeInTheDocument();
  });

  // ALX-2 — jargon-free reskin for freelancer: same figures, reworded labels only.
  it("swaps to jargon-free labels for the freelancer persona while keeping the same figures", () => {
    const { container } = render(
      <ClearingReconciliation
        gross="1340.00"
        feesTotal="493.00"
        net="847.00"
        clearingBalance="0.00"
        verified
        persona="freelancer"
      />,
    );
    // same figures (gross/fees are bare text inside the equation line, so
    // assert on the rendered container text rather than a single-node query)
    expect(screen.getByText("£0.00")).toBeInTheDocument();
    expect(container.textContent).toContain("£1,340.00");
    expect(container.textContent).toContain("£493.00");
    // reworded, jargon-free copy
    expect(screen.queryByText(/platform clearing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^clearing account is fully reconciled\.$/i)).not.toBeInTheDocument();
    // "money moving through" appears twice (heading + balance label)
    expect(screen.getAllByText(/money moving through/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/nothing left in limbo/i)).toBeInTheDocument();
  });

  it("keeps the accounting labels for owner/bookkeeper (no persona regression)", () => {
    render(
      <ClearingReconciliation
        gross="1340.00"
        feesTotal="493.00"
        net="847.00"
        clearingBalance="0.00"
        verified
      />,
    );
    expect(screen.getByText(/live verification · platform clearing/i)).toBeInTheDocument();
    expect(screen.getByText(/fully reconciled/i)).toBeInTheDocument();
  });
});
