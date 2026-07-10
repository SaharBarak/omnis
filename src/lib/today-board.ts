import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'

/**
 * Server-side data for the split-flap "Today, across the systems" board
 * and the live footer line (docs/redesign/HOMEPAGE_SPEC.md §12, §16).
 */

export interface TodayAcrossSystems {
  readonly kin: string
  readonly moon: string
  readonly sun: string
  readonly hebrewDate: string
}

const SYNODIC_MONTH = 29.530588853
/** New moon reference: 2000-01-06 18:14 UTC. */
const NEW_MOON_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14)

const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const

function moonPhase(date: Date): string {
  const days = (date.getTime() - NEW_MOON_EPOCH_MS) / 86_400_000
  const cycle = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const index = Math.floor((cycle / SYNODIC_MONTH) * 8 + 0.5) % 8
  return MOON_PHASES[index]
}

const ZODIAC_BOUNDS: readonly (readonly [number, number, string])[] = [
  [3, 21, 'Aries'],
  [4, 20, 'Taurus'],
  [5, 21, 'Gemini'],
  [6, 21, 'Cancer'],
  [7, 23, 'Leo'],
  [8, 23, 'Virgo'],
  [9, 23, 'Libra'],
  [10, 23, 'Scorpio'],
  [11, 22, 'Sagittarius'],
  [12, 22, 'Capricorn'],
  [1, 20, 'Aquarius'],
  [2, 19, 'Pisces'],
]

function sunSign(date: Date): string {
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  // Walk backwards: the sign whose start bound we've passed most recently.
  for (let i = ZODIAC_BOUNDS.length - 1; i >= 0; i -= 1) {
    const [m, d, sign] = ZODIAC_BOUNDS[i]
    if (month > m || (month === m && day >= d)) return sign
  }
  return 'Pisces' // Jan 1 – Jan 19 wraps to Capricorn via the loop; safety net.
}

function hebrewDate(date: Date): string {
  return new Intl.DateTimeFormat('en-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getTodayAcrossSystems(now: Date = new Date()): TodayAcrossSystems {
  const dateStr = now.toISOString().split('T')[0]
  const kin = dateToKin(dateStr)
  const seal = SEALS.find((s) => s.number === kinToSeal(kin))
  const tone = TONES.find((t) => t.number === kinToTone(kin))

  return {
    kin: `Kin ${kin} · ${tone?.name ?? ''} ${seal?.english ?? ''}`.trim(),
    moon: moonPhase(now),
    sun: `Sun in ${sunSign(now)}`,
    hebrewDate: hebrewDate(now),
  }
}

export function getFooterLiveLine(today: TodayAcrossSystems): string {
  return `TODAY: ${today.kin.toUpperCase()} · ${today.hebrewDate.toUpperCase()} — THE CALENDARS ARE COUNTING`
}
