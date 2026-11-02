/**
 * `npm run texture:sky`: writes public/textures/sky.svg from the vendored
 * star catalogue; `-- --fetch` refreshes the catalogue from the pinned
 * upstream first. The work lives in src/lib/textures/sky.ts; its test fails
 * when the committed SVG drifts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { SKY_FILES, fetchCatalogue, skySvg, type SkyCatalogue } from '@/lib/textures/sky'

async function main(): Promise<void> {
  if (process.argv.includes('--fetch')) writeFileSync(SKY_FILES.catalogue, `${JSON.stringify(await fetchCatalogue())}\n`)
  const catalogue = JSON.parse(readFileSync(SKY_FILES.catalogue, 'utf8')) as SkyCatalogue
  const svg = skySvg(catalogue, readFileSync(SKY_FILES.licence, 'utf8'))
  writeFileSync(SKY_FILES.svg, svg)
  console.log(`wrote ${SKY_FILES.svg}, ${(svg.length / 1024).toFixed(1)} KiB`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
