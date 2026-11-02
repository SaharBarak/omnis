import type { CategoricalProblem } from './categorical'
import { contrast, hexToOklch, solveLightness, toHex, type Oklch } from './color'
import { PALETTE_LABELS, type PaletteId } from './palette-ids'
import { PALETTE_TONES } from './palette-tones.gen'
import type { SystemKey } from './system-flavors'

/**
 * The bento palette as data (docs/redesign/BENTO_COLOR.md). A palette is
 * authored as the mark's anchor colours and the rule that derives each role
 * from them. Surfaces take the theme recipe's lightness; text and colour
 * roles are solved for WCAG contrast against the surfaces they sit on; the
 * four map layers read their lightness from a generated table that the
 * categorical solver writes (`npm run palette:tones`).
 */

export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

export const LAYERS = ['sky', 'kin', 'body', 'number'] as const
export type Layer = (typeof LAYERS)[number]

/** The mark's colours as the owner picked them (BRAND_MARK.md), stored as hex so the dark theme reproduces them exactly. */
interface Anchors {
  readonly frame: string
  readonly window: string
  readonly tile: string
}

/** A layer's hue: an anchor's, turned round the wheel. */
interface LayerHue {
  readonly anchor: 'frame' | 'window'
  readonly turn: number
}

interface Tint {
  readonly h: number
  readonly c: number
}

export interface PaletteSpec {
  readonly id: PaletteId
  readonly label: string
  readonly intent: string
  readonly anchors: Anchors
  /** The map layers: the anchors and their complements, a double-complementary rectangle. */
  readonly layers: Readonly<Record<Layer, LayerHue>>
  /** One chroma for all four layers, so no layer outweighs another. */
  readonly layerChroma: number
  /** Red, the convention for an error; the one hue outside the rectangle. */
  readonly danger: Tint
}

export const PALETTES: readonly PaletteSpec[] = Object.freeze([
  {
    id: 'lantern',
    label: PALETTE_LABELS.lantern,
    intent: 'The mark: a cyan frame and a gold window in a navy night',
    anchors: { frame: '#42e5e0', window: '#eeb318', tile: '#0b161f' },
    layers: {
      sky: { anchor: 'window', turn: 0 },
      number: { anchor: 'frame', turn: 0 },
      kin: { anchor: 'frame', turn: 180 },
      body: { anchor: 'window', turn: 180 },
    },
    layerChroma: 0.13,
    danger: { h: 28, c: 0.19 },
  },
])

type OnLayer = `on${Capitalize<Layer>}`
export const onLayer = (layer: Layer): OnLayer => `on${layer[0].toUpperCase()}${layer.slice(1)}` as OnLayer

export const ROLES = [
  'ground',
  'surface1',
  'surface2',
  'chip',
  'line',
  'art',
  'ink',
  'ink2',
  'ink3',
  'onInk',
  'accent',
  'accentSoft',
  'onAccent',
  'spark',
  'sparkMark',
  'action',
  'onAction',
  'actionGlow',
  'danger',
  'shadow',
  ...LAYERS,
  ...LAYERS.map(onLayer),
] as const
export type Role = (typeof ROLES)[number]

export interface Swatch {
  readonly oklch: Oklch
  readonly alpha: number
}

export type Resolved = Readonly<Record<Role, Swatch>>

/** Committed layer lightness per palette and theme, written by `npm run palette:tones`. */
export type PaletteTones = Readonly<Record<PaletteId, Readonly<Record<Theme, Readonly<Record<Layer, number>>>>>>

/** Contrast floors (WCAG 2.2: 4.5:1 body text, 7:1 enhanced, 3:1 a graphic that carries meaning or marks a control). */
export const FLOORS = Object.freeze({ ink2: 7, ink3: 4.5, colour: 4.5, mark: 3 })

interface Recipe {
  readonly towards: 0 | 1
  readonly surfaces: Readonly<Record<'ground' | 'surface1' | 'surface2' | 'chip' | 'line' | 'art', number>>
  readonly ink: number
  /** Where solved roles start; an absent accent starts at the frame's own lightness. */
  readonly preferred: Readonly<{ ink2: number; ink3: number; accent?: number; danger: number }>
  /** The categorical lightness band for the layers (the data-visualisation method). */
  readonly band: readonly [number, number]
  readonly shadow: Swatch['alpha']
  readonly shadowL: number
  /** Share of the tile's chroma the surfaces keep; light surfaces need less tint to read as tinted. */
  readonly neutralChroma: number
}

/** Lightness per theme. Surfaces are fixed steps; text and colour roles start here and move only as far as contrast needs. */
const RECIPES: Readonly<Record<Theme, Recipe>> = {
  dark: {
    towards: 1,
    surfaces: { ground: 0.155, surface1: 0.195, surface2: 0.235, chip: 0.275, line: 0.335, art: 0.125 },
    ink: 0.965,
    preferred: { ink2: 0.82, ink3: 0.68, danger: 0.72 },
    band: [0.48, 0.67],
    shadow: 0.55,
    shadowL: 0.05,
    neutralChroma: 1,
  },
  light: {
    towards: 0,
    surfaces: { ground: 0.972, surface1: 0.995, surface2: 0.945, chip: 0.925, line: 0.86, art: 0.93 },
    ink: 0.2,
    preferred: { ink2: 0.4, ink3: 0.5, accent: 0.45, danger: 0.56 },
    band: [0.43, 0.77],
    shadow: 0.18,
    shadowL: 0.3,
    neutralChroma: 0.35,
  },
}

const NEUTRAL_INK_CHROMA = 0.012
const SOFT_CHROMA = 0.55

const solid = (oklch: Oklch): Swatch => ({ oklch, alpha: 1 })

const anchorsOf = (spec: PaletteSpec) => ({
  frame: hexToOklch(spec.anchors.frame),
  window: hexToOklch(spec.anchors.window),
  tile: hexToOklch(spec.anchors.tile),
})

export const layerHue = (spec: PaletteSpec, layer: Layer): number => {
  const { anchor, turn } = spec.layers[layer]
  return (anchorsOf(spec)[anchor].h + turn) % 360
}

/** Every role but the layers: what the layers are solved against. */
function brandRoles(spec: PaletteSpec, theme: Theme) {
  const r = RECIPES[theme]
  const { frame, window, tile } = anchorsOf(spec)
  const neutral = (l: number, c = tile.c * r.neutralChroma): Oklch => ({ l, c, h: tile.h })
  const s = r.surfaces
  const surfaces = { ground: neutral(s.ground), surface1: neutral(s.surface1), surface2: neutral(s.surface2), chip: neutral(s.chip) }
  const backdrops = Object.values(surfaces)
  const ink = neutral(r.ink, NEUTRAL_INK_CHROMA)
  const solve = (color: Oklch, floor: number): Oklch => solveLightness(color, backdrops, floor, r.towards)
  const accent = solve({ ...frame, l: r.preferred.accent ?? frame.l }, FLOORS.colour)
  /** Night is the dark pole of the neutral ramp: the ground in the dark theme, ink in the light one. */
  const night = surfaces.ground.l < ink.l ? surfaces.ground : ink
  /** The action pill takes the spark where the spark reads against the page, otherwise night; its label and disc take the other. */
  const sparkLeads = contrast(window, surfaces.ground) >= FLOORS.mark
  return {
    surfaces,
    backdrops,
    ink,
    accent,
    accentSoft: solve({ ...frame, c: frame.c * SOFT_CHROMA, l: r.preferred.accent ?? frame.l }, FLOORS.colour),
    spark: window,
    sparkMark: solveLightness(window, [surfaces.surface1], FLOORS.mark, r.towards),
    action: sparkLeads ? window : night,
    onAction: sparkLeads ? night : window,
    actionGlow: { ...window, l: (window.l + 1) / 2 },
    danger: solve({ ...spec.danger, l: r.preferred.danger }, FLOORS.colour),
    ink2: solve({ h: tile.h, c: NEUTRAL_INK_CHROMA * 2, l: r.preferred.ink2 }, FLOORS.ink2),
    ink3: solve({ h: tile.h, c: NEUTRAL_INK_CHROMA * 3, l: r.preferred.ink3 }, FLOORS.ink3),
    line: neutral(s.line),
    art: neutral(s.art),
    shadow: neutral(r.shadowL),
  }
}

/** The layer set's problem for the categorical solver: the rectangle's hues, the theme's band, and every role it must clear. */
export function layerProblem(spec: PaletteSpec, theme: Theme): CategoricalProblem<Layer> {
  const base = brandRoles(spec, theme)
  return {
    slots: LAYERS.map((layer) => ({ key: layer, hue: layerHue(spec, layer) })),
    chroma: spec.layerChroma,
    band: RECIPES[theme].band,
    surfaces: base.backdrops,
    labels: [base.surfaces.ground, base.ink],
    roles: [base.accent, base.spark, base.danger],
  }
}

export function resolvePalette(spec: PaletteSpec, theme: Theme): Resolved {
  const r = RECIPES[theme]
  const base = brandRoles(spec, theme)
  const tones = PALETTE_TONES[spec.id]?.[theme]
  if (!tones) throw new Error(`No layer tones for ${spec.id} ${theme}: run npm run palette:tones`)
  const onAccent = theme === 'dark' ? base.surfaces.ground : base.surfaces.surface1
  /** The darkest or lightest surface, or ink, whichever reads on a colour. */
  const on = (colour: Oklch, floor: number): Oklch => (contrast(colour, onAccent) >= floor ? onAccent : base.ink)
  /** A label on a layer takes the ground or ink, whichever reads better; the solver guaranteed one reaches 4.5:1. */
  const label = (colour: Oklch): Oklch =>
    contrast(colour, base.surfaces.ground) >= contrast(colour, base.ink) ? base.surfaces.ground : base.ink
  const layers = LAYERS.map((layer) => [layer, { l: tones[layer], c: spec.layerChroma, h: layerHue(spec, layer) }] as const)
  return {
    ...(Object.fromEntries(Object.entries(base.surfaces).map(([k, v]) => [k, solid(v)])) as Record<keyof typeof base.surfaces, Swatch>),
    line: solid(base.line),
    art: solid(base.art),
    ink: solid(base.ink),
    ink2: solid(base.ink2),
    ink3: solid(base.ink3),
    onInk: solid(theme === 'dark' ? base.surfaces.ground : base.surfaces.surface1),
    accent: solid(base.accent),
    accentSoft: solid(base.accentSoft),
    onAccent: solid(on(base.accent, FLOORS.colour)),
    spark: solid(base.spark),
    sparkMark: solid(base.sparkMark),
    action: solid(base.action),
    onAction: solid(base.onAction),
    actionGlow: solid(base.actionGlow),
    danger: solid(base.danger),
    shadow: { oklch: base.shadow, alpha: r.shadow },
    ...(Object.fromEntries(layers.map(([layer, colour]) => [layer, solid(colour)])) as Record<Layer, Swatch>),
    ...(Object.fromEntries(layers.map(([layer, colour]) => [onLayer(layer), solid(label(colour))])) as Record<OnLayer, Swatch>),
  }
}

export { DEFAULT_PALETTE, PALETTE_IDS, isPaletteId, type PaletteId } from './palette-ids'

/* ---------- CSS ---------- */

/** Lab custom properties and the role each one reads. Existing names are kept so every component follows the palette. */
export const CSS_VARS: Readonly<Record<string, Role>> = Object.freeze({
  '--ground': 'ground',
  '--surface': 'surface1',
  '--surface-2': 'surface2',
  '--lab-page': 'ground',
  '--lab-surface': 'surface1',
  '--lab-chip': 'chip',
  '--lab-line': 'line',
  '--lab-art': 'art',
  '--lab-ink': 'ink',
  '--lab-text-2': 'ink2',
  '--lab-text-3': 'ink3',
  '--lab-muted': 'ink3',
  '--lab-on-ink': 'onInk',
  '--lab-bright': 'accent',
  '--lab-shadow': 'shadow',
  '--brand': 'accent',
  '--brand-soft': 'accentSoft',
  '--brand-bright': 'ink',
  '--on-accent': 'onAccent',
  '--focus': 'accent',
  '--action': 'action',
  '--on-action': 'onAction',
  '--action-glow': 'actionGlow',
  '--danger': 'danger',
  '--layer-sky': 'sky',
  '--layer-kin': 'kin',
  '--layer-body': 'body',
  '--layer-number': 'number',
  '--on-layer-sky': 'onSky',
  '--on-layer-kin': 'onKin',
  '--on-layer-body': 'onBody',
  '--on-layer-number': 'onNumber',
})

/** Increased contrast (BENTO_COLOR.md "Contrast modes"): the lower text tiers take ink and hairlines take the tertiary ink. */
export const CONTRAST_MORE: Readonly<Record<string, Role>> = Object.freeze({
  '--lab-text-2': 'ink',
  '--lab-text-3': 'ink',
  '--lab-muted': 'ink',
  '--lab-line': 'ink3',
})

/** Which layer colour each system reads, so a system and its map layer are one colour everywhere. */
export const SYSTEM_LAYER: Readonly<Record<SystemKey, Layer>> = Object.freeze({
  astrology: 'sky',
  dreamspell: 'kin',
  tzolkin: 'kin',
  humanDesign: 'body',
  gematria: 'number',
})

const kebab = (key: string): string => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const SYSTEM_VARS: readonly (readonly [string, string])[] = Object.entries(SYSTEM_LAYER).flatMap(([system, layer]) => [
  [`--sys-${kebab(system)}`, `var(--layer-${layer})`],
  [`--sys-${kebab(system)}-strong`, `var(--layer-${layer})`],
])

const colourOf = ({ oklch, alpha }: Swatch): string =>
  alpha >= 1 ? toHex(oklch) : `color-mix(in srgb, ${toHex(oklch)} ${Math.round(alpha * 100)}%, transparent)`

const block = (selector: string, decls: readonly (readonly [string, string])[]): string =>
  `${selector}{${decls.map(([k, v]) => `${k}:${v}`).join(';')}}`

export const paletteSelector = (roots: readonly string[], id: PaletteId, theme: Theme): string =>
  roots.map((root) => `${root}[data-palette="${id}"][data-theme="${theme}"]`).join(',')

/**
 * The stylesheet for every palette and theme on each of `roots` (an element
 * carrying `data-palette` and `data-theme`). sRGB only: the palette lives
 * where the mark does, and every gate is measured on exactly these values.
 */
export function paletteCss(roots: readonly string[]): string {
  const rules = PALETTES.flatMap((spec) =>
    THEMES.map((theme) => ({ selector: paletteSelector(roots, spec.id, theme), resolved: resolvePalette(spec, theme) })),
  )
  const decls = (vars: Readonly<Record<string, Role>>, resolved: Resolved) =>
    Object.entries(vars).map(([name, role]) => [name, colourOf(resolved[role])] as const)
  const base = rules.map(({ selector, resolved }) => block(selector, [...decls(CSS_VARS, resolved), ...SYSTEM_VARS]))
  const more = rules.map(({ selector, resolved }) => block(selector, decls(CONTRAST_MORE, resolved)))
  return `${base.join('')}@media (prefers-contrast:more){${more.join('')}}`
}

export const paletteSpec = (id: PaletteId): PaletteSpec => PALETTES.find((p) => p.id === id) ?? PALETTES[0]
