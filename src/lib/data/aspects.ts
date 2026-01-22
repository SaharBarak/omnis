import type { Aspect, AspectNature } from '../types/astrology'

/**
 * Major and minor aspects with orbs
 */
export const ASPECTS: readonly Aspect[] = Object.freeze([
  {
    name: 'Conjunction',
    hebrew: 'צימוד',
    symbol: '☌',
    angle: 0,
    orb: 8,
    nature: 'major-hard',
    keywords: Object.freeze(['fusion', 'intensification']),
  },
  {
    name: 'Opposition',
    hebrew: 'ניגוד',
    symbol: '☍',
    angle: 180,
    orb: 8,
    nature: 'major-hard',
    keywords: Object.freeze(['tension', 'awareness', 'projection']),
  },
  {
    name: 'Square',
    hebrew: 'ריבוע',
    symbol: '□',
    angle: 90,
    orb: 7,
    nature: 'major-hard',
    keywords: Object.freeze(['friction', 'challenge', 'action']),
  },
  {
    name: 'Trine',
    hebrew: 'משולש',
    symbol: '△',
    angle: 120,
    orb: 8,
    nature: 'major-soft',
    keywords: Object.freeze(['harmony', 'flow', 'ease']),
  },
  {
    name: 'Sextile',
    hebrew: 'משושה',
    symbol: '⚹',
    angle: 60,
    orb: 5,
    nature: 'major-soft',
    keywords: Object.freeze(['opportunity', 'cooperation']),
  },
  {
    name: 'Quincunx',
    hebrew: 'קווינקונקס',
    symbol: '⚻',
    angle: 150,
    orb: 3,
    nature: 'minor',
    keywords: Object.freeze(['adjustment', 'discomfort']),
  },
  {
    name: 'Semi-sextile',
    hebrew: 'חצי משושה',
    symbol: '⚺',
    angle: 30,
    orb: 2,
    nature: 'minor',
    keywords: Object.freeze(['growth', 'irritation']),
  },
])

/**
 * Get an aspect by name
 */
export function getAspectByName(name: string): Aspect {
  const aspect = ASPECTS.find(a => a.name.toLowerCase() === name.toLowerCase())
  if (!aspect) {
    throw new Error(`Unknown aspect: ${name}`)
  }
  return aspect
}

/**
 * Get an aspect by angle (with tolerance)
 */
export function getAspectByAngle(angle: number): Aspect | null {
  // Normalize angle to 0-180 (aspects are symmetric)
  const normalizedAngle = Math.abs(angle) % 180

  for (const aspect of ASPECTS) {
    const targetAngle = aspect.angle <= 180 ? aspect.angle : 360 - aspect.angle
    const diff = Math.abs(normalizedAngle - targetAngle)

    if (diff <= aspect.orb) {
      return aspect
    }
  }

  return null
}

/**
 * Check if two longitudes form an aspect
 */
export function findAspect(longitude1: number, longitude2: number): { aspect: Aspect; orb: number } | null {
  // Calculate the angular difference
  let diff = Math.abs(longitude1 - longitude2)
  if (diff > 180) {
    diff = 360 - diff
  }

  for (const aspect of ASPECTS) {
    const aspectAngle = aspect.angle <= 180 ? aspect.angle : 360 - aspect.angle
    const orbDiff = Math.abs(diff - aspectAngle)

    if (orbDiff <= aspect.orb) {
      return { aspect, orb: orbDiff }
    }
  }

  return null
}

/**
 * Get all aspects by nature
 */
export function getAspectsByNature(nature: AspectNature): readonly Aspect[] {
  return ASPECTS.filter(a => a.nature === nature)
}

/**
 * Major aspects only (conjunction, opposition, square, trine, sextile)
 */
export const MAJOR_ASPECTS: readonly Aspect[] = Object.freeze(
  ASPECTS.filter(a => a.nature.startsWith('major'))
)

/**
 * Hard aspects (conjunction, opposition, square)
 */
export const HARD_ASPECTS: readonly Aspect[] = Object.freeze(
  ASPECTS.filter(a => a.nature === 'major-hard')
)

/**
 * Soft aspects (trine, sextile)
 */
export const SOFT_ASPECTS: readonly Aspect[] = Object.freeze(
  ASPECTS.filter(a => a.nature === 'major-soft')
)

/**
 * Get aspect color for visualization
 */
export function getAspectColor(aspect: Aspect): string {
  switch (aspect.nature) {
    case 'major-hard':
      return '#EF4444' // red
    case 'major-soft':
      return '#3B82F6' // blue
    case 'minor':
      return '#10B981' // green
  }
}
