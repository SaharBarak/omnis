import { describe, expect, it } from 'vitest'
import { asKin } from '../core/types'
import { kinToSeal, kinToTone } from './dreamspell'
import { GALACTIC_ACTIVATION_PORTALS, KINS, MYSTIC_COLUMN, isMysticColumn, kinOf, modulePlace, oracleKins } from './harmonic-module'

/**
 * The harmonic module as Dreamspell prints it (Argüelles, 1990): thirteen
 * columns of twenty, kin 1 top left, kin 260 bottom right; fifty-two
 * portals; the mystic column in the middle. The oracle's kins follow the
 * oracle's seal rules at the kin's tone, the occult at the tone that sums
 * with it to fourteen.
 */
describe('harmonic module', () => {
  it('lays thirteen columns of twenty, read down', () => {
    expect(KINS).toBe(260)
    expect(modulePlace(1)).toEqual({ column: 1, row: 1 })
    expect(modulePlace(20)).toEqual({ column: 1, row: 20 })
    expect(modulePlace(21)).toEqual({ column: 2, row: 1 })
    expect(modulePlace(260)).toEqual({ column: 13, row: 20 })
  })

  it('runs the mystic column down the middle, kins 121 to 140', () => {
    expect(MYSTIC_COLUMN).toBe(7)
    expect([120, 121, 140, 141].map(isMysticColumn)).toEqual([false, true, true, false])
  })

  it('holds fifty-two portals, symmetric about the centre, filling the inner columns from 106 to 115 and 146 to 155', () => {
    expect(GALACTIC_ACTIVATION_PORTALS.size).toBe(52)
    for (const kin of GALACTIC_ACTIVATION_PORTALS) expect(GALACTIC_ACTIVATION_PORTALS.has(261 - kin), `mirror of ${kin}`).toBe(true)
    for (let kin = 106; kin <= 115; kin++) expect(GALACTIC_ACTIVATION_PORTALS.has(kin)).toBe(true)
    for (let kin = 146; kin <= 155; kin++) expect(GALACTIC_ACTIVATION_PORTALS.has(kin)).toBe(true)
    expect([1, 20, 260, 241].every((k) => GALACTIC_ACTIVATION_PORTALS.has(k))).toBe(true)
    expect([...GALACTIC_ACTIVATION_PORTALS].some(isMysticColumn)).toBe(false)
  })

  it('finds the one kin of every seal and tone', () => {
    for (let seal = 1; seal <= 20; seal++) {
      for (let tone = 1; tone <= 13; tone++) {
        const kin = kinOf(seal, tone)
        expect([kinToSeal(kin), kinToTone(kin)]).toEqual([seal, tone])
      }
    }
  })

  it('reads the oracle as kins: kin 1, Red Magnetic Dragon, and kin 75, Blue Planetary Eagle', () => {
    /* Kin 1: guide itself (tone 1), analog White Magnetic Mirror (18), antipode Blue Magnetic Monkey (11), occult Yellow Cosmic Sun (20, tone 13). */
    expect(oracleKins(asKin(1))).toEqual({ destiny: 1, guide: 1, analog: kinOf(18, 1), antipode: kinOf(11, 1), occult: 260 })
    expect([kinOf(18, 1), kinOf(11, 1)]).toEqual([118, 131])
    /* Kin 75 (Eagle 15, tone 10): guide offset +8 (tones 5, 10) → seal 3 Night; analog 4 Seed; antipode 5 Serpent; occult 6 World-Bridger at tone 4. */
    const k75 = oracleKins(asKin(75))
    expect([k75.guide, k75.analog, k75.antipode, k75.occult].map((k) => [kinToSeal(k), kinToTone(k)])).toEqual([
      [3, 10],
      [4, 10],
      [5, 10],
      [6, 4],
    ])
  })
})
