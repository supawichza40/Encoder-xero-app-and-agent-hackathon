import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDemoAuth } from "@/lib/useDemoAuth";

// GEN-1 (PERSONA-DESIGN.md §8, docs/specs/09 §7.0) — the Log-in flow used to
// hard-code persona "owner" (Navbar.tsx:282), silently resetting a returning
// user's persona choice every time they logged back in. Only Sign-up honored
// the door choice. Fix: persist the last-used persona across logout in a
// separate localStorage key so a plain login (no explicit persona) reuses it.
describe("useDemoAuth — GEN-1 persona persistence across logout", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("preserves the last-used persona on a plain login after logout", () => {
    const { result } = renderHook(() => useDemoAuth());

    act(() => {
      result.current.login("Priya");
    });
    act(() => {
      result.current.setPersona("bookkeeper");
    });
    expect(result.current.user?.persona).toBe("bookkeeper");

    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();

    // Login mode: no explicit persona argument (mirrors Navbar's login submit).
    act(() => {
      result.current.login("Priya");
    });

    expect(result.current.user?.persona).toBe("bookkeeper");
  });

  it("defaults a genuinely first-ever session (no stored persona at all) to owner", () => {
    const { result } = renderHook(() => useDemoAuth());
    act(() => {
      result.current.login("Sam");
    });
    expect(result.current.user?.persona).toBe("owner");
  });

  it("signup still honors an explicit persona choice, overriding any stored last persona", () => {
    const { result } = renderHook(() => useDemoAuth());
    act(() => {
      result.current.login("Sam", "owner");
    });
    act(() => {
      result.current.logout();
    });
    act(() => {
      result.current.login("Alex", "freelancer");
    });
    expect(result.current.user?.persona).toBe("freelancer");
  });
});
