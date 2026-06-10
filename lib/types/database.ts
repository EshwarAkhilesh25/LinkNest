/**
 * Database Types for LinkNest
 * 
 * These TypeScript types match the Supabase database schema.
 * They provide type safety when working with Supabase queries.
 * 
 * Usage:
 * import { Database } from '@/lib/types/database'
 * const { data, error } = await supabase.from('profiles').select('*')
 */

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
          email: string
          handle: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          handle: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          handle?: string
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          title: string
          url: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          url: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          url?: string
          is_public?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_handle_available: {
        Args: {
          handle_param: string
        }
        Returns: boolean
      }
      get_profile_by_handle: {
        Args: {
          handle_param: string
        }
        Returns: {
          id: string
          email: string
          handle: string
          created_at: string
        }[]
      }
      get_bookmarks_by_user: {
        Args: {
          user_id_param: string
        }
        Returns: {
          id: string
          user_id: string
          title: string
          url: string
          is_public: boolean
          created_at: string
        }[]
      }
      get_public_bookmarks_by_handle: {
        Args: {
          handle_param: string
        }
        Returns: {
          id: string
          user_id: string
          title: string
          url: string
          is_public: boolean
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

/**
 * Profile type for application use
 */
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Bookmark type for application use
 */
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
export type BookmarkUpdate = Database['public']['Tables']['bookmarks']['Update']
