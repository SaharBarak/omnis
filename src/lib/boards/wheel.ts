import type { BoardMark, CalendarCell, CalendarSection, CalendarView, ClockPosition, WheelTurn } from './types'

/**
 * A wheel's geometry (docs/redesign/BENTO_BOARDS.md "Figures", Wheel),
 * derived from its cells and nothing else. Lengths are in slots: a slot is
 * one line of the calendar's text with its cell's padding, the room one
 * mark takes. Pure, so the server and the client agree and a test can hold
 * it.
 */

const FULL = 360
const TAU = 2 * Math.PI

/** The screen bearing (degrees, clockwise from three o'clock, the y axis down) of each clock position. */
const BEARING: Readonly<Record<ClockPosition, number>> = { right: 0, bottom: 90, left: 180, top: 270 }

const DEFAULT_TURN: WheelTurn = { origin: 'top', turn: 'clockwise' }

/** The compact readout a hub holds: its mark two lines tall over a line of title, a square of three lines inscribed in the hub. */
const HUB_LINES = 3
export const HUB_MIN = (HUB_LINES * Math.SQRT2) / 2

/** A character's width in ems: an ideograph or a Devanagari or Hebrew letter an em, a Latin letter or figure an en. */
const emsOf = (text: string): number => [...text].reduce((sum, ch) => sum + ((ch.codePointAt(0) ?? 0) > 0x2e7f ? 1 : 1 / 2), 0)

/** A mark's width in slots: a square, or its characters where it is text. */
const markSlots = (mark: BoardMark | undefined): number => (!mark ? 0 : mark.kind === 'text' ? Math.max(1, emsOf(mark.text)) : 1)

/** The slots a cell's face is wide (its mark, or its numeral where that is wider) and the lines it is tall (a line each). */
export const faceOf = (cell: CalendarCell): { readonly wide: number; readonly lines: number } => ({
  wide: Math.max(1, markSlots(cell.mark), cell.label ? emsOf(cell.label.text) : 0),
  lines: (cell.mark ? 1 : 0) + (cell.label ? 1 : 0),
})

export interface Sector {
  readonly key: string
  /** The sector's edges, as fractions of the turn from the wheel's origin. */
  readonly start: number
  readonly end: number
  /** Whether the sector's arc at its middle radius holds its face. */
  readonly fits: boolean
}

export interface Ring {
  readonly inner: number
  readonly outer: number
  readonly sectors: readonly Sector[]
}

export interface WheelGeometry {
  /** The hub's radius and the wheel's, in slots. */
  readonly hub: number
  readonly radius: number
  readonly rings: readonly Ring[]
  /** Today's place on the turn, as a fraction of it, where the wheel measures one. */
  readonly hand: number | null
}

/** A ring's sectors as fractions of the turn: each cell its share of the ring's measure, from the ring's offset. */
function shares(section: CalendarSection): readonly { readonly key: string; readonly start: number; readonly end: number }[] {
  const spans = section.cells.map((cell) => cell.span ?? 1)
  const total = spans.reduce((sum, span) => sum + span, 0)
  const from = (section.from ?? 0) / FULL
  return section.cells.reduce<{ readonly key: string; readonly start: number; readonly end: number }[]>((placed, cell, i) => {
    const start = placed[i - 1]?.end ?? from
    return [...placed, { key: cell.key, start, end: start + (spans[i] ?? 1) / total }]
  }, [])
}

/**
 * The wheel: each ring as thick as the lines its cells carry; each ring's
 * inner radius at least the circumference its cells need, at their faces'
 * widths, over 2π; the hub at least the readout it holds.
 */
export function wheelGeometry(view: CalendarView): WheelGeometry {
  const faces = view.sections.map((section) => section.cells.map(faceOf))
  const thick = faces.map((ring) => Math.max(1, ...ring.map((face) => face.lines)))
  const need = faces.map((ring) => ring.reduce((sum, face) => sum + face.wide, 0) / TAU)
  /* Thickness of the rings inside ring i. */
  const inside = thick.map((_, i) => thick.slice(0, i).reduce((sum, t) => sum + t, 0))
  const hub = Math.max(HUB_MIN, ...need.map((n, i) => n - (inside[i] ?? 0)))
  const rings = view.sections.map((section, i): Ring => {
    const inner = hub + (inside[i] ?? 0)
    const outer = inner + (thick[i] ?? 1)
    const middle = (inner + outer) / 2
    return {
      inner,
      outer,
      sectors: shares(section).map((share, c) => ({ ...share, fits: (share.end - share.start) * TAU * middle >= (faces[i]?.[c]?.wide ?? 1) })),
    }
  })
  const hand = view.wheel?.hand
  return { hub, radius: hub + thick.reduce((sum, t) => sum + t, 0), rings, hand: hand === undefined ? null : (((hand % FULL) + FULL) % FULL) / FULL }
}

/** The screen bearing, in radians, of a fraction of a wheel's turn. */
export function bearing(turn: WheelTurn | undefined, fraction: number): number {
  const { origin, turn: way } = turn ?? DEFAULT_TURN
  return ((BEARING[origin] + (way === 'clockwise' ? 1 : -1) * fraction * FULL) * Math.PI) / (FULL / 2)
}

/** A point at a radius and a bearing, from the wheel's centre. */
export const pointAt = (radius: number, angle: number): readonly [number, number] => [radius * Math.cos(angle), radius * Math.sin(angle)]

/** A coordinate to a thousandth of a slot, a zero never signed. */
const PLACES = 3
const fixed = (n: number): string => (Math.round(n * 10 ** PLACES) / 10 ** PLACES || 0).toFixed(PLACES)

/** A sector's outline: the outer arc, a side, the inner arc back, closed. */
export function sectorPath(turn: WheelTurn | undefined, ring: Pick<Ring, 'inner' | 'outer'>, sector: Pick<Sector, 'start' | 'end'>): string {
  const a = bearing(turn, sector.start)
  const b = bearing(turn, sector.end)
  const large = sector.end - sector.start > 1 / 2 ? 1 : 0
  const sweep = b > a ? 1 : 0
  const [x1, y1] = pointAt(ring.outer, a)
  const [x2, y2] = pointAt(ring.outer, b)
  const [x3, y3] = pointAt(ring.inner, b)
  const [x4, y4] = pointAt(ring.inner, a)
  return `M${fixed(x1)} ${fixed(y1)}A${fixed(ring.outer)} ${fixed(ring.outer)} 0 ${large} ${sweep} ${fixed(x2)} ${fixed(y2)}L${fixed(x3)} ${fixed(y3)}A${fixed(ring.inner)} ${fixed(ring.inner)} 0 ${large} ${1 - sweep} ${fixed(x4)} ${fixed(y4)}Z`
}

/** Where a sector's face stands: the middle of its arc at the middle of its ring. */
export const sectorCentre = (turn: WheelTurn | undefined, ring: Pick<Ring, 'inner' | 'outer'>, sector: Pick<Sector, 'start' | 'end'>): readonly [number, number] =>
  pointAt((ring.inner + ring.outer) / 2, bearing(turn, (sector.start + sector.end) / 2))
