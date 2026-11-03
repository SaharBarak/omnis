'use client'

import { useCallback } from 'react'

// Dreamspell imports
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { kinToWavespell } from '@pleiad/engine/calculations/wavespell'
import { kinToCastle, getEarthFamily, getColorFamily } from '@pleiad/engine/calculations/cycles'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'

// Tzolkin imports
import { dateToTzolkin } from '@pleiad/engine/calculations/tzolkin'

// Long Count imports
import { getLongCountData } from '@pleiad/engine/calculations/long-count'

// Gematria imports
import { calculateGematria } from '@pleiad/engine/calculations/gematria'

// Type imports
import type { Seal } from '@pleiad/engine/types/seal'
import type { Tone } from '@pleiad/engine/types/tone'
import type { TzolkinDaySign } from '@pleiad/engine/types/tzolkin'
import { fetchJson } from '@/lib/http/json'
import { lazyModule } from '@/lib/lazy-module'

/** Astrology and Human Design sit on ephemeris packages: loaded on the first compute, not with the page. */
const loadHeavySystems = lazyModule(() => import('./computed-heavy'))

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
const HUMANDESIGN_VERSION = '2.0.0' // wheel re-anchored to 302deg, exact 88deg design arc, true node
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

  // Compute Astrology data for a birth date (loads the astrology engine on first use)
  const computeAstrology = useCallback(async (
    birthDate: string,
    birthTime?: string | null,
    birthPlace?: { lat: number; lng: number } | null
  ): Promise<AstrologyComputedData> => (await loadHeavySystems()).astrologyData(birthDate, birthTime, birthPlace), [])

  // Compute Human Design data (loads the Human Design engine on first use)
  const computeHumanDesign = useCallback(async (
    birthDate: string,
    birthTime?: string | null,
    birthPlace?: { lat: number; lng: number } | null
  ): Promise<HumanDesignComputedData | null> => (await loadHeavySystems()).humanDesignData(birthDate, birthTime, birthPlace), [])

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
    const [astrologyData, humandesignData] = await Promise.all([
      computeAstrology(birthDate, birthTime, birthPlace),
      computeHumanDesign(birthDate, birthTime, birthPlace),
    ])
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
  const computeImmediate = useCallback(async (params: ComputeParams): Promise<ComputedResultsForPerson> => {
    const { birthDate, birthTime, birthPlace, hebrewName } = params
    const [astrology, humandesign] = await Promise.all([
      computeAstrology(birthDate, birthTime, birthPlace),
      computeHumanDesign(birthDate, birthTime, birthPlace),
    ])
    return {
      dreamspell: computeDreamspell(birthDate),
      tzolkin: computeTzolkin(birthDate),
      longcount: computeLongCount(birthDate),
      astrology,
      humandesign,
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
