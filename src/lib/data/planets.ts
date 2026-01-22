import type { Planet, PlanetId } from '../types/astrology'

/**
 * Astrological planets including luminaries and points
 */
export const PLANETS: readonly Planet[] = Object.freeze([
  {
    id: 'sun',
    name: 'Sun',
    hebrew: 'שמש',
    symbol: '☉',
    type: 'luminary',
    keywords: Object.freeze(['identity', 'vitality', 'ego']),
  },
  {
    id: 'moon',
    name: 'Moon',
    hebrew: 'ירח',
    symbol: '☽',
    type: 'luminary',
    keywords: Object.freeze(['emotions', 'instincts', 'needs']),
  },
  {
    id: 'mercury',
    name: 'Mercury',
    hebrew: 'כוכב חמה',
    symbol: '☿',
    type: 'personal',
    keywords: Object.freeze(['communication', 'thinking', 'learning']),
    orbitDays: 88,
  },
  {
    id: 'venus',
    name: 'Venus',
    hebrew: 'נוגה',
    symbol: '♀',
    type: 'personal',
    keywords: Object.freeze(['love', 'beauty', 'values']),
    orbitDays: 225,
  },
  {
    id: 'mars',
    name: 'Mars',
    hebrew: 'מאדים',
    symbol: '♂',
    type: 'personal',
    keywords: Object.freeze(['action', 'desire', 'energy']),
    orbitDays: 687,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    hebrew: 'צדק',
    symbol: '♃',
    type: 'social',
    keywords: Object.freeze(['expansion', 'wisdom', 'luck']),
    orbitDays: 4333,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    hebrew: 'שבתאי',
    symbol: '♄',
    type: 'social',
    keywords: Object.freeze(['structure', 'limits', 'discipline']),
    orbitDays: 10759,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    hebrew: 'אורנוס',
    symbol: '♅',
    type: 'transpersonal',
    keywords: Object.freeze(['change', 'rebellion', 'innovation']),
    orbitDays: 30687,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    hebrew: 'נפטון',
    symbol: '♆',
    type: 'transpersonal',
    keywords: Object.freeze(['dreams', 'illusion', 'spirituality']),
    orbitDays: 60190,
  },
  {
    id: 'pluto',
    name: 'Pluto',
    hebrew: 'פלוטו',
    symbol: '♇',
    type: 'transpersonal',
    keywords: Object.freeze(['transformation', 'power', 'rebirth']),
    orbitDays: 90560,
  },
  {
    id: 'northNode',
    name: 'North Node',
    hebrew: 'ראש התלי',
    symbol: '☊',
    type: 'point',
    keywords: Object.freeze(['destiny', 'growth', 'future']),
  },
  {
    id: 'southNode',
    name: 'South Node',
    hebrew: 'זנב התלי',
    symbol: '☋',
    type: 'point',
    keywords: Object.freeze(['past', 'comfort', 'release']),
  },
  {
    id: 'lilith',
    name: 'Lilith',
    hebrew: 'לילית',
    symbol: '⚸',
    type: 'point',
    keywords: Object.freeze(['shadow', 'rebellion', 'primal']),
  },
])

/**
 * Get a planet by its ID
 */
export function getPlanetById(id: PlanetId): Planet {
  const planet = PLANETS.find(p => p.id === id)
  if (!planet) {
    throw new Error(`Unknown planet ID: ${id}`)
  }
  return planet
}

/**
 * Get all planets of a specific type
 */
export function getPlanetsByType(type: Planet['type']): readonly Planet[] {
  return PLANETS.filter(p => p.type === type)
}

/**
 * Main celestial bodies (excluding points like nodes and lilith)
 * Used for main chart calculations
 */
export const CELESTIAL_BODIES: readonly Planet[] = Object.freeze(
  PLANETS.filter(p => p.type !== 'point')
)

/**
 * All points (nodes and lilith)
 */
export const CELESTIAL_POINTS: readonly Planet[] = Object.freeze(
  PLANETS.filter(p => p.type === 'point')
)

/**
 * Map planet ID to library key for circular-natal-horoscope-js
 */
export const PLANET_TO_LIBRARY_KEY: Readonly<Record<PlanetId, string>> = {
  sun: 'sun',
  moon: 'moon',
  mercury: 'mercury',
  venus: 'venus',
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
  uranus: 'uranus',
  neptune: 'neptune',
  pluto: 'pluto',
  northNode: 'northnode',
  southNode: 'southnode',
  lilith: 'lilith',
}
