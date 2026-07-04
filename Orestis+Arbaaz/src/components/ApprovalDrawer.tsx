import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import type { CanonicalPayout, JournalPlan } from "@/lib/payout-types";
import { cn } from "@/lib/utils";

interface ApprovalDrawerProps {
  payout: CanonicalPayout;
  plan: JournalPlan;
  fileHash: string;
  onApprove: () => void;
  disabled?: boolean;
  loading?: boolean;
  approved?: boolean;
}

function money(v: string) {
  return `£${Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ApprovalDrawer({
  payout,
  plan,
  fileHash,
  onApprove,
  disabled,
  loading,
  approved,
}: ApprovalDrawerProps) {
  const [openDetail, setOpenDetail] = useState(false);

  const [invoiceStep, feesStep, paymentStep] = plan.steps;
  const feesAmount = feesStep?.amount ?? "0.00";

  return (
    <section
      aria-labelledby="approval-heading"
      className="animate-reveal w-full rounded-xl border border-border bg-card p-6 shadow-lg"
    >
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 id="approval-heading" className="text-xl font-semibold text-foreground">
            Review payout {payout.payout_ref}
          </h2>
          <p className="text-sm text-muted-foreground">
            {payout.period} · file <span className="font-mono">{fileHash.slice(0, 10)}…</span>
          </p>
        </div>
      </header>

      {/* Summary */}
      <dl className="tabular grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-background/50 p-4 sm:grid-cols-4">
        <SummaryCell label="Gross" value={money(payout.gross)} />
        <SummaryCell label="Commission" value={money(payout.commission)} />
        <SummaryCell label="Fees" value={money(payout.fees)} />
        <SummaryCell label="Net payout" value={money(payout.net)} highlight />
      </dl>

      {/* Equation */}
      <p className="tabular mt-4 text-center text-sm text-muted-foreground">
        {money(payout.gross)} − {money(payout.commission)} − {money(payout.fees)} ={" "}
        <span className="text-foreground">{money(payout.net)}</span>
        {plan.invariant_check ? (
          <span className="ml-2 text-success">✓ balanced</span>
        ) : (
          <span className="ml-2 text-destructive">✗ invariant failed</span>
        )}
      </p>

      {/* Booking detail disclosure */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpenDetail((o) => !o)}
          aria-expanded={openDetail}
          aria-controls="booking-detail"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {openDetail ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          Booking detail ({payout.bookings.length})
        </button>
        {openDetail ? (
          <div id="booking-detail" className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="tabular w-full text-sm">
              <thead className="bg-background/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody>
                {payout.bookings.map((b, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{b.date}</td>
                    <td className="px-3 py-2">
                      {b.client}{" "}
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {b.client_type}
                      </span>
                    </td>
                    <td className="px-3 py-2">{b.service}</td>
                    <td className="px-3 py-2 text-right">{money(b.gross_amount)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{b.commission_rate}</td>
                    <td className="px-3 py-2 text-right">{money(b.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* What Xero will do */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What Xero will do
        </h3>
        <ul className="mt-3 space-y-2">
          <ChecklistItem approved={approved}>
            Create a gross revenue invoice for {money(invoiceStep?.amount ?? payout.gross)} into
            Platform Clearing
          </ChecklistItem>
          <ChecklistItem approved={approved}>
            Book commission ({money(payout.commission)}) and fees ({money(payout.fees)}) as
            expenses from Platform Clearing ({money(feesAmount)})
          </ChecklistItem>
          <ChecklistItem approved={approved}>
            Clear {money(paymentStep?.amount ?? payout.net)} against your bank deposit
          </ChecklistItem>
        </ul>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled || loading || approved || !plan.invariant_check}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            approved
              ? "bg-success text-success-foreground"
              : "bg-success text-success-foreground hover:bg-success/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Posting to Xero…
            </>
          ) : approved ? (
            <>
              <CheckCircle2 className="size-5" /> Posted to Xero
            </>
          ) : (
            <>Approve &amp; Post to Xero</>
          )}
        </button>
      </div>
    </section>
  );
}

function SummaryCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-lg font-semibold",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ChecklistItem({
  children,
  approved,
}: {
  children: React.ReactNode;
  approved?: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3 text-sm">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
          approved
            ? "border-success bg-success text-success-foreground"
            : "border-border bg-transparent",
        )}
      >
        {approved ? "✓" : ""}
      </span>
      <span className="text-foreground">{children}</span>
    </li>
  );
}
