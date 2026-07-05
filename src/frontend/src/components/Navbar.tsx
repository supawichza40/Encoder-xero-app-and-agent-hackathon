import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  Calculator,
  ChevronDown,
  HelpCircle,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Sun,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  PERSONA_LABEL,
  useAuthDialogRequests,
  useDemoAuth,
  type AuthDialog,
  type AuthOpenDetail,
  type Persona,
} from "@/lib/useDemoAuth";
import { useTheme } from "@/lib/useTheme";
import { useDataMode } from "@/lib/useDataMode";

export function Navbar() {
  const { user, login, logout, setPersona } = useDemoAuth();
  const { mode, toggle } = useTheme();

  const [helpOpen, setHelpOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthDialog | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [signupPersona, setSignupPersona] = useState<Persona>("owner");
  const [personaOpen, setPersonaOpen] = useState(false);
  const { mock, fallback, health, setMode } = useDataMode();

  const openAuth = useCallback((detail: AuthOpenDetail) => {
    setAuthMode(detail.kind);
    if (detail.persona) setSignupPersona(detail.persona);
  }, []);
  useAuthDialogRequests(openAuth);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
        <nav
          aria-label="Primary"
          className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
        >
          <Link
            to="/"
            className="text-xl font-black tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Payout
            <span className="bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
              Bridge
            </span>
          </Link>

          {/* Status badges + Real/Demo data-source toggle */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex">
              {health?.xero_connected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-500">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Xero ·{" "}
                  {health.organisation} ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-500">
                  <span className="size-1.5 rounded-full bg-amber-500" /> Xero offline
                </span>
              )}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={!mock}
              aria-label={
                mock ? "Data source: Demo. Switch to Live" : "Data source: Live. Switch to Demo"
              }
              title={
                fallback
                  ? "Backend unreachable — auto-fell-back to Demo data"
                  : mock
                    ? "Showing Demo data. Click for Live (real backend)"
                    : "Showing Live data. Click for Demo"
              }
              onClick={() => setMode(!mock)}
              className="relative inline-flex h-7 select-none items-center rounded-full border border-border bg-card p-0.5 text-[11px] font-semibold transition-colors duration-200 hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                aria-hidden
                className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full border transition-transform duration-200 ease-out ${
                  mock
                    ? "translate-x-0 border-blue-500/40 bg-blue-500/15"
                    : "translate-x-full border-emerald-500/40 bg-emerald-500/15"
                }`}
              />
              <span
                className={`relative z-10 px-2.5 transition-colors duration-200 ${mock ? "text-blue-500" : "text-muted-foreground"}`}
              >
                Demo
              </span>
              <span
                className={`relative z-10 inline-flex items-center gap-1 px-2.5 transition-colors duration-200 ${!mock ? "text-emerald-500" : "text-muted-foreground"}`}
              >
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${!mock ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                />
                Live
              </span>
            </button>

            {fallback ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                <span className="size-1.5 rounded-full bg-amber-500" aria-hidden /> Demo data ·
                backend offline
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground bg-card" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Home className="size-4" aria-hidden />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/app"
              activeProps={{ className: "text-foreground bg-card" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LayoutGrid className="size-4" aria-hidden />
              <span className="hidden sm:inline">Workspace</span>
            </Link>
            <Link
              to="/chat"
              activeProps={{ className: "text-foreground bg-card" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MessageCircle className="size-4" aria-hidden />
              <span className="hidden sm:inline">Assistant</span>
            </Link>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HelpCircle className="size-4" aria-hidden />
              <span className="hidden sm:inline">Help</span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={mode === "mono-light"}
              aria-label={mode === "mono-dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "mono-dark" ? "Light mode" : "Dark mode"}
              onClick={toggle}
              className="relative inline-flex h-7 w-14 items-center rounded-full border border-border bg-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                className={`absolute inset-y-0.5 left-0.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow transition-transform ${
                  mode === "mono-light" ? "translate-x-7" : "translate-x-0"
                }`}
              >
                {mode === "mono-light" ? (
                  <Sun className="size-3.5" aria-hidden />
                ) : (
                  <Moon className="size-3.5" aria-hidden />
                )}
              </span>
              <span className="sr-only">
                Current theme: {mode === "mono-light" ? "light" : "dark"}
              </span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPersonaOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={personaOpen}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PersonaIcon persona={user.persona} />
                  <span className="hidden sm:inline">{PERSONA_LABEL[user.persona]}</span>
                  <ChevronDown className="size-3" />
                </button>
                {personaOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-lg"
                    onMouseLeave={() => setPersonaOpen(false)}
                  >
                    {(["owner", "bookkeeper", "freelancer"] as Persona[]).map((p) => (
                      <button
                        key={p}
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setPersona(p);
                          setPersonaOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-background ${
                          user.persona === p ? "font-semibold text-primary" : "text-foreground"
                        }`}
                      >
                        <PersonaIcon persona={p} />
                        {PERSONA_LABEL[p]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Log out</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-500 transition-colors hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <LogIn className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Log in</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <UserPlus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Sign up</span>
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
      {authMode ? (
        <AuthDialogView
          mode={authMode}
          value={nameInput}
          onChange={setNameInput}
          persona={signupPersona}
          onPersonaChange={setSignupPersona}
          onSwitchMode={(next) => setAuthMode(next)}
          onClose={() => {
            setAuthMode(null);
            setNameInput("");
          }}
          onSubmit={() => {
            const trimmed = nameInput.trim();
            if (!trimmed) return;
            login(trimmed, authMode === "signup" ? signupPersona : "owner");
            setAuthMode(null);
            setNameInput("");
          }}
        />
      ) : null}
    </>
  );
}

function PersonaIcon({ persona }: { persona: Persona }) {
  if (persona === "bookkeeper") return <Calculator className="size-3.5" aria-hidden />;
  if (persona === "freelancer") return <User className="size-3.5" aria-hidden />;
  return <Briefcase className="size-3.5" aria-hidden />;
}

function Modal({
  title,
  onClose,
  children,
  labelledBy,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={labelledBy} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to use PayoutBridge" labelledBy="help-title" onClose={onClose}>
      <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <section>
          <h3 className="text-base font-semibold">1. Open the app</h3>
          <p className="mt-1 text-muted-foreground">
            Click <strong>Launch PayoutBridge</strong> on the home page, or navigate to{" "}
            <code className="rounded bg-background px-1">/app</code>.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold">2. Upload a settlement CSV</h3>
          <p className="mt-1 text-muted-foreground">
            Drag and drop a marketplace settlement <code>.csv</code> into the drop zone, or click to
            pick a file. The demo runs in mock mode by default — any CSV works.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold">3. Review the proposal</h3>
          <p className="mt-1 text-muted-foreground">
            PayoutBridge parses the payout and shows the three Xero writes it plans to make: a gross
            ACCREC invoice, a fees expense, and a payment against the bank deposit.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold">4. Approve</h3>
          <p className="mt-1 text-muted-foreground">
            Click <strong>Approve &amp; post to Xero</strong>. Watch the step progress, then confirm
            the clearing account balances to £0.00 and the corrected P&amp;L.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold">5. Re-upload safely</h3>
          <p className="mt-1 text-muted-foreground">
            PayoutBridge is idempotent by file hash. Uploading the same statement twice surfaces the
            existing Xero IDs instead of double-posting.
          </p>
        </section>
        <section className="rounded-lg border border-border bg-background/50 p-4">
          <h3 className="text-sm font-semibold">Keyboard shortcuts</h3>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <kbd className="rounded border border-border px-1.5">Esc</kbd> — close a dialog
            </li>
            <li>
              <kbd className="rounded border border-border px-1.5">Tab</kbd> — move focus through
              nav, upload, and approval controls
            </li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}

function AuthDialogView({
  mode,
  value,
  onChange,
  onSubmit,
  onClose,
  onSwitchMode,
  persona,
  onPersonaChange,
}: {
  mode: AuthDialog;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onSwitchMode: (next: AuthDialog) => void;
  persona: Persona;
  onPersonaChange: (p: Persona) => void;
}) {
  const isSignup = mode === "signup";
  const title = isSignup ? "Create your account" : "Log in";
  return (
    <Modal title={title} labelledBy="auth-title" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted-foreground">
          {isSignup
            ? "This demo has no backend auth. Pick a display name to create a simulated account."
            : "This demo has no backend auth. Enter a display name to simulate a signed-in session."}
        </p>
        {isSignup ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">I am…</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "owner", title: "I run the business", sub: "See true turnover" },
                  { id: "bookkeeper", title: "I keep the books", sub: "Every figure traceable" },
                  { id: "freelancer", title: "I work for myself", sub: "Income for taxes" },
                ] as { id: Persona; title: string; sub: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPersonaChange(c.id)}
                  className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                    persona === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <PersonaIcon persona={c.id} /> {c.title}
                  </div>
                  <div className="mt-1 text-muted-foreground">{c.sub}</div>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <label className="flex flex-col gap-2 text-sm font-medium">
          Display name
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Alex"
            className="rounded-md border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {isSignup ? (
          <label className="flex flex-col gap-2 text-sm font-medium">
            Work email <span className="text-muted-foreground font-normal">(optional)</span>
            <input
              type="email"
              placeholder="you@company.com"
              className="rounded-md border border-border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => onSwitchMode(isSignup ? "login" : "signup")}
            className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {isSignup ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
              disabled={!value.trim()}
            >
              {isSignup ? "Create account" : "Log in"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
