/**
 * Human Design Gates Data
 *
 * The 64 gates correspond to the 64 hexagrams of the I Ching.
 * Each gate belongs to a specific center in the bodygraph.
 */

import type { Gate, CenterId } from '../types/human-design'

/**
 * All 64 gates with their center assignments and I Ching correlations
 */
export const GATES: readonly Gate[] = Object.freeze([
  // Gate 1 - The Creative (G Center)
  {
    number: 1,
    name: 'The Creative',
    nameHebrew: 'היוצר',
    centerId: 'g',
    iChingHexagram: 1,
    iChingName: 'The Creative',
    keywords: Object.freeze(['self-expression', 'creativity', 'uniqueness']),
  },
  // Gate 2 - The Receptive (G Center)
  {
    number: 2,
    name: 'The Receptive',
    nameHebrew: 'המקבל',
    centerId: 'g',
    iChingHexagram: 2,
    iChingName: 'The Receptive',
    keywords: Object.freeze(['direction', 'self-direction', 'the driver']),
  },
  // Gate 3 - Ordering (Sacral)
  {
    number: 3,
    name: 'Ordering',
    nameHebrew: 'סדר',
    centerId: 'sacral',
    iChingHexagram: 3,
    iChingName: 'Difficulty at the Beginning',
    keywords: Object.freeze(['innovation', 'mutation', 'ordering']),
  },
  // Gate 4 - Formulization (Ajna)
  {
    number: 4,
    name: 'Formulization',
    nameHebrew: 'פורמולציה',
    centerId: 'ajna',
    iChingHexagram: 4,
    iChingName: 'Youthful Folly',
    keywords: Object.freeze(['mental answers', 'logic', 'formulization']),
  },
  // Gate 5 - Fixed Rhythms (Sacral)
  {
    number: 5,
    name: 'Fixed Rhythms',
    nameHebrew: 'קצבים קבועים',
    centerId: 'sacral',
    iChingHexagram: 5,
    iChingName: 'Waiting',
    keywords: Object.freeze(['waiting', 'fixed patterns', 'rhythms']),
  },
  // Gate 6 - Friction (Solar Plexus)
  {
    number: 6,
    name: 'Friction',
    nameHebrew: 'חיכוך',
    centerId: 'solar',
    iChingHexagram: 6,
    iChingName: 'Conflict',
    keywords: Object.freeze(['intimacy', 'emotional fertility', 'friction']),
  },
  // Gate 7 - The Role of the Self (G Center)
  {
    number: 7,
    name: 'The Role of the Self',
    nameHebrew: 'תפקיד העצמי',
    centerId: 'g',
    iChingHexagram: 7,
    iChingName: 'The Army',
    keywords: Object.freeze(['leadership', 'self in interaction', 'the role of the self']),
  },
  // Gate 8 - Contribution (Throat)
  {
    number: 8,
    name: 'Contribution',
    nameHebrew: 'תרומה',
    centerId: 'throat',
    iChingHexagram: 8,
    iChingName: 'Holding Together',
    keywords: Object.freeze(['contribution', 'holding together', 'creative role model']),
  },
  // Gate 9 - Focus (Sacral)
  {
    number: 9,
    name: 'Focus',
    nameHebrew: 'מיקוד',
    centerId: 'sacral',
    iChingHexagram: 9,
    iChingName: 'The Taming Power of the Small',
    keywords: Object.freeze(['focus', 'determination', 'detail']),
  },
  // Gate 10 - Behavior of the Self (G Center)
  {
    number: 10,
    name: 'Behavior of the Self',
    nameHebrew: 'התנהגות העצמי',
    centerId: 'g',
    iChingHexagram: 10,
    iChingName: 'Treading',
    keywords: Object.freeze(['self-love', 'behavior', 'empowerment']),
  },
  // Gate 11 - Ideas (Ajna)
  {
    number: 11,
    name: 'Ideas',
    nameHebrew: 'רעיונות',
    centerId: 'ajna',
    iChingHexagram: 11,
    iChingName: 'Peace',
    keywords: Object.freeze(['ideas', 'peace', 'stimulation']),
  },
  // Gate 12 - Caution (Throat)
  {
    number: 12,
    name: 'Caution',
    nameHebrew: 'זהירות',
    centerId: 'throat',
    iChingHexagram: 12,
    iChingName: 'Standstill',
    keywords: Object.freeze(['caution', 'articulation', 'social expression']),
  },
  // Gate 13 - The Listener (G Center)
  {
    number: 13,
    name: 'The Listener',
    nameHebrew: 'המקשיב',
    centerId: 'g',
    iChingHexagram: 13,
    iChingName: 'Fellowship with Men',
    keywords: Object.freeze(['listener', 'fellowship', 'secrets']),
  },
  // Gate 14 - Power Skills (Sacral)
  {
    number: 14,
    name: 'Power Skills',
    nameHebrew: 'כישורי כוח',
    centerId: 'sacral',
    iChingHexagram: 14,
    iChingName: 'Possession in Great Measure',
    keywords: Object.freeze(['power skills', 'wealth', 'resources']),
  },
  // Gate 15 - Extremes (G Center)
  {
    number: 15,
    name: 'Extremes',
    nameHebrew: 'קיצוניות',
    centerId: 'g',
    iChingHexagram: 15,
    iChingName: 'Modesty',
    keywords: Object.freeze(['extremes', 'flow', 'humanity']),
  },
  // Gate 16 - Skills (Throat)
  {
    number: 16,
    name: 'Skills',
    nameHebrew: 'כישורים',
    centerId: 'throat',
    iChingHexagram: 16,
    iChingName: 'Enthusiasm',
    keywords: Object.freeze(['skills', 'experimentation', 'enthusiasm']),
  },
  // Gate 17 - Opinions (Ajna)
  {
    number: 17,
    name: 'Opinions',
    nameHebrew: 'דעות',
    centerId: 'ajna',
    iChingHexagram: 17,
    iChingName: 'Following',
    keywords: Object.freeze(['opinions', 'following', 'logical structure']),
  },
  // Gate 18 - Correction (Spleen)
  {
    number: 18,
    name: 'Correction',
    nameHebrew: 'תיקון',
    centerId: 'spleen',
    iChingHexagram: 18,
    iChingName: 'Work on What Has Been Spoiled',
    keywords: Object.freeze(['correction', 'judgment', 'challenge']),
  },
  // Gate 19 - Wanting (Root)
  {
    number: 19,
    name: 'Wanting',
    nameHebrew: 'רצון',
    centerId: 'root',
    iChingHexagram: 19,
    iChingName: 'Approach',
    keywords: Object.freeze(['wanting', 'sensitivity', 'approach']),
  },
  // Gate 20 - The Now (Throat)
  {
    number: 20,
    name: 'The Now',
    nameHebrew: 'העכשיו',
    centerId: 'throat',
    iChingHexagram: 20,
    iChingName: 'Contemplation',
    keywords: Object.freeze(['now', 'contemplation', 'metamorphosis']),
  },
  // Gate 21 - The Hunter/Huntress (Heart)
  {
    number: 21,
    name: 'The Hunter/Huntress',
    nameHebrew: 'הצייד',
    centerId: 'heart',
    iChingHexagram: 21,
    iChingName: 'Biting Through',
    keywords: Object.freeze(['control', 'biting through', 'material control']),
  },
  // Gate 22 - Openness (Solar Plexus)
  {
    number: 22,
    name: 'Openness',
    nameHebrew: 'פתיחות',
    centerId: 'solar',
    iChingHexagram: 22,
    iChingName: 'Grace',
    keywords: Object.freeze(['openness', 'grace', 'emotional expression']),
  },
  // Gate 23 - Assimilation (Throat)
  {
    number: 23,
    name: 'Assimilation',
    nameHebrew: 'הטמעה',
    centerId: 'throat',
    iChingHexagram: 23,
    iChingName: 'Splitting Apart',
    keywords: Object.freeze(['assimilation', 'expression', 'splitting apart']),
  },
  // Gate 24 - Rationalization (Ajna)
  {
    number: 24,
    name: 'Rationalization',
    nameHebrew: 'רציונליזציה',
    centerId: 'ajna',
    iChingHexagram: 24,
    iChingName: 'Return',
    keywords: Object.freeze(['rationalization', 'return', 'mental review']),
  },
  // Gate 25 - The Spirit of the Self (G Center)
  {
    number: 25,
    name: 'The Spirit of the Self',
    nameHebrew: 'רוח העצמי',
    centerId: 'g',
    iChingHexagram: 25,
    iChingName: 'Innocence',
    keywords: Object.freeze(['innocence', 'spirit', 'universal love']),
  },
  // Gate 26 - The Egoist (Heart)
  {
    number: 26,
    name: 'The Egoist',
    nameHebrew: 'האגואיסט',
    centerId: 'heart',
    iChingHexagram: 26,
    iChingName: 'The Taming Power of the Great',
    keywords: Object.freeze(['egoist', 'taming power', 'memory']),
  },
  // Gate 27 - Caring (Sacral)
  {
    number: 27,
    name: 'Caring',
    nameHebrew: 'דאגה',
    centerId: 'sacral',
    iChingHexagram: 27,
    iChingName: 'The Corners of the Mouth',
    keywords: Object.freeze(['caring', 'nourishment', 'responsibility']),
  },
  // Gate 28 - The Game Player (Spleen)
  {
    number: 28,
    name: 'The Game Player',
    nameHebrew: 'השחקן',
    centerId: 'spleen',
    iChingHexagram: 28,
    iChingName: 'Preponderance of the Great',
    keywords: Object.freeze(['game player', 'struggle', 'purpose']),
  },
  // Gate 29 - Perseverance (Sacral)
  {
    number: 29,
    name: 'Perseverance',
    nameHebrew: 'התמדה',
    centerId: 'sacral',
    iChingHexagram: 29,
    iChingName: 'The Abysmal',
    keywords: Object.freeze(['perseverance', 'saying yes', 'commitment']),
  },
  // Gate 30 - The Clinging Fire (Solar Plexus)
  {
    number: 30,
    name: 'The Clinging Fire',
    nameHebrew: 'האש הנדבקת',
    centerId: 'solar',
    iChingHexagram: 30,
    iChingName: 'The Clinging',
    keywords: Object.freeze(['desire', 'feelings', 'recognition']),
  },
  // Gate 31 - Influence (Throat)
  {
    number: 31,
    name: 'Influence',
    nameHebrew: 'השפעה',
    centerId: 'throat',
    iChingHexagram: 31,
    iChingName: 'Influence',
    keywords: Object.freeze(['influence', 'leadership', 'democracy']),
  },
  // Gate 32 - Continuity (Spleen)
  {
    number: 32,
    name: 'Continuity',
    nameHebrew: 'המשכיות',
    centerId: 'spleen',
    iChingHexagram: 32,
    iChingName: 'Duration',
    keywords: Object.freeze(['continuity', 'endurance', 'transformation']),
  },
  // Gate 33 - Privacy (Throat)
  {
    number: 33,
    name: 'Privacy',
    nameHebrew: 'פרטיות',
    centerId: 'throat',
    iChingHexagram: 33,
    iChingName: 'Retreat',
    keywords: Object.freeze(['privacy', 'retreat', 'remembering']),
  },
  // Gate 34 - Power (Sacral)
  {
    number: 34,
    name: 'Power',
    nameHebrew: 'כוח',
    centerId: 'sacral',
    iChingHexagram: 34,
    iChingName: 'The Power of the Great',
    keywords: Object.freeze(['power', 'strength', 'asexual energy']),
  },
  // Gate 35 - Change (Throat)
  {
    number: 35,
    name: 'Change',
    nameHebrew: 'שינוי',
    centerId: 'throat',
    iChingHexagram: 35,
    iChingName: 'Progress',
    keywords: Object.freeze(['change', 'progress', 'adventure']),
  },
  // Gate 36 - Crisis (Solar Plexus)
  {
    number: 36,
    name: 'Crisis',
    nameHebrew: 'משבר',
    centerId: 'solar',
    iChingHexagram: 36,
    iChingName: 'Darkening of the Light',
    keywords: Object.freeze(['crisis', 'inexperience', 'emotional depth']),
  },
  // Gate 37 - Friendship (Solar Plexus)
  {
    number: 37,
    name: 'Friendship',
    nameHebrew: 'ידידות',
    centerId: 'solar',
    iChingHexagram: 37,
    iChingName: 'The Family',
    keywords: Object.freeze(['friendship', 'family', 'community']),
  },
  // Gate 38 - The Fighter (Root)
  {
    number: 38,
    name: 'The Fighter',
    nameHebrew: 'הלוחם',
    centerId: 'root',
    iChingHexagram: 38,
    iChingName: 'Opposition',
    keywords: Object.freeze(['fighter', 'opposition', 'purpose']),
  },
  // Gate 39 - Provocation (Root)
  {
    number: 39,
    name: 'Provocation',
    nameHebrew: 'פרובוקציה',
    centerId: 'root',
    iChingHexagram: 39,
    iChingName: 'Obstruction',
    keywords: Object.freeze(['provocation', 'obstruction', 'spirit']),
  },
  // Gate 40 - Aloneness (Heart)
  {
    number: 40,
    name: 'Aloneness',
    nameHebrew: 'בדידות',
    centerId: 'heart',
    iChingHexagram: 40,
    iChingName: 'Deliverance',
    keywords: Object.freeze(['aloneness', 'deliverance', 'will']),
  },
  // Gate 41 - Contraction (Root)
  {
    number: 41,
    name: 'Contraction',
    nameHebrew: 'צמצום',
    centerId: 'root',
    iChingHexagram: 41,
    iChingName: 'Decrease',
    keywords: Object.freeze(['contraction', 'decrease', 'fantasy']),
  },
  // Gate 42 - Growth (Sacral)
  {
    number: 42,
    name: 'Growth',
    nameHebrew: 'צמיחה',
    centerId: 'sacral',
    iChingHexagram: 42,
    iChingName: 'Increase',
    keywords: Object.freeze(['growth', 'increase', 'completion']),
  },
  // Gate 43 - Insight (Ajna)
  {
    number: 43,
    name: 'Insight',
    nameHebrew: 'תובנה',
    centerId: 'ajna',
    iChingHexagram: 43,
    iChingName: 'Breakthrough',
    keywords: Object.freeze(['insight', 'breakthrough', 'deafness']),
  },
  // Gate 44 - Alertness (Spleen)
  {
    number: 44,
    name: 'Alertness',
    nameHebrew: 'ערנות',
    centerId: 'spleen',
    iChingHexagram: 44,
    iChingName: 'Coming to Meet',
    keywords: Object.freeze(['alertness', 'pattern recognition', 'instinct']),
  },
  // Gate 45 - The Gatherer (Throat)
  {
    number: 45,
    name: 'The Gatherer',
    nameHebrew: 'המאסף',
    centerId: 'throat',
    iChingHexagram: 45,
    iChingName: 'Gathering Together',
    keywords: Object.freeze(['gatherer', 'king/queen', 'possessions']),
  },
  // Gate 46 - Determination (G Center)
  {
    number: 46,
    name: 'Determination',
    nameHebrew: 'נחישות',
    centerId: 'g',
    iChingHexagram: 46,
    iChingName: 'Pushing Upward',
    keywords: Object.freeze(['determination', 'body', 'serendipity']),
  },
  // Gate 47 - Realization (Ajna)
  {
    number: 47,
    name: 'Realization',
    nameHebrew: 'מימוש',
    centerId: 'ajna',
    iChingHexagram: 47,
    iChingName: 'Oppression',
    keywords: Object.freeze(['realization', 'oppression', 'mental understanding']),
  },
  // Gate 48 - Depth (Spleen)
  {
    number: 48,
    name: 'Depth',
    nameHebrew: 'עומק',
    centerId: 'spleen',
    iChingHexagram: 48,
    iChingName: 'The Well',
    keywords: Object.freeze(['depth', 'well', 'talent']),
  },
  // Gate 49 - Principles (Solar Plexus)
  {
    number: 49,
    name: 'Principles',
    nameHebrew: 'עקרונות',
    centerId: 'solar',
    iChingHexagram: 49,
    iChingName: 'Revolution',
    keywords: Object.freeze(['principles', 'revolution', 'rejection']),
  },
  // Gate 50 - Values (Spleen)
  {
    number: 50,
    name: 'Values',
    nameHebrew: 'ערכים',
    centerId: 'spleen',
    iChingHexagram: 50,
    iChingName: 'The Caldron',
    keywords: Object.freeze(['values', 'responsibility', 'law']),
  },
  // Gate 51 - Shock (Heart)
  {
    number: 51,
    name: 'Shock',
    nameHebrew: 'הלם',
    centerId: 'heart',
    iChingHexagram: 51,
    iChingName: 'The Arousing',
    keywords: Object.freeze(['shock', 'initiative', 'competitive spirit']),
  },
  // Gate 52 - Stillness (Root)
  {
    number: 52,
    name: 'Stillness',
    nameHebrew: 'דממה',
    centerId: 'root',
    iChingHexagram: 52,
    iChingName: 'Keeping Still',
    keywords: Object.freeze(['stillness', 'inaction', 'focus']),
  },
  // Gate 53 - Development (Root)
  {
    number: 53,
    name: 'Development',
    nameHebrew: 'התפתחות',
    centerId: 'root',
    iChingHexagram: 53,
    iChingName: 'Development',
    keywords: Object.freeze(['development', 'beginning', 'cycles']),
  },
  // Gate 54 - Ambition (Root)
  {
    number: 54,
    name: 'Ambition',
    nameHebrew: 'שאיפה',
    centerId: 'root',
    iChingHexagram: 54,
    iChingName: 'The Marrying Maiden',
    keywords: Object.freeze(['ambition', 'drive', 'rising']),
  },
  // Gate 55 - Spirit (Solar Plexus)
  {
    number: 55,
    name: 'Spirit',
    nameHebrew: 'רוח',
    centerId: 'solar',
    iChingHexagram: 55,
    iChingName: 'Abundance',
    keywords: Object.freeze(['spirit', 'abundance', 'emotional spirit']),
  },
  // Gate 56 - Stimulation (Throat)
  {
    number: 56,
    name: 'Stimulation',
    nameHebrew: 'גירוי',
    centerId: 'throat',
    iChingHexagram: 56,
    iChingName: 'The Wanderer',
    keywords: Object.freeze(['stimulation', 'storytelling', 'wanderer']),
  },
  // Gate 57 - Intuition (Spleen)
  {
    number: 57,
    name: 'Intuition',
    nameHebrew: 'אינטואיציה',
    centerId: 'spleen',
    iChingHexagram: 57,
    iChingName: 'The Gentle',
    keywords: Object.freeze(['intuition', 'clarity', 'the gentle']),
  },
  // Gate 58 - Vitality (Root)
  {
    number: 58,
    name: 'Vitality',
    nameHebrew: 'חיוניות',
    centerId: 'root',
    iChingHexagram: 58,
    iChingName: 'The Joyous',
    keywords: Object.freeze(['vitality', 'joy', 'aliveness']),
  },
  // Gate 59 - Sexuality (Sacral)
  {
    number: 59,
    name: 'Sexuality',
    nameHebrew: 'מיניות',
    centerId: 'sacral',
    iChingHexagram: 59,
    iChingName: 'Dispersion',
    keywords: Object.freeze(['sexuality', 'intimacy', 'dispersion']),
  },
  // Gate 60 - Limitation (Root)
  {
    number: 60,
    name: 'Limitation',
    nameHebrew: 'הגבלה',
    centerId: 'root',
    iChingHexagram: 60,
    iChingName: 'Limitation',
    keywords: Object.freeze(['limitation', 'acceptance', 'mutation']),
  },
  // Gate 61 - Inner Truth (Head)
  {
    number: 61,
    name: 'Inner Truth',
    nameHebrew: 'אמת פנימית',
    centerId: 'head',
    iChingHexagram: 61,
    iChingName: 'Inner Truth',
    keywords: Object.freeze(['inner truth', 'mystery', 'inspiration']),
  },
  // Gate 62 - Details (Throat)
  {
    number: 62,
    name: 'Details',
    nameHebrew: 'פרטים',
    centerId: 'throat',
    iChingHexagram: 62,
    iChingName: 'Preponderance of the Small',
    keywords: Object.freeze(['details', 'precision', 'facts']),
  },
  // Gate 63 - Doubt (Head)
  {
    number: 63,
    name: 'Doubt',
    nameHebrew: 'ספק',
    centerId: 'head',
    iChingHexagram: 63,
    iChingName: 'After Completion',
    keywords: Object.freeze(['doubt', 'questioning', 'logic']),
  },
  // Gate 64 - Confusion (Head)
  {
    number: 64,
    name: 'Confusion',
    nameHebrew: 'בלבול',
    centerId: 'head',
    iChingHexagram: 64,
    iChingName: 'Before Completion',
    keywords: Object.freeze(['confusion', 'possibilities', 'imagination']),
  },
])

/**
 * Lookup gate by number
 */
export function getGate(number: number): Gate {
  if (number < 1 || number > 64) {
    throw new RangeError(`Invalid gate number: ${number}. Must be 1-64.`)
  }
  return GATES[number - 1]
}

/**
 * Get all gates for a specific center
 */
export function getGatesByCenter(centerId: CenterId): readonly Gate[] {
  return GATES.filter((gate) => gate.centerId === centerId)
}

/**
 * Gates organized by center (for quick lookup)
 */
export const GATES_BY_CENTER: Readonly<Record<CenterId, readonly number[]>> = Object.freeze({
  head: Object.freeze([64, 61, 63]),
  ajna: Object.freeze([47, 24, 4, 17, 43, 11]),
  throat: Object.freeze([62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16]),
  g: Object.freeze([7, 1, 13, 25, 46, 2, 15, 10]),
  heart: Object.freeze([21, 40, 26, 51]),
  spleen: Object.freeze([48, 57, 44, 50, 32, 28, 18]),
  sacral: Object.freeze([5, 14, 29, 59, 9, 3, 42, 27, 34]),
  solar: Object.freeze([36, 22, 37, 6, 49, 55, 30]),
  root: Object.freeze([53, 60, 52, 19, 39, 41, 58, 38, 54]),
})

/**
 * Reverse lookup: gate number -> center
 */
export const GATE_TO_CENTER: Readonly<Record<number, CenterId>> = Object.freeze(
  GATES.reduce(
    (acc, gate) => {
      acc[gate.number] = gate.centerId
      return acc
    },
    {} as Record<number, CenterId>
  )
)

/**
 * The Rave Mandala Gate Sequence
 *
 * This defines the order of gates around the zodiac wheel (Rave Mandala).
 * Each gate occupies 5.625° (360° / 64 gates).
 * Index 0 = 0° Aries, proceeding counterclockwise.
 *
 * The sequence is NOT numerical - it follows the I Ching King Wen sequence
 * mapped to the wheel starting from Gate 41 at 0° Aries.
 */
export const MANDALA_GATE_SEQUENCE: readonly number[] = Object.freeze([
  // Aries (0° - 30°): Gates 41, 19, 13, 49, 30, 55
  41, 19, 13, 49, 30, 55,
  // Taurus (30° - 60°): Gates 37, 63, 22, 36, 25, 17
  37, 63, 22, 36, 25, 17,
  // Gemini (60° - 90°): Gates 21, 51, 42, 3, 27, 24
  21, 51, 42, 3, 27, 24,
  // Cancer (90° - 120°): Gates 2, 23, 8, 20, 16, 35
  2, 23, 8, 20, 16, 35,
  // Leo (120° - 150°): Gates 45, 12, 15, 52, 39, 53
  45, 12, 15, 52, 39, 53,
  // Virgo (150° - 180°): Gates 62, 56, 31, 33, 7, 4
  62, 56, 31, 33, 7, 4,
  // Libra (180° - 210°): Gates 29, 59, 40, 64, 47, 6
  29, 59, 40, 64, 47, 6,
  // Scorpio (210° - 240°): Gates 46, 18, 48, 57, 32, 50
  46, 18, 48, 57, 32, 50,
  // Sagittarius (240° - 270°): Gates 28, 44, 1, 43, 14, 34
  28, 44, 1, 43, 14, 34,
  // Capricorn (270° - 300°): Gates 9, 5, 26, 11, 10, 58
  9, 5, 26, 11, 10, 58,
  // Aquarius (300° - 330°): Gates 38, 54, 61, 60, 41, 19
  38, 54, 61, 60,
  // Note: The sequence wraps around - last entries in Pisces
  // Pisces (330° - 360°): Continuing the cycle
  // The actual full sequence repeats from Gate 41
])

// Full 64-gate mandala sequence (corrected and complete)
export const MANDALA_SEQUENCE_FULL: readonly number[] = Object.freeze([
  41, 19, 13, 49, 30, 55, 37, 63, // 0° - 45°
  22, 36, 25, 17, 21, 51, 42, 3, // 45° - 90°
  27, 24, 2, 23, 8, 20, 16, 35, // 90° - 135°
  45, 12, 15, 52, 39, 53, 62, 56, // 135° - 180°
  31, 33, 7, 4, 29, 59, 40, 64, // 180° - 225°
  47, 6, 46, 18, 48, 57, 32, 50, // 225° - 270°
  28, 44, 1, 43, 14, 34, 9, 5, // 270° - 315°
  26, 11, 10, 58, 38, 54, 61, 60, // 315° - 360°
])

/**
 * Convert zodiac longitude to gate and line
 *
 * @param longitude - Zodiac longitude in degrees (0-360)
 * @returns Gate number (1-64) and line (1-6)
 */
export function longitudeToGate(longitude: number): { gate: number; line: number } {
  // Normalize longitude to 0-360
  const normalizedLongitude = ((longitude % 360) + 360) % 360

  // Each gate occupies 5.625° (360/64)
  const gateSize = 360 / 64
  const lineSize = gateSize / 6

  // Find the index in the mandala sequence
  const gateIndex = Math.floor(normalizedLongitude / gateSize)
  const gate = MANDALA_SEQUENCE_FULL[gateIndex]

  // Calculate the line (1-6) within the gate
  const positionInGate = normalizedLongitude % gateSize
  const line = Math.floor(positionInGate / lineSize) + 1

  return { gate, line: Math.min(line, 6) as 1 | 2 | 3 | 4 | 5 | 6 }
}

/**
 * Get the zodiac degree range for a specific gate
 */
export function getGateDegreeRange(gateNumber: number): { start: number; end: number } | null {
  const index = MANDALA_SEQUENCE_FULL.indexOf(gateNumber)
  if (index === -1) return null

  const gateSize = 360 / 64
  return {
    start: index * gateSize,
    end: (index + 1) * gateSize,
  }
}
