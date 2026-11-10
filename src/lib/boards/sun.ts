import { daysFrom, noonOf, shiftDay } from '@pleiad/engine/calculations/day-search'
import { seasonOn, sunArrives, zodiacSun, type NoonCrossing, type Sky } from '@pleiad/engine/calculations/sky-dates'
import { TURNINGS, noonDayOf, solarTurnings, sunReaches, type Instant, type SolarTurning } from '@pleiad/engine/calculations/sky-events'
import { PLANETS } from '@pleiad/engine/data/planets'
import { termAt, termsOf, type Term } from '@pleiad/engine/data/terms'
import {
  DECANS_IN_SIGN,
  ELEMENT_COLOURS,
  EXALTATIONS,
  TRADITIONAL_RULERS,
  TRIPLICITY_RULERS,
  ZODIAC_SIGNS,
  decanAt,
  detrimentIn,
  fallIn,
  polarityOf,
} from '@pleiad/engine/data/zodiac-signs'
import type { Element, ZodiacSign } from '@pleiad/engine/types/astrology'
import { atWords, instantEvent, instantWords } from './instants'
import { NOON, SIGN_DEGREES, byDate, dateWords, dayWords, daysOf, elementMark, event, fromToday, inWeeks, keyedLegend, monthNote, planetMark, signMark, stateOf } from './parts'
import type { BoardEvent, BoardFact, BoardMark, CalendarCell, CalendarView, CellEvent, DayBoard, LegendEntry } from './types'
import { signReading } from '@/lib/atlas/explain'

/**
 * The tropical Sun's board (BENTO_BOARDS.md "Systems", Sun): the sign's
 * season in weeks, each day the Sun's degree at its noon under the planet
 * whose term holds it, banded by the sign's three faces; the twelve signs on
 * a ring with the day the Sun enters each and the turning points of its
 * year, coloured by element; the sign's five Egyptian terms as a ladder. The
 * dignities are Hellenistic (Ptolemy, Dorotheus; `zodiac-signs.ts`,
 * `terms.ts`), the instants astronomy-engine's, to the minute in UTC.
 */

const WEEK_LOCALE = 'en-US'
const ORDINAL = ['first', 'second', 'third'] as const
const ROMAN = ['I', 'II', 'III'] as const
const DECAN_DEGREES = SIGN_DEGREES / DECANS_IN_SIGN
/** Ingresses after the one that began the season, named in Next. */
const INGRESSES_NEXT = 2
const SUN_MARK = planetMark('sun')

export const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
export const planetName = (id: string): string => PLANETS.find((p) => p.id === id)?.name ?? capital(id)
/** A body as a sentence names it: "the Sun", "the Moon", "Mars". */
export const bodyName = (id: string): string => (id === 'sun' || id === 'moon' ? `the ${planetName(id)}` : planetName(id))
const signIndexAt = (longitude: number): number => Math.floor(longitude / SIGN_DEGREES) % ZODIAC_SIGNS.length
const withMark = (mark: BoardMark | undefined): { readonly mark?: BoardMark } => (mark ? { mark } : {})

/* ---------- the sign's lords ---------- */

const termKey = (term: Term): string => `term-${term.n}`
const termSpan = (term: Term): string => `${term.start}° to ${term.end}°`
const decanKey = (decan: number): string => `decan-${decan}`

/** A sign's three faces as legend entries: "I · Mars, 0° to 10°". */
const decanLegend = (sign: ZodiacSign): readonly LegendEntry[] =>
  Array.from({ length: DECANS_IN_SIGN }, (_, i) => {
    const { ruler } = decanAt(sign.degreesStart + i * DECAN_DEGREES)
    return { key: decanKey(i + 1), band: decanKey(i + 1), ...withMark(planetMark(ruler)), words: `${ROMAN[i]} · ${capital(bodyName(ruler))}, ${i * DECAN_DEGREES}° to ${(i + 1) * DECAN_DEGREES}°` }
  })

/** A sign's five terms as legend entries, each led by its planet. */
const termLegend = (sign: ZodiacSign): readonly LegendEntry[] =>
  termsOf(sign.id).map((t) => ({ key: termKey(t), ...withMark(planetMark(t.ruler)), words: `Term of ${planetName(t.ruler)}, ${termSpan(t)}` }))

/** The planet a sign exalts and its degree: "the Sun at 19°". */
const exaltedIn = (sign: ZodiacSign): string | undefined => {
  const at = EXALTATIONS[sign.id]
  return at && `${bodyName(at.planet)} at ${at.degree}°`
}

const triplicityWords = (element: Element): string => {
  const { day, night, participating } = TRIPLICITY_RULERS[element]
  return `${capital(bodyName(day))} by day, ${bodyName(night)} by night, ${bodyName(participating)} with both`
}

/** The ruler as the tradition gives it, and the modern one beside it where they differ. */
const rulerWords = (sign: ZodiacSign): string => {
  const ruler = TRADITIONAL_RULERS[sign.id]
  return ruler === sign.ruler ? planetName(ruler) : `${planetName(ruler)}; ${planetName(sign.ruler)} in modern astrology`
}

const signWords = (sign: ZodiacSign): string =>
  `${sign.element}, ${sign.modality}, ${polarityOf(sign)} · ruled by ${bodyName(TRADITIONAL_RULERS[sign.id])} · exalts ${exaltedIn(sign) ?? 'no planet'}`

/* ---------- the year ---------- */

export type Ingress = Instant & { readonly sign: ZodiacSign }

/** The Sun's ingresses from `from`, a year of them from the sign at `signIndex`, tropical or sidereal, each searched from the last. */
export function ingressYear(signIndex: number, from: Date, zodiac: 'tropical' | 'sidereal' = 'tropical'): readonly Ingress[] {
  const found: Ingress[] = []
  for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
    const sign = ZODIAC_SIGNS[(signIndex + i) % ZODIAC_SIGNS.length]
    const at = sunReaches(sign.degreesStart, found.length > 0 ? found[found.length - 1].at : from, zodiac)
    if (!at) break
    found.push({ ...at, sign })
  }
  return found
}

const TURNING_KEY: LegendEntry = { key: 'turning', ...withMark(SUN_MARK), words: 'A turning of the year: an equinox, a solstice, or a cross-quarter at 15° of a fixed sign' }

const turningEvent = (turning: SolarTurning, cell: string): CellEvent => ({ name: instantWords(turning.name, turning, cell), key: TURNING_KEY.key, ...withMark(SUN_MARK) })

const ELEMENT_KEYS: readonly LegendEntry[] = (Object.keys(ELEMENT_COLOURS) as Element[]).map((element) => ({
  key: element,
  band: element,
  tint: ELEMENT_COLOURS[element],
  words: `${capital(element)}: ${ZODIAC_SIGNS.filter((s) => s.element === element)
    .map((s) => s.name)
    .join(', ')}, in the modern colours`,
}))

/** The twelve signs on a ring from Aries, each with the day the Sun enters it: the sign it is in since it entered, the rest in the year ahead. */
function yearRing(day: string, ingresses: readonly Ingress[], turnings: readonly SolarTurning[], here: ZodiacSign): CalendarView {
  const dates = new Map(ingresses.map((i) => [i.sign.id, i]))
  const cells: CalendarCell[] = ZODIAC_SIGNS.map((sign) => {
    const at = dates.get(sign.id)
    const now = sign.id === here.id
    const turns = turnings.filter((t) => signIndexAt(t.longitude) === sign.number - 1)
    /* An equinox or solstice is the ingress itself, said once. */
    const opening = turns.find((t) => t.longitude === sign.degreesStart)
    const when = at && `${opening ? `at the ${opening.name}, ` : ''}${atWords(at)}`
    const entered = at && (now ? `the Sun has been in it since ${when}` : `the Sun enters it ${when}, ${fromToday(daysFrom(day, at.date))}`)
    return {
      key: sign.id,
      ...withMark(signMark(sign.name)),
      title: sign.name,
      ...(at ? { note: dateWords(at.date) } : {}),
      band: sign.element,
      tint: ELEMENT_COLOURS[sign.element],
      ...(turns.length > 0 ? { events: turns.map((t) => turningEvent(t, t.date)) } : {}),
      state: now ? 'today' : 'ahead',
      said: [sign.name, ...(entered ? [entered] : []), signWords(sign), ...turns.filter((t) => t !== opening).map((t) => `${t.name}, ${atWords(t)}`)].join(' · '),
    }
  })
  const sections = [{ columns: ZODIAC_SIGNS.length, cells }]
  return {
    id: 'year',
    layout: 'ring',
    name: 'The year ahead',
    tab: 'Year',
    sections,
    legend: keyedLegend([...ELEMENT_KEYS, TURNING_KEY], sections),
    caption: `The day the Sun enters each sign, from ${here.name}`,
  }
}

/* ---------- the season ---------- */

interface SunDay {
  readonly date: string
  readonly degree: number
  readonly decan: number
  readonly decanRuler: string
  readonly term: Term
}

function sunDay(date: string, longitude: number, sign: ZodiacSign): SunDay {
  const face = decanAt(longitude)
  return { date, degree: Math.floor(longitude - sign.degreesStart), decan: face.decan, decanRuler: face.ruler, term: termAt(longitude) }
}

const INGRESS = 'ingress'

/** The terms as a ladder: each its planet, its degrees and the days the Sun holds it. */
function termLadder(sign: ZodiacSign, days: readonly SunDay[], now: Term): CalendarView {
  const cells: CalendarCell[] = termsOf(sign.id).map((term) => {
    const held = days.filter((d) => d.term.n === term.n)
    const [first, last] = [held[0]?.date, held[held.length - 1]?.date]
    const state = term.n === now.n ? 'today' : term.n < now.n ? 'past' : 'ahead'
    const holds = state === 'past' ? 'held' : state === 'today' ? 'holds' : 'will hold'
    return {
      key: termKey(term),
      ...withMark(planetMark(term.ruler)),
      label: { text: `${term.start}°–${term.end}°` },
      title: planetName(term.ruler),
      ...(first && last ? { note: first === last ? dateWords(first) : `${dateWords(first)} to ${dateWords(last)}` } : {}),
      state,
      said: [`Term of ${planetName(term.ruler)}`, `${termSpan(term)} of ${sign.name}`, ...(first && last ? [`the Sun ${holds} it ${dayWords(first)} to ${dayWords(last)}`] : [])].join(' · '),
    }
  })
  return {
    id: 'terms',
    layout: 'ladder',
    name: `The terms of ${sign.name}`,
    tab: 'Terms',
    sections: [{ columns: 1, cells }],
    legend: [],
    caption: `Ptolemy's Egyptian terms; the Sun in ${planetName(now.ruler)}'s`,
  }
}

/** The next term and decan the Sun moves into in this sign, each on the season's cell whose noon first finds it there. */
function lordsAhead(day: string, sky: Sky, sign: ZodiacSign, today: SunDay, inSeason: ReadonlySet<string>): readonly BoardEvent[] {
  const inRun = (crossing: NoonCrossing | null): crossing is NoonCrossing => crossing !== null && inSeason.has(crossing.noon)
  const term = termsOf(sign.id).find((t) => t.n === today.term.n + 1)
  const termCrossing = term ? sunArrives(day, sign.degreesStart + term.start, 'tropical', sky) : null
  const decanStart = sign.degreesStart + today.decan * DECAN_DEGREES
  const decan = today.decan < DECANS_IN_SIGN ? decanAt(decanStart) : undefined
  const decanCrossing = decan ? sunArrives(day, decanStart, 'tropical', sky) : null
  return [
    ...(term && inRun(termCrossing) ? [event(`Term of ${planetName(term.ruler)}, ${term.start}°`, termCrossing, planetMark(term.ruler), { view: 'season', cell: termCrossing.noon })] : []),
    ...(decan && inRun(decanCrossing)
      ? [event(`Decan ${ROMAN[decan.decan - 1]}, ${planetName(decan.ruler)}`, decanCrossing, planetMark(decan.ruler), { view: 'season', cell: decanCrossing.noon })]
      : []),
  ]
}

export function sunBoard(day: string, sky: Sky): DayBoard {
  const read = zodiacSun(sky, 'tropical')
  const sign = ZODIAC_SIGNS[signIndexAt(read(day, NOON))]
  if (!sign) throw new RangeError(`No sign for ${day}`)
  const run = seasonOn(day, 'tropical', sky)
  const days = daysOf(run).map((date) => sunDay(date, read(date, NOON), sign))
  const today = days.find((d) => d.date === day)
  if (!today) throw new RangeError(`No season cell for ${day}`)
  const inSeason = new Set(days.map((d) => d.date))
  const ingresses = ingressYear(sign.number - 1, noonOf(shiftDay(run.first, -2)))
  const entered = ingresses.find((i) => i.sign.id === sign.id)
  const turnings = solarTurnings(noonOf(shiftDay(run.first, -1)), TURNINGS)
  /* An equinox or solstice is the ingress itself: the season's first day names it once. */
  const opening = turnings.find((t) => t.longitude === sign.degreesStart)
  const glyph = signMark(sign.name)
  const ruler = TRADITIONAL_RULERS[sign.id]
  const element = elementMark(sign.element)

  const cells = days.map((d, i): CalendarCell => {
    const ingress = i === 0 && entered && noonDayOf(entered.at) === d.date
    const turns = turnings.filter((t) => t !== opening && noonDayOf(t.at) === d.date)
    const events: CellEvent[] = [
      ...(ingress ? [{ name: instantWords(opening ? `${opening.name}, the Sun enters ${sign.name}` : `Sun enters ${sign.name}`, entered, d.date), key: INGRESS, ...withMark(glyph) }] : []),
      ...turns.map((t) => turningEvent(t, d.date)),
    ]
    return {
      key: d.date,
      ...withMark(planetMark(d.term.ruler)),
      label: { text: `${d.degree}°` },
      ...monthNote(d.date, i === 0),
      band: decanKey(d.decan),
      ...(events.length > 0 ? { events } : {}),
      keys: [termKey(d.term)],
      state: stateOf(d.date, day),
      said: [
        dayWords(d.date),
        `Sun at ${d.degree}° ${sign.name}`,
        `${ORDINAL[d.decan - 1]} decan, ruled by ${bodyName(d.decanRuler)}`,
        `term of ${planetName(d.term.ruler)}, ${termSpan(d.term)}`,
        ...events.map((e) => e.name),
      ].join(' · '),
    }
  })
  const sections = [inWeeks(cells, run.first, WEEK_LOCALE)]
  const season: CalendarView = {
    id: 'season',
    layout: 'grid',
    name: `${sign.name}'s season`,
    tab: 'Season',
    sections,
    legend: keyedLegend([...decanLegend(sign), ...termLegend(sign), { key: INGRESS, ...withMark(glyph), words: `The day the Sun enters ${sign.name}` }, TURNING_KEY], sections),
    /* Whole degrees gone, as the value counts them. */
    caption: `${today.degree} of ${SIGN_DEGREES} degrees of ${sign.name} crossed`,
  }

  const noon = noonOf(day)
  const ingressesAhead = ingresses.filter((i) => i.at > noon).slice(0, INGRESSES_NEXT)
  /* An ingress at an equinox or solstice is named as one; the next turning beside them is the next not already named. */
  const openingOf = (i: Ingress) => turnings.find((t) => t.longitude === i.sign.degreesStart && t.date === i.date)
  const turning = turnings.find((t) => t.at > noon && !ingressesAhead.some((i) => openingOf(i) === t))
  const turningCell = turning && noonDayOf(turning.at)
  const next: BoardEvent[] = [
    ...lordsAhead(day, sky, sign, today, inSeason),
    ...(turning && turningCell
      ? [
          instantEvent(
            instantWords(turning.name, turning, turning.date),
            turning,
            day,
            SUN_MARK,
            inSeason.has(turningCell) ? { view: 'season', cell: turningCell } : { view: 'year', cell: ZODIAC_SIGNS[signIndexAt(turning.longitude)].id },
          ),
        ]
      : []),
    ...ingressesAhead.map((i) => {
      const at = openingOf(i)
      return instantEvent(instantWords(`Enters ${i.sign.name}${at ? ` at the ${at.name}` : ''}`, i, i.date), i, day, signMark(i.sign.name), { view: 'year', cell: i.sign.id })
    }),
  ].sort(byDate)

  const exaltation = EXALTATIONS[sign.id]
  const fall = fallIn(sign)
  const detriment = detrimentIn(sign)
  const facts: BoardFact[] = [
    { label: 'Element', value: capital(sign.element), mark: element },
    { label: 'Modality', value: capital(sign.modality) },
    { label: 'Polarity', value: capital(polarityOf(sign)) },
    { label: 'Ruler', value: rulerWords(sign), ...withMark(planetMark(ruler)) },
    { label: 'Exaltation', value: capital(exaltedIn(sign) ?? 'no planet'), ...withMark(exaltation && planetMark(exaltation.planet)) },
    { label: 'Detriment', value: planetName(detriment), ...withMark(planetMark(detriment)) },
    { label: 'Fall', value: fall ? planetName(fall) : 'No planet', ...withMark(fall && planetMark(fall)) },
    { label: 'Triplicity', value: triplicityWords(sign.element) },
    { label: 'Decan', value: `${ROMAN[today.decan - 1]}, ruled by ${bodyName(today.decanRuler)}`, ...withMark(planetMark(today.decanRuler)) },
    { label: 'Term', value: `${planetName(today.term.ruler)}, ${termSpan(today.term)}`, ...withMark(planetMark(today.term.ruler)) },
    ...(entered ? [{ label: 'Entered', value: `${atWords(entered)}, ${fromToday(daysFrom(day, entered.date))}` }] : []),
  ]

  return {
    value: `${today.degree}° ${sign.name}`,
    meaning: signReading(sign.id).meaning,
    mast: {
      numeral: { text: `${today.degree}°` },
      title: sign.name,
      words: [{ text: capital(sign.element), mark: element }, { text: capital(sign.modality) }, { text: capital(polarityOf(sign)) }, { text: `ruled by ${planetName(ruler)}`, ...withMark(planetMark(ruler)) }],
    },
    facts,
    views: [season, yearRing(day, ingresses, turnings, sign), termLadder(sign, days, today.term)],
    next,
  }
}
