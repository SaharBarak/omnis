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

const CONNECTION_DESCRIPTIONS: Record<DreamspellConnection['type'], {
  description: string
  descriptionHebrew: string
  harmony: HarmonyType
  score: number
}> = {
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

  // Check if P2's seal is P1's analog
  const p1Analog = getAnalog(p1.seal)
  if (p2.seal === p1Analog) {
    const desc = CONNECTION_DESCRIPTIONS['analog']
    connections.push({
      type: 'analog',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // Check if P2's seal is P1's antipode
  const p1Antipode = getAntipode(p1.seal)
  if (p2.seal === p1Antipode) {
    const desc = CONNECTION_DESCRIPTIONS['antipode']
    connections.push({
      type: 'antipode',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // Check if P2's seal is P1's occult
  const p1Occult = getOccult(p1.seal)
  if (p2.seal === p1Occult) {
    const desc = CONNECTION_DESCRIPTIONS['occult']
    connections.push({
      type: 'occult',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
  }

  // Check if P2's seal is P1's guide (requires tone)
  const p1Guide = getGuide(p1.seal, p1.tone)
  if (p2.seal === p1Guide && p1.seal !== p2.seal) {
    const desc = CONNECTION_DESCRIPTIONS['guide']
    connections.push({
      type: 'guide',
      description: desc.description,
      descriptionHebrew: desc.descriptionHebrew,
      harmony: desc.harmony,
    })
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
    type: 'same-sign' | 'same-tone' | 'trecena-match'
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

  // Calculate trecena (13-day period) - both in same trecena if sign numbers align
  const p1Trecena = Math.floor((p1Sign - 1) / 13)
  const p2Trecena = Math.floor((p2Sign - 1) / 13)
  if (p1Trecena === p2Trecena && p1Sign !== p2Sign) {
    connections.push({
      type: 'trecena-match',
      description: 'Same Trecena - Shared 13-day cycle energy',
      descriptionHebrew: 'אותה טרסנה - אנרגיית מחזור 13-יום משותפת',
    })
    score += 10
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
  gematriaScore: number | null
  summary: { english: string; hebrew: string }
}

// Base weights when every system is available; normalized over what's present.
const BASE_WEIGHTS: Record<CompatSystem, number> = {
  dreamspell: 0.22,
  tzolkin: 0.18,
  astrology: 0.25,
  humanDesign: 0.25,
  gematria: 0.1,
}

/**
 * Gematria name resonance as a 0-100 score, derived from compareNames.
 * Returns null when either Hebrew name is missing/blank.
 */
export function gematriaCompatibilityScore(
  hebrewName1?: string | null,
  hebrewName2?: string | null
): number | null {
  if (!hebrewName1?.trim() || !hebrewName2?.trim()) return null
  const cmp = compareNames(hebrewName1, hebrewName2)

  let score = 30
  if (cmp.sharedDigitalRoot) score += 45
  // Closeness of the two standard values (resonance of magnitude).
  const maxVal = Math.max(cmp.value1, cmp.value2, 1)
  const closeness = 1 - Math.min(cmp.difference, maxVal) / maxVal
  score += Math.round(closeness * 25)

  return Math.max(0, Math.min(100, score))
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
  if (score >= 40) return { english: 'Mixed compatibility — some systems harmonize, others invite growth.', hebrew: 'תאימות מעורבת — חלק מהמערכות מתואמות, אחרות מזמינות צמיחה.' }
  return { english: 'Contrasting signatures across systems — a relationship of complementary differences.', hebrew: 'חתימות מנוגדות בין המערכות — קשר של הבדלים משלימים.' }
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

  const gematriaScore = gematriaCompatibilityScore(p1.hebrewName, p2.hebrewName)

  const raw: Record<CompatSystem, { score: number; available: boolean }> = {
    dreamspell: { score: dreamspellDetail.score, available: true },
    tzolkin: { score: tzolkinDetail.score, available: true },
    astrology: { score: synastryDetail.score, available: synastryDetail.available },
    humanDesign: { score: hdDetail.score, available: hdDetail.available },
    gematria: { score: gematriaScore ?? 0, available: gematriaScore !== null },
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
    gematriaScore,
    summary: fusionSummary(overallScore, present.length),
  }
}
