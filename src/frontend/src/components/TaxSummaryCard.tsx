// Freelancer immersion moment (ALX-1, §6) — restates the dashboard's two-number
// hero pair at the top of the verified /app state. Same figures as the golden
// path, plain language, no accounting jargon (PERSONA-DESIGN.md §3.5).

interface TaxSummaryCardProps {
  /** Gross income (payout.gross) */
  income: string;
  /** Deductible platform costs (commission + fees) */
  costs: string;
  /** Net take-home (payout.net) */
  takeHome: string;
}

function money(v: string) {
  return `£${Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TaxSummaryCard({ income, costs, takeHome }: TaxSummaryCardProps) {
  return (
    <section
      aria-labelledby="tax-summary-heading"
      className="animate-fade-up rounded-2xl border border-violet-500/40 bg-violet-500/[0.06] p-6"
    >
      <h2 id="tax-summary-heading" className="text-xs uppercase tracking-widest text-violet-400">
        Your tax summary
      </h2>
      <dl className="tabular mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Income</dt>
          <dd className="mt-1 text-2xl font-bold text-violet-400">{money(income)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Costs you can claim</dt>
          <dd className="mt-1 text-2xl font-bold text-amber-400">{money(costs)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Take-home</dt>
          <dd className="mt-1 text-2xl font-bold text-emerald-400">{money(takeHome)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        Report the {money(income)}, claim the {money(costs)} — the {money(takeHome)} is just what
        reached your bank.
      </p>
    </section>
  );
}
