import { AlertTriangle } from "lucide-react";
import type { ExistingIds } from "@/lib/payout-types";

interface IdempotencyBannerProps {
  existingIds: ExistingIds;
  onReset: () => void;
}

export function IdempotencyBanner({ existingIds, onReset }: IdempotencyBannerProps) {
  return (
    <div
      role="status"
      className="animate-reveal w-full rounded-lg border border-warning bg-warning/10 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Already posted — skipped (idempotent)
          </p>
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
