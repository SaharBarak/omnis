/**
 * Public glyph assets, one rule per set. Each set names its files from the
 * datum's own number and name; the sets differ in how they slug the name
 * (seals drop hyphens, tones keep them), so the rule lives in this table and
 * nowhere else. glyph-paths.test.ts checks every path against the disk.
 */

const pad = (n: number): string => String(n).padStart(2, '0')
const letters = (name: string): string => name.toLowerCase().replace(/[^a-z]/g, '')
const kebab = (name: string): string => name.toLowerCase().replace(/[^a-z]+/g, '-')

export const glyphSlug = (n: number, name: string): string => `${pad(n)}-${letters(name)}`

export const sealGlyphSrc = (n: number, english: string): string =>
  `/images/dreamspell/seals/${glyphSlug(n, english)}.svg`

export const toneGlyphSrc = (n: number, name: string): string =>
  `/images/dreamspell/tones/${pad(n)}-${kebab(name)}.svg`

export const signGlyphSrc = (n: number, name: string): string =>
  `/images/astrology/signs/${glyphSlug(n, name)}.svg`

const PLANET_GLYPHS = new Set([
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
])

/** Null for points without a drawn glyph (nodes, Lilith); callers use the engine's symbol. */
export const planetGlyphSrc = (id: string): string | null =>
  PLANET_GLYPHS.has(id) ? `/images/astrology/planets/${id}.svg` : null
