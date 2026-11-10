import { nextQuarter, raveNewYear } from '@pleiad/engine/calculations/hd-wheel'
import { gateChanges, gateLines, zodiacSun, type Sky } from '@pleiad/engine/calculations/sky-dates'
import { COLOUR_TONES, LINE_COLOURS, LINE_THEMES, MANDALA_QUARTERS, godheadOfGate, quarterGates, quarterOfGate, toneSide, type MandalaQuarter } from '@pleiad/engine/data/human-design'
import { circuitOfChannel, harmonicsOf } from '@pleiad/engine/data/human-design-channels'
import { GATES, GATES_BY_CENTER, LINES_IN_GATE, MANDALA_SEQUENCE_FULL, getGateDegreeRange, oppositeGate, wheelPlace, type WheelPlace } from '@pleiad/engine/data/human-design-gates'
import { HEXAGRAMS, hexagramLines } from '@pleiad/engine/data/iching'
import type { CenterId } from '@pleiad/engine/types/human-design'
import { NOON, SIGN_DEGREES, byDate, dayWords, event, fromToday, keyedLegend, numeral, planetMark, signAt, signMark, trigramCharacter, whenWords } from './parts'
import type { BoardEvent, BoardFact, BoardMark, CalendarCell, CalendarHead, CalendarSection, CalendarView, CellState, DayBoard, LegendEntry } from './types'
import { fact, gateLineReading } from '@/lib/atlas/explain'
import { capital, centreName } from '@/lib/atlas/marks'

/**
 * The Human Design gate's board (BENTO_BOARDS.md "Systems"): the Sun's gate
 * and line on the Rave Mandala with the Earth's opposite it, as the
 * tradition always pairs them. The gate's six lines, top line first as its
 * hexagram is drawn, with the gates harmonic to the Sun's and the Earth's
 * and the channels they would complete; the sixty-four gates of the mandala
 * by its four quarters, each row of eight headed by the degree of the zodiac
 * it opens at; the line's colours and tones, where the Sun stands at noon;
 * and the gates of the Sun's centre.
 */

/** Gates in a row of the mandala and of a centre: eight, as the I Ching's square sets the sixty-four, so a quarter's sixteen fill two rows of two godheads each. */
const GATES_IN_ROW = 8
/** The Earth's sign, as Human Design charts draw it beside the Sun's. */
const EARTH_MARK: BoardMark = { kind: 'text', text: '⊕' }
const SUN_MARK: BoardMark = planetMark('sun') ?? { kind: 'text', text: '☉' }
/** A channel's two ends: the key to a gate harmonic to the day's. */
const HARMONIC_MARK: BoardMark = { kind: 'text', text: '↔' }
const ARC_MINUTES = 60
const ARC_SECONDS = 60

const gateName = (n: number): string => GATES.find((g) => g.number === n)?.name ?? `Gate ${n}`
const gateCentre = (n: number): CenterId | undefined => GATES.find((g) => g.number === n)?.centerId
const lineName = (line: number): string => (Object.hasOwn(LINE_THEMES, line) ? LINE_THEMES[line as keyof typeof LINE_THEMES].name : `Line ${line}`)
const hexagramMark = (n: number): BoardMark => ({ kind: 'hexagram', yang: hexagramLines(n) })
const wheelIndex = (n: number): number => MANDALA_SEQUENCE_FULL.indexOf(n)

/** A gate's state on the wheel this Rave year: passed since gate 41, the Sun's own, or ahead. */
const gateState = (n: number, sun: number): CellState => (n === sun ? 'today' : wheelIndex(n) < wheelIndex(sun) ? 'past' : 'ahead')

/**
 * Degrees as the zodiac writes them, to the arcsecond the wheel's edges need
 * (a gate is 5°37′30″): "2°", "13°15′", "18°52′30″".
 */
export function degreeWords(degrees: number): string {
  const seconds = Math.round(degrees * ARC_MINUTES * ARC_SECONDS)
  const whole = Math.floor(seconds / (ARC_MINUTES * ARC_SECONDS))
  const minutes = Math.floor(seconds / ARC_SECONDS) - whole * ARC_MINUTES
  const rest = seconds - (whole * ARC_MINUTES + minutes) * ARC_SECONDS
  const two = (n: number) => String(n).padStart(2, '0')
  return rest !== 0 ? `${whole}°${two(minutes)}′${two(rest)}″` : minutes !== 0 ? `${whole}°${two(minutes)}′` : `${whole}°`
}

/** Where a gate opens in the zodiac: its sign and the degree within it. */
function gateOpens(n: number): { readonly words: string; readonly degree: string; readonly mark?: BoardMark } {
  const start = getGateDegreeRange(n)?.start ?? 0
  const sign = signAt(start)
  const degree = degreeWords(start - Math.floor(start / SIGN_DEGREES) * SIGN_DEGREES)
  const mark = sign && signMark(sign.name)
  return { words: `${degree} ${sign?.name ?? ''}`.trim(), degree, ...(mark ? { mark } : {}) }
}

/** The gate's two trigrams as characters, upper then lower, and in words. */
function trigramsOf(gate: number): { readonly mark: BoardMark; readonly words: string } | undefined {
  const trigrams = HEXAGRAMS.find((h) => h.number === gate)?.trigrams
  if (!trigrams) return undefined
  const [lower, upper] = trigrams
  return { mark: { kind: 'text', text: `${trigramCharacter(upper)}${trigramCharacter(lower)}` }, words: `${upper} over ${lower}` }
}

/** A circuit as said: its group and name, or the name alone where the circuit is its own group (Integration). */
const circuitWords = (channelId: string): string => {
  const circuit = circuitOfChannel(channelId)
  return circuit.group === circuit.id ? circuit.name : `${capital(circuit.group)}, ${circuit.name}`
}

/** The day's two activations: the Sun's gate and the Earth's across the wheel, sharing line, colour, tone and base. */
interface Activations {
  readonly place: WheelPlace
  readonly sun: number
  readonly earth: number
}

/** A gate harmonic to the Sun's or the Earth's gate: the gate, the channel the two complete, and which of the two it answers. */
interface Harmonic {
  readonly gate: number
  readonly across: readonly { readonly from: 'sun' | 'earth'; readonly channel: string; readonly name: string }[]
}

/** The gates harmonic to the Sun's and the Earth's gates, each once, the Sun's first. */
function harmonicsOfDay({ sun, earth }: Activations): readonly Harmonic[] {
  const found = new Map<number, Harmonic['across'][number][]>()
  for (const [from, gate] of [
    ['sun', sun],
    ['earth', earth],
  ] as const) {
    /* Where the Sun and the Earth complete a channel between them, each is the other's harmonic, already on the board as itself. */
    for (const h of harmonicsOf(gate).filter((h) => h.gate !== sun && h.gate !== earth)) found.set(h.gate, [...(found.get(h.gate) ?? []), { from, channel: h.channel.id, name: h.channel.name }])
  }
  return [...found].map(([gate, across]) => ({ gate, across }))
}

/** The channel the Sun and the Earth complete between them, where their gates are its two ends (43-23 and 34-20 in a Rave year). */
const sunEarthChannel = ({ sun, earth }: Activations) => harmonicsOf(sun).find((h) => h.gate === earth)?.channel

const HARMONIC_KEY = { sun: 'sun-harmonic', earth: 'earth-harmonic' } as const
const BODY_WORDS = { sun: 'the Sun', earth: 'the Earth' } as const

/* ---------- lines ---------- */

/** A harmonic gate's circuits as said, each once. */
const circuitsOf = (h: Harmonic): string => [...new Set(h.across.map((a) => circuitWords(a.channel)))].join('; ')

function linesView(day: string, sky: Sky, act: Activations, harmonics: readonly Harmonic[]): CalendarView {
  const { place, sun, earth } = act
  const yang = hexagramLines(sun)
  const reached = new Map(gateLines(day, sky).map((l) => [l.line, l]))
  const colour = LINE_COLOURS[place.colour - 1]
  const tone = COLOUR_TONES[place.tone - 1]
  const lines: CalendarCell[] = Array.from({ length: LINES_IN_GATE }, (_, i) => LINES_IN_GATE - i).map((n) => {
    const at = reached.get(n)
    const state = n < place.line ? 'past' : n === place.line ? 'today' : 'ahead'
    /* A line above today's is still ahead, though the Sun may reach it later today. */
    const when = at ? (state === 'ahead' ? `the Sun reaches it ${dayWords(at.date)}, ${fromToday(at.inDays)}` : `the Sun reached it ${dayWords(at.date)}`) : undefined
    const substructure =
      state === 'today' && colour && tone ? [`at noon in colour ${place.colour}, ${colour.motivation}, and tone ${place.tone}, ${tone.cognition}, base ${place.base}`] : []
    return {
      key: String(n),
      mark: { kind: 'line', yang: yang[n - 1] ?? true },
      keys: [(yang[n - 1] ?? true) ? 'yang' : 'yin'],
      label: numeral(n, 'latn'),
      title: lineName(n),
      ...(at ? { note: dayWords(at.date) } : {}),
      state,
      said: [`Line ${n}, ${lineName(n)}`, ...(when ? [when] : []), ...substructure].join(' · '),
    }
  })
  const answered: CalendarCell[] = harmonics.map((h) => ({
    key: `gate-${h.gate}`,
    mark: hexagramMark(h.gate),
    label: numeral(h.gate, 'latn'),
    title: gateName(h.gate),
    note: h.across.map((a) => a.channel).join(', '),
    keys: [...new Set(h.across.map((a) => HARMONIC_KEY[a.from]))],
    state: gateState(h.gate, sun),
    said: [
      `Gate ${h.gate}, ${gateName(h.gate)}`,
      ...h.across.map((a) => `harmonic to ${BODY_WORDS[a.from]}'s gate ${a.from === 'sun' ? sun : earth}: together they complete channel ${a.channel}, ${a.name}`),
      `${circuitsOf(h)} circuit`,
      ...(h.gate === earth ? ['the Earth is in it'] : []),
    ].join(' · '),
  }))
  const sections: CalendarSection[] = [
    { name: `Gate ${sun}, ${gateName(sun)}`, columns: 1, cells: lines },
    ...(answered.length > 0 ? [{ name: 'Harmonic gates', columns: 1, cells: answered }] : []),
  ]
  const legend: readonly LegendEntry[] = [
    { key: 'yang', mark: { kind: 'line', yang: true }, words: 'A yang line' },
    { key: 'yin', mark: { kind: 'line', yang: false }, words: 'A yin line' },
    { key: HARMONIC_KEY.sun, mark: SUN_MARK, words: "A gate harmonic to the Sun's: the two complete a channel" },
    { key: HARMONIC_KEY.earth, mark: EARTH_MARK, words: "A gate harmonic to the Earth's: the two complete a channel" },
  ]
  return {
    id: 'lines',
    layout: 'ladder',
    name: `Gate ${sun}'s lines`,
    tab: 'Lines',
    sections,
    legend: keyedLegend(legend, sections),
    caption: `Line ${place.line} of ${LINES_IN_GATE}, colour ${place.colour}, tone ${place.tone} at noon`,
  }
}

/* ---------- the mandala ---------- */

/** The cell events of the mandala: the gate the Sun reaches next, the Sphinx gate of the next quarter, and gate 41 at the Rave New Year. */
interface WheelEvents {
  readonly arrives?: { readonly gate: number; readonly date: string; readonly inDays: number }
  readonly quarter?: { readonly quarter: MandalaQuarter; readonly date: string; readonly inDays: number }
  readonly year?: { readonly gate: number; readonly date: string; readonly inDays: number }
}

function wheelView(act: Activations, harmonics: readonly Harmonic[], events: WheelEvents): CalendarView {
  const { sun, earth } = act
  const harmonic = new Set(harmonics.map((h) => h.gate))
  const cellOf = (quarter: MandalaQuarter) => (n: number): CalendarCell => {
    const godhead = godheadOfGate(n)
    const opens = gateOpens(n)
    const cellEvents = [
      ...(events.arrives?.gate === n ? [{ name: `The Sun arrives ${dayWords(events.arrives.date)}`, key: 'arrives', said: `the Sun arrives ${dayWords(events.arrives.date)}, ${fromToday(events.arrives.inDays)}` }] : []),
      ...(events.quarter && quarterGates(events.quarter.quarter)[0] === n
        ? [{ name: `Quarter of ${events.quarter.quarter.name} begins`, key: 'quarter', said: `the Quarter of ${events.quarter.quarter.name} begins ${whenWords(events.quarter.date, events.quarter.inDays)}` }]
        : []),
      ...(events.year?.gate === n ? [{ name: 'Rave New Year', key: 'year', said: `the Rave New Year, ${whenWords(events.year.date, events.year.inDays)}` }] : []),
    ]
    const keys = [...(n === sun ? ['sun'] : []), ...(n === earth ? ['earth'] : []), ...(harmonic.has(n) ? ['harmonic'] : [])]
    return {
      key: String(n),
      mark: hexagramMark(n),
      label: numeral(n, 'latn'),
      band: quarter.id,
      ...(cellEvents.length > 0 ? { events: cellEvents.map(({ name, key }) => ({ name, key })) } : {}),
      ...(keys.length > 0 ? { keys } : {}),
      state: gateState(n, sun),
      said: [
        `Gate ${n}, ${gateName(n)}`,
        `Quarter of ${quarter.name}${godhead ? `, ${godhead.name}` : ''}`,
        `from ${opens.words}`,
        ...(n === sun ? ['the Sun is in it'] : []),
        ...(n === earth ? ['the Earth is in it'] : []),
        ...(harmonic.has(n) ? ["harmonic to the Sun's or the Earth's gate"] : []),
        ...cellEvents.map((e) => e.said),
      ].join(' · '),
    }
  }
  const sections: CalendarSection[] = MANDALA_QUARTERS.map((quarter) => {
    const gates = quarterGates(quarter)
    const rowHeads: CalendarHead[] = Array.from({ length: Math.ceil(gates.length / GATES_IN_ROW) }, (_, r) => {
      const opens = gateOpens(gates[r * GATES_IN_ROW] ?? gates[0])
      return { text: opens.degree, said: `From ${opens.words}`, ...(opens.mark ? { mark: opens.mark } : {}) }
    })
    return { name: `Quarter of ${quarter.name}, through ${quarter.theme}`, columns: GATES_IN_ROW, rowHeads, cells: gates.map(cellOf(quarter)) }
  })
  const legend: readonly LegendEntry[] = [
    { key: 'sun', mark: SUN_MARK, words: "The Sun's gate" },
    { key: 'earth', mark: EARTH_MARK, words: "The Earth's gate, opposite the Sun's" },
    { key: 'harmonic', mark: HARMONIC_MARK, words: "A gate harmonic to the Sun's or the Earth's: the two complete a channel" },
    { key: 'arrives', words: 'The gate the Sun reaches next' },
    { key: 'quarter', words: 'The next quarter opens at its Sphinx gate' },
    { key: 'year', words: 'Gate 41: the Rave New Year' },
    ...MANDALA_QUARTERS.map((q) => ({ key: q.id, band: q.id, words: `Quarter of ${q.name}: purpose fulfilled through ${q.theme}` })),
  ]
  return {
    id: 'wheel',
    layout: 'grid',
    name: 'The Rave Mandala',
    tab: 'Wheel',
    sections,
    legend: keyedLegend(legend, sections),
    caption: `Gate ${sun} is ${wheelIndex(sun) + 1} of ${MANDALA_SEQUENCE_FULL.length} from gate ${MANDALA_SEQUENCE_FULL[0]}, where the Rave year begins`,
  }
}

/* ---------- colours and tones ---------- */

function coloursView({ place }: Activations): CalendarView {
  const here = (place.colour - 1) * COLOUR_TONES.length + (place.tone - 1)
  const colourWords = (c: number) => {
    const colour = LINE_COLOURS[c - 1]
    return colour ? `${colour.motivation} motivation, ${colour.determination} determination` : ''
  }
  const toneWords = (t: number) => `${COLOUR_TONES[t - 1]?.cognition ?? ''} cognition, ${toneSide(t)}`
  const cells: CalendarCell[] = LINE_COLOURS.flatMap((_, ci) =>
    COLOUR_TONES.map((__, ti): CalendarCell => {
      const at = ci * COLOUR_TONES.length + ti
      const [c, t] = [ci + 1, ti + 1]
      const state: CellState = at < here ? 'past' : at === here ? 'today' : 'ahead'
      return {
        key: `${c}.${t}`,
        label: { text: `${c}.${t}` },
        band: toneSide(t),
        state,
        said: [`Colour ${c}, tone ${t}`, colourWords(c), toneWords(t), ...(state === 'today' ? [`the Sun at noon, base ${place.base}`] : [])].join(' · '),
      }
    }),
  )
  const heads: CalendarHead[] = COLOUR_TONES.map((tone, ti) => ({ text: String(ti + 1), said: `Tone ${ti + 1}, ${tone.cognition} cognition, ${toneSide(ti + 1)}` }))
  const rowHeads: CalendarHead[] = LINE_COLOURS.map((_, ci) => ({ text: String(ci + 1), said: `Colour ${ci + 1}, ${colourWords(ci + 1)}` }))
  const sections: CalendarSection[] = [{ columns: COLOUR_TONES.length, heads, rowHeads, cells }]
  const sides = [...new Set(COLOUR_TONES.map((_, ti) => toneSide(ti + 1)))]
  const legend: readonly LegendEntry[] = sides.map((side) => {
    const tones = COLOUR_TONES.map((_, ti) => ti + 1).filter((t) => toneSide(t) === side)
    return { key: side, band: side, words: `${capital(side)} tones, ${tones[0]} to ${tones[tones.length - 1]}: ${side === 'left' ? 'active, strategic' : 'passive, receptive'}` }
  })
  return {
    id: 'colours',
    layout: 'grid',
    name: `Line ${place.line}'s colours and tones`,
    tab: 'Colours',
    sections,
    legend: keyedLegend(legend, sections),
    caption: `Colour ${place.colour} of ${LINE_COLOURS.length}, tone ${place.tone} of ${COLOUR_TONES.length}, base ${place.base} at noon`,
  }
}

/* ---------- the centre ---------- */

function centreView(act: Activations, harmonics: readonly Harmonic[]): CalendarView | undefined {
  const { sun, earth } = act
  const centres = [...new Set([gateCentre(sun), gateCentre(earth)].filter((c): c is CenterId => c !== undefined))]
  if (centres.length === 0) return undefined
  const harmonic = new Set(harmonics.map((h) => h.gate))
  const sections: CalendarSection[] = centres.map((centre) => ({
    name: centreName(centre),
    columns: GATES_IN_ROW,
    cells: (GATES_BY_CENTER[centre] ?? []).map((n): CalendarCell => {
      const partners = harmonicsOf(n)
      const keys = [...(n === sun ? ['sun'] : []), ...(n === earth ? ['earth'] : []), ...(harmonic.has(n) ? ['harmonic'] : [])]
      return {
        key: String(n),
        mark: hexagramMark(n),
        label: numeral(n, 'latn'),
        ...(keys.length > 0 ? { keys } : {}),
        state: gateState(n, sun),
        said: [
          `Gate ${n}, ${gateName(n)}`,
          ...(n === sun ? ['the Sun is in it'] : []),
          ...(n === earth ? ['the Earth is in it'] : []),
          ...partners.map((p) => `channel ${p.channel.id}, ${p.channel.name}, to gate ${p.gate} in the ${centreName(gateCentre(p.gate) ?? centre)}`),
        ].join(' · '),
      }
    }),
  }))
  const legend: readonly LegendEntry[] = [
    { key: 'sun', mark: SUN_MARK, words: "The Sun's gate" },
    { key: 'earth', mark: EARTH_MARK, words: "The Earth's gate" },
    { key: 'harmonic', mark: HARMONIC_MARK, words: "A gate harmonic to the Sun's or the Earth's: the two complete a channel" },
  ]
  const named = centres.map(centreName)
  return {
    id: 'centre',
    layout: 'grid',
    name: named.length === 1 ? `The ${named[0]}'s gates` : `The ${named.join(' and the ')}`,
    tab: 'Centre',
    sections,
    legend: keyedLegend(legend, sections),
    caption: centres.length === 1 ? `The Sun's and the Earth's gates both in the ${named[0]}` : `The Sun's gate in the ${named[0]}, the Earth's in the ${named[1]}`,
  }
}

/* ---------- the board ---------- */

export function gateBoard(day: string, sky: Sky): DayBoard {
  const place = wheelPlace(zodiacSun(sky, 'tropical')(day, NOON))
  const { gate, line } = place
  const act: Activations = { place, sun: gate, earth: oppositeGate(gate) }
  const changes = gateChanges(day, sky)
  const year = raveNewYear(day, sky)
  const quarterAhead = nextQuarter(day, sky)
  const harmonics = harmonicsOfDay(act)
  const trigrams = trigramsOf(gate)
  const reading = gateLineReading(gate, line)
  const quarter = quarterOfGate(gate)
  const godhead = godheadOfGate(gate)
  const colour = LINE_COLOURS[place.colour - 1]
  const tone = COLOUR_TONES[place.tone - 1]
  const channels = harmonicsOf(gate)
  const bridged = sunEarthChannel(act)

  const views = [
    linesView(day, sky, act, harmonics),
    wheelView(act, harmonics, {
      ...(changes ? { arrives: changes.gate } : {}),
      ...(quarterAhead ? { quarter: quarterAhead } : {}),
      ...(year ? { year } : {}),
    }),
    coloursView(act),
    ...[centreView(act, harmonics)].filter((v): v is CalendarView => v !== undefined),
  ]

  const next: BoardEvent[] = [
    ...(changes
      ? [
          event(
            changes.line.gate === gate ? `Line ${changes.line.line}` : `Gate ${changes.line.gate}, line ${changes.line.line}`,
            changes.line,
            { kind: 'line', yang: hexagramLines(changes.line.gate)[changes.line.line - 1] ?? true },
            changes.line.gate === gate ? { view: 'lines', cell: String(changes.line.line) } : { view: 'wheel', cell: String(changes.line.gate) },
          ),
          /* A line that opens the next gate already names it. */
          ...(changes.line.gate !== gate ? [] : [event(`Gate ${changes.gate.gate}, ${gateName(changes.gate.gate)}`, changes.gate, hexagramMark(changes.gate.gate), { view: 'wheel', cell: String(changes.gate.gate) })]),
        ]
      : []),
    ...(quarterAhead ? [event(`Quarter of ${quarterAhead.quarter.name}`, quarterAhead, undefined, { view: 'wheel', cell: String(quarterGates(quarterAhead.quarter)[0]) })] : []),
    ...(year ? [event('Rave New Year', year, hexagramMark(year.gate), { view: 'wheel', cell: String(year.gate) })] : []),
  ].sort(byDate)

  const from = (label: string): BoardFact[] => reading.facts.filter((f) => f.label === label)
  const facts: BoardFact[] = [
    { ...fact('Sun', `Gate ${gate}, line ${line}`), mark: SUN_MARK },
    { ...fact('Earth', `Gate ${act.earth}, line ${line}, ${gateName(act.earth)}`), mark: EARTH_MARK },
    ...from('Line'),
    ...(colour ? [fact('Colour', `${place.colour}, ${colour.motivation} (motivation), ${colour.determination} (determination)`)] : []),
    ...(tone ? [fact('Tone', `${place.tone}, ${tone.cognition} (cognition), ${toneSide(place.tone)}`)] : []),
    fact('Base', String(place.base)),
    ...from('Centre'),
    ...from('Channel'),
    ...from('Channels'),
    ...(bridged ? [fact('Sun and Earth', `Channel ${bridged.id}, ${bridged.name}, defined between them`)] : []),
    ...(channels.length > 0 ? [fact(channels.length === 1 ? 'Harmonic gate' : 'Harmonic gates', channels.map((c) => `${c.gate}, ${gateName(c.gate)}`).join('; '))] : []),
    ...(channels.length > 0 ? [fact('Circuit', [...new Set(channels.map((c) => circuitWords(c.channel.id)))].join('; '))] : []),
    ...(quarter ? [fact('Quarter', `${quarter.name}, purpose fulfilled through ${quarter.theme}`)] : []),
    ...(godhead ? [fact('Godhead', godhead.name)] : []),
    ...from('Trigrams').map((f) => (trigrams ? { ...f, mark: trigrams.mark } : f)),
    ...from('Gene Key'),
  ]

  return {
    label: `Gate ${gate}, line ${line}`,
    value: gateName(gate),
    meaning: reading.meaning,
    mast: {
      numeral: { text: `${gate}.${line}` },
      title: gateName(gate),
      mark: hexagramMark(gate),
      words: [
        { text: `Line ${line}, ${lineName(line)}`, mark: { kind: 'line', yang: hexagramLines(gate)[line - 1] ?? true } },
        ...(trigrams ? [{ text: trigrams.words, mark: trigrams.mark }] : []),
        { text: `Earth ${act.earth}.${line}, ${gateName(act.earth)}`, mark: EARTH_MARK },
      ],
    },
    facts,
    views,
    next,
  }
}
