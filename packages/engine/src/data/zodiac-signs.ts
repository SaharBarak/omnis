import type { ZodiacSign, ZodiacSignId } from '../types/astrology'

/**
 * The 12 zodiac signs with full data
 */
export const ZODIAC_SIGNS: readonly ZodiacSign[] = Object.freeze([
  {
    id: 'aries',
    number: 1,
    name: 'Aries',
    hebrew: 'טלה',
    symbol: '♈',
    element: 'fire',
    modality: 'cardinal',
    ruler: 'mars',
    degreesStart: 0,
    degreesEnd: 30,
    keywords: Object.freeze(['initiative', 'courage', 'independence']),
  },
  {
    id: 'taurus',
    number: 2,
    name: 'Taurus',
    hebrew: 'שור',
    symbol: '♉',
    element: 'earth',
    modality: 'fixed',
    ruler: 'venus',
    degreesStart: 30,
    degreesEnd: 60,
    keywords: Object.freeze(['stability', 'sensuality', 'persistence']),
  },
  {
    id: 'gemini',
    number: 3,
    name: 'Gemini',
    hebrew: 'תאומים',
    symbol: '♊',
    element: 'air',
    modality: 'mutable',
    ruler: 'mercury',
    degreesStart: 60,
    degreesEnd: 90,
    keywords: Object.freeze(['communication', 'curiosity', 'adaptability']),
  },
  {
    id: 'cancer',
    number: 4,
    name: 'Cancer',
    hebrew: 'סרטן',
    symbol: '♋',
    element: 'water',
    modality: 'cardinal',
    ruler: 'moon',
    degreesStart: 90,
    degreesEnd: 120,
    keywords: Object.freeze(['nurturing', 'emotion', 'home']),
  },
  {
    id: 'leo',
    number: 5,
    name: 'Leo',
    hebrew: 'אריה',
    symbol: '♌',
    element: 'fire',
    modality: 'fixed',
    ruler: 'sun',
    degreesStart: 120,
    degreesEnd: 150,
    keywords: Object.freeze(['creativity', 'leadership', 'expression']),
  },
  {
    id: 'virgo',
    number: 6,
    name: 'Virgo',
    hebrew: 'בתולה',
    symbol: '♍',
    element: 'earth',
    modality: 'mutable',
    ruler: 'mercury',
    degreesStart: 150,
    degreesEnd: 180,
    keywords: Object.freeze(['analysis', 'service', 'precision']),
  },
  {
    id: 'libra',
    number: 7,
    name: 'Libra',
    hebrew: 'מאזניים',
    symbol: '♎',
    element: 'air',
    modality: 'cardinal',
    ruler: 'venus',
    degreesStart: 180,
    degreesEnd: 210,
    keywords: Object.freeze(['balance', 'partnership', 'harmony']),
  },
  {
    id: 'scorpio',
    number: 8,
    name: 'Scorpio',
    hebrew: 'עקרב',
    symbol: '♏',
    element: 'water',
    modality: 'fixed',
    ruler: 'pluto',
    degreesStart: 210,
    degreesEnd: 240,
    keywords: Object.freeze(['transformation', 'intensity', 'depth']),
  },
  {
    id: 'sagittarius',
    number: 9,
    name: 'Sagittarius',
    hebrew: 'קשת',
    symbol: '♐',
    element: 'fire',
    modality: 'mutable',
    ruler: 'jupiter',
    degreesStart: 240,
    degreesEnd: 270,
    keywords: Object.freeze(['expansion', 'philosophy', 'adventure']),
  },
  {
    id: 'capricorn',
    number: 10,
    name: 'Capricorn',
    hebrew: 'גדי',
    symbol: '♑',
    element: 'earth',
    modality: 'cardinal',
    ruler: 'saturn',
    degreesStart: 270,
    degreesEnd: 300,
    keywords: Object.freeze(['ambition', 'structure', 'mastery']),
  },
  {
    id: 'aquarius',
    number: 11,
    name: 'Aquarius',
    hebrew: 'דלי',
    symbol: '♒',
    element: 'air',
    modality: 'fixed',
    ruler: 'uranus',
    degreesStart: 300,
    degreesEnd: 330,
    keywords: Object.freeze(['innovation', 'community', 'independence']),
  },
  {
    id: 'pisces',
    number: 12,
    name: 'Pisces',
    hebrew: 'דגים',
    symbol: '♓',
    element: 'water',
    modality: 'mutable',
    ruler: 'neptune',
    degreesStart: 330,
    degreesEnd: 360,
    keywords: Object.freeze(['intuition', 'compassion', 'transcendence']),
  },
])

/**
 * Get a zodiac sign by its number (1-12)
 */
export function getZodiacSignByNumber(number: number): ZodiacSign {
  if (number < 1 || number > 12) {
    throw new RangeError(`Invalid zodiac sign number: ${number}`)
  }
  return ZODIAC_SIGNS[number - 1]
}

/**
 * Get a zodiac sign by its ID
 */
export function getZodiacSignById(id: ZodiacSignId): ZodiacSign {
  const sign = ZODIAC_SIGNS.find(s => s.id === id)
  if (!sign) {
    throw new Error(`Unknown zodiac sign ID: ${id}`)
  }
  return sign
}

/**
 * Get zodiac sign from ecliptic longitude (0-360 degrees)
 */
export function getZodiacSignFromLongitude(longitude: number): ZodiacSign {
  // Normalize to 0-360
  const normalizedLong = ((longitude % 360) + 360) % 360

  // Each sign spans 30 degrees
  const signNumber = Math.floor(normalizedLong / 30) + 1

  return getZodiacSignByNumber(signNumber)
}

/**
 * Calculate degree within sign (0-29) from ecliptic longitude
 */
export function getDegreeInSign(longitude: number): number {
  const normalizedLong = ((longitude % 360) + 360) % 360
  return Math.floor(normalizedLong % 30)
}

/**
 * Calculate minute within degree (0-59) from ecliptic longitude
 */
export function getMinuteInDegree(longitude: number): number {
  const normalizedLong = ((longitude % 360) + 360) % 360
  const decimalDegree = normalizedLong % 1
  return Math.floor(decimalDegree * 60)
}

/**
 * Format a zodiac position as a string (e.g., "15°23' Aries")
 */
export function formatZodiacPosition(longitude: number): string {
  const sign = getZodiacSignFromLongitude(longitude)
  const degree = getDegreeInSign(longitude)
  const minute = getMinuteInDegree(longitude)

  return `${degree}°${minute.toString().padStart(2, '0')}' ${sign.name}`
}
