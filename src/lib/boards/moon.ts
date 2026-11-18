import { SYNODIC_MONTH, moonIllumination, moonReadingAt } from '@pleiad/engine/calculations/moon'
import { noonOf, shiftDay } from '@pleiad/engine/calculations/day-search'
import { elongationOf, lunationOn, type Sky } from '@pleiad/engine/calculations/sky-dates'
import {
  eclipsesIn,
  isSupermoon,
  lunarApsides,
  moonDistance,
  moonEntersSign,
  moonLongitude,
  moonQuartersIn,
  noonDayOf,
  type Apsis,
  type Eclipse,
  type Instant,
  type MoonQuarter,
} from '@pleiad/engine/calculations/sky-events'
import { atWords, instantEvent, instantWords, kmWords, utcWords } from './instants'
import { FULL_TURN, MOON_KEY, NOON, byDate, dayWords, daysOf, dateWords, inWeeks, keyedLegend, monthNote, monthWords, moonMark, numeral, quarterMark, signAt, signMark, stateOf, twoCivilMonths } from './parts'
import type { BoardEvent, BoardMark, CalendarCell, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { days, fact } from '@/lib/atlas/explain'
import { MOON_PHASE_HINTS } from '@/lib/data/moon-phases'

/**
 * The Moon's board (BENTO_BOARDS.md "Systems", Moon): the lunation's days in
 * weeks, each the Moon's face at its noon, with its quarters, the signs it
 * enters, its perigee and apogee, the eclipses and the supermoons on their
 * days, each to the minute in UTC (astronomy-engine); the year's lunations,
 * each by the sign its New Moon falls in; this civil month and the next.
 */

const WEEK_LOCALE = 'en-US'
/** Lunations on the year's view: a lunar year of them, from the one the day stands in. */
const LUNATIONS = 12
/** The year's lunations in rows of four. */
const YEAR_COLUMNS = 4
const DAY_MS = 86_400_000
/** Days before the first New Moon an apsis search starts: an anomalistic month and a day, so a supermoon's perigee and the apogee before it are found. */
const APSIS_LEAD = 29
const LIT = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

const percent = (lit: number): string => `${Math.round(lit * 100)}%`
const withMark = (mark: BoardMark | undefined): { readonly mark?: BoardMark } => (mark ? { mark } : {})
const signName = (longitude: number): string => signAt(longitude)?.name ?? ''

/* ---------- the sky's events ---------- */

const ECLIPSE_FACE: Readonly<Record<Eclipse['body'], BoardMark>> = { lunar: quarterMark('Full Moon'), solar: quarterMark('New Moon') }
const eclipseName = (e: Eclipse): string => `${e.kind.charAt(0).toUpperCase()}${e.kind.slice(1)} ${e.body} eclipse`
const eclipseKey = (e: Eclipse): string => `eclipse-${e.body}`
const apsisName = (a: Apsis): string => `${a.kind === 'perigee' ? 'Perigee' : 'Apogee'}, ${kmWords(a.km)}`

/** The key, the sign's entry drawn with the sign the Moon is in today. */
const keysFor = (signGlyph: BoardMark | undefined): readonly LegendEntry[] => [
  MOON_KEY,
  { key: 'quarter', words: 'A quarter: the New, first quarter, Full or last quarter Moon' },
  { key: 'sign', ...withMark(signGlyph), words: 'The Moon enters a sign' },
  { key: 'apsis', words: 'Perigee or apogee: the Moon nearest the Earth or farthest from it' },
  { key: 'supermoon', words: 'A supermoon: a New or Full Moon within 90% of its perigee (Nolle)' },
  { key: 'eclipse-lunar', mark: ECLIPSE_FACE.lunar, words: 'A lunar eclipse at its greatest' },
  { key: 'eclipse-solar', mark: ECLIPSE_FACE.solar, words: 'A solar eclipse at its greatest' },
]

/** The sky's instants from `from` to `to`: the quarters, the perigees and apogees, and the eclipses. */
function almanac(from: Date, to: Date) {
  const quarters = moonQuartersIn(from, to)
  const apsides = lunarApsides(new Date(from.getTime() - APSIS_LEAD * DAY_MS), to)
  return { quarters, apsides, eclipses: eclipsesIn(from, to), supermoon: (q: MoonQuarter) => isSupermoon(q, apsides) }
}
type Almanac = ReturnType<typeof almanac>

/** Each noon-ruled day's events: what falls after the noon before it and by its own. */
function eventsByCell(sky: Almanac): ReadonlyMap<string, readonly CellEvent[]> {
  const on = new Map<string, CellEvent[]>()
  const put = (instant: Instant, event: (cell: string) => CellEvent) => {
    const cell = noonDayOf(instant.at)
    on.set(cell, [...(on.get(cell) ?? []), event(cell)])
  }
  for (const q of sky.quarters) {
    put(q, (cell) => ({ name: instantWords(q.phase, q, cell), key: 'quarter' }))
    if (sky.supermoon(q)) put(q, () => ({ name: `A supermoon, ${kmWords(q.km)}`, key: 'supermoon' }))
  }
  for (const a of sky.apsides) put(a, (cell) => ({ name: instantWords(apsisName(a), a, cell), key: 'apsis' }))
  for (const e of sky.eclipses) put(e, (cell) => ({ name: instantWords(eclipseName(e), e, cell), key: eclipseKey(e), mark: ECLIPSE_FACE[e.body] }))
  return on
}

/** The sign the Moon enters between the noon before `date` and its own, at its instant. */
const signEntered = (date: string): CellEvent | undefined => {
  const entered = moonEntersSign(noonOf(shiftDay(date, -1)), noonOf(date))
  return entered ? { name: instantWords(`Moon enters ${entered.sign}`, entered, date), key: 'sign', ...withMark(signMark(entered.sign)) } : undefined
}

/* ---------- days ---------- */

/** What a day of the Moon shows and says: its face at noon, the sky's events that fall to it, the sign the Moon is in at noon. */
function moonDay(day: string, sky: Sky, events: ReadonlyMap<string, readonly CellEvent[]>, opts: { readonly lunationDay?: number; readonly first: boolean }) {
  return (date: string): CalendarCell => {
    const angle = elongationOf(sky)(date, NOON)
    const { phase, illumination } = moonReadingAt(angle, moonIllumination(noonOf(date)))
    const sign = signAt(sky(date, NOON).get('moon') ?? Number.NaN)
    const entered = signEntered(date)
    const all = [...(events.get(date) ?? []), ...(entered ? [entered] : [])]
    return {
      key: date,
      mark: moonMark(angle),
      label: numeral(noonOf(date).getUTCDate(), 'latn'),
      ...monthNote(date, opts.first),
      ...(all.length > 0 ? { events: all } : {}),
      keys: [MOON_KEY.key],
      state: stateOf(date, day),
      said: [
        dayWords(date),
        ...(opts.lunationDay ? [`day ${opts.lunationDay} of the lunation`] : []),
        `${phase}, ${percent(illumination)} lit`,
        ...(sign ? [`Moon in ${sign.name}`] : []),
        ...all.map((e) => e.name),
      ].join(' · '),
    }
  }
}

/** This civil month and the next, every day its face. */
function twoMonths(day: string, sky: Sky, events: ReadonlyMap<string, readonly CellEvent[]>, keys: readonly LegendEntry[]): CalendarView {
  const [now, then] = twoCivilMonths(day)
  const sections = [now, then].map((month) => inWeeks(daysOf(month).map(moonDay(day, sky, events, { first: false })), month.first, WEEK_LOCALE, monthWords(month.first)))
  return {
    id: 'months',
    layout: 'grid',
    name: `${monthWords(now.first)} and ${monthWords(then.first)}`,
    tab: 'Two months',
    sections,
    legend: keyedLegend(keys, sections),
    caption: `The Moon at noon each day, ${monthWords(now.first)} to ${monthWords(then.first)}`,
  }
}

/* ---------- the year's lunations ---------- */

interface Lunation {
  readonly key: string
  readonly new: MoonQuarter
  readonly full?: MoonQuarter
  readonly ends: Date
  readonly eclipses: readonly Eclipse[]
}

/** The lunations from the one whose New Moon is last at or before `at`, each from its New Moon to the next. */
function lunationsFrom(at: Date, sky: Almanac): readonly Lunation[] {
  const news = sky.quarters.filter((q) => q.phase === 'New Moon')
  const first = news.filter((q) => q.at <= at).length - 1
  return news.slice(Math.max(first, 0), first + LUNATIONS).flatMap((q, i): Lunation[] => {
    const ends = news[first + i + 1]?.at
    if (!ends) return []
    const full = sky.quarters.find((f) => f.phase === 'Full Moon' && f.at > q.at && f.at < ends)
    return [{ key: `lunation-${q.date}`, new: q, ...(full ? { full } : {}), ends, eclipses: sky.eclipses.filter((e) => e.at >= q.at && e.at < ends) }]
  })
}

const phaseIn = (q: MoonQuarter): string => `${q.phase} in ${signName(moonLongitude(q.at))}`

function yearView(sky: Almanac, lunations: readonly Lunation[], keys: readonly LegendEntry[]): CalendarView {
  const cells: CalendarCell[] = lunations.map((l, i) => {
    const sign = signName(moonLongitude(l.new.at))
    const supers = [l.new, ...(l.full ? [l.full] : [])].filter(sky.supermoon)
    const events: CellEvent[] = [
      ...supers.map((q) => ({ name: `${q.phase}, a supermoon`, key: 'supermoon' })),
      ...l.eclipses.map((e) => ({ name: `${eclipseName(e)}, ${atWords(e)}`, key: eclipseKey(e), mark: ECLIPSE_FACE[e.body] })),
    ]
    const length = (l.ends.getTime() - l.new.at.getTime()) / DAY_MS
    return {
      key: l.key,
      ...withMark(signMark(sign)),
      title: sign,
      note: dateWords(l.new.date),
      ...(events.length > 0 ? { events } : {}),
      state: i === 0 ? 'today' : 'ahead',
      said: [
        `${phaseIn(l.new)}, ${atWords(l.new)}`,
        ...(l.full ? [`${phaseIn(l.full)}, ${atWords(l.full)}`] : []),
        ...events.map((e) => e.name),
        `${LIT.format(length)} days`,
      ].join(' · '),
    }
  })
  const sections = [{ columns: YEAR_COLUMNS, cells }]
  const first = lunations[0]
  return {
    id: 'year',
    layout: 'grid',
    name: 'The year’s lunations',
    tab: 'Year',
    sections,
    legend: keyedLegend(keys, sections),
    caption: `${cells.length} lunations from the New Moon of ${first ? dateWords(first.new.date) : ''}, each by the sign it begins in`,
  }
}

/* ---------- the board ---------- */

/** The lunation's wheel: from the New Moon at the top, counter-clockwise, as the Moon goes round the Earth seen from the north. No tradition fixes it. */
const LUNATION_WHEEL = { origin: 'top', turn: 'counterclockwise' } as const

/** The next sign the Moon enters after `day`'s noon: searched noon to noon over the days it can take to cross a sign. */
function nextSignEntry(day: string): (Instant & { readonly sign: string }) | null {
  for (let i = 0; i < 3; i++) {
    const found = moonEntersSign(noonOf(shiftDay(day, i)), noonOf(shiftDay(day, i + 1)))
    if (found) return found
  }
  return null
}

export function moonBoard(day: string, sky: Sky): DayBoard {
  const run = lunationOn(day, sky)
  const noon = noonOf(day)
  const { phase, illumination } = moonReadingAt(elongationOf(sky)(day, NOON), moonIllumination(noon))
  const sign = signAt(sky(day, NOON).get('moon') ?? Number.NaN)
  const lit = percent(illumination)
  const from = noonOf(shiftDay(run.first, -2))
  const known = almanac(from, new Date(from.getTime() + Math.ceil((LUNATIONS + 2) * SYNODIC_MONTH) * DAY_MS))
  const events = eventsByCell(known)
  const cells = daysOf(run).map((date, i) => moonDay(day, sky, events, { lunationDay: i + 1, first: i === 0 })(date))
  const signGlyph = sign && signMark(sign.name)
  const keys = keysFor(signGlyph)
  const lunationSections = [{ name: 'The days of the lunation', columns: cells.length, cells }]
  const months = twoMonths(day, sky, events, keys)
  const lunations = lunationsFrom(noon, known)
  const year = yearView(known, lunations, keys)

  /* An instant falls on a cell of the lunation, else of the two months, else on its lunation in the year. */
  const inMonths = new Set(months.sections.flatMap((section) => section.cells.map((c) => c.key)))
  const inLunation = new Set(cells.map((c) => c.key))
  const cellOf = (instant: Instant): BoardEvent['at'] => {
    const cell = noonDayOf(instant.at)
    if (inLunation.has(cell)) return { view: 'lunation', cell }
    if (inMonths.has(cell)) return { view: months.id, cell }
    const lunation = lunations.find((l) => instant.at >= l.new.at && instant.at < l.ends)
    return lunation && { view: year.id, cell: lunation.key }
  }
  const ahead = <T extends Instant>(all: readonly T[]): readonly T[] => all.filter((i) => i.at > noon)
  const apsis = ahead(known.apsides)[0]
  const eclipse = ahead(known.eclipses)[0]
  const entry = nextSignEntry(day)
  const next: BoardEvent[] = [
    ...ahead(known.quarters)
      .slice(0, 4)
      .map((q) => instantEvent(instantWords(q.phase, q, q.date), q, day, quarterMark(q.phase), cellOf(q))),
    ...(apsis ? [instantEvent(instantWords(apsisName(apsis), apsis, apsis.date), apsis, day, undefined, cellOf(apsis))] : []),
    ...(entry ? [instantEvent(instantWords(`Moon enters ${entry.sign}`, entry, entry.date), entry, day, signMark(entry.sign), cellOf(entry))] : []),
    ...(eclipse ? [instantEvent(instantWords(eclipseName(eclipse), eclipse, eclipse.date), eclipse, day, ECLIPSE_FACE[eclipse.body], cellOf(eclipse))] : []),
  ].sort(byDate)

  const began = lunations[0]?.new
  return {
    value: phase,
    meaning: `Read for ${MOON_PHASE_HINTS[phase]}.`,
    mast: {
      numeral: numeral(run.at, 'latn'),
      title: phase,
      words: [{ text: `Day ${run.at} of ${run.length}` }, { text: `${lit} lit` }, ...(sign ? [{ text: `in ${sign.name}`, ...withMark(signGlyph) }] : [])],
    },
    facts: [
      fact('Lit', lit),
      fact('Age', days(run.at - 1)),
      ...(sign ? [{ ...fact('Moon in', sign.name), ...withMark(signGlyph) }] : []),
      fact('Distance', `${kmWords(moonDistance(noon))} at noon UTC`),
      ...(began ? [fact('Began', `${phaseIn(began)}, ${dayWords(began.date)} ${utcWords(began)}`)] : []),
      fact('This lunation', `${days(run.length)} of a mean ${SYNODIC_MONTH.toFixed(1)}`),
    ],
    views: [
      {
        id: 'lunation',
        layout: 'wheel',
        name: 'The lunation',
        tab: 'Lunation',
        sections: lunationSections,
        legend: keyedLegend(keys, lunationSections),
        caption: `Day ${run.at} of ${run.length}, from the New Moon at the top`,
        /* The hand stands at the middle of today's day. */
        wheel: { ...LUNATION_WHEEL, hand: ((run.at - 1 / 2) / run.length) * FULL_TURN },
      },
      year,
      months,
    ],
    next,
  }
}
