// Integration test: drives the real usePayoutBridge hook + the actual
// FileUpload / ApprovalDrawer / StepProgress / ClearingReconciliation
// components against the built-in mock layer (no route/router scaffolding
// needed — the golden path itself lives in usePayoutBridge + payout-mock).
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePayoutBridge } from "@/lib/usePayoutBridge";
import { resetMockState } from "@/lib/payout-mock";
import { FileUpload } from "@/components/FileUpload";
import { ApprovalDrawer } from "@/components/ApprovalDrawer";
import { StepProgress } from "@/components/StepProgress";
import { ClearingReconciliation } from "@/components/ClearingReconciliation";

function GoldenPathHarness() {
  const bridge = usePayoutBridge();
  const feesTotal = bridge.proposal
    ? (Number(bridge.proposal.payout.commission) + Number(bridge.proposal.payout.fees)).toFixed(2)
    : "0.00";
  return (
    <div>
      <FileUpload
        onFileSelected={(f) => void bridge.uploadFile(f)}
        loading={bridge.phase === "uploading"}
        error={bridge.phase === "error" ? bridge.error : null}
        compact={Boolean(bridge.proposal)}
      />
      {bridge.proposal?.plan ? (
        <ApprovalDrawer
          payout={bridge.proposal.payout}
          plan={bridge.proposal.plan}
          fileHash={bridge.proposal.file_hash}
          onApprove={() => void bridge.approve()}
          disabled={bridge.phase !== "proposed"}
          loading={bridge.phase === "approving"}
          approved={bridge.phase === "verified"}
        />
      ) : null}
      {bridge.approval ? (
        <StepProgress results={bridge.approval.results} steps={bridge.proposal?.plan?.steps} />
      ) : null}
      {bridge.phase === "verified" && bridge.approval ? (
        <ClearingReconciliation
          gross={bridge.proposal!.payout.gross}
          feesTotal={feesTotal}
          net={bridge.proposal!.payout.net}
          clearingBalance={bridge.approval.clearing_balance}
          verified={bridge.approval.verified}
        />
      ) : null}
    </div>
  );
}

describe("Full golden path — upload -> propose -> approve -> verify", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockState();
  });

  it("takes a CSV upload all the way to a verified, zero-balance clearing account", async () => {
    render(<GoldenPathHarness />);

    const file = new File(["a,b,c"], "MarketplaceCo-payout.csv", { type: "text/csv" });
    const input = screen
      .getByLabelText(/upload marketplace payout csv file/i)
      .querySelector("input")!;
    await userEvent.upload(input, file);

    // Proposal renders with the golden-path figures.
    await screen.findByText(/Review payout MC-PAYOUT-0407/);
    expect(screen.getAllByText("£1,340.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("£847.00").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /approve & post to xero/i }));

    // Step progress reaches "Posted to Xero" (the approve button also ends
    // up with this label once approved, so scope to the progress heading).
    await waitFor(
      () => expect(screen.getByRole("heading", { name: /^posted to xero$/i })).toBeInTheDocument(),
      { timeout: 5000 },
    );

    // Clearing account is zero and marked verified.
    await waitFor(() => {
      expect(screen.getByText(/fully reconciled/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText("£0.00")[0]).toBeInTheDocument();
  }, 10000);
});
