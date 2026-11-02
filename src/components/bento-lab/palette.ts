export type Rgb = readonly [number, number, number]

/** Canvas colours, read from the lab root's custom properties so art follows the theme. */
export interface LabPalette {
  readonly ink: Rgb
  readonly muted: Rgb
  readonly brand: Rgb
  readonly brandSoft: Rgb
  readonly bright: Rgb
  readonly art: Rgb
}

export type PaletteKey = keyof LabPalette

const FALLBACK: Rgb = [128, 128, 128]
const RAMP_STEPS = 64

export const parseHex = (value: string): Rgb => {
  const hex = value.trim().replace('#', '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  const n = Number.parseInt(full, 16)
  return Number.isNaN(n) || full.length !== 6 ? FALLBACK : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Reads the palette variables, which the stylesheet writes as sRGB hex (BENTO_COLOR.md "Emission"). */
export function readPalette(root: Element): LabPalette {
  const css = getComputedStyle(root)
  const token = (name: string): Rgb => parseHex(css.getPropertyValue(name))
  return {
    ink: token('--lab-ink'),
    muted: token('--lab-muted'),
    brand: token('--brand'),
    brandSoft: token('--brand-soft'),
    bright: token('--lab-bright'),
    art: token('--lab-art'),
  }
}

const toCss = (c: Rgb): string => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`

const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const ramps = new WeakMap<LabPalette, Map<string, readonly string[]>>()

/**
 * A precomputed colour ramp between two palette entries, cached per palette
 * object, so renderers pick CSS colour strings by index instead of building
 * them every frame. `pick(ramp, t)` maps t ∈ [0,1] onto it.
 */
export function ramp(palette: LabPalette, from: PaletteKey, to: PaletteKey): readonly string[] {
  const cache = ramps.get(palette) ?? new Map<string, readonly string[]>()
  ramps.set(palette, cache)
  const key = `${from}>${to}`
  const hit = cache.get(key)
  if (hit) return hit
  const built = Array.from({ length: RAMP_STEPS }, (_, i) => toCss(lerp(palette[from], palette[to], i / (RAMP_STEPS - 1))))
  cache.set(key, built)
  return built
}

export const pick = (colours: readonly string[], t: number): string =>
  colours[Math.max(0, Math.min(colours.length - 1, Math.round(t * (colours.length - 1))))] ?? colours[0] ?? 'rgb(128,128,128)'

export const solid = (palette: LabPalette, key: PaletteKey): string => pick(ramp(palette, key, key), 0)
