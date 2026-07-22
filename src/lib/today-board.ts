import {
  getTodayAcrossSystems as engineToday,
  type TodayAcrossSystems as EngineToday,
} from '@pleiad/engine/services/today'

/**
 * Server-side data for the split-flap "Today, across the systems" board
 * and the live footer line (docs/redesign/HOMEPAGE_SPEC.md §12, §16).
 * Computation lives in @pleiad/engine (shared with mobile); this adapter
 * keeps the web contract, where hebrewDate is always a string (node Intl
 * always has the Hebrew calendar) and adds the HD gate value.
 */

export interface TodayAcrossSystems {
  readonly kin: string
  readonly moon: string
  readonly sun: string
  readonly gate: string
  readonly hebrewDate: string
}

export function getTodayAcrossSystems(now: Date = new Date()): TodayAcrossSystems {
  const board: EngineToday = engineToday(now)
  return { ...board, hebrewDate: board.hebrewDate ?? '' }
}

export function getFooterLiveLine(today: TodayAcrossSystems): string {
  return `TODAY: ${today.kin.toUpperCase()} · ${today.hebrewDate.toUpperCase()}: THE CALENDARS ARE COUNTING`
}
