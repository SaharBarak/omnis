import type { SystemKey } from '@/lib/system-preferences'
import type { TodayAcrossSystems } from '@/lib/today-board'

/**
 * Which values a "today across the calendars" board shows, in what order and
 * under which system preference. Types only from today-board, so a client
 * can render rows without loading the engine that computes them.
 */

/** One board row: the value it shows, its label and the system preference that turns it on. */
export interface TodayRow {
  readonly field: keyof TodayAcrossSystems
  readonly label: string
  readonly system: SystemKey
}

/** Board rows in display order. Every surface that lists the day reads this table. */
export const TODAY_ROWS: readonly TodayRow[] = [
  { field: 'kin', label: 'Dreamspell kin', system: 'dreamspell' },
  { field: 'moon', label: 'Moon', system: 'moon' },
  { field: 'sun', label: 'Sun', system: 'astrology' },
  { field: 'gate', label: 'Human Design gate', system: 'humandesign' },
  { field: 'hebrewDate', label: 'Hebrew date', system: 'hebrew' },
  { field: 'longCount', label: 'Long Count', system: 'longcount' },
  { field: 'sidereal', label: 'Sidereal Sun', system: 'sidereal' },
  { field: 'chineseYear', label: 'Chinese year', system: 'chinese' },
  { field: 'hijri', label: 'Hijri date', system: 'hijri' },
  { field: 'persian', label: 'Persian date', system: 'persian' },
  { field: 'panchang', label: 'Panchang', system: 'panchang' },
]

export interface TodayRowValue {
  readonly field: keyof TodayAcrossSystems
  readonly label: string
  readonly value: string
}

/**
 * The rows to show: filled values, minus systems the user turned off. When
 * every row would be hidden the board shows all filled rows, because an empty
 * board reads as broken.
 */
export function todayRows(
  board: TodayAcrossSystems,
  enabled: Partial<Readonly<Record<SystemKey, boolean>>> = {},
): readonly TodayRowValue[] {
  const filled = TODAY_ROWS.filter((r) => board[r.field] !== '')
  const kept = filled.filter((r) => enabled[r.system] ?? true)
  return (kept.length > 0 ? kept : filled).map((r) => ({ field: r.field, label: r.label, value: board[r.field] }))
}

