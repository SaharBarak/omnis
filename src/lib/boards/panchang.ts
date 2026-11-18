import { daysFrom, midnightInZone, shiftDay } from '@pleiad/engine/calculations/day-search'
import {
  INDIA_HOURS,
  TITHIS,
  TITHI_DEGREES,
  UJJAIN,
  daysOfMonth,
  indiaTime,
  monthAfter,
  nextSankranti,
  panchang,
  panchangDay,
  tithiBegins,
  tithiDay,
  tithiNumbered,
  type PanchangDay,
  type Tithi,
} from '@pleiad/engine/calculations/panchang'
import { NAKSHATRAS, VIMSHOTTARI, type Nakshatra } from '@pleiad/engine/data/nakshatras'
import { PAKSHAS, YOGA_NAMES } from '@pleiad/engine/data/panchang'
import { dayFinder, placed, type Run } from './months'
import { dateWords, dayWords, daysOf, event, inWeeks, keyedLegend, monthNote, monthWords, moonMark, numeral, planetMark, stateOf, twoCivilMonths } from './parts'
import type { BoardEvent, BoardMark, CalendarCell, CalendarSection, CalendarView, CellEvent, CellState, DayBoard, LegendEntry, Tint } from './types'
import { fact } from '@/lib/atlas/explain'

/**
 * The Panchang's board (BENTO_BOARDS.md "Systems", Panchang): every limb
 * read at the day's sunrise in Ujjain. The lunar month's thirty tithis in
 * their two pakshas, each by the sunrises it holds, the lost (kshaya) and
 * the doubled (vriddhi) keyed; this civil month and the next, each day its
 * five limbs at sunrise, its Ekadashi, Purnima, Amavasya and sankranti; and
 * the twenty-seven nakshatras round a ring, banded by their Vimshottari
 * lords. The engine (panchang.ts, data/panchang.ts, data/nakshatras.ts) owns
 * the limbs, months and instants, its times in IST; this file the words.
 */

const WEEK_LOCALE = 'hi-IN'
const IN_PAKSHA = TITHIS / 2
/** A paksha's fifteen tithis in three rows of five. */
const PAKSHA_ROWS = 3
const NEXT_COUNT = 6
/** The two Ekadashis, the bright half's and the dark's. */
const EKADASHIS: readonly number[] = [11, IN_PAKSHA + 11]
/** Purnima and Amavasya, the tithis the lunation turns on. */
const ENDS: readonly number[] = [IN_PAKSHA, TITHIS]
/** Days either side of the day the nakshatra ring reads the Moon's sunrises over: a circuit of the twenty-seven. */
const CIRCUIT_HALF = Math.ceil(NAKSHATRAS.length / 2) + 1

const band = (tithi: Tithi): string => tithi.paksha.toLowerCase()
/** A paksha's source colour: the bright half white, the dark half black. */
const tintOf = (tithi: Tithi): Tint => (tithi.paksha === 'Shukla' ? 'white' : 'black')

const PAKSHA_KEYS: readonly LegendEntry[] = [
  { key: 'shukla', band: 'shukla', tint: 'white', words: `Shukla paksha ${PAKSHAS.Shukla.devanagari}, ${PAKSHAS.Shukla.words}` },
  { key: 'krishna', band: 'krishna', tint: 'black', words: `Krishna paksha ${PAKSHAS.Krishna.devanagari}, ${PAKSHAS.Krishna.words}` },
]
const KSHAYA: LegendEntry = { key: 'kshaya', words: 'Kshaya: no sunrise falls in it, so it is lost to the count' }
const VRIDDHI: LegendEntry = { key: 'vriddhi', words: 'Vriddhi: two sunrises fall in it, so it is kept twice' }
const EKADASHI: LegendEntry = { key: 'ekadashi', words: 'Ekadashi, the eleventh tithi, kept on its sunrise' }
const PURNIMA: LegendEntry = { key: 'purnima', words: 'Purnima begins: the full Moon tithi' }
const AMAVASYA: LegendEntry = { key: 'amavasya', words: 'Amavasya begins: the new Moon tithi' }
/** A Sankranti is dated, not timed: the engine's mean Lahiri ayanamsa puts its instant up to forty minutes from the almanac's (BENTO_BOARDS.md "Sidereal"). */
const SANKRANTI: LegendEntry = { key: 'sankranti', words: 'Sankranti: the Sun enters the next rashi' }
const VISHTI: LegendEntry = { key: 'vishti', words: 'Vishti (Bhadra) at sunrise, the karana avoided for undertakings' }

const lordKey = (n: Nakshatra): string => n.lord.name.toLowerCase()
const LORD_KEYS: readonly LegendEntry[] = VIMSHOTTARI.map((lord) => {
  const mark = planetMark(lord.lord)
  return {
    key: lord.name.toLowerCase(),
    band: lord.name.toLowerCase(),
    ...(mark ? { mark } : {}),
    words: `${lord.name}: ${NAKSHATRAS.filter((n) => n.lord.name === lord.name).map((n) => n.name).join(', ')}`,
  }
})

const tithiWords = (tithi: Tithi): string => `${tithi.paksha} ${tithi.name}, tithi ${tithi.n} of ${TITHIS}`
/** The Moon's face at a tithi's middle. */
const middleOf = (tithi: Tithi): BoardMark => moonMark((tithi.n - 0.5) * TITHI_DEGREES)
const limbWords = (p: PanchangDay): string => [`${p.tithi.paksha} ${p.tithi.name}`, p.nakshatra.name, p.yoga.name, p.karana, p.vara.name].join(' · ')
const stateOfIndex = (n: number, today: number): CellState => (n < today ? 'past' : n === today ? 'today' : 'ahead')

/* ---------- tithis ---------- */

function tithisView(today: PanchangDay): CalendarView {
  const days = daysOfMonth(today.month)
  const sunrises = new Map<number, string[]>()
  for (const date of days) {
    const n = panchangDay(date).tithi.n
    sunrises.set(n, [...(sunrises.get(n) ?? []), date])
  }
  const cellOf = (n: number): CalendarCell => {
    const t = tithiNumbered(n)
    const dates = sunrises.get(n) ?? []
    const counted = dates.length === 0 ? [KSHAYA.key] : dates.length > 1 ? [VRIDDHI.key] : []
    return {
      key: String(n),
      mark: middleOf(t),
      label: numeral(t.inPaksha, 'deva'),
      title: t.name,
      note: dates[0] ? dateWords(dates[0]) : 'no sunrise',
      band: band(t),
      tint: tintOf(t),
      ...(counted.length > 0 ? { keys: counted } : {}),
      state: stateOfIndex(n, today.tithi.n),
      said: [
        tithiWords(t),
        dates.length === 0 ? 'no sunrise falls in it: kshaya, lost to the count' : `the sunrise of ${dates.map(dayWords).join(' and ')}${dates.length > 1 ? ': vriddhi, kept twice' : ''}`,
      ].join(' · '),
    }
  }
  const paksha = (from: number, name: string): CalendarSection => ({
    name,
    columns: IN_PAKSHA / PAKSHA_ROWS,
    cells: Array.from({ length: IN_PAKSHA }, (_, i) => cellOf(from + i)),
  })
  const sections = [paksha(1, `Shukla paksha ${PAKSHAS.Shukla.devanagari}`), paksha(IN_PAKSHA + 1, `Krishna paksha ${PAKSHAS.Krishna.devanagari}`)]
  return {
    id: 'tithis',
    layout: 'grid',
    name: `The tithis of ${today.month.words}`,
    tab: 'Tithis',
    sections,
    legend: keyedLegend([...PAKSHA_KEYS, KSHAYA, VRIDDHI], sections),
    caption: `Tithi ${today.tithi.n} of ${TITHIS}; ${days.length} sunrises from ${dateWords(days[0] ?? today.date)}, each tithi by the sunrises it holds`,
  }
}

/* ---------- the two months ---------- */

/** The days in a span on which the Ekadashis fall, Purnima and Amavasya begin, and the Sun enters a rashi, each with its words. */
function almanac(first: string, last: string): ReadonlyMap<string, readonly CellEvent[]> {
  const found = new Map<string, CellEvent[]>()
  const add = (date: string, e: CellEvent) => {
    if (date >= first && date <= last) found.set(date, [...(found.get(date) ?? []), e])
  }
  const from = midnightInZone(first, INDIA_HOURS)
  const until = midnightInZone(shiftDay(last, 1), INDIA_HOURS)
  for (const n of [...EKADASHIS, ...ENDS]) {
    for (let at = from; ; ) {
      const span = tithiDay(n, at)
      if (span.begins.at >= until) break
      if (EKADASHIS.includes(n)) add(span.day, { name: `${span.tithi.paksha} Ekadashi${span.sunrises === 0 ? `, ${indiaTime(span.begins.at)} to ${indiaTime(span.ends.at)} IST` : ''}`, mark: middleOf(span.tithi), key: EKADASHI.key })
      else add(span.begins.date, { name: `${span.tithi.name} from ${indiaTime(span.begins.at)} IST`, mark: middleOf(span.tithi), key: n === IN_PAKSHA ? PURNIMA.key : AMAVASYA.key })
      at = span.ends.at
    }
  }
  for (let at = from; ; ) {
    const s = nextSankranti(at)
    if (s.at >= until) break
    const mark = planetMark('sun')
    add(s.date, { name: `${s.rashi.name} Sankranti`, ...(mark ? { mark } : {}), key: SANKRANTI.key })
    at = s.at
  }
  return found
}

function monthsView(day: string): CalendarView {
  const months = twoCivilMonths(day)
  const first = months[0].first
  const last = shiftDay(months[1].first, months[1].length - 1)
  const events = almanac(first, last)
  const cellOf = (date: string, firstOfRun: boolean): CalendarCell => {
    const p = panchangDay(date)
    const happens = events.get(date) ?? []
    return {
      key: date,
      mark: moonMark(p.elongation),
      label: numeral(p.tithi.inPaksha, 'deva'),
      ...monthNote(date, firstOfRun),
      band: band(p.tithi),
      ...(happens.length > 0 ? { events: happens } : {}),
      ...(p.vishti ? { keys: [VISHTI.key] } : {}),
      state: stateOf(date, day),
      said: [dayWords(date), limbWords(p), ...happens.map((e) => e.name)].join(' · '),
    }
  }
  const sections = months.map((month) => inWeeks(daysOf(month).map((date, i) => cellOf(date, i === 0)), month.first, WEEK_LOCALE, monthWords(month.first)))
  return {
    id: 'months',
    layout: 'grid',
    name: `${monthWords(months[0].first)} and ${monthWords(months[1].first)}`,
    tab: 'Month',
    sections,
    legend: keyedLegend([...PAKSHA_KEYS, EKADASHI, PURNIMA, AMAVASYA, SANKRANTI, VISHTI], sections),
    caption: `Each day's tithi, nakshatra, yoga, karana and vara at sunrise in ${UJJAIN.name}`,
  }
}

/* ---------- nakshatras ---------- */

function nakshatrasView(day: string, today: PanchangDay): CalendarView {
  /* The Moon's circuit about the day: the mansions ahead of today's by the sunrises to come, those behind by the sunrises gone. */
  const held = new Map<number, string>()
  for (let i = 1; i <= CIRCUIT_HALF; i++) {
    for (const date of [shiftDay(day, i), shiftDay(day, -i)]) {
      const n = panchangDay(date).nakshatra.n
      const offset = (n - today.nakshatra.n + NAKSHATRAS.length) % NAKSHATRAS.length
      const ahead = offset > 0 && offset <= NAKSHATRAS.length / 2
      if (offset !== 0 && ahead === date > day && !held.has(n)) held.set(n, date)
    }
  }
  const cells = NAKSHATRAS.map((n): CalendarCell => {
    const offset = (n.n - today.nakshatra.n + NAKSHATRAS.length) % NAKSHATRAS.length
    const date = offset === 0 ? day : held.get(n.n)
    const mark = planetMark(n.lord.lord)
    return {
      key: String(n.n),
      ...(mark ? { mark } : {}),
      label: numeral(n.n, 'deva'),
      title: n.name,
      note: date ? dateWords(date) : 'no sunrise',
      band: lordKey(n),
      state: offset === 0 ? 'today' : offset <= NAKSHATRAS.length / 2 ? 'ahead' : 'past',
      said: [
        `${n.name}, nakshatra ${n.n} of ${NAKSHATRAS.length}`,
        `lord ${n.lord.name}, deity ${n.deity}`,
        date ? `the Moon there at the sunrise of ${dayWords(date)}` : 'no sunrise finds the Moon there this circuit',
      ].join(' · '),
    }
  })
  const sections: CalendarSection[] = [{ columns: NAKSHATRAS.length, cells }]
  return {
    id: 'nakshatras',
    layout: 'wheel',
    name: 'The nakshatras',
    tab: 'Nakshatras',
    sections,
    legend: keyedLegend(LORD_KEYS, sections),
    caption: `Nakshatra ${today.nakshatra.n} of ${NAKSHATRAS.length}, ${today.nakshatra.name}, pada ${today.pada}: the Moon at sunrise`,
  }
}

/* ---------- next ---------- */

function nextEvents(day: string, today: PanchangDay, run: Run): readonly BoardEvent[] {
  const from = midnightInZone(day, INDIA_HOURS)
  const dated = (date: string) => ({ date, inDays: daysFrom(day, date) })
  const ekadashis = EKADASHIS.map((n) => tithiDay(n, from)).map((span) => event(`${span.tithi.paksha} Ekadashi`, dated(span.day), middleOf(span.tithi)))
  const ends = ENDS.map((n) => tithiBegins(n, from)).map((b, i) => {
    const t = tithiNumbered(ENDS[i] ?? TITHIS)
    return event(`${t.name} begins, ${indiaTime(b.at)} IST`, dated(b.date), middleOf(t))
  })
  const sankranti = nextSankranti(from)
  const sun = planetMark('sun')
  const coming = monthAfter(today.month)
  return placed(
    [
      ...ekadashis,
      ...ends,
      event(`${sankranti.rashi.name} Sankranti`, dated(sankranti.date), sun),
      event(`${coming.words} begins, ${indiaTime(coming.begins.at)} IST`, dated(coming.begins.date), moonMark(0)),
    ],
    [dayFinder('months', run)],
    NEXT_COUNT,
  )
}

export function panchangBoard(day: string): DayBoard {
  const today = panchangDay(day)
  const words = panchang(day)
  const ends = tithiBegins(today.tithi.n + 1, today.sunrise)
  const lord = today.nakshatra.lord
  const months = twoCivilMonths(day)
  return {
    value: words.tithi,
    meaning: null,
    mast: {
      numeral: numeral(today.tithi.inPaksha, 'deva'),
      title: words.tithi,
      mark: moonMark(today.elongation),
      words: [{ text: `Tithi ${today.tithi.n} of ${TITHIS}` }, { text: `Nakshatra ${today.nakshatra.name}` }, { text: today.vara.name }],
      script: { text: `${PAKSHAS[today.tithi.paksha].devanagari} ${today.tithi.devanagari}`, lang: 'hi' },
    },
    facts: [
      fact('Tithi', `${today.tithi.name}, to ${indiaTime(ends.at)} IST${ends.date === day ? '' : ` ${dateWords(ends.date)}`}`),
      fact('Paksha', `${today.tithi.paksha}, ${PAKSHAS[today.tithi.paksha].words}`),
      fact('Nakshatra', `${today.nakshatra.name}, pada ${today.pada}: lord ${lord.name}, deity ${today.nakshatra.deity}`),
      fact('Yoga', `${today.yoga.name}, ${today.yoga.n} of ${YOGA_NAMES.length}`),
      fact('Karana', today.vishti ? `${today.karana} (Bhadra), avoided for undertakings` : today.karana),
      fact('Vara', `${today.vara.name}, the ${today.vara.lordName}'s day`),
      fact('Month', `${today.month.words} amanta, ${today.purnimanta} purnimanta`),
      fact('Sunrise', `${indiaTime(today.sunrise)} IST in ${UJJAIN.name}`),
    ],
    views: [tithisView(today), monthsView(day), nakshatrasView(day, today)],
    next: nextEvents(day, today, { first: months[0].first, length: months[0].length + months[1].length }),
  }
}
