import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Navbar renders <Link> from @tanstack/react-router, which needs a Router
// context this test doesn't set up — stub it as a plain anchor.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { Navbar } from "@/components/Navbar";
import { MOCK_STORAGE_KEY } from "@/lib/payout-mock";

describe("Navbar — Real/Demo data-source toggle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to Demo mode with no persisted choice", async () => {
    render(<Navbar />);
    const toggle = await screen.findByRole("switch", { name: /data source: demo/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("reflects a persisted Live choice from localStorage", async () => {
    localStorage.setItem(MOCK_STORAGE_KEY, "0");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          xero_connected: true,
          organisation: "Demo Company (UK)",
        }),
      }),
    );
    render(<Navbar />);
    const toggle = await screen.findByRole("switch", { name: /data source: live/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("persists the choice to localStorage and reloads when the toggle is clicked", async () => {
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload },
    });

    render(<Navbar />);
    const toggle = await screen.findByRole("switch", { name: /data source: demo/i });
    await userEvent.click(toggle);

    expect(localStorage.getItem(MOCK_STORAGE_KEY)).toBe("0");
    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("shows the backend-offline fallback badge and forces Demo when Live health probing fails", async () => {
    localStorage.setItem(MOCK_STORAGE_KEY, "0");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText(/demo data · backend offline/i)).toBeInTheDocument();
    });
    const toggle = screen.getByRole("switch", { name: /data source: demo/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
