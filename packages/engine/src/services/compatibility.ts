// Compatibility Calculations for Pleiad Phase 2.4
// Calculates Dreamspell and Tzolkin compatibility between people

import type { Kin, SealNumber, ToneNumber } from '../core/types'
import type { DreamspellCompatibility, DreamspellConnection, HarmonyType } from '../types/relationship'
import { dateToKin, kinToSeal, kinToTone } from '../calculations/dreamspell'
import { dateToTzolkin } from '../calculations/tzolkin'
import { getAnalog, getAntipode, getOccult, getGuide } from '../data/oracle-tables'
import { getSeal } from '../data/seals'
import { compareNames } from '../calculations/gematria'
import {
  calculateSynastryCompatibility,
  type SynastryCompatibility,
} from './synastry'
import {
  calculateHDCompatibility,
  type HDCompatibility,
} from './hd-compatibility'

// ============================================================================
// CONNECTION DESCRIPTIONS (Bilingual)
// ============================================================================

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

// ============================================================================
// COMPATIBILITY CALCULATION
// ============================================================================

export interface PersonKinData {
  kin: Kin
  seal: SealNumber
  tone: ToneNumber
  color: 'red' | 'white' | 'blue' | 'yellow'
}

export function getPersonKinData(birthDate: string): PersonKinData {
  const kin = dateToKin(birthDate)
  const seal = kinToSeal(kin)
  const tone = kinToTone(kin)
  const sealData = getSeal(seal)

  return {
    kin,
    seal,
    tone,
    color: sealData.color,
  }
}

export function calculateDreamspellCompatibility(
  person1BirthDate: string,
  person2BirthDate: string
): DreamspellCompatibility {
  const p1 = getPersonKinData(person1BirthDate)
  const p2 = getPersonKinData(person2BirthDate)

  const connections: DreamspellConnection[] = []

  // Check same-seal relationship
  if (p1.seal === p2.seal) {
    const desc = CONNECTION_DESCRIPTIONS['same-seal']
    connections.push({
      type: 'same-seal',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // Check same-tone relationship
  if (p1.tone === p2.tone) {
    const desc = CONNECTION_DESCRIPTIONS['same-tone']
    connections.push({
      type: 'same-tone',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // Check same-color relationship (only if not same-seal)
  if (p1.color === p2.color && p1.seal !== p2.seal) {
    const desc = CONNECTION_DESCRIPTIONS['same-color']
    connections.push({
      type: 'same-color',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // ==========================================================================
  // THE ORACLE — kin-level, not seal-level.
  //
  // Argüelles' oracle positions require the paired seal AND the tone. Because
  // gcd(13,20)=1, seal and tone are independent, so an oracle relation is a
  // 1-in-260 event (0.385%) — NOT 1 in 20. This code previously compared seals
  // alone, which fired ~20x too often and shipped a loose approximation under
  // the strict name. See docs/redesign/CONNECTION_ATLAS.md §3.
  //
  // Analog and antipode carry the tone across unchanged. Occult reflects it
  // (the two tones sum to 14), which collapses to the identity kin1+kin2=261.
  // The guide keeps the tone and shifts the seal by 12(T−1) mod 20.
  //
  // When the seals pair but the tones do not, that is still a real (weaker)
  // structural relation — emitted as `*-seal`, never as the oracle itself.
  // ==========================================================================
  const sameTone = p1.tone === p2.tone

  const push = (type: DreamspellConnection['type']) => {
    const desc = CONNECTION_DESCRIPTIONS[type]
    connections.push({
      type,
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // The identical signature. Strictly rarer than any oracle position.
  if (p1.kin === p2.kin) push('same-kin')

  if (p2.seal === getAnalog(p1.seal)) push(sameTone ? 'analog' : 'analog-seal')

  if (p2.seal === getAntipode(p1.seal)) push(sameTone ? 'antipode' : 'antipode-seal')

  // Occult reflects BOTH seal and tone: kin1 + kin2 = 261.
  if (p2.seal === getOccult(p1.seal)) {
    push(p1.kin + p2.kin === 261 ? 'occult' : 'occult-seal')
  }

  // The guide is the only tone-dependent position, and the only one that can
  // point at the kin's own seal (tones 1, 6, 11) — which is not a relation
  // between two different people, so it is excluded.
  if (p2.seal === getGuide(p1.seal, p1.tone) && p1.seal !== p2.seal) {
    push(sameTone ? 'guide' : 'guide-seal')
  }

  // ---- Structural groupings of the 260-kin matrix (canonical structure). ----
  // Wavespell = one of 20 arcs of 13 kin. Castle = one of 5 blocks of 52 kin.
  // Earth Family = the seals congruent mod 5 (Polar/Cardinal/Core/Signal/Gateway).
  const wavespell = (k: number) => Math.ceil(k / 13)
  const castle = (k: number) => Math.ceil(k / 52)
  const earthFamily = (s: number) => (s - 1) % 5

  if (p1.kin !== p2.kin && wavespell(p1.kin) === wavespell(p2.kin)) push('same-wavespell')
  // A shared wavespell implies a shared castle — don't say it twice.
  else if (castle(p1.kin) === castle(p2.kin)) push('same-castle')

  if (p1.seal !== p2.seal && earthFamily(p1.seal) === earthFamily(p2.seal)) {
    push('same-earth-family')
  }

  // Calculate total score (0-100)
  // Base score of 20 for being in the same system
  // Add connection bonuses
  let score = 20
  for (const conn of connections) {
    score += CONNECTION_DESCRIPTIONS[conn.type].score
  }
  // Cap at 100
  score = Math.min(100, score)

  return {
    person1Kin: p1.kin,
    person2Kin: p2.kin,
    score,
    connections,
  }
}

// ============================================================================
// TZOLKIN COMPATIBILITY
// ============================================================================

export interface TzolkinCompatibility {
  person1Sign: number
  person1Tone: number
  person2Sign: number
  person2Tone: number
  score: number
  connections: Array<{
    type: 'same-sign' | 'same-tone' | 'trecena-match' | 'year-bearer' | 'same-night-lord'
    description: string
    descriptionHebrew: string
  }>
}

export function calculateTzolkinCompatibility(
  person1BirthDate: string,
  person2BirthDate: string
): TzolkinCompatibility {
  const p1 = dateToTzolkin(person1BirthDate)
  const p2 = dateToTzolkin(person2BirthDate)

  const p1Sign = p1.daySign.number
  const p2Sign = p2.daySign.number

  const connections: TzolkinCompatibility['connections'] = []
  let score = 20 // Base score

  // Same sign
  if (p1Sign === p2Sign) {
    connections.push({
      type: 'same-sign',
      description: 'Same Day Sign - Shared Nawal energy',
      descriptionHebrew: 'אותו סימן יום - אנרגיית נאוואל משותפת',
    })
    score += 25
  }

  // Same tone
  if (p1.tone === p2.tone) {
    connections.push({
      type: 'same-tone',
      description: 'Same Tone - Resonant power number',
      descriptionHebrew: 'אותו טון - מספר כוח מהדהד',
    })
    score += 15
  }

  // ==========================================================================
  // TRECENA — the real one.
  //
  // A trecena is one of the twenty 13-day periods of the 260-day count, each
  // opening on `1 <day sign>`. Two people share a trecena when their births
  // fall inside the same 13-day run, i.e. when their runs START on the same
  // day sign. Given (sign, tone), the sign that opened the run is
  // `sign − (tone − 1)`, wrapped into 1..20.
  //
  // This previously computed `floor((sign − 1) / 13)` — bucketing the day-sign
  // NUMBER (1-20) into two halves. That is not a trecena in any sense, and it
  // fired on 43.7% of random pairs. The real relation fires on 5%.
  // See docs/redesign/CONNECTION_ATLAS.md §4.
  // ==========================================================================
  const trecenaStart = (sign: number, tone: number): number =>
    ((sign - tone) % 20 + 20) % 20 + 1

  if (trecenaStart(p1Sign, p1.tone) === trecenaStart(p2Sign, p2.tone) && p1Sign !== p2Sign) {
    connections.push({
      type: 'trecena-match',
      description: 'Same Trecena - Born inside the same 13-day run',
      descriptionHebrew: 'אותה טרסנה - נולדו באותו מחזור בן 13 יום',
    })
    score += 10
  }

  // ==========================================================================
  // YEAR BEARERS — attested, and genuinely selective.
  //
  // Only four of the twenty day signs can open a haab year. In the highland
  // tradition the Year Bearers anchor divination; a daykeeper counts forward
  // from the current bearer. Two people who BOTH carry a bearer sign share that
  // office. The four bearers sit five apart (mod 5 congruent), which is why the
  // set is exactly {sign : sign ≡ bearer (mod 5)} for the chosen phase.
  // ==========================================================================
  const YEAR_BEARERS = new Set([2, 7, 12, 17]) // Ik', Manik', Chuwen, Kab'an
  if (YEAR_BEARERS.has(p1Sign) && YEAR_BEARERS.has(p2Sign)) {
    connections.push({
      type: 'year-bearer',
      description: 'Both Year Bearers - Each opens a year of the count',
      descriptionHebrew: 'שניהם נושאי שנה - כל אחד פותח שנה בספירה',
    })
    score += 12
  }

  // ==========================================================================
  // LORDS OF THE NIGHT — the 9-day cycle (G1-G9), attested throughout the
  // Classic inscriptions and dropped entirely by Dreamspell. Derived from the
  // position in the 260-count, so it needs the kin, not the day sign alone.
  // ==========================================================================
  const nightLord = (sign: number, tone: number): number => {
    // Position in the 260-count from (sign, tone) by CRT, then mod 9.
    let pos = 1
    for (let k = 1; k <= 260; k++) {
      if (((k - 1) % 20) + 1 === sign && ((k - 1) % 13) + 1 === tone) {
        pos = k
        break
      }
    }
    return ((pos - 1) % 9) + 1
  }
  if (nightLord(p1Sign, p1.tone) === nightLord(p2Sign, p2.tone)) {
    connections.push({
      type: 'same-night-lord',
      description: 'Same Lord of the Night - The same of the nine night powers',
      descriptionHebrew: 'אותו אדון לילה - אותו כוח מתשעת כוחות הלילה',
    })
    score += 8
  }

  score = Math.min(100, score)

  return {
    person1Sign: p1Sign,
    person1Tone: p1.tone,
    person2Sign: p2Sign,
    person2Tone: p2.tone,
    score,
    connections,
  }
}

// ============================================================================
// COMBINED COMPATIBILITY
// ============================================================================

export interface CombinedCompatibility {
  dreamspell: DreamspellCompatibility
  tzolkin: TzolkinCompatibility
  overallScore: number
  summary: {
    english: string
    hebrew: string
  }
}

export function calculateCombinedCompatibility(
  person1BirthDate: string,
  person2BirthDate: string
): CombinedCompatibility {
  const dreamspell = calculateDreamspellCompatibility(person1BirthDate, person2BirthDate)
  const tzolkin = calculateTzolkinCompatibility(person1BirthDate, person2BirthDate)

  // Weighted average: Dreamspell 60%, Tzolkin 40%
  const overallScore = Math.round(dreamspell.score * 0.6 + tzolkin.score * 0.4)

  // Generate summary based on connection count and types
  const totalConnections = dreamspell.connections.length + tzolkin.connections.length

  let summaryEn: string
  let summaryHe: string

  if (overallScore >= 80) {
    summaryEn = 'Strong energetic resonance with multiple harmonious connections.'
    summaryHe = 'תהודה אנרגטית חזקה עם קשרים הרמוניים מרובים.'
  } else if (overallScore >= 60) {
    summaryEn = 'Good compatibility with supportive energy exchange.'
    summaryHe = 'תאימות טובה עם חילופי אנרגיה תומכים.'
  } else if (overallScore >= 40) {
    summaryEn = 'Moderate connection with growth potential.'
    summaryHe = 'חיבור בינוני עם פוטנציאל צמיחה.'
  } else {
    summaryEn = 'Different energy signatures - opportunity for learning.'
    summaryHe = 'חתימות אנרגטיות שונות - הזדמנות ללמידה.'
  }

  if (totalConnections === 0) {
    summaryEn = 'Distinct energy patterns - complementary perspectives possible.'
    summaryHe = 'דפוסי אנרגיה שונים - פרספקטיבות משלימות אפשריות.'
  }

  return {
    dreamspell,
    tzolkin,
    overallScore,
    summary: {
      english: summaryEn,
      hebrew: summaryHe,
    },
  }
}

// ============================================================================
// HARMONY SCORING
// ============================================================================

export function getHarmonyLabel(harmony: HarmonyType): { english: string; hebrew: string } {
  const labels: Record<HarmonyType, { english: string; hebrew: string }> = {
    supportive: { english: 'Supportive', hebrew: 'תומך' },
    challenging: { english: 'Challenging', hebrew: 'מאתגר' },
    transformative: { english: 'Transformative', hebrew: 'טרנספורמטיבי' },
    neutral: { english: 'Neutral', hebrew: 'ניטרלי' },
  }
  return labels[harmony]
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E' // green-500
  if (score >= 60) return '#84CC16' // lime-500
  if (score >= 40) return '#F59E0B' // amber-500
  if (score >= 20) return '#F97316' // orange-500
  return '#EF4444' // red-500
}

// ============================================================================
// FIVE-SYSTEM FUSION
// Combines Dreamspell, Tzolkin, Astrology (synastry), Human Design, and
// Gematria into one weighted score. Each system contributes only when its
// required inputs are present; weights redistribute over the available systems
// so a person with only a birth date still gets a meaningful blend, while one
// with full birth data (time + place + Hebrew name) gets all five.
// ============================================================================

export type CompatSystem =
  | 'dreamspell'
  | 'tzolkin'
  | 'astrology'
  | 'humanDesign'
  | 'gematria'

export interface PersonCompatInput {
  birthDate: string
  birthTime?: string | null
  birthPlace?: { lat?: number | null; lng?: number | null } | null
  hebrewName?: string | null
  name?: string | null
}

export interface SystemScore {
  score: number
  available: boolean
  /** Effective normalized weight applied to the overall score (0 if absent). */
  weight: number
}

export interface FiveSystemCompatibility {
  systems: Record<CompatSystem, SystemScore>
  overallScore: number
  availableSystems: CompatSystem[]
  dreamspellDetail: DreamspellCompatibility
  tzolkinDetail: TzolkinCompatibility
  synastryDetail: SynastryCompatibility | null
  hdDetail: HDCompatibility | null
  /** Gematria's only sanctioned pair relation: do the two names carry the same value? */
  nameMatch: NameValueMatch | null
  summary: { english: string; hebrew: string }
}

/**
 * Base weights when every system is available; normalized over what's present.
 *
 * Gematria carries weight ZERO and never enters the fusion. See the note on
 * `nameValueMatch` below, and docs/redesign/CONNECTION_ATLAS.md §6: Hebrew
 * gematria has no traditional person-to-person compatibility doctrine, so any
 * number we fused in was invented. The four remaining weights are renormalized
 * over what is actually available.
 */
const BASE_WEIGHTS: Record<CompatSystem, number> = {
  dreamspell: 0.25,
  tzolkin: 0.20,
  astrology: 0.27,
  humanDesign: 0.28,
  gematria: 0,
}

/** The one thing gematria may say about two names. */
export interface NameValueMatch {
  readonly value1: number
  readonly value2: number
  /** True only when the two standard values are exactly equal. */
  readonly exact: boolean
}

/**
 * The ONLY relation Hebrew gematria traditionally sanctions between two names:
 * their standard values are EQUAL.
 *
 * This replaces a graded 0-100 "name resonance" score that fired on 100% of
 * pairs (it had a floor of 30) and was built from operations with no basis in
 * the tradition whatsoever — the DIFFERENCE between two values, a shared
 * digital root, and a magnitude-closeness term. Those are early-20th-century
 * Western name numerology with a Hebrew alphabet swapped in, not gematria.
 *
 * Even an exact match is a weak claim: the sources are explicit that equal
 * value alone establishes nothing unless a conceptual link is already known
 * independently. So we surface it and we do NOT score it.
 *
 * Returns null when either Hebrew name is missing.
 */
export function nameValueMatch(
  hebrewName1?: string | null,
  hebrewName2?: string | null
): NameValueMatch | null {
  if (!hebrewName1?.trim() || !hebrewName2?.trim()) return null
  const cmp = compareNames(hebrewName1, hebrewName2)
  return {
    value1: cmp.value1,
    value2: cmp.value2,
    exact: cmp.value1 === cmp.value2,
  }
}

function lat(p: PersonCompatInput): number | null {
  return p.birthPlace?.lat ?? null
}
function lng(p: PersonCompatInput): number | null {
  return p.birthPlace?.lng ?? null
}

function fusionSummary(score: number, available: number): { english: string; hebrew: string } {
  if (available <= 2) {
    return score >= 65
      ? { english: 'Resonant on the systems available; add birth time, place and Hebrew names for the full picture.', hebrew: 'תהודה במערכות הזמינות; הוסיפו שעת לידה, מקום ושמות עבריים לתמונה המלאה.' }
      : { english: 'Distinct signatures on the systems available; more birth data would sharpen the reading.', hebrew: 'חתימות שונות במערכות הזמינות; נתוני לידה נוספים יחדדו את הקריאה.' }
  }
  if (score >= 80) return { english: 'Strong multi-system resonance across mind, energy, and name.', hebrew: 'תהודה רב-מערכתית חזקה בין תודעה, אנרגיה ושם.' }
  if (score >= 60) return { english: 'Good overall compatibility with several reinforcing systems.', hebrew: 'תאימות כללית טובה עם מספר מערכות מחזקות.' }
  if (score >= 40) return { english: 'Mixed compatibility: some systems harmonize, others invite growth.', hebrew: 'תאימות מעורבת: חלק מהמערכות מתואמות, אחרות מזמינות צמיחה.' }
  return { english: 'Contrasting signatures across systems, a relationship of complementary differences.', hebrew: 'חתימות מנוגדות בין המערכות, קשר של הבדלים משלימים.' }
}

/**
 * Combine all five systems into one weighted compatibility result.
 * Dreamspell + Tzolkin always contribute (birth date only). Astrology joins
 * with birth dates (planet positions), Human Design needs both birth times +
 * places, Gematria needs both Hebrew names.
 */
export function calculateFiveSystemCompatibility(
  p1: PersonCompatInput,
  p2: PersonCompatInput
): FiveSystemCompatibility {
  const dreamspellDetail = calculateDreamspellCompatibility(p1.birthDate, p2.birthDate)
  const tzolkinDetail = calculateTzolkinCompatibility(p1.birthDate, p2.birthDate)

  const synastryDetail = calculateSynastryCompatibility(
    { birthDate: p1.birthDate, birthTime: p1.birthTime, latitude: lat(p1), longitude: lng(p1) },
    { birthDate: p2.birthDate, birthTime: p2.birthTime, latitude: lat(p2), longitude: lng(p2) }
  )

  const hdDetail = calculateHDCompatibility(
    { birthDate: p1.birthDate, birthTime: p1.birthTime, latitude: lat(p1), longitude: lng(p1) },
    { birthDate: p2.birthDate, birthTime: p2.birthTime, latitude: lat(p2), longitude: lng(p2) }
  )

  const nameMatch = nameValueMatch(p1.hebrewName, p2.hebrewName)

  const raw: Record<CompatSystem, { score: number; available: boolean }> = {
    dreamspell: { score: dreamspellDetail.score, available: true },
    tzolkin: { score: tzolkinDetail.score, available: true },
    astrology: { score: synastryDetail.score, available: synastryDetail.available },
    humanDesign: { score: hdDetail.score, available: hdDetail.available },
    // Never available as a *score*. Gematria has no compatibility doctrine to
    // score with; it contributes `nameMatch` and nothing else.
    gematria: { score: 0, available: false },
  }

  const present = (Object.keys(raw) as CompatSystem[]).filter((k) => raw[k].available)
  const weightSum = present.reduce((sum, k) => sum + BASE_WEIGHTS[k], 0) || 1

  const systems = {} as Record<CompatSystem, SystemScore>
  let overall = 0
  for (const key of Object.keys(raw) as CompatSystem[]) {
    const available = raw[key].available
    const weight = available ? BASE_WEIGHTS[key] / weightSum : 0
    systems[key] = { score: raw[key].score, available, weight }
    overall += raw[key].score * weight
  }

  const overallScore = Math.round(overall)

  return {
    systems,
    overallScore,
    availableSystems: present,
    dreamspellDetail,
    tzolkinDetail,
    synastryDetail: synastryDetail.available ? synastryDetail : null,
    hdDetail: hdDetail.available ? hdDetail : null,
    nameMatch,
    summary: fusionSummary(overallScore, present.length),
  }
}
