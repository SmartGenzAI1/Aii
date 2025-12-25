// ============================================
// FILE: frontend/components/Chat/ChatArea.tsx
// Main chat interface
// ============================================

"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { useSession } from "next-auth/react";
import { ModelSelector } from "./ModelSelector";
import { Message } from "./Message";
import { Composer } from "./Composer";
import { Plus, Zap } from "lucide-react";

export function ChatArea() {
  const { data: session } = useSession();
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const resetChat = useChatStore((s) => s.resetChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">GenZ AI Chat</h1>
        </div>
        <button
          onClick={resetChat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">What can I help you with?</h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              Ask me anything. I can answer questions, write code, explain concepts, and more.
            </p>
            <ModelSelector />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <Message
                key={index}
                role={message.role}
                content={message.content}
                isLast={index === messages.length - 1}
              />
            ))}
            {isStreaming && (
              <div className="flex gap-3 animate-fadeIn">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-blue-500/20 bg-slate-950/80 backdrop-blur-xl px-6 py-4">
        <Composer />
      </div>
    </div>
  );
}
