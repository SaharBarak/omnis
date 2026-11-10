import type { SystemKey } from '@/lib/system-preferences'
import type { TodayAcrossSystems } from '@/lib/today-board'

/**
 * Which values a "today across the calendars" board shows, in what order and
 * under which system preference. Types only from today-board, so a client
 * can render rows without loading the engine that computes them.
 */

/** One board row: the value it shows, its label, what its value is (a card's head), and the system preference that turns it on. */
export interface TodayRow {
  readonly field: keyof TodayAcrossSystems
  readonly label: string
  readonly valueIs: string
  readonly system: SystemKey
}

/** Board rows in display order. Every surface that lists the day reads this table. */
export const TODAY_ROWS: readonly TodayRow[] = [
  { field: 'kin', label: 'Dreamspell kin', valueIs: 'Kin', system: 'dreamspell' },
  { field: 'moon', label: 'Moon', valueIs: 'Phase', system: 'moon' },
  { field: 'sun', label: 'Sun', valueIs: 'Sign', system: 'astrology' },
  { field: 'gate', label: 'Human Design gate', valueIs: 'Gate', system: 'humandesign' },
  { field: 'hebrewDate', label: 'Hebrew date', valueIs: 'Date', system: 'hebrew' },
  { field: 'longCount', label: 'Long Count', valueIs: 'Count', system: 'longcount' },
  { field: 'sidereal', label: 'Sidereal Sun', valueIs: 'Sign', system: 'sidereal' },
  { field: 'chineseYear', label: 'Chinese year', valueIs: 'Year', system: 'chinese' },
  { field: 'hijri', label: 'Hijri date', valueIs: 'Date', system: 'hijri' },
  { field: 'persian', label: 'Persian date', valueIs: 'Date', system: 'persian' },
  { field: 'panchang', label: 'Panchang', valueIs: 'Tithi', system: 'panchang' },
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

