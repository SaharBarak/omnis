/**
 * The Panchang: a day's five limbs (tithi, nakshatra, yoga, karana, vara)
 * as the almanac reads them, at the day's sunrise, and the lunar month the
 * sunrise falls in. Names in data/panchang.ts and data/nakshatras.ts.
 *
 * - The day is read at sunrise in Ujjain (Avanti, 23°10′N 75°47′E, 494 m),
 *   the prime meridian of the Surya Siddhanta (1.62): the Sun's upper limb
 *   on the horizon with standard refraction, astronomy-engine
 *   `SearchRiseSet`. A limb in force at sunrise is the day's, however soon
 *   after it ends; a tithi no sunrise falls in is lost to the count
 *   (kshaya), one two sunrises fall in is kept twice (vriddhi).
 * - The tithi is the Moon's elongation from the Sun in twelfths of thirty
 *   degrees (astronomy-engine `MoonPhase`, its instants by
 *   `SearchMoonPhase`); the nakshatra and yoga read the sidereal Moon and
 *   Sun by the Lahiri ayanamsa (`lahiriAyanamsa`).
 * - The month is amanta, new Moon to new Moon, named for the rashi the
 *   sidereal Sun enters in it; adhika where it enters none, the next
 *   month's name repeated; kshaya where it enters two, named for the first.
 *   The purnimanta month, full Moon to full Moon, takes the next month's
 *   name in the dark half; an adhika month is the same in both.
 * - Times and the dates of what begins are given in India Standard Time
 *   (UTC+5:30); a day's limbs hold anywhere in India but for its sunrise.
 */

import { Body, EclipticGeoMoon, MoonPhase, Observer, SearchMoonPhase, SearchRiseSet, SunPosition } from 'astronomy-engine'
import { lahiriAyanamsa } from './ayanamsa'
import { dateInZone, midnightInZone, shiftDay, type Dated } from './day-search'
import { SYNODIC_MONTH } from './moon'
import { sunReaches } from './sky-events'
import { NAKSHATRAS, nakshatraAt, type Nakshatra } from '../data/nakshatras'
import { ADHIKA, AMAVASYA, FIXED_KARANAS, LUNAR_MONTHS, MOVABLE_KARANAS, PURNIMA, TITHI_NAMES, VARAS, VISHTI, YOGA_NAMES, type Vara } from '../data/panchang'
import { RASHIS, rashiAt, type Rashi } from '../data/rashis'

/** Ujjain (Avanti), the Surya Siddhanta's prime meridian, where the Panchang reads its day's sunrise. */
export const UJJAIN = Object.freeze({ name: 'Ujjain', latitude: 23 + 10 / 60, longitude: 75 + 47 / 60, height: 494 })
/** India Standard Time, east of UTC, in which the Panchang's times are given. */
export const INDIA_HOURS = 5.5

const FULL_TURN = 360
const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
/** A minute: times are given to it, and a search from a crossing just found starts this far past it. */
const MINUTE_MS = 60_000
const OBSERVER = new Observer(UJJAIN.latitude, UJJAIN.longitude, UJJAIN.height)
const turn = (angle: number): number => ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN
const later = (at: Date, days: number): Date => new Date(at.getTime() + days * DAY_MS)

/** An instant and its date in India Standard Time. */
export const indiaDated = (at: Date): Dated => ({ at, date: dateInZone(at, INDIA_HOURS) })

/** The instant's time to the minute in India Standard Time, "11:27". */
export const indiaTime = (at: Date): string => new Date(Math.round(at.getTime() / MINUTE_MS) * MINUTE_MS + INDIA_HOURS * HOUR_MS).toISOString().slice(11, 16)

/* ---------- tithis ---------- */

/** Tithis in a lunation: one per twelve degrees of the Moon's elongation from the Sun. */
export const TITHIS = 30
const TITHIS_IN_PAKSHA = TITHIS / 2
export const TITHI_DEGREES = FULL_TURN / TITHIS

/** A tithi: its place in the lunation (1–30), its paksha, its place in the paksha (1–15) and its name. */
export interface Tithi {
  readonly n: number
  readonly paksha: 'Shukla' | 'Krishna'
  readonly inPaksha: number
  readonly name: string
  readonly devanagari: string
}

/** The tithi the `n`th of the lunation's thirty is (1 first). */
export function tithiNumbered(n: number): Tithi {
  const index = (((Math.floor(n) - 1) % TITHIS) + TITHIS) % TITHIS
  const paksha = index < TITHIS_IN_PAKSHA ? 'Shukla' : 'Krishna'
  const within = index % TITHIS_IN_PAKSHA
  const [name, devanagari] = within === TITHIS_IN_PAKSHA - 1 ? (paksha === 'Shukla' ? PURNIMA : AMAVASYA) : (TITHI_NAMES[within] ?? ['', ''])
  return { n: index + 1, paksha, inPaksha: within + 1, name, devanagari }
}

/** The tithi the Moon is in at an elongation from the Sun, in degrees. */
export const tithiAt = (elongation: number): Tithi => tithiNumbered(Math.floor(turn(elongation) / TITHI_DEGREES) + 1)

/** The instant the `n`th tithi next begins at or after `from`: the Moon reaching its start, dated in India. */
export function tithiBegins(n: number, from: Date): Dated {
  const found = SearchMoonPhase((tithiNumbered(n).n - 1) * TITHI_DEGREES, from, SYNODIC_MONTH + 2)
  if (!found) throw new RangeError(`Tithi ${n} begins in no month from ${from.toISOString()}`)
  return indiaDated(found.date)
}

/** A tithi in time: when it begins and ends, the sunrises that fall in it, and its day: its first sunrise's, or, where none falls in it (kshaya), the day it begins. */
export interface TithiSpan {
  readonly tithi: Tithi
  readonly begins: Dated
  readonly ends: Dated
  readonly sunrises: number
  readonly day: string
}

/** The `n`th tithi's next span beginning at or after `from`. */
export function tithiDay(n: number, from: Date): TithiSpan {
  const begins = tithiBegins(n, from)
  const ends = tithiBegins(n + 1, begins.at)
  const risen = [begins.date, shiftDay(begins.date, 1), shiftDay(begins.date, 2)].filter((day) => {
    const rise = sunriseOn(day)
    return rise >= begins.at && rise < ends.at
  })
  return { tithi: tithiNumbered(n), begins, ends, sunrises: risen.length, day: risen[0] ?? begins.date }
}

/** The tithis a Panchang watches, by number: the Ekadashi of each paksha, Purnima and Amavasya. */
export const WATCHED_TITHIS = Object.freeze({ ekadashi: [11, 26], purnima: [15], amavasya: [30] } as const)

export type Observance = keyof typeof WATCHED_TITHIS

/** The next of each watched tithi from India's day `day` on, each on its day: the nearer Ekadashi, Purnima and Amavasya. */
export function nextObservances(day: string): Readonly<Record<Observance, TithiSpan>> {
  const from = midnightInZone(day, INDIA_HOURS)
  const nearest = (tithis: readonly number[]): TithiSpan => {
    const [first, ...rest] = tithis.map((n) => tithiDay(n, from))
    if (!first) throw new RangeError('No tithi watched')
    return rest.reduce((best, span) => (span.day < best.day ? span : best), first)
  }
  return { ekadashi: nearest(WATCHED_TITHIS.ekadashi), purnima: nearest(WATCHED_TITHIS.purnima), amavasya: nearest(WATCHED_TITHIS.amavasya) }
}

/* ---------- the sky at an instant ---------- */

const siderealOf = (tropical: number, at: Date): number => turn(tropical - lahiriAyanamsa(dateInZone(at, INDIA_HOURS)))
const siderealSun = (at: Date): number => siderealOf(SunPosition(at).elon, at)
const siderealMoon = (at: Date): number => siderealOf(EclipticGeoMoon(at).lon, at)

/** The Sun's rising in Ujjain on India's civil day `day`. */
export function sunriseOn(day: string): Date {
  const found = SearchRiseSet(Body.Sun, OBSERVER, +1, midnightInZone(day, INDIA_HOURS), 1)
  if (!found) throw new RangeError(`No sunrise in Ujjain on ${day}`)
  return found.date
}

/* ---------- the month ---------- */

/** An amanta month: its name, adhika or kshaya, its new Moons, and its purnimanta name in each half. */
export interface LunarMonth {
  /** e.g. "Ashvin". */
  readonly name: string
  readonly devanagari: string
  readonly adhika: boolean
  /** The Sun enters two rashis in it; the second month's name is lost. */
  readonly kshaya: boolean
  /** The rashi the Sun enters in it, its name's (the next month's, where adhika). */
  readonly rashi: Rashi
  /** The new Moon it begins at and the one it ends at. */
  readonly begins: Dated
  readonly ends: Dated
  /** "Adhika Jyeshtha", or the name alone. */
  readonly words: string
}

/** The last new Moon at or before `at`. */
function newMoonBefore(at: Date): Date {
  const age = (MoonPhase(at) / FULL_TURN) * SYNODIC_MONTH
  const found = SearchMoonPhase(0, later(at, -age - 2), age + 3)
  if (!found || found.date > at) throw new RangeError(`No new Moon before ${at.toISOString()}`)
  return found.date
}

function newMoonAfter(at: Date): Date {
  const found = SearchMoonPhase(0, later(at, 1), SYNODIC_MONTH + 2)
  if (!found) throw new RangeError(`No new Moon after ${at.toISOString()}`)
  return found.date
}

const MONTHS = new Map<string, LunarMonth>()

/** The amanta month an instant falls in. */
export function lunarMonthAt(at: Date): LunarMonth {
  const begins = newMoonBefore(at)
  const key = begins.toISOString()
  const kept = MONTHS.get(key)
  if (kept) return kept
  const ends = newMoonAfter(begins)
  const from = Math.floor(siderealSun(begins) / (FULL_TURN / RASHIS.length))
  const to = Math.floor(siderealSun(ends) / (FULL_TURN / RASHIS.length))
  const entered = (to - from + RASHIS.length) % RASHIS.length
  const index = (from + 1) % RASHIS.length
  const [name, devanagari] = LUNAR_MONTHS[index] ?? ['', '']
  const rashi = RASHIS[index]
  if (!rashi) throw new RangeError(`No rashi ${index}`)
  const adhika = entered === 0
  const month: LunarMonth = { name, devanagari, adhika, kshaya: entered > 1, rashi, begins: indiaDated(begins), ends: indiaDated(ends), words: adhika ? `${ADHIKA} ${name}` : name }
  MONTHS.set(key, month)
  return month
}

/** The month after `month`. */
export const monthAfter = (month: LunarMonth): LunarMonth => lunarMonthAt(later(month.ends.at, 1))

/** The days of an amanta month by their sunrises: the India days whose sunrise falls between its new Moons. */
export function daysOfMonth(month: LunarMonth): readonly string[] {
  const days: string[] = []
  for (let day = month.begins.date; day <= month.ends.date; day = shiftDay(day, 1)) {
    const rise = sunriseOn(day)
    if (rise >= month.begins.at && rise < month.ends.at) days.push(day)
  }
  return days
}

/* ---------- the day ---------- */

export interface Yoga {
  /** 1 (Vishkambha) to 27 (Vaidhriti). */
  readonly n: number
  readonly name: string
}

/** A day of the Panchang, every limb read at its sunrise in Ujjain. */
export interface PanchangDay {
  readonly date: string
  readonly sunrise: Date
  /** The Moon's elongation from the Sun at sunrise, in degrees: its face. */
  readonly elongation: number
  readonly tithi: Tithi
  readonly nakshatra: Nakshatra
  /** The nakshatra's quarter, 1–4. */
  readonly pada: number
  readonly yoga: Yoga
  readonly karana: string
  readonly vishti: boolean
  readonly vara: Vara
  readonly month: LunarMonth
  /** The purnimanta month: the amanta month's name in the bright half, the next month's in the dark, an adhika month's in both. */
  readonly purnimanta: string
}

/** The karana of an elongation: sixty half-tithis, the first and the last three fixed, the fifty-six between them the seven movable in turn. */
function karanaAt(elongation: number): string {
  const half = Math.floor(turn(elongation) / (TITHI_DEGREES / 2))
  const lastFixed = 2 * TITHIS - FIXED_KARANAS.last.length
  if (half === 0) return FIXED_KARANAS.first
  if (half >= lastFixed) return FIXED_KARANAS.last[half - lastFixed] ?? ''
  return MOVABLE_KARANAS[(half - 1) % MOVABLE_KARANAS.length] ?? ''
}

const DAYS = new Map<string, PanchangDay>()

/** India's civil day `day` (YYYY-MM-DD) in the Panchang, read at its sunrise in Ujjain. */
export function panchangDay(day: string): PanchangDay {
  const kept = DAYS.get(day)
  if (kept) return kept
  const sunrise = sunriseOn(day)
  const elongation = MoonPhase(sunrise)
  const tithi = tithiAt(elongation)
  const sun = siderealSun(sunrise)
  const moon = siderealMoon(sunrise)
  const { nakshatra, pada } = nakshatraAt(moon)
  const yoga = Math.floor(turn(sun + moon) / (FULL_TURN / YOGA_NAMES.length))
  const karana = karanaAt(elongation)
  const vara = VARAS[new Date(`${day}T12:00:00Z`).getUTCDay()]
  if (!vara) throw new RangeError(`No vara for ${day}`)
  const month = lunarMonthAt(sunrise)
  const purnimanta = month.adhika || tithi.paksha === 'Shukla' ? month.words : monthAfter(month).name
  const read: PanchangDay = { date: day, sunrise, elongation, tithi, nakshatra, pada, yoga: { n: yoga + 1, name: YOGA_NAMES[yoga] ?? '' }, karana, vishti: karana === VISHTI, vara, month, purnimanta }
  DAYS.set(day, read)
  return read
}

/* ---------- what comes next ---------- */

/** The next sankranti after `from`: the sidereal Sun entering its next rashi, dated in India. */
export function nextSankranti(from: Date): Dated & { readonly rashi: Rashi } {
  const past = new Date(from.getTime() + MINUTE_MS)
  const rashi = RASHIS[rashiAt(siderealSun(past)).n % RASHIS.length]
  const found = rashi && sunReaches((rashi.n - 1) * (FULL_TURN / RASHIS.length), past, 'sidereal')
  if (!rashi || !found) throw new RangeError(`No sankranti after ${from.toISOString()}`)
  return { ...indiaDated(found.at), rashi }
}

/* ---------- the day in words ---------- */

export interface Panchang {
  /** e.g. "Shukla Dashami" — the headline value. */
  readonly tithi: string
  readonly paksha: 'Shukla' | 'Krishna'
  readonly nakshatra: string
  readonly yoga: string
  readonly karana: string
  /** Sanskrit weekday. */
  readonly vara: string
  /** The amanta month, e.g. "Ashvin", "Adhika Jyeshtha". */
  readonly month: string
  /** The purnimanta month. */
  readonly purnimanta: string
}

/** The Panchang of India's civil day `day`, in words, read at sunrise in Ujjain. */
export function panchang(day: string): Panchang {
  const read = panchangDay(day)
  return {
    tithi: `${read.tithi.paksha} ${read.tithi.name}`,
    paksha: read.tithi.paksha,
    nakshatra: read.nakshatra.name,
    yoga: read.yoga.name,
    karana: read.karana,
    vara: read.vara.name,
    month: read.month.words,
    purnimanta: read.purnimanta,
  }
}

/** The days, from `first` to `last`, whose sunrise holds each nakshatra: a nakshatra no sunrise falls in has none. */
export function nakshatraSunrises(first: string, last: string): ReadonlyMap<number, readonly string[]> {
  const held = new Map<number, string[]>(NAKSHATRAS.map((n) => [n.n, []]))
  for (let day = first; day <= last; day = shiftDay(day, 1)) held.get(panchangDay(day).nakshatra.n)?.push(day)
  return held
}
