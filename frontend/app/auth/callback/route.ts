import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  // Handle auth callback - in production this would validate the code
  // For now, just redirect to workspace since auth is handled by Supabase
  if (!code) {
    return NextResponse.redirect(requestUrl.origin + "/login?message=Invalid authentication code")
  }

  // Redirect to workspace after successful authentication
  return NextResponse.redirect(requestUrl.origin + "/workspace/chat")
}
