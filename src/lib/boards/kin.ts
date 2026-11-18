import { getCastle, getClan, getColorFamily, getEarthFamily, kinToCastleNumber, kinToHarmonicNumber } from '@pleiad/engine/calculations/cycles'
import { daysFrom } from '@pleiad/engine/calculations/day-search'
import { countedShift, dateToKin, kinToSeal, kinToTone, spinDates } from '@pleiad/engine/calculations/dreamspell'
import { KINS, MODULE_COLUMNS, MODULE_ROWS, MYSTIC_COLUMN, isMysticColumn, isPortal, modulePlace, oracleKins, type OracleKins } from '@pleiad/engine/calculations/harmonic-module'
import { HEPTAD_COLOURS, PLASMA_CENTRES, PLASMA_NAMES, thirteenMoonDate, thirteenMoonYear } from '@pleiad/engine/calculations/thirteen-moon'
import { getWavespellRole, tonePulsar, type Pulsar } from '@pleiad/engine/calculations/wavespell'
import { generateMantra, kinWords } from '@pleiad/engine/data/mantras'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { getWavespellByKin } from '@pleiad/engine/data/wavespells'
import type { Kin, SealNumber, ToneNumber } from '@pleiad/engine/core/types'
import { byDate, dayWords, daySignMark, event, keyedLegend, monthNote, numeral, stateOf } from './parts'
import type { BoardEvent, BoardFact, BoardMark, CalendarCell, CalendarHead, CalendarSection, CalendarView, CellState, DayBoard, LegendEntry, Tint } from './types'

/**
 * The kin's board (docs/redesign/BENTO_BOARDS.md "The kin's board"): the
 * Dreamspell day as its own sources draw it. The mast is the kin, its tone
 * as bar and dot and its seal's glyph, and the affirmation's words; the
 * views are its wavespell (thirteen kins, tone by tone, keyed by pulsar),
 * the Tzolk'in as the harmonic module (thirteen columns of twenty, the
 * fifty-two galactic activation portals marked, the mystic column keyed),
 * its fifth-force oracle as a cross, and the 13-Moon month its day falls
 * in (four heptads under the seven radial plasmas). Each kin carries its
 * seal's colour and the civil date it falls on in this spin, 29 February
 * outside the count.
 */

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const sealOf = (kin: number) => SEALS[kinToSeal(kin as Kin) - 1]
const toneOf = (kin: number) => TONES[kinToTone(kin as Kin) - 1]
/** A kin's name as the Dreamspell writes it: its seal's colour, its tone, its seal. */
const kinTitle = (kin: number): string => `${capital(sealOf(kin)?.color ?? '')} ${toneOf(kin)?.name ?? ''} ${sealOf(kin)?.english ?? ''}`
const kinMark = (kin: number): BoardMark | undefined => daySignMark(kinToSeal(kin as Kin))
const kinTint = (kin: number): Tint => sealOf(kin)?.color ?? 'white'
const kinState = (kin: number, today: number): CellState => (kin < today ? 'past' : kin === today ? 'today' : 'ahead')

/* ---------- colours ---------- */

/** The four seal colours and what each does (Dreamspell's colour families: the direction each sits in, its action). */
const COLOUR_KEYS: readonly LegendEntry[] = (['red', 'white', 'blue', 'yellow'] as const).map((colour) => {
  const family = getColorFamily(SEALS.findIndex((s) => s.color === colour) + 1 as SealNumber)
  return { key: colour, tint: colour, words: `${capital(colour)}: ${family.action.toLowerCase()}, from the ${family.direction.toLowerCase()}` }
})

const PORTAL_KEY: LegendEntry = { key: 'portal', words: 'A galactic activation portal, one of the fifty-two on the Loom of Maya' }

/* ---------- wavespell ---------- */

const PULSARS: readonly Pulsar['name'][] = ['Time', 'Life', 'Sense', 'Mind']
const ORDINAL = ['first', 'second', 'third', 'fourth'] as const
const pulsarKey = (pulsar: Pulsar): string => `pulsar-${pulsar.name.toLowerCase()}`
const tonesOf = (name: Pulsar['name']): readonly number[] => TONES.map((t) => t.number).filter((t) => tonePulsar(t).name === name)

/** A pulsar's key: its tones, four apart, and the dimension it holds. */
const PULSAR_KEYS: readonly LegendEntry[] = PULSARS.map((name) => {
  const tones = tonesOf(name)
  const pulsar = tonePulsar(tones[0] ?? 1)
  return { key: pulsarKey(pulsar), mark: { kind: 'text', text: tones.join('·') }, words: `${name} pulsar: tones ${tones.join(', ')}, the ${ORDINAL[pulsar.dimension - 1]} dimension` }
})

/** A tone as the Dreamspell writes it: bars and dots. */
const toneMark = (kin: number): BoardMark => ({ kind: 'bars', n: kinToTone(kin as Kin) })

/**
 * The wavespell's figure (Law of Time, *Thirteen Moons in Motion*): a U on a
 * lattice five wide and five tall. The magnetic gate stands at the top
 * left; the course runs down to the overtone tower, across the foot to the
 * solar tower, and up to the cosmic gate at the top right. A side holds
 * the tones from one tower or gate to the next, so its length is theirs.
 */
const TOWERS = { overtone: 5, solar: 9 } as const
const WAVE_SIDE = TOWERS.overtone
const wavePlace = (tone: number): readonly [number, number] =>
  tone <= TOWERS.overtone ? [tone - 1, 0] : tone <= TOWERS.solar ? [WAVE_SIDE - 1, tone - TOWERS.overtone] : [TONES.length - tone, WAVE_SIDE - 1]

/** What a tone's place on the course is: a gate at either end, a tower at either turn, a chamber between. */
const waveStation = (tone: number): { readonly key: string; readonly name: string } | undefined =>
  tone === 1
    ? { key: 'gate', name: 'the magnetic gate' }
    : tone === TONES.length
      ? { key: 'gate', name: 'the cosmic gate' }
      : tone === TOWERS.overtone
        ? { key: 'tower', name: 'the overtone tower' }
        : tone === TOWERS.solar
          ? { key: 'tower', name: 'the solar tower' }
          : undefined

const STATION_KEYS: readonly LegendEntry[] = [
  { key: 'gate', mark: { kind: 'text', text: `1·${TONES.length}` }, words: `The gates: the magnetic gate opens the wavespell at tone 1, the cosmic gate closes it at tone ${TONES.length}` },
  { key: 'tower', mark: { kind: 'text', text: `${TOWERS.overtone}·${TOWERS.solar}` }, words: `The towers, where the course turns: the overtone tower at tone ${TOWERS.overtone}, the solar tower at tone ${TOWERS.solar}` },
]

function wavespellView(kin: number, spin: readonly string[], day: string): CalendarView {
  const first = kin - kinToTone(kin as Kin) + 1
  const wave = getWavespellByKin(kin)
  const cells: CalendarCell[] = Array.from({ length: TONES.length }, (_, i) => {
    const k = first + i
    const tone = (i + 1) as ToneNumber
    const date = spin[k - 1] ?? day
    const pulsar = tonePulsar(tone)
    const mark = kinMark(k)
    const role = getWavespellRole(tone)
    const station = waveStation(tone)
    return {
      key: String(k),
      over: toneMark(k),
      ...(mark ? { mark } : {}),
      title: sealOf(k)?.english ?? '',
      note: dayWords(date),
      tint: kinTint(k),
      keys: [kinTint(k), pulsarKey(pulsar), ...(station ? [station.key] : [])],
      ...(isPortal(k) ? { events: [{ name: 'galactic activation portal', key: 'portal' }] } : {}),
      state: kinState(k, kin),
      said: [`Kin ${k}, ${kinTitle(k)}`, dayWords(date), `tone ${tone}, ${role}`, ...(station ? [station.name] : []), `${pulsar.name} pulsar`, ...(isPortal(k) ? ['a galactic activation portal'] : [])].join(' · '),
    }
  })
  const places = Object.fromEntries(cells.map((cell, i) => [cell.key, wavePlace(i + 1)]))
  const sections: CalendarSection[] = [{ columns: WAVE_SIDE, places, path: true, cells }]
  return {
    id: 'wavespell',
    layout: 'figure',
    name: wave.name,
    tab: 'Wavespell',
    sections,
    legend: keyedLegend([...STATION_KEYS, ...PULSAR_KEYS, ...COLOUR_KEYS, PORTAL_KEY], sections),
    caption: `Tone ${kinToTone(kin as Kin)} of ${TONES.length}: ${wave.question}`,
  }
}

/* ---------- the harmonic module ---------- */

const MYSTIC_KEY: LegendEntry = { key: 'mystic', mark: { kind: 'text', text: String(MYSTIC_COLUMN) }, words: `The mystic column, the module's middle: kins ${(MYSTIC_COLUMN - 1) * MODULE_ROWS + 1} to ${MYSTIC_COLUMN * MODULE_ROWS}` }

function moduleView(kin: number, spin: readonly string[]): CalendarView {
  const cells: CalendarCell[] = Array.from({ length: KINS }, (_, i) => {
    const k = i + 1
    const { column, row } = modulePlace(k)
    const portal = isPortal(k)
    const mystic = isMysticColumn(k)
    const date = spin[i]
    return {
      key: String(k),
      label: numeral(k, 'latn'),
      tint: kinTint(k),
      keys: [kinTint(k), ...(mystic ? ['mystic'] : [])],
      ...(portal ? { events: [{ name: 'galactic activation portal', key: 'portal' }] } : {}),
      state: kinState(k, kin),
      said: [`Kin ${k}, ${kinTitle(k)}`, ...(date ? [dayWords(date)] : []), `column ${column}, row ${row}`, ...(portal ? ['a galactic activation portal'] : []), ...(mystic ? ['in the mystic column'] : [])].join(' · '),
    }
  })
  const heads: CalendarHead[] = Array.from({ length: MODULE_COLUMNS }, (_, i) => ({
    text: String(i + 1),
    said: `Column ${i + 1}: kins ${i * MODULE_ROWS + 1} to ${(i + 1) * MODULE_ROWS}${i + 1 === MYSTIC_COLUMN ? ', the mystic column' : ''}`,
  }))
  const rowHeads: CalendarHead[] = SEALS.map((seal) => {
    const mark = daySignMark(seal.number)
    return { text: String(seal.number), said: `${capital(seal.color)} ${seal.english}`, tint: seal.color, ...(mark ? { mark } : {}) }
  })
  const places = Object.fromEntries(cells.map((cell) => {
    const { column, row } = modulePlace(Number(cell.key))
    return [cell.key, [row - 1, column - 1] as const]
  }))
  const sections: CalendarSection[] = [{ columns: MODULE_COLUMNS, heads, rowHeads, places, cells }]
  const { column, row } = modulePlace(kin)
  return {
    id: 'tzolkin',
    layout: 'grid',
    name: "The Tzolk'in, the harmonic module",
    tab: "Tzolk'in",
    sections,
    legend: keyedLegend([...COLOUR_KEYS, PORTAL_KEY, MYSTIC_KEY], sections),
    caption: `Kin ${kin} of ${KINS}: column ${column}, the ${sealOf(kin)?.english}'s row ${row}`,
  }
}

/* ---------- the oracle ---------- */

type OracleRole = keyof OracleKins

/** Where each of the oracle's five stands on its cross (row, column), and what it is to the kin (Dreamspell's fifth-force oracle). */
const ORACLE: readonly { readonly role: OracleRole; readonly at: readonly [number, number]; readonly name: string; readonly words: string }[] = [
  { role: 'guide', at: [0, 1], name: 'Guide', words: 'Guide, above: a seal of the same colour, set by the tone, that leads the day' },
  { role: 'antipode', at: [1, 0], name: 'Antipode', words: 'Antipode, beside: the seal ten away, the challenge that strengthens' },
  { role: 'destiny', at: [1, 1], name: 'Destiny', words: 'Destiny, the centre: the kin itself' },
  { role: 'analog', at: [1, 2], name: 'Analog', words: 'Analog, beside: the seal that sums with it to nineteen, the support' },
  { role: 'occult', at: [2, 1], name: 'Occult', words: 'Occult, below: the seal that sums with it to twenty-one, its tone to fourteen, the hidden power' },
]

function oracleView(kin: number, spin: readonly string[], day: string): CalendarView {
  const kins = oracleKins(kin as Kin)
  const cells: CalendarCell[] = ORACLE.map(({ role, name }) => {
    const k = kins[role]
    const mark = kinMark(k)
    const date = spin[k - 1]
    return {
      key: role,
      over: toneMark(k),
      ...(mark ? { mark } : {}),
      label: numeral(k, 'latn'),
      title: name,
      note: kinTitle(k),
      tint: kinTint(k),
      keys: [role, kinTint(k)],
      state: role === 'destiny' ? 'today' : date ? stateOf(date, day) : 'ahead',
      said: [`${name}: kin ${k}, ${kinTitle(k)}`, ...(date ? [dayWords(date)] : [])].join(' · '),
    }
  })
  const places = Object.fromEntries(ORACLE.map(({ role, at }) => [role, at]))
  const sections: CalendarSection[] = [{ columns: 3, places, cells }]
  return {
    id: 'oracle',
    layout: 'figure',
    name: `The oracle of kin ${kin}`,
    tab: 'Oracle',
    sections,
    legend: keyedLegend([...ORACLE.map(({ role, words }) => ({ key: role, words })), ...COLOUR_KEYS], sections),
    caption: `The five kins of kin ${kin}'s fifth-force oracle`,
  }
}

/* ---------- the 13-Moon month ---------- */

function moonView(day: string): CalendarView | undefined {
  const at = thirteenMoonDate(day)
  if (at.kind !== 'day' || !at.moon) return undefined
  const month = thirteenMoonYear(at.yearStart)[at.moon - 1]
  if (!month) return undefined
  const cells: CalendarCell[] = month.days.map(({ iso, dayOfMoon }, i) => {
    const k = dateToKin(iso)
    const mark = kinMark(k)
    const plasma = PLASMA_NAMES[(dayOfMoon - 1) % PLASMA_NAMES.length]
    return {
      key: iso,
      ...(mark ? { mark } : {}),
      label: numeral(dayOfMoon, 'latn'),
      note: monthNote(iso, i === 0).note ?? String(Number(iso.slice(8))),
      tint: kinTint(k),
      keys: [kinTint(k)],
      ...(isPortal(k) ? { events: [{ name: 'galactic activation portal', key: 'portal' }] } : {}),
      state: stateOf(iso, day),
      said: [`${month.moonName} Moon, day ${dayOfMoon}, ${plasma}`, dayWords(iso), `kin ${k}, ${kinTitle(k)}`, ...(isPortal(k) ? ['a galactic activation portal'] : [])].join(' · '),
    }
  })
  const heads: CalendarHead[] = PLASMA_NAMES.map((name, i) => ({ text: name, said: `${name}, held in the ${PLASMA_CENTRES[i]}` }))
  const rowHeads: CalendarHead[] = HEPTAD_COLOURS.map((colour, i) => ({ text: String(i + 1), said: `Week ${i + 1}, the ${colour} heptad`, tint: colour }))
  const sections: CalendarSection[] = [{ columns: PLASMA_NAMES.length, heads, rowHeads, cells }]
  return {
    id: 'moon',
    layout: 'grid',
    name: `The ${month.moonName} Moon, of the ${month.totem}`,
    tab: '13 Moon',
    sections,
    legend: keyedLegend([...COLOUR_KEYS, PORTAL_KEY], sections),
    caption: `Moon ${at.moon} of 13, day ${at.dayOfMoon} of 28, ${at.plasma}`,
  }
}

/* ---------- what comes next ---------- */

/** The first kin after today's, in this spin or the next, that `is`; its kin, its date, and whether it falls in this spin. */
function nextKin(kin: number, spins: readonly string[], is: (k: number) => boolean): { readonly kin: number; readonly date: string; readonly inSpin: boolean } | undefined {
  for (let i = kin; i < kin + KINS; i += 1) {
    const k = (i % KINS) + 1
    const date = spins[i]
    if (date && is(k)) return { kin: k, date, inSpin: i < KINS }
  }
  return undefined
}

function nextEvents(day: string, kin: number, spin: readonly string[]): readonly BoardEvent[] {
  const spins = [...spin, ...spinDates(countedShift(spin[KINS - 1] ?? day, 1))]
  const when = (date: string) => ({ date, inDays: daysFrom(day, date) })
  const onModule = (found: { readonly kin: number; readonly inSpin: boolean }) => (found.inSpin ? { view: 'tzolkin', cell: String(found.kin) } : undefined)
  const portal = nextKin(kin, spins, isPortal)
  const wave = nextKin(kin, spins, (k) => kinToTone(k as Kin) === 1)
  const castle = nextKin(kin, spins, (k) => (k - 1) % (KINS / 5) === 0)
  const moon = thirteenMoonDate(day)
  const newYear = `${moon.yearStart + 1}-07-26`
  const outOfTime = `${moon.yearStart + 1}-07-25`
  const nextMoon = moon.kind === 'day' && moon.moon && moon.moon < 13 ? thirteenMoonYear(moon.yearStart)[moon.moon]?.days[0]?.iso : undefined
  const moonAt = (date: string) => {
    const i = spin.indexOf(date)
    return i < 0 ? undefined : { view: 'tzolkin', cell: String(i + 1) }
  }
  return [
    ...(portal ? [event(`Kin ${portal.kin}, a galactic activation portal`, when(portal.date), kinMark(portal.kin), onModule(portal))] : []),
    ...(wave ? [event(`The ${getWavespellByKin(wave.kin).name} begins`, when(wave.date), kinMark(wave.kin), onModule(wave))] : []),
    ...(castle ? [event(castle.kin === 1 ? `A new spin: the ${castleWords(castle.kin)}` : `The ${castleWords(castle.kin)} begins`, when(castle.date), kinMark(castle.kin), onModule(castle))] : []),
    ...(nextMoon ? [event(`The ${thirteenMoonDate(nextMoon).moonName} Moon begins`, when(nextMoon), undefined, moonAt(nextMoon))] : []),
    ...(daysFrom(day, outOfTime) > 0 ? [event('The Day Out of Time', when(outOfTime), undefined, moonAt(outOfTime))] : []),
    ...(daysFrom(day, newYear) > 0 && !nextMoon ? [event('The 13-Moon new year', when(newYear), undefined, moonAt(newYear))] : []),
  ]
    .filter((e) => e.inDays > 0)
    .sort(byDate)
}

const castleWords = (kin: number): string => {
  const castle = getCastle(kinToCastleNumber(kin as Kin))
  return `${capital(castle.color)} ${castle.direction} ${castle.name}`
}

/* ---------- the board ---------- */

/** The affirmation's five lines as three sentences: what the kin does, what it seals, what guides it. */
const affirmation = (seal: SealNumber, tone: ToneNumber): string => {
  const [does = '', essence = '', seals = '', withTone = '', guide = ''] = generateMantra(SEALS[seal - 1] ?? SEALS[0]!, TONES[tone - 1] ?? TONES[0]!).split('\n')
  return `${does}, ${essence.toLowerCase()}. ${seals} ${withTone.toLowerCase()}. ${guide}.`
}

export function kinBoard(day: string): DayBoard {
  const kin = dateToKin(day)
  const seal = kinToSeal(kin)
  const tone = kinToTone(kin)
  const sealData = SEALS[seal - 1]
  const toneData = TONES[tone - 1]
  if (!sealData || !toneData) throw new RangeError(`No seal or tone for kin ${kin}`)
  const words = kinWords(seal, tone)
  const spin = spinDates(day)
  const title = kinTitle(kin)
  const wave = getWavespellByKin(kin)
  const castle = getCastle(kinToCastleNumber(kin))
  const family = getEarthFamily(seal)
  const clan = getClan(seal)
  const colour = getColorFamily(seal)
  const pulsar = tonePulsar(tone)
  const moon = thirteenMoonDate(day)
  const sealMark = daySignMark(seal)
  const toneMark: BoardMark = { kind: 'bars', n: tone }
  const plasmaAt = moon.plasma ? PLASMA_NAMES.indexOf(moon.plasma as (typeof PLASMA_NAMES)[number]) : -1

  const facts: BoardFact[] = [
    { label: 'Seal', value: `${sealData.english} (${sealData.mayan}): ${words.seal.power}, ${words.seal.action}, ${words.seal.essence.toLowerCase()}`, ...(sealMark ? { mark: sealMark } : {}) },
    { label: 'Tone', value: `${tone}, ${toneData.name}: ${words.tone.power}, ${words.tone.action.toLowerCase()}`, mark: toneMark },
    { label: 'Colour', value: `${capital(sealData.color)}: ${colour.action.toLowerCase()}, from the ${colour.direction.toLowerCase()}` },
    { label: 'Wavespell', value: `${wave.name}, day ${tone} of ${TONES.length}` },
    { label: 'Castle', value: `${castleWords(kin)}, ${castle.theme.split(' - ')[1]?.toLowerCase() ?? castle.theme}` },
    { label: 'Earth family', value: `${family.name}: the ${family.chakra.toLowerCase()}, the ${family.digit.toLowerCase()}` },
    { label: 'Clan', value: `${clan.name}, the ${clan.color} clan` },
    { label: 'Pulsar', value: `${pulsar.name}, the ${ORDINAL[pulsar.dimension - 1]} dimension` },
    { label: 'Harmonic', value: `${kinToHarmonicNumber(kin)} of ${KINS / 4}` },
    { label: '13 Moon', value: moon.formatted },
    ...(plasmaAt >= 0 ? [{ label: 'Plasma', value: `${moon.plasma}, held in the ${PLASMA_CENTRES[plasmaAt]}` }] : []),
    ...(isPortal(kin) ? [{ label: 'Portal', value: 'A galactic activation portal' }] : []),
  ]

  const views = [wavespellView(kin, spin, day), moduleView(kin, spin), oracleView(kin, spin, day), moonView(day)].filter((v): v is CalendarView => v !== undefined)

  return {
    label: `Kin ${kin}`,
    value: title,
    meaning: affirmation(seal, tone),
    mast: {
      numeral: { text: String(kin) },
      title,
      ...(sealMark ? { mark: sealMark } : {}),
      words: [
        { text: `Tone ${tone}, ${toneData.name}: ${words.tone.power}`, mark: toneMark },
        { text: `${sealData.english}: ${words.seal.power}`, ...(sealMark ? { mark: sealMark } : {}) },
        { text: `${wave.name}, day ${tone} of ${TONES.length}` },
      ],
    },
    facts,
    views,
    next: nextEvents(day, kin, spin),
  }
}

