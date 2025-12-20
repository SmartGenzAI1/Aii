// frontend/components/Chat/Composer.tsx

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import { streamChat } from "@/lib/api";

export function Composer() {
  const [input, setInput] = useState("");
  const { data: session } = useSession();
  const { model, addMessage, appendToLast } = useChatStore();

  async function send() {
    if (!input || !session?.accessToken) return;

    addMessage({ role: "user", content: input });
    addMessage({ role: "assistant", content: "" });
    setInput("");

    await streamChat(
      input,
      model,
      session.accessToken,
      appendToLast
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 border rounded px-3 py-2"
        placeholder="Ask anything..."
      />
      <button
        onClick={send}
        className="bg-black text-white px-4 rounded"
      >
        Send
      </button>
    </div>
  );
}
