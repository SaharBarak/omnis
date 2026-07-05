'use client'

import { useCallback } from 'react'

// Dreamspell imports
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { kinToWavespell } from '@/lib/calculations/wavespell'
import { kinToCastle, getEarthFamily, getColorFamily } from '@/lib/calculations/cycles'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'

// Tzolkin imports
import { dateToTzolkin } from '@/lib/calculations/tzolkin'

// Long Count imports
import { getLongCountData } from '@/lib/calculations/long-count'

// Astrology imports
import { calculateNatalChart, calculateSunSignChart } from '@/lib/calculations/astrology'

// Human Design imports
import { calculateBodygraph } from '@/lib/calculations/human-design'

// Gematria imports
import { calculateGematria } from '@/lib/calculations/gematria'

// Type imports
import type { Seal } from '@/lib/types/seal'
import type { Tone } from '@/lib/types/tone'
import type { TzolkinDaySign } from '@/lib/types/tzolkin'
import type { Bodygraph } from '@/lib/types/human-design'

// Client-facing shape mirrors the original Supabase computed_results row
// contract (nullable, never undefined) so existing consumers keep type-checking.
// The server serializer guarantees these shapes at runtime.
export type SystemType =
  | 'dreamspell'
  | 'tzolkin'
  | 'longcount'
  | 'humandesign'
  | 'astrology'
  | 'gematria'

export interface ComputedResult {
  id: string
  person_id: string
  system: SystemType
  version: string
  data: Record<string, unknown>
  computed_at: string
}

// Version constants for algorithm tracking
const DREAMSPELL_VERSION = '1.1.0' // Upgraded to include wavespell and castle
const TZOLKIN_VERSION = '1.0.0'
const LONGCOUNT_VERSION = '1.0.0'
const ASTROLOGY_VERSION = '1.0.0'
const HUMANDESIGN_VERSION = '1.0.0'
const GEMATRIA_VERSION = '1.0.0'

// Types for stored computed data
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

export interface ComputedResultsForPerson {
  dreamspell: DreamspellComputedData | null
  tzolkin: TzolkinComputedData | null
  longcount: LongCountComputedData | null
  astrology: AstrologyComputedData | null
  humandesign: HumanDesignComputedData | null
  gematria: GematriaComputedData | null
}

// Input parameters for computing all systems
export interface ComputeParams {
  birthDate: string
  birthTime?: string | null
  birthPlace?: { lat: number; lng: number } | null
  hebrewName?: string | null
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useComputedResults() {
  // Compute Dreamspell data for a birth date
  const computeDreamspell = useCallback((birthDate: string): DreamspellComputedData => {
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
  }, [])

  // Compute Tzolkin data for a birth date
  const computeTzolkin = useCallback((birthDate: string): TzolkinComputedData => {
    const tzolkinDay = dateToTzolkin(birthDate)
    return {
      tone: tzolkinDay.tone,
      daySign: tzolkinDay.daySign,
    }
  }, [])

  // Compute Long Count data for a birth date
  const computeLongCount = useCallback((birthDate: string): LongCountComputedData => {
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
  }, [])

  // Helper to find dominant key in a balance record
  const findDominant = (balance: Readonly<Record<string, number>>): string => {
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

  // Compute Astrology data for a birth date
  const computeAstrology = useCallback((
    birthDate: string,
    birthTime?: string | null,
    birthPlace?: { lat: number; lng: number } | null
  ): AstrologyComputedData => {
    const hasBirthTime = !!birthTime
    const lat = birthPlace?.lat ?? 32.0853 // Default: Tel Aviv
    const lng = birthPlace?.lng ?? 34.7818

    // If we have birth time, calculate full chart
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

    // Without birth time, use sun sign chart
    const chart = calculateSunSignChart(birthDate, lat, lng)
    const moonPosition = chart.planets.find(p => p.planet.id === 'moon')

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
  }, [])

  // Compute Human Design data
  const computeHumanDesign = useCallback((
    birthDate: string,
    birthTime?: string | null,
    birthPlace?: { lat: number; lng: number } | null
  ): HumanDesignComputedData | null => {
    const lat = birthPlace?.lat ?? 32.0853
    const lng = birthPlace?.lng ?? 34.7818

    try {
      const result = calculateBodygraph({
        birthDate,
        birthTime: birthTime || null,
        latitude: lat,
        longitude: lng,
      })

      // Check if we got a partial result (no birth time)
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

      // We have a complete bodygraph
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
    } catch (error) {
      console.error('Error computing Human Design:', error)
      return null
    }
  }, [])

  // Compute Gematria data for a Hebrew name
  const computeGematria = useCallback((hebrewName: string): GematriaComputedData | null => {
    if (!hebrewName || hebrewName.trim().length === 0) {
      return null
    }

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
    } catch (error) {
      console.error('Error computing Gematria:', error)
      return null
    }
  }, [])

  // Save computed result to database (via the computed-results API)
  const saveComputedResult = useCallback(async (
    personId: string,
    system: SystemType,
    version: string,
    data: unknown
  ): Promise<ComputedResult | null> => {
    if (data === null) return null

    try {
      const { result } = await fetchJson<{ result: ComputedResult }>(
        '/api/computed-results',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId,
            system,
            version,
            data: data as Record<string, unknown>,
            computed_at: new Date().toISOString(),
          }),
        }
      )
      return result
    } catch (error) {
      console.error(`Error saving ${system} computed result:`, error)
      return null
    }
  }, [])

  // Get stored computed results for a person (via the computed-results API)
  const getStoredResults = useCallback(async (
    personId: string
  ): Promise<ComputedResult[]> => {
    try {
      const { results } = await fetchJson<{ results: ComputedResult[] }>(
        `/api/computed-results?personId=${encodeURIComponent(personId)}`
      )
      return results || []
    } catch (error) {
      console.error('Error fetching computed results:', error)
      return []
    }
  }, [])

  // Compute and store all systems for a person
  const computeAndStore = useCallback(async (
    personId: string,
    params: ComputeParams
  ): Promise<ComputedResultsForPerson> => {
    const { birthDate, birthTime, birthPlace, hebrewName } = params

    const dreamspellData = computeDreamspell(birthDate)
    const tzolkinData = computeTzolkin(birthDate)
    const longcountData = computeLongCount(birthDate)
    const astrologyData = computeAstrology(birthDate, birthTime, birthPlace)
    const humandesignData = computeHumanDesign(birthDate, birthTime, birthPlace)
    const gematriaData = hebrewName ? computeGematria(hebrewName) : null

    await Promise.all([
      saveComputedResult(personId, 'dreamspell', DREAMSPELL_VERSION, dreamspellData),
      saveComputedResult(personId, 'tzolkin', TZOLKIN_VERSION, tzolkinData),
      saveComputedResult(personId, 'longcount', LONGCOUNT_VERSION, longcountData),
      saveComputedResult(personId, 'astrology', ASTROLOGY_VERSION, astrologyData),
      humandesignData ? saveComputedResult(personId, 'humandesign', HUMANDESIGN_VERSION, humandesignData) : Promise.resolve(null),
      gematriaData ? saveComputedResult(personId, 'gematria', GEMATRIA_VERSION, gematriaData) : Promise.resolve(null),
    ])

    return {
      dreamspell: dreamspellData,
      tzolkin: tzolkinData,
      longcount: longcountData,
      astrology: astrologyData,
      humandesign: humandesignData,
      gematria: gematriaData,
    }
  }, [
    computeDreamspell,
    computeTzolkin,
    computeLongCount,
    computeAstrology,
    computeHumanDesign,
    computeGematria,
    saveComputedResult,
  ])

  // Get or compute results for a person
  const getOrCompute = useCallback(async (
    personId: string,
    params: ComputeParams
  ): Promise<ComputedResultsForPerson> => {
    const storedResults = await getStoredResults(personId)

    const dreamspellResult = storedResults.find(
      r => r.system === 'dreamspell' && r.version === DREAMSPELL_VERSION
    )
    const tzolkinResult = storedResults.find(
      r => r.system === 'tzolkin' && r.version === TZOLKIN_VERSION
    )
    const longcountResult = storedResults.find(
      r => r.system === 'longcount' && r.version === LONGCOUNT_VERSION
    )
    const astrologyResult = storedResults.find(
      r => r.system === 'astrology' && r.version === ASTROLOGY_VERSION
    )
    const humandesignResult = storedResults.find(
      r => r.system === 'humandesign' && r.version === HUMANDESIGN_VERSION
    )
    const gematriaResult = storedResults.find(
      r => r.system === 'gematria' && r.version === GEMATRIA_VERSION
    )

    const hasAllBasic = dreamspellResult && tzolkinResult && longcountResult && astrologyResult
    if (hasAllBasic) {
      return {
        dreamspell: dreamspellResult.data as unknown as DreamspellComputedData,
        tzolkin: tzolkinResult.data as unknown as TzolkinComputedData,
        longcount: longcountResult.data as unknown as LongCountComputedData,
        astrology: astrologyResult.data as unknown as AstrologyComputedData,
        humandesign: humandesignResult?.data as unknown as HumanDesignComputedData | null,
        gematria: gematriaResult?.data as unknown as GematriaComputedData | null,
      }
    }

    return computeAndStore(personId, params)
  }, [getStoredResults, computeAndStore])

  // Delete computed results for a person (via the computed-results API)
  const deleteComputedResults = useCallback(async (personId: string): Promise<void> => {
    try {
      await fetchJson(
        `/api/computed-results?personId=${encodeURIComponent(personId)}`,
        { method: 'DELETE' }
      )
    } catch (error) {
      console.error('Error deleting computed results:', error)
    }
  }, [])

  // Invalidate results
  const invalidateResults = useCallback(async (personId: string): Promise<void> => {
    await deleteComputedResults(personId)
  }, [deleteComputedResults])

  // Compute results without storing (for immediate display)
  const computeImmediate = useCallback((params: ComputeParams): ComputedResultsForPerson => {
    const { birthDate, birthTime, birthPlace, hebrewName } = params
    return {
      dreamspell: computeDreamspell(birthDate),
      tzolkin: computeTzolkin(birthDate),
      longcount: computeLongCount(birthDate),
      astrology: computeAstrology(birthDate, birthTime, birthPlace),
      humandesign: computeHumanDesign(birthDate, birthTime, birthPlace),
      gematria: hebrewName ? computeGematria(hebrewName) : null,
    }
  }, [computeDreamspell, computeTzolkin, computeLongCount, computeAstrology, computeHumanDesign, computeGematria])

  return {
    // Core methods
    computeAndStore,
    getOrCompute,
    getStoredResults,
    invalidateResults,
    deleteComputedResults,

    // Pure computation (no storage)
    computeImmediate,
    computeDreamspell,
    computeTzolkin,
    computeLongCount,
    computeAstrology,
    computeHumanDesign,
    computeGematria,

    // Version info
    versions: {
      dreamspell: DREAMSPELL_VERSION,
      tzolkin: TZOLKIN_VERSION,
      longcount: LONGCOUNT_VERSION,
      astrology: ASTROLOGY_VERSION,
      humandesign: HUMANDESIGN_VERSION,
      gematria: GEMATRIA_VERSION,
    },
  }
}
