import type { RelationshipType } from '@pleiad/api-client'

import { COLORS } from '@/theme/tokens'

/**
 * Relationship-type colors — S10/S9. Desaturated, tokens-adjacent hues so
 * typed edges read as families of light without shouting over the seal
 * rings. `other` stays neutral (text50).
 */
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  family: '#E8A87C',
  romantic: '#D46A8E',
  friend: '#7FB5A6',
  professional: '#8FA8D8',
  other: COLORS.text50,
} as const

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
