/**
 * The light half of the bento palettes: ids, the default and the labels,
 * safe for client modules. Colour data and solving live in bento-palette.ts,
 * which only the server render imports.
 */

export const PALETTE_IDS = ['lantern'] as const
export type PaletteId = (typeof PALETTE_IDS)[number]
export const DEFAULT_PALETTE: PaletteId = 'lantern'

export const PALETTE_LABELS: Readonly<Record<PaletteId, string>> = Object.freeze({
  lantern: 'Lantern',
})

export const isPaletteId = (value: unknown): value is PaletteId => typeof value === 'string' && (PALETTE_IDS as readonly string[]).includes(value)

/**
 * Chapters (BENTO_COLOR.md "Inverse sections"): a section that takes the
 * other theme's palette, so a page alternates light and dark. Ids only, so
 * client modules can name them.
 */
export const CHAPTERS = ['inverse'] as const
export type Chapter = (typeof CHAPTERS)[number]
