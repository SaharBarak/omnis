import type { Element, ZodiacSign, ZodiacSignId } from '../types/astrology'

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

/** The seven classical planets in Chaldean order, slowest first: the order the decans' rulers run in. */
export const CHALDEAN_ORDER = Object.freeze(['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'] as const)

/** Decans in a sign: three faces of ten degrees. */
export const DECANS_IN_SIGN = 3

/** The planet the first decan of Aries belongs to; the rest run on from it in Chaldean order. */
const FIRST_DECAN_RULER = 'mars'

/**
 * The decan (face) a longitude falls in: its place in its sign (1–3) and
 * the planet ruling it, by the Chaldean faces: Mars rules Aries' first ten
 * degrees, and each decan after belongs to the next planet in Chaldean
 * order, round the zodiac.
 */
export function decanAt(longitude: number): { readonly decan: number; readonly ruler: (typeof CHALDEAN_ORDER)[number] } {
  const width = 360 / ZODIAC_SIGNS.length / DECANS_IN_SIGN
  const index = Math.floor((((longitude % 360) + 360) % 360) / width)
  const start = CHALDEAN_ORDER.indexOf(FIRST_DECAN_RULER)
  return { decan: (index % DECANS_IN_SIGN) + 1, ruler: CHALDEAN_ORDER[(start + index) % CHALDEAN_ORDER.length] }
}

/** The seven classical planets: the bodies the traditional dignities are given to. */
export type ClassicalPlanet = (typeof CHALDEAN_ORDER)[number]

/**
 * Each sign's traditional ruler, its domicile lord, as Ptolemy gives the
 * houses of the planets (Tetrabiblos I.17, Robbins tr., Loeb 1940): the
 * lights in Leo and Cancer, each of the five others in one sign of the
 * solar half and one of the lunar. Jyotish gives the rashis the same lords
 * (Varahamihira, Brihat Jataka 1). `ZodiacSign.ruler` is the modern ruler,
 * which differs in Scorpio, Aquarius and Pisces.
 */
export const TRADITIONAL_RULERS: Readonly<Record<ZodiacSignId, ClassicalPlanet>> = Object.freeze({
  aries: 'mars',
  taurus: 'venus',
  gemini: 'mercury',
  cancer: 'moon',
  leo: 'sun',
  virgo: 'mercury',
  libra: 'venus',
  scorpio: 'mars',
  sagittarius: 'jupiter',
  capricorn: 'saturn',
  aquarius: 'saturn',
  pisces: 'jupiter',
})

/** A planet's exaltation: the planet and the degree of the sign it is exalted at. */
export interface Exaltation {
  readonly planet: ClassicalPlanet
  readonly degree: number
}

/**
 * The exaltations: the sign each planet is exalted in as Ptolemy gives it
 * (Tetrabiblos I.19, which gives no degrees), at the degree the later
 * tradition fixes (al-Biruni, Book of Instruction; Lilly, Christian
 * Astrology, 1647, table of essential dignities). Gemini, Leo, Scorpio,
 * Sagittarius and Aquarius exalt no planet.
 */
export const EXALTATIONS: Readonly<Partial<Record<ZodiacSignId, Exaltation>>> = Object.freeze({
  aries: { planet: 'sun', degree: 19 },
  taurus: { planet: 'moon', degree: 3 },
  cancer: { planet: 'jupiter', degree: 15 },
  virgo: { planet: 'mercury', degree: 15 },
  libra: { planet: 'saturn', degree: 21 },
  capricorn: { planet: 'mars', degree: 28 },
  pisces: { planet: 'venus', degree: 27 },
})

/** The sign opposite a sign. */
export const oppositeOf = (sign: ZodiacSign): ZodiacSign => ZODIAC_SIGNS[(sign.number - 1 + ZODIAC_SIGNS.length / 2) % ZODIAC_SIGNS.length]

/** The planet in its fall in a sign: the one exalted in the opposite sign (Ptolemy's "depression", Tetrabiblos I.19). */
export const fallIn = (sign: ZodiacSign): ClassicalPlanet | undefined => EXALTATIONS[oppositeOf(sign).id]?.planet

/** The planets in their detriment in a sign: the traditional ruler of the opposite sign. */
export const detrimentIn = (sign: ZodiacSign): ClassicalPlanet => TRADITIONAL_RULERS[oppositeOf(sign).id]

/** A sign's gender: masculine from Aries, feminine from Taurus, alternately round the zodiac (Ptolemy, Tetrabiblos I.12). */
export const polarityOf = (sign: ZodiacSign): 'masculine' | 'feminine' => (sign.number % 2 === 1 ? 'masculine' : 'feminine')

/** A triplicity's three lords: by day, by night, and participating with both. */
export interface TriplicityRulers {
  readonly day: ClassicalPlanet
  readonly night: ClassicalPlanet
  readonly participating: ClassicalPlanet
}

/**
 * The triplicity lords of each element in the Dorothean scheme (Dorotheus,
 * Carmen Astrologicum I.1, Pingree tr., 1976), the one Hellenistic and
 * medieval astrologers used before Lilly; Ptolemy (Tetrabiblos I.18) gives
 * the water triplicity to Venus by day and the Moon by night instead.
 */
export const TRIPLICITY_RULERS: Readonly<Record<Element, TriplicityRulers>> = Object.freeze({
  fire: { day: 'sun', night: 'jupiter', participating: 'saturn' },
  earth: { day: 'venus', night: 'moon', participating: 'mars' },
  air: { day: 'saturn', night: 'mercury', participating: 'jupiter' },
  water: { day: 'venus', night: 'mars', participating: 'moon' },
})

/**
 * The colours the elements are drawn in by the modern convention of chart
 * software and textbooks (fire red, earth green, air yellow, water blue):
 * a modern habit, not a classical attribution.
 */
export const ELEMENT_COLOURS: Readonly<Record<Element, 'red' | 'green' | 'yellow' | 'blue'>> = Object.freeze({
  fire: 'red',
  earth: 'green',
  air: 'yellow',
  water: 'blue',
})
