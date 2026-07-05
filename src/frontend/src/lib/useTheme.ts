import { useEffect, useState } from "react";

export type ThemeMode = "mono-dark" | "mono-light";
const KEY = "payoutbridge.theme";
const EVENT = "payoutbridge:theme-change";

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "mono-light" || v === "mono-dark") return v;
  } catch {
    /* noop */
  }
  return "mono-dark";
}

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("mono-dark", "mono-light");
  root.classList.add(mode);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("mono-dark");

  useEffect(() => {
    const initial = read();
    setMode(initial);
    apply(initial);
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ThemeMode>).detail;
      if (next === "mono-dark" || next === "mono-light") {
        setMode(next);
        apply(next);
      }
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setTheme = (next: ThemeMode) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
    setMode(next);
    apply(next);
  };

  const toggle = () => setTheme(mode === "mono-dark" ? "mono-light" : "mono-dark");

  return { mode, setTheme, toggle };
}
