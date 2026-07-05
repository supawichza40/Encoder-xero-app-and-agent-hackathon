import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardResponse } from "@/lib/payout-types";
import type { DemoUser, Persona } from "@/lib/useDemoAuth";
import { PERSONA_COPY } from "@/lib/personaTheme";

// Dashboard renders <Link>/<Chatbot useNavigate> from @tanstack/react-router
// and createFileRoute at module scope — none need a real router for these
// unit tests (same stubbing pattern as Navbar.test.tsx).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  createFileRoute: () => (opts: unknown) => opts,
}));

// Control upload-history presence (GEN-2 empty-state gate) without touching
// the real localStorage-backed InvoiceHistory component (owned by 2b).
vi.mock("@/components/InvoiceHistory", async () => {
  const actual = await vi.importActual<typeof import("@/components/InvoiceHistory")>(
    "@/components/InvoiceHistory",
  );
  return { ...actual, loadHistory: vi.fn(() => actual.loadHistory()) };
});

// Control /dashboard data (persona_metrics / run_history) deterministically.
vi.mock("@/lib/usePayoutBridge", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/usePayoutBridge")>("@/lib/usePayoutBridge");
  return { ...actual, fetchDashboard: vi.fn().mockResolvedValue(null) };
});

import { Dashboard } from "@/routes/index";
import { loadHistory, saveHistoryEntry } from "@/components/InvoiceHistory";
import { fetchDashboard } from "@/lib/usePayoutBridge";

// jsdom has no matchMedia; motion.tsx's usePrefersReducedMotion() needs it.
// jsdom also has no ResizeObserver; recharts' ResponsiveContainer (owner's
// charts row) needs it.
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function makeUser(persona: Persona): DemoUser {
  return { name: "Test User", persona };
}

function markHasHistory() {
  saveHistoryEntry({
    id: "hist-1",
    fileName: "settlement.csv",
    uploadedAt: new Date().toISOString(),
    proposal: {
      status: "new",
      file_hash: "hist-1",
      payout: {
        payout_ref: "MC-PAYOUT-0407",
        period: "16-30 Jun 2026",
        gross: "1340.00",
        commission: "445.90",
        fees: "47.10",
        refunds: "0.00",
        net: "847.00",
        bookings: [],
      },
      plan: null,
      existing_ids: null,
    },
  });
}

function kpiLabels() {
  return screen.getAllByTestId("kpi-label").map((el) => el.textContent);
}

describe("Dashboard — persona-tinted KPI order (PRI-4, SAM-2, SAM-3, ALX-1)", () => {
  afterEach(() => {
    localStorage.clear();
    vi.mocked(fetchDashboard).mockResolvedValue(null);
    vi.unstubAllGlobals();
  });

  it("owner: turnover leads, then fees taken, payouts, clearing", () => {
    markHasHistory();
    render(<Dashboard user={makeUser("owner")} />);
    expect(kpiLabels()).toEqual([
      PERSONA_COPY.owner.kpi1Label,
      PERSONA_COPY.owner.kpi2Label,
      "Payouts reconciled",
      PERSONA_COPY.owner.clearingLabel,
    ]);
  });

  it("bookkeeper: clearing balance is first (clearing-first order)", () => {
    markHasHistory();
    render(<Dashboard user={makeUser("bookkeeper")} />);
    expect(kpiLabels()).toEqual([
      PERSONA_COPY.bookkeeper.kpi1Label,
      PERSONA_COPY.bookkeeper.kpi2Label,
      "Gross turnover (period)",
      "Fees posted (period)",
    ]);
  });

  it("freelancer: the two Self Assessment figures lead as the hero pair", () => {
    markHasHistory();
    render(<Dashboard user={makeUser("freelancer")} />);
    expect(kpiLabels()).toEqual([
      PERSONA_COPY.freelancer.kpi1Label,
      PERSONA_COPY.freelancer.kpi2Label,
      "Take-home so far",
      PERSONA_COPY.freelancer.clearingLabel,
    ]);
  });

  it("all three personas render genuinely different KPI label sets/order (DOM order, not just presence)", () => {
    markHasHistory();
    const { unmount: u1 } = render(<Dashboard user={makeUser("owner")} />);
    const owner = kpiLabels();
    u1();

    const { unmount: u2 } = render(<Dashboard user={makeUser("bookkeeper")} />);
    const bookkeeper = kpiLabels();
    u2();

    render(<Dashboard user={makeUser("freelancer")} />);
    const freelancer = kpiLabels();

    expect(owner).not.toEqual(bookkeeper);
    expect(owner).not.toEqual(freelancer);
    expect(bookkeeper).not.toEqual(freelancer);
  });
});

describe("Dashboard — show/mute matrix (§2.3)", () => {
  afterEach(() => {
    localStorage.clear();
    vi.mocked(fetchDashboard).mockResolvedValue(null);
    vi.unstubAllGlobals();
  });

  it("shows the ticker marquee only for owner", () => {
    // Marquee duplicates its children for the seamless infinite-scroll loop,
    // so there are always 2 matches when it's rendered.
    markHasHistory();
    const { unmount } = render(<Dashboard user={makeUser("owner")} />);
    expect(screen.getAllByText(/MarketplaceCo · £1,340 gross · £847 net/).length).toBeGreaterThan(
      0,
    );
    unmount();

    render(<Dashboard user={makeUser("bookkeeper")} />);
    expect(screen.queryByText(/MarketplaceCo · £1,340 gross · £847 net/)).not.toBeInTheDocument();
  });

  it("replaces the bookkeeper charts row with a run-history table", () => {
    markHasHistory();
    render(<Dashboard user={makeUser("bookkeeper")} />);
    expect(screen.getByText(/run history/i)).toBeInTheDocument();
  });

  it("hides the charts row entirely for freelancer", () => {
    markHasHistory();
    render(<Dashboard user={makeUser("freelancer")} />);
    expect(screen.queryByText(/run history/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fees this month/i)).not.toBeInTheDocument();
  });

  it("adds the ALX-3 under-reported callout only for freelancer", () => {
    markHasHistory();
    const { unmount } = render(<Dashboard user={makeUser("owner")} />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    unmount();

    render(<Dashboard user={makeUser("freelancer")} />);
    expect(screen.getByRole("note")).toHaveTextContent(/under-reported/i);
  });
});

describe("Dashboard — GEN-2 first-run empty state", () => {
  afterEach(() => {
    localStorage.clear();
    vi.mocked(fetchDashboard).mockResolvedValue(null);
    vi.unstubAllGlobals();
  });

  it("renders PersonaEmptyState instead of the KPI dashboard when this user has no upload history", () => {
    expect(loadHistory()).toHaveLength(0);
    render(<Dashboard user={makeUser("owner")} />);
    expect(screen.getByText(PERSONA_COPY.owner.emptyHeadline)).toBeInTheDocument();
    expect(screen.queryByTestId("kpi-label")).not.toBeInTheDocument();
  });

  it("renders the full dashboard once the user has completed an upload", () => {
    markHasHistory();
    render(<Dashboard user={makeUser("owner")} />);
    expect(screen.getAllByTestId("kpi-label")).toHaveLength(4);
  });
});

describe("Dashboard — null-safety on persona_metrics / run_history (CONTRACT.md §1)", () => {
  afterEach(() => {
    localStorage.clear();
    vi.mocked(fetchDashboard).mockResolvedValue(null);
    vi.unstubAllGlobals();
  });

  it("never crashes when persona_metrics and run_history are both null", async () => {
    markHasHistory();
    const degraded: DashboardResponse = {
      trial_balance: { clearing: "0.00", fees_expense: "0.00", revenue: "0.00" },
      aged_receivables: [],
      balance_sheet: {},
      recent_payouts: [],
      fetched_at: new Date().toISOString(),
      source: "demo",
      persona_metrics: null,
      run_history: null,
    };
    vi.mocked(fetchDashboard).mockResolvedValue(degraded);

    render(<Dashboard user={makeUser("bookkeeper")} />);
    expect(await screen.findAllByTestId("kpi-label")).toHaveLength(4);
    expect(screen.getByText(/no statements posted yet/i)).toBeInTheDocument();
  });
});
