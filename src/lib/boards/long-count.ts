import { shiftDay } from '@pleiad/engine/calculations/day-search'
import { STATION_DAYS, eightNineteenOf } from '@pleiad/engine/calculations/eight-nineteen'
import { LORDS_OF_THE_NIGHT, lordOfTheNight } from '@pleiad/engine/calculations/lords-of-night'
import { PLACE_DAYS, haabDayOfYear, haabOfDays, haabYearOf, periodEnding } from '@pleiad/engine/calculations/long-count'
import { GMT_CORRELATION, TRECENA_DAYS, TZOLKIN_DAYS, daysSinceEraBase, trecenaStart, tzolkinOfDays, tzolkinPosition } from '@pleiad/engine/calculations/tzolkin'
import { HAAB_DAYS, HAAB_MONTH_DAYS, HAAB_MONTH_TABLE, haabMonth } from '@pleiad/engine/data/haab-months'
import { TZOLKIN_SIGNS } from '@pleiad/engine/data/tzolkin-signs'
import type { TzolkinDay } from '@pleiad/engine/types/tzolkin'
import { byDate, dayWords, daySignMark, event, fromToday, keyedLegend, numeral, stateOf, whenWords } from './parts'
import type { BoardEvent, BoardFact, CalendarCell, CalendarHead, CalendarSection, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { days as daysWords, longCountReading } from '@/lib/atlas/explain'
import { PLACE_NAMES, buildLongCount, placeDays } from '@/lib/atlas/long-count'

/**
 * The Long Count's board (BENTO_BOARDS.md "Long Count"): the Maya day as the
 * inscriptions write it, its count of days from the era base and its
 * Calendar Round, the Tzolk'in's 260 and the Haab''s 365 meshed. The views
 * are the winal the day stands in (twenty days, each its day sign's glyph,
 * its number and its Haab' day), the Tzolk'in (thirteen columns of twenty,
 * a row per day sign, today's trecena banded), the Haab' year (eighteen
 * months of twenty and Wayeb''s five, a row each) and the count's places as
 * bar-and-dot numerals, b'ak'tun on top. Period endings, the Haab' new year
 * and its bearer, and the 819-day count's stations are marked where they
 * fall. The engine (`long-count.ts`, `tzolkin.ts`, `lords-of-night.ts`,
 * `eight-nineteen.ts`, `data/haab-months.ts`) owns every count; this builder
 * the views and words. Directional colours are not drawn: the day signs'
 * and the 819-day stations' colours are left out of the engine.
 */

const KIN_IN_WINAL = PLACE_DAYS.winal / PLACE_DAYS.kin
/** The winal's twenty days in two rows of ten. */
const WINAL_ROWS = 2
/** The Tzolk'in in columns of twenty consecutive days, a row per day sign. */
const TZOLKIN_COLUMNS = TZOLKIN_DAYS / TZOLKIN_SIGNS.length
const WAYEB = HAAB_MONTH_TABLE.length - 1
/** 13.0.0.0.0, the end of the thirteenth b'ak'tun, the day the correlation is read by. */
const ERA_ENDING = 13 * PLACE_DAYS.baktun

/** The places from the tun up, as `periodEnding` names them, to their names on the board. */
const PERIOD_UNIT = { tun: 2, katun: 3, baktun: 4 } as const
const placeName = (unit: number): string => PLACE_NAMES[unit] ?? ''

/* ---------- words ---------- */

const tzolkinWords = ({ tone, daySign }: TzolkinDay): string => `${tone} ${daySign.yucatec}`
const haabWords = (days: number): string => {
  const haab = haabOfDays(days)
  return `${haab.day} ${haab.monthName}`
}
const roundWords = (days: number): string => `${tzolkinWords(tzolkinOfDays(days))} ${haabWords(days)}`
const signWords = ({ daySign }: TzolkinDay): string => `${daySign.yucatec}, the ${daySign.english}`
const classicWords = (classic: readonly string[]): string => (classic.length ? `Classic ${classic.join(' or ')}` : '')

/* ---------- what falls on a day ---------- */

const WAYEB_KEY: LegendEntry = { key: 'wayeb', band: 'wayeb', words: "Wayeb', the five days that close the Haab' year" }
const PERIOD_KEY: LegendEntry = { key: 'period', words: "A period ending: a tun, k'atun or b'ak'tun completes, the day the inscriptions mark" }
const NEW_YEAR_KEY: LegendEntry = { key: 'newyear', words: "0 Pop, the Haab' new year; its Tzolk'in day bears the year" }
const STATION_KEY: LegendEntry = { key: 'station', words: `A station of the 819-day count, every ${STATION_DAYS} days, always a day numbered 1` }
const TRECENA_KEY: LegendEntry = { key: 'trecena', band: 'trecena', words: "Today's trecena: thirteen days, numbered 1 to 13 from its day sign" }
const DAY_KEYS: readonly LegendEntry[] = [WAYEB_KEY, PERIOD_KEY, NEW_YEAR_KEY, STATION_KEY]

/** A day's events: the period it ends, the Haab' year it opens and the year bearer, an 819-day station. */
function dayEvents(days: number): readonly CellEvent[] {
  const ending = periodEnding(days)
  const haab = haabOfDays(days)
  return [
    ...(ending ? [{ name: `A ${placeName(PERIOD_UNIT[ending]).toLowerCase()} ending`, key: PERIOD_KEY.key }] : []),
    ...(haabDayOfYear(haab) === 0 ? [{ name: `The Haab' new year, borne by ${tzolkinWords(tzolkinOfDays(days))}`, key: NEW_YEAR_KEY.key }] : []),
    ...(eightNineteenOf(days).day === 0 ? [{ name: 'An 819-day station', key: STATION_KEY.key }] : []),
  ]
}

/** What a day's cell carries beyond its own numeral: its Wayeb' band and its events. */
const carried = (days: number): Pick<CalendarCell, 'band' | 'events'> => {
  const events = dayEvents(days)
  return { ...(haabOfDays(days).month === WAYEB ? { band: WAYEB_KEY.key } : {}), ...(events.length ? { events } : {}) }
}

/** A day's words in full: its Calendar Round, where it stands in the view, its civil date, its count, its Lord of the Night, what falls on it. */
const dayPhrases = (days: number, date: string, where?: string): readonly string[] => [
  roundWords(days),
  ...(where ? [where] : []),
  dayWords(date),
  buildLongCount(date).date,
  `Lord of the Night ${lordOfTheNight(days).glyph}`,
  ...(haabOfDays(days).month === WAYEB ? ["in Wayeb'"] : []),
  ...dayEvents(days).map((e) => e.name),
]

/* ---------- the views ---------- */

interface Today {
  readonly day: string
  readonly days: number
  /** The civil date `d` days from the era base. */
  readonly dateOf: (d: number) => string
}

function winalView({ day, days, dateOf }: Today): CalendarView {
  const kin = days % KIN_IN_WINAL
  const cells: CalendarCell[] = Array.from({ length: KIN_IN_WINAL }, (_, i) => {
    const d = days - kin + i
    const date = dateOf(d)
    const tzolkin = tzolkinOfDays(d)
    const mark = daySignMark(tzolkin.daySign.number)
    return {
      key: date,
      ...(mark ? { mark } : {}),
      label: numeral(tzolkin.tone, 'latn'),
      title: tzolkin.daySign.yucatec,
      note: haabWords(d),
      ...carried(d),
      state: stateOf(date, day),
      said: dayPhrases(d, date).join(' · '),
    }
  })
  const sections: CalendarSection[] = [{ columns: KIN_IN_WINAL / WINAL_ROWS, cells }]
  return {
    id: 'winal',
    layout: 'grid',
    name: 'The winal',
    tab: 'Winal',
    sections,
    legend: keyedLegend(DAY_KEYS, sections),
    caption: `Day ${kin + 1} of the winal's ${KIN_IN_WINAL}, from ${tzolkinWords(tzolkinOfDays(days - kin))}`,
  }
}

/** The four day signs that bear Haab' years: the ones 0 Pop can fall on. */
const BEARERS = new Set(Array.from({ length: 4 }, (_, n) => haabYearOf(n * HAAB_DAYS).bearer.daySign.number))

function tzolkinView({ day, days, dateOf }: Today): CalendarView {
  const position = tzolkinPosition(tzolkinOfDays(days))
  const first = days - (position - 1)
  const trecena = trecenaStart(days)
  const cells: CalendarCell[] = Array.from({ length: TZOLKIN_DAYS }, (_, i) => {
    const d = first + i
    const date = dateOf(d)
    const inTrecena = d >= trecena && d < trecena + TRECENA_DAYS
    const { band, events } = carried(d)
    return {
      key: date,
      label: numeral(tzolkinOfDays(d).tone, 'latn'),
      ...(inTrecena ? { band: TRECENA_KEY.key, ...(band ? { keys: [band] } : {}) } : band ? { band } : {}),
      ...(events ? { events } : {}),
      state: stateOf(date, day),
      said: dayPhrases(d, date, `day ${i + 1} of the 260`).join(' · '),
    }
  })
  const places = Object.fromEntries(
    cells.map((cell, i) => [cell.key, [tzolkinOfDays(first + i).daySign.number - 1, Math.floor(i / TZOLKIN_SIGNS.length)] as const]),
  )
  const heads: CalendarHead[] = Array.from({ length: TZOLKIN_COLUMNS }, (_, c) => ({
    text: String(c + 1),
    said: `Days ${c * TZOLKIN_SIGNS.length + 1} to ${(c + 1) * TZOLKIN_SIGNS.length} of the 260`,
  }))
  const rowHeads: CalendarHead[] = TZOLKIN_SIGNS.map((sign) => {
    const mark = daySignMark(sign.number)
    return { text: sign.yucatec, said: `${sign.yucatec}, the ${sign.english}${BEARERS.has(sign.number) ? ', a year bearer' : ''}`, ...(mark ? { mark } : {}) }
  })
  const sections: CalendarSection[] = [{ columns: TZOLKIN_COLUMNS, heads, rowHeads, places, cells }]
  return {
    id: 'tzolkin',
    layout: 'grid',
    name: "The Tzolk'in",
    tab: "Tzolk'in",
    sections,
    legend: keyedLegend([TRECENA_KEY, ...DAY_KEYS], sections),
    caption: `Day ${position} of 260, in the trecena of ${tzolkinWords(tzolkinOfDays(trecena))}`,
  }
}

function haabView({ day, days, dateOf }: Today): CalendarView {
  const year = haabYearOf(days)
  const cells: CalendarCell[] = Array.from({ length: HAAB_DAYS }, (_, i) => {
    const d = year.start + i
    const date = dateOf(d)
    return {
      key: date,
      label: numeral(haabOfDays(d).day, 'latn'),
      ...carried(d),
      state: stateOf(date, day),
      said: dayPhrases(d, date, `day ${i + 1} of the ${HAAB_DAYS}`).join(' · '),
    }
  })
  const rowHeads: CalendarHead[] = HAAB_MONTH_TABLE.map((month) => ({
    text: month.name,
    said: [month.name, classicWords(month.classic), `${month.yukatek} in colonial Yukatek`, `${month.days} days`].filter(Boolean).join(', '),
  }))
  const sections: CalendarSection[] = [{ columns: HAAB_MONTH_DAYS, rowHeads, cells }]
  const at = haabDayOfYear(haabOfDays(days))
  return {
    id: 'haab',
    layout: 'grid',
    name: `The Haab' year borne by ${tzolkinWords(year.bearer)}`,
    tab: "Haab'",
    sections,
    legend: keyedLegend(DAY_KEYS, sections),
    caption: `Day ${at + 1} of ${HAAB_DAYS}: ${haabWords(days)}`,
  }
}

/** Every place above the k'in turns when the count fills it: the days it lacks, today where it just has. */
function turnings(day: string, count: ReturnType<typeof buildLongCount>): readonly { readonly name: string; readonly event: BoardEvent }[] {
  const top = count.places.length - 1
  return count.places
    .slice(0, top)
    .map((_, i) => {
      const unit = top - i
      const name = placeName(unit)
      const span = placeDays(unit)
      const inDays = (span - (count.days % span)) % span
      return { name, event: event(`A new ${name.toLowerCase()}`, { date: shiftDay(day, inDays), inDays }, undefined, { view: 'count', cell: name }) }
    })
    .sort((a, b) => byDate(a.event, b.event))
}

/** What stands after the five places in an Initial Series: the Tzolk'in day, the Lord of the Night, the Haab' day. */
interface Round {
  readonly tzolkin: ReturnType<typeof tzolkinOfDays>
  readonly haab: ReturnType<typeof haabOfDays>
  readonly lord: ReturnType<typeof lordOfTheNight>
}

/** An Initial Series is read in pairs: two blocks to a row, left then right, down (Pitts, *Maya Numbers and the Maya Calendar*). */
const SERIES_COLUMNS = 2

/**
 * The Initial Series (BENTO_BOARDS.md "Figures", Long Count), abbreviated: a
 * stela's double column after its introducing glyph, the five places from
 * the b'ak'tun, then the Tzolk'in day, the Lord of the Night and the Haab'
 * day, each a block with its coefficient in bar and dot over it (the Lord
 * of the Night has none: G1 to G9 name him). The Lunar Series a stela sets
 * before the Haab' is left out.
 */
function countView(count: ReturnType<typeof buildLongCount>, turns: ReadonlyMap<string, BoardEvent>, round: Round): CalendarView {
  const top = count.places.length - 1
  const sign = daySignMark(round.tzolkin.daySign.number)
  const rest: CalendarCell[] = [
    {
      key: 'tzolkin',
      over: { kind: 'bars', n: round.tzolkin.tone },
      ...(sign ? { mark: sign } : {}),
      keys: ['bars'],
      title: signWords(round.tzolkin),
      note: "Tzolk'in",
      state: 'ahead',
      said: [`The Tzolk'in day, ${tzolkinWords(round.tzolkin)}`, `day ${tzolkinPosition(round.tzolkin)} of ${TZOLKIN_DAYS}`].join(' · '),
    },
    {
      key: 'night',
      mark: { kind: 'text', text: round.lord.glyph },
      keys: ['night'],
      title: 'Lord of the Night',
      state: 'ahead',
      said: [`The Lord of the Night, ${round.lord.glyph}`, `of G1 to G${LORDS_OF_THE_NIGHT}, a round of nine nights`].join(' · '),
    },
    {
      key: 'haab',
      over: { kind: 'bars', n: round.haab.day },
      keys: ['bars'],
      title: round.haab.monthName,
      note: "Haab'",
      state: 'ahead',
      said: [`The Haab' day, ${round.haab.day} ${round.haab.monthName}`, `day ${haabDayOfYear(round.haab) + 1} of ${HAAB_DAYS}`].join(' · '),
    },
  ]
  const places: CalendarCell[] = count.places.map((value, i) => {
    const unit = top - i
    const name = placeName(unit)
    const turn = turns.get(name)
    return {
      key: name,
      over: { kind: 'bars', n: value },
      keys: ['bars'],
      label: numeral(value, 'latn'),
      title: name,
      note: daysWords(placeDays(unit)),
      ...(turn ? { events: [{ name: turn.inDays === 0 ? 'turns today' : `turns ${whenWords(turn.date, turn.inDays)}`, key: 'turns' }] } : {}),
      state: unit === 0 ? 'today' : 'ahead',
      said: [`${name} ${value}`, `${daysWords(placeDays(unit))} each`, ...(turn ? [`turns ${whenWords(turn.date, turn.inDays)}, ${fromToday(turn.inDays)}`] : [])].join(' · '),
    }
  })
  const cells = [...places, ...rest]
  const sections: CalendarSection[] = [{ columns: SERIES_COLUMNS, cells }]
  return {
    id: 'count',
    layout: 'figure',
    name: 'The Initial Series',
    tab: 'Series',
    sections,
    /* The count's own top place, as its numeral reads. */
    legend: [
      { key: 'bars', mark: { kind: 'bars', n: count.places[0] ?? 0 }, words: `${count.places[0] ?? 0} in bars and dots: a bar is five, a dot one, a shell zero` },
      { key: 'turns', words: 'The day a place next turns' },
      { key: 'night', mark: { kind: 'text', text: round.lord.glyph }, words: `The Lord of the Night: one of nine, G1 to G${LORDS_OF_THE_NIGHT}, turning with the nights` },
    ],
    caption: `${count.date} ${count.round}, read in pairs, left then right, down`,
  }
}

/* ---------- the board ---------- */

export function longCountBoard(day: string): DayBoard {
  const days = daysSinceEraBase(day)
  const today: Today = { day, days, dateOf: (d) => shiftDay(day, d - days) }
  const count = buildLongCount(day)
  const reading = longCountReading(count)
  const tzolkin = tzolkinOfDays(days)
  const haab = haabOfDays(days)
  const month = haabMonth(haab.month)
  const year = haabYearOf(days)
  const trecena = trecenaStart(days)
  const lord = lordOfTheNight(days)
  const station = eightNineteenOf(days)
  const signMark = daySignMark(tzolkin.daySign.number)

  const views = [countView(count, new Map(turnings(day, count).map((t) => [t.name, t.event])), { tzolkin, haab, lord }), winalView(today), tzolkinView(today), haabView(today)]

  /* An event's cell: the first view, in the order asked, that holds its day. */
  const cellOf = (d: number, order: readonly string[]): BoardEvent['at'] => {
    const date = today.dateOf(d)
    const view = order.map((id) => views.find((v) => v.id === id)).find((v) => v?.sections.some((s) => s.cells.some((c) => c.key === date)))
    return view ? { view: view.id, cell: date } : undefined
  }
  const when = (d: number) => ({ date: today.dateOf(d), inDays: d - days })
  const nextYear = year.start + HAAB_DAYS
  const wayeb = year.start + WAYEB * HAAB_MONTH_DAYS
  const nextTrecena = trecena + TRECENA_DAYS

  const next: BoardEvent[] = [
    ...turnings(day, count).map((t) => t.event),
    event(`The trecena of ${tzolkinWords(tzolkinOfDays(nextTrecena))} begins`, when(nextTrecena), daySignMark(tzolkinOfDays(nextTrecena).daySign.number), cellOf(nextTrecena, ['tzolkin', 'winal'])),
    event(`An 819-day station, ${tzolkinWords(tzolkinOfDays(station.next))}`, when(station.next), daySignMark(tzolkinOfDays(station.next).daySign.number), cellOf(station.next, ['tzolkin', 'haab', 'winal'])),
    ...(wayeb > days ? [event("Wayeb' begins", when(wayeb), undefined, cellOf(wayeb, ['haab', 'winal']))] : []),
    event(`The Haab' new year, borne by ${tzolkinWords(tzolkinOfDays(nextYear))}`, when(nextYear), daySignMark(tzolkinOfDays(nextYear).daySign.number), cellOf(nextYear, ['tzolkin', 'winal'])),
  ]
    .filter((e) => e.inDays > 0)
    .sort(byDate)

  const facts: BoardFact[] = [
    { label: 'Since creation', value: daysWords(count.days) },
    { label: "Tzolk'in", value: `${tzolkin.tone} ${signWords(tzolkin)}: day ${tzolkinPosition(tzolkin)} of ${TZOLKIN_DAYS}`, ...(signMark ? { mark: signMark } : {}) },
    { label: 'Trecena', value: `${tzolkinWords(tzolkinOfDays(trecena))}, day ${days - trecena + 1} of ${TRECENA_DAYS}` },
    { label: "Haab'", value: [`${haab.day} ${haab.monthName}`, classicWords(month.classic)].filter(Boolean).join(', ') + `: day ${haabDayOfYear(haab) + 1} of ${HAAB_DAYS}` },
    { label: 'Year bearer', value: `${tzolkinWords(year.bearer)}, on 0 Pop, ${dayWords(today.dateOf(year.start))}` },
    { label: 'Lord of the Night', value: `${lord.glyph}, of G1 to G${LORDS_OF_THE_NIGHT}` },
    {
      label: '819-day count',
      value: `Day ${station.day + 1} of ${STATION_DAYS}, ${station.day === 0 ? 'a station' : `from the station on ${tzolkinWords(tzolkinOfDays(station.station))}, ${whenWords(today.dateOf(station.station), station.station - days)}`}`,
    },
    { label: 'Correlation', value: `GMT ${GMT_CORRELATION}: 13.0.0.0.0 on ${dayWords(today.dateOf(ERA_ENDING))} ${Number(today.dateOf(ERA_ENDING).slice(0, 4))}` },
  ]

  return {
    value: count.date,
    meaning: reading.meaning,
    mast: {
      numeral: { text: count.date },
      title: count.round,
      words: [
        { text: `Day ${count.days.toLocaleString('en')} of the count` },
        { text: signWords(tzolkin), ...(signMark ? { mark: signMark } : {}) },
        { text: `Lord of the Night ${lord.glyph}` },
      ],
    },
    facts,
    views,
    next,
  }
}
