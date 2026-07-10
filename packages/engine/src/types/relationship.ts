// Pure relationship/compatibility types used by the engine services.
// DB-coupled relationship types (graph, sharing, form inputs) live in the web app
// at src/lib/types/relationship.ts, which re-exports these for compatibility.

// ============================================================================
// GROUP INPUT TYPES
// ============================================================================

export interface GroupMember {
  id: string
  name: string
  hebrew_name: string | null
  birth_date: string
  birth_time?: string | null
  birth_place?: { lat?: number | null; lng?: number | null } | null
  added_at: string
}

export interface GroupWithMembers {
  id: string
  owner_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  members: GroupMember[]
}

// ============================================================================
// COMPATIBILITY TYPES
// ============================================================================

export type HarmonyType = 'supportive' | 'challenging' | 'transformative' | 'neutral'

export interface DreamspellConnection {
  type: 'analog' | 'antipode' | 'occult' | 'guide' | 'same-seal' | 'same-tone' | 'same-color'
  description: string
  descriptionHebrew: string
  harmony: HarmonyType
}

export interface DreamspellCompatibility {
  person1Kin: number
  person2Kin: number
  score: number
  connections: DreamspellConnection[]
}

export interface CompatibilityMatrixEntry {
  person1Id: string
  person2Id: string
  score: number
  aspects: string[]
}

export interface CompatibilityMatrix {
  system: 'dreamspell' | 'tzolkin' | 'astrology' | 'humandesign' | 'gematria'
  matrix: CompatibilityMatrixEntry[]
}

// ============================================================================
// GROUP ANALYSIS TYPES
// ============================================================================

export interface GroupAnalysis {
  groupId: string
  dreamspell: {
    kinDistribution: Record<number, string[]>
    sealDistribution: Record<number, string[]>
    toneDistribution: Record<number, string[]>
    colorBalance: Record<'red' | 'white' | 'blue' | 'yellow', number>
  }
  tzolkin: {
    signDistribution: Record<number, string[]>
    toneDistribution: Record<number, string[]>
  }
  compatibilityMatrix: CompatibilityMatrix
}
