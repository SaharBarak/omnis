import { SIDEREAL_AYANAMSA, lahiriAyanamsa } from '@pleiad/engine/calculations/calendars'
import { daysFrom, noonOf, shiftDay } from '@pleiad/engine/calculations/day-search'
import { seasonOn, zodiacSun, type Sky } from '@pleiad/engine/calculations/sky-dates'
import { noonDayOf, sunReached, sunReaches, type Instant } from '@pleiad/engine/calculations/sky-events'
import { NAKSHATRAS, NAKSHATRA_SPAN, VIMSHOTTARI, nakshatraAt, type Nakshatra } from '@pleiad/engine/data/nakshatras'
import { RASHIS, drekkanaAt, navamsaAt, rashiAt, type Rashi } from '@pleiad/engine/data/rashis'
import type { Element } from '@pleiad/engine/types/astrology'
import { NOON, SIGN_DEGREES, byDate, dateWords, dayWords, daysOf, event, fromToday, inWeeks, keyedLegend, monthNote, planetMark, signMark, stateOf } from './parts'
import { bodyName, capital, ingressYear, planetName, type Ingress } from './sun'
import type { BoardEvent, BoardMark, CalendarCell, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { signReading } from '@/lib/atlas/explain'

/**
 * The sidereal Sun's board (BENTO_BOARDS.md "Systems", Sidereal): the Sun's
 * month in its rashi, as India's solar calendars keep it, in weeks from
 * Sunday, each day its degree at noon UTC under its drekkana's lord, banded
 * by the nakshatras it crosses; the twelve rashis on a ring with each
 * Sankranti; the twenty-seven nakshatras on a ring with the day the Sun
 * enters each, led by their Vimshottari lords. Jyotish's own division of the
 * rashi (Brihat Parashara Hora Shastra), the ayanamsa Lahiri's. A Sankranti
 * and a nakshatra's entry are dated in India's time, as the almanacs date
 * them, and not timed: the engine's ayanamsa is a mean one, minutes from the
 * almanacs' true one.
 */

const WEEK_LOCALE = 'hi-IN'
const ROMAN = ['I', 'II', 'III'] as const
const DREKKANAS = 3
const DREKKANA_DEGREES = SIGN_DEGREES / DREKKANAS
/** Sankrantis named in Next. */
const SANKRANTIS_NEXT = 3
const ARCMINUTES = 60
/** India Standard Time, UTC+5:30, in minutes: the time Indian almanacs date a Sankranti and a nakshatra's entry by (Drik Panchang). */
const IST_MINUTES = 330
const MINUTE_MS = 60_000

const withMark = (mark: BoardMark | undefined): { readonly mark?: BoardMark } => (mark ? { mark } : {})

/** The day an instant falls on in India. */
const indianDay = (instant: Instant): string => new Date(instant.at.getTime() + IST_MINUTES * MINUTE_MS).toISOString().slice(0, 10)

/** An instant as a crossing dated in India, from `day`. */
const dated = (instant: Instant, day: string): { readonly date: string; readonly inDays: number } => {
  const date = indianDay(instant)
  return { date, inDays: daysFrom(day, date) }
}

/** "24°13′": degrees and arcminutes, to the nearest arcminute. */
const arc = (degrees: number): string => {
  const total = Math.round(degrees * ARCMINUTES)
  const [whole, minutes] = [Math.floor(total / ARCMINUTES), total % ARCMINUTES]
  return minutes === 0 ? `${whole}°` : `${whole}°${String(minutes).padStart(2, '0')}′`
}

/** Where a sidereal longitude falls in its rashi: "3°20′ Vrishchika". */
const inRashi = (longitude: number): string => `${arc(longitude - (rashiAt(longitude).n - 1) * SIGN_DEGREES)} ${rashiAt(longitude).name}`

/** The tattvas of the rashis: the four elements, as the rashis take them from Mesha. */
const TATTVA: Readonly<Record<Element, string>> = { fire: 'Agni', earth: 'Prithvi', air: 'Vayu', water: 'Jala' }

/** The Sankrantis kept as festivals: Makara's, the Sun's turn north, and Mesha's, the solar new year. */
const FESTIVALS: Readonly<Partial<Record<Rashi['name'], string>>> = {
  Makara: 'Makara Sankranti, kept as Pongal, Lohri and Bihu',
  Mesha: 'Mesha Sankranti, the solar new year (Vaisakhi, Vishu, Puthandu)',
}

const rashiOf = (ingress: Ingress): Rashi => RASHIS[ingress.sign.number - 1] ?? RASHIS[0]

/* ---------- the month ---------- */

interface SunDay {
  readonly date: string
  readonly degree: number
  readonly nakshatra: Nakshatra
  readonly pada: number
  readonly drekkana: ReturnType<typeof drekkanaAt>
}

const nakshatraKey = (n: Nakshatra): string => `nakshatra-${n.n}`
const drekkanaKey = (d: number): string => `drekkana-${d}`
const lordKey = (lord: Nakshatra['lord']): string => `lord-${lord.name}`
const SANKRANTI = 'sankranti'

function drekkanaLegend(rashi: Rashi): readonly LegendEntry[] {
  const start = (rashi.n - 1) * SIGN_DEGREES
  return Array.from({ length: DREKKANAS }, (_, i) => {
    const { of, lord } = drekkanaAt(start + i * DREKKANA_DEGREES)
    return { key: drekkanaKey(i + 1), ...withMark(planetMark(lord)), words: `Drekkana ${ROMAN[i]} · of ${of.name}, ${planetName(lord)}, ${i * DREKKANA_DEGREES}° to ${(i + 1) * DREKKANA_DEGREES}°` }
  })
}

/** The nakshatras a rashi holds, as bands: each with the part of the rashi it spans. */
function nakshatraLegend(rashi: Rashi): readonly LegendEntry[] {
  const [start, end] = [(rashi.n - 1) * SIGN_DEGREES, rashi.n * SIGN_DEGREES]
  return NAKSHATRAS.filter((n) => n.start < end && n.start + NAKSHATRA_SPAN > start).map((n) => {
    const [from, to] = [Math.max(n.start, start) - start, Math.min(n.start + NAKSHATRA_SPAN, end) - start]
    return { key: nakshatraKey(n), band: nakshatraKey(n), words: `${n.name}, of ${n.deity}, its lord ${n.lord.name}: ${arc(from)} to ${arc(to)}` }
  })
}

function monthView(day: string, rashi: Rashi, days: readonly SunDay[], entered: Ingress | undefined): CalendarView {
  const glyph = signMark(rashi.sign.name)
  const cells = days.map((d, i): CalendarCell => {
    const sankranti = i === 0 && entered && noonDayOf(entered.at) === d.date
    const events: CellEvent[] = sankranti ? [{ name: `${rashi.name} Sankranti${indianDay(entered) === d.date ? '' : `, ${dayWords(indianDay(entered))}`}`, key: SANKRANTI, ...withMark(glyph) }] : []
    return {
      key: d.date,
      ...withMark(planetMark(d.drekkana.lord)),
      label: { text: `${d.degree}°` },
      ...monthNote(d.date, i === 0),
      band: nakshatraKey(d.nakshatra),
      ...(events.length > 0 ? { events } : {}),
      keys: [drekkanaKey(d.drekkana.drekkana)],
      state: stateOf(d.date, day),
      said: [
        dayWords(d.date),
        `Sun at ${d.degree}° ${rashi.name}`,
        `${d.nakshatra.name}, pada ${d.pada}`,
        `drekkana ${ROMAN[d.drekkana.drekkana - 1]}, of ${d.drekkana.of.name}, ruled by ${bodyName(d.drekkana.lord)}`,
        ...events.map((e) => e.name),
      ].join(' · '),
    }
  })
  const sections = [inWeeks(cells, days[0]?.date ?? day, WEEK_LOCALE)]
  const today = days.find((d) => d.date === day)
  return {
    id: 'month',
    layout: 'grid',
    name: `The month of ${rashi.name}`,
    tab: 'Month',
    sections,
    legend: keyedLegend([...nakshatraLegend(rashi), ...drekkanaLegend(rashi), { key: SANKRANTI, ...withMark(glyph), words: `${rashi.name} Sankranti: the Sun enters ${rashi.name}` }], sections),
    caption: `${today?.degree ?? 0} of ${SIGN_DEGREES} degrees of ${rashi.name} crossed`,
  }
}

/* ---------- the year and the nakshatras ---------- */

const FESTIVAL = 'festival'

const TATTVA_KEYS: readonly LegendEntry[] = (Object.keys(TATTVA) as Element[]).map((element) => ({
  key: element,
  band: element,
  words: `${TATTVA[element]}, ${element}: ${RASHIS.filter((r) => r.sign.element === element)
    .map((r) => r.name)
    .join(', ')}`,
}))

/** The side of the South Indian chart: a square of four, its twelve edge cells the rashis. */
const CHART_SIDE = 4

/** The edge cells of a square, clockwise from its top-left corner, as rows and columns. */
const perimeter = (side: number): readonly (readonly [number, number])[] => {
  const last = side - 1
  return [
    ...Array.from({ length: last }, (_, i) => [0, i] as const),
    ...Array.from({ length: last }, (_, i) => [i, last] as const),
    ...Array.from({ length: last }, (_, i) => [last, last - i] as const),
    ...Array.from({ length: last }, (_, i) => [last - i, 0] as const),
  ]
}

/** Where the South Indian chart fixes each rashi: clockwise round the edge, Mesha second from the left in the top row, so Meena holds the corner before it. */
const CHART_PLACES = perimeter(CHART_SIDE)
const chartPlace = (rashi: Rashi): readonly [number, number] => CHART_PLACES[rashi.n % RASHIS.length] ?? [0, 0]

/** The rashi chart, South Indian (BENTO_BOARDS.md "Figures", Sidereal): the twelve rashis fixed round a square, each with its Sankranti; the rashi the Sun is in is today's. */
function rashiChart(day: string, here: Rashi, sankrantis: readonly Ingress[]): CalendarView {
  const dates = new Map(sankrantis.map((s) => [rashiOf(s).n, indianDay(s)]))
  const cells: CalendarCell[] = RASHIS.map((rashi) => {
    const date = dates.get(rashi.n)
    const now = rashi.n === here.n
    const festival = FESTIVALS[rashi.name]
    const when = date && (now ? `the Sun has been in it since ${dayWords(date)}` : `its Sankranti ${dayWords(date)}, ${fromToday(daysFrom(day, date))}`)
    return {
      key: rashi.name,
      ...withMark(signMark(rashi.sign.name)),
      label: { text: rashi.devanagari, lang: 'hi' },
      title: rashi.name,
      ...(date ? { note: dateWords(date) } : {}),
      band: rashi.sign.element,
      ...(festival ? { events: [{ name: festival, key: FESTIVAL }] } : {}),
      state: now ? 'today' : 'ahead',
      said: [rashi.name, rashi.devanagari, `the place of ${rashi.sign.name}`, ...(when ? [when] : []), `its lord ${bodyName(rashi.lord)}`, TATTVA[rashi.sign.element], ...(festival ? [festival] : [])].join(
        ' · ',
      ),
    }
  })
  const places = Object.fromEntries(RASHIS.map((rashi) => [rashi.name, chartPlace(rashi)]))
  const sections = [{ columns: CHART_SIDE, places, cells }]
  return {
    id: 'year',
    layout: 'figure',
    name: 'The rashi chart',
    tab: 'Chart',
    sections,
    legend: keyedLegend([...TATTVA_KEYS, { key: FESTIVAL, words: 'A Sankranti kept as a festival' }], sections),
    caption: `The rashis as the South Indian chart fixes them, each with its Sankranti, the day the Sun enters it in India`,
  }
}

/** The instants the Sun enters each nakshatra from the one it is in at `at`, a year of them, each searched from the last. */
function nakshatraYear(here: Nakshatra, at: Date): ReadonlyMap<number, Instant> {
  const found = new Map<number, Instant>()
  const entered = sunReached(here.start, at, 'sidereal')
  if (entered) found.set(here.n, entered)
  let from = at
  for (let i = 1; i < NAKSHATRAS.length; i++) {
    const n = NAKSHATRAS[(here.n - 1 + i) % NAKSHATRAS.length]
    const reached = n && sunReaches(n.start, from, 'sidereal')
    if (!n || !reached) break
    found.set(n.n, reached)
    from = reached.at
  }
  return found
}

const LORD_KEYS: readonly LegendEntry[] = VIMSHOTTARI.map((lord) => ({
  key: lordKey(lord),
  ...withMark(planetMark(lord.lord)),
  words: `${lord.name}, lord of ${NAKSHATRAS.filter((n) => n.lord === lord)
    .map((n) => n.name)
    .join(', ')}; its dasha ${lord.years} years`,
}))

/** The nakshatra wheel runs as the chart does: Mesha from the top, clockwise. The tradition fixes no orientation for it. */
const NAKSHATRA_WHEEL = { origin: 'top', turn: 'clockwise' } as const

/**
 * The nakshatras as a wheel (BENTO_BOARDS.md "Figures"): the twelve rashis,
 * outside them the twenty-seven nakshatras from Ashwini at 0° Mesha, each
 * with the day the Sun enters it; the hand is the Sun.
 */
function nakshatraRing(day: string, here: Nakshatra, entries: ReadonlyMap<number, Instant>, rashi: Rashi, longitude: number): CalendarView {
  const rashis: CalendarCell[] = RASHIS.map((r) => ({
    key: `rashi-${r.name}`,
    ...withMark(signMark(r.sign.name)),
    title: r.name,
    band: r.sign.element,
    /* The rashis are the nakshatras' ground: the nakshatra is the day's place. */
    state: 'ahead',
    said: [r.name, r.devanagari, ...(r.n === rashi.n ? ['the Sun is in it'] : []), `the place of ${r.sign.name}`, `its lord ${bodyName(r.lord)}`, TATTVA[r.sign.element]].join(' · '),
  }))
  const cells: CalendarCell[] = NAKSHATRAS.map((n) => {
    const now = n.n === here.n
    const at = entries.get(n.n)
    const date = at && indianDay(at)
    const when = date && (now ? `the Sun has been in it since ${dayWords(date)}` : `the Sun enters it ${dayWords(date)}, ${fromToday(daysFrom(day, date))}`)
    return {
      key: nakshatraKey(n),
      ...withMark(planetMark(n.lord.lord)),
      title: n.name,
      ...(date ? { note: dateWords(date) } : {}),
      keys: [lordKey(n.lord)],
      state: now ? 'today' : 'ahead',
      said: [n.name, `of ${n.deity}`, `its lord ${n.lord.name}`, `from ${inRashi(n.start)}`, ...(when ? [when] : [])].join(' · '),
    }
  })
  const sections = [
    { name: 'The rashis', columns: rashis.length, cells: rashis },
    { name: 'The nakshatras', columns: cells.length, cells },
  ]
  return {
    id: 'nakshatras',
    layout: 'wheel',
    name: 'The nakshatras',
    tab: 'Nakshatras',
    sections,
    legend: keyedLegend([...LORD_KEYS, ...TATTVA_KEYS], sections),
    caption: `The day the Sun enters each nakshatra in India, from ${here.name}`,
    wheel: { ...NAKSHATRA_WHEEL, hand: longitude },
  }
}

export function siderealBoard(day: string, sky: Sky): DayBoard {
  const read = zodiacSun(sky, 'sidereal')
  const longitude = read(day, NOON)
  const rashi = rashiAt(longitude)
  const sign = rashi.sign
  const run = seasonOn(day, 'sidereal', sky)
  const days = daysOf(run).map((date): SunDay => {
    const at = read(date, NOON)
    const { nakshatra, pada } = nakshatraAt(at)
    return { date, degree: Math.floor(at - (rashi.n - 1) * SIGN_DEGREES), nakshatra, pada, drekkana: drekkanaAt(at) }
  })
  const today = days.find((d) => d.date === day)
  if (!today) throw new RangeError(`No month cell for ${day}`)
  const noon = noonOf(day)
  const sankrantis = ingressYear(rashi.n - 1, noonOf(shiftDay(run.first, -2)), 'sidereal')
  const entered = sankrantis.find((s) => s.sign.id === sign.id)
  const entries = nakshatraYear(today.nakshatra, noon)
  const inMonth = new Set(days.map((d) => d.date))
  const glyph = signMark(sign.name)
  const lordMark = planetMark(rashi.lord)
  const { drekkana } = today

  const nextNakshatra = NAKSHATRAS[today.nakshatra.n % NAKSHATRAS.length]
  const nakshatraAhead = nextNakshatra && entries.get(nextNakshatra.n)
  const drekkanaStart = (rashi.n - 1) * SIGN_DEGREES + drekkana.drekkana * DREKKANA_DEGREES
  const nextDrekkana = drekkana.drekkana < DREKKANAS ? drekkanaAt(drekkanaStart) : undefined
  const drekkanaAhead = nextDrekkana && sunReaches(drekkanaStart, noon, 'sidereal')
  const onMonth = (instant: Instant): BoardEvent['at'] => (inMonth.has(noonDayOf(instant.at)) ? { view: 'month', cell: noonDayOf(instant.at) } : undefined)
  const next: BoardEvent[] = [
    ...(nextDrekkana && drekkanaAhead
      ? [event(`Drekkana ${ROMAN[nextDrekkana.drekkana - 1]}, ${planetName(nextDrekkana.lord)}`, dated(drekkanaAhead, day), planetMark(nextDrekkana.lord), onMonth(drekkanaAhead))]
      : []),
    ...(nextNakshatra && nakshatraAhead
      ? [event(`Sun enters ${nextNakshatra.name}`, dated(nakshatraAhead, day), planetMark(nextNakshatra.lord.lord), onMonth(nakshatraAhead) ?? { view: 'nakshatras', cell: nakshatraKey(nextNakshatra) })]
      : []),
    ...sankrantis
      .filter((s) => s.at > noon)
      .slice(0, SANKRANTIS_NEXT)
      .map((s) => event(`${rashiOf(s).name} Sankranti`, dated(s, day), signMark(s.sign.name), { view: 'year', cell: rashiOf(s).name })),
  ].sort(byDate)

  return {
    value: `${today.degree}° ${sign.name}`,
    meaning: signReading(sign.id).meaning,
    mast: {
      numeral: { text: `${today.degree}°` },
      title: rashi.name,
      script: { text: rashi.devanagari, lang: 'hi' },
      words: [
        { text: sign.name, ...withMark(glyph) },
        { text: `ruled by ${planetName(rashi.lord)}`, ...withMark(lordMark) },
        { text: `${today.nakshatra.name}, pada ${today.pada}`, ...withMark(planetMark(today.nakshatra.lord.lord)) },
        { text: `${SIDEREAL_AYANAMSA} ayanamsa` },
      ],
    },
    facts: [
      { label: 'Ayanamsa', value: `${SIDEREAL_AYANAMSA}, ${arc(lahiriAyanamsa(day))}` },
      { label: 'Rashi', value: `${rashi.name}, ${rashi.devanagari}`, ...withMark(glyph) },
      { label: 'Lord', value: planetName(rashi.lord), ...withMark(lordMark) },
      { label: 'Tattva', value: `${TATTVA[sign.element]}, ${sign.element}` },
      { label: 'Drekkana', value: `${ROMAN[drekkana.drekkana - 1]}, of ${drekkana.of.name}, ruled by ${bodyName(drekkana.lord)}`, ...withMark(planetMark(drekkana.lord)) },
      { label: 'Navamsa', value: navamsaAt(longitude).name, ...withMark(signMark(navamsaAt(longitude).sign.name)) },
      { label: 'Nakshatra', value: `${today.nakshatra.name}, pada ${today.pada}`, ...withMark(planetMark(today.nakshatra.lord.lord)) },
      { label: 'Deity', value: capital(today.nakshatra.deity) },
      { label: 'Nakshatra lord', value: today.nakshatra.lord.name },
      ...(entered ? [{ label: 'Sankranti', value: `${dayWords(indianDay(entered))}, ${fromToday(daysFrom(day, indianDay(entered)))}` }] : []),
    ],
    views: [rashiChart(day, rashi, sankrantis), monthView(day, rashi, days, entered), nakshatraRing(day, today.nakshatra, entries, rashi, longitude)],
    next,
  }
}
