/**
 * `npm run type:bearings`: reads the display face's left side bearings from
 * rendered ink in the live font, as the app loads it, and writes
 * src/lib/design/face-bearings.gen.ts. Needs the app running (BASE, default
 * http://localhost:3100). Each glyph is set at MEASURE_PX in magenta on black
 * at a whole-pixel origin, so its bearing is where its ink starts, in em.
 */
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { inkStarts, inkStyle, MEASURE_PX } from './ink-scan.mjs'
import { BEARING_GLYPHS, bearingsModule, FACE_BEARINGS_PATH, TABULAR_GLYPHS, type Bearings, type Figures } from '@/lib/design/face-bearings'

const BASE = process.env.BASE ?? 'http://localhost:3100'
const WEIGHT = 600
/** Room per glyph: its em, and as much again before its origin for a glyph that inks left of it. */
const CELL = MEASURE_PX * 1.5
const PER_ROW = 8

interface Cell {
  readonly glyph: string
  readonly figures: Figures
  readonly x: number
  readonly y: number
}

const cells: readonly Cell[] = [
  ...BEARING_GLYPHS.map((glyph) => ({ glyph, figures: 'proportional' as const })),
  ...TABULAR_GLYPHS.map((glyph) => ({ glyph, figures: 'tabular' as const })),
].map((c, i) => ({ ...c, x: (i % PER_ROW) * CELL + MEASURE_PX / 2, y: Math.floor(i / PER_ROW) * CELL }))

async function main(): Promise<void> {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: PER_ROW * CELL, height: Math.ceil(cells.length / PER_ROW) * CELL }, deviceScaleFactor: 1 })
  await page.goto(`${BASE}/lab/bento-v2`, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.evaluate(
    async ({ cells, weight, size }) => {
      const family = getComputedStyle(document.body).getPropertyValue('--font-display').trim()
      await document.fonts.load(`${weight} ${size}px ${family}`)
      const sheet = document.createElement('div')
      sheet.id = 'bearing-sheet'
      sheet.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000'
      for (const cell of cells) {
        const span = document.createElement('span')
        span.textContent = cell.glyph
        span.style.cssText = `position:absolute;left:${cell.x}px;top:${cell.y}px;font:${weight} ${size}px ${family};line-height:1;font-variant-numeric:${cell.figures === 'tabular' ? 'tabular-nums' : 'normal'};letter-spacing:0;color:#f0f;white-space:pre`
        sheet.append(span)
      }
      document.body.append(sheet)
      await document.fonts.ready
    },
    { cells, weight: WEIGHT, size: MEASURE_PX },
  )
  await page.addStyleTag({ content: inkStyle('#bearing-sheet span', 0) })
  const png = (await page.screenshot({ fullPage: false })).toString('base64')
  const starts = await page.evaluate(inkStarts, {
    png,
    bands: cells.map((c) => ({ x: c.x - MEASURE_PX / 2, y: c.y, width: CELL - MEASURE_PX / 2, height: MEASURE_PX * 1.2 })),
  })
  await browser.close()

  const table = (figures: Figures): Record<string, number> =>
    Object.fromEntries(
      cells.flatMap((c, i) => {
        const start = starts[i]
        if (c.figures !== figures) return []
        if (start === null) throw new Error(`no ink for ${JSON.stringify(c.glyph)} (${figures})`)
        return [[c.glyph, (start - MEASURE_PX / 2) / MEASURE_PX]]
      }),
    )

  const bearings: Bearings = { weight: WEIGHT, proportional: table('proportional'), tabular: table('tabular') }
  writeFileSync(FACE_BEARINGS_PATH, bearingsModule(bearings, MEASURE_PX))
  console.log(`wrote ${FACE_BEARINGS_PATH}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
