/**
 * The Lantern, Pleiad's mark (docs/redesign/BRAND_MARK.md): one geometry
 * table and the SVG every drawing of the mark reads. Pure: no colour solver,
 * no filesystem, so the inline component can import it on the client.
 */

/** The drawing in module units; one unit is a tenth of the body's half-width. */
export interface Lantern {
  /** Radius of the body's arch, and its half-width. */
  readonly body: number
  /** Frame wall, between the body's edge and the cut. */
  readonly wall: number
  /** Width of the cut between the frame and the window. */
  readonly gap: number
  /** Straight side of the body below the arches' common centre. */
  readonly length: number
  /** Hanger ring: outer and inner radius (0 inner closes the hole). */
  readonly ring: { readonly outer: number; readonly inner: number }
  /** Half-chord of the cap and the base, both segments of the body's circle. */
  readonly lid: number
  /** Height of the cap's chord below the body's crown. */
  readonly brim: number
  /** Clear space between the body and the base. */
  readonly foot: number
}

export const LANTERN: Lantern = Object.freeze({
  body: 10,
  wall: 3,
  gap: 2,
  length: 16.5,
  ring: Object.freeze({ outer: 3, inner: 2 }),
  lid: 8,
  brim: 0.5,
  foot: 1,
})

export const MARK_PARTS = ['frame', 'window', 'base'] as const
export type MarkPart = (typeof MARK_PARTS)[number]

export const MARK_THEMES = ['dark', 'light'] as const
export type MarkTheme = (typeof MARK_THEMES)[number]

/** One theme's colours: a part's paint, plus the tile the icons stand on. */
export type MarkTone = Readonly<Record<MarkPart | 'tile', string>>
export type MarkTones = Readonly<Record<MarkTheme, MarkTone>>

export interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface MarkShape {
  readonly paths: Readonly<Record<MarkPart, string>>
  /** The mark's bounds, in units. */
  readonly box: Box
}

/** Below this many pixels a cut, band or wall turns grey or vanishes. */
export const OPTICAL_MIN_PX = 1

const round = (n: number): number => Math.round(n * 1e4) / 1e4
const pt = (x: number, y: number): string => `${round(x)} ${round(y)}`

/** How far a chord of half-width `half` sits from the top of a circle of `radius`. */
export const sagitta = (radius: number, half: number): number => radius - Math.sqrt(radius ** 2 - half ** 2)

interface Levels {
  readonly crown: number
  readonly brim: number
  readonly capTop: number
  readonly ringCentre: number
  readonly top: number
  readonly cutBottom: number
  readonly windowBottom: number
  readonly bodyBottom: number
  readonly baseTop: number
  readonly bottom: number
}

/** Every height in the drawing, with the arches' common centre at y = 0. */
function levels(l: Lantern): Levels {
  const rise = sagitta(l.body, l.lid)
  const brim = -l.body + l.brim
  const capTop = brim - rise
  const ringCentre = capTop - l.ring.inner
  const bodyBottom = l.length
  const baseTop = bodyBottom + l.foot
  return {
    crown: -l.body,
    brim,
    capTop,
    ringCentre,
    top: ringCentre - l.ring.outer,
    cutBottom: bodyBottom - l.wall,
    windowBottom: bodyBottom - l.wall - l.gap,
    bodyBottom,
    baseTop,
    bottom: baseTop + rise,
  }
}

/** A semicircle of `r` on straight sides down to `bottom`; holes run the other way round. */
const arch = (r: number, bottom: number, hole = false): string =>
  hole
    ? `M${pt(-r, bottom)}L${pt(r, bottom)}L${pt(r, 0)}A${round(r)} ${round(r)} 0 0 0 ${pt(-r, 0)}Z`
    : `M${pt(-r, bottom)}L${pt(-r, 0)}A${round(r)} ${round(r)} 0 0 1 ${pt(r, 0)}L${pt(r, bottom)}Z`

const circle = (cy: number, r: number, hole = false): string => {
  const sweep = hole ? 0 : 1
  return `M${pt(-r, cy)}A${round(r)} ${round(r)} 0 1 ${sweep} ${pt(r, cy)}A${round(r)} ${round(r)} 0 1 ${sweep} ${pt(-r, cy)}Z`
}

/** The cap: the body's circle above a chord at `y`. */
const capSegment = (l: Lantern, y: number): string => `M${pt(-l.lid, y)}A${l.body} ${l.body} 0 0 1 ${pt(l.lid, y)}Z`

/** The base: the body's circle below a chord at `y`. */
const baseSegment = (l: Lantern, y: number): string => `M${pt(-l.lid, y)}L${pt(l.lid, y)}A${l.body} ${l.body} 0 0 1 ${pt(-l.lid, y)}Z`

/** The frame (cut, nonzero), the window and the base for a table, with their bounds. */
export function lanternShape(l: Lantern = LANTERN): MarkShape {
  const y = levels(l)
  const cut = l.body - l.wall
  const light = cut - l.gap
  const frame = [
    circle(y.ringCentre, l.ring.outer),
    l.ring.inner > 0 ? circle(y.ringCentre, l.ring.inner, true) : '',
    capSegment(l, y.brim),
    arch(l.body, y.bodyBottom),
    arch(cut, y.cutBottom, true),
  ].join('')
  const half = Math.max(l.body, l.lid, l.ring.outer)
  return {
    paths: { frame, window: arch(light, y.windowBottom), base: baseSegment(l, y.baseTop) },
    box: { x: -half, y: y.top, width: 2 * half, height: y.bottom - y.top },
  }
}

const height = (l: Lantern): number => {
  const y = levels(l)
  return y.bottom - y.top
}

/** The window's width; every cut and wall is taken from it. */
const windowWidth = (l: Lantern): number => 2 * (l.body - l.wall - l.gap)

/**
 * The table for a mark `px` tall with the ring's hole kept open or closed:
 * every cut, band and wall grown to OPTICAL_MIN_PX. The growth moves the
 * height, which moves the unit, so it refits until the height holds still.
 */
function settle(px: number, l: Lantern, hole: boolean): Lantern {
  const inner = hole ? l.ring.inner : 0
  const grow = (min: number): Lantern => ({
    ...l,
    wall: Math.max(l.wall, min),
    gap: Math.max(l.gap, min),
    foot: Math.max(l.foot, min),
    ring: { inner, outer: Math.max(l.ring.outer, inner + min) },
  })
  let fitted = grow((OPTICAL_MIN_PX * height(l)) / px)
  for (let pass = 0; pass < 64; pass++) {
    const next = grow((OPTICAL_MIN_PX * height(fitted)) / px)
    if (Math.abs(height(next) - height(fitted)) < 1e-12) return next
    fitted = next
  }
  return fitted
}

/** One pixel, in the units of a fitted table drawn `px` tall. */
const pixelUnits = (px: number, l: Lantern): number => (OPTICAL_MIN_PX * height(l)) / px

/** The fitted table, or null when even the window would fall under a pixel. */
function fitted(px: number, l: Lantern): Lantern | null {
  const open = settle(px, l, true)
  const table = 2 * open.ring.inner >= pixelUnits(px, open) ? open : settle(px, l, false)
  return windowWidth(table) >= pixelUnits(px, table) ? table : null
}

/** The smallest height, in pixels, the mark can be drawn at with every part showing. */
export const MARK_MIN_PX = ((): number => {
  let [lo, hi] = [1, height(LANTERN)]
  for (let pass = 0; pass < 40; pass++) {
    const mid = (lo + hi) / 2
    if (fitted(mid, LANTERN)) hi = mid
    else lo = mid
  }
  return hi
})()

/**
 * The table for a mark drawn `px` tall: every cut, band and wall at least
 * OPTICAL_MIN_PX. Cuts and walls take their room from the window, so the
 * body never changes; a ring hole too small to show closes into a knob. The
 * hole is decided once, at the fitted size, so the fit cannot flicker.
 */
export function optical(px: number, l: Lantern = LANTERN): Lantern {
  const table = px >= MARK_MIN_PX ? fitted(px, l) : null
  if (!table) throw new RangeError(`The mark needs at least ${MARK_MIN_PX.toFixed(2)} px; asked for ${px}`)
  return table
}

/** A tile's corner radius as a share of its side: Apple's app-icon corner. */
export const TILE_CORNER = 0.2237

export type MarkGround = 'none' | 'tile' | 'rounded'

export interface MarkSvgOptions {
  /** The mark's height as a share of the square's side. */
  readonly fill: number
  readonly ground: MarkGround
  readonly tone: MarkTone | 'mono'
  /** Draw the table fitted for a mark this many pixels tall (see `optical`). */
  readonly px?: number
  /** Paint every part this colour (mono). */
  readonly ink?: string
  /** Pixel width and height, for a rasteriser; vector use leaves it to the box. */
  readonly size?: number
}

/** A square SVG of the mark, centred, `fill` of the side tall. */
export function markSvg({ fill, ground, tone, px, ink = '#ffffff', size }: MarkSvgOptions): string {
  const shape = lanternShape(px === undefined ? LANTERN : optical(px))
  const side = shape.box.height / fill
  const cx = shape.box.x + shape.box.width / 2
  const cy = shape.box.y + shape.box.height / 2
  const x = round(cx - side / 2)
  const y = round(cy - side / 2)
  const paint = (part: MarkPart): string => (tone === 'mono' ? ink : tone[part])
  const tile =
    ground === 'none' || tone === 'mono'
      ? ''
      : `<rect x="${x}" y="${y}" width="${round(side)}" height="${round(side)}"${ground === 'rounded' ? ` rx="${round(side * TILE_CORNER)}"` : ''} fill="${tone.tile}"/>`
  const parts = MARK_PARTS.map((part) => `<path fill="${paint(part)}" d="${shape.paths[part]}"/>`).join('')
  const pixels = size === undefined ? '' : ` width="${size}" height="${size}"`
  return `<svg xmlns="http://www.w3.org/2000/svg"${pixels} viewBox="${x} ${y} ${round(side)} ${round(side)}">${tile}${parts}</svg>\n`
}

/** The custom property each part's fill reads in the inline mark. */
export const MARK_VARS: Readonly<Record<MarkPart, string>> = Object.freeze({
  frame: '--mark-frame',
  window: '--mark-window',
  base: '--mark-base',
})

/** Both themes' part colours on each root carrying `data-theme`. */
export const markCss = (roots: readonly string[], tones: MarkTones): string =>
  MARK_THEMES.map(
    (theme) =>
      `${roots.map((root) => `${root}[data-theme="${theme}"]`).join(',')}{${MARK_PARTS.map((part) => `${MARK_VARS[part]}:${tones[theme][part]}`).join(';')}}`,
  ).join('')
