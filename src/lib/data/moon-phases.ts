import type { MoonPhaseName } from '@pleiad/engine/calculations/moon'

/** What each lunar phase is read for, shown beside the phase on every moon surface. */
export const MOON_PHASE_HINTS: Readonly<Record<MoonPhaseName, string>> = Object.freeze({
  'New Moon': 'beginnings, intention-setting',
  'Waxing Crescent': 'momentum, first steps',
  'First Quarter': 'decision, friction, commitment',
  'Waxing Gibbous': 'refinement, persistence',
  'Full Moon': 'culmination, visibility',
  'Waning Gibbous': 'gratitude, sharing outward',
  'Last Quarter': 'release, course-correction',
  'Waning Crescent': 'rest, surrender, closure',
})
