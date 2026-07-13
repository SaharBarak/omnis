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

/**
 * The oracle relations (`guide`, `analog`, `antipode`, `occult`) are KIN-level:
 * they require the paired seal AND the tone, exactly as Argüelles defines them.
 * Each fires on 1 pair in 260. The seal-only variants — which fire on 1 in 20 —
 * are named `*-seal` and are a genuinely weaker claim. Do not conflate them.
 * See docs/redesign/CONNECTION_ATLAS.md §3.
 */
export interface DreamspellConnection {
  type:
    | 'same-kin'
    | 'analog'
    | 'antipode'
    | 'occult'
    | 'guide'
    | 'analog-seal'
    | 'antipode-seal'
    | 'occult-seal'
    | 'guide-seal'
    | 'same-seal'
    | 'same-tone'
    | 'same-color'
    | 'same-wavespell'
    | 'same-castle'
    | 'same-earth-family'
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
