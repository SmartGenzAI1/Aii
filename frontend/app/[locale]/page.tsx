// @ts-nocheck
"use client"

import { GenZAISVG } from "@/components/icons/genzai-svg"
import { IconArrowRight, IconSparkles, IconBrain, IconBolt } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="flex size-full flex-col items-center justify-center p-8 genz-gradient-bg min-h-screen">
      <div className="text-center max-w-2xl genz-fade-in">
        <div className="mb-8 genz-bounce-in">
          <GenZAISVG theme={theme === "dark" ? "dark" : "light"} scale={0.25} />
        </div>

        <h1 className="text-6xl font-bold mb-4 genz-text-gradient genz-glow">
          GenZ AI
        </h1>

        <p className="text-xl text-white/90 mb-8 leading-relaxed genz-slide-in">
          🚀 Built by Owais Ahmad Dar from Kashmir - Class 12 Student
          <br />
          <span className="text-base text-white/70">The Ultimate AI Chat Experience for Gen Z ✨</span>
          <br />
          <span className="text-sm text-purple-200">Modern AI chat with multi-provider support, real-time failover, and vibes that match your energy 💫</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="genz-card genz-card-hover flex flex-col items-center p-6 rounded-xl border-0 bg-white/10 backdrop-blur-sm">
            <IconBrain className="size-10 text-purple-400 mb-3 genz-pulse" />
            <h3 className="font-bold text-white mb-2 text-lg">Multi-Provider AI</h3>
            <p className="text-sm text-white/80 text-center">Groq, Claude, GPT & more 🤖</p>
          </div>

          <div className="genz-card genz-card-hover flex flex-col items-center p-6 rounded-xl border-0 bg-white/10 backdrop-blur-sm">
            <IconBolt className="size-10 text-blue-400 mb-3 genz-pulse" />
            <h3 className="font-bold text-white mb-2 text-lg">Lightning Fast</h3>
            <p className="text-sm text-white/80 text-center">Real-time streaming & failover ⚡</p>
          </div>

          <div className="genz-card genz-card-hover flex flex-col items-center p-6 rounded-xl border-0 bg-white/10 backdrop-blur-sm">
            <IconSparkles className="size-10 text-pink-400 mb-3 genz-pulse" />
            <h3 className="font-bold text-white mb-2 text-lg">GenZ Built</h3>
            <p className="text-sm text-white/80 text-center">For the culture, by the culture ✨</p>
          </div>
        </div>

        <Link
          className="genz-btn-primary inline-flex items-center justify-center px-10 py-4 font-bold text-lg hover:shadow-2xl genz-hover-glow"
          href="/login"
        >
          Start Chatting Now 🚀
          <IconArrowRight className="ml-3" size={24} />
        </Link>

        <p className="text-sm text-white/60 mt-6 genz-text-shine">
          🔥 Built by Owais Ahmad Dar from Kashmir - Class 12 Student • v1.1.3 🔥
        </p>
      </div>
    </div>
  )
}
