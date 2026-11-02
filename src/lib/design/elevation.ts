import { THEMES, type Theme } from './bento-palette'

/**
 * Elevation (docs/redesign/BENTO_POLISH.md "Elevation"). One scale of height
 * as data: level n stands `base · ratio^(n − 1)` px above the page, and each
 * level is the level below plus one rise at its own height, so a one-level
 * lift is one layer. The edge is the surface's border, painted in a
 * translucent ink (`--elevation-edge`); the levels carry the highlight and
 * the drops. Colours are palette roles: drops read `--lab-shadow`, the edge
 * and highlight read `--lab-ink`. LabRoot emits the stylesheet per theme
 * beside the palette's, so like bento-palette.ts only the server render
 * imports this.
 */

export const ELEVATION = Object.freeze({
  /** Height of level 1, in px. */
  base: 2,
  /** Each level stands this many times higher than the one below. */
  ratio: 3,
  /** Share of `--lab-shadow` in the contact shadow, and in level 1's rise; higher rises are broader and fainter (`riseShare`). */
  share: Object.freeze({ contact: 0.5, rise: 0.6 }),
})

export const LEVELS = [0, 1, 2, 3, 4] as const
export type Level = (typeof LEVELS)[number]
export type RaisedLevel = Exclude<Level, 0>

/** The levels that stand above the page, each casting one rise. */
export const RAISED: readonly RaisedLevel[] = LEVELS.filter((level): level is RaisedLevel => level > 0)

/** A theme's edge: the border's and the top highlight's share of ink. Shadows barely read on a dark ground, so the edge and highlight carry depth there; in light a dark top line would read as a recess. */
export const EDGE: Readonly<Record<Theme, { readonly border: number; readonly highlight: number }>> = Object.freeze({
  dark: { border: 0.1, highlight: 0.07 },
  light: { border: 0.08, highlight: 0 },
})

/** The outline on media: pure white in dark, pure black in light, never a tinted neutral that picks up the surface under it. */
export const IMAGE_OUTLINE: Readonly<Record<Theme, { readonly lightness: 0 | 1; readonly alpha: number }>> = Object.freeze({
  dark: { lightness: 1, alpha: 0.1 },
  light: { lightness: 0, alpha: 0.1 },
})

type Source = '--lab-ink' | '--lab-shadow'

export interface ShadowLayer {
  readonly y: number
  readonly blur: number
  readonly spread: number
  readonly inset: boolean
  /** The palette variable the layer is painted with, and that variable's share. */
  readonly from: Source
  readonly share: number
}

export const heightOf = (level: Level): number => (level === 0 ? 0 : ELEVATION.base * ELEVATION.ratio ** (level - 1))

/** A rise's share falls with the square root of its level, so a tall stack's darkest point stays at its contact instead of building up under the box. */
export const riseShare = (level: RaisedLevel): number => ELEVATION.share.rise / Math.sqrt(level)

/**
 * The shadow a level adds over the one below: offset by its height, blurred
 * twice that, and spread in by half its height, so it falls under the box
 * (the light is above the page) and still shows under a box only a little
 * taller than the level's height.
 */
export const riseLayer = (level: RaisedLevel): ShadowLayer => {
  const h = heightOf(level)
  return { y: h, blur: 2 * h, spread: -h / 2, inset: false, from: '--lab-shadow', share: riseShare(level) }
}

const CONTACT: ShadowLayer = { y: 1, blur: 2, spread: 0, inset: false, from: '--lab-shadow', share: ELEVATION.share.contact }

/** A level's layers, painted top first: the highlight (where the theme has one), the contact, then one rise per level up to this one. Level 0 is the edge alone. */
export function elevationLayers(level: Level, theme: Theme): readonly ShadowLayer[] {
  if (level === 0) return []
  const { highlight } = EDGE[theme]
  const lit: readonly ShadowLayer[] = highlight > 0 ? [{ y: 1, blur: 0, spread: 0, inset: true, from: '--lab-ink', share: highlight }] : []
  return [...lit, CONTACT, ...RAISED.filter((n) => n <= level).map(riseLayer)]
}

const px = (value: number): string => (value === 0 ? '0' : `${value}px`)

const mix = (from: Source, share: number): string =>
  share >= 1 ? `var(${from})` : `color-mix(in srgb, var(${from}) ${Math.round(share * 100)}%, transparent)`

export const cssShadow = (layers: readonly ShadowLayer[]): string =>
  layers.length === 0
    ? 'none'
    : layers.map((layer) => `${layer.inset ? 'inset ' : ''}0 ${px(layer.y)} ${px(layer.blur)} ${px(layer.spread)} ${mix(layer.from, layer.share)}`).join(', ')

const outline = ({ lightness, alpha }: (typeof IMAGE_OUTLINE)[Theme]): string => `oklch(${lightness} 0 0 / ${alpha})`

/** One theme's custom properties: the edge, every level, every level's rise, and the media outline. */
export const elevationCssVars = (theme: Theme): Readonly<Record<string, string>> => ({
  '--elevation-edge': mix('--lab-ink', EDGE[theme].border),
  ...Object.fromEntries(LEVELS.map((level) => [`--elevation-${level}`, cssShadow(elevationLayers(level, theme))])),
  ...Object.fromEntries(RAISED.map((level) => [`--elevation-rise-${level}`, cssShadow([riseLayer(level)])])),
  '--image-outline': outline(IMAGE_OUTLINE[theme]),
})

/** The stylesheet for every theme on each of `roots` (an element carrying `data-theme`). */
export const elevationCss = (roots: readonly string[]): string =>
  THEMES.map(
    (theme) =>
      `${roots.map((root) => `${root}[data-theme="${theme}"]`).join(',')}{${Object.entries(elevationCssVars(theme))
        .map(([name, value]) => `${name}:${value}`)
        .join(';')}}`,
  ).join('')
