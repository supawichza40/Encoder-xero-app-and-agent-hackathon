import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdempotencyBanner } from "@/components/IdempotencyBanner";
import { mockExistingIds } from "../mocks/data";
import type { ExistingIds } from "@/lib/payout-types";

describe("IdempotencyBanner", () => {
  it("renders the existing Xero IDs from the prior run", () => {
    render(<IdempotencyBanner existingIds={mockExistingIds as ExistingIds} onReset={vi.fn()} />);
    expect(screen.getByText(/already posted/i)).toBeInTheDocument();
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
});
