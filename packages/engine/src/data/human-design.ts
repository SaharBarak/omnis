/**
 * Human Design Core Data
 *
 * Centers, Types, Authorities, and Profiles
 */

import type {
  Center,
  CenterId,
  TypeDefinition,
  HumanDesignType,
  AuthorityDefinition,
  Authority,
  Profile,
  ProfileLine,
} from '../types/human-design'

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

// =============================================================================
// TYPES
// =============================================================================

/**
 * The 5 Human Design Types with strategies and themes
 */
export const TYPES: readonly TypeDefinition[] = Object.freeze([
  {
    type: 'manifestor',
    name: 'Manifestor',
    nameHebrew: 'מניפסטור',
    strategy: 'To Inform',
    strategyHebrew: 'ליידע',
    notSelfTheme: 'Anger',
    signatureTheme: 'Peace',
    aura: 'Closed and repelling',
    population: '~8%',
  },
  {
    type: 'generator',
    name: 'Generator',
    nameHebrew: "ג'נרטור",
    strategy: 'To Respond',
    strategyHebrew: 'להגיב',
    notSelfTheme: 'Frustration',
    signatureTheme: 'Satisfaction',
    aura: 'Open and enveloping',
    population: '~37%',
  },
  {
    type: 'manifesting-generator',
    name: 'Manifesting Generator',
    nameHebrew: "מניפסטינג ג'נרטור",
    strategy: 'To Respond, then Inform',
    strategyHebrew: 'להגיב, ואז ליידע',
    notSelfTheme: 'Frustration/Anger',
    signatureTheme: 'Satisfaction',
    aura: 'Open and enveloping',
    population: '~33%',
  },
  {
    type: 'projector',
    name: 'Projector',
    nameHebrew: "פרוג'קטור",
    strategy: 'Wait for Invitation',
    strategyHebrew: 'לחכות להזמנה',
    notSelfTheme: 'Bitterness',
    signatureTheme: 'Success',
    aura: 'Focused and absorbing',
    population: '~20%',
  },
  {
    type: 'reflector',
    name: 'Reflector',
    nameHebrew: 'רפלקטור',
    strategy: 'Wait 28 Days (Lunar Cycle)',
    strategyHebrew: 'לחכות 28 יום (מחזור ירחי)',
    notSelfTheme: 'Disappointment',
    signatureTheme: 'Surprise',
    aura: 'Resistant and sampling',
    population: '~1%',
  },
])

/**
 * Get type definition by type
 */
export function getTypeDefinition(type: HumanDesignType): TypeDefinition {
  const def = TYPES.find((t) => t.type === type)
  if (!def) throw new Error(`Type not found: ${type}`)
  return def
}

// =============================================================================
// AUTHORITIES
// =============================================================================

/**
 * The 8 Authority types with their descriptions
 */
export const AUTHORITIES: readonly AuthorityDefinition[] = Object.freeze([
  {
    authority: 'emotional',
    name: 'Emotional Authority',
    nameHebrew: 'סמכות רגשית',
    description: 'Solar Plexus is defined. Decisions need emotional clarity over time.',
    decisionProcess:
      'Wait for emotional wave to complete before making important decisions. Never decide in the highs or lows.',
  },
  {
    authority: 'sacral',
    name: 'Sacral Authority',
    nameHebrew: 'סמכות סקרלית',
    description: 'Sacral is defined without emotional definition. Gut response is the guide.',
    decisionProcess: 'Listen to sacral sounds (uh-huh/un-un). Respond in the moment to yes/no questions.',
  },
  {
    authority: 'splenic',
    name: 'Splenic Authority',
    nameHebrew: 'סמכות טחולית',
    description: 'Spleen is defined without Sacral or Emotional. Instinct and intuition guide.',
    decisionProcess: 'Trust immediate knowing. The spleen speaks once, quietly, in the now.',
  },
  {
    authority: 'ego-manifested',
    name: 'Ego Manifested Authority',
    nameHebrew: 'סמכות אגו מניפסטית',
    description: 'Heart connected to Throat in a Manifestor. Will power guides.',
    decisionProcess: "Ask 'What do I want?' The heart knows what it's committed to.",
  },
  {
    authority: 'ego-projected',
    name: 'Ego Projected Authority',
    nameHebrew: 'סמכות אגו מוקרנת',
    description: 'Heart defined in a Projector. Will power needs to be invited.',
    decisionProcess: 'Wait for invitation, then ask what you want and have energy for.',
  },
  {
    authority: 'self-projected',
    name: 'Self-Projected Authority',
    nameHebrew: 'סמכות עצמית מוקרנת',
    description: 'G Center connected to Throat in a Projector. Identity guides.',
    decisionProcess: 'Talk through decisions with others. Listen to what comes out of your own voice.',
  },
  {
    authority: 'mental',
    name: 'Mental (None) Authority',
    nameHebrew: 'סמכות מנטלית',
    description: 'No inner authority. Projector with only Head/Ajna defined.',
    decisionProcess: 'Discuss with trusted others. Environment and outer authority matter most.',
  },
  {
    authority: 'lunar',
    name: 'Lunar Authority',
    nameHebrew: 'סמכות ירחית',
    description: 'Reflector with no definitions. Moon cycle is the guide.',
    decisionProcess: 'Wait 28 days (full lunar cycle) for major decisions. Sample perspectives.',
  },
])

/**
 * Get authority definition
 */
export function getAuthorityDefinition(authority: Authority): AuthorityDefinition {
  const def = AUTHORITIES.find((a) => a.authority === authority)
  if (!def) throw new Error(`Authority not found: ${authority}`)
  return def
}

// =============================================================================
// PROFILES
// =============================================================================

/**
 * The 12 Profiles (combinations of conscious/unconscious lines)
 */
export const PROFILES: readonly Profile[] = Object.freeze([
  {
    id: '1/3',
    conscious: 1,
    unconscious: 3,
    name: 'Investigator/Martyr',
    nameHebrew: 'חוקר/קרבן',
    theme: 'Trial and error through research. Builds foundation through discovery and breaking.',
  },
  {
    id: '1/4',
    conscious: 1,
    unconscious: 4,
    name: 'Investigator/Opportunist',
    nameHebrew: 'חוקר/אופורטוניסט',
    theme: 'Foundation through network. Researches and shares knowledge with their community.',
  },
  {
    id: '2/4',
    conscious: 2,
    unconscious: 4,
    name: 'Hermit/Opportunist',
    nameHebrew: 'נזיר/אופורטוניסט',
    theme: 'Natural talent called out. Needs alone time but connects through close relationships.',
  },
  {
    id: '2/5',
    conscious: 2,
    unconscious: 5,
    name: 'Hermit/Heretic',
    nameHebrew: 'נזיר/כופר',
    theme: 'Called to universalize. Has natural gifts projected upon by others.',
  },
  {
    id: '3/5',
    conscious: 3,
    unconscious: 5,
    name: 'Martyr/Heretic',
    nameHebrew: 'קרבן/כופר',
    theme: 'Trial and error for others. Experiments and finds practical solutions for the collective.',
  },
  {
    id: '3/6',
    conscious: 3,
    unconscious: 6,
    name: 'Martyr/Role Model',
    nameHebrew: 'קרבן/מודל לחיקוי',
    theme: 'Trial to wisdom. Learns through experience, becomes a living example.',
  },
  {
    id: '4/6',
    conscious: 4,
    unconscious: 6,
    name: 'Opportunist/Role Model',
    nameHebrew: 'אופורטוניסט/מודל לחיקוי',
    theme: 'Network to example. Transforms personal experience into wisdom for community.',
  },
  {
    id: '4/1',
    conscious: 4,
    unconscious: 1,
    name: 'Opportunist/Investigator',
    nameHebrew: 'אופורטוניסט/חוקר',
    theme: 'Fixed foundation. Influences through network based on solid knowledge.',
  },
  {
    id: '5/1',
    conscious: 5,
    unconscious: 1,
    name: 'Heretic/Investigator',
    nameHebrew: 'כופר/חוקר',
    theme: 'Universal solutions. Projects practical solutions grounded in research.',
  },
  {
    id: '5/2',
    conscious: 5,
    unconscious: 2,
    name: 'Heretic/Hermit',
    nameHebrew: 'כופר/נזיר',
    theme: 'Called savior. Others project solutions onto their natural talents.',
  },
  {
    id: '6/2',
    conscious: 6,
    unconscious: 2,
    name: 'Role Model/Hermit',
    nameHebrew: 'מודל לחיקוי/נזיר',
    theme: 'Wisdom from withdrawal. Lives example while needing time alone.',
  },
  {
    id: '6/3',
    conscious: 6,
    unconscious: 3,
    name: 'Role Model/Martyr',
    nameHebrew: 'מודל לחיקוי/קרבן',
    theme: 'Wisdom through trial. Becomes an authority through life experience.',
  },
])

/**
 * Get profile by ID
 */
export function getProfile(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id === id)
}

/**
 * Get profile by line numbers
 */
export function getProfileByLines(conscious: ProfileLine, unconscious: ProfileLine): Profile | undefined {
  return PROFILES.find((p) => p.conscious === conscious && p.unconscious === unconscious)
}

// =============================================================================
// LINE DESCRIPTIONS
// =============================================================================

/**
 * Profile line themes
 */
export const LINE_THEMES: Readonly<Record<ProfileLine, { name: string; nameHebrew: string; theme: string }>> =
  Object.freeze({
    1: {
      name: 'Investigator',
      nameHebrew: 'חוקר',
      theme: 'Foundation, research, introspection, study',
    },
    2: {
      name: 'Hermit',
      nameHebrew: 'נזיר',
      theme: 'Natural talent, withdrawal, being called out',
    },
    3: {
      name: 'Martyr',
      nameHebrew: 'קרבן',
      theme: 'Trial and error, discovery through experience, bonds made and broken',
    },
    4: {
      name: 'Opportunist',
      nameHebrew: 'אופורטוניסט',
      theme: 'Network, influence, friendship, community',
    },
    5: {
      name: 'Heretic',
      nameHebrew: 'כופר',
      theme: 'Projection field, universalization, practical solutions',
    },
    6: {
      name: 'Role Model',
      nameHebrew: 'מודל לחיקוי',
      theme: 'Three life phases, objectivity, living example',
    },
  })

/**
 * Get line theme
 */
export function getLineTheme(line: ProfileLine): { name: string; nameHebrew: string; theme: string } {
  return LINE_THEMES[line]
}

// =============================================================================
// INCARNATION CROSS DATA
// =============================================================================

/**
 * Quarter positions for incarnation crosses
 */
export const QUARTER_GATES: Readonly<Record<string, readonly number[]>> = Object.freeze({
  initiation: Object.freeze([13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24]),
  civilization: Object.freeze([2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33]),
  duality: Object.freeze([7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44]),
  mutation: Object.freeze([1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19]),
})

/**
 * Get quarter from gate number
 */
export function getQuarterFromGate(gate: number): string | undefined {
  for (const [quarter, gates] of Object.entries(QUARTER_GATES)) {
    if (gates.includes(gate)) return quarter
  }
  return undefined
}
