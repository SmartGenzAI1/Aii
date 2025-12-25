// ============================================
// FILE: frontend/store/chatStore.ts
// Zustand chat state management
// ============================================

import { create } from "zustand";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatStore {
  messages: Message[];
  model: "fast" | "balanced" | "smart";
  isStreaming: boolean;
  
  addMessage: (message: Message) => void;
  appendToLast: (text: string) => void;
  setModel: (model: "fast" | "balanced" | "smart") => void;
  setStreaming: (streaming: boolean) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  model: "fast",
  isStreaming: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLast: (text) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content: messages[messages.length - 1].content + text,
        };
      }
      return { messages };
    }),

  setModel: (model) => set({ model }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  resetChat: () => set({ messages: [], isStreaming: false }),
}));
