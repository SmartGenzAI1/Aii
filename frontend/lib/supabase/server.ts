// frontend/lib/supabase/server.ts
/**
 * Supabase client with local storage fallback for development/demo mode
 * Falls back to localStorage when Supabase is not configured or unavailable
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('dummy') && !key.includes('dummy')
}

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  if (isSupabaseConfigured()) {
    // Use real Supabase client
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )
  } else {
    // Return a mock client that uses localStorage/sessionStorage
    return createLocalStorageClient()
  }
}

// Mock Supabase client using localStorage - comprehensive implementation
function createLocalStorageClient() {
  const mockAsyncFn = async () => ({ data: null, error: null })
  const mockChainable = {
    data: null,
    error: null,
    eq: () => mockChainable,
    single: mockAsyncFn,
    select: () => mockChainable,
    order: () => mockChainable,
    limit: () => mockChainable,
    insert: () => mockChainable,
    update: () => mockChainable,
    delete: () => mockChainable
  }

  return {
    auth: {
      getSession: async () => {
        try {
          if (typeof window !== 'undefined') {
            const session = localStorage.getItem('genzai_session')
            return {
              data: {
                session: session ? JSON.parse(session) : null
              },
              error: null
            }
          }
          return { data: { session: null }, error: null }
        } catch (error) {
          return { data: { session: null }, error: null }
        }
      },

      signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
        try {
          // Simple demo authentication - any email/password works
          const user = {
            id: 'local-user-' + Date.now(),
            email,
            user_metadata: { name: email.split('@')[0] }
          }

          const session = {
            access_token: 'local-token-' + Date.now(),
            refresh_token: 'local-refresh-' + Date.now(),
            user
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('genzai_session', JSON.stringify(session))
          }

          return { data: { user, session }, error: null }
        } catch (error) {
          return {
            data: { user: null, session: null },
            error: { message: 'Local authentication failed' }
          }
        }
      },

      signUp: async ({ email, password }: { email: string, password: string }) => {
        try {
          // Same as sign in for demo purposes
          const user = {
            id: 'local-user-' + Date.now(),
            email,
            user_metadata: { name: email.split('@')[0] }
          }

          const session = {
            access_token: 'local-token-' + Date.now(),
            refresh_token: 'local-refresh-' + Date.now(),
            user
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('genzai_session', JSON.stringify(session))
          }

          return { data: { user, session }, error: null }
        } catch (error) {
          return {
            data: { user: null, session: null },
            error: { message: 'Local registration failed' }
          }
        }
      },

      signOut: async () => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('genzai_session')
          }
          return { error: null }
        } catch (error) {
          return { error: { message: 'Sign out failed' } }
        }
      },

      resetPasswordForEmail: async () => {
        return { error: { message: 'Password reset not available in demo mode' } }
      },

      updateUser: async () => {
        return { data: { user: null }, error: { message: 'Update not available in demo mode' } }
      }
    },

    from: (table: string) => mockChainable,

    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Storage not available in demo mode' } }),
        download: async () => ({ data: null, error: { message: 'Storage not available in demo mode' } }),
        remove: async () => ({ data: null, error: { message: 'Storage not available in demo mode' } })
      })
    }
  }
}
