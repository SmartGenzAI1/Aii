// frontend/store/settingsStore.ts

import { create } from "zustand";

type Mode = "platform" | "byo";

type State = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

export const useSettingsStore = create<State>((set) => ({
  mode: "platform",
  setMode: (mode) => set({ mode }),
}));
