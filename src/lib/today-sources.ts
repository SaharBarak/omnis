import { unstable_cache } from 'next/cache'
import { noonOf } from '@pleiad/engine/calculations/day-search'
import type { DaySources } from '@/lib/site/v2-day'
import { getTodayAcrossSystems } from '@/lib/today-board'
import { todayBoards } from '@/lib/today-boards'
import { todayFigures } from '@/lib/today-figures'

/**
 * Everything a page reads a day from (docs/redesign/BENTO_V2.md "Rows open
 * their calendar's board"): the rows' values for the day (at its noon,
 * UTC, where a calendar reads no other instant: the Chinese calendar dates
 * in Beijing, the Panchang reads its sunrise in Ujjain), the figures drawn
 * from them and the calendars' boards. A function of the day
 * alone, and the sky's readings in it are costly, so it is built once for
 * every server: Next's data cache keeps it for the build (R2 under OpenNext,
 * keyed by the build, so a deploy never reads an older shape). In
 * development the code changes under one build, so each request builds it.
 * Server only.
 */

/** The day's sources, built here and now. */
export function daySourcesOf(day: string): Required<DaySources> {
  const board = getTodayAcrossSystems(noonOf(day))
  return { board, figures: todayFigures(day, board), boards: todayBoards(day, board) }
}

/** The day's sources, built once across servers for the build. */
export const daySources = (day: string): Promise<Required<DaySources>> =>
  process.env.NODE_ENV !== 'production'
    ? Promise.resolve(daySourcesOf(day))
    : unstable_cache(async () => daySourcesOf(day), ['day-sources', day], { revalidate: false })()
