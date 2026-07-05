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
});
