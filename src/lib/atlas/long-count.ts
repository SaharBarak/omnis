import { formatLongCount, getLongCountData } from '@pleiad/engine/calculations/long-count'
import type { LongCountReading } from './types'

/** The Maya Long Count of a birth date and its calendar round (GMT correlation). Light: arithmetic only. */
export function buildLongCount(date: string): LongCountReading {
  const { longCount, calendarRound } = getLongCountData(date)
  return {
    places: [longCount.baktun, longCount.katun, longCount.tun, longCount.winal, longCount.kin],
    date: formatLongCount(longCount),
    round: calendarRound.formatted,
  }
}
