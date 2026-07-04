import { useEffect, useState } from "react";

const AUTH_KEY = "payoutbridge.demoAuth";
const EVENT = "payoutbridge:auth-change";
const OPEN_EVENT = "payoutbridge:auth-open";

export type AuthDialog = "login" | "signup";

function read(): string | null {
  try {
    return localStorage.getItem(AUTH_KEY);
  } catch {
    return null;
  }
}

export function openAuthDialog(kind: AuthDialog) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: kind }));
}

export function useAuthDialogRequests(
  handler: (kind: AuthDialog) => void,
) {
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<AuthDialog>).detail;
      if (detail === "login" || detail === "signup") handler(detail);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [handler]);
}

export function useDemoAuth() {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setUser(read());
    const onChange = () => setUser(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const login = (name: string) => {
    localStorage.setItem(AUTH_KEY, name);
    window.dispatchEvent(new Event(EVENT));
    setUser(name);
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new Event(EVENT));
    setUser(null);
  };
  return { user, login, logout };
}

