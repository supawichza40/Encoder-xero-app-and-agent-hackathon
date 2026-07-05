import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePayoutBridge } from "@/lib/usePayoutBridge";
import { resetMockState } from "@/lib/payout-mock";
import { mockProposeResponseNew } from "../mocks/data";

function csvFile(name: string) {
  return new File(["a,b,c"], name, { type: "text/csv", lastModified: 1 });
}

describe("usePayoutBridge — state machine (mock layer)", () => {
  beforeEach(() => {
    localStorage.clear(); // ensures isMockEnabled() defaults to true
    resetMockState();
  });

  it("walks idle -> uploading -> proposed -> approving -> verified", async () => {
    const { result } = renderHook(() => usePayoutBridge());
    expect(result.current.phase).toBe("idle");

    const uploadPromise = act(async () => {
      await result.current.uploadFile(csvFile("golden.csv"));
    });
    await uploadPromise;

    expect(result.current.phase).toBe("proposed");
    expect(result.current.proposal?.status).toBe("new");
    expect(result.current.proposal?.payout.net).toBe("847.00");

    await act(async () => {
      await result.current.approve();
    });

    expect(result.current.phase).toBe("verified");
    expect(result.current.approval?.verified).toBe(true);
    expect(result.current.approval?.results).toHaveLength(3);
    await waitFor(() => expect(result.current.pnl).not.toBeNull());
    await waitFor(() => expect(result.current.audit.length).toBeGreaterThan(0));
  }, 10000);

  it("detects an already-posted file as idempotent on a second upload", async () => {
    const { result } = renderHook(() => usePayoutBridge());
    const file = csvFile("repeat.csv");

    await act(async () => {
      await result.current.uploadFile(file);
    });
    expect(result.current.phase).toBe("proposed");

    await act(async () => {
      await result.current.approve();
    });
    expect(result.current.phase).toBe("verified");

    // Re-upload the identical file (same name/size/lastModified => same hash)
    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.phase).toBe("idempotent");
    expect(result.current.proposal?.status).toBe("already-posted");
    expect(result.current.proposal?.existing_ids?.invoice_id).toBeTruthy();
  }, 10000);

  it("resets back to idle and clears proposal/approval/pnl/audit state", async () => {
    const { result } = renderHook(() => usePayoutBridge());

    await act(async () => {
      await result.current.uploadFile(csvFile("reset-me.csv"));
    });
    await act(async () => {
      await result.current.approve();
    });
    expect(result.current.phase).toBe("verified");

    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.proposal).toBeNull();
    expect(result.current.approval).toBeNull();
    expect(result.current.pnl).toBeNull();
    expect(result.current.audit).toEqual([]);
    expect(result.current.error).toBeNull();
  }, 10000);
});

describe("usePayoutBridge — partial failure & error paths (live/real backend)", () => {
  beforeEach(() => {
    localStorage.setItem("payoutbridge.mock", "0"); // force real-backend code path
  });

  it("surfaces phase=partial_error when a Xero write fails", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith("/propose")) {
        return { ok: true, json: async () => mockProposeResponseNew } as Response;
      }
      if (u.endsWith("/approve")) {
        return {
          ok: true,
          json: async () => ({
            file_hash: mockProposeResponseNew.file_hash,
            clearing_balance: "493.00",
            verified: false,
            results: [
              { step: 1, kind: "create-invoice", xero_id: "INV-1", status: "success" },
              {
                step: 2,
                kind: "create-bank-transaction",
                xero_id: "",
                status: "error",
                message: "Xero rate limit",
              },
            ],
          }),
        } as Response;
      }
      throw new Error(`unexpected fetch: ${u} ${init?.method}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePayoutBridge());

    await act(async () => {
      await result.current.uploadFile(csvFile("live.csv"));
    });
    expect(result.current.phase).toBe("proposed");

    await act(async () => {
      await result.current.approve();
    });

    expect(result.current.phase).toBe("partial_error");
    expect(result.current.error).toMatch(/xero write/i);
    expect(result.current.approval?.verified).toBe(false);

    vi.unstubAllGlobals();
  }, 10000);

  it("sets phase=error when the propose request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ detail: "boom" }) }),
    );

    const { result } = renderHook(() => usePayoutBridge());
    await act(async () => {
      await result.current.uploadFile(csvFile("bad.csv"));
    });

    expect(result.current.phase).toBe("error");
    expect(result.current.error).toBe("boom");

    vi.unstubAllGlobals();
  });
});
