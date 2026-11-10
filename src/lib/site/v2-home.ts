import { GATES } from '@pleiad/engine/data/human-design-gates'
import { kinWords } from '@pleiad/engine/data/mantras'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { getWavespellByKin } from '@pleiad/engine/data/wavespells'
import { DIGEST } from '@/lib/atlas/layers'
import { buildMaya } from '@/lib/atlas/maya'
import type { AtlasPerson } from '@/lib/atlas/pair'
import type { PairAtlas } from '@/lib/atlas/types'
import { tieView, type TieView } from '@/lib/relations/tie-text'
import type { BentoLabData, TieWorth } from '@/lib/data/bento-lab'
import { CHART_SYSTEMS } from '@/lib/site/plans'
import { routesIn, type NavGroup } from '@/lib/site/routes'
import { dayRows, kinRow, type DaySources, type V2DayRow } from '@/lib/site/v2-day'
import { v2Href } from '@/lib/site/v2-routes'
import type { TodayAcrossSystems } from '@/lib/today-board'
import type { TodayBoards } from '@/lib/today-boards'
import type { TodayFigures } from '@/lib/today-figures'

/**
 * The v2 home's data (docs/redesign/BENTO_V2.md "Home"): every number counted
 * from a table or computed by the engine, in plain serialisable shapes, so
 * the scrolled sections are dumb views. Server only: it reads engine tables.
 */

export interface V2Seal {
  readonly name: string
  readonly src: string
}

/** A tie between the example pair, with what it means and how many random pairs share it. */
export interface V2Tie extends TieView {
  /** Its place in the pair's reading, which keys it on the drawing. */
  readonly index: number
}

export interface V2PairPerson {
  readonly name: string
}

/**
 * A day's kin in full (Dreamspell): its seal and tone, the words the
 * affirmation gives them (the seal's power, the tone's action), and the
 * day's place in its wavespell, which is its tone: a wavespell runs one
 * tone to a day.
 */
export interface V2Kin {
  readonly kin: number
  /** Tone and seal: "Resonant Human". */
  readonly name: string
  readonly colour: string
  readonly seal: V2Seal
  readonly tone: number
  readonly power: string
  readonly action: string
  readonly wave: { readonly name: string; readonly theme: string; readonly day: number; readonly length: number }
  /** The kin's board, which the tile opens, where the day's sources were read. */
  readonly row?: V2DayRow
}

export interface V2Count {
  readonly value: number
  readonly label: string
}

export interface V2Link {
  readonly href: string
  readonly label: string
}

export interface V2LinkColumn {
  readonly title: string
  readonly links: readonly V2Link[]
}

export interface V2Home {
  readonly today: BentoLabData['today']
  readonly kin: V2Kin
  /** The example pair: who, their rarest ties, and their rarity against random pairs, out of 100. */
  readonly pair: { readonly people: readonly [V2PairPerson, V2PairPerson]; readonly ties: readonly V2Tie[]; readonly rarity: number }
  /** The day rows the hero feed shows: those the engine draws a figure for. */
  readonly day: readonly V2DayRow[]
  readonly counts: readonly V2Count[]
  readonly guide: TieWorth
  readonly commonest: TieWorth
  readonly columns: readonly V2LinkColumn[]
}

/** How many of the pair's rarest ties the home lists. */
export const SHOWN_TIES = 4

const FOOTER_GROUPS: ReadonlyArray<readonly [title: string, groups: readonly NavGroup[]]> = [
  ['Tools', ['tools']],
  ['Pleiad', ['product', 'learn', 'company']],
  ['Legal', ['legal']],
]

/** The pair's rarest ties in words; a reading's ties arrive rarest first (`pairTies` in relations). */
export const pairTies = (pair: PairAtlas, count = SHOWN_TIES): readonly V2Tie[] => pair.reading.ties.slice(0, count).map((tie, index) => ({ ...tieView(tie), index }))

/** The day's kin, its affirmation words, its place in the wavespell, and its board where the day's sources are given. */
export function kinOfDay(day: string, sources?: DaySources): V2Kin {
  const maya = buildMaya(day)
  const words = kinWords(maya.seal.n, maya.tone.n)
  const wave = getWavespellByKin(maya.kin)
  return {
    kin: maya.kin,
    name: `${maya.tone.name} ${maya.seal.name}`,
    colour: maya.colour,
    seal: { name: maya.seal.name, src: maya.seal.src },
    tone: maya.tone.n,
    power: words.seal.power,
    action: words.tone.action,
    wave: { name: wave.name, theme: wave.theme, day: maya.tone.n, length: TONES.length },
    ...withRow(sources && kinRow(sources)),
  }
}

const withRow = (row: V2DayRow | undefined): { readonly row?: V2DayRow } => (row ? { row } : {})

export function linkColumns(): readonly V2LinkColumn[] {
  return FOOTER_GROUPS.map(([title, groups]) => ({
    title,
    links: routesIn(...groups)
      .filter((route) => !route.pattern && route.path !== '/')
      .map((route) => ({ href: v2Href(route.path), label: route.label })),
  }))
}

export interface V2HomeInput {
  readonly day: string
  readonly lab: BentoLabData
  /** The example pair, and its atlas. */
  readonly people: readonly [AtlasPerson, AtlasPerson]
  readonly pair: PairAtlas
  readonly board: TodayAcrossSystems
  readonly figures: TodayFigures
  readonly boards: TodayBoards
}

export function buildV2Home({ day, lab, people, pair, board, figures, boards }: V2HomeInput): V2Home {
  return {
    today: lab.today,
    kin: kinOfDay(day, { board, figures, boards }),
    pair: { people: [{ name: people[0].name }, { name: people[1].name }], ties: pairTies(pair), rarity: pair.reading.rarity },
    day: dayRows({ board, figures, boards }).filter((row) => row.face),
    counts: [
      { value: DIGEST.length, label: 'systems on one map' },
      { value: SEALS.length * TONES.length, label: 'days in the count' },
      { value: GATES.length, label: 'gates on the wheel' },
      { value: CHART_SYSTEMS.length, label: 'chart systems to read' },
    ],
    guide: lab.guideOdds,
    commonest: lab.commonest,
    columns: linkColumns(),
  }
}
