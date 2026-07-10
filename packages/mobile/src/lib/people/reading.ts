import type { BirthPlace } from '@pleiad/api-client'
import {
  calculateNatalChart,
  calculateSunSignChart,
} from '@pleiad/engine/calculations/astrology'
import {
  getColorFamily,
  getEarthFamily,
  kinToCastle,
  type Castle,
  type ColorFamily_Group,
  type EarthFamily,
} from '@pleiad/engine/calculations/cycles'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateGematria, digitalRoot } from '@pleiad/engine/calculations/gematria'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import { getLongCountData, type LongCountData } from '@pleiad/engine/calculations/long-count'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import {
  getWavespellPosition,
  kinToWavespell,
  type Wavespell,
} from '@pleiad/engine/calculations/wavespell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import type { NatalChart, ZodiacSign } from '@pleiad/engine/types/astrology'
import type { ColorFamily } from '@pleiad/engine/types/common'
import type { Oracle } from '@pleiad/engine/types/dreamspell'
import type { GematriaResult } from '@pleiad/engine/types/gematria'
import type { Bodygraph } from '@pleiad/engine/types/human-design'
import type { Seal } from '@pleiad/engine/types/seal'
import type { Tone } from '@pleiad/engine/types/tone'

/**
 * S8 reading layer — F4. Everything here is pure and synchronous: the person
 * detail screen renders straight from on-device engine calls (never the
 * computed-results API). Shapes extend the write-behind slices in compute.ts
 * with the display detail the pager needs (oracle kins, planets, channels,
 * letter breakdowns).
 */

// ---------------------------------------------------------------------------
// Per-system reading slices
// ---------------------------------------------------------------------------

export interface OracleMember {
  role: 'guide' | 'analog' | 'antipode' | 'occult' | 'destiny'
  kin: number
  seal: Seal
  tone: Tone
}

export interface GalacticBirthday {
  /** ISO date of the next kin recurrence (260-day cycle). */
  date: string
  /** 0 = today is the galactic birthday. */
  daysUntil: number
}

export interface DreamspellReading {
  kin: number
  seal: Seal
  tone: Tone
  oracle: Oracle
  oracleMembers: OracleMember[]
  wavespell: Wavespell
  wavespellSeal: Seal
  wavespellRole: string
  castle: Castle
  colorFamily: ColorFamily_Group
  earthFamily: EarthFamily
  galacticBirthday: GalacticBirthday
}

export type AstrologyReading =
  | { hasBirthTime: true; chart: NatalChart }
  | { hasBirthTime: false; sunSign: ZodiacSign }

/** Bodygraph when the hour is known; the honest partial state otherwise. */
export type HumanDesignReading =
  | { hasBirthTime: true; bodygraph: Bodygraph }
  | { hasBirthTime: false }

export interface PersonReading {
  dreamspell: DreamspellReading | null
  mayan: LongCountData | null
  astrology: AstrologyReading | null
  humanDesign: HumanDesignReading | null
  gematria: GematriaResult | null
}

export interface ReadingSource {
  birth_date: string
  birth_time?: string | null
  birth_place?: BirthPlace
  hebrew_name?: string | null
}

// Default coordinates when no birth place is known — matches compute.ts.
const DEFAULT_LAT = 32.0853 // Tel Aviv
const DEFAULT_LNG = 34.7818

const MS_PER_DAY = 86_400_000
const TZOLKIN_CYCLE = 260

/** Solve kin ≡ seal (mod 20) and kin ≡ tone (mod 13) over 1–260. */
export function kinFromSealTone(sealNumber: number, toneNumber: number): number {
  for (let kin = 1; kin <= TZOLKIN_CYCLE; kin += 1) {
    if (((kin - 1) % 20) + 1 === sealNumber && ((kin - 1) % 13) + 1 === toneNumber) {
      return kin
    }
  }
  return 1 // unreachable for valid seal/tone inputs
}

function utcMidnight(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getTime()
}

export function nextGalacticBirthday(birthDate: string, today = new Date()): GalacticBirthday {
  const birthMs = utcMidnight(birthDate)
  const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysSince = Math.max(0, Math.floor((todayMs - birthMs) / MS_PER_DAY))
  const remainder = daysSince % TZOLKIN_CYCLE
  const daysUntil = remainder === 0 ? 0 : TZOLKIN_CYCLE - remainder
  const next = new Date(birthMs + (daysSince + daysUntil) * MS_PER_DAY)
  return { date: next.toISOString().slice(0, 10), daysUntil }
}

function computeDreamspellReading(birthDate: string): DreamspellReading {
  const kin = dateToKin(birthDate)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = getSeal(sealNumber)
  const tone = getTone(toneNumber)
  const oracle = calculateOracle(kin)
  const wavespell = kinToWavespell(kin)
  const position = getWavespellPosition(kin)

  const member = (
    role: OracleMember['role'],
    memberSeal: number,
    memberTone: number
  ): OracleMember => ({
    role,
    kin: kinFromSealTone(memberSeal, memberTone),
    seal: getSeal(memberSeal as Parameters<typeof getSeal>[0]),
    tone: getTone(memberTone as Parameters<typeof getTone>[0]),
  })

  return {
    kin: Number(kin),
    seal,
    tone,
    oracle,
    oracleMembers: [
      member('guide', oracle.guide, toneNumber),
      member('antipode', oracle.antipode, toneNumber),
      member('destiny', sealNumber, toneNumber),
      member('analog', oracle.analog, toneNumber),
      member('occult', oracle.occult, oracle.occultTone),
    ],
    wavespell,
    wavespellSeal: getSeal(wavespell.sealNumber),
    wavespellRole: position.dayName,
    castle: kinToCastle(kin),
    colorFamily: getColorFamily(sealNumber),
    earthFamily: getEarthFamily(sealNumber),
    galacticBirthday: nextGalacticBirthday(birthDate),
  }
}

function toLatLng(place: BirthPlace | undefined): { lat: number; lng: number } {
  if (place != null && typeof place.lat === 'number' && typeof place.lng === 'number') {
    return { lat: place.lat, lng: place.lng }
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
}

function computeAstrologyReading(source: ReadingSource): AstrologyReading {
  const { lat, lng } = toLatLng(source.birth_place)
  const birthTime = source.birth_time ?? null

  if (birthTime !== null) {
    const chart = calculateNatalChart({
      date: source.birth_date,
      time: birthTime,
      latitude: lat,
      longitude: lng,
    })
    return { hasBirthTime: true, chart }
  }

  const chart = calculateSunSignChart(source.birth_date, lat, lng)
  return { hasBirthTime: false, sunSign: chart.sunSign }
}

function computeHumanDesignReading(source: ReadingSource): HumanDesignReading {
  const birthTime = source.birth_time ?? null
  if (birthTime === null) return { hasBirthTime: false }

  const { lat, lng } = toLatLng(source.birth_place)
  const result = calculateBodygraph({
    birthDate: source.birth_date,
    birthTime,
    latitude: lat,
    longitude: lng,
  })

  if (!result.hasBirthTime) return { hasBirthTime: false }
  return { hasBirthTime: true, bodygraph: result as Bodygraph }
}

/**
 * Compute the full six-page reading. Each system fails independently and
 * silently (null slice → the page renders its honest empty state).
 */
export function computeReading(source: ReadingSource): PersonReading {
  const safely = <T>(compute: () => T): T | null => {
    try {
      return compute()
    } catch {
      return null
    }
  }

  const hebrewName = source.hebrew_name?.trim() ?? ''

  return {
    dreamspell: safely(() => computeDreamspellReading(source.birth_date)),
    mayan: safely(() => getLongCountData(source.birth_date)),
    astrology: safely(() => computeAstrologyReading(source)),
    humanDesign: safely(() => computeHumanDesignReading(source)),
    gematria: hebrewName.length > 0 ? safely(() => calculateGematria(hebrewName)) : null,
  }
}

// ---------------------------------------------------------------------------
// Cross-system insights — only assertions derivable from the reading itself
// ---------------------------------------------------------------------------

export interface InsightLine {
  eyebrow: string
  body: string
}

const SEAL_COLOR_TO_ELEMENT: Record<ColorFamily, 'fire' | 'air' | 'water' | 'earth'> = {
  red: 'fire',
  white: 'air',
  blue: 'water',
  yellow: 'earth',
}

const DIGITAL_ROOT_MEANINGS: Record<number, string> = {
  1: 'unity and beginning',
  2: 'duality and partnership',
  3: 'creativity and expression',
  4: 'foundation and stability',
  5: 'change and freedom',
  6: 'harmony and balance',
  7: 'spirituality and wisdom',
  8: 'power and abundance',
  9: 'completion and mastery',
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toneTypeResonance(toneNumber: number, hdType: string): boolean {
  const type = hdType.toLowerCase()
  const initiating = [1, 5, 9].includes(toneNumber)
  const responding = [2, 6, 10].includes(toneNumber)
  const guiding = [3, 7, 11].includes(toneNumber)
  const reflecting = [4, 8, 12, 13].includes(toneNumber)
  if (initiating && (type.includes('manifestor') || type.includes('manifesting'))) return true
  if (responding && type.includes('generator')) return true
  if (guiding && type.includes('projector')) return true
  return reflecting && type.includes('reflector')
}

const MAX_INSIGHTS = 5

/** 3–5 honest cross-system lines; fewer when the chart is incomplete. */
export function buildInsights(reading: PersonReading): InsightLine[] {
  const lines: InsightLine[] = []
  const { dreamspell, astrology, humanDesign, gematria, mayan } = reading

  const sunSign =
    astrology === null ? null : astrology.hasBirthTime ? astrology.chart.sunSign : astrology.sunSign

  if (dreamspell !== null && sunSign !== null) {
    const sealElement = SEAL_COLOR_TO_ELEMENT[dreamspell.seal.color]
    if (sealElement === sunSign.element) {
      lines.push({
        eyebrow: 'ELEMENTAL ALIGNMENT',
        body: `The ${dreamspell.seal.color} seal and a ${sunSign.name} sun both carry ${sealElement} — two systems reading one element.`,
      })
    } else {
      lines.push({
        eyebrow: 'ELEMENT WEAVE',
        body: `Dreamspell reads ${dreamspell.seal.color} as ${sealElement}; the ${sunSign.name} sun answers with ${sunSign.element}. Two currents, not one.`,
      })
    }
  }

  if (dreamspell !== null && astrology !== null && astrology.hasBirthTime) {
    const balance = astrology.chart.elementBalance
    const dominant = (Object.keys(balance) as Array<keyof typeof balance>).reduce((a, b) =>
      balance[a] >= balance[b] ? a : b
    )
    const sealElement = SEAL_COLOR_TO_ELEMENT[dreamspell.seal.color]
    if (dominant === sealElement) {
      lines.push({
        eyebrow: 'DOMINANT ELEMENT',
        body: `The chart's strongest element, ${dominant}, matches the seal's color family — the whole sky leans the same way.`,
      })
    }
  }

  if (dreamspell !== null && humanDesign !== null && humanDesign.hasBirthTime) {
    const { typeDefinition } = humanDesign.bodygraph
    const resonant = toneTypeResonance(dreamspell.tone.number, typeDefinition.name)
    lines.push({
      eyebrow: 'TONE × TYPE',
      body: resonant
        ? `Tone ${dreamspell.tone.number} (${dreamspell.tone.name}) resonates with the ${typeDefinition.name} pattern — the same energy read twice.`
        : `Tone ${dreamspell.tone.number} (${dreamspell.tone.name}) moves through a ${typeDefinition.name} — strategy: ${typeDefinition.strategy.toLowerCase()}.`,
    })
  }

  if (dreamspell !== null && gematria !== null) {
    const nameRoot = gematria.methods.standard.digitalRoot
    const meaning = DIGITAL_ROOT_MEANINGS[nameRoot] ?? ''
    if (nameRoot === dreamspell.tone.number) {
      lines.push({
        eyebrow: 'SHARED NUMBER',
        body: `The name's digital root ${nameRoot} equals the galactic tone — ${titleCase(meaning)}.`,
      })
    } else if (nameRoot === digitalRoot(dreamspell.kin)) {
      lines.push({
        eyebrow: 'NUMERIC RESONANCE',
        body: `Name and Kin ${dreamspell.kin} share the digital root ${nameRoot}: ${meaning}.`,
      })
    }
  }

  if (mayan !== null && mayan.longCount.baktun === 13 && lines.length < MAX_INSIGHTS) {
    lines.push({
      eyebrow: 'LONG COUNT ERA',
      body: 'Born in the 13th Baktun — the Long Count places this life in an era of completion and transformation.',
    })
  }

  return lines.slice(0, MAX_INSIGHTS)
}
