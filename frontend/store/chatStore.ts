// frontend/store/chatStore.ts

import { create } from "zustand";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type State = {
  messages: Message[];
  model: "fast" | "balanced" | "smart";
  addMessage: (m: Message) => void;
  appendToLast: (text: string) => void;
  setModel: (m: State["model"]) => void;
};

export const useChatStore = create<State>((set) => ({
  messages: [],
  model: "fast",

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
}));

isStreaming: false,
setStreaming: (v: boolean) => set({ isStreaming: v }),
