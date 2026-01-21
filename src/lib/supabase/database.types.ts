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
      relationships: {
        Row: {
          id: string
          owner_id: string
          person1_id: string
          person2_id: string
          type: 'family' | 'romantic' | 'friend' | 'professional' | 'other'
          subtype: string | null
          bidirectional: boolean
          strength: number
          start_date: string | null
          end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          person1_id: string
          person2_id: string
          type: 'family' | 'romantic' | 'friend' | 'professional' | 'other'
          subtype?: string | null
          bidirectional?: boolean
          strength?: number
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          person1_id?: string
          person2_id?: string
          type?: 'family' | 'romantic' | 'friend' | 'professional' | 'other'
          subtype?: string | null
          bidirectional?: boolean
          strength?: number
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          group_id: string
          person_id: string
          added_at: string
        }
        Insert: {
          group_id: string
          person_id: string
          added_at?: string
        }
        Update: {
          group_id?: string
          person_id?: string
          added_at?: string
        }
      }
      shared_views: {
        Row: {
          id: string
          owner_id: string
          share_type: 'person' | 'relationship' | 'group' | 'graph'
          options: Json
          url_token: string
          expires_at: string | null
          max_views: number | null
          view_count: number
          password_hash: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          share_type: 'person' | 'relationship' | 'group' | 'graph'
          options?: Json
          url_token: string
          expires_at?: string | null
          max_views?: number | null
          view_count?: number
          password_hash?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          share_type?: 'person' | 'relationship' | 'group' | 'graph'
          options?: Json
          url_token?: string
          expires_at?: string | null
          max_views?: number | null
          view_count?: number
          password_hash?: string | null
          active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_person_relationships: {
        Args: { p_person_id: string }
        Returns: {
          id: string
          person1_id: string
          person2_id: string
          type: string
          subtype: string | null
          bidirectional: boolean
          strength: number
          start_date: string | null
          end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          other_person_id: string
          other_person_name: string
        }[]
      }
      get_relationship_graph: {
        Args: Record<string, never>
        Returns: {
          nodes: Json
          edges: Json
        }[]
      }
      get_group_with_members: {
        Args: { p_group_id: string }
        Returns: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          members: Json
        }[]
      }
      increment_shared_view_count: {
        Args: { p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      locale: 'he' | 'en'
      system_type: 'dreamspell' | 'tzolkin' | 'longcount' | 'humandesign' | 'astrology' | 'gematria'
      relationship_type: 'family' | 'romantic' | 'friend' | 'professional' | 'other'
      share_type: 'person' | 'relationship' | 'group' | 'graph'
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

export type Relationship = Database['public']['Tables']['relationships']['Row']
export type RelationshipInsert = Database['public']['Tables']['relationships']['Insert']
export type RelationshipUpdate = Database['public']['Tables']['relationships']['Update']

export type Group = Database['public']['Tables']['groups']['Row']
export type GroupInsert = Database['public']['Tables']['groups']['Insert']
export type GroupUpdate = Database['public']['Tables']['groups']['Update']

export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert']

export type SharedView = Database['public']['Tables']['shared_views']['Row']
export type SharedViewInsert = Database['public']['Tables']['shared_views']['Insert']
export type SharedViewUpdate = Database['public']['Tables']['shared_views']['Update']

export type SystemType = Database['public']['Enums']['system_type']
export type Locale = Database['public']['Enums']['locale']
export type RelationshipType = Database['public']['Enums']['relationship_type']
export type ShareType = Database['public']['Enums']['share_type']
