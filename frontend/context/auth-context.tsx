import { Tables } from "@root/supabase/types"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  profile: Tables<"profiles"> | null
  setProfile: (profile: Tables<"profiles"> | null) => void
  loading: boolean
  user: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          // Fetch profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single()

          setProfile(profile || null)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .single()

            setProfile(profile || null)
          } catch (error) {
            console.error("Profile fetch error:", error)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    profile,
    setProfile,
    loading,
    user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}