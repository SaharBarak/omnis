import type { RelationshipType } from '@pleiad/api-client'

/**
 * The relationship taxonomy: its order, its labels, and its colours.
 *
 * The colours themselves live in `@/theme/tokens` — DESIGN_LANGUAGE §1.3 makes
 * that the one home for domain colour, and a categorical scale is domain colour
 * — but they are re-exported here so a call site still gets every fact about a
 * relationship type from a single import.
 */
export { RELATIONSHIP_COLORS } from '@/theme/tokens'

/** Stable display order for chips and pickers. */
export const RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  'family',
  'romantic',
  'friend',
  'professional',
  'other',
] as const

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: 'Family',
  romantic: 'Romantic',
  friend: 'Friend',
  professional: 'Professional',
  other: 'Other',
} as const
