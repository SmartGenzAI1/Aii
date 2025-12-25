// ============================================
// FILE: frontend/store/settingsStore.ts
// Zustand settings state management
// ============================================

import { create } from "zustand";

type Mode = "platform" | "byo";

interface SettingsStore {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  mode: "platform",
  setMode: (mode) => set({ mode }),
}));

