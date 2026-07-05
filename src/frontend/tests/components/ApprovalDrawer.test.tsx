import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApprovalDrawer } from "@/components/ApprovalDrawer";
import { PERSONA_COPY } from "@/lib/personaTheme";
import type { Persona } from "@/lib/useDemoAuth";
import { mockPayout, mockPlan } from "../mocks/data";
import type { CanonicalPayout, JournalPlan } from "@/lib/payout-types";

const payout = mockPayout as unknown as CanonicalPayout;
const plan = mockPlan as unknown as JournalPlan;

const refundPayout: CanonicalPayout = {
  ...payout,
  payout_ref: "MC-PAYOUT-2107",
  refunds: "60.00",
};

const refundPlan: JournalPlan = {
  invariant_check: true,
  steps: [
    {
      kind: "create-invoice",
      amount: "1180.00",
      account: "Platform Clearing",
      lines: null,
      clears: null,
    },
    {
      kind: "create-credit-note",
      amount: "60.00",
      account: "Platform Clearing",
      lines: null,
      clears: null,
    },
    {
      kind: "create-bank-transaction",
      amount: "425.00",
      account: "Platform Clearing",
      lines: null,
      clears: null,
    },
    {
      kind: "create-payment",
      amount: "695.00",
      account: null,
      lines: null,
      clears: "MC-PAYOUT-2107",
    },
  ],
};

describe("ApprovalDrawer", () => {
  it("renders the 3-step golden path plan with correct summary figures", () => {
    const { container } = render(
      <ApprovalDrawer payout={payout} plan={plan} fileHash="abc123def456" onApprove={vi.fn()} />,
    );
    expect(screen.getByText(/Review payout MC-PAYOUT-0407/)).toBeInTheDocument();
    // Gross/net also repeat in the equation line below the summary, so assert
    // presence via getAllByText rather than a single-match getByText.
    expect(screen.getAllByText("£1,340.00").length).toBeGreaterThan(0);
    expect(screen.getByText("£445.90")).toBeInTheDocument();
    expect(screen.getByText("£47.10")).toBeInTheDocument();
    expect(screen.getAllByText("£847.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Refunds")).not.toBeInTheDocument();
    expect(screen.getByText(/balanced/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`booking detail \\(${payout.bookings.length}\\)`, "i")),
    ).toBeInTheDocument();
    // 3 Xero writes listed. The "Clear <amount> against..." line has the
    // amount in a nested <span>, so getByText's node-local text matcher
    // won't see the full sentence — assert on the rendered container text
    // instead of a text-node query for that one.
    expect(screen.getByText(/Create a gross revenue invoice/)).toBeInTheDocument();
    expect(screen.getByText(/Book commission & fees/)).toBeInTheDocument();
    expect(container.textContent).toMatch(/Clear.*against your bank deposit/);
  });

  it("renders the 4-step refund plan with a Refunds cell and credit-note write", () => {
    render(
      <ApprovalDrawer
        payout={refundPayout}
        plan={refundPlan}
        fileHash="refundhash123"
        onApprove={vi.fn()}
      />,
    );
    expect(screen.getByText("Refunds")).toBeInTheDocument();
    expect(screen.getAllByText("£60.00").length).toBeGreaterThan(0);
    expect(screen.getByText(/Issue a credit note/)).toBeInTheDocument();
  });

  it("shows an invariant-failed state when the plan check fails", () => {
    render(
      <ApprovalDrawer
        payout={payout}
        plan={{ ...plan, invariant_check: false }}
        fileHash="abc123"
        onApprove={vi.fn()}
      />,
    );
    expect(screen.getByText(/invariant failed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
  });

  it("toggles the booking detail table", async () => {
    render(<ApprovalDrawer payout={payout} plan={plan} fileHash="abc123" onApprove={vi.fn()} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /booking detail/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Client A")).toBeInTheDocument();
  });

  it("calls onApprove when the approve button is clicked", async () => {
    const onApprove = vi.fn();
    render(<ApprovalDrawer payout={payout} plan={plan} fileHash="abc123" onApprove={onApprove} />);
    await userEvent.click(screen.getByRole("button", { name: /approve & post to xero/i }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("shows a posting spinner while loading and a posted state when approved", () => {
    const { rerender } = render(
      <ApprovalDrawer payout={payout} plan={plan} fileHash="abc123" onApprove={vi.fn()} loading />,
    );
    expect(screen.getByText(/posting to xero/i)).toBeInTheDocument();
    rerender(
      <ApprovalDrawer payout={payout} plan={plan} fileHash="abc123" onApprove={vi.fn()} approved />,
    );
    expect(screen.getByText(/posted to xero/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /posted to xero/i })).toBeDisabled();
  });

  it("honors a custom heading label", () => {
    render(
      <ApprovalDrawer
        payout={payout}
        plan={plan}
        fileHash="abc123"
        onApprove={vi.fn()}
        headingLabel="Writes with Xero IDs"
      />,
    );
    expect(screen.getByText("Writes with Xero IDs")).toBeInTheDocument();
  });

  // ALX-4 — plain-English approve confirmation, one exact string per persona.
  (["owner", "bookkeeper", "freelancer"] as Persona[]).forEach((persona) => {
    it(`shows the ${persona} approve confirmation verbatim before the write fires`, () => {
      render(
        <ApprovalDrawer
          payout={payout}
          plan={plan}
          fileHash="abc123"
          onApprove={vi.fn()}
          persona={persona}
        />,
      );
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent(PERSONA_COPY[persona].approveConfirmation);
    });
  });

  it("hides the approve confirmation once the write has been approved", () => {
    render(
      <ApprovalDrawer
        payout={payout}
        plan={plan}
        fileHash="abc123"
        onApprove={vi.fn()}
        persona="owner"
        approved
      />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // PRI-6 — sha256 dedupe badge, always present before approval.
  it("shows a SHA-256 new-statement badge with a truncated hash", () => {
    render(
      <ApprovalDrawer payout={payout} plan={plan} fileHash="abc123def456" onApprove={vi.fn()} />,
    );
    expect(screen.getByText(/SHA-256 abc123def4… · New statement/)).toBeInTheDocument();
  });

  // ALX-2 — freelancer invariant relabel (jargon-free).
  it("relabels the invariant badge to plain English for the freelancer persona", () => {
    render(
      <ApprovalDrawer
        payout={payout}
        plan={plan}
        fileHash="abc123"
        onApprove={vi.fn()}
        persona="freelancer"
      />,
    );
    expect(screen.getByText(/everything checks out/i)).toBeInTheDocument();
    expect(screen.queryByText(/^balanced$/i)).not.toBeInTheDocument();
  });

  it("keeps 'invariant failed' wording for owner/bookkeeper but relabels for freelancer", () => {
    const failedPlan = { ...plan, invariant_check: false };
    const { rerender } = render(
      <ApprovalDrawer
        payout={payout}
        plan={failedPlan}
        fileHash="abc123"
        onApprove={vi.fn()}
        persona="owner"
      />,
    );
    expect(screen.getByText(/invariant failed/i)).toBeInTheDocument();
    rerender(
      <ApprovalDrawer
        payout={payout}
        plan={failedPlan}
        fileHash="abc123"
        onApprove={vi.fn()}
        persona="freelancer"
      />,
    );
    expect(screen.getByText(/the numbers don't add up yet/i)).toBeInTheDocument();
  });
});
