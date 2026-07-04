import { createFileRoute } from "@tanstack/react-router";
import { Chatbot } from "@/components/Chatbot";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Assistant — PayoutBridge" },
      { name: "description", content: "Chat with the PayoutBridge assistant." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Chatbot fullPage />
      </main>
    </>
  );
}
