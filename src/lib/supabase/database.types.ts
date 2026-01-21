// Database types for Supabase
// This file defines the TypeScript types matching the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          display_name: string
          birth_date: string | null
          birth_time: string | null
          birth_place: Json | null
          hebrew_name: string | null
          avatar_url: string | null
          locale: 'he' | 'en'
          timezone: string
          preferences: Json | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name: string
          birth_date?: string | null
          birth_time?: string | null
          birth_place?: Json | null
          hebrew_name?: string | null
          avatar_url?: string | null
          locale?: 'he' | 'en'
          timezone?: string
          preferences?: Json | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string
          birth_date?: string | null
          birth_time?: string | null
          birth_place?: Json | null
          hebrew_name?: string | null
          avatar_url?: string | null
          locale?: 'he' | 'en'
          timezone?: string
          preferences?: Json | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      people: {
        Row: {
          id: string
          owner_id: string
          name: string
          hebrew_name: string | null
          birth_date: string
          birth_time: string | null
          birth_place: Json | null
          avatar_url: string | null
          notes: string | null
          is_self: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          hebrew_name?: string | null
          birth_date: string
          birth_time?: string | null
          birth_place?: Json | null
          avatar_url?: string | null
          notes?: string | null
          is_self?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          hebrew_name?: string | null
          birth_date?: string
          birth_time?: string | null
          birth_place?: Json | null
          avatar_url?: string | null
          notes?: string | null
          is_self?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          hebrew_name: string
          color: string
          is_system: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          hebrew_name: string
          color?: string
          is_system?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          hebrew_name?: string
          color?: string
          is_system?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      person_tags: {
        Row: {
          person_id: string
          tag_id: string
        }
        Insert: {
          person_id: string
          tag_id: string
        }
        Update: {
          person_id?: string
          tag_id?: string
        }
      }
      computed_results: {
        Row: {
          id: string
          person_id: string
          system: 'dreamspell' | 'tzolkin' | 'longcount' | 'humandesign' | 'astrology' | 'gematria'
          version: string
          data: Json
          computed_at: string
        }
        Insert: {
          id?: string
          person_id: string
          system: 'dreamspell' | 'tzolkin' | 'longcount' | 'humandesign' | 'astrology' | 'gematria'
          version: string
          data: Json
          computed_at?: string
        }
        Update: {
          id?: string
          person_id?: string
          system?: 'dreamspell' | 'tzolkin' | 'longcount' | 'humandesign' | 'astrology' | 'gematria'
          version?: string
          data?: Json
          computed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      locale: 'he' | 'en'
      system_type: 'dreamspell' | 'tzolkin' | 'longcount' | 'humandesign' | 'astrology' | 'gematria'
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Person = Database['public']['Tables']['people']['Row']
export type PersonInsert = Database['public']['Tables']['people']['Insert']
export type PersonUpdate = Database['public']['Tables']['people']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type PersonTag = Database['public']['Tables']['person_tags']['Row']

export type ComputedResult = Database['public']['Tables']['computed_results']['Row']
export type ComputedResultInsert = Database['public']['Tables']['computed_results']['Insert']
export type ComputedResultUpdate = Database['public']['Tables']['computed_results']['Update']

export type SystemType = Database['public']['Enums']['system_type']
export type Locale = Database['public']['Enums']['locale']
