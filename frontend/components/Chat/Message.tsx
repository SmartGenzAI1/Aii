// ============================================
// FILE: frontend/components/Chat/Message.tsx
// Individual message display
// ============================================

"use client";

import { MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isLast?: boolean;
}

export function Message({ role, content, isLast }: MessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse code blocks
  const parts = content.split(/```[\w]*\n/);

  return (
    <div className={`flex gap-4 animate-fadeIn ${role === "user" ? "justify-end" : ""}`}>
      {/* Avatar */}
      {role === "assistant" && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-xl rounded-xl px-4 py-3 ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-slate-900/80 text-slate-100 border border-blue-500/20"
        }`}
      >
        {parts.length > 1 ? (
          <div className="space-y-3">
            {parts.map((part, i) => (
              <div key={i}>
                {i > 0 && part.includes("```") ? (
                  <CodeBlock code={part.split("```")[0]} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{part}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}

        {/* Actions */}
        {role === "assistant" && isLast && (
          <button
            onClick={copyToClipboard}
            className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
