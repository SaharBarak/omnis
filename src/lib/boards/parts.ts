import { daysFrom, noonOf, shiftDay, type DayRun } from '@pleiad/engine/calculations/day-search'
import { hebrewNumeral } from '@pleiad/engine/calculations/hebrew-calendar'
import type { MoonPhaseName } from '@pleiad/engine/calculations/moon'
import { QUARTERS } from '@pleiad/engine/calculations/sky-dates'
import { TRIGRAMS } from '@pleiad/engine/data/iching'
import { PLANETS } from '@pleiad/engine/data/planets'
import { SEALS } from '@pleiad/engine/data/seals'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { cellKeys, type BoardEvent, type BoardMark, type CalendarCell, type CalendarHead, type CalendarSection, type CellState, type LegendEntry, type Script } from './types'
import { dayWords, monthShort, weekdayWords } from './words'
import { elementGlyphSrc, planetGlyphSrc, sealGlyphSrc, signGlyphSrc } from '@/lib/design/glyph-paths'

/**
 * What every calendar's board is built from (BENTO_V2.md "Rows open their
 * calendar's board"): a day's words, a month laid in weeks from its
 * calendar's own first weekday, a calendar's numerals, and the marks the
 * boards draw. Server only: the words are written once, here.
 */

export const NOON = '12:00'
export const FULL_TURN = 360
export const SIGN_DEGREES = FULL_TURN / ZODIAC_SIGNS.length
export const WEEK = 7

/* ---------- days ---------- */

export { dateWords, dayWords, fromToday, monthShort, monthWords, weekdayWords, whenWords } from './words'

/** A cell's note where a run or a month begins on it: the month's short name. */
export const monthNote = (date: string, first: boolean): { readonly note?: string } =>
  first || noonOf(date).getUTCDate() === 1 ? { note: monthShort(date) } : {}

/** Where a date stands from the board's day. */
export const stateOf = (date: string, day: string): CellState => {
  const d = daysFrom(day, date)
  return d === 0 ? 'today' : d < 0 ? 'past' : 'ahead'
}

/** The days of a run, first to last. */
export const daysOf = (run: Pick<DayRun, 'first' | 'length'>): readonly string[] => Array.from({ length: run.length }, (_, i) => shiftDay(run.first, i))

/** The civil month `date` falls in, first day and length. */
export const civilMonth = (date: string): { readonly first: string; readonly length: number } => {
  const at = noonOf(date)
  return { first: shiftDay(date, 1 - at.getUTCDate()), length: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 0)).getUTCDate() }
}

/** The civil month `date` falls in and the next. */
export const twoCivilMonths = (date: string): readonly [ReturnType<typeof civilMonth>, ReturnType<typeof civilMonth>] => {
  const now = civilMonth(date)
  return [now, civilMonth(shiftDay(now.first, now.length))]
}

/**
 * A crossing's words on the cell a noon-ruled calendar marks it on
 * (`NoonCrossing.noon`): its name, and its own date where that is the day
 * before the cell, the crossing having fallen after that day's noon.
 */
export const crossingWords = (name: string, { date, noon }: { readonly date: string; readonly noon: string }): string => (date === noon ? name : `${name}, ${dayWords(date)}`)

/** An event from a crossing the engine found, with its mark and the view and cell it falls on, where it falls on one. */
export const event = (
  name: string,
  { date, inDays }: { readonly date: string; readonly inDays: number },
  mark?: BoardMark,
  at?: BoardEvent['at'],
): BoardEvent => ({
  name,
  date,
  inDays,
  ...(mark ? { mark } : {}),
  ...(at ? { at } : {}),
})

export const byDate = (a: { readonly inDays: number }, b: { readonly inDays: number }): number => a.inDays - b.inDays

/** A view's legend: the entries its cells carry, in the entries' order (BENTO_BOARDS.md "Keys"). */
export const keyedLegend = (entries: readonly LegendEntry[], sections: readonly CalendarSection[]): readonly LegendEntry[] => {
  const carried = new Set(sections.flatMap((section) => section.cells.flatMap(cellKeys)))
  return entries.filter((entry) => carried.has(entry.key))
}

/* ---------- weeks ---------- */

/** The locale whose week a calendar keeps (its first weekday and its weekend, from Intl's CLDR data). */
export type WeekLocale = 'en-US' | 'he-IL' | 'ar-SA' | 'fa-IR' | 'hi-IN'

interface WeekInfo {
  readonly firstDay: number
  readonly weekend: readonly number[]
}

/** A locale's week: Intl numbers its days 1 (Monday) to 7 (Sunday). A runtime without the week's data draws no board rather than a wrong week. */
const weekInfo = (locale: WeekLocale): WeekInfo => {
  const at = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => WeekInfo; weekInfo?: WeekInfo }
  const week = at.getWeekInfo?.() ?? at.weekInfo
  if (!week) throw new Error(`No week data for ${locale}`)
  return week
}

const NARROW = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow', timeZone: 'UTC' })

/**
 * A run of days laid in weeks from `locale`'s first weekday: the blanks
 * before its first day and a head per weekday (the weekend's marked).
 */
export function inWeeks(cells: readonly CalendarCell[], first: string, locale: WeekLocale, name?: string): CalendarSection {
  const week = weekInfo(locale)
  /* Intl's 1–7 (Monday–Sunday) as Date's 0–6 (Sunday–Saturday). */
  const start = week.firstDay % WEEK
  const weekend = new Set(week.weekend.map((d) => d % WEEK))
  /* The Sunday of the run's first week names the weekdays from it. */
  const sunday = shiftDay(first, -noonOf(first).getUTCDay())
  const heads: CalendarHead[] = Array.from({ length: WEEK }, (_, i) => {
    const weekday = (start + i) % WEEK
    const named = shiftDay(sunday, weekday)
    return { text: NARROW.format(noonOf(named)), said: weekdayWords(named), ...(weekend.has(weekday) ? { weekend: true } : {}) }
  })
  return { ...(name ? { name } : {}), columns: WEEK, offset: (noonOf(first).getUTCDay() - start + WEEK) % WEEK, heads, cells }
}

/* ---------- numerals ---------- */

/** The numerals a calendar writes its days in: Hebrew letters, or one of Intl's numbering systems. */
export type Numerals = 'hebrew' | 'latn' | 'arab' | 'arabext' | 'deva' | 'hanidec'

/** The language each set of numerals is read in. */
const NUMERAL_LANG: Readonly<Record<Numerals, string | undefined>> = { hebrew: 'he', latn: undefined, arab: 'ar', arabext: 'fa', deva: 'hi', hanidec: 'zh' }

const formats = new Map<Numerals, Intl.NumberFormat>()

/** `n` in a calendar's numerals, with the language that sets them. */
export function numeral(n: number, numerals: Numerals): Script {
  const lang = NUMERAL_LANG[numerals]
  if (numerals === 'hebrew') return { text: hebrewNumeral(n), lang }
  const format = formats.get(numerals) ?? new Intl.NumberFormat(`en-u-nu-${numerals}`, { useGrouping: false })
  formats.set(numerals, format)
  return { text: format.format(n), ...(lang ? { lang } : {}) }
}

/* ---------- marks ---------- */

export const moonMark = (angle: number): BoardMark => ({ kind: 'moon', angle })

/** Each quarter's elongation, so its mark is drawn at it. */
const QUARTER_ANGLE = new Map<MoonPhaseName, number>(QUARTERS.map(([angle, phase]) => [phase, angle]))

/** A quarter's face, drawn at its elongation. */
export const quarterMark = (phase: MoonPhaseName): BoardMark => moonMark(QUARTER_ANGLE.get(phase) ?? 0)

/** The key to a calendar whose days carry the Moon's face; such a day carries `MOON_KEY.key`. */
export const MOON_KEY: LegendEntry = { key: 'moon', mark: quarterMark('First Quarter'), words: "Each day's Moon at noon, UTC" }

/** A sign's glyph, by its name. */
export function signMark(name: string): BoardMark | undefined {
  const sign = ZODIAC_SIGNS.find((s) => s.name === name)
  return sign && { kind: 'glyph', src: signGlyphSrc(sign.number, sign.name) }
}

/** The sign a longitude falls in. */
export const signAt = (longitude: number) => ZODIAC_SIGNS[Math.floor((((longitude % FULL_TURN) + FULL_TURN) % FULL_TURN) / SIGN_DEGREES)]

/** A planet's glyph where one is drawn, else its symbol as a character. */
export function planetMark(id: string): BoardMark | undefined {
  const src = planetGlyphSrc(id)
  if (src) return { kind: 'glyph', src }
  const planet = PLANETS.find((p) => p.id === id)
  return planet && { kind: 'text', text: planet.symbol }
}

export const elementMark = (element: string): BoardMark => ({ kind: 'glyph', src: elementGlyphSrc(element) })

/** The day sign's glyph: the classic Maya day signs, numbered 1 (Imix) to 20 (Ajaw), as the seals are. */
export function daySignMark(n: number): BoardMark | undefined {
  const seal = SEALS.find((s) => s.number === n)
  return seal && { kind: 'glyph', src: sealGlyphSrc(seal.number, seal.english) }
}

/** The first of the eight trigram characters (☰ Heaven); each yin line adds its bit, top 1, middle 2, bottom 4. */
const TRIGRAM_BASE = 0x2630
const LINE_BITS = [4, 2, 1] as const

/** A trigram as its character, from its lines bottom first: ☰ Heaven, ☷ Earth. */
export function trigramCharacter(name: string): string {
  const lines = TRIGRAMS.find((t) => t.name === name)?.lines ?? []
  return String.fromCodePoint(TRIGRAM_BASE + lines.reduce<number>((code, line, i) => code + (line === 0 ? (LINE_BITS[i] ?? 0) : 0), 0))
}
