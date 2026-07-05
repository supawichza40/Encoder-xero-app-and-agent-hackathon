import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamChat, OLLAMA_MODELS, OPENROUTER_MODELS, type ChatMessage } from "@/lib/ollama";

// Keys are env-only (no hardcoded defaults); endpoints for a provider are only
// built when its key is present, so stub both for the chain tests.
beforeEach(() => {
  vi.stubEnv("VITE_OLLAMA_API_KEY", "test-ollama-key");
  vi.stubEnv("VITE_OPENROUTER_API_KEY", "test-openrouter-key");
});

function sseResponse(lines: string[]): Response {
  const body = `${lines.join("\n\n")}\n\n`;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

const messages: ChatMessage[] = [{ role: "user", content: "hello" }];

describe("ollama.ts — streamChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("parses content and reasoning deltas from an SSE stream", async () => {
    const fetchMock = vi.fn(async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"reasoning":"Thinking A"}}]}',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        'data: {"choices":[{"delta":{"content":" world"}}]}',
        "data: [DONE]",
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const onToken = vi.fn();
    const onReasoning = vi.fn();
    const result = await streamChat({ messages, mode: "fast", onToken, onReasoning });

    expect(result.content).toBe("Hello world");
    expect(result.reasoning).toBe("Thinking A");
    expect(onToken).toHaveBeenNthCalledWith(1, "Hello");
    expect(onToken).toHaveBeenNthCalledWith(2, " world");
    expect(onReasoning).toHaveBeenCalledWith("Thinking A");
    // Dev mode (vitest runs with import.meta.env.DEV=true) tries the same-origin
    // Vite proxy first.
    expect(result.endpointId).toBe("ollama-dev-proxy");
  });

  it("falls back through the endpoint chain in order, reaching OpenRouter last", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("openrouter.ai")) {
        return sseResponse(['data: {"choices":[{"delta":{"content":"hi"}}]}', "data: [DONE]"]);
      }
      throw new TypeError("Failed to fetch");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await streamChat({ messages, mode: "fast" });

    expect(result.endpointId).toBe("openrouter");
    expect(result.content).toBe("hi");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls[0]).toBe("/api/ollama/v1/chat/completions");
    expect(urls[1]).toBe("https://ollama.com/v1/chat/completions");
    expect(urls[2]).toContain("corsproxy.io");
    expect(urls[3]).toBe("https://openrouter.ai/api/v1/chat/completions");
  });

  it("throws once every endpoint has failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(streamChat({ messages, mode: "fast" })).rejects.toThrow();
  });

  describe("abort", () => {
    it("rejects immediately without calling fetch when the signal is already aborted", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const controller = new AbortController();
      controller.abort();

      await expect(
        streamChat({ messages, mode: "fast", signal: controller.signal }),
      ).rejects.toMatchObject({ name: "AbortError" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("stops the whole chain (does not try further endpoints) on a mid-flight abort", async () => {
      const controller = new AbortController();
      const fetchMock = vi.fn(async () => {
        // Simulate a real fetch honoring the AbortSignal mid-request.
        controller.abort();
        throw new DOMException("Aborted", "AbortError");
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        streamChat({ messages, mode: "fast", signal: controller.signal }),
      ).rejects.toMatchObject({ name: "AbortError" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("mode -> model mapping", () => {
    it("maps fast/thinking to the documented Ollama models", async () => {
      const fetchMock = vi.fn(async () => sseResponse(["data: [DONE]"]));
      vi.stubGlobal("fetch", fetchMock);

      await streamChat({ messages, mode: "fast" });
      const fastBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(fastBody.model).toBe(OLLAMA_MODELS.fast);
      expect(fastBody.reasoning_effort).toBeUndefined();

      fetchMock.mockClear();
      await streamChat({ messages, mode: "thinking" });
      const thinkingBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(thinkingBody.model).toBe(OLLAMA_MODELS.thinking);
      expect(thinkingBody.reasoning_effort).toBe("high");
    });

    it("maps fast/thinking to the documented OpenRouter models with unified reasoning param", async () => {
      const fetchMock = vi.fn(async (url: string) => {
        if (url.includes("openrouter.ai")) return sseResponse(["data: [DONE]"]);
        throw new TypeError("Failed to fetch");
      });
      vi.stubGlobal("fetch", fetchMock);

      await streamChat({ messages, mode: "thinking" });
      const orCall = fetchMock.mock.calls.find((c) => (c[0] as string).includes("openrouter.ai"))!;
      const body = JSON.parse(orCall[1].body as string);
      expect(body.model).toBe(OPENROUTER_MODELS.thinking);
      expect(body.reasoning).toEqual({ effort: "high" });
    });
  });
});
