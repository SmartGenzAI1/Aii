// @ts-nocheck - Suppress module resolution errors in this environment
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load theme from localStorage on mount
    try {
      const savedTheme = localStorage.getItem("genzai-theme") as Theme
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    } catch (error) {
      // localStorage not available (SSR or private browsing)
      console.warn("Unable to access localStorage for theme:", error)
    }
  }, [])

  useEffect(() => {
    // Save theme to localStorage
    try {
      localStorage.setItem("genzai-theme", theme)
    } catch (error) {
      // localStorage not available
      console.warn("Unable to save theme to localStorage:", error)
    }

    // Resolve actual theme based on system preference
    const resolveTheme = () => {
      if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      return theme
    }

    const newResolvedTheme = resolveTheme()
    setResolvedTheme(newResolvedTheme)

    // Apply theme to document
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(newResolvedTheme)

    // Listen for system theme changes when theme is "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        const newTheme = mediaQuery.matches ? "dark" : "light"
        setResolvedTheme(newTheme)
        root.classList.remove("light", "dark")
        root.classList.add(newTheme)
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}