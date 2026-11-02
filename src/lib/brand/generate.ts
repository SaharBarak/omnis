import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { ImageResponse } from 'next/og'
import { OG_FONT, OG_SIZE, ogCard } from './og-card'
import { OUTPUTS, mobileModule, render, resolveMarkTones, tonesModule } from './outputs'

/**
 * Writes every file the Lantern is drawn into (docs/redesign/BRAND_MARK.md
 * "Outputs"), for `npm run brand:icons`. The Open Graph card needs Space
 * Grotesk from Google Fonts; it is fetched before anything is written, so a
 * network failure leaves the tree as it was.
 */

const OG_WEIGHTS = [500, 700] as const

/** Google Fonts serves TrueType, which next/og reads, to a client that asks like curl. */
async function font(weight: number): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(OG_FONT)}:wght@${weight}`, { headers: { 'User-Agent': 'curl/8.7.1' } })
  ).text()
  const url = /src:\s*url\((https:[^)]+\.ttf)\)/.exec(css)?.[1]
  if (!url) throw new Error(`No TrueType source for ${OG_FONT} ${weight}`)
  return (await fetch(url)).arrayBuffer()
}

/** Every file's path and bytes, derived in memory first. */
async function derive(): Promise<readonly (readonly [string, Buffer | string])[]> {
  const fonts = await Promise.all(OG_WEIGHTS.map(async (weight) => ({ name: OG_FONT, data: await font(weight), weight, style: 'normal' as const })))
  const tones = resolveMarkTones()
  const card = new ImageResponse(ogCard(tones.dark), { ...OG_SIZE, fonts })
  return [
    ['src/lib/brand/mark-tones.gen.ts', tonesModule(tones)],
    ['packages/mobile/src/components/brand-mark.gen.ts', mobileModule(tones)],
    ...(await Promise.all(OUTPUTS.map(async (output) => [output.path, await render(output, tones)] as const))),
    ['public/og-image.png', Buffer.from(await card.arrayBuffer())],
  ]
}

export async function writeBrandFiles(): Promise<void> {
  for (const [path, data] of await derive()) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, data)
    console.log(path, typeof data === 'string' ? Buffer.byteLength(data) : data.length)
  }
}
