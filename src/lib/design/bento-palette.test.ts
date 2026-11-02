import { describe, expect, it } from 'vitest'
import { FLOORS, LAYERS, PALETTES, THEMES, paletteCss, paletteSelector, resolvePalette, type Role } from './bento-palette'
import { contrast, difference } from './color'

const TEXT_BACKDROPS: readonly Role[] = ['ground', 'surface1', 'surface2', 'chip']
const CATEGORICAL: readonly Role[] = ['accent', 'spark', ...LAYERS]
const MIN_CATEGORY_DISTANCE = 0.1

describe.each(PALETTES.flatMap((spec) => THEMES.map((theme) => [spec.id, theme, resolvePalette(spec, theme)] as const)))(
  '%s %s',
  (_id, _theme, palette) => {
    const floorOf = (role: Role): number => (role === 'ink2' ? FLOORS.ink2 : FLOORS.ink3)

    it.each(['ink', 'ink2', 'ink3', 'accent', 'accentSoft', 'danger', ...LAYERS] as const)('%s reads on every text surface', (role) => {
      for (const backdrop of TEXT_BACKDROPS) {
        expect(contrast(palette[role].oklch, palette[backdrop].oklch)).toBeGreaterThanOrEqual(floorOf(role) - 1e-9)
      }
    })

    it('puts readable text on the accent and a visible icon on the spark', () => {
      expect(contrast(palette.onAccent.oklch, palette.accent.oklch)).toBeGreaterThanOrEqual(FLOORS.colour)
      expect(contrast(palette.onSpark.oklch, palette.spark.oklch)).toBeGreaterThanOrEqual(FLOORS.mark)
    })

    it('keeps the accent, the spark and the four layers apart, so a colour names one thing', () => {
      for (const [i, a] of CATEGORICAL.entries()) {
        for (const b of CATEGORICAL.slice(i + 1)) {
          expect(difference(palette[a].oklch, palette[b].oklch), `${a} vs ${b}`).toBeGreaterThanOrEqual(MIN_CATEGORY_DISTANCE)
        }
      }
    })

    it('marks the ink-filled primary action with the spark', () => {
      expect(contrast(palette.spark.oklch, palette.ink.oklch)).toBeGreaterThanOrEqual(FLOORS.mark - 1e-9)
    })

    it('keeps the spark apart from danger, so a call to action never reads as an error', () => {
      expect(difference(palette.spark.oklch, palette.danger.oklch)).toBeGreaterThanOrEqual(MIN_CATEGORY_DISTANCE)
    })
  },
)

describe('paletteCss', () => {
  const css = paletteCss(['[data-lab]', '[data-swatch]'])

  it('writes one rule per palette and theme, then P3 overrides behind a gamut query', () => {
    for (const spec of PALETTES) for (const theme of THEMES) expect(css).toContain(paletteSelector(['[data-lab]', '[data-swatch]'], spec.id, theme))
    expect(css).toMatch(/@media \(color-gamut:p3\)\{@supports \(color:color\(display-p3 0 0 0\)\)\{/)
  })

  it('keeps an sRGB twin of every variable for canvas renderers', () => {
    expect(css).toMatch(/--lab-ink-srgb:#[0-9a-f]{6}/)
    expect(css).not.toMatch(/-srgb:color\(display-p3/)
  })
})
