'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComputedResult, SystemType } from '@/lib/supabase/database.types'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { dateToTzolkin } from '@/lib/calculations/tzolkin'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import type { Seal } from '@/lib/types/seal'
import type { Tone } from '@/lib/types/tone'
import type { TzolkinDaySign } from '@/lib/types/tzolkin'

// Version constants for algorithm tracking
const DREAMSPELL_VERSION = '1.0.0'
const TZOLKIN_VERSION = '1.0.0'

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
}

export interface TzolkinComputedData {
  tone: number
  daySign: TzolkinDaySign
}

export interface ComputedResultsForPerson {
  dreamspell: DreamspellComputedData | null
  tzolkin: TzolkinComputedData | null
}

export function useComputedResults() {
  const supabase = createClient()

  // Compute Dreamspell data for a birth date
  const computeDreamspell = useCallback((birthDate: string): DreamspellComputedData => {
    const kin = dateToKin(birthDate)
    const sealNumber = kinToSeal(kin)
    const toneNumber = kinToTone(kin)
    const seal = getSeal(sealNumber)
    const tone = getTone(toneNumber)
    const oracle = calculateOracle(kin)

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

  // Save computed result to database
  const saveComputedResult = useCallback(async (
    personId: string,
    system: SystemType,
    version: string,
    data: DreamspellComputedData | TzolkinComputedData
  ): Promise<ComputedResult | null> => {
    const { data: result, error } = await supabase
      .from('computed_results')
      .upsert(
        {
          person_id: personId,
          system,
          version,
          data: data as unknown as Record<string, unknown>,
          computed_at: new Date().toISOString(),
        },
        {
          onConflict: 'person_id,system,version',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving computed result:', error)
      return null
    }

    return result
  }, [supabase])

  // Get stored computed results for a person
  const getStoredResults = useCallback(async (
    personId: string
  ): Promise<ComputedResult[]> => {
    const { data, error } = await supabase
      .from('computed_results')
      .select('*')
      .eq('person_id', personId)

    if (error) {
      console.error('Error fetching computed results:', error)
      return []
    }

    return data || []
  }, [supabase])

  // Compute and store all systems for a person
  const computeAndStore = useCallback(async (
    personId: string,
    birthDate: string
  ): Promise<ComputedResultsForPerson> => {
    const dreamspellData = computeDreamspell(birthDate)
    const tzolkinData = computeTzolkin(birthDate)

    // Save both to database in parallel
    await Promise.all([
      saveComputedResult(personId, 'dreamspell', DREAMSPELL_VERSION, dreamspellData),
      saveComputedResult(personId, 'tzolkin', TZOLKIN_VERSION, tzolkinData),
    ])

    return {
      dreamspell: dreamspellData,
      tzolkin: tzolkinData,
    }
  }, [computeDreamspell, computeTzolkin, saveComputedResult])

  // Get or compute results for a person
  const getOrCompute = useCallback(async (
    personId: string,
    birthDate: string
  ): Promise<ComputedResultsForPerson> => {
    // First try to get stored results
    const storedResults = await getStoredResults(personId)

    // Check for existing valid results
    const dreamspellResult = storedResults.find(
      r => r.system === 'dreamspell' && r.version === DREAMSPELL_VERSION
    )
    const tzolkinResult = storedResults.find(
      r => r.system === 'tzolkin' && r.version === TZOLKIN_VERSION
    )

    // If both exist, return them
    if (dreamspellResult && tzolkinResult) {
      return {
        dreamspell: dreamspellResult.data as unknown as DreamspellComputedData,
        tzolkin: tzolkinResult.data as unknown as TzolkinComputedData,
      }
    }

    // Otherwise compute and store
    return computeAndStore(personId, birthDate)
  }, [getStoredResults, computeAndStore])

  // Delete computed results for a person
  const deleteComputedResults = useCallback(async (personId: string): Promise<void> => {
    const { error } = await supabase
      .from('computed_results')
      .delete()
      .eq('person_id', personId)

    if (error) {
      console.error('Error deleting computed results:', error)
    }
  }, [supabase])

  // Invalidate results (delete them so they get recomputed next time)
  const invalidateResults = useCallback(async (personId: string): Promise<void> => {
    await deleteComputedResults(personId)
  }, [deleteComputedResults])

  // Compute results without storing (for immediate display)
  const computeImmediate = useCallback((birthDate: string): ComputedResultsForPerson => {
    return {
      dreamspell: computeDreamspell(birthDate),
      tzolkin: computeTzolkin(birthDate),
    }
  }, [computeDreamspell, computeTzolkin])

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

    // Version info
    versions: {
      dreamspell: DREAMSPELL_VERSION,
      tzolkin: TZOLKIN_VERSION,
    },
  }
}
