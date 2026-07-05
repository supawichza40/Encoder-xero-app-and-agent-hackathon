import { Check, Loader2 } from "lucide-react";
import type { PlanStep, StepResult } from "@/lib/payout-types";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  results: StepResult[];
  totalSteps?: number;
  steps?: PlanStep[];
}

function labelFor(kind: string): string {
  switch (kind) {
    case "create-invoice":
      return "Invoice";
    case "create-credit-note":
      return "Credit note";
    case "create-bank-transaction":
      return "Fees";
    case "create-payment":
      return "Payment";
    default:
      return kind;
  }
}

export function StepProgress({ results, totalSteps, steps }: StepProgressProps) {
  const total = steps?.length ?? totalSteps ?? 3;
  const labels =
    steps?.map((s) => labelFor(s.kind)) ??
    ["Invoice", "Fees", "Payment"].slice(0, total);
  const done = results.length;
  const allDone = done >= total && results.every((r) => r.status === "success");
  const anyError = results.some((r) => r.status === "error");

  return (
    <section aria-labelledby="progress-heading" className="w-full">
      <h2
        id="progress-heading"
        className={cn(
          "mb-4 text-center text-sm font-medium",
          anyError ? "text-destructive" : allDone ? "text-success" : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {anyError ? "Xero write failed" : allDone ? "Posted to Xero" : "Posting to Xero…"}
      </h2>
      <ol className="flex items-center justify-between gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const step = results[i];
          const state: "pending" | "in-progress" | "complete" | "error" = step
            ? step.status === "error"
              ? "error"
              : "complete"
            : i === done
              ? "in-progress"
              : "pending";
          return (
            <li key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  aria-label={`Step ${i + 1} ${labels[i]} ${state}`}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    state === "pending" && "border-border bg-muted text-muted-foreground",
                    state === "in-progress" && "border-primary bg-primary/10 text-primary",
                    state === "complete" && "border-success bg-success text-success-foreground",
                    state === "error" && "border-destructive bg-destructive text-destructive-foreground",
                  )}
                >
                  {state === "in-progress" ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : state === "complete" ? (
                    <Check className="size-5" />
                  ) : state === "error" ? (
                    "!"
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{labels[i]}</span>
              </div>
              {i < total - 1 ? (
                <div
                  aria-hidden
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    step && step.status !== "error"
                      ? "bg-success"
                      : "border-t-2 border-dashed border-border bg-transparent",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
