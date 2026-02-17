'use client'

import { createClient } from '@/lib/supabase/client'
import { dateToKin, kinToSeal, kinToTone } from '@/lib/calculations/dreamspell'
import { calculateOracle } from '@/lib/calculations/oracle'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'

const supabase = createClient()

export interface PersonRecord {
  id: string
  name: string
  hebrew_name?: string
  birth_date?: string
  birth_time?: string
  is_self?: boolean
  [key: string]: unknown
}

export interface TodayData {
  kin: number
  sealName: string
  sealMayan: string
  sealColor: string
  toneName: string
  toneNumber: number
  toneKeywords: string
  oracleGuide: string
  oracleAnalog: string
  oracleAntipode: string
  oracleOccult: string
  wavespellSeal: string
  wavespellPosition: number
}

export async function fetchPeople(): Promise<PersonRecord[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('people')
    .select('*')
    .is('deleted_at', null)
    .order('name')
  return (data || []) as PersonRecord[]
}

export async function fetchSelfPerson(): Promise<PersonRecord | null> {
  const { data } = await supabase
    .from('people')
    .select('*')
    .eq('is_self', true)
    .is('deleted_at', null)
    .limit(1)
    .single()
  return data as PersonRecord | null
}

export async function fetchComputedResults(personId: string) {
  const { data } = await supabase
    .from('computed_results')
    .select('*')
    .eq('person_id', personId)

  const results: Record<string, unknown> = {
    dreamspell: null, tzolkin: null, longcount: null,
    astrology: null, humandesign: null, gematria: null,
  }

  for (const row of data || []) {
    const key = row.system_type as string
    if (key in results) {
      results[key] = row.result_data
    }
  }
  return results
}

export function fetchTodayData(): TodayData {
  const today = new Date().toISOString().slice(0, 10)
  const kin = dateToKin(today)
  const seal = getSeal(kinToSeal(kin))
  const tone = getTone(kinToTone(kin))
  const oracle = calculateOracle(kin)

  const guideSeal = getSeal(oracle.guide)
  const analogSeal = getSeal(oracle.analog)
  const antipodeSeal = getSeal(oracle.antipode)
  const occultSeal = getSeal(oracle.occult)

  // Wavespell position: tone number IS the position in wavespell
  const wavespellStartKin = kin - tone.number + 1
  const wavespellSealNum = kinToSeal(wavespellStartKin > 0 ? wavespellStartKin : wavespellStartKin + 260)
  const wavespellSeal = getSeal(wavespellSealNum)

  return {
    kin,
    sealName: seal.english,
    sealMayan: seal.mayan,
    sealColor: seal.color,
    toneName: tone.name,
    toneNumber: tone.number,
    toneKeywords: tone.keywords.join(', '),
    oracleGuide: guideSeal.english,
    oracleAnalog: analogSeal.english,
    oracleAntipode: antipodeSeal.english,
    oracleOccult: occultSeal.english,
    wavespellSeal: wavespellSeal.english,
    wavespellPosition: tone.number,
  }
}
