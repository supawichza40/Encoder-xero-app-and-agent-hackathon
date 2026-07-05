import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EvidencePackCard, personaSectionOrder } from "@/routes/app";
import { mockApprove, resetMockState } from "@/lib/payout-mock";

describe("personaSectionOrder (§3.5 per-persona /app section order)", () => {
  it("owner: clearing → pnl → audit", () => {
    expect(personaSectionOrder("owner")).toEqual(["clearing", "pnl", "audit"]);
  });

  it("bookkeeper: clearing → audit → pnl (evidence-desk order, PRI-4)", () => {
    expect(personaSectionOrder("bookkeeper")).toEqual(["clearing", "audit", "pnl"]);
  });

  it("freelancer: tax → clearing → pnl → audit (ALX-1 hero restated first)", () => {
    expect(personaSectionOrder("freelancer")).toEqual(["tax", "clearing", "pnl", "audit"]);
  });
});

describe("EvidencePackCard (PRI-2)", () => {
  beforeEach(() => {
    resetMockState();
  });

  it("is null-safe: an unknown hash never crashes and shows a quiet message", async () => {
    render(<EvidencePackCard fileHash="never-posted-hash" persona="bookkeeper" />);
    await userEvent.click(screen.getByRole("button", { name: /download evidence pack/i }));
    expect(
      await screen.findByText(/no evidence pack on file for this run yet/i),
    ).toBeInTheDocument();
  });

  it("renders the CSV hash, Xero IDs, and £0.00 proof for a posted statement", async () => {
    await mockApprove("known-hash");
    render(<EvidencePackCard fileHash="known-hash" persona="bookkeeper" />);
    await userEvent.click(screen.getByRole("button", { name: /download evidence pack/i }));
    expect(await screen.findByText(/INV-0042/)).toBeInTheDocument();
    expect(screen.getByText(/BT-0117/)).toBeInTheDocument();
    expect(screen.getByText(/£0\.00/)).toBeInTheDocument();
  });

  it("is styled prominently for bookkeeper vs quietly for owner/freelancer", () => {
    const { container: bookkeeperContainer } = render(
      <EvidencePackCard fileHash="h1" persona="bookkeeper" />,
    );
    const { container: ownerContainer } = render(<EvidencePackCard fileHash="h2" persona="owner" />);
    expect(bookkeeperContainer.querySelector("section")?.className).toMatch(/border-primary/);
    expect(ownerContainer.querySelector("section")?.className).not.toMatch(/border-primary/);
  });
});
