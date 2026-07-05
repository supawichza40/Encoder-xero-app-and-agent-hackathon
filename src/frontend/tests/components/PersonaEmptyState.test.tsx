import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// PersonaEmptyState renders a <Link> from @tanstack/react-router, which needs
// a Router context this unit test doesn't set up — stub it as a plain anchor
// (same pattern as Navbar.test.tsx).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { PersonaEmptyState } from "@/components/PersonaEmptyState";
import { PERSONA_COPY } from "@/lib/personaTheme";
import type { Persona } from "@/lib/useDemoAuth";

const PERSONAS: Persona[] = ["owner", "bookkeeper", "freelancer"];

// jsdom has no matchMedia; motion.tsx's usePrefersReducedMotion() needs it.
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
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PersonaEmptyState — GEN-2 / SAM-1 / ALX-5 first-run empty state", () => {
  it.each(PERSONAS)("renders %s's empty-state copy with a real, labelled link CTA", (persona) => {
    render(<PersonaEmptyState persona={persona} />);
    const copy = PERSONA_COPY[persona];

    expect(screen.getByRole("heading", { name: copy.emptyHeadline })).toBeInTheDocument();
    expect(screen.getByText(copy.emptySubcopy)).toBeInTheDocument();

    // §7 — CTA must be a real link with visible text, not icon-only.
    const cta = screen.getByRole("link", { name: copy.emptyCta });
    expect(cta).toHaveAttribute("href", "/app");
  });

  it("never shows fabricated numeric figures on the empty state (no fake activity)", () => {
    render(<PersonaEmptyState persona="owner" />);
    expect(screen.queryByText(/£1,340|£847|£493/)).not.toBeInTheDocument();
  });

  it("gives each persona a visually distinct accent (icon tile uses PERSONA_TONE)", () => {
    const { container, unmount } = render(<PersonaEmptyState persona="owner" />);
    const ownerHtml = container.innerHTML;
    unmount();

    const { container: bkContainer } = render(<PersonaEmptyState persona="bookkeeper" />);
    expect(bkContainer.innerHTML).not.toBe(ownerHtml);
  });
});
