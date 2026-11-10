import { daysFrom, noonOf, shiftDay } from '@pleiad/engine/calculations/day-search'
import {
  HIJRI_DAYS,
  HIJRI_SPANS,
  hijriDateOf,
  hijriDaysIn,
  hijriStretchesIn,
  nextHijriYear,
  type HijriDate,
  type HijriDayKind,
  type HijriObservance,
  type HijriYear,
} from '@pleiad/engine/calculations/hijri-calendar'
import { elongationOf, type Sky } from '@pleiad/engine/calculations/sky-dates'
import { HIJRI, civilNote, dayFinder, ground, inRun, monthFinder, placed, runState, scriptDir, yearColumns, type Run } from './months'
import { MOON_KEY, NOON, dateWords, dayWords, daysOf, event, inWeeks, keyedLegend, moonMark, numeral, quarterMark, stateOf, weekdayWords } from './parts'
import type { BoardEvent, BoardMark, CalendarCell, CalendarSection, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { days, fact } from '@/lib/atlas/explain'

/**
 * The Hijri date's board (BENTO_BOARDS.md "Systems", Hijri): the month in
 * weeks, each day its Moon and its numeral, Fridays marked, the white days
 * and the stretches of Ramadan and the Hajj banded, a night's day marked on
 * the evening it begins; the year's months with what their names mean, the
 * sacred months and Ramadan banded. Months are matched by number
 * (hijri-calendar.ts), the dates Umm al-Qura's, a sighted month's expected.
 */

const FRIDAY = 5
const NEXT_COUNT = 5
const SIGHTED = 'expected; set by sighting'

const NEW_MOON = quarterMark('New Moon')
const HOLIDAY: BoardMark = { kind: 'text', text: '✦' }

const SPAN_KEYS: readonly LegendEntry[] = HIJRI_SPANS.map((s) => ({ key: s.id, band: s.id, words: `${s.name}, ${s.arabic}: ${s.note}` }))

const KIND_WORDS: Readonly<Record<HijriDayKind, string>> = {
  eid: 'An Eid, a festival',
  day: 'A day of the year',
  night: 'A night, kept from the sunset that ends the day before',
}
const KIND_KEYS: readonly LegendEntry[] = (Object.keys(KIND_WORDS) as HijriDayKind[]).map((kind) => ({ key: kind, words: KIND_WORDS[kind] }))

const JUMUAH: LegendEntry = { key: 'jumuah', words: 'Friday: Jumuʻah, the congregational prayer at noon' }

const MONTH_KEYS: readonly LegendEntry[] = [
  { key: 'sacred', band: 'sacred', words: 'A sacred month, in which fighting is forbidden (Qurʼan 9:36)' },
  { key: 'ramadan', band: 'ramadan', words: 'Ramadan, the month of fasting' },
]

/** The months begun by sighting the crescent: those of the table's sighted days. */
const sightedMonths: ReadonlySet<number> = new Set(HIJRI_DAYS.filter((d) => d.sighted).map((d) => d.month))
const RAMADAN = HIJRI_DAYS.find((d) => d.id === 'ramadan')?.month
const WEEK = 7

/** The day a holiday is kept from: a night from the evening before. */
const keptFrom = (o: HijriObservance): string => o.evening ?? o.date

/** A holiday's name where it is marked: a night's on its evening, from sunset. */
const keptName = (o: HijriObservance): string => (o.evening ? `${o.holiday.name}, from sunset` : o.holiday.name)

function almanac(year: HijriYear) {
  const years = [year, nextHijriYear(year)].flatMap((y) => (y ? [y] : []))
  return { years, days: years.flatMap(hijriDaysIn), stretches: years.flatMap(hijriStretchesIn) }
}
type Almanac = ReturnType<typeof almanac>

/* ---------- month ---------- */

function dayCell(date: string, n: number, here: HijriDate, al: Almanac, day: string, moonOn: (date: string) => BoardMark): CalendarCell {
  const kept = al.days.filter((o) => keptFrom(o) === date)
  const friday = noonOf(date).getUTCDay() === FRIDAY
  const events: CellEvent[] = [...kept.map((o) => ({ name: keptName(o), key: o.holiday.kind })), ...(friday ? [{ name: 'Jumuʻah', key: JUMUAH.key }] : [])]
  const bands = al.stretches.filter((s) => s.first <= date && date <= s.last).map((s) => s.span.id)
  const title = kept.find((o) => !o.evening)?.holiday.name
  const sighted = kept.some((o) => o.holiday.sighted)
  return {
    key: date,
    mark: moonOn(date),
    label: numeral(n, HIJRI.numerals),
    ...(title ? { title } : {}),
    note: civilNote(date, n === 1),
    ...(events.length > 0 ? { events } : {}),
    ...ground(bands, undefined, [MOON_KEY.key]),
    state: stateOf(date, day),
    said: [
      dayWords(date),
      `${n} ${here.month.month.name} ${here.year.year}`,
      ...events.map((e) => e.name),
      ...al.stretches.filter((s) => s.first <= date && date <= s.last).map((s) => s.span.name),
      ...(sighted ? [SIGHTED] : []),
    ].join(' · '),
  }
}

function monthView(day: string, here: HijriDate, al: Almanac, moonOn: (date: string) => BoardMark): CalendarView {
  const run: Run = { first: here.month.first, length: here.month.length }
  const cells = daysOf(run).map((date, i) => dayCell(date, i + 1, here, al, day, moonOn))
  const weeks = inWeeks(cells, run.first, HIJRI.locale)
  const friday = weekdayWords(shiftDay(run.first, (FRIDAY - noonOf(run.first).getUTCDay() + WEEK) % WEEK))
  const heads = weeks.heads?.map((h) => (h.said === friday ? { ...h, said: `${friday}, Jumuʻah` } : h))
  const sections: CalendarSection[] = [{ ...weeks, ...(heads ? { heads } : {}) }]
  const { month } = here.month
  return {
    id: 'month',
    layout: 'grid',
    ...scriptDir(HIJRI),
    name: `${month.name} ${here.year.year}`,
    tab: 'Month',
    sections,
    legend: keyedLegend([MOON_KEY, ...SPAN_KEYS, ...KIND_KEYS, JUMUAH], sections),
    caption: `Day ${here.day} of ${here.month.length}, ${month.name}${month.sacred ? ', a sacred month' : ''}; each day begins at the sunset before`,
  }
}

/* ---------- year ---------- */

function yearView(day: string, year: HijriYear, al: Almanac): CalendarView {
  const cells = year.months.map((m): CalendarCell => {
    const run: Run = { first: m.first, length: m.length }
    const events = al.days.filter((o) => inRun(run, o.date)).map((o) => ({ name: `${o.holiday.name}, ${dateWords(keptFrom(o))}`, key: o.holiday.kind }))
    const band = m.month.sacred ? 'sacred' : m.month.number === RAMADAN ? 'ramadan' : undefined
    return {
      key: m.first,
      label: { text: m.month.arabic, lang: 'ar' },
      title: m.month.name,
      note: dateWords(m.first),
      ...(band ? { band } : {}),
      ...(events.length > 0 ? { events } : {}),
      state: runState(run, day),
      said: [
        `${m.month.name} ${year.year}`,
        `“${m.month.meaning}”`,
        days(m.length),
        `from ${dayWords(m.first)}`,
        ...(m.month.sacred ? ['a sacred month'] : []),
        ...events.map((e) => e.name),
        ...(sightedMonths.has(m.month.number) ? [SIGHTED] : []),
      ].join(' · '),
    }
  })
  const sections: CalendarSection[] = [{ columns: yearColumns(cells.length), cells }]
  return {
    id: 'year',
    layout: 'grid',
    ...scriptDir(HIJRI),
    name: `The year ${year.year} AH`,
    tab: 'Year',
    sections,
    legend: keyedLegend([...MONTH_KEYS, ...KIND_KEYS], sections),
    caption: `${days(year.length)} by Umm al-Qura; Ramadan, Shawwal and Dhu al-Hijjah are set by sighting the crescent`,
  }
}

/* ---------- board ---------- */

function nextEvents(day: string, al: Almanac): readonly BoardEvent[] {
  const when = (date: string) => ({ date, inDays: daysFrom(day, date) })
  const expected = (name: string, sighted: boolean | undefined) => (sighted ? `${name} (expected)` : name)
  const months = al.years.flatMap((y) => y.months).filter((m) => m.first > day)
  const white = al.stretches.find((s) => s.span.id === 'white-days' && s.first > day)
  return [
    ...al.days.filter((o) => keptFrom(o) > day).map((o) => event(expected(keptName(o), o.holiday.sighted), when(keptFrom(o)), HOLIDAY)),
    ...months.slice(0, 1).map((m) => event(expected(`${m.month.name} begins`, sightedMonths.has(m.month.number)), when(m.first), NEW_MOON)),
    ...(white ? [event('The white days begin', when(white.first))] : []),
  ]
}

export function hijriBoard(day: string, sky: Sky): DayBoard | undefined {
  const here = hijriDateOf(day)
  if (!here) return undefined
  const al = almanac(here.year)
  const elongation = elongationOf(sky)
  const moonOn = (date: string) => moonMark(elongation(date, NOON))
  const month = monthView(day, here, al, moonOn)
  const year = yearView(day, here.year, al)
  const m = here.month.month
  const yearNumeral = numeral(here.year.year, HIJRI.numerals)
  return {
    value: `${here.day} ${m.name} ${here.year.year}`,
    meaning: null,
    mast: {
      numeral: numeral(here.day, HIJRI.numerals),
      title: `${m.name} ${here.year.year} AH`,
      words: [{ text: weekdayWords(day) }, { text: `a ${here.month.length}-day month` }],
      script: { text: `${m.arabic} ${yearNumeral.text}`, lang: 'ar' },
      mark: moonOn(day),
    },
    facts: [
      fact('Year', `${here.year.year} AH · ${yearNumeral.text}`),
      fact('Month', `${m.name}, ${m.arabic}: “${m.meaning}”`),
      fact('Sacred', m.sacred ? 'Yes, one of the four sacred months' : 'No'),
      fact('Reckoning', 'Umm al-Qura; Ramadan, Shawwal and Dhu al-Hijjah expected, set by sighting'),
      fact('Day', 'Begins at sunset'),
      fact('Weekday', weekdayWords(day)),
    ],
    views: [month, year],
    next: placed(nextEvents(day, al), [dayFinder(month.id, { first: here.month.first, length: here.month.length }), monthFinder(year.id, here.year.months)], NEXT_COUNT),
  }
}
