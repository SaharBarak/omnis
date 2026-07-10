import type { House, ZodiacSignId } from '../types/astrology'

/**
 * The 12 astrological houses with their meanings
 */
export const HOUSES: readonly House[] = Object.freeze([
  {
    number: 1,
    name: 'First House',
    hebrew: 'בית ראשון',
    theme: 'Self',
    keywords: Object.freeze(['identity', 'appearance', 'beginnings']),
    naturalSign: 'aries',
  },
  {
    number: 2,
    name: 'Second House',
    hebrew: 'בית שני',
    theme: 'Values',
    keywords: Object.freeze(['money', 'possessions', 'self-worth']),
    naturalSign: 'taurus',
  },
  {
    number: 3,
    name: 'Third House',
    hebrew: 'בית שלישי',
    theme: 'Communication',
    keywords: Object.freeze(['siblings', 'learning', 'local travel']),
    naturalSign: 'gemini',
  },
  {
    number: 4,
    name: 'Fourth House',
    hebrew: 'בית רביעי',
    theme: 'Home',
    keywords: Object.freeze(['family', 'roots', 'emotional foundation']),
    naturalSign: 'cancer',
  },
  {
    number: 5,
    name: 'Fifth House',
    hebrew: 'בית חמישי',
    theme: 'Creativity',
    keywords: Object.freeze(['children', 'romance', 'self-expression']),
    naturalSign: 'leo',
  },
  {
    number: 6,
    name: 'Sixth House',
    hebrew: 'בית שישי',
    theme: 'Service',
    keywords: Object.freeze(['health', 'work', 'daily routines']),
    naturalSign: 'virgo',
  },
  {
    number: 7,
    name: 'Seventh House',
    hebrew: 'בית שביעי',
    theme: 'Partnership',
    keywords: Object.freeze(['marriage', 'contracts', 'open enemies']),
    naturalSign: 'libra',
  },
  {
    number: 8,
    name: 'Eighth House',
    hebrew: 'בית שמיני',
    theme: 'Transformation',
    keywords: Object.freeze(['death', 'shared resources', 'intimacy']),
    naturalSign: 'scorpio',
  },
  {
    number: 9,
    name: 'Ninth House',
    hebrew: 'בית תשיעי',
    theme: 'Philosophy',
    keywords: Object.freeze(['travel', 'higher education', 'beliefs']),
    naturalSign: 'sagittarius',
  },
  {
    number: 10,
    name: 'Tenth House',
    hebrew: 'בית עשירי',
    theme: 'Career',
    keywords: Object.freeze(['public image', 'authority', 'achievement']),
    naturalSign: 'capricorn',
  },
  {
    number: 11,
    name: 'Eleventh House',
    hebrew: 'בית אחד עשר',
    theme: 'Community',
    keywords: Object.freeze(['friends', 'groups', 'hopes']),
    naturalSign: 'aquarius',
  },
  {
    number: 12,
    name: 'Twelfth House',
    hebrew: 'בית שנים עשר',
    theme: 'Unconscious',
    keywords: Object.freeze(['hidden', 'spiritual', 'self-undoing']),
    naturalSign: 'pisces',
  },
])

/**
 * Get a house by its number (1-12)
 */
export function getHouseByNumber(number: number): House {
  if (number < 1 || number > 12) {
    throw new RangeError(`Invalid house number: ${number}`)
  }
  return HOUSES[number - 1]
}

/**
 * Get the house by its natural sign
 */
export function getHouseByNaturalSign(signId: ZodiacSignId): House {
  const house = HOUSES.find(h => h.naturalSign === signId)
  if (!house) {
    throw new Error(`No house found for sign: ${signId}`)
  }
  return house
}

/**
 * Angular houses (1, 4, 7, 10) - most prominent
 */
export const ANGULAR_HOUSES: readonly House[] = Object.freeze(
  [1, 4, 7, 10].map(n => HOUSES[n - 1])
)

/**
 * Succedent houses (2, 5, 8, 11) - resources
 */
export const SUCCEDENT_HOUSES: readonly House[] = Object.freeze(
  [2, 5, 8, 11].map(n => HOUSES[n - 1])
)

/**
 * Cadent houses (3, 6, 9, 12) - transition
 */
export const CADENT_HOUSES: readonly House[] = Object.freeze(
  [3, 6, 9, 12].map(n => HOUSES[n - 1])
)
