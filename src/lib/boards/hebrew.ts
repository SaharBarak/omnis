import { daysFrom } from '@pleiad/engine/calculations/day-search'
import {
  HEBREW_SEASONS,
  hebrewDateIn,
  hebrewDayOf,
  hebrewEvesIn,
  hebrewHolidaysIn,
  hebrewNumeral,
  hebrewSeasonsIn,
  moladOf,
  nextHebrewYear,
  omerDayOf,
  omerSefirot,
  roshChodeshIn,
  weekdayOf,
  type HebrewDay,
  type HebrewDayKind,
  type HebrewObservance,
  type HebrewYear,
  type HebrewYearMonth,
  type Molad,
} from '@pleiad/engine/calculations/hebrew-calendar'
import { namedShabbatot, portionsName, torahCycle, torahReadings, weekReading, type CycleReading, type ShabbatReading } from '@pleiad/engine/calculations/parasha'
import { elongationOf, type Sky } from '@pleiad/engine/calculations/sky-dates'
import { LETTER_BY_CHAR } from '@pleiad/engine/data/hebrew-letters'
import { ANCHOR_PORTIONS, PARASHOT, TORAH_BOOKS } from '@pleiad/engine/data/parashot'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { HEBREW, civilNote, dayFinder, ground, inRun, monthFinder, nativeMonth, placed, runState, scriptDir, yearColumns, type Run } from './months'
import { MOON_KEY, NOON, dateWords, dayWords, daysOf, event, inWeeks, keyedLegend, moonMark, numeral, quarterMark, signMark, stateOf, weekdayWords } from './parts'
import type { BoardEvent, BoardMark, CalendarCell, CalendarSection, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { days, fact } from '@/lib/atlas/explain'

/**
 * The Hebrew date's board (BENTO_BOARDS.md "Systems", Hebrew): the month in
 * weeks from Sunday, each day its Moon, its numeral in letters and what is
 * kept on it, Shabbat and Yom Tov in red; the year's months under the signs
 * Sefer Yetzirah sets over them; the cycle of the fifty-four portions. Days
 * are kept as in Israel, the diaspora's named where it differs. The engine
 * (hebrew-calendar.ts, parasha.ts) owns the dates; this file the words.
 */

const SHABBAT = 6
const NEXT_COUNT = 6
const PORTION_COLUMNS = 6

const HOLIDAY: BoardMark = { kind: 'text', text: '✦' }
const NEW_MOON = quarterMark('New Moon')

const REST: LegendEntry = { key: 'rest', tint: 'red', words: 'Shabbat and Yom Tov, the days of rest' }
const RED = { tint: 'red', key: REST.key } as const

const HANUKKAH: LegendEntry = { key: 'hanukkah', band: 'hanukkah', words: 'The eight days of Hanukkah' }
const SEASON_KEYS: readonly LegendEntry[] = [...HEBREW_SEASONS.map((s) => ({ key: s.id, band: s.id, words: `${s.name}: ${s.note}` })), HANUKKAH]

const KIND_WORDS: Readonly<Record<HebrewDayKind, string>> = {
  yomtov: 'A festival of the Torah',
  major: 'Hanukkah and Purim',
  fast: 'A fast day, moved off Shabbat where it falls on one',
  minor: 'A minor day',
  modern: 'A day of the State of Israel, moved off Shabbat as the Knesset rules',
}
const KIND_KEYS: readonly LegendEntry[] = (Object.keys(KIND_WORDS) as HebrewDayKind[]).map((kind) => ({ key: kind, words: KIND_WORDS[kind] }))

const DAY_KEYS: readonly LegendEntry[] = [
  { key: 'erev', words: 'An eve: the day before a holiday kept from its sundown' },
  { key: 'rosh-chodesh', words: 'Rosh Chodesh: the new month, two days where the month before has thirty' },
  { key: 'molad', words: 'The molad: the mean new moon the months are reckoned by, in Jerusalem' },
  { key: 'named', words: 'A Shabbat with a name of its own; Mevarchim blesses the coming month' },
  { key: 'diaspora', words: 'Kept otherwise in the diaspora: a second festival day, or another portion' },
]

const SIGN_KEY: LegendEntry = { key: 'sign', ...(signMark('Aries') ? { mark: signMark('Aries') } : {}), words: 'The sign Sefer Yetzirah sets over the month, with its letter and faculty (Gra version 5:1–10)' }

const BOOK_KEYS: readonly LegendEntry[] = TORAH_BOOKS.map(({ book, hebrew }) => ({ key: book, band: book, words: `${book}, ${hebrew}` }))
const PORTION_KEYS: readonly LegendEntry[] = [
  { key: 'joined', words: 'Read with its neighbour as one Shabbat this cycle' },
  { key: 'diaspora', words: 'Read in the diaspora on another Shabbat' },
  { key: 'festival-read', words: 'Read on Simchat Torah, not on a Shabbat' },
]

/** A holiday's day by its short name: its own name where the day has one (Hoshana Rabba), else the holiday's. */
const shortName = (o: HebrewObservance): string => o.holiday.named?.[o.day]?.name ?? (o.holiday.span ? o.holiday.name : o.name)

/** A Shabbat's reading in words: its portions, or the festival read in their place. */
const readingName = (r: ShabbatReading | undefined): string | undefined =>
  r && (r.portions.length > 0 ? portionsName(r.portions) : r.festival && shortName(r.festival))

const clock = (m: Molad): string => `${m.hour}:${String(m.minute).padStart(2, '0')}`

/** The molad as announced: "Kislev: Monday 9 Nov, 22:27 and 3 chalakim". */
const moladWords = (month: HebrewYearMonth, m: Molad): string => `${month.name}: ${weekdayWords(m.date)} ${dateWords(m.date)}, ${clock(m)} and ${m.parts} chalakim`

const on = <T extends { readonly date: string }>(list: readonly T[], date: string): readonly T[] => list.filter((x) => x.date === date)

/** What the board reads from the engine: this year's days and the next year's, whose eve and molad can fall in this year's last month. */
function almanac(year: HebrewYear) {
  const years = [year, nextHebrewYear(year)].flatMap((y) => (y ? [y] : []))
  const israel = years.flatMap((y) => hebrewHolidaysIn(y, 'israel'))
  const restInIsrael = new Set(israel.filter((o) => o.rest).map((o) => o.date))
  return {
    israel,
    secondDays: years.flatMap((y) => hebrewHolidaysIn(y, 'diaspora')).filter((o) => o.rest && !restInIsrael.has(o.date)),
    eves: years.flatMap((y) => hebrewEvesIn(y)),
    newMonths: years.flatMap(roshChodeshIn),
    named: years.flatMap((y) => namedShabbatot(y)),
    readings: years.flatMap((y) => torahReadings(y, 'israel') ?? []),
    abroad: years.flatMap((y) => torahReadings(y, 'diaspora') ?? []),
    spans: years.flatMap(hebrewSeasonsIn),
    molads: years.flatMap((y) => y.months.map((month, i) => ({ month, molad: moladOf(y.year, i) }))),
  }
}
type Almanac = ReturnType<typeof almanac>

/* ---------- month ---------- */

function dayCell(date: string, n: number, here: HebrewDay, al: Almanac, day: string, moonOn: (date: string) => BoardMark): CalendarCell {
  const holidays = on(al.israel, date)
  const shabbat = weekdayOf(date) === SHABBAT
  const reading = shabbat ? al.readings.find((r) => r.date === date) : undefined
  const read = readingName(reading)
  const abroad = shabbat ? al.abroad.find((r) => r.date === date) : undefined
  /* A festival read abroad is named by its second day. */
  const readAbroad = abroad?.portions.length ? readingName(abroad) : undefined
  const eves = on(al.eves, date)
  const newMonth = on(al.newMonths, date)
  const events: CellEvent[] = [
    ...holidays.map((o) => ({ name: o.name, key: o.holiday.kind })),
    ...eves.map((e) => ({ name: e.name, key: 'erev' })),
    ...newMonth.map((r) => ({ name: `Rosh Chodesh ${r.month.name}${r.of > 1 ? `, day ${r.day} of ${r.of}` : ''}`, key: 'rosh-chodesh' })),
    ...al.molads.filter((m) => m.molad.date === date).map((m) => ({ name: `Molad ${moladWords(m.month, m.molad)}`, key: 'molad' })),
    ...on(al.named, date).map((s) => ({ name: s.name, key: 'named' })),
    ...on(al.secondDays, date).map((o) => ({ name: `Diaspora: ${o.name}`, key: 'diaspora' })),
    ...(readAbroad && readAbroad !== read ? [{ name: `Diaspora: ${readAbroad}`, key: 'diaspora' }] : []),
  ]
  const first = holidays[0]
  const title = read ?? (first ? shortName(first) : eves[0]?.name ?? (newMonth.length > 0 ? 'Rosh Chodesh' : undefined))
  const bands = [...(holidays.some((o) => o.holiday.id === 'hanukkah') ? [HANUKKAH.key] : []), ...al.spans.filter((s) => s.first <= date && date <= s.last).map((s) => s.season.id)]
  const omer = omerDayOf(date, here.year)
  const sefirot = omer ? omerSefirot(omer) : null
  const rest = shabbat || holidays.some((o) => o.rest)
  return {
    key: date,
    mark: moonOn(date),
    label: numeral(n, 'hebrew'),
    ...(title ? { title } : {}),
    note: civilNote(date, n === 1),
    ...(events.length > 0 ? { events } : {}),
    ...ground(bands, rest ? RED : undefined, [MOON_KEY.key]),
    state: stateOf(date, day),
    said: [
      dayWords(date),
      `${n} ${here.month.name} ${here.year.year}`,
      ...(read ? [reading?.portions.length ? `Parashat ${read}` : `The reading of ${read}`] : []),
      ...events.map((e) => e.name),
      ...(omer && sefirot ? [`Omer day ${omer}, ${sefirot.day.name} of ${sefirot.week.name}`] : []),
    ].join(' · '),
  }
}

function monthView(day: string, here: HebrewDay, al: Almanac, moonOn: (date: string) => BoardMark): CalendarView {
  const run: Run = { first: here.month.first, length: here.month.length }
  const cells = daysOf(run).map((date, i) => dayCell(date, i + 1, here, al, day, moonOn))
  const sections: CalendarSection[] = [inWeeks(cells, run.first, HEBREW.locale)]
  return {
    id: 'month',
    layout: 'grid',
    ...scriptDir(HEBREW),
    name: `${here.month.name} ${here.year.year}`,
    tab: 'Month',
    sections,
    legend: keyedLegend([MOON_KEY, REST, ...SEASON_KEYS, ...KIND_KEYS, ...DAY_KEYS], sections),
    caption: `Day ${here.day} of ${here.month.length}, ${here.month.name}; kept as in Israel`,
  }
}

/* ---------- year ---------- */

function yearView(day: string, year: HebrewYear, al: Almanac): CalendarView {
  const cells = year.months.map((m): CalendarCell => {
    const run: Run = { first: m.first, length: m.length }
    const events = al.israel.filter((o) => o.day === 1 && inRun(run, o.date)).map((o) => ({ name: `${shortName(o)}, ${dateWords(o.date)}`, key: o.holiday.kind }))
    const sign = ZODIAC_SIGNS[m.month.sign]
    const mark = sign && signMark(sign.name)
    const letter = LETTER_BY_CHAR[m.month.letter]
    return {
      key: m.first,
      ...(mark ? { mark } : {}),
      label: nativeMonth(m.first, HEBREW),
      title: m.name,
      note: dateWords(m.first),
      ...(events.length > 0 ? { events } : {}),
      keys: [SIGN_KEY.key],
      state: runState(run, day),
      said: [
        `${m.name} ${year.year}`,
        days(m.length),
        `from ${dayWords(m.first)}`,
        `Sefer Yetzirah: ${m.month.letter} ${letter?.name ?? ''}, ${m.month.faculty.english}, ${sign?.name ?? ''}`,
        ...events.map((e) => e.name),
      ].join(' · '),
    }
  })
  const sections: CalendarSection[] = [{ columns: yearColumns(cells.length), cells }]
  const pesach = hebrewDateIn(year, 'nisan', 15)
  return {
    id: 'year',
    layout: 'grid',
    ...scriptDir(HEBREW),
    name: `The year ${year.year}`,
    tab: 'Year',
    sections,
    legend: keyedLegend([SIGN_KEY, ...KIND_KEYS], sections),
    caption: `${year.keviah.letters}: Rosh Hashanah on ${weekdayWords(year.first)}${pesach ? `, Pesach on ${weekdayWords(pesach)}` : ''}; a ${year.keviah.kind} ${year.leap ? 'leap' : 'common'} year of ${year.length} days`,
  }
}

/* ---------- parasha ---------- */

function portionCell(portion: (typeof PARASHOT)[number], cycle: readonly CycleReading[], abroad: readonly CycleReading[], week: CycleReading): CalendarCell {
  const read = cycle.find((r) => r.portion === portion.number)
  const there = abroad.find((r) => r.portion === portion.number)
  const differs = there !== undefined && (there.date !== read?.date || there.joinedWith !== read.joinedWith)
  const festival = portion.number === ANCHOR_PORTIONS.vezotHaberakhah
  const partner = read?.joinedWith ? PARASHOT[read.joinedWith - 1] : undefined
  const keys = [...(partner ? ['joined'] : []), ...(differs ? ['diaspora'] : []), ...(festival ? ['festival-read'] : [])]
  return {
    key: String(portion.number),
    label: { text: portion.hebrew, lang: 'he' },
    title: portion.name,
    ...(read ? { note: dateWords(read.date) } : {}),
    band: portion.book,
    ...(keys.length > 0 ? { keys } : {}),
    state: portion.number === week.portion ? 'today' : read && read.date < week.date ? 'past' : 'ahead',
    said: [
      `Parashat ${portion.name}, ${portion.number} of ${PARASHOT.length}`,
      portion.book,
      ...(read ? [`read ${dayWords(read.date)}`] : []),
      ...(partner ? [`with ${partner.name}`] : []),
      ...(differs && there ? [`in the diaspora ${dayWords(there.date)}`] : []),
      ...(festival ? ['read on Simchat Torah'] : []),
    ].join(' · '),
  }
}

function parashaView(day: string): CalendarView | undefined {
  const cycle = torahCycle(day)
  const week = weekReading(day)[0]
  if (!cycle || !week) return undefined
  const abroad = torahCycle(day, 'diaspora') ?? []
  const sections: CalendarSection[] = TORAH_BOOKS.map(({ book, hebrew }) => ({
    name: `${book} · ${hebrew}`,
    columns: PORTION_COLUMNS,
    cells: PARASHOT.filter((p) => p.book === book).map((p) => portionCell(p, cycle, abroad, week)),
  }))
  const pairs = cycle.filter((r) => r.joinedWith !== undefined && r.portion < r.joinedWith).length
  return {
    id: 'parasha',
    layout: 'grid',
    ...scriptDir(HEBREW),
    name: 'The weekly portions',
    tab: 'Parasha',
    sections,
    legend: keyedLegend([...BOOK_KEYS, ...PORTION_KEYS], sections),
    caption: `${PARASHOT[week.portion - 1]?.name ?? ''}, ${dayWords(week.date)}: portion ${week.portion} of ${PARASHOT.length}; ${pairs} pairs joined this cycle`,
  }
}

/* ---------- board ---------- */

function nextEvents(day: string, al: Almanac, parasha: CalendarView | undefined): readonly BoardEvent[] {
  const ahead = <T extends { readonly date: string }>(x: T): boolean => x.date > day
  const when = (date: string) => ({ date, inDays: daysFrom(day, date) })
  const week = weekReading(day)
  const first = week[0]
  return [
    ...al.israel.filter((o) => o.day === 1 && ahead(o)).map((o) => event(shortName(o), when(o.date), HOLIDAY)),
    ...al.eves.filter(ahead).map((e) => event(e.name, when(e.date))),
    ...al.newMonths.filter((r) => r.day === 1 && ahead(r)).map((r) => event(`Rosh Chodesh ${r.month.name}`, when(r.date), NEW_MOON)),
    ...al.molads.filter((m) => m.molad.date > day).map((m) => event(`Molad ${m.month.name}, ${clock(m.molad)}`, when(m.molad.date), NEW_MOON)),
    ...(first && first.date >= day && parasha
      ? [event(`Parashat ${portionsName(week.map((r) => r.portion))}`, when(first.date), undefined, { view: parasha.id, cell: String(first.portion) })]
      : []),
  ]
}

/** The facts of the day: the year in letters, its keviah and cycles, the coming molad, the week's portion, the Omer, and Sefer Yetzirah's month. */
function facts(day: string, here: HebrewDay, al: Almanac) {
  const { year, month } = here
  const at = al.molads.findIndex((m) => m.month === month)
  const coming = al.molads[at + 1]
  const week = weekReading(day)
  const abroad = weekReading(day, 'diaspora')
  const read = portionsName(week.map((r) => r.portion))
  const readAbroad = portionsName(abroad.map((r) => r.portion))
  const omer = omerDayOf(day, year)
  const sefirot = omer ? omerSefirot(omer) : null
  const sign = ZODIAC_SIGNS[month.month.sign]
  return [
    fact('Year', `${year.year} · ${hebrewNumeral(year.year)}`),
    fact('Keviah', `${year.keviah.letters}: a ${year.keviah.kind} ${year.leap ? 'leap' : 'common'} year of ${days(year.length)}`),
    fact('Cycle', `Year ${year.cycleYear} of 19${year.leap ? ', a leap year' : ''}`),
    fact('Shmita', year.shmitaYear === 7 ? 'The shmita, the seventh year' : `Year ${year.shmitaYear} of 7`),
    ...(coming ? [fact('Molad', moladWords(coming.month, coming.molad))] : []),
    ...(week[0] ? [fact('Parasha', `${read}, ${dayWords(week[0].date)}${readAbroad && readAbroad !== read ? `; diaspora ${readAbroad}` : ''}`)] : []),
    ...(omer && sefirot ? [fact('Omer', `Day ${omer}: ${sefirot.day.name} of ${sefirot.week.name}`)] : []),
    fact('Sefer Yetzirah', `${month.month.letter} ${LETTER_BY_CHAR[month.month.letter]?.name ?? ''} · ${month.month.faculty.english} · ${sign?.name ?? ''}`),
    fact('Weekday', weekdayWords(day)),
  ]
}

export function hebrewBoard(day: string, sky: Sky): DayBoard | undefined {
  const here = hebrewDayOf(day)
  if (!here) return undefined
  const al = almanac(here.year)
  const elongation = elongationOf(sky)
  const moonOn = (date: string) => moonMark(elongation(date, NOON))
  const month = monthView(day, here, al, moonOn)
  const year = yearView(day, here.year, al)
  const parasha = parashaView(day)
  const native = nativeMonth(day, HEBREW)
  const today = on(al.israel, day).map(shortName)
  return {
    value: `${here.day} ${here.month.name} ${here.year.year}`,
    meaning: null,
    mast: {
      numeral: numeral(here.day, 'hebrew'),
      title: `${here.month.name} ${here.year.year}`,
      words: [{ text: weekdayWords(day) }, ...today.map((text) => ({ text, mark: HOLIDAY })), { text: `a ${here.month.length}-day month` }],
      script: { text: `${native.text} ${hebrewNumeral(here.year.year)}`, lang: 'he' },
      mark: moonOn(day),
    },
    facts: facts(day, here, al),
    views: [month, year, ...(parasha ? [parasha] : [])],
    next: placed(nextEvents(day, al, parasha), [dayFinder(month.id, { first: here.month.first, length: here.month.length }), monthFinder(year.id, here.year.months)], NEXT_COUNT),
  }
}
