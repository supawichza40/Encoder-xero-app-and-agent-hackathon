import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  ApprovalResponse,
  AuditEntry,
  DashboardResponse,
  Phase,
  PnLResponse,
  ProposalResponse,
  StatusResponse,
  StepResult,
  VatCheckResponse,
} from "./payout-types";
import {
  isMockEnabled,
  mockApprove,
  mockDashboard,
  mockHealth,
  mockPnl,
  mockPropose,
  mockStatus,
  mockVatCheck,
  resetMockState,
} from "./payout-mock";

// API base honors VITE_API_URL (default local FastAPI). Trailing slash is
// stripped so `${API_BASE}/propose` never produces a `//propose` path.
export const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000"
).replace(/\/+$/, "");

// Minimum on-screen time per step during /approve, so the pitch audience can
// see progress even if the backend returns before the animation catches up.
const MIN_STEP_MS = 300;

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string; message?: string };
    return data.detail ?? data.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}


export interface PayoutBridgeApi {
  phase: Phase;
  proposal: ProposalResponse | null;
  approval: ApprovalResponse | null;
  pnl: PnLResponse | null;
  audit: AuditEntry[];
  error: string | null;
  uploadFile: (file: File) => Promise<void>;
  approve: () => Promise<void>;
  fetchPnl: () => Promise<void>;
  fetchStatus: () => Promise<void>;
  reset: () => void;
}

export function usePayoutBridge(): PayoutBridgeApi {
  const [phase, setPhase] = useState<Phase>("idle");
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [approval, setApproval] = useState<ApprovalResponse | null>(null);
  const [pnl, setPnl] = useState<PnLResponse | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    if (isMockEnabled()) resetMockState();
    setPhase("idle");
    setProposal(null);
    setApproval(null);
    setPnl(null);
    setAudit([]);
    setError(null);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setPhase("uploading");
    if (!file.name.toLowerCase().endsWith(".csv") && file.size > 0) {
      setError("Please upload a .csv file.");
      setPhase("error");
      return;
    }
    try {
      let data: ProposalResponse;
      if (isMockEnabled()) {
        data = await mockPropose(file);
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/propose`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(await parseError(res));
        data = (await res.json()) as ProposalResponse;
      }
      setProposal(data);
      if (data.status === "already-posted") {
        setPhase("idempotent");
        toast.info("Already posted — skipped (idempotent)", {
          description: "This statement matches a prior run. No duplicate writes.",
        });
      } else {
        setPhase("proposed");
        toast.success("Proposal ready", {
          description: `Net £${Number(data.payout.net).toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} · review before posting`,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      setPhase("error");
      toast.error("Couldn't parse statement", { description: msg });
    }
  }, []);


  const fetchStatus = useCallback(async () => {
    if (!proposal) return;
    try {
      if (isMockEnabled()) {
        const data = await mockStatus(proposal.file_hash);
        setAudit(data.audit_entries ?? []);
        return;
      }
      // REGRESSION GUARD: the backend route is GET /status/{file_hash} — the
      // hash is a PATH param, never a query string (?file_hash=). Keep the
      // hash inside the path segment below; `?hash=` variants 404 on FastAPI.
      const res = await fetch(
        `${API_BASE}/status/${encodeURIComponent(proposal.file_hash)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as StatusResponse;
      setAudit(data.audit_entries ?? []);
    } catch {
      /* non-fatal */
    }
  }, [proposal]);

  const fetchPnl = useCallback(async () => {
    try {
      if (isMockEnabled()) {
        setPnl(await mockPnl());
        return;
      }
      const res = await fetch(`${API_BASE}/pnl`);
      if (!res.ok) return;
      const data = (await res.json()) as PnLResponse;
      setPnl(data);
    } catch {
      /* non-fatal */
    }
  }, []);

  const approve = useCallback(async () => {
    if (!proposal) return;
    setError(null);
    setPhase("approving");
    setApproval({
      file_hash: proposal.file_hash,
      results: [],
      clearing_balance: "0.00",
      verified: false,
    });
    const started = Date.now();
    try {
      let data: ApprovalResponse;
      if (isMockEnabled()) {
        data = await mockApprove(proposal.file_hash);
      } else {
        const res = await fetch(`${API_BASE}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_hash: proposal.file_hash }),
        });
        if (!res.ok) throw new Error(await parseError(res));
        data = (await res.json()) as ApprovalResponse;
      }

      // Reveal steps progressively for the pitch, respecting MIN_STEP_MS.
      const revealed: StepResult[] = [];
      for (const step of data.results) {
        const elapsed = Date.now() - started;
        const target = revealed.length * MIN_STEP_MS + MIN_STEP_MS;
        if (elapsed < target) await sleep(target - elapsed);
        revealed.push(step);
        setApproval({ ...data, results: [...revealed] });
      }


      if (data.verified && data.results.every((r) => r.status === "success")) {
        setPhase("verified");
        toast.success("Posted to Xero", {
          description: `Clearing account reconciled · £${Number(
            data.clearing_balance,
          ).toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        });
        void fetchPnl();
        void fetchStatus();
      } else {
        setPhase("partial_error");
        setError("One or more Xero writes failed. See step details.");
        toast.error("A Xero write failed", {
          description: "See the step details below to retry the failed step.",
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Approval failed";
      setError(msg);
      setPhase("partial_error");
      toast.error("Approval failed", { description: msg });
    }
  }, [proposal, fetchPnl, fetchStatus]);

  return {
    phase,
    proposal,
    approval,
    pnl,
    audit,
    error,
    uploadFile,
    approve,
    fetchPnl,
    fetchStatus,
    reset,
  };
}

// ── Live /dashboard normalization ────────────────────────────────────────────
// The backend (models.DashboardResponse) returns rawer shapes than the UI uses:
//   recent_payouts:   [{file_hash, completed_steps, clearing_balance}]
//   aged_receivables: [{contact, outstanding}]
// Normalize here so Demo and Live render through the identical UI types.

interface BackendRecentPayout {
  file_hash: string;
  completed_steps: string[];
  clearing_balance: string | null;
}

type RawDashboard = Omit<DashboardResponse, "recent_payouts"> & {
  recent_payouts: (BackendRecentPayout | DashboardResponse["recent_payouts"][number])[];
};

function normalizeDashboard(raw: RawDashboard): DashboardResponse {
  const recent_payouts = (raw.recent_payouts ?? []).map(
    (p): DashboardResponse["recent_payouts"][number] => {
      // Only the backend shape carries completed_steps — narrow on that.
      if ("completed_steps" in p) {
        const cleared =
          p.clearing_balance == null || Number(p.clearing_balance) === 0;
        return {
          date: p.file_hash.slice(0, 8),
          source: "MarketplaceCo",
          gross: null,
          net: null,
          status:
            cleared && p.completed_steps.length > 0 ? "verified" : "idempotent",
          file_hash: p.file_hash,
        };
      }
      return p;
    },
  );
  return {
    trial_balance: {
      clearing: raw.trial_balance?.clearing ?? "0.00",
      fees_expense: raw.trial_balance?.fees_expense ?? "0.00",
      revenue: raw.trial_balance?.revenue ?? "0.00",
    },
    aged_receivables: raw.aged_receivables ?? [],
    balance_sheet: raw.balance_sheet ?? {},
    recent_payouts,
    fetched_at: raw.fetched_at,
    source: raw.source,
  };
}

export async function fetchDashboard(): Promise<DashboardResponse | null> {
  try {
    if (isMockEnabled()) return await mockDashboard();
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) return null;
    return normalizeDashboard((await res.json()) as RawDashboard);
  } catch {
    return null;
  }
}

export async function fetchVatCheck(): Promise<VatCheckResponse | null> {
  try {
    if (isMockEnabled()) return await mockVatCheck();
    const res = await fetch(`${API_BASE}/vat-check`);
    if (!res.ok) return null;
    return (await res.json()) as VatCheckResponse;
  } catch {
    return null;
  }
}

export interface HealthResponse {
  status: string;
  xero_connected: boolean;
  organisation: string | null; // backend sends null in degraded mode
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    if (isMockEnabled()) return await mockHealth();
    return await probeRealHealth();
  } catch {
    return null;
  }
}

/**
 * Probe the REAL backend /health regardless of the current mock mode — used by
 * the Live/Demo toggle to decide auto-fallback and recovery. Short timeout so
 * an unreachable backend degrades to Demo within a few seconds, not minutes.
 */
export async function probeRealHealth(timeoutMs = 3500): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}
