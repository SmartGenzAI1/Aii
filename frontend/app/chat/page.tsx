// frontend/app/chat/page.tsx

import { ModelSelector } from "@/components/Chat/ModelSelector";
import { Composer } from "@/components/Chat/Composer";
import { useChatStore } from "@/store/chatStore";

export default function ChatPage() {
  const messages = useChatStore((s) => s.messages);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <ModelSelector />

      <div className="flex-1 overflow-y-auto space-y-4 my-4">
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.role === "user" ? "You" : "AI"}:</strong>
            <p>{m.content}</p>
          </div>
        ))}
      </div>

      <Composer />
    </div>
  );
}
