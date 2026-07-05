import type { PnLSnapshot } from "@/lib/payout-types";
import { cn } from "@/lib/utils";

interface PnLComparisonProps {
  before: PnLSnapshot | null;
  after: PnLSnapshot | null;
}

function money(v: string | null | undefined) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function delta(before: string | null | undefined, after: string | null | undefined) {
  if (!before || !after) return null;
  const d = Number(after) - Number(before);
  if (d === 0) return null;
  const sign = d > 0 ? "+" : "−";
  const abs = Math.abs(d).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { sign, abs, positive: d > 0 };
}

export function PnLComparison({ before, after }: PnLComparisonProps) {
  return (
    <section aria-labelledby="pnl-heading" className="w-full">
      <h2
        id="pnl-heading"
        className="mb-3 text-xs uppercase tracking-widest text-muted-foreground"
      >
        Profit &amp; Loss · Before vs After
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PnLCard title="Before" snapshot={before} muted />
        <PnLCard title="After" snapshot={after} deltaFrom={before} highlight />
      </div>
    </section>
  );
}

function PnLCard({
  title,
  snapshot,
  deltaFrom,
  muted,
  highlight,
}: {
  title: string;
  snapshot: PnLSnapshot | null;
  deltaFrom?: PnLSnapshot | null;
  muted?: boolean;
  highlight?: boolean;
}) {
  if (!snapshot) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        <p className="mb-2 text-xs uppercase tracking-widest">{title}</p>
        Awaiting data…
      </div>
    );
  }

  const revenueDelta = deltaFrom ? delta(deltaFrom.revenue, snapshot.revenue) : null;
  const showsCommission = snapshot.commission_expense !== null;
  const commissionIsNew =
    showsCommission && (!deltaFrom || deltaFrom.commission_expense === null);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 transition-opacity",
        highlight ? "border-primary/50 shadow-lg" : "border-border",
        muted && "opacity-70",
      )}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <dl className="tabular mt-4 space-y-3">
        <Row label="Revenue">
          <span className={cn(highlight && "text-primary font-semibold")}>
            {money(snapshot.revenue)}
          </span>
          {revenueDelta ? (
            <span
              className={cn(
                "ml-2 rounded px-1.5 py-0.5 text-xs font-medium",
                revenueDelta.positive
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive",
              )}
            >
              {revenueDelta.sign}£{revenueDelta.abs}
            </span>
          ) : null}
        </Row>
        <Row label="Commission &amp; fees">
          {showsCommission ? (
            <>
              <span>{money(snapshot.commission_expense)}</span>
              {commissionIsNew ? (
                <span className="ml-2 rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-success">
                  New
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
        <div className="my-2 border-t border-border" />
        <Row label="Net profit" strong>
          {money(snapshot.net_profit)}
        </Row>
      </dl>
    </div>
  );
}

function Row({
  label,
  children,
  strong,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={cn("text-sm", strong ? "font-semibold" : "text-muted-foreground")}>
        {label}
      </dt>
      <dd className={cn("text-right text-base", strong && "text-lg font-semibold")}>
        {children}
      </dd>
    </div>
  );
}
