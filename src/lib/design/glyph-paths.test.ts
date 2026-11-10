import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PLANETS } from '@pleiad/engine/data/planets'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { elementGlyphSrc, planetGlyphSrc, sealGlyphSrc, signGlyphSrc, toneGlyphSrc } from './glyph-paths'

const onDisk = (src: string): boolean => existsSync(join(process.cwd(), 'public', src))

describe('glyph paths', () => {
  it('resolves every seal, tone and sign to a file', () => {
    for (const s of SEALS) expect(onDisk(sealGlyphSrc(s.number, s.english)), s.english).toBe(true)
    for (const t of TONES) expect(onDisk(toneGlyphSrc(t.number, t.name)), t.name).toBe(true)
    for (const z of ZODIAC_SIGNS) expect(onDisk(signGlyphSrc(z.number, z.name)), z.name).toBe(true)
    for (const z of ZODIAC_SIGNS) expect(onDisk(elementGlyphSrc(z.element)), z.element).toBe(true)
  })

  it('resolves every drawn planet and returns null for the rest', () => {
    for (const p of PLANETS) {
      const src = planetGlyphSrc(p.id)
      if (src) expect(onDisk(src), p.id).toBe(true)
    }
    expect(planetGlyphSrc('northNode')).toBeNull()
  })
})
