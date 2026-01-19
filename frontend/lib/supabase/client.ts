// frontend/lib/supabase/client.ts
/**
 * Browser Supabase client with local storage fallback for development/demo mode
 * Falls back to localStorage when Supabase is not configured or unavailable
 */

import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('dummy') && !key.includes('dummy')
}

export const createClient = () => {
  if (isSupabaseConfigured()) {
    // Use real Supabase client
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  } else {
    // Return a mock client that uses localStorage
    return createLocalStorageClient()
  }
}

// Mock Supabase client using localStorage
function createLocalStorageClient() {
  return {
    auth: {
      getSession: async () => {
        try {
          const session = localStorage.getItem('genzai_session')
          return {
            data: {
              session: session ? JSON.parse(session) : null
            },
            error: null
          }
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

          localStorage.setItem('genzai_session', JSON.stringify(session))

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

          localStorage.setItem('genzai_session', JSON.stringify(session))

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
          localStorage.removeItem('genzai_session')
          return { error: null }
        } catch (error) {
          return { error: { message: 'Sign out failed' } }
        }
      },

      resetPasswordForEmail: async () => {
        return { error: { message: 'Password reset not available in demo mode' } }
      }
    },

    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            // Mock workspace data for local mode
            if (table === 'workspaces' && column === 'user_id') {
              return {
                data: {
                  id: 'demo-workspace',
                  name: 'Demo Workspace',
                  is_home: true,
                  user_id: value
                },
                error: null
              }
            }
            return { data: null, error: { message: 'Not found in local mode' } }
          }
        })
      })
    })
  }
}
