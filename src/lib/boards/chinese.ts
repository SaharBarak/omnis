import { dayPillar, monthPillar, type StemBranch } from '@pleiad/engine/calculations/bazi'
import { YEARS_IN_CYCLE, chineseYearOf, type ChineseYear } from '@pleiad/engine/calculations/calendars'
import {
  chineseNewYear,
  chineseYearOn,
  elongationOn,
  festivalsIn,
  lunarDateOn,
  lunarMonthOn,
  monthAfter,
  nextChineseNewYear,
  nextSolarTerms,
  solarTermOn,
  solarTermsOf,
  solarYearOn,
  type DatedTerm,
  type LunarMonth,
} from '@pleiad/engine/calculations/chinese-calendar'
import { daysFrom } from '@pleiad/engine/calculations/day-search'
import { DAYS_IN_XUN, XUN } from '@pleiad/engine/data/chinese-months'
import { BRANCHES, STEMS, pairAt, positionOf, type StemBranchPair } from '@pleiad/engine/data/sexagenary'
import { SOLAR_TERMS, type SolarTerm, type TermSeason } from '@pleiad/engine/data/solar-terms'
import { PHASES, phaseNamed, type PhaseName } from '@pleiad/engine/data/wuxing'
import { dayFinder, placed, type CellFinder, type Run } from './months'
import { FULL_TURN, byDate, dateWords, dayWords, daysOf, event, keyedLegend, monthNote, moonMark, stateOf } from './parts'
import type { BoardEvent, BoardMark, CalendarCell, CalendarHead, CalendarSection, CalendarView, CellEvent, CellState, DayBoard, LegendEntry, Tint } from './types'
import { fact } from '@/lib/atlas/explain'

/**
 * The Chinese calendar's board (BENTO_BOARDS.md "Systems", Chinese): this
 * lunar month and the next in the month's three decades of ten days, each
 * day its Moon at noon in Beijing, its day as written and its stem and
 * branch, tinted by its stem's phase; the solar terms and festivals on their
 * days; the twenty-four terms of the solar year round a ring, banded by
 * season; the twelve years of this turn of the animals; and the sixty,
 * tinted by phase, yang a solid line and yin a broken one. The engine
 * (chinese-calendar.ts and data/{sexagenary,solar-terms,chinese-months,
 * wuxing}.ts) owns the months, terms, festivals and names, every date in
 * Beijing; this file the words.
 */

const ZH = 'zh'
/** The sixty in rows of twelve: one row per turn of the animals, so a column is one animal. */
const ANIMALS = BRANCHES.length
const NEXT_COUNT = 5

/**
 * A phase's source colour (BENTO_BOARDS.md "Source colours"): each phase's
 * colour in the correspondences, wood's blue-green (青) drawn as the green
 * tint, the closed set holding no blue-green; the phase's character carries
 * it where colour cannot.
 */
const PHASE_TINT: Readonly<Record<PhaseName, Tint>> = { Wood: 'green', Fire: 'red', Earth: 'yellow', Metal: 'white', Water: 'black' }

const phaseKey = (phase: PhaseName): string => phase.toLowerCase()

const PHASE_KEYS: readonly LegendEntry[] = PHASES.map((p) => ({
  key: phaseKey(p.name),
  band: phaseKey(p.name),
  tint: PHASE_TINT[p.name],
  words: `${p.name} ${p.character}, ${p.colourCharacter} ${p.colour}: its stems' days${p.name === 'Earth' ? '' : `, its season ${p.season}`}`,
}))

const POLARITY_KEYS: readonly LegendEntry[] = [
  { key: 'yang', mark: { kind: 'line', yang: true }, words: 'Yang: an odd stem, a solid line' },
  { key: 'yin', mark: { kind: 'line', yang: false }, words: 'Yin: an even stem, a broken line' },
]

const SEASON_PHASE: Readonly<Record<TermSeason, PhaseName>> = { spring: 'Wood', summer: 'Fire', autumn: 'Metal', winter: 'Water' }
const SEASON_KEYS: readonly LegendEntry[] = (Object.keys(SEASON_PHASE) as TermSeason[]).map((season) => {
  const phase = phaseNamed(SEASON_PHASE[season])
  return { key: season, band: season, tint: PHASE_TINT[phase.name], words: `${season[0]?.toUpperCase()}${season.slice(1)}, the season of ${phase.name.toLowerCase()} ${phase.character}` }
})
const PRINCIPAL: LegendEntry = { key: 'principal', words: 'A principal term (zhongqi), by which the lunar months are numbered' }
const TERM: LegendEntry = { key: 'term', words: 'A solar term begins, on its day in Beijing' }
const FESTIVAL: LegendEntry = { key: 'festival', words: 'A traditional festival' }

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'] as const
const monthWords = (month: LunarMonth): string => `the ${month.leap ? 'leap ' : ''}${ORDINALS[month.number - 1] ?? ''} month`

const yearName = (year: ChineseYear): string => `${year.polarity} ${year.element} ${year.animal}`
const characters = (text: string): BoardMark => ({ kind: 'text', text, lang: ZH })
const pairWords = (pair: StemBranchPair): string => `${pair.characters} ${pair.pinyin}, ${pair.stem.polarity} ${pair.stem.phase} ${pair.branch.animal}`

/** A pillar's place in the sixty, its characters and pinyin. */
const pairOf = (pillar: StemBranch): StemBranchPair => pairAt(positionOf(pillar.stem, pillar.branch))
/** The day's stem and branch, one place of the sixty a day (`dayPillar`). */
const dayPair = (date: string): StemBranchPair => pairOf(dayPillar(date))

const stateOfIndex = (n: number, today: number): CellState => (n < today ? 'past' : n === today ? 'today' : 'ahead')

/* ---------- month ---------- */

/** A run of the calendar's days: a lunar month's first day and length. */
const runOf = (month: LunarMonth): Run => ({ first: month.first, length: month.length })

function monthSection(month: LunarMonth, terms: readonly DatedTerm[], day: string): CalendarSection {
  const festivals = festivalsIn(month)
  const cells = daysOf(runOf(month)).map((date, i): CalendarCell => {
    const pair = dayPair(date)
    const lunar = lunarDateOn(date)
    const events: CellEvent[] = [
      ...terms.filter((t) => t.date === date).map((t) => ({ name: `${t.term.pinyin} ${t.term.characters}`, key: TERM.key })),
      ...festivals.filter((f) => f.date === date).map((f) => ({ name: `${f.name} ${f.characters}`, key: FESTIVAL.key })),
    ]
    return {
      key: date,
      mark: moonMark(elongationOn(date)),
      label: { text: lunar.dayCharacters, lang: ZH },
      title: pair.characters,
      ...monthNote(date, i === 0),
      band: phaseKey(pair.stem.phase),
      tint: PHASE_TINT[pair.stem.phase],
      ...(events.length > 0 ? { events } : {}),
      state: stateOf(date, day),
      said: [dayWords(date), `${lunar.characters}, day ${lunar.day} of ${monthWords(month)}`, `day ${pairWords(pair)}`, ...events.map((e) => e.name)].join(' · '),
    }
  })
  const rowHeads: CalendarHead[] = XUN.slice(0, Math.ceil(month.length / DAYS_IN_XUN)).map((text, i) => ({ text, said: `Days ${i * DAYS_IN_XUN + 1} to ${Math.min(month.length, (i + 1) * DAYS_IN_XUN)}, the ${ORDINALS[i]} ten` }))
  return { name: `${month.characters}, ${monthWords(month)}, ${month.length} days`, columns: DAYS_IN_XUN, rowHeads, cells }
}

function monthView(months: readonly [LunarMonth, LunarMonth], terms: readonly DatedTerm[], day: string): CalendarView {
  const lunar = lunarDateOn(day)
  const sections = months.map((m) => monthSection(m, terms, day))
  return {
    id: 'month',
    layout: 'grid',
    name: `${months[0].characters} and ${months[1].characters}`,
    tab: 'Month',
    sections,
    legend: keyedLegend([...PHASE_KEYS, TERM, FESTIVAL], sections),
    caption: `Day ${lunar.day} of ${monthWords(lunar.month)}, its days in tens; each tinted by its stem's phase`,
  }
}

/* ---------- terms ---------- */

/** The branch of the solar month a sectional term opens: Lichun the Tiger's. */
const TIGER = 2
const openedBranch = (term: SolarTerm) => BRANCHES[(TIGER + term.index / 2) % BRANCHES.length]

/** A term's share of the Sun's turn, and a branch month's: two terms. */
const TERM_DEGREES = FULL_TURN / SOLAR_TERMS.length
const MONTH_DEGREES = FULL_TURN / BRANCHES.length
/** The winter solstice, the middle of the 子 month, where the wheel's turn is measured from. */
const WINTER_SOLSTICE = 270
const onWheel = (longitude: number): number => (((longitude - WINTER_SOLSTICE) % FULL_TURN) + FULL_TURN) % FULL_TURN
/** The year's wheel as the south-up compass sets the branches: 子, north, at the foot, 午, south, at the top, clockwise. The board's choice of the compass's convention. */
const YEAR_WHEEL = { origin: 'bottom', turn: 'clockwise' } as const

/**
 * The year as a wheel (BENTO_BOARDS.md "Figures", Chinese): the twelve
 * solar months by their branches, 子 about the winter solstice, and outside
 * them the twenty-four terms; the hand is the Sun, set between the term in
 * force and the next by the days gone of the days between them.
 */
function termsView(year: readonly DatedTerm[], current: DatedTerm, day: string, following: DatedTerm | undefined): CalendarView {
  const monthNow = Math.floor((onWheel(current.term.longitude) + MONTH_DEGREES / 2) / MONTH_DEGREES) % BRANCHES.length
  const months = BRANCHES.map((branch): CalendarCell => ({
    key: `month-${branch.index}`,
    label: { text: branch.character, lang: ZH },
    title: `${branch.animal} month`,
    /* The months are the terms' ground: the term is the day's place. */
    state: 'ahead',
    said: [`The ${branch.animal} month ${branch.character}, ${branch.pinyin}`, 'a solar month, from one sectional term to the next', ...(branch.index === monthNow ? ['the Sun is in it'] : [])].join(' · '),
  }))
  const gone = following ? daysFrom(current.date, day) / Math.max(1, daysFrom(current.date, following.date)) : 0
  const cells = year.map(({ term, date }): CalendarCell => {
    const branch = term.principal ? undefined : openedBranch(term)
    return {
      key: String(term.index),
      label: { text: term.characters, lang: ZH },
      title: term.pinyin,
      note: dateWords(date),
      band: term.season,
      tint: PHASE_TINT[SEASON_PHASE[term.season]],
      ...(term.principal ? { keys: [PRINCIPAL.key] } : {}),
      state: stateOfIndex(term.index, current.term.index),
      said: [
        `${term.pinyin} ${term.characters}, ${term.english}`,
        `the Sun at ${term.longitude}°`,
        dayWords(date),
        term.principal ? 'a principal term' : `a sectional term, opening the ${branch?.animal ?? ''} month ${branch?.character ?? ''}`,
      ].join(' · '),
    }
  })
  const sections: CalendarSection[] = [
    { name: 'The solar months', columns: months.length, from: onWheel(WINTER_SOLSTICE - MONTH_DEGREES / 2), cells: months },
    { name: 'The solar terms', columns: cells.length, from: onWheel(year[0]?.term.longitude ?? WINTER_SOLSTICE), cells },
  ]
  const lichun = year[0]
  return {
    id: 'terms',
    layout: 'wheel',
    name: 'The solar year',
    tab: 'Year',
    sections,
    legend: keyedLegend([...SEASON_KEYS, PRINCIPAL], sections),
    caption: `${current.term.pinyin} ${current.term.characters} since ${dateWords(current.date)}; the year from Lichun, ${lichun ? dateWords(lichun.date) : ''}`,
    wheel: { ...YEAR_WHEEL, hand: onWheel(current.term.longitude + gone * TERM_DEGREES) },
  }
}

/* ---------- years ---------- */

/** The years of the sixty from its `from`th to its `to`th, the cycle's year `began` among them. */
function years(began: number, from: number, to: number): readonly CalendarCell[] {
  const { cycle } = chineseYearOf(began)
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const gregorian = began - cycle + from + i
    const year = chineseYearOf(gregorian)
    const yang = year.polarity === 'Yang'
    return {
      key: String(gregorian),
      mark: { kind: 'line', yang },
      label: { text: year.characters, lang: ZH },
      title: year.animal,
      note: String(gregorian),
      band: phaseKey(year.element),
      tint: PHASE_TINT[year.element],
      keys: [yang ? 'yang' : 'yin'],
      state: gregorian < began ? 'past' : gregorian === began ? 'today' : 'ahead',
      said: [String(gregorian), year.pinyin, yearName(year), `year ${year.cycle} of ${YEARS_IN_CYCLE}`].join(' · '),
    }
  })
}

function yearViews(began: number): readonly CalendarView[] {
  const year = chineseYearOf(began)
  const row = Math.floor((year.cycle - 1) / ANIMALS)
  const turn: readonly CalendarSection[] = [{ columns: ANIMALS, cells: years(began, row * ANIMALS + 1, (row + 1) * ANIMALS) }]
  /* The sixty as six 旬 of ten: a row opens on a 甲 year, a column is one stem. */
  const sixty: readonly CalendarSection[] = [{ columns: STEMS.length, cells: years(began, 1, YEARS_IN_CYCLE) }]
  return [
    {
      id: 'turn',
      layout: 'grid',
      name: 'This turn of the animals',
      tab: 'Animals',
      sections: turn,
      legend: keyedLegend([...PHASE_KEYS, ...POLARITY_KEYS], turn),
      caption: `Year ${year.cycle} of ${YEARS_IN_CYCLE}`,
    },
    {
      id: 'sixty',
      layout: 'grid',
      name: 'The sixty',
      tab: 'Sixty',
      sections: sixty,
      legend: keyedLegend([...PHASE_KEYS, ...POLARITY_KEYS], sixty),
      caption: `The sixty from ${began - year.cycle + 1} in six tens, each row opening on a 甲 year, each column one stem`,
    },
  ]
}

/* ---------- next ---------- */

/** Months searched for the next festival: a year and its leap month. */
const FESTIVAL_MONTHS = 13

/** Where a view finds the cell a date falls on: by the key `keyOf` gives it, where the view holds that cell. */
const finder = (view: CalendarView, keyOf: (date: string) => string | undefined): CellFinder => {
  const keys = new Set(view.sections.flatMap((s) => s.cells.map((c) => c.key)))
  return {
    view: view.id,
    cell: (date) => {
      const key = keyOf(date)
      return key !== undefined && keys.has(key) ? key : undefined
    },
  }
}

function nextEvents(day: string, views: readonly CalendarView[], run: Run, year: readonly DatedTerm[]): readonly BoardEvent[] {
  const terms = nextSolarTerms(day, 2).map((t) => event(`${t.term.pinyin} ${t.term.characters}, ${t.term.english}`, { date: t.date, inDays: daysFrom(day, t.date) }, characters(t.term.characters)))
  const newYear = nextChineseNewYear(day)
  const named = newYear && chineseYearOf(newYear.year)
  /* The first month's first day is the new year and its Spring Festival: said once, as the year. */
  const turning = (date: string) => date === newYear?.date
  const coming = monthAfter(lunarMonthOn(day))
  const month = turning(coming.first) ? [] : [event(`${coming.characters} begins, ${monthWords(coming)}`, { date: coming.first, inDays: daysFrom(day, coming.first) }, moonMark(0))]
  const festival = (() => {
    for (let m = lunarMonthOn(day), n = 0; n < FESTIVAL_MONTHS; m = monthAfter(m), n++) {
      const found = festivalsIn(m).find((f) => f.date > day && !turning(f.date))
      if (found) return event(`${found.name} ${found.characters}`, { date: found.date, inDays: daysFrom(day, found.date) })
    }
    return undefined
  })()
  const events = [...terms, ...month, ...(festival ? [festival] : []), ...(newYear && named ? [event(`${yearName(named)} year begins`, newYear, characters(named.characters))] : [])]
  const termKey = (date: string) => year.find((t) => t.date === date)?.term.index.toString()
  const yearKey = (date: string) => (chineseNewYear(Number(date.slice(0, 4))) === date ? date.slice(0, 4) : undefined)
  const finders = views.flatMap((v) => (v.id === 'month' ? [dayFinder(v.id, run)] : v.id === 'terms' ? [finder(v, termKey)] : [finder(v, yearKey)]))
  return placed(events, finders, NEXT_COUNT)
}

export function chineseBoard(day: string): DayBoard | undefined {
  const began = chineseYearOn(day)
  if (began === null) return undefined
  const year = chineseYearOf(began)
  const lunar = lunarDateOn(day)
  const months: readonly [LunarMonth, LunarMonth] = [lunar.month, monthAfter(lunar.month)]
  const current = solarTermOn(day)
  const solarYear = solarTermsOf(solarYearOn(day))
  const terms = [...solarYear, ...solarTermsOf(solarYearOn(day) + 1)]
  const opened = chineseNewYear(began)
  const pair = dayPair(day)
  const monthPair = pairOf(monthPillar(day))
  const phase = phaseNamed(year.element)
  const following = terms.find((t) => daysFrom(current.date, t.date) > 0)
  const views = [termsView(solarYear, current, day, following), monthView(months, terms, day), ...yearViews(began)]
  return {
    value: yearName(year),
    meaning: null,
    mast: {
      numeral: { text: year.characters, lang: ZH },
      title: yearName(year),
      words: [{ text: year.pinyin }, { text: `Year ${year.cycle} of ${YEARS_IN_CYCLE}` }, { text: `Day ${lunar.day} of ${monthWords(lunar.month)}` }],
      script: { text: `${year.characters}年${lunar.characters}`, lang: ZH },
    },
    facts: [
      fact('Animal', year.animal),
      fact('Element', `${year.element} ${phase.character}`),
      fact('Polarity', year.polarity),
      ...(opened ? [fact('Began', `${dayWords(opened)}, the new Moon in Beijing`)] : []),
      fact('Lunar date', `${lunar.characters}, day ${lunar.day} of ${monthWords(lunar.month)}`),
      fact('Solar term', `${current.term.pinyin} ${current.term.characters}, ${current.term.english}, since ${dateWords(current.date)}`),
      fact('Day', pairWords(pair)),
      fact('Month', `${pairWords(monthPair)}, from its sectional term`),
    ],
    views,
    next: nextEvents(day, views, { first: months[0].first, length: months[0].length + months[1].length }, solarYear),
  }
}

