/**
 * The twelve rashis, the signs of the sidereal zodiac in Jyotish, by their
 * Sanskrit names from Mesha at 0° (Brihat Parashara Hora Shastra 4), each
 * the same thirty degrees as the tropical sign of its place, counted from
 * the ayanamsa; their lords are the traditional rulers (`TRADITIONAL_RULERS`).
 * A rashi's three drekkanas belong to the rashi itself, its fifth and its
 * ninth, and take their lords (BPHS 6.8); its nine navamsas run on round the
 * zodiac from Mesha, one to each pada of the nakshatras (BPHS 6.9–10:
 * from the rashi itself in the movable, from its ninth in the fixed, from
 * its fifth in the dual).
 */

import { TRADITIONAL_RULERS, ZODIAC_SIGNS, type ClassicalPlanet } from './zodiac-signs'
import type { ZodiacSign } from '../types/astrology'

const NAMES = [
  ['Mesha', 'मेष'],
  ['Vrishabha', 'वृषभ'],
  ['Mithuna', 'मिथुन'],
  ['Karka', 'कर्क'],
  ['Simha', 'सिंह'],
  ['Kanya', 'कन्या'],
  ['Tula', 'तुला'],
  ['Vrishchika', 'वृश्चिक'],
  ['Dhanu', 'धनु'],
  ['Makara', 'मकर'],
  ['Kumbha', 'कुम्भ'],
  ['Meena', 'मीन'],
] as const

export interface Rashi {
  /** 1 (Mesha) to 12 (Meena). */
  readonly n: number
  readonly name: (typeof NAMES)[number][0]
  readonly devanagari: string
  /** The tropical sign of the same place, for its glyph and element. */
  readonly sign: ZodiacSign
  readonly lord: ClassicalPlanet
}

export const RASHIS: readonly Rashi[] = Object.freeze(
  NAMES.map(([name, devanagari], i) => {
    const sign = ZODIAC_SIGNS[i]
    return Object.freeze({ n: i + 1, name, devanagari, sign, lord: TRADITIONAL_RULERS[sign.id] })
  }),
)

const RASHI_DEGREES = 360 / RASHIS.length
/** Drekkanas in a rashi, and the rashis they belong to: the rashi, its fifth, its ninth (the same element). */
const DREKKANAS = 3
const TRINE = RASHIS.length / DREKKANAS
/** Navamsas in a rashi: one to each pada, nine to a rashi. */
const NAVAMSAS = 9

const inTurn = (longitude: number): number => ((longitude % 360) + 360) % 360

/** The rashi a sidereal longitude falls in. */
export const rashiAt = (siderealLongitude: number): Rashi => RASHIS[Math.floor(inTurn(siderealLongitude) / RASHI_DEGREES) % RASHIS.length]

/** The drekkana a sidereal longitude falls in (1–3), the rashi it belongs to and that rashi's lord. */
export function drekkanaAt(siderealLongitude: number): { readonly drekkana: number; readonly of: Rashi; readonly lord: ClassicalPlanet } {
  const at = inTurn(siderealLongitude)
  const rashi = Math.floor(at / RASHI_DEGREES)
  const drekkana = Math.floor((at - rashi * RASHI_DEGREES) / (RASHI_DEGREES / DREKKANAS))
  const of = RASHIS[(rashi + drekkana * TRINE) % RASHIS.length]
  return { drekkana: drekkana + 1, of, lord: of.lord }
}

/** The navamsa a sidereal longitude falls in: the rashi its ninth part of a rashi belongs to. */
export const navamsaAt = (siderealLongitude: number): Rashi =>
  RASHIS[Math.floor(inTurn(siderealLongitude) / (RASHI_DEGREES / NAVAMSAS)) % RASHIS.length]
