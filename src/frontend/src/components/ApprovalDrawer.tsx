import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, FileText, Receipt, Landmark, RotateCcw, XCircle } from "lucide-react";
import type { CanonicalPayout, JournalPlan, PlanStep } from "@/lib/payout-types";
import { cn } from "@/lib/utils";

interface ApprovalDrawerProps {
  payout: CanonicalPayout;
  plan: JournalPlan;
  fileHash: string;
  onApprove: () => void;
  disabled?: boolean;
  loading?: boolean;
  approved?: boolean;
  headingLabel?: string;
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
  headingLabel,
}: ApprovalDrawerProps) {
  const [openDetail, setOpenDetail] = useState(false);
  const hasRefunds = payout.refunds && Number(payout.refunds) > 0;

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
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-500">
          <span className="size-1.5 rounded-full bg-blue-500" /> Channel · MarketplaceCo
        </span>
      </header>

      {/* Summary */}
      <dl className={cn(
        "tabular grid gap-x-6 gap-y-4 rounded-lg bg-background/50 p-4",
        hasRefunds ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4",
      )}>
        <SummaryCell label="Gross" value={money(payout.gross)} icon={<FileText className="size-3.5" />} tone="blue" />
        <SummaryCell label="Commission" value={money(payout.commission)} icon={<Receipt className="size-3.5" />} tone="amber" />
        <SummaryCell label="Fees" value={money(payout.fees)} icon={<Receipt className="size-3.5" />} tone="rose" />
        {hasRefunds ? (
          <SummaryCell label="Refunds" value={money(payout.refunds)} icon={<RotateCcw className="size-3.5" />} tone="rose" />
        ) : null}
        <SummaryCell label="Net payout" value={money(payout.net)} icon={<Landmark className="size-3.5" />} tone="emerald" />
      </dl>

      {/* Equation */}
      <p className="tabular mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        {money(payout.gross)} − {money(payout.commission)} − {money(payout.fees)}
        {hasRefunds ? <> − {money(payout.refunds)}</> : null} ={" "}
        <span className="font-semibold text-emerald-500">{money(payout.net)}</span>
        {plan.invariant_check ? (
          <span className="inline-flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="size-4" /> balanced
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-500">
            <XCircle className="size-4" /> invariant failed
          </span>
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

      {/* Xero writes */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {headingLabel ?? "What Xero will do"}
        </h3>
        <ul className="mt-3 space-y-2">
          {plan.steps.map((s, i) => (
            <ChecklistItem key={i} approved={approved} icon={stepIcon(s)} tone={stepTone(s)}>
              {stepDescription(s)}
            </ChecklistItem>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled || loading || approved || !plan.invariant_check}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold shadow-lg transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            approved
              ? "bg-emerald-600 text-white shadow-emerald-500/25"
              : "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none",
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
            <>
              <CheckCircle2 className="size-5" /> Approve &amp; Post to Xero
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function stepIcon(s: PlanStep) {
  if (s.kind === "create-invoice") return <FileText className="size-4 text-blue-500" />;
  if (s.kind === "create-credit-note") return <RotateCcw className="size-4 text-rose-500" />;
  if (s.kind === "create-bank-transaction") return <Receipt className="size-4 text-amber-500" />;
  return <Landmark className="size-4 text-emerald-500" />;
}
function stepTone(s: PlanStep): "blue" | "amber" | "emerald" {
  if (s.kind === "create-invoice") return "blue";
  if (s.kind === "create-payment") return "emerald";
  return "amber";
}
function stepDescription(s: PlanStep): React.ReactNode {
  const amt = <span className="font-semibold">{money(s.amount)}</span>;
  switch (s.kind) {
    case "create-invoice":
      return <>Create a gross revenue invoice for {amt} into {s.account ?? "Platform Clearing"}</>;
    case "create-credit-note":
      return <>Issue a credit note for {amt} to reflect refunds</>;
    case "create-bank-transaction":
      return <>Book commission &amp; fees ({amt}) as expenses from {s.account ?? "Platform Clearing"}</>;
    case "create-payment":
      return <>Clear {amt} against your bank deposit{s.clears ? ` (${s.clears})` : ""}</>;
  }
}

function SummaryCell({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "blue" | "amber" | "rose" | "emerald";
}) {
  const toneClasses = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
    emerald: "text-emerald-500",
  };
  const bgClasses = {
    blue: "bg-blue-500/10",
    amber: "bg-amber-500/10",
    rose: "bg-rose-500/10",
    emerald: "bg-emerald-500/10",
  };

  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {tone && icon ? (
          <span className={cn("flex size-5 items-center justify-center rounded-md", bgClasses[tone], toneClasses[tone])}>
            {icon}
          </span>
        ) : null}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 text-lg font-semibold",
          tone ? toneClasses[tone] : "text-foreground",
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
  icon,
  tone,
}: {
  children: React.ReactNode;
  approved?: boolean;
  icon?: React.ReactNode;
  tone?: "blue" | "amber" | "emerald";
}) {
  const toneClasses = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  };

  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3 text-sm">
      {approved ? (
        <span
          aria-hidden
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-success bg-success text-success-foreground"
        >
          ✓
        </span>
      ) : icon ? (
        <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border", tone ? toneClasses[tone] : "border-border bg-transparent text-muted-foreground")}>
          {icon}
        </span>
      ) : (
        <span
          aria-hidden
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-transparent"
        />
      )}
      <span className="text-foreground">{children}</span>
    </li>
  );
}
