import sharp from 'sharp'
import { LANTERN, MARK_PARTS, MARK_THEMES, lanternShape, markSvg, type MarkGround, type MarkPart, type MarkTheme, type MarkTones } from './mark'
import { rasterLantern, type PixelMark } from './pixel-mark'
import { resolvePalette } from '@/lib/design/bento-palette'
import { paletteSpec, type Role } from '@/lib/design/palette-spec'
import { toHex } from '@/lib/design/color'
import { DEFAULT_PALETTE } from '@/lib/design/palette-ids'

/**
 * Every file the mark is drawn into, as data (docs/redesign/BRAND_MARK.md
 * "Placing the mark in a square"), and the renderer that draws one. Node
 * only: it imports the palette solver and sharp. `generate.ts` writes what
 * this derives; the drift test re-derives it and compares.
 */

/** The palette role each part paints with, and the tile's. */
export const MARK_ROLES: Readonly<Record<MarkPart | 'tile', Role>> = Object.freeze({
  frame: 'accent',
  window: 'sparkMark',
  base: 'ink',
  tile: 'surface1',
})

/** The mark takes the default palette's roles whichever palette a page shows. */
export function resolveMarkTones(): MarkTones {
  const spec = paletteSpec(DEFAULT_PALETTE)
  const tone = (theme: MarkTheme) => {
    const resolved = resolvePalette(spec, theme)
    return Object.freeze(Object.fromEntries(Object.entries(MARK_ROLES).map(([part, role]) => [part, toHex(resolved[role].oklch)]))) as MarkTones[MarkTheme]
  }
  return Object.freeze({ dark: tone('dark'), light: tone('light') })
}

/** Android adaptive layers in dp: the launcher shows the middle `viewport`, and a circle of `safe` always shows. */
export const ADAPTIVE = Object.freeze({ layer: 108, viewport: 72, safe: 66 })
/** W3C maskable icons: the safe zone is a centred circle 80% of the side across. */
export const MASKABLE_SAFE = 0.8

/** HIG store icon: the system masks the corners, so the mark stays clear of them. */
export const STORE_FILL = 0.7
/** A tab icon has few pixels and must fill them. */
export const TAB_FILL = 0.875
/** Expo draws the splash image `imageWidth` wide; the mark nearly fills the square's height. */
export const SPLASH_FILL = 0.9
/** The store icon's size inside the launcher's viewport. */
export const ADAPTIVE_FILL = (STORE_FILL * ADAPTIVE.viewport) / ADAPTIVE.layer
/** Browsers draw the SVG favicon in a 16 css px tab, so it is fitted for the smallest one. */
export const TAB_PX = 16

const MOBILE = 'packages/mobile/assets/images'

/** How the mark is drawn into one square: its height share, its ground, its tones, and whether the file keeps alpha. */
export interface Drawing {
  readonly fill: number
  readonly ground: MarkGround
  readonly tone: MarkTheme | 'mono'
  readonly alpha: boolean
  /** The radius, as a share of the side, the mark must stay inside. */
  readonly safe?: number
}

export type Output =
  | ({ readonly kind: 'png'; readonly path: string; readonly size: number } & Drawing)
  | ({ readonly kind: 'ico'; readonly path: string; readonly sizes: readonly number[] } & Drawing)
  | ({ readonly kind: 'svg'; readonly path: string; readonly tabPx: number } & Drawing)
  | { readonly kind: 'tile'; readonly path: string; readonly size: number; readonly tone: MarkTheme }

const STORE: Drawing = { fill: STORE_FILL, ground: 'tile', tone: 'dark', alpha: false }
const TAB: Drawing = { fill: TAB_FILL, ground: 'rounded', tone: 'dark', alpha: true }
const ADAPTIVE_LAYER: Drawing = { fill: ADAPTIVE_FILL, ground: 'none', tone: 'dark', alpha: true, safe: ADAPTIVE.safe / ADAPTIVE.layer / 2 }

export const OUTPUTS: readonly Output[] = Object.freeze([
  { kind: 'ico', path: 'src/app/favicon.ico', sizes: [16, 32, 48], ...TAB },
  { kind: 'svg', path: 'src/app/icon.svg', tabPx: TAB_PX, ...TAB },
  { kind: 'png', path: 'src/app/apple-icon.png', size: 180, ...STORE },
  { kind: 'png', path: 'public/apple-touch-icon.png', size: 180, ...STORE },
  { kind: 'png', path: 'public/icons/icon-192x192.png', size: 192, ...STORE },
  { kind: 'png', path: 'public/icons/icon-512x512.png', size: 512, ...STORE },
  { kind: 'png', path: 'public/icons/icon-maskable-512x512.png', size: 512, ...STORE, safe: MASKABLE_SAFE / 2 },
  { kind: 'png', path: `${MOBILE}/icon.png`, size: 1024, ...STORE },
  { kind: 'png', path: `${MOBILE}/android-icon-foreground.png`, size: 1024, ...ADAPTIVE_LAYER },
  { kind: 'tile', path: `${MOBILE}/android-icon-background.png`, size: 1024, tone: 'dark' },
  { kind: 'png', path: `${MOBILE}/android-icon-monochrome.png`, size: 1024, ...ADAPTIVE_LAYER, tone: 'mono' },
  { kind: 'png', path: `${MOBILE}/splash-icon.png`, size: 1024, fill: SPLASH_FILL, ground: 'none', tone: 'dark', alpha: true },
  { kind: 'png', path: `${MOBILE}/favicon.png`, size: 196, ...TAB },
])

/** The paint a drawing's parts take; a mono drawing stands on the dark tile if it has one. */
const toneOf = (tones: MarkTones, tone: MarkTheme | 'mono') => (tone === 'mono' ? 'mono' : tones[tone])
const tileOf = (tones: MarkTones, tone: MarkTheme | 'mono'): string => tones[tone === 'mono' ? 'dark' : tone].tile

/** The SVG of one drawing in a square `size` px across, fitted for that size. */
export const drawingSvg = (drawing: Drawing, size: number, tones: MarkTones): string =>
  markSvg({ fill: drawing.fill, ground: drawing.ground, tone: toneOf(tones, drawing.tone), px: size * drawing.fill, size })

/** One square PNG of a drawing, drawn for its own pixel size. */
export async function markPng(drawing: Drawing, size: number, tones: MarkTones): Promise<Buffer> {
  const image = sharp(Buffer.from(drawingSvg(drawing, size, tones)))
  return (drawing.alpha ? image : image.flatten({ background: tileOf(tones, drawing.tone) })).png({ compressionLevel: 9 }).toBuffer()
}

/** An .ico of PNG entries: a six-byte header, a sixteen-byte directory entry per image, then the images. */
export function ico(entries: readonly { readonly size: number; readonly data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  let offset = 6 + entries.length * 16
  const directory = entries.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.data)])
}

/** The file one output names, from the mark and the tones. */
export async function render(output: Output, tones: MarkTones): Promise<Buffer | string> {
  switch (output.kind) {
    case 'svg':
      return markSvg({ fill: output.fill, ground: output.ground, tone: toneOf(tones, output.tone), px: output.tabPx * output.fill })
    case 'ico':
      return ico(await Promise.all(output.sizes.map(async (size) => ({ size, data: await markPng(output, size, tones) }))))
    case 'tile':
      return sharp({ create: { width: output.size, height: output.size, channels: 3, background: tones[output.tone].tile } }).png({ compressionLevel: 9 }).toBuffer()
    case 'png':
      return markPng(output, output.size, tones)
  }
}

const HEADER = '// Generated by `npm run brand:icons` (src/lib/brand/generate.ts). Do not edit.\n'

const toneLiteral = (tones: MarkTones): string =>
  `{\n${MARK_THEMES.map((theme) => `  ${theme}: { ${[...MARK_PARTS, 'tile' as const].map((part) => `${part}: '${tones[theme][part]}'`).join(', ')} },`).join('\n')}\n}`

/** `src/lib/brand/mark-tones.gen.ts`: the resolved colours, so client code never imports the solver. */
export const tonesModule = (tones: MarkTones): string =>
  `${HEADER}import type { MarkTones } from './mark'\n\nexport const MARK_TONES: MarkTones = ${toneLiteral(tones)}\n`

/** `src/lib/brand/pixel-lantern.gen.ts`: the pixel Lantern as a table, so no page pays for sampling the paths. */
export function pixelModule(mark: PixelMark = rasterLantern()): string {
  const cells = mark.cells.map(({ col, row, part, cover }) => `    { col: ${col}, row: ${row}, part: '${part}', cover: ${cover} },`).join('\n')
  return `${HEADER}import type { PixelMark } from './pixel-mark'\n\nexport const PIXEL_LANTERN: PixelMark = {\n  cols: ${mark.cols},\n  rows: ${mark.rows},\n  cells: [\n${cells}\n  ],\n}\n`
}

/** `packages/mobile/src/components/brand-mark.gen.ts`: the app's copy of the drawing, which cannot import the web tree. */
export function mobileModule(tones: MarkTones): string {
  const { paths, box } = lanternShape(LANTERN)
  return `${HEADER}
export const MARK_VIEWBOX = '${box.x} ${box.y} ${box.width} ${box.height}'
export const MARK_ASPECT = ${box.width / box.height}

export const MARK_PARTS = [${MARK_PARTS.map((part) => `'${part}'`).join(', ')}] as const

export const MARK_PATHS = {
${MARK_PARTS.map((part) => `  ${part}: '${paths[part]}',`).join('\n')}
} as const

export const MARK_TONES = ${toneLiteral(tones)} as const
`
}
