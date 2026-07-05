import { useNavigate } from "@tanstack/react-router";
import { Maximize2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoAuth, type Persona } from "@/lib/useDemoAuth";
import { fetchDashboard, fetchPnlSnapshot, fetchVatCheck } from "@/lib/usePayoutBridge";
import { streamChat, type ChatMessage, type ChatMode, type ChatRole } from "@/lib/ollama";

type Msg = {
  role: "user" | "bot";
  text: string;
  reasoning?: string;
  streaming?: boolean;
  offline?: boolean;
};

const initialMsgs: Msg[] = [
  {
    role: "bot",
    text: "Hi! I'm the PayoutBridge assistant. Ask me anything about this payout, Xero, or your accounts.",
  },
];

const PERSONA_PROMPTS: Record<string, string[]> = {
  owner: ["What did the platform take?", "Check my VAT", "Show me the audit trail"],
  bookkeeper: ["Show me the audit trail", "What did the platform take?", "Check my VAT"],
  freelancer: ["Is my income right for taxes?", "What did the platform take?", "Check my VAT"],
};

// Chat mode persisted across sessions; Fast is the default.
export const CHAT_MODE_STORAGE_KEY = "payoutbridge.chat.mode";
// Cap on how much prior conversation is replayed to the model per send.
const HISTORY_LIMIT = 12;

function readMode(): ChatMode {
  try {
    return localStorage.getItem(CHAT_MODE_STORAGE_KEY) === "thinking" ? "thinking" : "fast";
  } catch {
    return "fast";
  }
}

function fmtGBP(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "n/a";
  const n = Number(v);
  if (Number.isNaN(n)) return "n/a";
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function scriptedReply(prompt: string): Promise<string> {
  const q = prompt.toLowerCase();
  if (q.includes("platform") || q.includes("take")) {
    return "On the latest MarketplaceCo payout the platform took £445.90 commission and £47.10 in fees — £493 total against £1,340 gross.";
  }
  if (q.includes("audit")) {
    return "Opening the audit trail — every request, Xero ID, and timestamp is listed at the bottom of the workspace.";
  }
  if (q.includes("income") && q.includes("tax")) {
    return "For Self Assessment: report the gross £1,340 as income and the £493 platform fees as deductible expenses. Your net £847 is the cash you received, not your reportable income.";
  }
  if (q.includes("vat")) {
    const v = await fetchVatCheck();
    if (!v)
      return "Couldn't reach the VAT check endpoint. Ask your accountant to confirm treatment.";
    const rates = v.org_rates.map((r) => r.name).join(", ");
    return `Rates on file: ${rates}. This payout posted VAT-free — ${v.consistent ? "consistent" : "inconsistent"}. Ask your accountant to confirm treatment.`;
  }
  return "I'm a scripted demo assistant. Try one of the suggested prompts above.";
}

const PERSONA_SYSTEM: Record<Persona, string> = {
  owner:
    "The user is the business owner. Focus on cash flow and what the marketplace platform took from each payout.",
  bookkeeper:
    "The user is a bookkeeper. Focus on Xero ledger IDs, the audit trail, and reconciliation accuracy.",
  freelancer:
    "The user is a freelancer / sole trader. Focus on Self Assessment tax treatment of gross income vs platform fees.",
};

/** Assembles the system prompt from LIVE app state — never hardcoded figures. */
async function buildSystemPrompt(persona: Persona): Promise<string> {
  const [dashboard, vat, pnl] = await Promise.all([
    fetchDashboard(),
    fetchVatCheck(),
    fetchPnlSnapshot(),
  ]);

  const latest = dashboard?.recent_payouts?.[0];
  const payoutLine = latest
    ? `Latest payout on file: ${latest.date} from ${latest.source}, gross ${fmtGBP(latest.gross)}, net ${fmtGBP(latest.net)}, status "${latest.status}".`
    : "No payout has been recorded yet in this session.";

  const pnlLine = pnl?.after
    ? `P&L after posting: revenue ${fmtGBP(pnl.after.revenue)}, platform commission/fees ${fmtGBP(pnl.after.commission_expense)}, net profit ${fmtGBP(pnl.after.net_profit)}${pnl.before ? ` (before posting: revenue ${fmtGBP(pnl.before.revenue)}, net profit ${fmtGBP(pnl.before.net_profit)})` : ""}.`
    : "No P&L snapshot is available yet.";

  const vatLine = vat
    ? `VAT check: rates on file are ${vat.org_rates.map((r) => r.name).join(", ")}; this payout posted ${vat.consistent ? "consistently VAT-free" : "with a VAT inconsistency"}.`
    : "The VAT check endpoint could not be reached.";

  return [
    "You are the PayoutBridge assistant for a UK small business that sells through a marketplace and uses Xero for bookkeeping.",
    "PayoutBridge posts each marketplace settlement using a clearing-account gross-up: the full gross sale is booked as revenue into a Platform Clearing account, then the platform's commission and fees plus the net payout are posted against that same account until it nets to zero — so the business's true turnover (not just the smaller bank deposit) shows up in Xero.",
    PERSONA_SYSTEM[persona],
    payoutLine,
    pnlLine,
    vatLine,
    "Answer in 2-5 concise, helpful sentences, citing the figures above when relevant. You may also answer general accounting or bookkeeping questions unrelated to this specific payout.",
  ].join(" ");
}

export function Chatbot({ fullPage = false }: { fullPage?: boolean }) {
  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>(() => readMode());
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useDemoAuth();
  const persona = user?.persona ?? "owner";
  const prompts = PERSONA_PROMPTS[persona] ?? PERSONA_PROMPTS.owner;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Abort any in-flight stream on unmount.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const changeMode = (m: ChatMode) => {
    setMode(m);
    try {
      localStorage.setItem(CHAT_MODE_STORAGE_KEY, m);
    } catch {
      /* private mode — choice just won't persist across sessions */
    }
  };

  const submitText = async (text: string) => {
    // A new send supersedes any reply still streaming in.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const priorTurns = messages.slice(-HISTORY_LIMIT);
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: "", streaming: true }]);
    setInput("");

    try {
      const system = await buildSystemPrompt(persona);
      const chatHistory: ChatMessage[] = [
        { role: "system", content: system },
        ...priorTurns.map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as ChatRole,
          content: m.text,
        })),
        { role: "user", content: text },
      ];

      let liveText = "";
      let liveReasoning = "";
      await streamChat({
        messages: chatHistory,
        mode,
        signal: controller.signal,
        onToken: (delta) => {
          liveText += delta;
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { ...next[next.length - 1], text: liveText, streaming: true };
            return next;
          });
        },
        onReasoning: (delta) => {
          liveReasoning += delta;
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = {
              ...next[next.length - 1],
              reasoning: liveReasoning,
              streaming: true,
            };
            return next;
          });
        },
      });

      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { ...next[next.length - 1], streaming: false };
        return next;
      });
    } catch {
      // Superseded by a newer message or unmounted — leave state alone.
      if (controller.signal.aborted) return;
      const reply = await scriptedReply(text);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "bot", text: reply, offline: true, streaming: false };
        return next;
      });
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    void submitText(text);
  };

  const modeToggle = (
    <div
      role="group"
      aria-label="Response mode"
      className="flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 text-[11px]"
    >
      <button
        type="button"
        aria-pressed={mode === "fast"}
        onClick={() => changeMode("fast")}
        className={`rounded-full px-2 py-0.5 transition-colors ${
          mode === "fast"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Fast
      </button>
      <button
        type="button"
        aria-pressed={mode === "thinking"}
        onClick={() => changeMode("thinking")}
        className={`rounded-full px-2 py-0.5 transition-colors ${
          mode === "thinking"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Thinking
      </button>
    </div>
  );

  const body = (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.role === "bot" && m.reasoning ? (
                <details className="mb-1.5 text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">Thinking…</summary>
                  <p className="mt-1 whitespace-pre-wrap italic">{m.reasoning}</p>
                </details>
              ) : null}
              {m.role === "bot" && m.streaming && !m.text ? (
                <span className="inline-flex items-center gap-1" aria-label="Assistant is typing">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                </span>
              ) : (
                <span className="whitespace-pre-wrap">{m.text}</span>
              )}
              {m.role === "bot" && m.offline ? (
                <p className="mt-1 text-[11px] italic text-muted-foreground">
                  offline mode — scripted answer
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t px-3 pt-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => void submitText(p)}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {p}
          </button>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button type="submit" size="icon" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </>
  );

  if (fullPage) {
    return (
      <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-3xl flex-col rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2 font-semibold">
            <MessageCircle className="h-5 w-5 text-primary" />
            PayoutBridge Assistant
          </div>
          {modeToggle}
        </div>
        {body}
      </div>
    );
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
          <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/25 animate-ping" />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open chatbot"
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-2 ring-white/40 transition-all hover:scale-110 hover:shadow-2xl hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
          >
            <MessageCircle className="h-7 w-7" />
          </button>
        </div>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-lg border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <MessageCircle className="h-4 w-4 text-primary" />
              Assistant
            </div>
            <div className="flex items-center gap-1.5">
              {modeToggle}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open in full page"
                onClick={() => navigate({ to: "/chat" })}
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {body}
        </div>
      )}
    </>
  );
}
