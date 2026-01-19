"use client"

import { GenZAIContext } from "@/context/context"
import { useContext, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Zap, Brain, Shield } from "lucide-react"

export default function WorkspacePage() {
  const { selectedWorkspace } = useContext(GenZAIContext)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    { icon: Sparkles, text: "AI-Powered", color: "text-purple-400" },
    { icon: Zap, text: "Lightning Fast", color: "text-yellow-400" },
    { icon: Brain, text: "Smart Learning", color: "text-blue-400" },
    { icon: Shield, text: "GenZ Safe", color: "text-green-400" },
  ]

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 p-8"
      >
        {/* GenZ AI Logo/Brand */}
        <motion.div
          className="mb-8"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            {selectedWorkspace?.name || "GenZ AI"}
          </h1>
          <p className="text-xl text-gray-300 font-light">
            The Future is Here ✨
          </p>
        </motion.div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <feature.icon className={`w-8 h-8 mb-2 ${feature.color}`} />
              <span className="text-sm text-gray-300 font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Time and status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-lg text-gray-400 mb-2">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI Systems Online</span>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-8"
        >
          <p className="text-gray-400 mb-4">
            Ready to experience the next generation of AI?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            Start Chatting 🚀
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center"
      >
        <div className="text-xs text-gray-500">
          Powered by GenZ AI Technology
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Built for the Future Generation
        </div>
      </motion.div>
    </div>
  )
}
