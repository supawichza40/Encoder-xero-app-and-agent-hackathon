import { AlertTriangle } from "lucide-react";
import type { ExistingIds } from "@/lib/payout-types";
import type { Persona } from "@/lib/useDemoAuth";
import { cn } from "@/lib/utils";

interface IdempotencyBannerProps {
  existingIds: ExistingIds;
  onReset: () => void;
  /** Promotes (enlarges) the PRI-6 dedupe badge for bookkeeper, subtle otherwise. */
  persona?: Persona;
}

export function IdempotencyBanner({ existingIds, onReset, persona }: IdempotencyBannerProps) {
  const idCount = [existingIds.invoice_id, existingIds.bank_txn_id, existingIds.payment_id].filter(
    Boolean,
  ).length;
  return (
    <div
      role="status"
      className="animate-reveal w-full rounded-lg border-2 border-warning bg-warning/10 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-warning">
            Already posted — skipped (idempotent)
          </p>
          {/* PRI-6 dedupe badge — always present; promoted for bookkeeper. */}
          <span
            aria-label={`Already posted — ${idCount} Xero IDs on file`}
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 font-mono text-amber-400",
              persona === "bookkeeper" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]",
            )}
          >
            Already posted · {idCount} Xero IDs on file
          </span>
          <p className="tabular flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Invoice <span className="font-mono text-foreground">{existingIds.invoice_id}</span>
            </span>
            <span>
              Bank txn <span className="font-mono text-foreground">{existingIds.bank_txn_id}</span>
            </span>
            <span>
              Payment <span className="font-mono text-foreground">{existingIds.payment_id}</span>
            </span>
          </p>
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Upload a different file
          </button>
        </div>
      </div>
    </div>
  );
}
