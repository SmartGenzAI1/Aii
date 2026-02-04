// frontend/lib/supabase/browser-client.ts
/**
 * Browser Supabase client with local storage fallback for development/demo mode
 * Falls back to localStorage when Supabase is not configured or unavailable
 */

import { Database } from "@/supabase/types"
import { createBrowserClient } from "@supabase/ssr"

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('dummy') && !key.includes('dummy')
}

export const supabase = isSupabaseConfigured()
  ? createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : createLocalStorageClient()

// Mock Supabase client - simple fallback that returns expected data structures
function createLocalStorageClient() {
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
      },

      signUp: async ({ email, password }: { email: string, password: string }) => {
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
      },

      signOut: async () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('genzai_session')
        }
        return { error: null }
      },

      resetPasswordForEmail: async () => ({ error: { message: 'Not available in demo mode' } }),
      updateUser: async () => ({ data: { user: null }, error: { message: 'Not available in demo mode' } })
    },

    from: (tableName: string) => ({
      select: (fields?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (tableName === 'workspaces') {
              return {
                data: {
                  id: value || 'demo-workspace',
                  name: 'Demo Workspace',
                  is_home: true,
                  user_id: 'demo-user',
                  instructions: 'Welcome to GenZ AI demo workspace!',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              }
            }
            return { data: null, error: { message: 'Not found' } }
          },
          order: () => ({
            then: async (resolve: any) => resolve({ data: [], error: null })
          }),
          then: async (resolve: any) => resolve({ data: [], error: null })
        }),
        single: async () => {
          if (tableName === 'workspaces') {
            return {
              data: {
                id: 'demo-workspace',
                name: 'Demo Workspace',
                assistants: [] // For getAssistantWorkspacesByWorkspaceId
              },
              error: null
            }
          }
          return { data: null, error: { message: 'Not found' } }
        },
        order: () => ({
          then: async (resolve: any) => resolve({ data: [], error: null })
        }),
        then: async (resolve: any) => resolve({ data: [], error: null })
      }),
      insert: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) })
    }),

    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Storage not available in demo mode' } }),
        download: async () => ({ data: null, error: { message: 'Storage not available in demo mode' } }),
        remove: async () => ({ data: null, error: { message: 'Storage not available in demo mode' } })
      })
    }
  }
}
