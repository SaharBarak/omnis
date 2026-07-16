/**
 * Domain colours — the six knowledge systems, the four Dreamspell seals, and
 * the five relationship types.
 *
 * These are not theme tokens and they do not come from the M3 palette. They are
 * *content*: a Dreamspell seal is red because the tradition says it is red, and
 * it stays red in the light scheme, in the dark scheme, and under any seed.
 * Everything that is genuinely UI — surfaces, text, buttons, state — lives in
 * `@/theme/m3` and is derived from the seed there.
 *
 * The line between the two files is the line between "what the app is showing"
 * and "what the app looks like".
 */

import type { RelationshipType } from '@pleiad/api-client'

export type SystemKey =
  | 'astrology'
  | 'dreamspell'
  | 'tzolkin'
  | 'humanDesign'
  | 'gematria'
  | 'integration'

export interface SystemFlavor {
  name: string
  accent: string
  accentSoft: string
}

export const FLAVORS: Record<SystemKey, SystemFlavor> = {
  astrology: { name: 'Astrology', accent: '#C9A227', accentSoft: '#E7D08A' },
  dreamspell: { name: 'Dreamspell', accent: '#A87BD1', accentSoft: '#CDB2E8' },
  tzolkin: { name: 'Tzolkin', accent: '#2E6E5E', accentSoft: '#7FB5A6' },
  humanDesign: { name: 'Human Design', accent: '#7FD4C1', accentSoft: '#B9E8DD' },
  gematria: { name: 'Kabbalah', accent: '#D4AF37', accentSoft: '#EFD98B' },
  integration: { name: 'Integration', accent: '#C9A227', accentSoft: '#E7D08A' },
} as const

/** Dreamspell seal colours — vivid, and never themed. */
export const SEAL_COLOR_HEX: Record<string, string> = {
  red: 'hsl(4, 72%, 58%)',
  white: 'hsl(0, 0%, 96%)',
  blue: 'hsl(215, 65%, 62%)',
  yellow: 'hsl(45, 90%, 55%)',
}

/**
 * Relationship-type colours — the map's categorical scale.
 *
 * Domain, not theme, on the §1.3 test: the hue *is* the datum. A pink line on
 * the map and a pink dot on a filter chip are the same claim about two people,
 * and a claim cannot change when the seed changes or the scheme flips.
 *
 * M3 also has nowhere to put them. It ships three accent families and an error
 * role — not a five-category qualitative scale — and spending `error` on
 * "professional" would be a lie about what that role means. Re-deriving the
 * scale from roles would additionally recolour every user's map the day the
 * brand seed moves, which is the one thing a categorical encoding must not do.
 *
 * `other` is the absence of a category, so it gets the absence of a hue: the
 * neutral grey that the old 50%-white token already resolved to over the night
 * sky, pinned to a value that also survives the light scheme.
 */
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  family: '#E8A87C',
  romantic: '#D46A8E',
  friend: '#7FB5A6',
  professional: '#8FA8D8',
  other: '#8B8593',
} as const
