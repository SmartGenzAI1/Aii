// frontend/components/Chat/Composer.tsx

"use client";

/*
  Chat Composer
  - Handles Platform AI and BYO API modes
  - Supports streaming
  - Prevents double sends
  - Shows proper error states
*/

import { useState } from "react";
import { useSession } from "next-auth/react";

import { useChatStore } from "@/store/chatStore";
import { useSettingsStore } from "@/store/settingsStore";

import { streamChat } from "@/lib/api";
import { streamBYOChat } from "@/lib/byoClient";

export function Composer() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const { model, addMessage, appendToLast } = useChatStore();
  const { mode } = useSettingsStore();

  async function send() {
    if (!input.trim() || loading) return;

    setError(null);
    setLoading(true);

    const prompt = input.trim();
    setInput("");

    // Add user + placeholder assistant message
    addMessage({ role: "user", content: prompt });
    addMessage({ role: "assistant", content: "" });

    try {
      if (mode === "platform") {
        if (!session?.accessToken) {
          throw new Error("You must be logged in to use Platform AI.");
        }

        await streamChat(
          prompt,
          model,
          session.accessToken,
          appendToLast
        );
      } else {
        // BYO mode
        await streamBYOChat(prompt, model, appendToLast);
      }
    } catch (err: any) {
      console.error(err);

      appendToLast("\n\n⚠️ Something went wrong.");
      setError(
        err?.message ||
          "Unable to get response. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t pt-3">
      {error && (
        <p className="text-sm text-red-600 mb-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            loading
              ? "Waiting for response..."
              : "Ask anything..."
          }
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 border rounded px-3 py-2 text-sm disabled:bg-gray-100"
        />

        <button
          onClick={send}
          disabled={loading}
          className="bg-black text-white px-4 rounded text-sm disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {mode === "platform"
          ? "Using platform AI · daily limits apply"
          : "Using your own API key · requests go directly to provider"}
      </p>
    </div>
  );
  }
