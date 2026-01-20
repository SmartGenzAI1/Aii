// @ts-nocheck
"use client"

import { GenZAISVG } from "@/components/icons/genzai-svg"
import { IconArrowRight, IconSparkles, IconBrain, IconZap } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="flex size-full flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <GenZAISVG theme={theme === "dark" ? "dark" : "light"} scale={0.25} />
        </div>

        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          GenZ AI
        </h1>

        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          🔥 The Ultimate AI Chat Experience for Gen Z
          <br />
          <span className="text-sm">Modern AI chat with multi-provider support, real-time failover, and vibes that match your energy</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <IconBrain className="size-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Multi-Provider AI</h3>
            <p className="text-sm text-muted-foreground text-center">Groq, Claude, GPT & more</p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <IconZap className="size-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Real-Time</h3>
            <p className="text-sm text-muted-foreground text-center">Instant failover & streaming</p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <IconSparkles className="size-8 text-primary mb-2" />
            <h3 className="font-semibold mb-1">GenZ Vibes</h3>
            <p className="text-sm text-muted-foreground text-center">Modern UI that slays</p>
          </div>
        </div>

        <Link
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          href="/login"
        >
          Start Chatting 🔥
          <IconArrowRight className="ml-2" size={20} />
        </Link>

        <p className="text-xs text-muted-foreground mt-4">
          Built for Gen Z, by Gen Z • v1.2.0
        </p>
      </div>
    </div>
  )
}
