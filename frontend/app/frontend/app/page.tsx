// ============================================
// FILE: frontend/app/page.tsx
// Home/Landing page
// ============================================

"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Zap, Brain, Shield, TrendingUp } from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-fadeIn">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            The Future of AI Chat
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Experience lightning-fast AI responses powered by Groq, OpenRouter, and HuggingFace. 
            Smart routing. Intelligent failover. Your privacy protected.
          </p>
          <div className="flex gap-4 justify-center">
            {session ? (
              <Link
                href="/chat"
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/50"
              >
                Start Chatting <ArrowRight className="inline ml-2 w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/api/auth/signin"
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/50"
              >
                Get Started <ArrowRight className="inline ml-2 w-5 h-5" />
              </Link>
            )}
            <Link
              href="/about"
              className="px-8 py-4 rounded-lg border border-blue-500/50 hover:border-blue-400 text-white font-bold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why GenZ AI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, label: "Lightning Fast", desc: "Sub-200ms responses via Groq" },
            { icon: Brain, label: "Smart Routing", desc: "Automatic provider selection" },
            { icon: Shield, label: "Secure", desc: "JWT auth & encrypted tokens" },
            { icon: TrendingUp, label: "Reliable", desc: "99.8% uptime guarantee" },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400 transition-all group cursor-pointer"
            >
              <Icon className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-2">{label}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {[
            { plan: "Free", price: "$0", quota: "50 requests/day", features: ["Groq Access", "OpenRouter Access", "Web Search"] },
            { plan: "Pro", price: "$9", quota: "500 requests/day", features: ["All Free Features", "Priority Support", "Analytics"] },
          ].map(({ plan, price, quota, features }, i) => (
            <div
              key={i}
              className={`p-8 rounded-xl border transition-all ${
                i === 1
                  ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400 relative"
                  : "bg-slate-900/50 border-blue-500/20 hover:border-blue-400"
              }`}
            >
              {i === 1 && <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">Popular</div>}
              <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
              <p className="text-3xl font-bold text-blue-400 mb-2">{price}<span className="text-lg text-slate-400">/mo</span></p>
              <p className="text-slate-400 mb-6">{quota}</p>
              <ul className="space-y-3 mb-8">
                {features.map((f, j) => (
                  <li key={j} className="text-slate-300 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                i === 1
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border border-blue-500/50 text-white hover:bg-blue-500/10"
              }`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
