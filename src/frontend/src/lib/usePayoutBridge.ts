import { useCallback, useState } from "react";
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

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

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
      setPhase(data.status === "already-posted" ? "idempotent" : "proposed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPhase("error");
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
        void fetchPnl();
        void fetchStatus();
      } else {
        setPhase("partial_error");
        setError("One or more Xero writes failed. See step details.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
      setPhase("partial_error");
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

export async function fetchDashboard(): Promise<DashboardResponse | null> {
  try {
    if (isMockEnabled()) return await mockDashboard();
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) return null;
    return (await res.json()) as DashboardResponse;
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
  organisation: string;
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    if (isMockEnabled()) return await mockHealth();
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}
