/**
 * The light half of the bento palettes: ids, the default and the variable
 * naming, safe for client modules. Colour data and solving live in
 * bento-palette.ts, which only the server render imports.
 */

export const PALETTE_IDS = ['groundwater', 'brass', 'aurora'] as const
export type PaletteId = (typeof PALETTE_IDS)[number]
export const DEFAULT_PALETTE: PaletteId = 'groundwater'

export const PALETTE_LABELS: Readonly<Record<PaletteId, string>> = Object.freeze({
  groundwater: 'Groundwater',
  brass: 'Brass',
  aurora: 'Aurora',
})

export const isPaletteId = (value: unknown): value is PaletteId => typeof value === 'string' && (PALETTE_IDS as readonly string[]).includes(value)

/** sRGB twin of every palette variable, for canvas renderers that interpolate channels. */
export const srgbVar = (name: string): string => `${name}-srgb`
