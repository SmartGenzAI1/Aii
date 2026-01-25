import { createClient } from "@/lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  // Apply i18n routing first
  const i18nResult = i18nRouter(request, i18nConfig)
  if (i18nResult) return i18nResult

  try {
    // Create Supabase client with proper error handling
    const { supabase, response } = createClient(request)

    // Get session with timeout protection
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session timeout')), 5000)
    )

    let session
    try {
      session = await Promise.race([sessionPromise, timeoutPromise])
    } catch (e) {
      // Session check timeout or error - continue with existing response
      return response
    }

    // Redirect authenticated users from home page to chat
    const redirectToChat = session?.data?.session && request.nextUrl.pathname === "/"

    if (redirectToChat) {
      try {
        const userId = session.data.session?.user?.id
        if (!userId) {
          throw new Error("User ID not found in session")
        }

        const { data: homeWorkspace, error } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", userId)
          .eq("is_home", true)
          .single()

        if (error) {
          console.error("Workspace fetch error:", error.message)
          // Return home response instead of throwing
          return response
        }

        if (!homeWorkspace) {
          console.warn("No home workspace found for user")
          return response
        }

        return NextResponse.redirect(
          new URL(`/${homeWorkspace.id}/chat`, request.url)
        )
      } catch (e) {
        console.error("Error redirecting to workspace:", e)
        // Continue with normal flow on error
        return response
      }
    }

    return response
  } catch (e) {
    console.error("Middleware error:", e)
    // Graceful fallback - continue request
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)"
}
