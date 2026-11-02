import { pick, ramp, solid, type LabPalette } from './palette'

/**
 * Pure canvas renderers for the bento lab. Each draws one frame from
 * (size, time, palette, params) and owns no state, so the same function
 * serves the animated loop and the still frame. Colours come from cached
 * ramps; nothing is allocated per cell.
 */

export interface ArtParams {
  readonly kin: number
  readonly tone: number
}

export type ArtName = 'tzolkin' | 'wavespell' | 'sky'

type Renderer = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  pal: LabPalette,
  params: ArtParams,
) => void

const SEALS = 20
const TONES = 13
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace'
const SHADE = ' .:-=+*#'
const GRID = Math.PI / 6
const GRID_WIDTH = 0.06
const OBLIQUITY = 0.409
const TILT = 0.41

const clearTo = (ctx: CanvasRenderingContext2D, w: number, h: number, pal: LabPalette): void => {
  ctx.globalAlpha = 1
  ctx.fillStyle = solid(pal, 'art')
  ctx.fillRect(0, 0, w, h)
}

const onGraticule = (angle: number): boolean => {
  const m = ((angle % GRID) + GRID) % GRID
  return m < GRID_WIDTH || GRID - m < GRID_WIDTH
}

const clampUnit = (v: number): number => Math.max(-1, Math.min(1, v))

/** The 260-day count laid on its side (20 seals × 13 tones); a ripple spreads from today's kin. */
const tzolkin: Renderer = (ctx, w, h, t, pal, { kin }) => {
  clearTo(ctx, w, h, pal)
  const field = ramp(pal, 'art', 'brandSoft')
  const glow = ramp(pal, 'brandSoft', 'bright')
  const cell = Math.min(w / SEALS, h / TONES)
  const gap = Math.max(1, cell * 0.18)
  const ox = (w - cell * SEALS) / 2
  const oy = (h - cell * TONES) / 2
  const todayX = (kin - 1) % SEALS
  const todayY = Math.floor((kin - 1) / SEALS)

  for (let y = 0; y < TONES; y++) {
    for (let x = 0; x < SEALS; x++) {
      if (x === todayX && y === todayY) {
        ctx.fillStyle = pick(glow, 0.5 + 0.5 * Math.sin(t * 4))
      } else {
        const distance = Math.hypot(x - todayX, (y - todayY) * 1.4)
        const wave = 0.5 + 0.5 * Math.sin(t * 2.2 - distance * 0.55)
        ctx.fillStyle = pick(field, 0.14 + 0.5 * wave * Math.exp(-distance / 9))
      }
      ctx.fillRect(ox + x * cell + gap / 2, oy + y * cell + gap / 2, cell - gap, cell - gap)
    }
  }
}

/** Mayan bar-and-dot numerals for the 13 tones, scrolling; today's tone glows. */
const wavespell: Renderer = (ctx, w, h, t, pal, { tone }) => {
  clearTo(ctx, w, h, pal)
  const numerals = ramp(pal, 'art', 'brandSoft')
  const bright = solid(pal, 'bright')
  const brand = solid(pal, 'brand')
  const column = Math.max(12, h * 0.48)
  const unit = column / 4.4
  const shift = (t * column * 0.35) % (column * TONES)
  const count = Math.ceil(w / column) + 2
  const base = h - unit * 1.9

  for (let i = -1; i < count; i++) {
    const index = (((Math.floor(shift / column) + i) % TONES) + TONES) % TONES
    const value = index + 1
    const x = i * column - (shift % column) + column * 0.2
    const lit = value === tone
    ctx.fillStyle = lit ? bright : pick(numerals, 0.6 + 0.4 * (value / TONES))

    const bars = Math.floor(value / 5)
    const dots = value % 5
    for (let b = 0; b < bars; b++) ctx.fillRect(x, base - b * unit * 1.5, column * 0.6, unit * 0.8)
    const dotY = base - bars * unit * 1.5
    for (let d = 0; d < dots; d++) ctx.fillRect(x + d * unit * 0.72, dotY, unit * 0.5, unit * 0.5)
    if (lit) {
      ctx.fillStyle = brand
      ctx.fillRect(x, h - unit * 0.6, column * 0.6, unit * 0.3)
    }
  }
}

/** A slowly turning ASCII sky sphere: 30° graticule, the ecliptic band, a twinkling field. */
const sky: Renderer = (ctx, w, h, t, pal) => {
  clearTo(ctx, w, h, pal)
  const grid = ramp(pal, 'muted', 'ink')
  const shade = ramp(pal, 'muted', 'brandSoft')
  const ecliptic = solid(pal, 'brandSoft')
  const field = solid(pal, 'muted')

  const size = Math.max(5, Math.min(w, h) / 22)
  ctx.font = `600 ${size}px ${MONO}`
  ctx.textBaseline = 'top'
  const cw = ctx.measureText('M').width
  const cols = Math.floor(w / cw)
  const rows = Math.floor(h / size)
  const ox = (w - cols * cw) / 2
  const oy = (h - rows * size) / 2
  const short = Math.min(w, h)
  const radius = (short / Math.max(w, h)) * 0.92
  const sx = w / short / radius
  const sy = h / short / radius
  const cs = Math.cos(t * 0.3)
  const ss = Math.sin(t * 0.3)
  const ct = Math.cos(TILT)
  const st = Math.sin(TILT)
  const co = Math.cos(OBLIQUITY)
  const so = Math.sin(OBLIQUITY)
  const twinkle = Math.floor(t * 3)

  for (let r = 0; r < rows; r++) {
    const y = (((r + 0.5) / rows) * 2 - 1) * sy
    const py = oy + r * size
    for (let c = 0; c < cols; c++) {
      const x = (((c + 0.5) / cols) * 2 - 1) * sx
      const px = ox + c * cw
      const d2 = x * x + y * y

      if (d2 > 1) {
        const seed = Math.sin(c * 12.9898 + r * 78.233 + twinkle * 0.37) * 43758.5453
        if (seed - Math.floor(seed) > 0.985) {
          ctx.globalAlpha = 0.55
          ctx.fillStyle = field
          ctx.fillText('.', px, py)
        }
        continue
      }

      const z = Math.sqrt(1 - d2)
      const X = x * cs + z * ss
      const Z = -x * ss + z * cs
      const Y = y * ct - Z * st
      const Zt = y * st + Z * ct
      const light = Math.max(0, Math.min(1, 0.2 + 0.8 * (z * 0.8 - x * 0.35 - y * 0.45)))

      if (Math.abs(Math.asin(clampUnit(Y * co - X * so))) < 0.07) {
        ctx.globalAlpha = 0.55 + 0.45 * light
        ctx.fillStyle = ecliptic
        ctx.fillText('*', px, py)
      } else if (onGraticule(Math.atan2(X, Zt)) || onGraticule(Math.asin(clampUnit(Y)))) {
        ctx.globalAlpha = 0.85
        ctx.fillStyle = pick(grid, light)
        ctx.fillText('+', px, py)
      } else {
        ctx.globalAlpha = 0.35 + 0.5 * light
        ctx.fillStyle = pick(shade, light)
        ctx.fillText(SHADE[Math.min(SHADE.length - 1, Math.floor(light * (SHADE.length - 1)))] ?? ' ', px, py)
      }
    }
  }
  ctx.globalAlpha = 1
}

export const RENDERERS: Readonly<Record<ArtName, Renderer>> = Object.freeze({ tzolkin, wavespell, sky })
