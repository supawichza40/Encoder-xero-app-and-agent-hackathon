import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  Download,
  Info,
  Paperclip,
  X,
} from "lucide-react";
import type { AuditEntry } from "@/lib/payout-types";
import type { Persona } from "@/lib/useDemoAuth";
import { fetchAuditExport } from "@/lib/usePayoutBridge";
import { cn } from "@/lib/utils";

interface AuditTrailProps {
  entries: AuditEntry[];
  defaultOpen?: boolean;
  /** Prominent (primary-outline) export button for bookkeeper; ghost for others (PRI-1). */
  persona?: Persona;
}

// PRI-1 audit-trail export (CONTRACT.md §2). Never throws — fetchAuditExport
// resolves null on failure, in which case we simply skip the download.
async function downloadAuditExport() {
  const result = await fetchAuditExport("csv");
  if (!result) return;
  const blob = new Blob([result.content], { type: result.contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

export function AuditTrail({ entries, defaultOpen = false, persona }: AuditTrailProps) {
  const [open, setOpen] = useState(defaultOpen);
  const promoted = persona === "bookkeeper";
  return (
    <section
      aria-labelledby="audit-heading"
      className="w-full rounded-xl border border-border bg-card"
    >
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="audit-panel"
          className="flex flex-1 items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <span
            id="audit-heading"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Transaction trace
          </span>
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>
        <button
          type="button"
          onClick={() => void downloadAuditExport()}
          aria-label="Export audit trail as CSV"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-[background-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            promoted
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted",
          )}
        >
          <Download className="size-3.5" aria-hidden />
          Export
        </button>
      </div>
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
                    const info = e.status === "info";
                    const isAttach = e.action === "attach-source";
                    const attachFailed = isAttach && !ok && !info;
                    return (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
                          {formatTime(e.timestamp)}
                        </td>
                        <td className="px-2 py-2">
                          <code className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                            {isAttach ? <Paperclip className="size-3" /> : null}
                            {e.action}
                          </code>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{summarise(e.request)}</td>
                        <td className="px-2 py-2 font-mono text-xs">{e.xero_id ?? "—"}</td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium",
                              ok
                                ? "text-success"
                                : info
                                  ? "text-muted-foreground"
                                  : attachFailed
                                    ? "text-amber-500"
                                    : "text-destructive",
                            )}
                          >
                            {ok ? (
                              <Check className="size-3.5" />
                            ) : info ? (
                              <Info className="size-3.5" />
                            ) : attachFailed ? (
                              <AlertTriangle className="size-3.5" />
                            ) : (
                              <X className="size-3.5" />
                            )}
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
