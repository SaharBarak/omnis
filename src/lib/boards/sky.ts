import { memoSky, type Sky } from '@pleiad/engine/calculations/sky-dates'

/**
 * One reading of the sky per day, shared by the day's boards and figures
 * (BENTO_V2.md "Rows open their calendar's board"): a noon read for one
 * cell, one search or one figure is never read again. Kept for the day and
 * the one before it, while a server answers across a UTC midnight. Server
 * only.
 */

const DAYS_KEPT = 2
const SKIES = new Map<string, Sky>()

/** The sky as read for `day`'s boards and figures. */
export function skyOf(day: string): Sky {
  const kept = SKIES.get(day)
  if (kept) return kept
  const sky = memoSky()
  SKIES.set(day, sky)
  for (const old of [...SKIES.keys()].slice(0, Math.max(0, SKIES.size - DAYS_KEPT))) SKIES.delete(old)
  return sky
}
