import { chineseBoard } from './boards/chinese'
import { gateBoard } from './boards/gate'
import { kinBoard } from './boards/kin'
import { longCountBoard } from './boards/long-count'
import { hebrewBoard } from './boards/hebrew'
import { hijriBoard } from './boards/hijri'
import { moonBoard } from './boards/moon'
import { panchangBoard } from './boards/panchang'
import { persianBoard } from './boards/persian'
import { skyOf } from './boards/sky'
import { siderealBoard } from './boards/sidereal'
import { sunBoard } from './boards/sun'
import type { DayBoard } from './boards/types'
import type { TodayAcrossSystems } from '@/lib/today-board'

export type * from './boards/types'

/**
 * Each calendar's board for a day (docs/redesign/BENTO_V2.md "Rows open
 * their calendar's board"): the day's number and name in the calendar, the
 * calendar itself as cells that carry their symbols, numerals and civil
 * dates, the larger view it turns in, what comes next and its facts. Server
 * only (the sky is read from the ephemeris); clients receive the plain data
 * (`src/lib/boards/types.ts`). Each value is read where its calendar
 * reads a day, as the board's row is: at noon UTC, the Chinese calendar on
 * the day in Beijing, the Panchang at sunrise in Ujjain. A board that
 * cannot be read is left out, and its row opens its own words.
 */

export type TodayBoards = Partial<Readonly<Record<keyof TodayAcrossSystems, DayBoard>>>

const attempt = <T>(build: () => T): T | undefined => {
  try {
    return build()
  } catch {
    return undefined
  }
}

/** Days whose boards are kept: the day, and the one before it while a server answers across a UTC midnight. */
const DAYS_KEPT = 2
const BUILT = new Map<string, TodayBoards>()

/** Every board the engine can read for `day`, built once a day over one reading of its sky (`skyOf`): each is a function of the day alone. */
function boardsOf(day: string): TodayBoards {
  const kept = BUILT.get(day)
  if (kept) return kept
  const sky = skyOf(day)
  const builds: Readonly<Record<keyof TodayAcrossSystems, () => DayBoard | undefined>> = {
    kin: () => kinBoard(day),
    moon: () => moonBoard(day, sky),
    sun: () => sunBoard(day, sky),
    gate: () => gateBoard(day, sky),
    hebrewDate: () => hebrewBoard(day, sky),
    longCount: () => longCountBoard(day),
    sidereal: () => siderealBoard(day, sky),
    chineseYear: () => chineseBoard(day),
    hijri: () => hijriBoard(day, sky),
    persian: () => persianBoard(day),
    panchang: () => panchangBoard(day),
  }
  const built: TodayBoards = Object.fromEntries(
    (Object.keys(builds) as (keyof TodayAcrossSystems)[]).flatMap((field) => {
      const board = attempt(builds[field])
      return board ? [[field, board]] : []
    }),
  )
  BUILT.set(day, built)
  for (const old of [...BUILT.keys()].slice(0, Math.max(0, BUILT.size - DAYS_KEPT))) BUILT.delete(old)
  return built
}

/** Boards for `day` (YYYY-MM-DD), the day `board` was read for: one per filled row the engine can read. */
export function todayBoards(day: string, board: TodayAcrossSystems): TodayBoards {
  const built = boardsOf(day)
  return Object.fromEntries((Object.keys(built) as (keyof TodayAcrossSystems)[]).filter((field) => board[field] !== '').map((field) => [field, built[field]]))
}
