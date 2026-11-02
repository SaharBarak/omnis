import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { LANTERN, MARK_MIN_PX, MARK_THEMES, OPTICAL_MIN_PX, lanternShape, lockup, markSvg, optical, sagitta } from './mark'
import { MARK_TONES } from './mark-tones.gen'
import { OG_SIZE } from './og-card'
import { MARK_ROLES, OUTPUTS, drawingSvg, mobileModule, render, resolveMarkTones, tonesModule, type Output } from './outputs'
import manifest from '@/app/manifest'
import { paletteSpec, resolvePalette } from '@/lib/design/bento-palette'
import { toHex } from '@/lib/design/color'
import { DEFAULT_PALETTE } from '@/lib/design/palette-ids'

const ROOT = process.cwd()
const at = (path: string): string => join(ROOT, path)
const tones = resolveMarkTones()

/**
 * Rasters drift across CPUs and libvips builds in their antialiased edges by
 * a level or two, never in their shape; a channel further off than this is a
 * changed drawing.
 */
const CHANNEL_TOLERANCE = 2

/**
 * The rasteriser flattens each arc from its own start, so an edge pixel and
 * its mirror can differ by a few percent of coverage; a lost hole or a
 * flipped arc differs by all of it.
 */
const MIRROR_TOLERANCE = 32

const rgba = async (png: Buffer): Promise<Buffer> => sharp(png).ensureAlpha().raw().toBuffer()

const samePixels = (a: Buffer, b: Buffer): boolean => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > CHANNEL_TOLERANCE) return false
  return true
}

/** The PNG entries of an .ico, in directory order. */
const icoEntries = (file: Buffer): Buffer[] =>
  Array.from({ length: file.readUInt16LE(4) }, (_, i) => {
    const entry = 6 + i * 16
    return file.subarray(file.readUInt32LE(entry + 12), file.readUInt32LE(entry + 12) + file.readUInt32LE(entry + 8))
  })

/** The alpha of every pixel of an SVG drawn `size` square: coverage, since the mark is all that is painted. */
async function coverage(svg: string, size: number): Promise<Uint8Array> {
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  expect([info.width, info.height]).toEqual([size, size])
  return Uint8Array.from({ length: size * size }, (_, i) => data[i * 4 + 3])
}

/** The mark alone, mono and on no ground, as a drawing of the given output paints it. */
const markOnly = (drawing: Extract<Output, { fill: number }>, size: number) =>
  coverage(drawingSvg({ ...drawing, ground: 'none', tone: 'mono' }, size, tones), size)

const distanceFromCentre = (i: number, size: number): number => Math.hypot((i % size) + 0.5 - size / 2, Math.floor(i / size) + 0.5 - size / 2)

describe('the drawing, as it renders', () => {
  /* 400 px tall: ten pixels to the unit, the mark's centre on the square's. */
  const SIZE = 400
  const shape = lanternShape(LANTERN)
  const unit = SIZE / shape.box.height
  const centreY = shape.box.y + shape.box.height / 2
  const pixel = (x: number, y: number): number => Math.floor(SIZE / 2 + (y - centreY) * unit) * SIZE + Math.floor(SIZE / 2 + x * unit)
  const drawn = coverage(markSvg({ fill: 1, ground: 'none', tone: 'mono', size: SIZE }), SIZE)

  it('stands 20 by 40 units', async () => {
    const alpha = await drawn
    const opaque = [...alpha.keys()].filter((i) => alpha[i] > 127)
    const xs = opaque.map((i) => i % SIZE)
    const ys = opaque.map((i) => Math.floor(i / SIZE))
    expect(Math.abs(Math.max(...xs) - Math.min(...xs) + 1 - 20 * unit)).toBeLessThanOrEqual(1)
    expect(Math.abs(Math.max(...ys) - Math.min(...ys) + 1 - 40 * unit)).toBeLessThanOrEqual(1)
  })

  it('is symmetric about its axis', async () => {
    const alpha = await drawn
    let worst = 0
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE / 2; x++) worst = Math.max(worst, Math.abs(alpha[y * SIZE + x] - alpha[y * SIZE + SIZE - 1 - x]))
    expect(worst).toBeLessThanOrEqual(MIRROR_TOLERANCE)
  })

  it('lies within half its height of its centre, so one fill fits it to any circle', async () => {
    const alpha = await drawn
    const farthest = Math.max(...[...alpha.keys()].filter((i) => alpha[i] > 0).map((i) => distanceFromCentre(i, SIZE)))
    expect(farthest).toBeLessThanOrEqual(SIZE / 2 + 1)
  })

  it('cuts its holes: the ring, the gap round the window, the notch under the brim, the foot', async () => {
    const alpha = await drawn
    const body = LANTERN.length
    const holes = {
      ring: [0, -LANTERN.body + LANTERN.brim - sagitta(LANTERN.body, LANTERN.lid) - LANTERN.ring.inner],
      side: [-(LANTERN.body - LANTERN.wall - LANTERN.gap / 2), 0],
      sill: [0, body - LANTERN.wall - LANTERN.gap / 2],
      notch: [-(LANTERN.lid - 1), -LANTERN.body + LANTERN.brim + 0.5],
      foot: [0, body + LANTERN.foot / 2],
    } as const
    const solids = { wall: [-(LANTERN.body - LANTERN.wall / 2), 0], window: [0, body / 2], base: [0, body + LANTERN.foot + 2] } as const
    for (const [name, [x, y]] of Object.entries(holes)) expect(alpha[pixel(x, y)], name).toBe(0)
    for (const [name, [x, y]] of Object.entries(solids)) expect(alpha[pixel(x, y)], name).toBe(255)
  })

  it('cuts the cap and the base from the body’s own circle, a 6-8-10 chord', () => {
    expect(sagitta(LANTERN.body, LANTERN.lid)).toBe(4)
    expect(shape.paths.base).toContain(`A${LANTERN.body} ${LANTERN.body}`)
    expect(shape.paths.frame).toContain(`A${LANTERN.body} ${LANTERN.body} 0 0 1 ${LANTERN.lid}`)
  })
})

describe('the drawing at small sizes', () => {
  const sweep = (from: number, to: number, step: number): number[] => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step)

  it('keeps every cut, band, wall and the window at a pixel or more from 8 to 40 px, and refuses below its minimum', () => {
    for (const px of sweep(8, 40, 0.25)) {
      if (px < MARK_MIN_PX) {
        expect(() => optical(px), `${px}`).toThrow(RangeError)
        continue
      }
      const fitted = optical(px)
      const min = (OPTICAL_MIN_PX * lanternShape(fitted).box.height) / px - 1e-9
      expect(fitted.body).toBe(LANTERN.body)
      const widths = [fitted.wall, fitted.gap, fitted.foot, fitted.ring.outer - fitted.ring.inner, 2 * (fitted.body - fitted.wall - fitted.gap)]
      for (const width of widths) expect(width, `${px}`).toBeGreaterThanOrEqual(min)
      expect(fitted.ring.inner === 0 || 2 * fitted.ring.inner >= min, `${px}`).toBe(true)
    }
  })

  it('draws the table as it stands from 40 px up', () => {
    for (const px of sweep(40, 200, 1)) expect(optical(px), `${px}`).toEqual({ ...LANTERN, ring: { ...LANTERN.ring } })
  })
})

describe('the lockup', () => {
  it.each([LANTERN, ...[12, 16, 20, 24, 32].map((px) => optical(px))])('stands the body on the baseline and reaches the cap line, at %#', (table) => {
    const { box } = lanternShape(table)
    const { height, drop, gap } = lockup(table)
    const cap = box.height / height
    const baseline = box.y + box.height - drop * cap
    expect(baseline).toBeCloseTo(table.length, 9)
    expect(baseline - cap).toBeCloseTo(-table.body + table.brim, 9)
    expect(gap * cap).toBeCloseTo(box.width / 2, 9)
  })
})

describe('the tones', () => {
  it('are the default palette roles for each theme', () => {
    const spec = paletteSpec(DEFAULT_PALETTE)
    for (const theme of MARK_THEMES) {
      const resolved = resolvePalette(spec, theme)
      for (const [part, role] of Object.entries(MARK_ROLES)) expect(MARK_TONES[theme][part as keyof typeof MARK_ROLES]).toBe(toHex(resolved[role].oklch))
    }
  })

  it('keep the colours the owner picked in the dark theme', () => {
    const { anchors } = paletteSpec(DEFAULT_PALETTE)
    expect(MARK_TONES.dark.frame).toBe(anchors.frame)
    expect(MARK_TONES.dark.window).toBe(anchors.window)
  })
})

describe('the generated files: a changed mark without `npm run brand:icons` fails here', () => {
  it('match the modules they are written from', () => {
    expect(readFileSync(at('src/lib/brand/mark-tones.gen.ts'), 'utf8')).toBe(tonesModule(tones))
    expect(readFileSync(at('packages/mobile/src/components/brand-mark.gen.ts'), 'utf8')).toBe(mobileModule(tones))
  })

  it.each(OUTPUTS.map((output) => [output.path, output] as const))('%s is what the mark draws today', async (_, output: Output) => {
    const fresh = await render(output, tones)
    const disk = readFileSync(at(output.path))
    if (typeof fresh === 'string') return expect(disk.toString('utf8')).toBe(fresh)
    if (output.kind === 'ico') {
      const [want, have] = [icoEntries(fresh), icoEntries(disk)]
      expect(have.length).toBe(want.length)
      for (const [i, entry] of want.entries()) expect(samePixels(await rgba(have[i]), await rgba(entry))).toBe(true)
      return
    }
    expect(samePixels(await rgba(disk), await rgba(fresh))).toBe(true)
  })
})

describe('the outputs', () => {
  const safeRows = OUTPUTS.flatMap((output) => (output.kind === 'png' && output.safe !== undefined ? [[output.path, output] as const] : []))

  it.each(safeRows)('%s keeps every painted pixel of the mark inside its safe circle', async (_, output) => {
    if (output.kind !== 'png' || output.safe === undefined) return
    const alpha = await markOnly(output, output.size)
    const farthest = Math.max(...[...alpha.keys()].filter((i) => alpha[i] > 0).map((i) => distanceFromCentre(i, output.size)))
    expect(farthest).toBeLessThanOrEqual(output.safe * output.size)
  })

  it.each(OUTPUTS.flatMap((output) => (output.kind === 'png' || output.kind === 'tile' ? [[output.path, output] as const] : [])))('%s has its stated size and alpha', async (_, output) => {
    const meta = await sharp(readFileSync(at(output.path))).metadata()
    expect([meta.width, meta.height]).toEqual([output.size, output.size])
    expect(meta.hasAlpha).toBe(output.kind === 'png' && output.alpha)
  })

  const { expo } = JSON.parse(readFileSync(at('packages/mobile/app.json'), 'utf8')) as {
    expo: { icon: string; ios: { icon: string }; android: { adaptiveIcon: Record<string, string> }; web: { favicon: string }; plugins: unknown[] }
  }
  const fromExpo = (image: string | undefined): string => `packages/mobile/${String(image).replace(/^\.\//, '')}`
  const splash = expo.plugins.find((plugin): plugin is [string, { image: string }] => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')
  const webIcons = manifest().icons ?? []

  it('names, in the web manifest, only icons the generator wrote, at their stated sizes', async () => {
    expect(webIcons.some((icon) => icon.purpose === 'maskable')).toBe(true)
    for (const icon of webIcons) {
      const path = `public${icon.src}`
      expect(OUTPUTS.some((output) => output.path === path), path).toBe(true)
      const meta = await sharp(readFileSync(at(path))).metadata()
      expect(`${meta.width}x${meta.height}`).toBe(icon.sizes)
    }
  })

  it('names, in the Expo config, only images the generator wrote', () => {
    const images = [expo.icon, expo.ios.icon, ...Object.values(expo.android.adaptiveIcon).filter((value) => value.endsWith('.png')), expo.web.favicon, splash?.[1].image]
    for (const image of images) expect(OUTPUTS.some((output) => output.path === fromExpo(image)), fromExpo(image)).toBe(true)
  })

  it('gives the platforms that mask an icon an opaque one: iOS, the Apple touch icon, the web manifest', async () => {
    const opaque = [fromExpo(expo.icon), fromExpo(expo.ios.icon), 'src/app/apple-icon.png', 'public/apple-touch-icon.png', ...webIcons.map((icon) => `public${icon.src}`)]
    for (const path of opaque) expect((await sharp(readFileSync(at(path))).metadata()).hasAlpha, path).toBe(false)
  })

  it('leaves the icon links to the App Router files: Next drops them when metadata sets icons', () => {
    expect(readFileSync(at('src/app/layout.tsx'), 'utf8')).not.toMatch(/^\s*icons\s*:/m)
  })

  it('leaves one owner per URL: the App Router favicon and manifest', () => {
    expect(existsSync(at('src/app/favicon.ico'))).toBe(true)
    expect(existsSync(at('public/favicon.ico'))).toBe(false)
    expect(existsSync(at('public/site.webmanifest'))).toBe(false)
  })

  it('draws the Open Graph card at its stated size', async () => {
    const meta = await sharp(readFileSync(at('public/og-image.png'))).metadata()
    expect([meta.width, meta.height]).toEqual([OG_SIZE.width, OG_SIZE.height])
  })
})
