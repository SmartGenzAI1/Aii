// frontend/store/chatStore.ts
"""
Chat store using Zustand for message and model state management.
"""

import { create } from "zustand";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type State = {
  messages: Message[];
  model: "fast" | "balanced" | "smart";
  isStreaming: boolean;
  
  addMessage: (m: Message) => void;
  appendToLast: (text: string) => void;
  setModel: (m: State["model"]) => void;
  setStreaming: (v: boolean) => void;
};

export const useChatStore = create<State>((set) => ({
  // Initial state
  messages: [],
  model: "fast",
  isStreaming: false,

  // Actions
  addMessage: (m) =>
    set((s) => ({ messages: [...s.messages, m] })),

  appendToLast: (text) =>
    set((s) => {
      const last = s.messages[s.messages.length - 1];
      if (!last) return s;
      last.content += text;
      return { messages: [...s.messages] };
    }),

  setModel: (model) => set({ model }),

  setStreaming: (isStreaming) => set({ isStreaming }),
}));
