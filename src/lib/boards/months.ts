import type { MonthCalendar } from '@pleiad/engine/calculations/calendars'
import { daysFrom, noonOf } from '@pleiad/engine/calculations/day-search'
import { byDate, dateWords, type Numerals, type WeekLocale } from './parts'
import type { BoardEvent, CalendarCell, CellState, Script, Tint } from './types'

/**
 * What the month calendars' boards share, Hebrew (hebrew.ts), Hijri
 * (hijri.ts) and Persian (persian.ts), each a month in weeks from its own
 * first weekday, its year and a figure of its own (BENTO_BOARDS.md
 * "Systems"): how a calendar writes itself, a cell's civil note and its
 * ground, a run's state, and Next placed on the cells its events fall on.
 */

/** How a calendar writes itself: Intl's calendar, the locale whose script and week it keeps, and its numerals. */
export interface MonthScript {
  readonly calendar: MonthCalendar
  readonly locale: WeekLocale
  readonly numerals: Numerals
}

export const HEBREW: MonthScript = { calendar: 'hebrew', locale: 'he-IL', numerals: 'hebrew' }
export const HIJRI: MonthScript = { calendar: 'islamic-umalqura', locale: 'ar-SA', numerals: 'arab' }
export const PERSIAN: MonthScript = { calendar: 'persian', locale: 'fa-IR', numerals: 'arabext' }

/** A locale's text direction, as Intl gives it where the runtime has `getTextInfo`. */
type WithTextInfo = Intl.Locale & { readonly getTextInfo?: () => { readonly direction?: string } }

/**
 * The order a calendar's own pages set its cells in, from its locale
 * (BENTO_BOARDS.md "Direction"): the view's `dir` where right to left,
 * nothing where left to right.
 */
export const scriptDir = (script: MonthScript): { readonly dir?: 'rtl' } =>
  (new Intl.Locale(script.locale) as WithTextInfo).getTextInfo?.().direction === 'rtl' ? { dir: 'rtl' } : {}

/** A year's months set in three rows, so a common year's twelve stand four abreast. */
const YEAR_ROWS = 3
export const yearColumns = (months: number): number => Math.ceil(months / YEAR_ROWS)

/** One month-name formatter per calendar script. */
const NATIVE_FORMATS = new Map<MonthScript, Intl.DateTimeFormat>()
const nativeFormat = (script: MonthScript): Intl.DateTimeFormat => {
  const kept = NATIVE_FORMATS.get(script)
  if (kept) return kept
  const made = new Intl.DateTimeFormat(`${script.locale}-u-ca-${script.calendar}`, { month: 'long', timeZone: 'UTC' })
  NATIVE_FORMATS.set(script, made)
  return made
}

/** A month's name in the calendar's own script, as Intl writes it: חשוון. */
export const nativeMonth = (date: string, script: MonthScript): Script => ({
  text: nativeFormat(script).formatToParts(noonOf(date)).find((p) => p.type === 'month')?.value ?? '',
  lang: script.locale.slice(0, 2),
})

/** A civil day's note: its number, its month named where the month begins on it or the run does. */
export const civilNote = (date: string, first: boolean): string => (first || noonOf(date).getUTCDate() === 1 ? dateWords(date) : String(noonOf(date).getUTCDate()))

/** A run of days: its first civil day and its length. */
export interface Run {
  readonly first: string
  readonly length: number
}

export const inRun = (run: Run, date: string): boolean => date >= run.first && daysFrom(run.first, date) < run.length

/** Where a run stands from the board's day. */
export const runState = (run: Run, day: string): CellState => (inRun(run, day) ? 'today' : run.first > day ? 'ahead' : 'past')

/**
 * A cell's ground: its bands and its source colour. A band's ground would
 * cover a tint, so a tinted cell keeps its tint and lists its bands among
 * its keys; an untinted one takes its first band, the rest as keys.
 */
export function ground(bands: readonly string[], tint: { readonly tint: Tint; readonly key: string } | undefined, keys: readonly string[]): Pick<CalendarCell, 'band' | 'tint' | 'keys'> {
  const [band, ...more] = tint ? [] : bands
  const all = [...keys, ...(tint ? [tint.key, ...bands] : more)]
  return { ...(band ? { band } : {}), ...(tint ? { tint: tint.tint } : {}), ...(all.length > 0 ? { keys: all } : {}) }
}

/** Where a view finds the cell a date falls on, if it has one. */
export interface CellFinder {
  readonly view: string
  readonly cell: (date: string) => string | undefined
}

/** The month view's cell for a date in its run: the date itself. */
export const dayFinder = (view: string, run: Run): CellFinder => ({ view, cell: (date) => (inRun(run, date) ? date : undefined) })

/** The year view's cell for a date in one of its months: the month's first day. */
export const monthFinder = (view: string, months: readonly Run[]): CellFinder => ({ view, cell: (date) => months.find((m) => inRun(m, date))?.first })

/** Next, nearest first, the first `count`: each event that names no cell named to the first view that holds its date. */
export const placed = (events: readonly BoardEvent[], finders: readonly CellFinder[], count: number): readonly BoardEvent[] =>
  [...events]
    .sort(byDate)
    .slice(0, count)
    .map((e) => {
      if (e.at) return e
      const found = finders.map((f) => ({ view: f.view, cell: f.cell(e.date) })).find((f) => f.cell !== undefined)
      return found?.cell ? { ...e, at: { view: found.view, cell: found.cell } } : e
    })
