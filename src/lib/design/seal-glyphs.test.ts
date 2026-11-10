import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SEALS } from '@pleiad/engine/data/seals'
import { DAY_SIGN_LICENSES, daySignFile, daySignPage, type DaySignSource } from './day-signs'
import SOURCES from './day-signs.sources.json'
import { glyphSlug, sealGlyphSrc } from './glyph-paths'

const read = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8')
const web = (n: number, english: string): string => read(join('public', sealGlyphSrc(n, english)))
const mobile = (n: number, english: string): string => read(`packages/mobile/assets/glyphs/dreamspell/seals/${glyphSlug(n, english)}.svg`)
const sources = SOURCES as readonly DaySignSource[]

describe('seal glyphs', () => {
  it('draws each seal with its own day sign, titled with the seal and the Commons page it comes from', () => {
    for (const seal of SEALS) {
      const title = /<title>([^<]*)<\/title>/.exec(web(seal.number, seal.english))?.[1] ?? ''
      expect(title.startsWith(`${seal.mayan} (${seal.english}), ${daySignFile(seal.number)}`), seal.english).toBe(true)
      expect(title.endsWith(daySignPage(seal.number)), seal.english).toBe(true)
    }
  })

  it('paints one ink, so a glyph takes the colour of any surface and its counters stay open', () => {
    for (const seal of SEALS) {
      const fills = [...web(seal.number, seal.english).matchAll(/fill="([^"]*)"/g)].map((m) => m[1])
      expect(fills.length, seal.english).toBeGreaterThan(0)
      expect(fills.filter((fill) => fill !== 'currentColor'), seal.english).toEqual([])
    }
  })

  it('records every source with a licence free for commercial use with attribution', () => {
    expect(sources.map((s) => s.seal)).toEqual(SEALS.map((s) => s.number))
    for (const source of sources) {
      expect(source.file).toBe(daySignFile(source.seal))
      expect(DAY_SIGN_LICENSES.has(source.license), source.file).toBe(true)
      expect(source.author, source.file).not.toBe('')
    }
  })

  it('ships the same files to the app', () => {
    for (const seal of SEALS) expect(mobile(seal.number, seal.english), seal.english).toBe(web(seal.number, seal.english))
  })
})
