import { describe, expect, it } from 'vitest'
import { FLOORS, LAYERS, PALETTES, THEMES, layerHue, onLayer, paletteCss, paletteSelector, resolvePalette, type Role } from './bento-palette'
import { CATEGORICAL_GATES as GATES, emitted } from './categorical'
import { contrast, hueDistance, toHex, type Oklch } from './color'
import { apart, apartDichromat, seen } from './color-vision'

const TEXT_BACKDROPS: readonly Role[] = ['ground', 'surface1', 'surface2', 'chip']
const BAND = { dark: [0.48, 0.67], light: [0.43, 0.77] } as const

/** CSS `color-mix(in oklab, a p%, b)`. */
const mix = (a: Oklch, b: Oklch, p: number): Oklch => {
  const lab = ({ l, c, h }: Oklch) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)] as const
  const [x, y] = [lab(a), lab(b)]
  const [l, u, v] = x.map((n, i) => n * p + y[i] * (1 - p))
  return { l, c: Math.hypot(u, v), h: ((Math.atan2(v, u) * 180) / Math.PI + 360) % 360 }
}

describe.each(PALETTES.flatMap((spec) => THEMES.map((theme) => [spec.id, theme, spec, resolvePalette(spec, theme)] as const)))(
  '%s %s',
  (_id, theme, spec, palette) => {
    const out = (role: Role): Oklch => emitted(palette[role].oklch)
    const floorOf = (role: Role): number => (role === 'ink2' ? FLOORS.ink2 : FLOORS.ink3)

    it.each(['ink', 'ink2', 'ink3', 'accent', 'accentSoft', 'danger'] as const)('%s reads on every text surface', (role) => {
      for (const backdrop of TEXT_BACKDROPS) expect(contrast(out(role), out(backdrop))).toBeGreaterThanOrEqual(floorOf(role) - 1e-9)
    })

    it('puts readable text on the accent', () => {
      expect(contrast(out('onAccent'), out('accent'))).toBeGreaterThanOrEqual(FLOORS.colour)
    })

    describe('the primary action', () => {
      it('is gold and night, the lantern', () => {
        const pair = [toHex(palette.action.oklch), toHex(palette.onAction.oklch)]
        expect(pair).toContain(spec.anchors.window)
      })

      it('labels the pill at 4.5:1, before and on hover, and shows the icon on the disc at 3:1', () => {
        expect(contrast(out('onAction'), out('action'))).toBeGreaterThanOrEqual(FLOORS.colour)
        expect(contrast(out('onAction'), mix(out('action'), out('onAction'), 0.88))).toBeGreaterThanOrEqual(FLOORS.colour)
        expect(contrast(out('action'), out('onAction'))).toBeGreaterThanOrEqual(FLOORS.mark)
      })

      it('stands out from every surface it sits on at 3:1', () => {
        for (const backdrop of TEXT_BACKDROPS) expect(contrast(out('action'), out(backdrop))).toBeGreaterThanOrEqual(FLOORS.mark)
      })

      it('takes the spark as the pill wherever the spark reads against the page', () => {
        const sparkLeads = contrast(out('spark'), out('ground')) >= FLOORS.mark
        expect(toHex(palette.action.oklch) === spec.anchors.window).toBe(sparkLeads)
      })
    })

    it('draws the mark window at 3:1 on its tile', () => {
      expect(contrast(out('sparkMark'), out('surface1'))).toBeGreaterThanOrEqual(FLOORS.mark - 1e-9)
    })

    describe('the layers (BENTO_COLOR.md "Layers"), on the colours as emitted', () => {
      const layers = LAYERS.map((layer) => [layer, out(layer)] as const)

      it('take the rectangle: the anchors and their complements', () => {
        expect(hueDistance(layerHue(spec, 'sky'), layerHue(spec, 'body'))).toBeCloseTo(180, 6)
        expect(hueDistance(layerHue(spec, 'number'), layerHue(spec, 'kin'))).toBeCloseTo(180, 6)
      })

      it.each(LAYERS)('%s sits in the band, keeps its chroma, reads on every surface and carries a legible label', (layer) => {
        const colour = out(layer)
        expect(colour.l).toBeGreaterThanOrEqual(BAND[theme][0])
        expect(colour.l).toBeLessThanOrEqual(BAND[theme][1])
        expect(colour.c).toBeGreaterThanOrEqual(GATES.chroma)
        for (const backdrop of TEXT_BACKDROPS) expect(contrast(colour, out(backdrop))).toBeGreaterThanOrEqual(GATES.mark)
        expect(contrast(out(onLayer(layer)), colour)).toBeGreaterThanOrEqual(GATES.label)
      })

      it('keeps every pair apart for full and simulated colour vision', () => {
        for (const [i, [a, x]] of layers.entries()) {
          for (const [b, y] of layers.slice(i + 1)) {
            expect(apart(seen(x), seen(y), 'normal'), `${a} vs ${b}`).toBeGreaterThanOrEqual(GATES.normal)
            expect(apartDichromat(seen(x), seen(y)), `${a} vs ${b}`).toBeGreaterThanOrEqual(GATES.dichromat)
          }
        }
      })

      it('keeps every layer apart from the accent, the spark and danger', () => {
        for (const [layer, colour] of layers) {
          for (const role of ['accent', 'spark', 'danger'] as const) {
            expect(apart(seen(colour), seen(out(role)), 'normal'), `${layer} vs ${role}`).toBeGreaterThanOrEqual(GATES.role)
          }
        }
      })
    })

    if (theme === 'dark') {
      it('reproduces the mark exactly', () => {
        expect(toHex(palette.accent.oklch)).toBe(spec.anchors.frame)
        expect(toHex(palette.spark.oklch)).toBe(spec.anchors.window)
      })
    }
  },
)

describe('paletteCss', () => {
  const roots = ['[data-lab]', '[data-swatch]']
  const css = paletteCss(roots)

  it('writes one rule per palette and theme, in sRGB hex only', () => {
    for (const spec of PALETTES) for (const theme of THEMES) expect(css).toContain(paletteSelector(roots, spec.id, theme))
    expect(css).toMatch(/--lab-ink:#[0-9a-f]{6}/)
    expect(css).not.toContain('display-p3')
  })

  it('raises the text tiers to ink under increased contrast', () => {
    const more = /@media \(prefers-contrast:more\)\{(.*)\}$/.exec(css)?.[1] ?? ''
    for (const spec of PALETTES) {
      for (const theme of THEMES) {
        const ink = toHex(resolvePalette(spec, theme).ink.oklch)
        expect(more).toContain(`${paletteSelector(roots, spec.id, theme)}{--lab-text-2:${ink};--lab-text-3:${ink}`)
      }
    }
  })
})
