import { daysFrom, noonOf } from '@pleiad/engine/calculations/day-search'
import {
  PERSIAN_SEASONS,
  ZOROASTRIAN_DAYS,
  jashnDays,
  nextPersianYear,
  persianDateOf,
  persianFeastsIn,
  tahvilOf,
  zoroastrianDay,
  type PersianDate,
  type PersianFeastKind,
  type PersianObservance,
  type PersianSeason,
  type PersianYear,
} from '@pleiad/engine/calculations/persian-calendar'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { PERSIAN, civilNote, dayFinder, ground, inRun, monthFinder, placed, runState, scriptDir, yearColumns, type Run } from './months'
import { dateWords, dayWords, daysOf, event, inWeeks, keyedLegend, numeral, planetMark, signMark, weekdayWords, stateOf } from './parts'
import type { BoardEvent, BoardMark, CalendarCell, CalendarSection, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { days, fact } from '@/lib/atlas/explain'

/**
 * The Persian date's board (BENTO_BOARDS.md "Systems", Persian): the month
 * in weeks from Saturday, each day its numeral and its Zoroastrian name,
 * Fridays and holidays in red as Iran's calendar prints them, the feasts,
 * the jashns and the Tahvil on their days; the year's months under their
 * signs and patrons, by season; and the thirty day names round a ring. The
 * engine (persian-calendar.ts, data/persian-days.ts) owns the names and
 * dates, read onto the civil days; this file the words.
 */

const FRIDAY = 5
const NEXT_COUNT = 5

const HOLIDAY: BoardMark = { kind: 'text', text: '✦' }
const SUN = planetMark('sun')

const RED_DAY: LegendEntry = { key: 'off', tint: 'red', words: 'Fridays and public holidays, printed red' }
const RED = { tint: 'red', key: RED_DAY.key } as const

const KIND_WORDS: Readonly<Record<PersianFeastKind | 'jashn', string>> = {
  holiday: 'A public holiday',
  festival: 'A festival day',
  evening: 'An evening feast, kept from sunset',
  jashn: 'A jashn: the day whose name is the month’s',
}
const KIND_KEYS: readonly LegendEntry[] = (Object.keys(KIND_WORDS) as (PersianFeastKind | 'jashn')[]).map((kind) => ({ key: kind, words: KIND_WORDS[kind] }))
const TAHVIL: LegendEntry = { key: 'tahvil', ...(SUN ? { mark: SUN } : {}), words: 'The Tahvil: the March equinox, the moment the year turns' }

const SEASON_WORDS: Readonly<Record<PersianSeason, string>> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }
const SEASON_KEYS: readonly LegendEntry[] = (Object.keys(SEASON_WORDS) as PersianSeason[]).map((s) => ({ key: s, band: s, words: `${SEASON_WORDS[s]}, ${PERSIAN_SEASONS[s]}` }))
const SIGN_KEY: LegendEntry = { key: 'sign', ...(signMark('Aries') ? { mark: signMark('Aries') } : {}), words: 'The sign the month’s Sun stands in, from Aries at Nowruz' }

/** The four weeks of the thirty names, each opened by a day of Ahura Mazda. */
const WEEK_OPENERS = ZOROASTRIAN_DAYS.filter((d) => d.yazata === ZOROASTRIAN_DAYS[0]?.yazata).map((d) => d.day)
const weekOf = (n: number): number => WEEK_OPENERS.filter((first) => first <= n).length
const WEEK_KEYS: readonly LegendEntry[] = WEEK_OPENERS.map((first, i) => {
  const last = (WEEK_OPENERS[i + 1] ?? ZOROASTRIAN_DAYS.length + 1) - 1
  return { key: `week-${i + 1}`, band: `week-${i + 1}`, words: `${zoroastrianDay(first)?.name} to ${zoroastrianDay(last)?.name}, the ${['first', 'second', 'third', 'fourth'][i] ?? ''} week` }
})

/** A feast's name where it is marked: an evening's from sunset. */
const keptName = (o: PersianObservance): string => (o.kind === 'evening' ? `${o.name}, from sunset` : o.name)

/** A feast by its own name, its days uncounted: Nowruz. */
const feastName = (o: PersianObservance): string => o.feast?.name ?? o.name

function almanac(year: PersianYear) {
  const years = [year, nextPersianYear(year)].flatMap((y) => (y ? [y] : []))
  return { years, feasts: years.flatMap(persianFeastsIn), tahvil: tahvilOf(year.year + 1) }
}
type Almanac = ReturnType<typeof almanac>

/* ---------- month ---------- */

function dayCell(date: string, n: number, here: PersianDate, al: Almanac, day: string): CalendarCell {
  const feasts = al.feasts.filter((o) => o.date === date)
  const named = zoroastrianDay(n)
  const tahvil = al.tahvil.date === date
  const events: CellEvent[] = [
    ...feasts.map((o) => ({ name: keptName(o), key: o.kind })),
    ...(tahvil ? [{ name: `Tahvil, ${al.tahvil.time.slice(0, 5)} Tehran time`, ...(SUN ? { mark: SUN } : {}), key: TAHVIL.key }] : []),
  ]
  const red = noonOf(date).getUTCDay() === FRIDAY || feasts.some((o) => o.kind === 'holiday')
  return {
    key: date,
    label: numeral(n, PERSIAN.numerals),
    ...(named ? { title: named.name } : {}),
    note: civilNote(date, n === 1),
    ...(events.length > 0 ? { events } : {}),
    ...ground([], red ? RED : undefined, []),
    state: stateOf(date, day),
    said: [
      dayWords(date),
      `${n} ${here.month.month.name} ${here.year.year}`,
      named ? `${named.name} day, ${named.yazata}: ${named.gloss}` : 'no day name',
      ...events.map((e) => e.name),
    ].join(' · '),
  }
}

function monthView(day: string, here: PersianDate, al: Almanac): CalendarView {
  const run: Run = { first: here.month.first, length: here.month.length }
  const cells = daysOf(run).map((date, i) => dayCell(date, i + 1, here, al, day))
  const sections: CalendarSection[] = [inWeeks(cells, run.first, PERSIAN.locale)]
  return {
    id: 'month',
    layout: 'grid',
    ...scriptDir(PERSIAN),
    name: `${here.month.month.name} ${here.year.year}`,
    tab: 'Month',
    sections,
    legend: keyedLegend([RED_DAY, ...KIND_KEYS, TAHVIL], sections),
    caption: `Day ${here.day} of ${here.month.length}, ${here.month.month.name}; each day named for its yazata`,
  }
}

/* ---------- year ---------- */

function yearView(day: string, year: PersianYear, al: Almanac): CalendarView {
  const cells = year.months.map((m, i): CalendarCell => {
    const run: Run = { first: m.first, length: m.length }
    const events = al.feasts.filter((o) => o.day === 1 && inRun(run, o.date)).map((o) => ({ name: `${feastName(o)}, ${dateWords(o.date)}`, key: o.kind }))
    const sign = ZODIAC_SIGNS[i]
    const mark = sign && signMark(sign.name)
    const { month } = m
    return {
      key: m.first,
      ...(mark ? { mark } : {}),
      label: { text: month.persian, lang: 'fa' },
      title: month.name,
      note: dateWords(m.first),
      band: month.season,
      ...(events.length > 0 ? { events } : {}),
      keys: [SIGN_KEY.key],
      state: runState(run, day),
      said: [
        `${month.name} ${year.year}`,
        `${month.yazata}: ${month.gloss}`,
        `Dari ${month.dari}, ${month.dariScript}`,
        days(m.length),
        `from ${dayWords(m.first)}`,
        ...events.map((e) => e.name),
      ].join(' · '),
    }
  })
  const sections: CalendarSection[] = [{ columns: yearColumns(cells.length), cells }]
  return {
    id: 'year',
    layout: 'grid',
    ...scriptDir(PERSIAN),
    name: `The year ${year.year} AP`,
    tab: 'Year',
    sections,
    legend: keyedLegend([SIGN_KEY, ...SEASON_KEYS, ...KIND_KEYS], sections),
    caption: `${days(year.length)} from Nowruz, ${dateWords(year.first)}; the months keep their patrons’ names`,
  }
}

/* ---------- day names ---------- */

function namesView(here: PersianDate): CalendarView {
  const jashns = new Set(jashnDays(here.month.month).map((d) => d.day))
  const cells = Array.from({ length: here.month.length }, (_, i): CalendarCell => {
    const n = i + 1
    const named = zoroastrianDay(n)
    const jashn = jashns.has(n)
    return {
      key: `day-${n}`,
      label: numeral(n, PERSIAN.numerals),
      ...(named ? { title: named.name, note: named.yazata, band: `week-${weekOf(n)}` } : {}),
      ...(jashn ? { keys: ['jashn'] } : {}),
      state: n === here.day ? 'today' : n < here.day ? 'past' : 'ahead',
      said: [
        `Day ${n}`,
        named ? `${named.name}, ${named.persian}: ${named.yazata}, ${named.gloss}` : `no day name; the thirty end on the 30th`,
        ...(jashn ? [`${here.month.month.jashn}, its name the month’s`] : []),
      ].join(' · '),
    }
  })
  const sections: CalendarSection[] = [{ columns: cells.length, cells }]
  return {
    id: 'names',
    layout: 'ring',
    name: 'The thirty day names',
    tab: 'Day names',
    sections,
    legend: keyedLegend([...WEEK_KEYS, { key: 'jashn', words: `${here.month.month.jashn}: the day named as the month is` }], sections),
    caption: `Read onto the civil days 1 to ${ZOROASTRIAN_DAYS.length}${here.month.length > ZOROASTRIAN_DAYS.length ? `; the ${here.month.length}st has none` : ''}`,
  }
}

/* ---------- board ---------- */

function nextEvents(day: string, al: Almanac): readonly BoardEvent[] {
  const when = (date: string) => ({ date, inDays: daysFrom(day, date) })
  const months = al.years.flatMap((y) => y.months).filter((m) => m.first > day)
  return [
    ...al.feasts.filter((o) => o.day === 1 && o.date > day).map((o) => event(o.kind === 'evening' ? keptName(o) : feastName(o), when(o.date), o.kind === 'holiday' ? HOLIDAY : undefined)),
    ...months.slice(0, 1).map((m) => event(`${m.month.name} begins`, when(m.first))),
    ...(al.tahvil.date > day ? [event(`Tahvil, ${al.tahvil.time.slice(0, 5)} Tehran time`, when(al.tahvil.date), SUN)] : []),
  ]
}

export function persianBoard(day: string): DayBoard | undefined {
  const here = persianDateOf(day)
  if (!here) return undefined
  const al = almanac(here.year)
  const month = monthView(day, here, al)
  const year = yearView(day, here.year, al)
  const names = namesView(here)
  const m = here.month.month
  const named = zoroastrianDay(here.day)
  const sign = ZODIAC_SIGNS[m.number - 1]
  const mark = sign && signMark(sign.name)
  const yearNumeral = numeral(here.year.year, PERSIAN.numerals)
  return {
    value: `${here.day} ${m.name} ${here.year.year}`,
    meaning: null,
    mast: {
      numeral: numeral(here.day, PERSIAN.numerals),
      title: `${m.name} ${here.year.year} AP`,
      words: [{ text: weekdayWords(day) }, ...(named ? [{ text: `${named.name} day` }] : []), { text: `a ${here.month.length}-day month` }],
      script: { text: `${m.persian} ${yearNumeral.text}`, lang: 'fa' },
      ...(mark ? { mark } : {}),
    },
    facts: [
      fact('Year', `${here.year.year} AP · ${yearNumeral.text}`),
      fact('Month', `${m.name}, ${m.persian}: ${m.yazata}, ${m.gloss}`),
      fact('Day name', named ? `${named.name}, ${named.persian}: ${named.yazata}, ${named.gloss}` : 'None: the thirty names end on the 30th'),
      fact('Season', `${SEASON_WORDS[m.season]}, ${PERSIAN_SEASONS[m.season]}`),
      fact('Dari', `${m.dari}, ${m.dariScript}`),
      fact('Tahvil', `${dateWords(al.tahvil.date)} ${al.tahvil.date.slice(0, 4)}, ${al.tahvil.time.slice(0, 5)} Tehran time`),
      fact('Weekday', weekdayWords(day)),
    ],
    views: [month, year, names],
    next: placed(nextEvents(day, al), [dayFinder(month.id, { first: here.month.first, length: here.month.length }), monthFinder(year.id, here.year.months)], NEXT_COUNT),
  }
}
