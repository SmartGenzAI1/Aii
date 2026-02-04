// @ts-nocheck
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface UserPreferences {
  theme: "light" | "dark" | "system"
  language: string
  notifications: boolean
  soundEffects: boolean
  autoSave: boolean
  compactMode: boolean
}

interface UIState {
  sidebarOpen: boolean
  activeChatId: string | null
  loadingStates: Record<string, boolean>
  errorMessages: Record<string, string | null>
}

interface AppState extends UserPreferences, UIState {
  // Actions
  setTheme: (theme: UserPreferences["theme"]) => void
  setLanguage: (language: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setActiveChat: (chatId: string | null) => void
  setLoading: (key: string, loading: boolean) => void
  setError: (key: string, error: string | null) => void
  clearAllErrors: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Default state
      theme: "system",
      language: "en",
      notifications: true,
      soundEffects: false,
      autoSave: true,
      compactMode: false,

      sidebarOpen: true,
      activeChatId: null,
      loadingStates: {},
      errorMessages: {},

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setActiveChat: (chatId) => set({ activeChatId: chatId }),

      setLoading: (key, loading) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading }
        })),

      setError: (key, error) =>
        set((state) => ({
          errorMessages: { ...state.errorMessages, [key]: error }
        })),

      clearAllErrors: () => set({ errorMessages: {} }),
    }),
    {
      name: "genzai-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notifications: state.notifications,
        soundEffects: state.soundEffects,
        autoSave: state.autoSave,
        compactMode: state.compactMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Selectors for performance
export const useTheme = () => useAppStore((state) => state.theme)
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen)
export const useLoadingState = (key: string) =>
  useAppStore((state) => state.loadingStates[key] || false)
export const useErrorMessage = (key: string) =>
  useAppStore((state) => state.errorMessages[key] || null)