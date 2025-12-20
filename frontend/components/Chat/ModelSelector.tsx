// frontend/components/Chat/ModelSelector.tsx

"use client";

import { useChatStore } from "@/store/chatStore";

const models = [
  { id: "fast", label: "Fast ⚡" },
  { id: "balanced", label: "Balanced ⚖️" },
  { id: "smart", label: "Smart 🧠" },
];

export function ModelSelector() {
  const { model, setModel } = useChatStore();

  return (
    <div className="flex gap-2">
      {models.map((m) => (
        <button
          key={m.id}
          onClick={() => setModel(m.id as any)}
          className={`px-3 py-1 rounded text-sm ${
            model === m.id
              ? "bg-black text-white"
              : "bg-gray-200"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
