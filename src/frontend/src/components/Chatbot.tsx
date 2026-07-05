import { useNavigate } from "@tanstack/react-router";
import { Maximize2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoAuth } from "@/lib/useDemoAuth";
import { fetchVatCheck } from "@/lib/usePayoutBridge";

type Msg = { role: "user" | "bot"; text: string };

const initialMsgs: Msg[] = [
  {
    role: "bot",
    text: "Hi! I'm the PayoutBridge demo assistant. Try one of the suggestions below.",
  },
];

const PERSONA_PROMPTS: Record<string, string[]> = {
  owner: ["What did the platform take?", "Check my VAT", "Show me the audit trail"],
  bookkeeper: ["Show me the audit trail", "What did the platform take?", "Check my VAT"],
  freelancer: ["Is my income right for taxes?", "What did the platform take?", "Check my VAT"],
};

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

export function Chatbot({ fullPage = false }: { fullPage?: boolean }) {
  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useDemoAuth();
  const prompts = PERSONA_PROMPTS[user?.persona ?? "owner"] ?? PERSONA_PROMPTS.owner;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const submitText = async (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    const reply = await scriptedReply(text);
    setMessages((m) => [...m, { role: "bot", text: reply }]);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    void submitText(text);
  };

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
              {m.text}
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
            <div className="flex items-center gap-1">
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
