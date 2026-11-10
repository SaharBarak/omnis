import type { PixelMark } from '@/lib/brand/pixel-mark'
import type { MarkPart } from '@/lib/brand/mark'
import type { Rgb } from '@/components/bento-lab/palette'

/** The mark's paint, read from the lab root (`--mark-*`, `--lab-line`, `--lab-ink`). */
export interface MarkColours extends Readonly<Record<MarkPart, Rgb>> {
  readonly dust: Rgb
  readonly glint: Rgb
}

/** Where the mark sits in its canvas, in the canvas's CSS pixels. */
export interface Placement {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** One cell's flight out of the mark: offset in cells, the share of the assembly it waits, and its shade. */
interface Flight {
  readonly dx: number
  readonly dy: number
  readonly delay: number
  readonly shade: number
}

/** A square's side as a share of its cell; the rest is the grid's gutter. */
export const SQUARE = 0.84
/** How much of the assembly the latest cell waits before it starts. */
const SPREAD = 0.55
/** Scattered cells fly between these multiples of the mark's height, in cells. */
const SCATTER = [0.25, 0.9] as const
/** Turn, either side of straight out from the centre, of a cell's flight. */
const SWIRL = 0.9
/** Share of dust cells lit at once, and how often the field turns over. */
const DUST_SHARE = 0.035
const DUST_HZ = 1.5
/** Share of window cells glinting at once, and how often they change. */
const GLINT_SHARE = 0.06
export const GLINT_HZ = 4
/** A glinting cell's mix toward the glint colour; the shade range of a resting cell. */
const GLINT_MIX = 0.55
const SHADE_FLOOR = 0.8
/** A barely covered cell's opacity, before its shade; a fully covered cell is opaque. */
const COVER_FLOOR = 0.6

/** A resting cell's opacity: its seeded shade, deeper the more of it the mark covers. The canvas and the server's SVG both paint by it. */
export const restAlpha = (shade: number, cover: number): number => shade * (COVER_FLOOR + (1 - COVER_FLOOR) * cover)

/** A stable 0..1 hash of an integer (murmur3 finaliser). */
export const hash = (n: number): number => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

const flightCache = new WeakMap<PixelMark, readonly Flight[]>()

/** Every cell's seeded flight: outward from the mark's centre with a swirl, so the same cell always flies the same way. */
export function flightsOf(mark: PixelMark): readonly Flight[] {
  const cached = flightCache.get(mark)
  if (cached) return cached
  const cx = (mark.cols - 1) / 2
  const cy = (mark.rows - 1) / 2
  const flights = mark.cells.map((cell, i) => {
    const angle = Math.atan2(cell.row - cy, cell.col - cx) + (hash(i * 4 + 1) - 0.5) * 2 * SWIRL
    const reach = mark.rows * (SCATTER[0] + hash(i * 4 + 2) * (SCATTER[1] - SCATTER[0]))
    return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach, delay: hash(i * 4 + 3), shade: SHADE_FLOOR + hash(i * 4 + 4) * (1 - SHADE_FLOOR) }
  })
  flightCache.set(mark, flights)
  return flights
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)
const easeOut = (t: number): number => 1 - (1 - t) ** 3
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const rgba = ([r, g, b]: Rgb, alpha: number): string => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha.toFixed(3)})`

export interface MarkFrame {
  readonly mark: PixelMark | null
  readonly colours: MarkColours
  /** The mark's box; null fills the canvas. */
  readonly place: Placement | null
  /** 0 scattered, 1 whole. */
  readonly assemble: number
  /** Clock for dust and glints, in seconds; frozen while motion is off. */
  readonly seconds: number
  readonly dust: boolean
  /** Rows of the dust field when there is no mark to take a grid from. */
  readonly fieldRows: number
}

/** The cell size and origin that fit the mark into its placement, snapped to whole pixels. */
/** The dust field's cell where no mark sets one: the mark's own grid at the field's height. */
const fieldCell = (width: number, height: number, rows: number): number => Math.max(4, Math.round(Math.max(width, height) / rows))

export function markGrid(mark: PixelMark | null, width: number, height: number, place: Placement | null, fieldRows: number): { readonly size: number; readonly x: number; readonly y: number } {
  if (!mark) return { size: fieldCell(width, height, fieldRows), x: 0, y: 0 }
  const box = place ?? { x: 0, y: 0, width, height }
  const size = Math.max(2, Math.floor(Math.min(box.width / mark.cols, box.height / mark.rows)))
  return {
    size,
    x: Math.round(box.x + (box.width - size * mark.cols) / 2),
    y: Math.round(box.y + (box.height - size * mark.rows) / 2),
  }
}

/** Paints one frame: the dust field on the mark's grid, then every cell at its share of the assembly. */
export function drawMark(ctx: CanvasRenderingContext2D, width: number, height: number, frame: MarkFrame): void {
  ctx.clearRect(0, 0, width, height)
  const { mark, colours, place, seconds } = frame
  const grid = markGrid(mark, width, height, place, frame.fieldRows)
  const square = Math.max(1, Math.round(grid.size * SQUARE))
  const inset = (grid.size - square) / 2

  if (frame.dust) {
    const turn = Math.floor(seconds * DUST_HZ)
    const startCol = -Math.ceil(grid.x / grid.size)
    const startRow = -Math.ceil(grid.y / grid.size)
    const cols = Math.ceil(width / grid.size) + 1
    const rows = Math.ceil(height / grid.size) + 1
    for (let r = startRow; r < startRow + rows; r++) {
      for (let c = startCol; c < startCol + cols; c++) {
        const seed = (r + 4096) * 8192 + (c + 4096)
        const lit = hash(seed) < DUST_SHARE || hash(seed + turn * 7919) < DUST_SHARE / 3
        if (!lit) continue
        ctx.fillStyle = rgba(colours.dust, 0.35 + hash(seed * 3) * 0.5)
        ctx.fillRect(grid.x + c * grid.size + inset, grid.y + r * grid.size + inset, square, square)
      }
    }
  }

  if (!mark) return
  const flights = flightsOf(mark)
  const glintTurn = Math.floor(seconds * GLINT_HZ)
  const whole = frame.assemble >= 0.999
  for (let i = 0; i < mark.cells.length; i++) {
    const cell = mark.cells[i]
    const flight = flights[i]
    if (!cell || !flight) continue
    const p = easeOut(clamp01((frame.assemble - flight.delay * SPREAD) / (1 - SPREAD)))
    if (p <= 0) continue
    const glint = whole && cell.part === 'window' && hash(i * 131 + glintTurn) < GLINT_SHARE
    const colour = glint ? mix(colours[cell.part], colours.glint, GLINT_MIX) : colours[cell.part]
    const side = square * (0.35 + 0.65 * p)
    const x = grid.x + (cell.col + (1 - p) * flight.dx) * grid.size + (grid.size - side) / 2
    const y = grid.y + (cell.row + (1 - p) * flight.dy) * grid.size + (grid.size - side) / 2
    ctx.fillStyle = rgba(colour, p * restAlpha(flight.shade, cell.cover))
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(side), Math.round(side))
  }
}
