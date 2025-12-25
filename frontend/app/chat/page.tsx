// ============================================
// FILE: frontend/app/chat/page.tsx
// Main chat interface - Modern Design
// ============================================

"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatArea } from "@/components/Chat/ChatArea";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex-1 flex gap-4 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <ChatSidebar />
      <ChatArea />
    </div>
  );
}
