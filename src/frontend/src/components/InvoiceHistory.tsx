import { useEffect, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import type { ProposalResponse } from "@/lib/payout-types";

export interface HistoryEntry {
  id: string;
  fileName: string;
  uploadedAt: string;
  proposal: ProposalResponse;
}

const STORAGE_KEY = "payoutbridge:invoice-history";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  const current = loadHistory();
  const deduped = current.filter((e) => e.id !== entry.id);
  const next = [entry, ...deduped].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("payoutbridge:history-updated"));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("payoutbridge:history-updated"));
}

interface Props {
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export function InvoiceHistory({ selectedId, onSelect }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
    const refresh = () => setEntries(loadHistory());
    window.addEventListener("payoutbridge:history-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("payoutbridge:history-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your invoices</h2>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={clearHistory}
            className="text-red-500 transition-colors hover:text-red-600"
            aria-label="Clear invoice history"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Uploaded invoices will appear here.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => {
            const active = entry.id === selectedId;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
                    active
                      ? "border-blue-500/60 bg-blue-500/10 text-foreground"
                      : "border-transparent hover:border-border hover:bg-muted/60 text-muted-foreground"
                  }`}
                >
                  <FileText
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      active ? "text-blue-500" : "text-muted-foreground"
                    }`}
                  />
                  <span className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium text-foreground">{entry.fileName}</span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {entry.proposal.payout.period} · £{entry.proposal.payout.net}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {new Date(entry.uploadedAt).toLocaleString()}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
