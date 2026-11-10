/**
 * The weekly Torah reading, derived from the year's own shape: which
 * Shabbatot a festival takes, the portions the year is held to before
 * Pesach, Shavuot, Tisha B'Av and Rosh Hashanah (data/parashot.ts
 * ANCHOR_PORTIONS), and the joinable pairs that give way, in order, where a
 * stretch has fewer Shabbatot than portions (Shulchan Aruch, Orach Chayim
 * 428:4). Israel keeps one day of each festival and the diaspora two, so
 * the two read apart for a few weeks where a diaspora festival day falls on
 * Shabbat, and meet again at a pair Israel reads apart. Checked against the
 * published Hebcal schedules (CC BY 4.0) in parasha.test.ts.
 */

import { shiftDay } from './day-search'
import { hebrewDateIn, hebrewHolidaysIn, hebrewYearOf, nextHebrewYear, previousHebrewYear, roshChodeshIn, weekdayOf, type HebrewObservance, type HebrewYear, type HebrewYearMonth } from './hebrew-calendar'
import type { HebrewReckoning } from '../data/hebrew-holidays'
import type { HebrewMonthId } from '../data/hebrew-months'
import { ANCHOR_PORTIONS, JOIN_ORDER, PARASHOT, SPECIAL_SHABBATOT, type SpecialShabbatId } from '../data/parashot'

const SHABBAT = 6
const WEEK = 7
/** Rosh Hashanah's weekdays on which the year before reads Nitzavim and Vayeilech together: Thursday and Shabbat (Tur OC 428). */
const JOINED_BEFORE_ROSH_HASHANAH = new Set([4, SHABBAT])

/** One Shabbat's reading: the portions read (one, or a joined pair), or the festival whose reading replaces the week's. */
export interface ShabbatReading {
  readonly date: string
  readonly portions: readonly number[]
  readonly festival?: HebrewObservance
}

/** The Shabbatot from `first` up to (not including) `end`. */
function shabbatotFrom(first: string, end: string): readonly string[] {
  const dates: string[] = []
  for (let d = shiftDay(first, (SHABBAT - weekdayOf(first) + WEEK) % WEEK); d < end; d = shiftDay(d, WEEK)) dates.push(d)
  return dates
}

/** A stretch of the year between two held portions: its Shabbatot and the portions it reads, first to last. */
interface Stretch {
  readonly slots: readonly string[]
  readonly from: number
  readonly to: number
}

/** The pairs a stretch joins: as many as it is short of Shabbatot, by the order in which pairs give way; null where it cannot hold its portions. */
function joinsIn(stretch: Stretch): ReadonlySet<number> | null {
  const short = stretch.to - stretch.from + 1 - stretch.slots.length
  const open = JOIN_ORDER.filter((p) => p >= stretch.from && p + 1 <= stretch.to)
  return short >= 0 && short <= open.length ? new Set(open.slice(0, short)) : null
}

/** A stretch's portions laid on its Shabbatot, its joined pairs read together. */
function laid(stretch: Stretch, joins: ReadonlySet<number>): readonly ShabbatReading[] {
  const units: (readonly number[])[] = []
  for (let p = stretch.from; p <= stretch.to; p += joins.has(p) ? 2 : 1) units.push(joins.has(p) ? [p, p + 1] : [p])
  return stretch.slots.map((date, i) => ({ date, portions: units[i] ?? [] }))
}

/**
 * Stretches laid one after another. A stretch with more Shabbatot than
 * portions (Israel, a week ahead after Pesach in a leap year) cannot keep
 * its held portion: it runs on into the next stretch, which takes up the
 * week at a pair it reads apart.
 */
function layStretches(stretches: readonly Stretch[]): readonly ShabbatReading[] | null {
  const [head, next, ...rest] = stretches
  if (!head) return []
  const joins = joinsIn(head)
  if (!joins) return next ? layStretches([{ slots: [...head.slots, ...next.slots], from: head.from, to: next.to }, ...rest]) : null
  const tail = layStretches(next ? [next, ...rest] : [])
  return tail && [...laid(head, joins), ...tail]
}

/** The last of `dates` before `limit`, or on it with `onLimit`. */
const lastBefore = (dates: readonly string[], limit: string, onLimit = false): string | undefined => [...dates].reverse().find((d) => (onLimit ? d <= limit : d < limit))

const READINGS = new Map<string, readonly ShabbatReading[] | null>()

/** Every Shabbat of `year` and what is read on it, in `reckoning`; null where the runtime lacks the calendar or the year cannot be laid. */
export function torahReadings(year: HebrewYear, reckoning: HebrewReckoning = 'israel'): readonly ShabbatReading[] | null {
  const key = `${year.year}:${reckoning}`
  if (!READINGS.has(key)) READINGS.set(key, readingsOf(year, reckoning))
  return READINGS.get(key) ?? null
}

function readingsOf(year: HebrewYear, reckoning: HebrewReckoning): readonly ShabbatReading[] | null {
  const next = nextHebrewYear(year)
  const festivals = new Map(hebrewHolidaysIn(year, reckoning).filter((o) => o.holiday.kind === 'yomtov').map((o) => [o.date, o]))
  const shabbatot = shabbatotFrom(year.first, shiftDay(year.first, year.length))
  const regular = shabbatot.filter((d) => !festivals.has(d))
  const lastTishrei = [...festivals.values()].filter((o) => o.holiday.month === 'tishrei').pop()?.date ?? year.first
  const pre = regular.filter((d) => d < lastTishrei)
  const main = regular.filter((d) => d > lastTishrei)
  const pesach = hebrewDateIn(year, 'nisan', 15)
  const shavuot = hebrewDateIn(year, 'sivan', 6)
  const av = hebrewDateIn(year, 'av', 9)
  if (!next || !pesach || !shavuot || !av) return null
  const anchors = [lastBefore(main, pesach), lastBefore(main, shavuot), lastBefore(main, av, true), main[main.length - 1]]
  const held = [year.leap ? ANCHOR_PORTIONS.beforePesachLeap : ANCHOR_PORTIONS.beforePesachCommon, ANCHOR_PORTIONS.beforeShavuot, ANCHOR_PORTIONS.beforeTishaBav, ANCHOR_PORTIONS.beforeRoshHashanah]
  const stretches = anchors.map((anchor, i): Stretch => {
    const after = anchors[i - 1] ?? ''
    return { slots: main.filter((d) => d > after && anchor !== undefined && d <= anchor), from: (held[i - 1] ?? 0) + 1, to: held[i] ?? 0 }
  })
  const laidMain = anchors.every(Boolean) ? layStretches(stretches) : null
  if (!laidMain) return null
  const joinedAtEnd = JOINED_BEFORE_ROSH_HASHANAH.has(weekdayOf(next.first))
  const closing = laidMain.map((r, i) => (i === laidMain.length - 1 && joinedAtEnd ? { ...r, portions: [...r.portions, ANCHOR_PORTIONS.vayeilech] } : r))
  /* Between Rosh Hashanah and Sukkot: Vayeilech where the year before read it apart, then Ha'azinu. */
  const opening = pre.length === 0 ? [] : [ANCHOR_PORTIONS.vayeilech, ANCHOR_PORTIONS.haazinu].slice(-pre.length)
  const byDate = new Map<string, ShabbatReading>([...pre.map((date, i) => ({ date, portions: [opening[i] ?? ANCHOR_PORTIONS.haazinu] })), ...closing].map((r) => [r.date, r]))
  return shabbatot.map((date) => {
    const festival = festivals.get(date)
    return byDate.get(date) ?? { date, portions: [], ...(festival ? { festival } : {}) }
  })
}

/** A portion's place in a cycle: the date it is read (a Shabbat, or Simchat Torah for the last), and the portion it is read with that day. */
export interface CycleReading {
  readonly portion: number
  readonly date: string
  readonly joinedWith?: number
}

/** The cycle that opens with `year`'s Bereshit and closes on the next year's Simchat Torah. */
function cycleFrom(year: HebrewYear | null, reckoning: HebrewReckoning): readonly CycleReading[] | null {
  const next = year && nextHebrewYear(year)
  const opening = year && torahReadings(year, reckoning)
  const closing = next && torahReadings(next, reckoning)
  if (!next || !opening || !closing) return null
  const bereshit = opening.findIndex((r) => r.portions[0] === 1)
  const nextBereshit = closing.find((r) => r.portions[0] === 1)?.date ?? ''
  const simchatTorah = hebrewHolidaysIn(next, reckoning).find((o) => o.holiday.id === (reckoning === 'israel' ? 'shemini-atzeret' : 'simchat-torah'))
  if (bereshit < 0 || !simchatTorah) return null
  const read = [...opening.slice(bereshit), ...closing.filter((r) => r.date < nextBereshit)].flatMap((r) =>
    r.portions.map((portion) => {
      const partner = r.portions.find((p) => p !== portion)
      return { portion, date: r.date, ...(partner ? { joinedWith: partner } : {}) }
    }),
  )
  return [...read, { portion: ANCHOR_PORTIONS.vezotHaberakhah, date: simchatTorah.date }]
}

/**
 * The cycle of readings `day` falls in, Bereshit to Vezot HaBerakhah: from
 * the Shabbat after one Simchat Torah through the next Simchat Torah, on
 * which the last portion is read. Null where the runtime lacks the calendar.
 */
export function torahCycle(day: string, reckoning: HebrewReckoning = 'israel'): readonly CycleReading[] | null {
  const year = hebrewYearOf(day)
  const before = cycleFrom(year && previousHebrewYear(year), reckoning)
  const closed = before?.[before.length - 1]
  return closed && day <= closed.date ? before : cycleFrom(year, reckoning)
}

/** The reading of the week `day` falls in: the first on or after it, a Shabbat's portions or Simchat Torah's. */
export function weekReading(day: string, reckoning: HebrewReckoning = 'israel'): readonly CycleReading[] {
  const cycle = torahCycle(day, reckoning) ?? []
  const date = cycle.find((r) => r.date >= day)?.date
  return cycle.filter((r) => r.date === date)
}

/** Portions by name, a pair joined: "Vayakhel-Pekudei". */
export const portionsName = (portions: readonly number[]): string => portions.map((p) => PARASHOT[p - 1]?.name ?? '').join('-')

/** Portions by their Hebrew names, a pair joined: "ויקהל-פקודי". */
export const portionsHebrew = (portions: readonly number[]): string => portions.map((p) => PARASHOT[p - 1]?.hebrew ?? '').join('-')

/* ---------- named Shabbatot ---------- */

/** A Shabbat with a name of its own, and the month whose coming it blesses where it is Shabbat Mevarchim. */
export interface NamedShabbat {
  readonly date: string
  readonly id: SpecialShabbatId | 'mevarchim'
  readonly name: string
  readonly hebrew: string
  readonly blesses?: HebrewYearMonth
}

/** The first Shabbat after `date`. */
const shabbatAfter = (date: string): string => shiftDay(date, ((SHABBAT - weekdayOf(date) + WEEK - 1) % WEEK) + 1)
/** The last Shabbat before `date`. */
const shabbatBefore = (date: string): string => shiftDay(date, -(((weekdayOf(date) - SHABBAT + WEEK - 1) % WEEK) + 1))
/** The last Shabbat on or before `date`. */
const shabbatOnOrBefore = (date: string): string => (weekdayOf(date) === SHABBAT ? date : shabbatBefore(date))

const BESHALACH = PARASHOT.findIndex((p) => p.name === 'Beshalach') + 1

/**
 * The Shabbatot of `year` that carry a name (data/parashot.ts
 * SPECIAL_SHABBATOT): Shuva between Rosh Hashanah and Yom Kippur; Shekalim
 * on or before Rosh Chodesh Adar, Zachor before Purim, HaChodesh on or
 * before Rosh Chodesh Nisan and Parah the week before it (Shulchan Aruch OC
 * 685); HaGadol before Pesach (OC 430); Chazon on or before 9 Av and
 * Nachamu after it; Shirah, the Shabbat of Beshalach; and each Shabbat
 * Mevarchim, the last before a Rosh Chodesh but Tishrei's.
 */
export function namedShabbatot(year: HebrewYear, reckoning: HebrewReckoning = 'israel'): readonly NamedShabbat[] {
  const at = (month: HebrewMonthId, day: number): string | null => hebrewDateIn(year, month, day)
  const on = (date: string | null | undefined, place: (d: string) => string): string | undefined => (date ? place(date) : undefined)
  const hachodesh = on(at('nisan', 1), shabbatOnOrBefore)
  const dates: Readonly<Record<SpecialShabbatId, string | undefined>> = {
    shuva: on(at('tishrei', 2), shabbatAfter),
    shirah: torahReadings(year, reckoning)?.find((r) => r.portions.includes(BESHALACH))?.date,
    shekalim: on(at('adar', 1), shabbatOnOrBefore),
    zachor: on(at('adar', 14), shabbatBefore),
    parah: on(hachodesh, shabbatBefore),
    hachodesh,
    hagadol: on(at('nisan', 15), shabbatBefore),
    chazon: on(at('av', 9), shabbatOnOrBefore),
    nachamu: on(at('av', 9), shabbatAfter),
  }
  const named = SPECIAL_SHABBATOT.flatMap((s) => {
    const date = dates[s.id]
    return date ? [{ date, id: s.id, name: s.name, hebrew: s.hebrew }] : []
  })
  const firstDays = new Map<string, string>()
  for (const rc of roshChodeshIn(year)) if (!firstDays.has(rc.month.first)) firstDays.set(rc.month.first, rc.date)
  const mevarchim = year.months.slice(1).flatMap((blesses) => {
    const first = firstDays.get(blesses.first)
    return first ? [{ date: shabbatBefore(first), id: 'mevarchim' as const, name: `Shabbat Mevarchim ${blesses.name}`, hebrew: 'שבת מברכים', blesses }] : []
  })
  return [...named, ...mevarchim].sort((a, b) => a.date.localeCompare(b.date))
}
