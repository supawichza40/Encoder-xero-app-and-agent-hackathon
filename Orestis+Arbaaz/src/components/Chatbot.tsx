import { useNavigate } from "@tanstack/react-router";
import { Maximize2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "bot"; text: string };

const initialMsgs: Msg[] = [
  { role: "bot", text: "Hi! I'm your PayoutBridge assistant. Ask me anything about your payouts, fees, or reconciliations." },
];

export function Chatbot({ fullPage = false }: { fullPage?: boolean }) {
  const [open, setOpen] = useState(fullPage);
  const [messages, setMessages] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "bot", text: "Thanks — this is a demo assistant. Real answers coming soon." },
    ]);
    setInput("");
  };

  const body = (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
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
