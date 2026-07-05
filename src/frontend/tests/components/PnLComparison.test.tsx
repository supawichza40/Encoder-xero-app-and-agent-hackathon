import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PnLComparison } from "@/components/PnLComparison";
import { mockPnlBefore, mockPnlAfter } from "../mocks/data";
import type { PnLSnapshot } from "@/lib/payout-types";

const before = mockPnlBefore as unknown as PnLSnapshot;
const after = mockPnlAfter as unknown as PnLSnapshot;

describe("PnLComparison", () => {
  it("shows placeholders while data is unavailable", () => {
    render(<PnLComparison before={null} after={null} />);
    expect(screen.getAllByText(/awaiting data/i)).toHaveLength(2);
  });

  it("renders before/after revenue, a positive delta, and a New commission badge", () => {
    render(<PnLComparison before={before} after={after} />);
    expect(screen.getByText("£1,340.00")).toBeInTheDocument(); // after revenue
    expect(screen.getByText("+£493.00")).toBeInTheDocument(); // revenue delta
    expect(screen.getByText("£493.00")).toBeInTheDocument(); // after commission expense
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("does not show a delta badge or a New tag when values are unchanged / already present", () => {
    render(<PnLComparison before={after} after={after} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("never shows a New badge on the Before card, even if it already has a commission figure", () => {
    // Before shouldn't ever be compared against anything — regression guard
    // for a bug where the Before card always showed "New" when it had any
    // commission_expense value, regardless of what "after" said.
    render(<PnLComparison before={after} after={after} />);
    const cards = screen.getAllByText(/^(Before|After)$/);
    expect(cards[0]).toHaveTextContent("Before");
    const beforeCard = cards[0].parentElement!;
    expect(beforeCard).not.toHaveTextContent("New");
  });
});
