import { systemLine, type SystemKey } from '@/lib/system-preferences'
import type { TodayAcrossSystems } from '@/lib/today-board'
import type { DayBoard } from '@/lib/boards/types'
import type { TodayBoards } from '@/lib/today-boards'
import type { DayArt, DayFace, TodayFigures } from '@/lib/today-figures'
import { TODAY_ROWS, todayRows, type TodayRowValue } from '@/lib/today-rows'

/**
 * The day across the calendars as v2's feed rows (docs/redesign/BENTO_V2.md):
 * the board's rows, each with its figure (`todayFigures`: the Moon's disc,
 * the gate's hexagram, the month in Hebrew) and the colour of the system it
 * belongs to, and the board it opens (`todayBoards`). Pure and client safe, so the dashboard
 * can filter by the account's systems in the browser, as the bento board
 * does. A v2 feed sits beside the kin tile, so it leaves the kin out.
 */

/** A row's board (BENTO_V2.md "Rows open their calendar's board"), its value always named, its mast drawn with the row's whole figure. */
export type V2DayBoard = DayBoard & { readonly label: string; readonly art?: DayArt }

/** A day row: its figure when the engine drew one, its system's colour as a custom property, and its calendar's board. */
export interface V2DayRow {
  readonly field: TodayRowValue['field']
  readonly label: string
  readonly value: string
  readonly tone: string
  readonly face?: DayFace
  readonly board: V2DayBoard
}

/** What the day's rows are built from: the board's values, the engine's figures and its boards. */
export interface DaySources {
  readonly board: TodayAcrossSystems
  readonly figures?: TodayFigures
  readonly boards?: TodayBoards
}

/** Which system's colour a day row's dot wears; rows of systems without a layer stay muted. */
const ROW_TONE: Partial<Readonly<Record<SystemKey, string>>> = {
  dreamspell: '--sys-dreamspell',
  longcount: '--sys-tzolkin',
  moon: '--sys-astrology',
  astrology: '--sys-astrology',
  sidereal: '--sys-astrology',
  humandesign: '--sys-human-design',
  hebrew: '--sys-gematria',
}

const MUTED = '--lab-text-3'

const ROW_OF_FIELD = new Map(TODAY_ROWS.map((row) => [row.field, row]))

/**
 * A row's board: the engine's where it built one, and for any part it did
 * not, the row's own words: what its value is, the board's value, and its
 * calendar's line from the catalog.
 */
const boardOf = (row: TodayRowValue, built: DayBoard | undefined, drawn: DayFace | undefined): V2DayBoard => {
  const of = ROW_OF_FIELD.get(row.field)
  return {
    ...built,
    ...(drawn ? { art: drawn.art } : {}),
    label: built?.label ?? of?.valueIs ?? row.label,
    value: built?.value ?? row.value,
    meaning: built?.meaning ?? (of ? systemLine(of.system) : null),
    facts: built?.facts ?? [],
    next: built?.next ?? [],
  }
}

/**
 * A row's figure fills one square slot (BENTO_V2.md "Day rows"): the Long
 * Count's five places become its kin place, the place its cycle track counts;
 * the value keeps every place.
 */
const slotted = (face: DayFace): DayFace => (face.art.kind === 'bars' ? { ...face, art: { ...face.art, places: face.art.places.slice(-1) } } : face)

/** The kin has its own tile beside every v2 feed. */
const BESIDE_THE_FEED: ReadonlySet<TodayRowValue['field']> = new Set(['kin'])

/** A filled row with its figure, its system's tone and its calendar's board. */
const v2Row = (row: TodayRowValue, { figures = {}, boards = {} }: DaySources): V2DayRow => {
  const system = ROW_OF_FIELD.get(row.field)?.system
  const drawn = figures[row.field]
  const face = drawn && slotted(drawn)
  return { field: row.field, label: row.label, value: row.value, tone: (system && ROW_TONE[system]) || MUTED, ...(face ? { face } : {}), board: boardOf(row, boards[row.field], drawn) }
}

/** The board's filled rows but the kin, kept to the `enabled` systems when any are, each with its figure, its system's tone and its calendar's board. */
export const dayRows = (sources: DaySources, enabled?: Partial<Readonly<Record<SystemKey, boolean>>>): readonly V2DayRow[] =>
  todayRows(sources.board, enabled)
    .filter((row) => !BESIDE_THE_FEED.has(row.field))
    .map((row) => v2Row(row, sources))

/** The kin's row, which its tile opens (BENTO_V2.md "Kin tile"): its board, as a day row's. */
export const kinRow = (sources: DaySources): V2DayRow | undefined => {
  const row = todayRows(sources.board).find((r) => BESIDE_THE_FEED.has(r.field))
  return row && v2Row(row, sources)
}
