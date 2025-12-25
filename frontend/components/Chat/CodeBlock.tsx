// ============================================
// FILE: frontend/components/Chat/CodeBlock.tsx
// Code syntax highlighting
// ============================================

"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-blue-500/20">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900/50 border-b border-blue-500/10">
        <span className="text-xs text-slate-400">Code</span>
        <button
          onClick={copy}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
