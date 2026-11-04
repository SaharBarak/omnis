import { getLongCountData } from '@pleiad/engine/calculations/long-count'
import { BASE } from './maya-numeral'
import type { LongCountReading } from './types'

/**
 * A count past 19 baktuns carries into the places above it (piktun and on),
 * as Maya inscriptions write it, so every place stays one numeral.
 */
const carried = (n: number): readonly number[] => (n < BASE ? [n] : [...carried(Math.floor(n / BASE)), n % BASE])

/** The Maya Long Count of a birth date and its calendar round (GMT correlation). Light: arithmetic only. */
export function buildLongCount(date: string): LongCountReading {
  const { longCount, calendarRound, daysSinceCreation } = getLongCountData(date)
  const places = [...carried(longCount.baktun), longCount.katun, longCount.tun, longCount.winal, longCount.kin]
  return { places, date: places.join('.'), round: calendarRound.formatted, days: daysSinceCreation }
}
