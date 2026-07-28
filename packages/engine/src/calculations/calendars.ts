/**
 * World calendars + sidereal zodiac + Panchang basics.
 *
 * Calendar conversions ride on Intl.DateTimeFormat (hebrew already lives in
 * services/today.ts; here: islamic-umalqura, persian, chinese) — zero
 * dependencies, and every Intl-backed function degrades to null on runtimes
 * without calendar data (some Hermes builds), matching the hebrewDate
 * contract. Sidereal and Panchang derive from the existing ephemeris.
 *
 * Accuracy bar: sign/name level for an entertainment & education product.
 * Panchang uses noon-UTC longitudes and the Lahiri ayanamsa approximation,
 * not observatory-grade sunrise-anchored values.
 */

import { getCurrentPlanetaryPositions } from './astrology'
import { ZODIAC_SIGNS } from '../data/zodiac-signs'

// ---------------------------------------------------------------------------
// Intl-backed calendar dates
// ---------------------------------------------------------------------------

function intlCalendarDate(date: Date, calendar: string): string | null {
  try {
    return new Intl.DateTimeFormat(`en-GB-u-ca-${calendar}`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return null
  }
}

/** e.g. "10 Safar 1448 AH", or null when the runtime lacks the calendar. */
export function hijriDate(date: Date): string | null {
  return intlCalendarDate(date, 'islamic-umalqura')
}

/** e.g. "2 Mordad 1405 AP", or null when the runtime lacks the calendar. */
export function persianDate(date: Date): string | null {
  return intlCalendarDate(date, 'persian')
}

// ---------------------------------------------------------------------------
// Chinese year — sexagenary stem-branch cycle
// ---------------------------------------------------------------------------

const STEM_ELEMENTS = [
  'Wood', 'Wood', 'Fire', 'Fire', 'Earth',
  'Earth', 'Metal', 'Metal', 'Water', 'Water',
] as const

const BRANCH_ANIMALS = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
] as const

export interface ChineseYear {
  /** Element of the year's heavenly stem, e.g. "Fire". */
  readonly element: string
  /** Animal of the year's earthly branch, e.g. "Horse". */
  readonly animal: string
  /** Stems alternate yang/yin. */
  readonly polarity: 'Yang' | 'Yin'
  /** "Fire Horse" */
  readonly name: string
}

/**
 * The Chinese year in effect on `date`, respecting the lunisolar new year
 * boundary via Intl's chinese calendar (its relatedYear part is the Gregorian
 * year the Chinese year began in).
 */
export function chineseYear(date: Date): ChineseYear | null {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-chinese', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(date)
    // TS's Intl part-type union predates 'relatedYear'; it is real at runtime.
    const related = parts.find((p) => (p.type as string) === 'relatedYear')?.value
    if (!related) return null
    const year = Number(related)
    if (!Number.isFinite(year)) return null
    const stem = (((year - 4) % 10) + 10) % 10
    const branch = (((year - 4) % 12) + 12) % 12
    const element = STEM_ELEMENTS[stem]
    const animal = BRANCH_ANIMALS[branch]
    return {
      element,
      animal,
      polarity: stem % 2 === 0 ? 'Yang' : 'Yin',
      name: `${element} ${animal}`,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Sidereal zodiac — Lahiri ayanamsa
// ---------------------------------------------------------------------------

/** Lahiri ayanamsa, linear approximation: 23.85° at J2000 + 50.29″/yr. */
export function lahiriAyanamsa(dateStr: string): number {
  const year = new Date(`${dateStr}T12:00:00Z`).getUTCFullYear()
  return 23.85 + (year - 2000) * (50.29 / 3600)
}

export interface SiderealSun {
  readonly sign: string
  readonly degree: number
}

/** Sidereal sun sign+degree from the tropical ephemeris minus ayanamsa. */
export function siderealSun(dateStr: string): SiderealSun {
  const positions = getCurrentPlanetaryPositions(dateStr)
  const sun = positions.find((p) => p.planet.id === 'sun')
  if (!sun) throw new Error('ephemeris returned no sun')
  const longitude =
    ((sun.position.longitude - lahiriAyanamsa(dateStr)) % 360 + 360) % 360
  const sign = ZODIAC_SIGNS[Math.floor(longitude / 30)]
  return { sign: sign.name, degree: Math.floor(longitude % 30) }
}

// ---------------------------------------------------------------------------
// Panchang — tithi, paksha, nakshatra, yoga, karana, vara
// ---------------------------------------------------------------------------

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
] as const

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada',
  'Revati',
] as const

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
  'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha',
  'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra',
  'Vaidhriti',
] as const

const MOVABLE_KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Vishti',
] as const

const FIXED_KARANAS = ['Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'] as const

const VARA_NAMES = [
  'Ravivara', 'Somavara', 'Mangalavara', 'Budhavara',
  'Guruvara', 'Shukravara', 'Shanivara',
] as const

export interface Panchang {
  /** e.g. "Shukla Dashami" — the headline value. */
  readonly tithi: string
  readonly paksha: 'Shukla' | 'Krishna'
  readonly nakshatra: string
  readonly yoga: string
  readonly karana: string
  /** Sanskrit weekday. */
  readonly vara: string
}

/**
 * Panchang for the civil date, evaluated at noon UTC. Tithi from the
 * sun–moon elongation; nakshatra and yoga from sidereal longitudes.
 */
export function panchang(dateStr: string): Panchang {
  const positions = getCurrentPlanetaryPositions(dateStr)
  const sun = positions.find((p) => p.planet.id === 'sun')
  const moon = positions.find((p) => p.planet.id === 'moon')
  if (!sun || !moon) throw new Error('ephemeris returned no sun/moon')

  const sunLong = sun.position.longitude
  const moonLong = moon.position.longitude
  const ayanamsa = lahiriAyanamsa(dateStr)

  const elongation = ((moonLong - sunLong) % 360 + 360) % 360
  const tithiIndex = Math.floor(elongation / 12) // 0..29
  const paksha: Panchang['paksha'] = tithiIndex < 15 ? 'Shukla' : 'Krishna'
  const withinPaksha = tithiIndex % 15 // 0..14
  const tithiName =
    withinPaksha === 14
      ? paksha === 'Shukla' ? 'Purnima' : 'Amavasya'
      : TITHI_NAMES[withinPaksha]

  const sidMoon = ((moonLong - ayanamsa) % 360 + 360) % 360
  const nakshatra = NAKSHATRA_NAMES[Math.floor(sidMoon / (360 / 27)) % 27]

  const sidSun = ((sunLong - ayanamsa) % 360 + 360) % 360
  const yoga = YOGA_NAMES[Math.floor(((sidSun + sidMoon) % 360) / (360 / 27)) % 27]

  // 60 half-tithis: the first and last three-and-a-half are fixed karanas,
  // the remaining 56 cycle through the seven movable ones.
  const half = Math.floor(elongation / 6) // 0..59
  const karana =
    half === 0
      ? FIXED_KARANAS[3]
      : half >= 57
        ? FIXED_KARANAS[half - 57]
        : MOVABLE_KARANAS[(half - 1) % 7]

  const vara = VARA_NAMES[new Date(`${dateStr}T12:00:00Z`).getUTCDay()]

  return {
    tithi: `${paksha} ${tithiName}`,
    paksha,
    nakshatra,
    yoga,
    karana,
    vara,
  }
}
