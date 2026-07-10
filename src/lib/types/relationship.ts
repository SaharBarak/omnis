// Relationship Types for Pleiad Phase 2
// Domain types for relationships, groups, and graph visualization

import type { Person, Relationship, SharedView } from './database.types'

// Pure compatibility/group-analysis types live in the engine package;
// re-exported here so existing web imports keep working.
export type {
  GroupMember,
  GroupWithMembers,
  HarmonyType,
  DreamspellConnection,
  DreamspellCompatibility,
  CompatibilityMatrixEntry,
  CompatibilityMatrix,
  GroupAnalysis,
} from '@pleiad/engine/types/relationship'

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export type RelationshipType = 'family' | 'romantic' | 'friend' | 'professional' | 'other'

// Subtypes for each relationship type
export type FamilySubtype =
  | 'parent-child'
  | 'child-parent'
  | 'sibling'
  | 'grandparent-grandchild'
  | 'aunt-uncle-niece-nephew'
  | 'cousin'
  | 'in-law'
  | 'step-family'

export type RomanticSubtype =
  | 'spouse'
  | 'partner'
  | 'dating'
  | 'ex'

export type FriendSubtype =
  | 'close-friend'
  | 'friend'
  | 'acquaintance'

export type ProfessionalSubtype =
  | 'colleague'
  | 'manager-report'
  | 'mentor-mentee'
  | 'business-partner'
  | 'client'

export type RelationshipSubtype =
  | FamilySubtype
  | RomanticSubtype
  | FriendSubtype
  | ProfessionalSubtype
  | string // Allow custom subtypes

// Relationship strength (1-5)
export type RelationshipStrength = 1 | 2 | 3 | 4 | 5

// Labels for relationship subtypes (bilingual)
export const RELATIONSHIP_SUBTYPES: Record<RelationshipType, Array<{ value: string; label: string; labelHebrew: string }>> = {
  family: [
    { value: 'parent-child', label: 'Parent → Child', labelHebrew: 'הורה → ילד' },
    { value: 'child-parent', label: 'Child → Parent', labelHebrew: 'ילד → הורה' },
    { value: 'sibling', label: 'Sibling', labelHebrew: 'אח/אחות' },
    { value: 'grandparent-grandchild', label: 'Grandparent ↔ Grandchild', labelHebrew: 'סב/סבתא ↔ נכד/ה' },
    { value: 'aunt-uncle-niece-nephew', label: 'Aunt/Uncle ↔ Niece/Nephew', labelHebrew: 'דוד/דודה ↔ אחיין/ית' },
    { value: 'cousin', label: 'Cousin', labelHebrew: 'בן/בת דוד/ה' },
    { value: 'in-law', label: 'In-law', labelHebrew: 'חותן/חותנת/גיס/גיסה' },
    { value: 'step-family', label: 'Step-family', labelHebrew: 'משפחה חורגת' },
  ],
  romantic: [
    { value: 'spouse', label: 'Spouse', labelHebrew: 'בן/בת זוג נשוי/ה' },
    { value: 'partner', label: 'Partner', labelHebrew: 'בן/בת זוג' },
    { value: 'dating', label: 'Dating', labelHebrew: 'יוצאים' },
    { value: 'ex', label: 'Ex', labelHebrew: 'לשעבר' },
  ],
  friend: [
    { value: 'close-friend', label: 'Close Friend', labelHebrew: 'חבר/ה קרוב/ה' },
    { value: 'friend', label: 'Friend', labelHebrew: 'חבר/ה' },
    { value: 'acquaintance', label: 'Acquaintance', labelHebrew: 'מכר/ה' },
  ],
  professional: [
    { value: 'colleague', label: 'Colleague', labelHebrew: 'עמית/ה' },
    { value: 'manager-report', label: 'Manager ↔ Report', labelHebrew: 'מנהל/ת ↔ כפוף/ה' },
    { value: 'mentor-mentee', label: 'Mentor ↔ Mentee', labelHebrew: 'מנטור ↔ חניך/ה' },
    { value: 'business-partner', label: 'Business Partner', labelHebrew: 'שותף/ה עסקי/ת' },
    { value: 'client', label: 'Client', labelHebrew: 'לקוח/ה' },
  ],
  other: [],
}

// Relationship type labels (bilingual)
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, { label: string; labelHebrew: string; color: string }> = {
  family: { label: 'Family', labelHebrew: 'משפחה', color: '#EF4444' },
  romantic: { label: 'Romantic', labelHebrew: 'רומנטי', color: '#EC4899' },
  friend: { label: 'Friend', labelHebrew: 'חברים', color: '#8B5CF6' },
  professional: { label: 'Professional', labelHebrew: 'מקצועי', color: '#3B82F6' },
  other: { label: 'Other', labelHebrew: 'אחר', color: '#6B7280' },
}

// Relationship strength labels
export const STRENGTH_LABELS: Record<RelationshipStrength, { label: string; labelHebrew: string }> = {
  1: { label: 'Very Distant', labelHebrew: 'רחוק מאוד' },
  2: { label: 'Distant', labelHebrew: 'רחוק' },
  3: { label: 'Moderate', labelHebrew: 'בינוני' },
  4: { label: 'Close', labelHebrew: 'קרוב' },
  5: { label: 'Very Close', labelHebrew: 'קרוב מאוד' },
}

// ============================================================================
// EXTENDED TYPES
// ============================================================================

// Relationship with person details
export interface RelationshipWithPeople extends Relationship {
  person1: Person
  person2: Person
}

// Relationship from a specific person's perspective
export interface RelationshipFromPerson {
  id: string
  type: RelationshipType
  subtype: string | null
  strength: number
  bidirectional: boolean
  startDate: string | null
  endDate: string | null
  notes: string | null
  otherPerson: Person
  createdAt: string
  updatedAt: string
}

// ============================================================================
// GRAPH TYPES
// ============================================================================

export interface GraphNode {
  id: string
  person: Person
  position?: { x: number; y: number }
  size: number
  color: string
  selected: boolean
  pinned: boolean
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relationship: Relationship
  weight: number
  color: string
  style: 'solid' | 'dashed'
}

export interface GraphCluster {
  id: string
  name: string
  personIds: string[]
  color: string
  expanded: boolean
}

export interface RelationshipGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: GraphCluster[]
}

// ============================================================================
// GROUP TYPES
// ============================================================================

export type GroupPreset =
  | 'immediate-family'
  | 'extended-family'
  | 'household'
  | 'friend-group'
  | 'work-team'


// ============================================================================
// SHARING TYPES
// ============================================================================

export interface ShareOptions {
  personIds?: string[]
  relationshipIds?: string[]
  groupId?: string
  includeSystems: Array<'dreamspell' | 'tzolkin' | 'astrology' | 'humandesign' | 'gematria'>
  includeAnalysis: boolean
}

export interface ShareLink extends SharedView {
  url: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CreateRelationshipInput {
  person1Id: string
  person2Id: string
  type: RelationshipType
  subtype?: string
  bidirectional?: boolean
  strength?: RelationshipStrength
  startDate?: string
  endDate?: string
  notes?: string
}

export interface UpdateRelationshipInput {
  type?: RelationshipType
  subtype?: string | null
  bidirectional?: boolean
  strength?: RelationshipStrength
  startDate?: string | null
  endDate?: string | null
  notes?: string | null
}

export interface CreateGroupInput {
  name: string
  description?: string
  personIds?: string[]
}

export interface UpdateGroupInput {
  name?: string
  description?: string | null
}

export interface CreateShareInput {
  shareType: 'person' | 'relationship' | 'group' | 'graph'
  options: ShareOptions
  expiresAt?: string
  maxViews?: number
  password?: string
}
