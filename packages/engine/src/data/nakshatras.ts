/**
 * The twenty-seven nakshatras, the lunar mansions of Jyotish, in order from
 * Ashwini at 0° sidereal Aries: each 13°20' of the sidereal zodiac, split
 * into four padas of 3°20'. Each has its presiding deity (the Vedic
 * nakshatra lists, e.g. Taittiriya Brahmana 1.5.1; table as in
 * https://en.wikipedia.org/wiki/Nakshatra) and its Vimshottari lord, the
 * nine grahas in the dasha order run from Ketu at Ashwini (Brihat Parashara
 * Hora Shastra, ch. 46).
 */

import type { PlanetId } from '../types/astrology'

/** The Vimshottari order of the grahas and each one's dasha in years (120 in all), Ketu and Rahu as the Moon's south and north nodes. */
export const VIMSHOTTARI: readonly { readonly lord: PlanetId; readonly name: string; readonly years: number }[] = Object.freeze([
  { lord: 'southNode', name: 'Ketu', years: 7 },
  { lord: 'venus', name: 'Venus', years: 20 },
  { lord: 'sun', name: 'Sun', years: 6 },
  { lord: 'moon', name: 'Moon', years: 10 },
  { lord: 'mars', name: 'Mars', years: 7 },
  { lord: 'northNode', name: 'Rahu', years: 18 },
  { lord: 'jupiter', name: 'Jupiter', years: 16 },
  { lord: 'saturn', name: 'Saturn', years: 19 },
  { lord: 'mercury', name: 'Mercury', years: 17 },
])

const NAMES_AND_DEITIES = [
  ['Ashwini', 'the Ashvins'],
  ['Bharani', 'Yama'],
  ['Krittika', 'Agni'],
  ['Rohini', 'Prajapati'],
  ['Mrigashira', 'Soma'],
  ['Ardra', 'Rudra'],
  ['Punarvasu', 'Aditi'],
  ['Pushya', 'Brihaspati'],
  ['Ashlesha', 'the Sarpas'],
  ['Magha', 'the Pitris'],
  ['Purva Phalguni', 'Bhaga'],
  ['Uttara Phalguni', 'Aryaman'],
  ['Hasta', 'Savitr'],
  ['Chitra', 'Tvashtr'],
  ['Swati', 'Vayu'],
  ['Vishakha', 'Indra and Agni'],
  ['Anuradha', 'Mitra'],
  ['Jyeshtha', 'Indra'],
  ['Mula', 'Nirriti'],
  ['Purva Ashadha', 'the Apas'],
  ['Uttara Ashadha', 'the Vishvedevas'],
  ['Shravana', 'Vishnu'],
  ['Dhanishta', 'the Vasus'],
  ['Shatabhisha', 'Varuna'],
  ['Purva Bhadrapada', 'Aja Ekapada'],
  ['Uttara Bhadrapada', 'Ahir Budhnya'],
  ['Revati', 'Pushan'],
] as const

export interface Nakshatra {
  /** 1 (Ashwini) to 27 (Revati). */
  readonly n: number
  readonly name: (typeof NAMES_AND_DEITIES)[number][0]
  readonly deity: string
  readonly lord: (typeof VIMSHOTTARI)[number]
  /** Where it begins on the sidereal zodiac, in degrees. */
  readonly start: number
}

export const NAKSHATRA_COUNT = NAMES_AND_DEITIES.length
/** A nakshatra's span: the circle in twenty-seven. */
export const NAKSHATRA_SPAN = 360 / NAKSHATRA_COUNT
/** Padas in a nakshatra: its quarters, each a navamsa. */
export const PADAS = 4

export const NAKSHATRAS: readonly Nakshatra[] = Object.freeze(
  NAMES_AND_DEITIES.map(([name, deity], i) => {
    const lord = VIMSHOTTARI[i % VIMSHOTTARI.length]
    if (!lord) throw new RangeError(`No Vimshottari lord for nakshatra ${i + 1}`)
    return Object.freeze({ n: i + 1, name, deity, lord, start: i * NAKSHATRA_SPAN })
  }),
)

export const NAKSHATRA_NAMES: readonly Nakshatra['name'][] = Object.freeze(NAKSHATRAS.map((n) => n.name))

/** Where a sidereal longitude falls: its nakshatra, its pada (1–4) and how far into the nakshatra it is, in degrees. */
export function nakshatraAt(siderealLongitude: number): { readonly nakshatra: Nakshatra; readonly pada: number; readonly into: number } {
  const at = ((siderealLongitude % 360) + 360) % 360
  const index = Math.floor(at / NAKSHATRA_SPAN) % NAKSHATRA_COUNT
  const nakshatra = NAKSHATRAS[index]
  if (!nakshatra) throw new RangeError(`No nakshatra at ${siderealLongitude}`)
  const into = at - nakshatra.start
  return { nakshatra, pada: Math.floor(into / (NAKSHATRA_SPAN / PADAS)) + 1, into }
}
