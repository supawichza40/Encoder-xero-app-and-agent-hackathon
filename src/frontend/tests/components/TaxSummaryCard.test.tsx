import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaxSummaryCard } from "@/components/TaxSummaryCard";

describe("TaxSummaryCard", () => {
  it("renders the three plain-English figures from real proposal data", () => {
    render(<TaxSummaryCard income="1340.00" costs="493.00" takeHome="847.00" />);
    expect(screen.getByText("£1,340.00")).toBeInTheDocument();
    expect(screen.getByText("£493.00")).toBeInTheDocument();
    expect(screen.getByText("£847.00")).toBeInTheDocument();
    expect(screen.getByText(/income/i)).toBeInTheDocument();
    expect(screen.getByText(/costs you can claim/i)).toBeInTheDocument();
    expect(screen.getByText(/take-home/i)).toBeInTheDocument();
  });

  it("renders the plain summary line referencing all three figures", () => {
    const { container } = render(
      <TaxSummaryCard income="1340.00" costs="493.00" takeHome="847.00" />,
    );
    expect(container.textContent).toMatch(
      /Report the £1,340\.00, claim the £493\.00 — the £847\.00 is just what reached your bank\./,
    );
  });

  it("derives figures from whatever is passed in, not a hardcoded demo constant", () => {
    render(<TaxSummaryCard income="2000.00" costs="600.00" takeHome="1400.00" />);
    expect(screen.getByText("£2,000.00")).toBeInTheDocument();
    expect(screen.getByText("£600.00")).toBeInTheDocument();
    expect(screen.getByText("£1,400.00")).toBeInTheDocument();
    expect(screen.queryByText("£1,340.00")).not.toBeInTheDocument();
  });
});
