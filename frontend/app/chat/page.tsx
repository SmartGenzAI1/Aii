// frontend/app/chat/page.tsx

"use client";

import { useChatStore } from "@/store/chatStore";
import { ModelSelector } from "@/components/Chat/ModelSelector";
import { Composer } from "@/components/Chat/Composer";
import { Message } from "@/components/Chat/Message";
import { Thinking } from "@/components/Chat/Thinking";

export default function ChatPage() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <ModelSelector />

      <div className="flex-1 overflow-y-auto space-y-6 my-4">
        {messages.map((m, i) => (
          <Message
            key={i}
            role={m.role}
            content={m.content}
          />
        ))}

        {isStreaming && <Thinking />}
      </div>

      <Composer />
    </div>
  );
}
