// Streaming LLM chat client for the PayoutBridge chatbot.
//
// Tries a chain of endpoints, fastest/most-local first, falling back on any
// network/CORS/HTTP error. See PREFLIGHT.md §9 for the probe-verified facts
// behind this ordering (Ollama Cloud has no CORS support; OpenRouter does).
//
// Keys ship in the client bundle BY EXPLICIT USER DECISION for this hackathon
// demo (rotated after the event) — do not move them server-side.

export type ChatMode = "fast" | "thinking";
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface StreamChatCallbacks {
  onToken?: (delta: string) => void;
  onReasoning?: (delta: string) => void;
}

export interface StreamChatOptions extends StreamChatCallbacks {
  messages: ChatMessage[];
  mode: ChatMode;
  signal?: AbortSignal;
}

export type EndpointId = "ollama-dev-proxy" | "ollama-direct" | "corsproxy" | "openrouter";

export interface StreamChatResult {
  content: string;
  reasoning: string;
  endpointId: EndpointId;
}

// Model mapping per mode (PREFLIGHT.md §9 "Modes"). Exported for tests.
export const OLLAMA_MODELS: Record<ChatMode, string> = {
  fast: "gpt-oss:120b",
  thinking: "glm-5.2",
};

export const OPENROUTER_MODELS: Record<ChatMode, string> = {
  fast: "openai/gpt-oss-20b:free",
  thinking: "openai/gpt-oss-120b:free",
};

// Keys come from the environment at build time (src/frontend/.env.local for
// dev and local Pages builds — git-ignored; see docs/DEPLOY.md). A missing key
// disables that provider's endpoints and the chain falls through to the next
// transport, ultimately the scripted offline fallback.
function ollamaApiKey(): string {
  return (import.meta.env.VITE_OLLAMA_API_KEY as string | undefined) || "";
}

function openrouterApiKey(): string {
  return (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) || "";
}

const OLLAMA_CHAT_PATH = "/v1/chat/completions";
const CORSPROXY_PREFIX = "https://corsproxy.io/?url=";

interface EndpointConfig {
  id: EndpointId;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  // Short timeout for "cheap attempt" endpoints that are expected to fail fast
  // in a real browser today; longer for the endpoints known to work.
  timeoutMs: number;
}

function ollamaBody(mode: ChatMode, messages: ChatMessage[]): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: OLLAMA_MODELS[mode],
    messages,
    stream: true,
  };
  if (mode === "thinking") body.reasoning_effort = "high";
  return body;
}

function openrouterBody(mode: ChatMode, messages: ChatMessage[]): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: OPENROUTER_MODELS[mode],
    messages,
    stream: true,
  };
  if (mode === "thinking") body.reasoning = { effort: "high" };
  return body;
}

function buildEndpoints(mode: ChatMode, messages: ChatMessage[]): EndpointConfig[] {
  const ollamaHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ollamaApiKey()}`,
  };
  const openrouterHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openrouterApiKey()}`,
    "HTTP-Referer": "https://payoutbridge.app",
    "X-Title": "PayoutBridge",
  };

  const endpoints: EndpointConfig[] = [];

  if (ollamaApiKey()) {
    if (import.meta.env.DEV) {
      endpoints.push({
        id: "ollama-dev-proxy",
        url: `/api/ollama${OLLAMA_CHAT_PATH}`,
        headers: ollamaHeaders,
        body: ollamaBody(mode, messages),
        timeoutMs: 30000,
      });
    }

    endpoints.push({
      id: "ollama-direct",
      url: `https://ollama.com${OLLAMA_CHAT_PATH}`,
      headers: ollamaHeaders,
      body: ollamaBody(mode, messages),
      timeoutMs: 4000,
    });

    endpoints.push({
      id: "corsproxy",
      url: `${CORSPROXY_PREFIX}${encodeURIComponent(`https://ollama.com${OLLAMA_CHAT_PATH}`)}`,
      headers: ollamaHeaders,
      body: ollamaBody(mode, messages),
      timeoutMs: 4000,
    });
  }

  if (openrouterApiKey()) {
    endpoints.push({
      id: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: openrouterHeaders,
      body: openrouterBody(mode, messages),
      timeoutMs: 30000,
    });
  }

  return endpoints;
}

interface StreamDelta {
  content?: string;
  reasoning?: string;
  reasoning_content?: string;
}

/** Parse one SSE `data: {...}` line, returning the delta object if present. */
function parseSseLine(line: string): StreamDelta | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const data = trimmed.slice(5).trim();
  if (!data || data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data) as {
      choices?: { delta?: StreamDelta }[];
    };
    return parsed.choices?.[0]?.delta ?? null;
  } catch {
    return null; // malformed/partial line — ignore
  }
}

async function consumeSseStream(
  response: Response,
  callbacks: StreamChatCallbacks,
): Promise<{ content: string; reasoning: string }> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response has no readable body");
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep the last (possibly partial) line

    for (const line of lines) {
      const delta = parseSseLine(line);
      if (!delta) continue;
      if (typeof delta.content === "string" && delta.content.length > 0) {
        content += delta.content;
        callbacks.onToken?.(delta.content);
      }
      const reasoningDelta = delta.reasoning ?? delta.reasoning_content;
      if (typeof reasoningDelta === "string" && reasoningDelta.length > 0) {
        reasoning += reasoningDelta;
        callbacks.onReasoning?.(reasoningDelta);
      }
    }
  }

  // Flush any trailing buffered line (stream ended without a final newline).
  const delta = parseSseLine(buffer);
  if (delta) {
    if (typeof delta.content === "string" && delta.content.length > 0) {
      content += delta.content;
      callbacks.onToken?.(delta.content);
    }
    const reasoningDelta = delta.reasoning ?? delta.reasoning_content;
    if (typeof reasoningDelta === "string" && reasoningDelta.length > 0) {
      reasoning += reasoningDelta;
      callbacks.onReasoning?.(reasoningDelta);
    }
  }

  return { content, reasoning };
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

async function attemptEndpoint(
  ep: EndpointConfig,
  externalSignal: AbortSignal | undefined,
  callbacks: StreamChatCallbacks,
): Promise<StreamChatResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ep.timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort);
  }

  try {
    const res = await fetch(ep.url, {
      method: "POST",
      headers: ep.headers,
      body: JSON.stringify(ep.body),
      signal: controller.signal,
    });
    // Timeout guards connection + headers only — a slow but healthy stream
    // (e.g. a long "thinking" answer) must never be cut off mid-reply.
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`${ep.id} responded HTTP ${res.status}`);
    const { content, reasoning } = await consumeSseStream(res, callbacks);
    return { content, reasoning, endpointId: ep.id };
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Stream a chat completion, trying each transport in the fallback chain in
 * order until one succeeds. Throws once every endpoint has failed, or
 * immediately (without trying further endpoints) if the caller's `signal`
 * was aborted — callers should fall back to the scripted reply on throw.
 */
export async function streamChat(opts: StreamChatOptions): Promise<StreamChatResult> {
  const { messages, mode, signal, onToken, onReasoning } = opts;
  const endpoints = buildEndpoints(mode, messages);
  let lastError: unknown;

  for (const ep of endpoints) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    // Once an endpoint has streamed visible tokens, falling through to the
    // next endpoint would replay the whole answer into the same bubble — so a
    // mid-stream failure after first token is fatal, not retryable.
    let emitted = false;
    const guardedCallbacks: StreamChatCallbacks = {
      onToken: (delta) => {
        emitted = true;
        onToken?.(delta);
      },
      onReasoning: (delta) => {
        emitted = true;
        onReasoning?.(delta);
      },
    };
    try {
      return await attemptEndpoint(ep, signal, guardedCallbacks);
    } catch (err) {
      // A user-initiated abort should stop the whole chain, not fall through.
      if (isAbortError(err) && signal?.aborted) throw err;
      if (emitted) throw err instanceof Error ? err : new Error(`${ep.id} failed mid-stream`);
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All chat endpoints failed");
}
