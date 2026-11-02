import { describe, expect, it } from 'vitest'
import { THEMES } from './bento-palette'
import { EDGE, IMAGE_OUTLINE, LEVELS, RAISED, elevationCss, elevationCssVars, elevationLayers, heightOf, riseLayer, riseShare, type Level } from './elevation'
import { labSheets } from './lab-sheets'

describe('the elevation scale', () => {
  it('stands each level higher than the one below', () => {
    const heights = LEVELS.map(heightOf)
    expect(heights[0]).toBe(0)
    expect(heights).toEqual([...heights].sort((a, b) => a - b))
    expect(new Set(heights).size).toBe(heights.length)
  })

  it('keeps level 0 to the edge alone', () => {
    for (const theme of THEMES) {
      expect(elevationLayers(0, theme)).toEqual([])
      expect(elevationCssVars(theme)['--elevation-0']).toBe('none')
    }
  })

  it('makes each level the one below plus its rise, so a one-level lift is one layer', () => {
    for (const theme of THEMES) {
      for (const level of RAISED) {
        const below = elevationLayers((level - 1) as Level, theme)
        const here = elevationLayers(level, theme)
        expect(here.slice(0, below.length)).toEqual(below)
        expect(here.at(-1)).toEqual(riseLayer(level))
        if (level > 1) expect(here).toHaveLength(below.length + 1)
      }
    }
  })

  it('casts every rise under the box and fainter as it broadens', () => {
    for (const level of RAISED) {
      const { y, spread, blur } = riseLayer(level)
      expect(y).toBe(heightOf(level))
      expect(blur).toBe(2 * y)
      expect(spread).toBe(-y / 2)
    }
    const shares = RAISED.map(riseShare)
    expect(shares).toEqual([...shares].sort((a, b) => b - a))
  })

  it('lights the top edge only in dark, and drops only with the palette shadow', () => {
    for (const theme of THEMES) {
      for (const level of RAISED) {
        const layers = elevationLayers(level, theme)
        expect(layers.some((layer) => layer.inset)).toBe(EDGE[theme].highlight > 0)
        for (const layer of layers) expect(layer.from).toBe(layer.inset ? '--lab-ink' : '--lab-shadow')
      }
    }
    expect(EDGE.dark.highlight).toBeGreaterThan(0)
    expect(EDGE.light.highlight).toBe(0)
  })

  it('outlines media in pure black or white, never a tint', () => {
    expect(IMAGE_OUTLINE.dark.lightness).toBe(1)
    expect(IMAGE_OUTLINE.light.lightness).toBe(0)
    for (const theme of THEMES) expect(elevationCssVars(theme)['--image-outline']).toMatch(/^oklch\([01] 0 0 \/ 0\.\d+\)$/)
  })

  it('emits the edge, every level and every rise for every theme', () => {
    for (const theme of THEMES) {
      const vars = elevationCssVars(theme)
      expect(vars['--elevation-edge']).toContain('var(--lab-ink)')
      for (const level of LEVELS) expect(vars[`--elevation-${level}`]).toBeTruthy()
      for (const level of RAISED) expect(vars[`--elevation-rise-${level}`]).toBeTruthy()
    }
    const css = elevationCss(['[data-lab]'])
    for (const theme of THEMES) expect(css).toContain(`[data-lab][data-theme="${theme}"]{`)
  })
})

/* Every drop shadow in the lab is an elevation level (docs/redesign/BENTO_POLISH.md, "Elevation"). */

/** Splits a shadow list on its top-level commas. */
const layersOf = (value: string): string[] => {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')') depth--
    else if (value[i] === ',' && depth === 0) {
      out.push(value.slice(start, i).trim())
      start = i + 1
    }
  }
  return [...out, value.slice(start).trim()]
}

/** Splits a value on its top-level whitespace, keeping each function call whole. */
const tokensOf = (value: string): string[] => {
  const out: string[] = []
  let depth = 0
  let token = ''
  for (const ch of value) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (/\s/.test(ch) && depth === 0) {
      if (token) out.push(token)
      token = ''
    } else token += ch
  }
  return token ? [...out, token] : out
}

const COLOUR = /^(#|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(|currentcolor$|transparent$|[a-z]+$)/i

/**
 * True for an outer shadow with a blur: a drop, which only the elevation
 * scale casts. Zero-blur rings and inset shading are not drops. The layer is
 * read by position (x, y, blur, spread) after its colour is set aside; a
 * blur written as `calc()` or `var()` cannot be read, so it counts as a drop.
 */
const isDrop = (layer: string): boolean => {
  if (/^var\(--elevation-[a-z0-9-]+\)$/.test(layer) || layer === 'none' || /\binset\b/.test(layer)) return false
  const blur = tokensOf(layer).filter((token) => !COLOUR.test(token))[2]
  if (blur === undefined) return false
  return /^-?[\d.]/.test(blur) ? Number.parseFloat(blur) > 0 : true
}

describe('lab CSS takes its shadows from the scale', () => {
  const sheets = labSheets()

  it('reads the palette shadow only through the elevation tokens', () => {
    const strays = sheets.flatMap(({ path, lines }) =>
      lines.flatMap((line, index) => (line.includes('--lab-shadow') ? [`${path}:${index + 1} ${line.trim()}`] : [])),
    )
    expect(strays).toEqual([])
  })

  it('casts every drop through an elevation level', () => {
    const strays = sheets.flatMap(({ path, lines }) =>
      [...lines.join('\n').matchAll(/(?:^|[\s;{])box-shadow\s*:\s*([^;]+);/g)].flatMap((match) =>
        layersOf(match[1]!.replace(/\s+/g, ' ').trim())
          .filter(isDrop)
          .map((layer) => `${path} ${layer}`),
      ),
    )
    expect(strays).toEqual([])
  })

  it('casts no drop through a filter', () => {
    const strays = sheets.flatMap(({ path, lines }) =>
      lines.flatMap((line, index) => (/\bdrop-shadow\(/.test(line) ? [`${path}:${index + 1} ${line.trim()}`] : [])),
    )
    expect(strays).toEqual([])
  })
})
