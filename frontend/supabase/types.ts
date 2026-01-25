// Minimal Supabase types for build compatibility
// These should be regenerated with: npx supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          // UI/behavior flags
          use_azure_openai?: boolean
          // API Keys added by server helpers
          openai_api_key?: string
          anthropic_api_key?: string
          google_gemini_api_key?: string
          mistral_api_key?: string
          groq_api_key?: string
          perplexity_api_key?: string
          azure_openai_api_key?: string
          openrouter_api_key?: string
          openai_organization_id?: string
          azure_openai_endpoint?: string
          azure_openai_35_turbo_id?: string
          azure_openai_45_vision_id?: string
          azure_openai_45_turbo_id?: string
          azure_openai_embeddings_id?: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          is_home: boolean
          user_id: string
          instructions: string
          created_at: string
          updated_at: string
          default_model: string | null
          default_prompt: string | null
          default_temperature: number | null
          default_context_length: number | null
          include_profile_context: boolean | null
          include_workspace_instructions: boolean | null
          embeddings_provider: string | null
        }
        Insert: {
          id?: string
          name: string
          is_home?: boolean
          user_id: string
          instructions?: string
          created_at?: string
          updated_at?: string
          default_model?: string | null
          default_prompt?: string | null
          default_temperature?: number | null
          default_context_length?: number | null
          include_profile_context?: boolean | null
          include_workspace_instructions?: boolean | null
          embeddings_provider?: string | null
        }
        Update: {
          id?: string
          name?: string
          is_home?: boolean
          user_id?: string
          instructions?: string
          created_at?: string
          updated_at?: string
          default_model?: string | null
          default_prompt?: string | null
          default_temperature?: number | null
          default_context_length?: number | null
          include_profile_context?: boolean | null
          include_workspace_instructions?: boolean | null
          embeddings_provider?: string | null
        }
      }
      tools: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          name: string
          description: string | null
          url: string
          schema: Json
          custom_headers: Json
          sharing: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          name: string
          description?: string | null
          url: string
          schema?: Json
          custom_headers?: Json
          sharing?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          name?: string
          description?: string | null
          url?: string
          schema?: Json
          custom_headers?: Json
          sharing?: string
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          name: string
          content: string
          sharing: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          name: string
          content: string
          sharing?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          name?: string
          content?: string
          sharing?: string
          created_at?: string
          updated_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          user_id: string
          folder_id: string
          name: string
          description: string
          image_path: string
          model: string
          prompt: string
          temperature: number
          context_length: number
          include_profile_context: boolean
          include_workspace_instructions: boolean
          embeddings_provider: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string
          name: string
          description?: string
          image_path?: string
          model: string
          prompt: string
          temperature: number
          context_length: number
          include_profile_context: boolean
          include_workspace_instructions: boolean
          embeddings_provider: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string
          name?: string
          description?: string
          image_path?: string
          model?: string
          prompt?: string
          temperature?: number
          context_length?: number
          include_profile_context?: boolean
          include_workspace_instructions?: boolean
          embeddings_provider?: string
          created_at?: string
          updated_at?: string
        }
      }
      [key: string]: {
        Row: { [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']