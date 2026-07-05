import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { Persona } from "@/lib/useDemoAuth";
import { cn } from "@/lib/utils";

interface ClearingReconciliationProps {
  gross: string;
  feesTotal: string;
  net: string;
  clearingBalance: string;
  verified: boolean;
  /** When "freelancer", swaps labels to plain English per the ALX-2 jargon map
   * (PERSONA-DESIGN.md §3.6) — same figures, same layout, reworded labels only. */
  persona?: Persona;
}

function money(v: string) {
  return `£${Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ClearingReconciliation({
  gross,
  feesTotal,
  net,
  clearingBalance,
  verified,
  persona,
}: ClearingReconciliationProps) {
  const plain = persona === "freelancer";
  const heading = plain
    ? "Money moving through — verified"
    : "Live verification · Platform Clearing";
  const feesLabel = plain ? "Platform fees you can claim" : "Commission & fees";
  const netLabel = plain ? "Take-home" : "Net";
  const balanceLabel = plain ? "Money moving through" : "Platform Clearing balance";
  const verifiedText = plain
    ? "Everything's accounted for — nothing left in limbo."
    : "Clearing account is fully reconciled.";
  const unverifiedText = plain
    ? "The numbers don't add up yet — take a look at what's been posted."
    : "Clearing account is not zero — investigate posted journals.";

  return (
    <section
      aria-labelledby="clearing-heading"
      className={cn(
        "animate-reveal rounded-2xl border-2 bg-card p-8 shadow-xl transition-colors",
        verified ? "border-success/60 shadow-success/10" : "border-destructive/60",
      )}
    >
      <h2 id="clearing-heading" className="text-xs uppercase tracking-widest text-muted-foreground">
        {heading}
      </h2>

      <p className="tabular mt-4 text-center text-xl font-medium text-foreground sm:text-2xl">
        <span className="text-muted-foreground">Gross</span> {money(gross)}{" "}
        <span className="text-muted-foreground">−</span>{" "}
        <span className="text-muted-foreground">{feesLabel}</span> {money(feesTotal)}{" "}
        <span className="text-muted-foreground">=</span>{" "}
        <span className="text-primary">
          {netLabel} {money(net)}
        </span>
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{balanceLabel}</p>
        <div
          className={cn(
            "tabular flex items-center gap-4 text-6xl font-black sm:text-7xl lg:text-8xl",
            verified ? "text-success" : "text-destructive",
          )}
        >
          <span>{money(clearingBalance)}</span>
          {verified ? (
            <CheckCircle2 className="size-14 sm:size-16 lg:size-20" aria-label="Verified zero" />
          ) : (
            <AlertTriangle
              className="size-14 sm:size-16 lg:size-20"
              aria-label="Non-zero balance"
            />
          )}
        </div>
        <p className={cn("text-sm font-medium", verified ? "text-success" : "text-destructive")}>
          {verified ? verifiedText : unverifiedText}
        </p>
      </div>
    </section>
  );
}
