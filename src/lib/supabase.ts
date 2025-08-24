import { createClient } from '@supabase/supabase-js'

// Load environment variables for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone?: string
          avatar_url?: string
          role: 'admin' | 'editor' | 'viewer'
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
          last_login_at?: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string
          avatar_url?: string
          role?: 'admin' | 'editor' | 'viewer'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          last_login_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string
          avatar_url?: string
          role?: 'admin' | 'editor' | 'viewer'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          last_login_at?: string
        }
      }
    }
  }
}