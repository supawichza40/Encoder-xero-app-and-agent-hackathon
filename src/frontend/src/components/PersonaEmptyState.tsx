import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/motion";
import { PERSONA_COPY, PERSONA_TONE } from "@/lib/personaTheme";
import type { Persona } from "@/lib/useDemoAuth";

// GEN-2 / SAM-1 / ALX-5 (PERSONA-DESIGN.md §2.4; docs/specs/09 §7.0/§7.1/§7.3)
// — a brand-new user must never see the fully-populated illustrative
// dashboard as if it were their own activity. Dashboard (routes/index.tsx)
// renders this in place of the KPI grid until this user has completed a
// real upload (loadHistory().length === 0).
export function PersonaEmptyState({ persona }: { persona: Persona }) {
  const reducedMotion = usePrefersReducedMotion();
  const copy = PERSONA_COPY[persona];
  const tone = PERSONA_TONE[persona];

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${reducedMotion ? "opacity-30" : "dashboard-grid-bg opacity-60"}`}
      />
      <div className="animate-fade-up relative mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card/80 p-8 text-center backdrop-blur-sm">
        <span
          className={`grid size-14 place-items-center rounded-2xl border ${tone.accentBg} ${tone.accentBorder}`}
        >
          <Upload
            className={`size-6 ${tone.accentText} ${!reducedMotion ? "animate-float" : ""}`}
            aria-hidden
          />
        </span>
        <h2 className="font-display text-2xl italic">{copy.emptyHeadline}</h2>
        <p className="text-sm text-muted-foreground">{copy.emptySubcopy}</p>
        <Link
          to="/app"
          className="btn-shimmer mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {copy.emptyCta}
        </Link>
      </div>
    </main>
  );
}
