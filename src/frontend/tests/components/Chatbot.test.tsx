import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// jsdom doesn't implement Element.scrollTo — Chatbot calls it to keep the
// transcript pinned to the bottom on new messages.
Element.prototype.scrollTo = vi.fn();

// Chatbot renders useNavigate() unconditionally (used by the "open full page"
// button) — stub the router the same way Navbar.test.tsx does.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/ollama", () => ({
  streamChat: vi.fn(),
}));

vi.mock("@/lib/usePayoutBridge", () => ({
  fetchDashboard: vi.fn().mockResolvedValue(null),
  fetchVatCheck: vi.fn().mockResolvedValue(null),
  fetchPnlSnapshot: vi.fn().mockResolvedValue(null),
}));

import { Chatbot, CHAT_MODE_STORAGE_KEY } from "@/components/Chatbot";
import { streamChat } from "@/lib/ollama";

const streamChatMock = vi.mocked(streamChat);

async function sendMessage(text: string) {
  const input = screen.getByPlaceholderText(/type a message/i);
  await userEvent.type(input, text);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));
}

describe("Chatbot", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    streamChatMock.mockReset();
  });

  it("defaults to Fast mode and persists Thinking to localStorage on toggle", async () => {
    render(<Chatbot fullPage />);

    const fastBtn = screen.getByRole("button", { name: "Fast" });
    const thinkingBtn = screen.getByRole("button", { name: "Thinking" });
    expect(fastBtn).toHaveAttribute("aria-pressed", "true");
    expect(thinkingBtn).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(thinkingBtn);

    expect(thinkingBtn).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(CHAT_MODE_STORAGE_KEY)).toBe("thinking");
  });

  it("restores a persisted Thinking mode choice on mount", () => {
    localStorage.setItem(CHAT_MODE_STORAGE_KEY, "thinking");
    render(<Chatbot fullPage />);
    expect(screen.getByRole("button", { name: "Thinking" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("streams the reply incrementally into the bot bubble", async () => {
    streamChatMock.mockImplementation(async (opts) => {
      opts.onToken?.("Hello");
      opts.onToken?.(" there");
      return { content: "Hello there", reasoning: "", endpointId: "openrouter" };
    });

    render(<Chatbot fullPage />);
    await sendMessage("hi");

    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(streamChatMock).toHaveBeenCalledTimes(1);
    expect(streamChatMock.mock.calls[0][0].mode).toBe("fast");
  });

  it("shows a collapsed Thinking section fed by onReasoning, separate from the answer", async () => {
    streamChatMock.mockImplementation(async (opts) => {
      opts.onReasoning?.("weighing the options");
      opts.onToken?.("Final answer");
      return {
        content: "Final answer",
        reasoning: "weighing the options",
        endpointId: "openrouter",
      };
    });

    render(<Chatbot fullPage />);
    await sendMessage("hi");

    expect(await screen.findByText("Final answer")).toBeInTheDocument();
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
    expect(screen.getByText("weighing the options")).toBeInTheDocument();
  });

  it("falls back to the scripted reply with an offline notice when every endpoint fails", async () => {
    streamChatMock.mockRejectedValue(new Error("all endpoints failed"));

    render(<Chatbot fullPage />);
    await sendMessage("What did the platform take?");

    expect(await screen.findByText(/offline mode — scripted answer/i)).toBeInTheDocument();
    expect(screen.getByText(/£445\.90 commission/i)).toBeInTheDocument();
  });
});
