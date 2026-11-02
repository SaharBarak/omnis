import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SKY, SKY_FILES, skySvg, starInBand, type SkyCatalogue } from './sky'

const read = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8')
const catalogue = JSON.parse(read(SKY_FILES.catalogue)) as SkyCatalogue
const svg = skySvg(catalogue, read(SKY_FILES.licence))

describe('the sky texture', () => {
  it('is what the catalogue draws today: a changed chart without `npm run texture:sky` fails here', () => {
    expect(read(SKY_FILES.svg)).toBe(svg)
  })

  it('carries the upstream licence and the star data credit', () => {
    expect(svg).toContain('Copyright (c) 2015, Olaf Frohn')
    expect(svg).toContain('XHIP')
  })

  it('keeps every drawn star whole inside the band, so the tile repeats down', () => {
    const drawn = catalogue.stars.filter(starInBand)
    expect(drawn.length).toBeGreaterThan(1500)
    for (const [, dec] of drawn) expect(Math.abs(dec)).toBeLessThan(SKY.band)
  })

  it('rings the Pleiades', () => {
    expect(svg).toMatch(/<circle cx="[\d.]+" cy="[\d.]+" r="14"/)
  })
})
