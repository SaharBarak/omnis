import type { BirthPlace, SystemKey } from '@pleiad/api-client'
import { calculateNatalChart, calculateSunSignChart } from '@pleiad/engine/calculations/astrology'
import { getColorFamily, getEarthFamily, kinToCastle } from '@pleiad/engine/calculations/cycles'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateGematria } from '@pleiad/engine/calculations/gematria'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import { getLongCountData } from '@pleiad/engine/calculations/long-count'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { dateToTzolkin } from '@pleiad/engine/calculations/tzolkin'
import { kinToWavespell } from '@pleiad/engine/calculations/wavespell'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import type { Bodygraph } from '@pleiad/engine/types/human-design'
import type { Seal } from '@pleiad/engine/types/seal'
import type { Tone } from '@pleiad/engine/types/tone'
import type { TzolkinDaySign } from '@pleiad/engine/types/tzolkin'

import { api } from '@/lib/api'

/**
 * On-device computed-results write-behind — F3. Mirrors the web's
 * src/lib/hooks/use-computed-results.ts EXACTLY (system keys, versions and
 * data shapes) so rows written from mobile and web are interchangeable.
 * Change that hook first; transcribe here second.
 */

// Version constants — MUST match the web hook.
export const SYSTEM_VERSIONS: Record<SystemKey, string> = {
  dreamspell: '1.1.0', // includes wavespell and castle
  tzolkin: '1.0.0',
  longcount: '1.0.0',
  astrology: '1.0.0',
  humandesign: '2.0.0', // wheel re-anchored to 302deg, exact 88deg design arc, true node
  gematria: '1.0.0',
}

// ---------------------------------------------------------------------------
// Stored data shapes (identical to the web hook's exported interfaces)
// ---------------------------------------------------------------------------

export interface DreamspellComputedData {
  kin: number
  seal: number
  tone: number
  sealData: Seal
  toneData: Tone
  oracle: {
    guide: number
    analog: number
    antipode: number
    occult: number
  }
  wavespell: {
    number: number
    sealNumber: number
    startKin: number
    endKin: number
    currentPosition: number
  }
  castle: {
    number: number
    color: string
  }
  earthFamily: string
  colorFamily: string
}

export interface TzolkinComputedData {
  tone: number
  daySign: TzolkinDaySign
}

export interface LongCountComputedData {
  longCount: {
    baktun: number
    katun: number
    tun: number
    winal: number
    kin: number
  }
  daysSinceCreation: number
  haab: {
    month: number
    day: number
    monthName: string
    monthNameHebrew: string
  }
}

export interface AstrologyComputedData {
  hasBirthTime: boolean
  sunSign: string
  moonSign: string | null
  risingSign: string | null
  summary: {
    sunSignHebrew: string
    moonSignHebrew: string | null
    risingSignHebrew: string | null
    dominantElement: string
    dominantModality: string
  }
}

export interface HumanDesignComputedData {
  hasBirthTime: boolean
  type: string
  typeHebrew: string
  strategy: string
  strategyHebrew: string
  authority: string
  authorityHebrew: string
  profile: string | null
  profileHebrew: string | null
  definedCenters: string[]
  undefinedCenters: string[]
}

export interface GematriaComputedData {
  text: string
  standardValue: number
  fullValue: number
  smallValue: number
  ordinalValue: number
  digitalRoot: number
  letterCount: number
}

// ---------------------------------------------------------------------------
// Pure computations (transcribed from the web hook)
// ---------------------------------------------------------------------------

// Default coordinates when no birth place is known — matches the web hook.
const DEFAULT_LAT = 32.0853 // Tel Aviv
const DEFAULT_LNG = 34.7818

export function computeDreamspell(birthDate: string): DreamspellComputedData {
  const kin = dateToKin(birthDate)
  const sealNumber = kinToSeal(kin)
  const toneNumber = kinToTone(kin)
  const seal = getSeal(sealNumber)
  const tone = getTone(toneNumber)
  const oracle = calculateOracle(kin)
  const wavespell = kinToWavespell(kin)
  const castle = kinToCastle(kin)
  const earthFamily = getEarthFamily(sealNumber)
  const colorFamily = getColorFamily(sealNumber)

  return {
    kin,
    seal: sealNumber,
    tone: toneNumber,
    sealData: seal,
    toneData: tone,
    oracle: {
      guide: oracle.guide,
      analog: oracle.analog,
      antipode: oracle.antipode,
      occult: oracle.occult,
    },
    wavespell: {
      number: wavespell.number,
      sealNumber: wavespell.sealNumber,
      startKin: wavespell.startKin,
      endKin: wavespell.endKin,
      currentPosition: toneNumber,
    },
    castle: {
      number: castle.number,
      color: castle.color,
    },
    earthFamily: earthFamily.name,
    colorFamily: colorFamily.color,
  }
}

export function computeTzolkin(birthDate: string): TzolkinComputedData {
  const tzolkinDay = dateToTzolkin(birthDate)
  return {
    tone: tzolkinDay.tone,
    daySign: tzolkinDay.daySign,
  }
}

export function computeLongCount(birthDate: string): LongCountComputedData {
  const data = getLongCountData(birthDate)
  return {
    longCount: {
      baktun: data.longCount.baktun,
      katun: data.longCount.katun,
      tun: data.longCount.tun,
      winal: data.longCount.winal,
      kin: data.longCount.kin,
    },
    daysSinceCreation: data.daysSinceCreation,
    haab: {
      month: data.haab.month,
      day: data.haab.day,
      monthName: data.haab.monthName,
      monthNameHebrew: data.haab.monthNameHebrew,
    },
  }
}

function findDominant(balance: Readonly<Record<string, number>>): string {
  let maxKey = 'unknown'
  let maxValue = 0
  for (const [key, value] of Object.entries(balance)) {
    if (value > maxValue) {
      maxKey = key
      maxValue = value
    }
  }
  return maxKey
}

export function computeAstrology(
  birthDate: string,
  birthTime?: string | null,
  birthPlace?: { lat: number; lng: number } | null
): AstrologyComputedData {
  const lat = birthPlace?.lat ?? DEFAULT_LAT
  const lng = birthPlace?.lng ?? DEFAULT_LNG

  if (birthTime) {
    const chart = calculateNatalChart({
      date: birthDate,
      time: birthTime,
      latitude: lat,
      longitude: lng,
    })

    return {
      hasBirthTime: true,
      sunSign: chart.sunSign.id,
      moonSign: chart.moonSign.id,
      risingSign: chart.risingSign?.id || null,
      summary: {
        sunSignHebrew: chart.sunSign.hebrew,
        moonSignHebrew: chart.moonSign.hebrew,
        risingSignHebrew: chart.risingSign?.hebrew || null,
        dominantElement: findDominant(chart.elementBalance),
        dominantModality: findDominant(chart.modalityBalance),
      },
    }
  }

  const chart = calculateSunSignChart(birthDate, lat, lng)
  const moonPosition = chart.planets.find((p) => p.planet.id === 'moon')

  return {
    hasBirthTime: false,
    sunSign: chart.sunSign.id,
    moonSign: moonPosition?.sign.id || null,
    risingSign: null,
    summary: {
      sunSignHebrew: chart.sunSign.hebrew,
      moonSignHebrew: moonPosition?.sign.hebrew || null,
      risingSignHebrew: null,
      dominantElement: 'unknown',
      dominantModality: 'unknown',
    },
  }
}

export function computeHumanDesign(
  birthDate: string,
  birthTime?: string | null,
  birthPlace?: { lat: number; lng: number } | null
): HumanDesignComputedData | null {
  const lat = birthPlace?.lat ?? DEFAULT_LAT
  const lng = birthPlace?.lng ?? DEFAULT_LNG

  try {
    const result = calculateBodygraph({
      birthDate,
      birthTime: birthTime || null,
      latitude: lat,
      longitude: lng,
    })

    if (!result.hasBirthTime) {
      return {
        hasBirthTime: false,
        type: 'Unknown',
        typeHebrew: 'לא ידוע',
        strategy: 'Unknown',
        strategyHebrew: 'לא ידוע',
        authority: 'Unknown',
        authorityHebrew: 'לא ידוע',
        profile: null,
        profileHebrew: null,
        definedCenters: [],
        undefinedCenters: [],
      }
    }

    const bodygraph = result as Bodygraph

    return {
      hasBirthTime: true,
      type: bodygraph.typeDefinition.name,
      typeHebrew: bodygraph.typeDefinition.nameHebrew,
      strategy: bodygraph.typeDefinition.strategy,
      strategyHebrew: bodygraph.typeDefinition.strategyHebrew,
      authority: bodygraph.authorityDefinition.name,
      authorityHebrew: bodygraph.authorityDefinition.nameHebrew,
      profile: bodygraph.profile.name,
      profileHebrew: bodygraph.profile.nameHebrew,
      definedCenters: [...bodygraph.definedCenters],
      undefinedCenters: [...bodygraph.undefinedCenters],
    }
  } catch {
    // Silent — humandesign row is simply absent; reconciled on next compute.
    return null
  }
}

export function computeGematria(hebrewName: string): GematriaComputedData | null {
  if (hebrewName.trim().length === 0) return null

  try {
    const analysis = calculateGematria(hebrewName)
    return {
      text: hebrewName,
      standardValue: analysis.methods.standard.value,
      fullValue: analysis.methods.full.value,
      smallValue: analysis.methods.small.value,
      ordinalValue: analysis.methods.ordinal.value,
      digitalRoot: analysis.methods.standard.digitalRoot,
      letterCount: analysis.letterCount,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// computeAllSystems + fire-and-forget write-behind
// ---------------------------------------------------------------------------

/** Person-shaped source — a `Person` (or draft with the same fields) fits. */
export interface ComputeSource {
  birth_date: string
  birth_time?: string | null
  birth_place?: BirthPlace
  hebrew_name?: string | null
}

export interface SystemComputation {
  system: SystemKey
  version: string
  data: Record<string, unknown>
}

function toLatLng(place: BirthPlace | undefined): { lat: number; lng: number } | null {
  if (place == null) return null
  const { lat, lng } = place
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null
}

/** Compute every system row the web would store for this person. */
export function computeAllSystems(source: ComputeSource): SystemComputation[] {
  const birthDate = source.birth_date
  const birthTime = source.birth_time ?? null
  const latLng = toLatLng(source.birth_place)
  const hebrewName = source.hebrew_name ?? null

  const entries: Array<[SystemKey, Record<string, unknown> | null]> = [
    ['dreamspell', computeDreamspell(birthDate) as unknown as Record<string, unknown>],
    ['tzolkin', computeTzolkin(birthDate) as unknown as Record<string, unknown>],
    ['longcount', computeLongCount(birthDate) as unknown as Record<string, unknown>],
    [
      'astrology',
      computeAstrology(birthDate, birthTime, latLng) as unknown as Record<string, unknown>,
    ],
    [
      'humandesign',
      computeHumanDesign(birthDate, birthTime, latLng) as unknown as Record<
        string,
        unknown
      > | null,
    ],
    [
      'gematria',
      hebrewName
        ? (computeGematria(hebrewName) as unknown as Record<string, unknown> | null)
        : null,
    ],
  ]

  return entries.flatMap(([system, data]) =>
    data !== null ? [{ system, version: SYSTEM_VERSIONS[system], data }] : []
  )
}

// Two retries after the first attempt; failures stay silent — the person
// detail screen recomputes and re-upserts stale/missing rows later (F4).
const RETRY_DELAYS_MS = [400, 1600] as const

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function upsertOne(personId: string, computation: SystemComputation): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await api.computedResults.upsert({
        personId,
        system: computation.system,
        version: computation.version,
        data: computation.data,
        computed_at: new Date().toISOString(),
      })
      return
    } catch {
      const wait = RETRY_DELAYS_MS[attempt]
      if (wait === undefined) return
      await delay(wait)
    }
  }
}

/**
 * Fire-and-forget: compute all systems on-device and upsert each row.
 * Never throws, never blocks the save path.
 */
export function writeBehindComputedResults(personId: string, source: ComputeSource): void {
  let computations: SystemComputation[]
  try {
    computations = computeAllSystems(source)
  } catch {
    return // bad input — the server reading path recomputes later
  }
  for (const computation of computations) {
    void upsertOne(personId, computation)
  }
}
