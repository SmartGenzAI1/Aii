// ============================================
// FILE: frontend/components/Chat/Composer.tsx
// Message input & send
// ============================================

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Send, Loader } from "lucide-react";

export function Composer() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const { model, addMessage, appendToLast, setStreaming } = useChatStore();
  const { mode } = useSettingsStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const prompt = input.trim();
    setInput("");
    setLoading(true);
    setStreaming(true);

    try {
      addMessage({ role: "user", content: prompt });
      addMessage({ role: "assistant", content: "" });

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const token = session?.accessToken;

      if (!backendUrl || !token) throw new Error("Configuration error");

      const response = await fetch(`${backendUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          model,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value));
      }
    } catch (error) {
      appendToLast(
        "\n\n❌ Error: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        disabled={loading}
        className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-blue-500/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50 transition-all"
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
