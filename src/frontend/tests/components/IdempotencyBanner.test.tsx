import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdempotencyBanner } from "@/components/IdempotencyBanner";
import { mockExistingIds } from "../mocks/data";
import type { ExistingIds } from "@/lib/payout-types";

describe("IdempotencyBanner", () => {
  it("renders the existing Xero IDs from the prior run", () => {
    render(<IdempotencyBanner existingIds={mockExistingIds as ExistingIds} onReset={vi.fn()} />);
    expect(screen.getByText("Already posted — skipped (idempotent)")).toBeInTheDocument();
    expect(screen.getByText("INV-0042")).toBeInTheDocument();
    expect(screen.getByText("BT-0117")).toBeInTheDocument();
    expect(screen.getByText("PMT-0089")).toBeInTheDocument();
  });

  it("calls onReset when 'Upload a different file' is clicked", async () => {
    const onReset = vi.fn();
    render(<IdempotencyBanner existingIds={mockExistingIds as ExistingIds} onReset={onReset} />);
    await userEvent.click(screen.getByRole("button", { name: /upload a different file/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  // PRI-6 — dedupe badge, always present, near the existing banner.
  it("shows the already-posted dedupe badge with the Xero ID count", () => {
    render(<IdempotencyBanner existingIds={mockExistingIds as ExistingIds} onReset={vi.fn()} />);
    expect(screen.getByText(/Already posted · 3 Xero IDs on file/)).toBeInTheDocument();
  });

  it("promotes (enlarges) the badge for the bookkeeper persona", () => {
    render(
      <IdempotencyBanner
        existingIds={mockExistingIds as ExistingIds}
        onReset={vi.fn()}
        persona="bookkeeper"
      />,
    );
    const badge = screen.getByText(/Already posted · 3 Xero IDs on file/);
    expect(badge.className).toMatch(/text-sm/);
  });

  it("keeps the badge subtle for owner/freelancer", () => {
    render(
      <IdempotencyBanner
        existingIds={mockExistingIds as ExistingIds}
        onReset={vi.fn()}
        persona="owner"
      />,
    );
    const badge = screen.getByText(/Already posted · 3 Xero IDs on file/);
    expect(badge.className).toMatch(/text-\[11px\]/);
  });
});
