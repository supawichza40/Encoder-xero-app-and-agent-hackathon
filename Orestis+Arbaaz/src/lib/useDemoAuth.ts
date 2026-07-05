import { useEffect, useState } from "react";

const AUTH_KEY = "payoutbridge.demoAuth";
const EVENT = "payoutbridge:auth-change";
const OPEN_EVENT = "payoutbridge:auth-open";

export type AuthDialog = "login" | "signup";
export type Persona = "owner" | "bookkeeper" | "freelancer";

export interface DemoUser {
  name: string;
  persona: Persona;
}

function read(): DemoUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    // migrate legacy "name" string
    if (!raw.startsWith("{")) {
      const migrated: DemoUser = { name: raw, persona: "owner" };
      localStorage.setItem(AUTH_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const parsed = JSON.parse(raw) as Partial<DemoUser>;
    if (!parsed?.name) return null;
    const persona: Persona =
      parsed.persona === "bookkeeper" || parsed.persona === "freelancer"
        ? parsed.persona
        : "owner";
    return { name: parsed.name, persona };
  } catch {
    return null;
  }
}

function write(user: DemoUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(EVENT));
}

export function openAuthDialog(kind: AuthDialog, persona?: Persona) {
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT, { detail: { kind, persona } }),
  );
}

export interface AuthOpenDetail {
  kind: AuthDialog;
  persona?: Persona;
}

export function useAuthDialogRequests(
  handler: (detail: AuthOpenDetail) => void,
) {
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<AuthOpenDetail | AuthDialog>).detail;
      if (typeof detail === "string") {
        if (detail === "login" || detail === "signup") handler({ kind: detail });
      } else if (detail && (detail.kind === "login" || detail.kind === "signup")) {
        handler(detail);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [handler]);
}

export function useDemoAuth() {
  const [user, setUser] = useState<DemoUser | null>(null);

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

  const login = (name: string, persona: Persona = "owner") => {
    const u: DemoUser = { name, persona };
    write(u);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new Event(EVENT));
    setUser(null);
  };
  const setPersona = (persona: Persona) => {
    if (!user) return;
    const u: DemoUser = { ...user, persona };
    write(u);
    setUser(u);
  };
  return { user, login, logout, setPersona };
}

export const PERSONA_LABEL: Record<Persona, string> = {
  owner: "Business owner",
  bookkeeper: "Bookkeeper",
  freelancer: "Freelancer",
};

