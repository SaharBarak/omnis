/**
 * The Egyptian terms (bounds, horia): each sign cut into five unequal spans,
 * each given to one of the five planets that are not the lights, as Ptolemy
 * reports them and the Hellenistic tradition used them (Tetrabiblos I.20,
 * Robbins tr., Loeb 1940, on LacusCurtius: penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/1B*.html).
 * Each row is the sign's terms in order from 0°, a planet and the degrees it
 * holds; every row holds thirty.
 */

import { ZODIAC_SIGNS } from './zodiac-signs'
import type { ZodiacSignId } from '../types/astrology'

/** The five planets the terms are given to. */
export type TermPlanet = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'

export const EGYPTIAN_TERMS: Readonly<Record<ZodiacSignId, readonly (readonly [TermPlanet, number])[]>> = Object.freeze({
  aries: [['jupiter', 6], ['venus', 6], ['mercury', 8], ['mars', 5], ['saturn', 5]],
  taurus: [['venus', 8], ['mercury', 6], ['jupiter', 8], ['saturn', 5], ['mars', 3]],
  gemini: [['mercury', 6], ['jupiter', 6], ['venus', 5], ['mars', 7], ['saturn', 6]],
  cancer: [['mars', 7], ['venus', 6], ['mercury', 6], ['jupiter', 7], ['saturn', 4]],
  leo: [['jupiter', 6], ['venus', 5], ['saturn', 7], ['mercury', 6], ['mars', 6]],
  virgo: [['mercury', 7], ['venus', 10], ['jupiter', 4], ['mars', 7], ['saturn', 2]],
  libra: [['saturn', 6], ['mercury', 8], ['jupiter', 7], ['venus', 7], ['mars', 2]],
  scorpio: [['mars', 7], ['venus', 4], ['mercury', 8], ['jupiter', 5], ['saturn', 6]],
  sagittarius: [['jupiter', 12], ['venus', 5], ['mercury', 4], ['saturn', 5], ['mars', 4]],
  capricorn: [['mercury', 7], ['jupiter', 7], ['venus', 8], ['saturn', 4], ['mars', 4]],
  aquarius: [['mercury', 7], ['venus', 6], ['jupiter', 7], ['mars', 5], ['saturn', 5]],
  pisces: [['venus', 12], ['jupiter', 4], ['mercury', 3], ['mars', 9], ['saturn', 2]],
})

/** A term: its planet, where it begins and ends in its sign (degrees, end exclusive), and its place among the sign's five (1 first). */
export interface Term {
  readonly ruler: TermPlanet
  readonly start: number
  readonly end: number
  readonly n: number
}

/** A sign's five terms, from 0° to 30°. */
export function termsOf(sign: ZodiacSignId): readonly Term[] {
  const row = EGYPTIAN_TERMS[sign]
  return row.map(([ruler, degrees], i) => {
    const start = row.slice(0, i).reduce((sum, [, d]) => sum + d, 0)
    return { ruler, start, end: start + degrees, n: i + 1 }
  })
}

const SIGN_DEGREES = 360 / ZODIAC_SIGNS.length

/** The sign and term a longitude falls in. */
export function termAt(longitude: number): Term & { readonly sign: ZodiacSignId } {
  const at = ((longitude % 360) + 360) % 360
  const sign = ZODIAC_SIGNS[Math.floor(at / SIGN_DEGREES)].id
  const degree = at - Math.floor(at / SIGN_DEGREES) * SIGN_DEGREES
  const terms = termsOf(sign)
  const term = terms.find((t) => degree < t.end) ?? terms[terms.length - 1]
  return { ...term, sign }
}
