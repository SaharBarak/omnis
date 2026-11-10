/**
 * A calendar's board as plain data (docs/redesign/BENTO_BOARDS.md): what
 * the server writes for a day and the client draws. Types and the pure
 * readers of them only, so client code may import them without the engine.
 */

import type { MarkFact, MarkReading } from '@/lib/atlas/explain'

/** A symbol a board draws: the Moon's face, a glyph from the public sets, a bar-and-dot numeral, a hexagram's line or a whole hexagram (its lines bottom first), or a character. */
export type BoardMark =
  | { readonly kind: 'moon'; readonly angle: number }
  | { readonly kind: 'glyph'; readonly src: string }
  | { readonly kind: 'bars'; readonly n: number }
  | { readonly kind: 'line'; readonly yang: boolean }
  | { readonly kind: 'hexagram'; readonly yang: readonly boolean[] }
  | { readonly kind: 'text'; readonly text: string; readonly lang?: string }

/** Words in a calendar's own script or numerals, with the language that sets them (its direction follows from it). */
export interface Script {
  readonly text: string
  readonly lang?: string
}

/**
 * A source colour (BENTO_BOARDS.md "Source colours"): a closed set a
 * tradition's categories are drawn in (the seal's colour, the element, the
 * five phases, the bright and dark halves of a month). The four chromatic
 * tints are solved per theme; white and black are told apart by form.
 */
export type Tint = 'red' | 'yellow' | 'green' | 'blue' | 'white' | 'black'

/** Something that happens on a cell's day or in its span: a quarter, a holiday, a sign begun; keyed to the legend entry that names its kind. */
export interface CellEvent {
  readonly name: string
  readonly mark?: BoardMark
  readonly key?: string
}

/** Where a cell stands from the day the board is for. */
export type CellState = 'past' | 'today' | 'ahead'

/**
 * One unit of a calendar: its symbol, its numeral or name in the calendar's
 * script, a name beside it where the unit has one, the civil day or year it
 * falls on, the band it belongs to, its source colour, what happens in it,
 * the legend keys it carries beyond its band and events, and its words in
 * full (its accessible name and the readout). `key` is unique in its view.
 */
export interface CalendarCell {
  readonly key: string
  readonly mark?: BoardMark
  readonly label?: Script
  readonly title?: string
  readonly note?: string
  readonly band?: string
  readonly tint?: Tint
  readonly events?: readonly CellEvent[]
  readonly keys?: readonly string[]
  readonly state: CellState
  readonly said: string
}

/** A column's or row's head: what it shows (its words, its mark), what it says, its source colour, and whether its days are the calendar's weekend. */
export interface CalendarHead {
  readonly text: string
  readonly said: string
  readonly mark?: BoardMark
  readonly tint?: Tint
  readonly weekend?: boolean
}

/**
 * A run of cells under its heads: in rows of `columns` after `offset` blanks
 * (a month starting on a later weekday), or, with `places`, every cell at
 * the row and column its figure sets (from the top-left, keyed by cell),
 * the gaps blank. `rowHeads` head the rows in order.
 */
export interface CalendarSection {
  readonly name?: string
  readonly columns: number
  readonly offset?: number
  readonly heads?: readonly CalendarHead[]
  readonly rowHeads?: readonly CalendarHead[]
  readonly places?: Readonly<Record<string, readonly [row: number, col: number]>>
  readonly cells: readonly CalendarCell[]
}

/** A key entry: its mark, a band's swatch (in its source colour where it has one), or, with neither, the dot that marks an event; `key` is what the cells carrying it list. */
export interface LegendEntry {
  readonly key: string
  readonly mark?: BoardMark
  readonly band?: string
  readonly tint?: Tint
  readonly words: string
}

/**
 * One view of a calendar: cells in rows (`grid`), round a circle (`ring`),
 * one under another with their names beside them (`ladder`), or five round
 * a centre (`cross`, placed); its stable id, its name (its heading), its
 * tab's word, its legend, and where the day stands in it.
 */
export interface CalendarView {
  readonly id: string
  readonly layout: 'grid' | 'ring' | 'ladder' | 'cross'
  readonly name: string
  readonly tab: string
  readonly sections: readonly CalendarSection[]
  readonly legend: readonly LegendEntry[]
  readonly caption: string
  /** The order the calendar's own pages set its cells in (BENTO_BOARDS.md "Direction"); left to right where absent. */
  readonly dir?: 'rtl'
}

/** The legend keys a cell carries: its band, its events' kinds and its own keys (BENTO_BOARDS.md "Keys"). */
export const cellKeys = (cell: CalendarCell): readonly string[] => [
  ...(cell.band ? [cell.band] : []),
  ...(cell.events ?? []).flatMap((e) => (e.key ? [e.key] : [])),
  ...(cell.keys ?? []),
]

/** A word of the mast's line, led by its glyph where it has one. */
export interface MastWord {
  readonly text: string
  readonly mark?: BoardMark
}

/** The board's head, as the kin tile sets a kin: the day's number in the calendar, the value's name, a line of words, and the calendar's own words for it. */
export interface BoardMast {
  readonly numeral: Script
  readonly title: string
  readonly words: readonly MastWord[]
  readonly script?: Script
  /** The figure where the row draws none: the value's own mark. */
  readonly mark?: BoardMark
}

/** Something that comes next in a calendar: its name, its civil date, the whole days to it (0 = later today), its mark, and the view and cell it falls on, where one does. */
export interface BoardEvent {
  readonly name: string
  readonly date: string
  readonly inDays: number
  readonly mark?: BoardMark
  readonly at?: { readonly view: string; readonly cell: string }
}

/** A fact of the board, its value led by its glyph where it has one. */
export interface BoardFact extends MarkFact {
  readonly mark?: BoardMark
}

/** A calendar's board. `label` names the value more exactly than its row's `valueIs` where the engine can. */
export interface DayBoard extends MarkReading {
  readonly label?: string
  readonly value: string
  readonly facts: readonly BoardFact[]
  readonly mast?: BoardMast
  /** The calendar's views, the unit the day stands in first. */
  readonly views?: readonly CalendarView[]
  readonly next: readonly BoardEvent[]
}
