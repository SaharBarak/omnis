/**
 * Human Design centres: the nine centres of the bodygraph and their groups.
 * Small on its own, so a drawing can name centres without the type, authority
 * and profile tables in human-design.ts, which re-exports this module.
 */

import type { Center, CenterId } from '../types/human-design'

// =============================================================================
// CENTERS
// =============================================================================

/**
 * The 9 energy centers in the bodygraph
 */
export const CENTERS: readonly Center[] = Object.freeze([
  {
    id: 'head',
    name: 'Head Center',
    hebrew: 'מרכז הראש',
    biologicalCorrelation: 'Pineal Gland',
    function: 'Inspiration, mental pressure to think and question',
    notSelfTheme: 'Trying to answer everyone\'s questions',
    gates: Object.freeze([64, 61, 63]),
  },
  {
    id: 'ajna',
    name: 'Ajna Center',
    hebrew: "מרכז האג'נה",
    biologicalCorrelation: 'Pituitary Gland',
    function: 'Conceptualization, mental awareness, processing',
    notSelfTheme: 'Pretending to be certain',
    gates: Object.freeze([47, 24, 4, 17, 43, 11]),
  },
  {
    id: 'throat',
    name: 'Throat Center',
    hebrew: 'מרכז הגרון',
    biologicalCorrelation: 'Thyroid & Parathyroid',
    function: 'Communication, manifestation, expression, action',
    notSelfTheme: 'Trying to attract attention',
    gates: Object.freeze([62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16]),
  },
  {
    id: 'g',
    name: 'G Center',
    hebrew: 'מרכז G',
    biologicalCorrelation: 'Liver & Blood',
    function: 'Identity, direction, love, self',
    notSelfTheme: 'Searching for love and direction',
    gates: Object.freeze([7, 1, 13, 25, 46, 2, 15, 10]),
  },
  {
    id: 'heart',
    name: 'Heart Center',
    hebrew: 'מרכז הלב',
    biologicalCorrelation: 'Heart, Stomach, Thymus, Gall Bladder',
    function: 'Willpower, ego, material world, value',
    notSelfTheme: 'Trying to prove worthiness',
    gates: Object.freeze([21, 40, 26, 51]),
  },
  {
    id: 'spleen',
    name: 'Spleen Center',
    hebrew: 'מרכז הטחול',
    biologicalCorrelation: 'Spleen, Lymphatic System',
    function: 'Intuition, instinct, health, survival, time',
    notSelfTheme: 'Holding on to what isn\'t good for you',
    gates: Object.freeze([48, 57, 44, 50, 32, 28, 18]),
  },
  {
    id: 'sacral',
    name: 'Sacral Center',
    hebrew: 'מרכז הסקראל',
    biologicalCorrelation: 'Ovaries & Testes',
    function: 'Life force, sexuality, work capacity, fertility',
    notSelfTheme: 'Not knowing when enough is enough',
    gates: Object.freeze([5, 14, 29, 59, 9, 3, 42, 27, 34]),
  },
  {
    id: 'solar',
    name: 'Solar Plexus Center',
    hebrew: 'מרכז מקלעת השמש',
    biologicalCorrelation: 'Kidneys, Pancreas, Prostate, Lungs, Nervous System',
    function: 'Emotions, feelings, desires, sensitivity, spirit',
    notSelfTheme: 'Avoiding confrontation and truth',
    gates: Object.freeze([36, 22, 37, 6, 49, 55, 30]),
  },
  {
    id: 'root',
    name: 'Root Center',
    hebrew: 'מרכז השורש',
    biologicalCorrelation: 'Adrenal Glands',
    function: 'Pressure, adrenaline, stress, drive to evolve',
    notSelfTheme: 'Being in a hurry to get free of pressure',
    gates: Object.freeze([53, 60, 52, 19, 39, 41, 58, 38, 54]),
  },
])

/**
 * Get center by ID
 */
export function getCenter(id: CenterId): Center {
  const center = CENTERS.find((c) => c.id === id)
  if (!center) throw new Error(`Center not found: ${id}`)
  return center
}

/**
 * Motor centers (can generate energy to the Throat)
 */
export const MOTOR_CENTERS: readonly CenterId[] = Object.freeze([
  'sacral',
  'root',
  'solar',
  'heart',
])

/**
 * Awareness centers
 */
export const AWARENESS_CENTERS: readonly CenterId[] = Object.freeze(['ajna', 'spleen', 'solar'])

/**
 * Pressure centers
 */
export const PRESSURE_CENTERS: readonly CenterId[] = Object.freeze(['head', 'root'])
