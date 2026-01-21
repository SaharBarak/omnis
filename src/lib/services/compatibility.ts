// Compatibility Calculations for Omnis Phase 2.4
// Calculates Dreamspell and Tzolkin compatibility between people

import type { Kin, SealNumber, ToneNumber } from '../../core/types'
import type { DreamspellCompatibility, DreamspellConnection, HarmonyType } from '../types/relationship'
import { dateToKin, kinToSeal, kinToTone } from '../calculations/dreamspell'
import { dateToTzolkin } from '../calculations/tzolkin'
import { getAnalog, getAntipode, getOccult, getGuide } from '../data/oracle-tables'
import { getSeal } from '../data/seals'

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
