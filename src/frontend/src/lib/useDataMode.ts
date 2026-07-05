// Real/Demo data-mode hook for the navbar toggle.
//
// - Choice persists to localStorage "payoutbridge.mock" ("0" = live, "1" = demo)
//   and is mirrored into the ?mock= URL param (see setMockChoice in payout-mock).
// - While LIVE is the chosen mode, GET /health is probed on mount and every
//   PROBE_INTERVAL_MS. If unreachable, the tab auto-falls-back to Demo
//   (sessionStorage flag, user's persisted choice untouched) with a toast.
//   When the backend comes back, a toast offers a one-click return to Live.
// - Flipping the toggle reloads the page: every screen refetches from the new
//   data source cleanly, and the choice survives via localStorage + URL.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  isMockChosen,
  isMockEnabled,
  isMockFallbackActive,
  setMockChoice,
  setMockFallback,
} from "./payout-mock";
import { fetchHealth, probeRealHealth, type HealthResponse } from "./usePayoutBridge";

const PROBE_INTERVAL_MS = 20_000;

export interface DataMode {
  /** Effective mode: true = Demo (mock) data, false = Live backend. */
  mock: boolean;
  /** True when Live was chosen but /health failed and we auto-fell-back. */
  fallback: boolean;
  /** Latest health snapshot (mock health in Demo, real probe in Live). */
  health: HealthResponse | null;
  /** Persist a new choice and reload so every data source switches cleanly. */
  setMode: (mock: boolean) => void;
}

export function useDataMode(): DataMode {
  // Start as Demo on both server and first client paint (SSR-hydration-safe);
  // the mount effect below syncs to the persisted choice immediately after.
  const [mock, setMock] = useState<boolean>(true);
  const [fallback, setFallback] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const recoveryNotified = useRef(false);

  useEffect(() => {
    setMock(isMockEnabled());
    setFallback(isMockFallbackActive());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function probe() {
      if (isMockChosen()) {
        // Demo chosen: no fallback machinery — just the (mock) health badge.
        const h = await fetchHealth();
        if (!cancelled) setHealth(h);
        return;
      }
      const h = await probeRealHealth();
      if (cancelled) return;
      setHealth(h);
      if (h === null) {
        // Live chosen but backend unreachable → non-blocking Demo fallback.
        recoveryNotified.current = false;
        if (!isMockFallbackActive()) {
          setMockFallback(true);
          toast.warning("Backend unreachable — showing Demo data", {
            description: "Your Live choice is kept; we'll retry in the background.",
          });
        }
        setFallback(true);
        setMock(true);
      } else if (isMockFallbackActive() && !recoveryNotified.current) {
        // Backend recovered while fallen back. Keep showing Demo (no silent
        // mid-session source flip) and offer a one-click return to Live.
        recoveryNotified.current = true;
        toast.success("Backend reachable again", {
          duration: 10_000,
          action: {
            label: "Switch to Live",
            onClick: () => {
              setMockFallback(false);
              window.location.reload();
            },
          },
        });
      }
    }

    void probe();
    const id = window.setInterval(() => void probe(), PROBE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const setMode = useCallback((nextMock: boolean) => {
    setMockChoice(nextMock); // localStorage + ?mock= sync + clear fallback
    window.location.reload(); // robust: all screens refetch from the new source
  }, []);

  return { mock, fallback, health, setMode };
}
