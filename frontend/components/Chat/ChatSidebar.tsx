// ============================================
// FILE: frontend/components/Chat/ChatSidebar.tsx
// Left sidebar with chat history
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import { MessageSquare, Settings, LogOut, BarChart3 } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function ChatSidebar() {
  const { data: session } = useSession();
  const messages = useChatStore((s) => s.messages);
  const [quota, setQuota] = useState({ used: 0, limit: 50 });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quota`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((r) => r.json())
        .then(setQuota)
        .catch(console.error);
    }
  }, [session?.accessToken, messages.length]);

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } border-r border-blue-500/20 bg-slate-950/80 backdrop-blur-xl flex flex-col transition-all duration-300`}
    >
      {/* Profile Section */}
      {!collapsed && (
        <div className="p-4 border-b border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
              {session?.user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session?.user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-slate-400">Pro</p>
            </div>
          </div>

          {/* Quota Bar */}
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-300">Daily Quota</span>
              <span className="text-xs text-blue-400 font-bold">
                {quota.used}/{quota.limit}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(quota.used / quota.limit) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!collapsed && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-3">
              Chat History
            </p>
            {messages.length > 0 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {messages[0]?.content?.substring(0, 30)}...
                    </p>
                    <p className="text-xs text-slate-400">Today</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">
                No chats yet
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className={`border-t border-blue-500/20 p-4 space-y-2`}>
        {!collapsed && (
          <>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500/10 transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>
    </div>
  );
}
