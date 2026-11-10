import { getLongCountData, PLACE_DAYS } from '@pleiad/engine/calculations/long-count'
import { BASE } from './maya-numeral'
import type { LongCountReading } from './types'

/**
 * A count past 19 baktuns carries into the places above it (piktun and on),
 * as Maya inscriptions write it, so every place stays one numeral.
 */
const carried = (n: number): readonly number[] => (n < BASE ? [n] : [...carried(Math.floor(n / BASE)), n % BASE])

/** The places' names, least significant first, as far as any four-digit year reaches, in the ALMG orthography the day signs keep (Piktun a modern name). */
export const PLACE_NAMES = ["K'in", 'Winal', 'Tun', "K'atun", "B'ak'tun", 'Piktun'] as const

const UNIT_DAYS: readonly number[] = [PLACE_DAYS.kin, PLACE_DAYS.winal, PLACE_DAYS.tun, PLACE_DAYS.katun, PLACE_DAYS.baktun]

/** Days in one unit of a place, least significant first; the places carried above the baktun count in twenties. */
export const placeDays = (unit: number): number =>
  unit < UNIT_DAYS.length ? UNIT_DAYS[unit] : UNIT_DAYS[UNIT_DAYS.length - 1] * BASE ** (unit - UNIT_DAYS.length + 1)

/** The Maya Long Count of a birth date and its calendar round (GMT correlation). Light: arithmetic only. */
export function buildLongCount(date: string): LongCountReading {
  const { longCount, calendarRound, daysSinceCreation } = getLongCountData(date)
  const places = [...carried(longCount.baktun), longCount.katun, longCount.tun, longCount.winal, longCount.kin]
  const { tzolkin, haab } = calendarRound
  return {
    places,
    date: places.join('.'),
    round: calendarRound.formatted,
    tzolkin: `${tzolkin.tone} ${tzolkin.daySign.yucatec}`,
    haab: `${haab.day} ${haab.monthName}`,
    days: daysSinceCreation,
  }
}
