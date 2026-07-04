import { useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";
import type { AuditEntry } from "@/lib/payout-types";
import { cn } from "@/lib/utils";

interface AuditTrailProps {
  entries: AuditEntry[];
  defaultOpen?: boolean;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString("en-GB", { hour12: false });
  } catch {
    return iso;
  }
}

function summarise(req: Record<string, unknown>): string {
  if (!req || typeof req !== "object") return "—";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(req)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object") continue;
    parts.push(`${k}=${String(v)}`);
    if (parts.length >= 3) break;
  }
  return parts.join(" · ") || "—";
}

export function AuditTrail({ entries, defaultOpen = false }: AuditTrailProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section aria-labelledby="audit-heading" className="w-full rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="audit-panel"
        className="flex w-full items-center justify-between rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span id="audit-heading" className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Transaction trace
        </span>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open ? (
        <div id="audit-panel" className="border-t border-border p-4">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabular w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Timestamp</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                    <th className="px-2 py-2 font-medium">Request</th>
                    <th className="px-2 py-2 font-medium">Xero ID</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const ok = e.status === "success" || e.status === "ok";
                    return (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
                          {formatTime(e.timestamp)}
                        </td>
                        <td className="px-2 py-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.action}</code>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{summarise(e.request)}</td>
                        <td className="px-2 py-2 font-mono text-xs">{e.xero_id ?? "—"}</td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium",
                              ok ? "text-success" : "text-destructive",
                            )}
                          >
                            {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
