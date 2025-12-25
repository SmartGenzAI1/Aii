// ============================================
// FILE: frontend/components/Chat/ModelSelector.tsx
// Model selection buttons
// ============================================

"use client";

import { useChatStore } from "@/store/chatStore";
import { Zap, BarChart2, Brain } from "lucide-react";

const models = [
  {
    id: "fast",
    icon: Zap,
    label: "Fast",
    desc: "Groq - Instant responses",
  },
  {
    id: "balanced",
    icon: BarChart2,
    label: "Balanced",
    desc: "OpenRouter - Quality & speed",
  },
  {
    id: "smart",
    icon: Brain,
    label: "Smart",
    desc: "GPT-4o - Best quality",
  },
];

export function ModelSelector() {
  const { model, setModel } = useChatStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {models.map(({ id, icon: Icon, label, desc }) => (
        <button
          key={id}
          onClick={() => setModel(id as any)}
          className={`p-4 rounded-lg border transition-all ${
            model === id
              ? "border-blue-500 bg-blue-500/20 text-blue-400"
              : "border-blue-500/20 bg-slate-900/50 text-slate-400 hover:border-blue-400 hover:text-white"
          }`}
        >
          <Icon className="w-6 h-6 mb-2" />
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs opacity-70">{desc}</p>
        </button>
      ))}
    </div>
  );
}
