/**
 * The instants the sky reaches its turning points, to the minute, from
 * astronomy-engine (Don Cross, MIT; within an arcminute of JPL Horizons by
 * its own tests): the Sun at a longitude (an ingress, an equinox or
 * solstice, a cross-quarter), the Moon at its quarters, its perigees and
 * apogees and their distances, the Moon entering a sign, and the eclipses
 * and their kinds. The days a board's noon-ruled cells hold come from the
 * engine's ephemeris (`sky-dates`); these give the times on them, and the
 * events that ephemeris cannot find (apsides, eclipses).
 */

import {
  EclipticGeoMoon,
  GeoMoon,
  KM_PER_AU,
  NextGlobalSolarEclipse,
  NextLunarApsis,
  NextLunarEclipse,
  SearchGlobalSolarEclipse,
  SearchLunarApsis,
  SearchLunarEclipse,
  SearchMoonPhase,
  SearchSunLongitude,
  SunPosition,
  ApsisKind,
} from 'astronomy-engine'
import { lahiriAyanamsa } from './ayanamsa'
import { SYNODIC_MONTH, type MoonPhaseName } from './moon'
import { QUARTERS } from './sky-dates'
import { ZODIAC_SIGNS } from '../data/zodiac-signs'

const FULL_TURN = 360
const SIGN_DEGREES = FULL_TURN / ZODIAC_SIGNS.length
const MINUTE_MS = 60_000
const DAY_MS = 86_400_000
/** The Sun's slowest daily motion, near aphelion, in degrees: a search for a longitude spans the days it can take, with one to spare. */
const SUN_SLOWEST = 0.95
/** Seconds a bisection for the Moon's crossing is carried to. */
const SECOND_MS = 1000

const turn = (angle: number): number => ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN
const isoDay = (at: Date): string => at.toISOString().slice(0, 10)

/** An instant in UTC: its civil date and its time to the minute (both from the instant rounded to the minute), and the instant itself. */
export interface Instant {
  readonly date: string
  readonly time: string
  readonly at: Date
}

export function instantOf(at: Date): Instant {
  const iso = new Date(Math.round(at.getTime() / MINUTE_MS) * MINUTE_MS).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 16), at }
}

/** The first day whose noon (UTC) is at or past an instant: the cell a noon-ruled calendar marks it on, as `NoonCrossing.noon` is. */
export function noonDayOf(at: Date): string {
  const day = isoDay(at)
  return at.getTime() <= Date.parse(`${day}T12:00:00Z`) ? day : isoDay(new Date(Date.parse(`${day}T12:00:00Z`) + DAY_MS))
}

/* ---------- the Sun ---------- */

/** The Sun's apparent tropical longitude at an instant (true equinox of date). */
export const sunLongitude = (at: Date): number => SunPosition(at).elon

/**
 * The next instant after `from` the Sun reaches `longitude`, tropical or
 * sidereal; sidereal by the engine's Lahiri ayanamsa (`lahiriAyanamsa`) for
 * the day the instant falls on.
 */
export function sunReaches(longitude: number, from: Date, zodiac: 'tropical' | 'sidereal' = 'tropical'): Instant | null {
  const search = (offset: number) => {
    const target = turn(longitude + offset)
    const ahead = turn(target - sunLongitude(from)) || FULL_TURN
    return SearchSunLongitude(target, from, Math.ceil(ahead / SUN_SLOWEST) + 1)
  }
  if (zodiac === 'tropical') {
    const found = search(0)
    return found && instantOf(found.date)
  }
  const first = search(lahiriAyanamsa(isoDay(from)))
  const found = first && search(lahiriAyanamsa(isoDay(first.date)))
  return found && instantOf(found.date)
}

/** The last instant at or before `at` the Sun reached `longitude`, tropical or sidereal: searched from the days it can take to cross the arc behind it. */
export function sunReached(longitude: number, at: Date, zodiac: 'tropical' | 'sidereal' = 'tropical'): Instant | null {
  const offset = zodiac === 'sidereal' ? lahiriAyanamsa(isoDay(at)) : 0
  const arc = turn(sunLongitude(at) - offset - longitude)
  const found = sunReaches(longitude, new Date(at.getTime() - (arc / SUN_SLOWEST + 1) * DAY_MS), zodiac)
  return found && found.at.getTime() <= at.getTime() ? found : null
}

/** One of the Sun's eight turning points of the tropical year. */
export interface SolarTurning extends Instant {
  readonly longitude: number
  readonly kind: 'equinox' | 'solstice' | 'cross-quarter'
  readonly name: string
}

/** The equinoxes and solstices by the month they fall in, as the almanacs name them (USNO), from the Sun at 0°. */
const QUARTER_DAYS = [
  ['equinox', 'March equinox'],
  ['solstice', 'June solstice'],
  ['equinox', 'September equinox'],
  ['solstice', 'December solstice'],
] as const
/** The Sun's turning points in a year: the equinoxes and solstices, and a cross-quarter between each two. */
export const TURNINGS = QUARTER_DAYS.length * 2
const TURNING_DEGREES = FULL_TURN / TURNINGS

/** The turning point at the `k`th eighth of the circle from 0°: a quarter day (even), or the cross-quarter midway, at 15° of a fixed sign (odd). */
function turningAt(k: number): Omit<SolarTurning, keyof Instant> {
  const longitude = (k % TURNINGS) * TURNING_DEGREES
  if (k % 2 === 0) {
    const [kind, name] = QUARTER_DAYS[(k % TURNINGS) / 2]
    return { longitude, kind, name }
  }
  const sign = ZODIAC_SIGNS[Math.floor(longitude / SIGN_DEGREES)]
  return { longitude, kind: 'cross-quarter', name: `Cross-quarter, ${longitude - (sign.number - 1) * SIGN_DEGREES}° ${sign.name}` }
}

/**
 * The Sun's next `count` turning points after `from`, nearest first: the
 * equinoxes and solstices (0°, 90°, 180°, 270°) and the cross-quarters
 * midway between them (45°, 135°, 225°, 315°, the Sun at 15° Taurus, Leo,
 * Scorpio and Aquarius).
 */
export function solarTurnings(from: Date, count: number): readonly SolarTurning[] {
  const k = Math.floor(sunLongitude(from) / TURNING_DEGREES) + 1
  const found: SolarTurning[] = []
  for (let i = 0; i < count; i++) {
    const turning = turningAt(k + i)
    const at = sunReaches(turning.longitude, found.length > 0 ? found[found.length - 1].at : from)
    if (!at) break
    found.push({ ...at, ...turning })
  }
  return found
}

/** The last turning point at or before `from`. */
export function solarTurningBefore(from: Date): SolarTurning | null {
  const k = Math.floor(sunLongitude(from) / TURNING_DEGREES)
  const turning = turningAt(k)
  const at = sunReaches(turning.longitude, new Date(from.getTime() - (TURNING_DEGREES / SUN_SLOWEST + 1) * DAY_MS))
  return at && at.at.getTime() <= from.getTime() ? { ...at, ...turning } : null
}

/* ---------- the Moon ---------- */

/** The Moon's distance from the Earth's centre at an instant, in kilometres. */
export function moonDistance(at: Date): number {
  const v = GeoMoon(at)
  return Math.hypot(v.x, v.y, v.z) * KM_PER_AU
}

/** A quarter of the Moon at its instant: the phase, its elongation and the Moon's distance then. */
export interface MoonQuarter extends Instant {
  readonly phase: MoonPhaseName
  readonly angle: number
  readonly km: number
}

/** Every quarter of the Moon from `from` to `to`, in order. */
export function moonQuartersIn(from: Date, to: Date): readonly MoonQuarter[] {
  return QUARTERS.flatMap(([angle, phase]) => {
    const found: MoonQuarter[] = []
    for (let at = from; at < to; ) {
      const next = SearchMoonPhase(angle, at, SYNODIC_MONTH + 1)
      if (!next || next.date >= to) break
      found.push({ ...instantOf(next.date), phase, angle, km: moonDistance(next.date) })
      at = new Date(next.date.getTime() + DAY_MS)
    }
    return found
  }).sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** A perigee or apogee of the Moon: its instant and the Moon's distance then, in kilometres. */
export interface Apsis extends Instant {
  readonly kind: 'perigee' | 'apogee'
  readonly km: number
}

/** The Moon's perigees and apogees from `from` to `to`, in order. */
export function lunarApsides(from: Date, to: Date): readonly Apsis[] {
  const found: Apsis[] = []
  for (let apsis = SearchLunarApsis(from); apsis.time.date < to; apsis = NextLunarApsis(apsis)) {
    found.push({ ...instantOf(apsis.time.date), kind: apsis.kind === ApsisKind.Pericenter ? 'perigee' : 'apogee', km: apsis.dist_km })
  }
  return found
}

/** Of the perigee-to-apogee span, the share a new or full Moon may stand from the perigee and still be a supermoon. */
const SUPERMOON_SHARE = 0.1

/**
 * Whether a new or full Moon is a supermoon by Richard Nolle's definition
 * (1979), within 90% of its closest approach in that orbit, as Fred Espenak
 * reckons it (and EarthSky dates them): its distance within a tenth of the
 * span from the perigee nearest it to the apogee before that perigee.
 * `apsides` must hold both. There is no official definition.
 */
export function isSupermoon(quarter: MoonQuarter, apsides: readonly Apsis[]): boolean {
  if (quarter.phase !== 'New Moon' && quarter.phase !== 'Full Moon') return false
  const t = quarter.at.getTime()
  const perigees = apsides.filter((a) => a.kind === 'perigee')
  const perigee = perigees.reduce<Apsis | undefined>((best, a) => (!best || Math.abs(a.at.getTime() - t) < Math.abs(best.at.getTime() - t) ? a : best), undefined)
  const apogee = perigee && apsides.filter((a) => a.kind === 'apogee' && a.at < perigee.at).pop()
  if (!perigee || !apogee) return false
  return quarter.km - perigee.km <= SUPERMOON_SHARE * (apogee.km - perigee.km)
}

/** An eclipse at its greatest: which body is eclipsed and how (a lunar eclipse penumbral, partial or total; a solar one partial, annular or total). */
export interface Eclipse extends Instant {
  readonly body: 'lunar' | 'solar'
  readonly kind: 'penumbral' | 'partial' | 'annular' | 'total'
}

/** The lunar and solar eclipses from `from` to `to`, in order. */
export function eclipsesIn(from: Date, to: Date): readonly Eclipse[] {
  const found: Eclipse[] = []
  for (let e = SearchLunarEclipse(from); e.peak.date < to; e = NextLunarEclipse(e.peak)) found.push({ ...instantOf(e.peak.date), body: 'lunar', kind: e.kind })
  for (let e = SearchGlobalSolarEclipse(from); e.peak.date < to; e = NextGlobalSolarEclipse(e.peak)) found.push({ ...instantOf(e.peak.date), body: 'solar', kind: e.kind })
  return found.sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** The next lunar and the next solar eclipse after `from`. */
export function nextEclipses(from: Date): readonly Eclipse[] {
  const lunar = SearchLunarEclipse(from)
  const solar = SearchGlobalSolarEclipse(from)
  return [
    { ...instantOf(lunar.peak.date), body: 'lunar' as const, kind: lunar.kind },
    { ...instantOf(solar.peak.date), body: 'solar' as const, kind: solar.kind },
  ].sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** The Moon's tropical longitude at an instant (true ecliptic of date). */
export const moonLongitude = (at: Date): number => EclipticGeoMoon(at).lon

/**
 * The instant from `from` to `to` (under a day apart) the Moon enters its
 * next sign, by bisection to the second, and the sign; null where it enters
 * none in that span.
 */
export function moonEntersSign(from: Date, to: Date): (Instant & { readonly sign: string }) | null {
  const boundary = (Math.floor(moonLongitude(from) / SIGN_DEGREES) + 1) * SIGN_DEGREES
  const past = (at: Date) => {
    const d = turn(moonLongitude(at) - boundary)
    return d < FULL_TURN / 2
  }
  if (!past(to)) return null
  let held = from.getTime()
  let reached = to.getTime()
  while (reached - held > SECOND_MS) {
    const mid = (held + reached) / 2
    if (past(new Date(mid))) reached = mid
    else held = mid
  }
  return { ...instantOf(new Date(reached)), sign: ZODIAC_SIGNS[(boundary / SIGN_DEGREES) % ZODIAC_SIGNS.length].name }
}
