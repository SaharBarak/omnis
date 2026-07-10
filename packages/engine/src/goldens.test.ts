import { describe, expect, it } from 'vitest'

import { calculateNatalChart, getSunSign } from './calculations/astrology'
import { dateToKin, kinToSeal, kinToTone } from './calculations/dreamspell'
import { calculateGematria } from './calculations/gematria'
import { calculateBodygraph } from './calculations/human-design'
import { dateToLongCount, formatLongCount } from './calculations/long-count'
import { calculateOracle } from './calculations/oracle'
import { dateToTzolkin } from './calculations/tzolkin'

/**
 * Golden parity vectors — specs/mobile/VERIFICATION.md §2.
 *
 * These pin the engines' outputs for fixed inputs so the mobile app (Hermes)
 * and the web app (node/browser) provably compute IDENTICAL readings. Any
 * diff here is a breaking engine change: bump the system version in
 * use-computed-results AND update these vectors deliberately — never make
 * them pass by loosening.
 *
 * Vectors cover: the Dreamspell epoch anchor, kin arithmetic anchors,
 * leap days (Dreamspell skips Feb 29 — "0.0 Hunab Ku"), month/era edges,
 * and pre-epoch dates. Snapshot files live next to this test; both runtimes
 * run the same assertions.
 */

const BIRTH_VECTORS = [
  '1987-07-26', // Dreamspell epoch anchor — Kin 34
  '1988-08-17',
  '1990-11-05',
  '1994-03-21',
  '1996-02-29', // leap day
  '2000-01-01', // century edge
  '2000-02-29',
  '2004-02-28',
  '2004-03-01',
  '2012-12-21', // Long Count 13.0.0.0.0
  '2026-01-08',
  '1969-07-20',
  '1955-02-24',
  '2025-07-26', // day out of time neighborhood
] as const

describe('golden vectors — dreamspell/tzolkin/long count', () => {
  it('pins explicit anchors', () => {
    expect(dateToKin('1987-07-26')).toBe(34) // Dreamspell epoch anchor
    expect(kinToTone(17 as never)).toBe(4) // Kin 17 = Self-Existing...
    expect(kinToSeal(17 as never)).toBe(17) // ...Earth
    expect(formatLongCount(dateToLongCount('2012-12-21'))).toBe('13.0.0.0.0')
  })

  it('matches committed snapshots for all birth vectors', () => {
    const table = BIRTH_VECTORS.map((date) => {
      const kin = dateToKin(date)
      return {
        date,
        kin,
        seal: kinToSeal(kin),
        tone: kinToTone(kin),
        oracle: calculateOracle(kin),
        tzolkin: dateToTzolkin(date),
        longCount: formatLongCount(dateToLongCount(date)),
      }
    })
    expect(table).toMatchSnapshot()
  })
})

describe('golden vectors — astrology', () => {
  it('sun signs are stable', () => {
    expect(BIRTH_VECTORS.map((d) => ({ d, sun: getSunSign(d).name }))).toMatchSnapshot()
  })

  it('full natal chart is stable (timed, placed)', () => {
    const chart = calculateNatalChart({
      date: '1988-08-17',
      time: '19:00',
      latitude: 32.794,
      longitude: 34.9896,
    })
    const compact = {
      sun: chart.planets.find((p) => p.planet.id === 'sun'),
      moon: chart.planets.find((p) => p.planet.id === 'moon'),
      ascendant: chart.ascendant,
      midheaven: chart.midheaven,
      houseCusps: (chart.houses ?? []).map((h) => h.cusp.formatted),
      aspectCount: chart.aspects.length,
    }
    expect(compact).toMatchSnapshot()
  })
})

describe('golden vectors — human design', () => {
  it('bodygraph is stable (timed, placed)', () => {
    const result = calculateBodygraph({
      birthDate: '1988-08-17',
      birthTime: '19:00',
      latitude: 32.794,
      longitude: 34.9896,
    })
    if (!('type' in result)) throw new Error('expected a full bodygraph')
    expect({
      type: result.type,
      authority: result.authority,
      profile: result.profile,
      definition: result.definition,
      definedCenters: result.definedCenters,
      channels: result.channels.map((c) => c.id),
      gates: result.gates,
      incarnationCross: result.incarnationCross,
    }).toMatchSnapshot()

    const untimed = calculateBodygraph({
      birthDate: '1988-08-17',
      birthTime: null,
      latitude: 32.794,
      longitude: 34.9896,
    })
    expect('type' in untimed).toBe(false) // no time -> honest partial state
  })
})

describe('golden vectors — gematria', () => {
  it('name values are stable incl. finals', () => {
    const names = ['שרה', 'דוד', 'מנחם מנדל', 'ץ', 'אברהם']
    const table = names.map((name) => {
      const result = calculateGematria(name)
      return {
        name,
        standard: result.methods.standard.value,
        ordinal: result.methods.ordinal.value,
        atbash: result.methods.atbash.value,
        digitalRoot: result.methods.standard.digitalRoot,
      }
    })
    expect(table).toMatchSnapshot()
  })
})
