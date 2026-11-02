import type { DreamspellConnection, HarmonyType } from '../types/relationship'

/**
 * Bilingual description, harmony and score for each Dreamspell connection
 * type. Pure data, kept apart from the compatibility service so a client can
 * name a connection without loading the astrology and Human Design engines.
 */
export const CONNECTION_DESCRIPTIONS: Record<DreamspellConnection['type'], {
  description: string
  descriptionHebrew: string
  harmony: HarmonyType
  score: number
}> = {
  'same-kin': {
    description: 'Same Kin - The identical galactic signature',
    descriptionHebrew: 'אותו קין - חתימה גלקטית זהה',
    harmony: 'supportive',
    score: 30,
  },
  analog: {
    description: 'Analog - Supportive partnership energy',
    descriptionHebrew: 'אנלוג - אנרגיית שותפות תומכת',
    harmony: 'supportive',
    score: 20,
  },
  antipode: {
    description: 'Antipode - Challenging growth opportunity',
    descriptionHebrew: 'אנטיפוד - הזדמנות צמיחה מאתגרת',
    harmony: 'challenging',
    score: 10,
  },
  occult: {
    description: 'Occult - Hidden transformative power',
    descriptionHebrew: 'אוקולט - כוח טרנספורמטיבי נסתר',
    harmony: 'transformative',
    score: 15,
  },
  guide: {
    description: 'Guide - Destiny guidance connection',
    descriptionHebrew: 'מוביל - חיבור הנחיית גורל',
    harmony: 'supportive',
    score: 18,
  },

  // ---- Seal-only echoes of the oracle. A weaker claim, honestly named. ----
  // These fire when the seals pair but the tones do not (≈1 in 20, versus
  // 1 in 260 for the real thing). They are kept because they are still a real
  // structural relation — but they must never be presented as the oracle.
  'analog-seal': {
    description: 'Analog Seal - Their seal supports yours, on a different tone',
    descriptionHebrew: 'חותם אנלוגי - החותם תומך, אך בטון אחר',
    harmony: 'supportive',
    score: 6,
  },
  'antipode-seal': {
    description: 'Antipode Seal - Their seal challenges yours, on a different tone',
    descriptionHebrew: 'חותם אנטיפודי - החותם מאתגר, אך בטון אחר',
    harmony: 'challenging',
    score: 4,
  },
  'occult-seal': {
    description: 'Occult Seal - Their seal is your hidden power, but the tones do not close',
    descriptionHebrew: 'חותם נסתר - החותם הוא כוחך הנסתר, אך הטונים אינם נסגרים',
    harmony: 'transformative',
    score: 5,
  },
  'guide-seal': {
    description: 'Guide Seal - Their seal guides yours, on a different tone',
    descriptionHebrew: 'חותם מוביל - החותם מנחה, אך בטון אחר',
    harmony: 'supportive',
    score: 5,
  },
  'same-seal': {
    description: 'Same Seal - Shared archetypal essence',
    descriptionHebrew: 'אותו חותם - מהות ארכיטיפית משותפת',
    harmony: 'supportive',
    score: 25,
  },
  'same-tone': {
    description: 'Same Tone - Resonant frequency match',
    descriptionHebrew: 'אותו טון - התאמת תדר מהדהד',
    harmony: 'supportive',
    score: 15,
  },
  'same-color': {
    description: 'Same Color Family - Aligned directional energy',
    descriptionHebrew: 'אותה משפחת צבע - אנרגיה כיוונית מיושרת',
    harmony: 'supportive',
    score: 8,
  },

  // ---- Argüelles' structural groupings of the 260-kin matrix. ----
  // These are canonical STRUCTURE (a wavespell is 13 kin, a castle 52, an Earth
  // Family the seals congruent mod 5). Reading them as a bond between two people
  // is community convention, not doctrine — so they are scored low and never
  // outrank the oracle. See docs/redesign/CONNECTION_ATLAS.md §3.
  'same-wavespell': {
    description: 'Same Wavespell - Born inside the same 13-kin arc',
    descriptionHebrew: 'אותו גל - נולדו באותו מחזור בן 13 קין',
    harmony: 'supportive',
    score: 12,
  },
  'same-castle': {
    description: 'Same Castle - The same 52-kin quarter of the matrix',
    descriptionHebrew: 'אותה טירה - אותו רבע של 52 קין',
    harmony: 'supportive',
    score: 5,
  },
  'same-earth-family': {
    description: 'Same Earth Family - The same role in the Earth cycle',
    descriptionHebrew: 'אותה משפחת ארץ - אותו תפקיד במחזור',
    harmony: 'supportive',
    score: 5,
  },
}

