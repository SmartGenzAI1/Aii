// ============================================
// FILE: frontend/app/faqs/page.tsx
// Frequently Asked Questions
// ============================================

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is GenZ AI?",
      a: "GenZ AI is a multi-provider AI platform that intelligently routes your requests to the fastest and most capable AI models available, including Groq, OpenRouter, and HuggingFace."
    },
    {
      q: "Why is it so fast?",
      a: "We use Groq's LPU (Language Processing Unit) inference engine, which can process tokens 10x faster than GPUs. We also cache responses and use intelligent routing to minimize latency."
    },
    {
      q: "What models are available?",
      a: "We offer three model tiers: Fast (Groq's Llama 3.1), Balanced (Groq's 70B), and Smart (OpenAI's GPT-4o via OpenRouter)."
    },
    {
      q: "How much do I get per day?",
      a: "Free users get 50 requests/day. Pro users get 500 requests/day. Quotas reset at midnight UTC."
    },
    {
      q: "Is my data private?",
      a: "Yes. We never store your prompts. We only log queries for abuse prevention. All communication is encrypted with HTTPS."
    },
    {
      q: "Can I use my own API key?",
      a: "Yes! In Settings, you can enable 'Bring Your Own API Key' mode to use your OpenRouter or Groq keys directly."
    },
    {
      q: "What happens if a provider is down?",
      a: "Our system automatically fails over to the next provider. You'll always get a response as long as at least one provider is available."
    },
    {
      q: "How do I contact support?",
      a: "Email us at support@genzai.app or open an issue on GitHub. We respond within 24 hours."
    },
  ];

  return (
    <div className="flex-1">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
        <p className="text-slate-300 mb-12">Find answers to common questions about GenZ AI.</p>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-blue-500/20 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-transparent hover:from-blue-500/20 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white text-left">{faq.q}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-blue-400 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 py-4 bg-slate-900/50 border-t border-blue-500/10">
                  <p className="text-slate-300">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
