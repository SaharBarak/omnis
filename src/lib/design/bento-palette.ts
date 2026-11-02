import { contrast, solveLightness, toHex, toP3, type Oklch } from './color'
import { PALETTE_LABELS, srgbVar, type PaletteId } from './palette-ids'
import type { SystemKey } from './system-flavors'

/**
 * Bento palettes as data (docs/redesign/BENTO_MOTION.md "Palette"). A palette
 * is authored as hues and chroma only; every lightness comes from the theme
 * recipe below, and text and colour roles are solved for WCAG contrast
 * against the surfaces they sit on. sRGB and Display P3 values are both
 * gamut-mapped from the one OKLCH source.
 */

export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

export const LAYERS = ['sky', 'kin', 'body', 'number'] as const
export type Layer = (typeof LAYERS)[number]

interface Tint {
  readonly h: number
  readonly c: number
  /** Authored lightness intent per theme; the solver starts here instead of the recipe's default. */
  readonly l?: Partial<Record<Theme, number>>
}

export interface PaletteSpec {
  readonly id: PaletteId
  readonly label: string
  readonly intent: string
  readonly neutral: Tint
  readonly accent: Tint
  /** The one contrasting accent: a colour off the palette's mood, kept for the primary call to action. */
  readonly spark: Tint
  readonly danger: Tint
  readonly layers: Readonly<Record<Layer, Tint>>
}

export const PALETTES: readonly PaletteSpec[] = Object.freeze([
  {
    id: 'groundwater',
    label: PALETTE_LABELS.groundwater,
    intent: 'Survey map: dark water, a sounding line, warm finds',
    neutral: { h: 245, c: 0.024 },
    accent: { h: 192, c: 0.13 },
    spark: { h: 340, c: 0.2 },
    danger: { h: 18, c: 0.19 },
    layers: { sky: { h: 84, c: 0.16 }, kin: { h: 30, c: 0.17 }, body: { h: 278, c: 0.15 }, number: { h: 132, c: 0.19 } },
  },
  {
    id: 'brass',
    label: PALETTE_LABELS.brass,
    intent: 'Instrument and almanac: warm black, ivory, gold',
    neutral: { h: 70, c: 0.012 },
    accent: { h: 88, c: 0.035, l: { dark: 0.93, light: 0.3 } },
    spark: { h: 290, c: 0.2 },
    danger: { h: 22, c: 0.18 },
    layers: { sky: { h: 85, c: 0.15 }, kin: { h: 35, c: 0.18 }, body: { h: 165, c: 0.12 }, number: { h: 238, c: 0.11 } },
  },
  {
    id: 'aurora',
    label: PALETTE_LABELS.aurora,
    intent: 'Night sky, high energy',
    neutral: { h: 290, c: 0.03 },
    accent: { h: 118, c: 0.2 },
    spark: { h: 305, c: 0.2 },
    danger: { h: 22, c: 0.19 },
    layers: { sky: { h: 62, c: 0.17 }, kin: { h: 350, c: 0.17 }, body: { h: 260, c: 0.13 }, number: { h: 190, c: 0.13 } },
  },
])

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
  'onSpark',
  'danger',
  'shadow',
  ...LAYERS,
] as const
export type Role = (typeof ROLES)[number]

export interface Swatch {
  readonly oklch: Oklch
  readonly alpha: number
}

export type Resolved = Readonly<Record<Role, Swatch>>

/** Contrast floors (WCAG 2.2: 4.5:1 body text, 7:1 enhanced, 3:1 a graphic that marks a control). */
export const FLOORS = Object.freeze({ ink2: 7, ink3: 4.5, colour: 4.5, mark: 3 })

interface Recipe {
  readonly towards: 0 | 1
  readonly surfaces: Readonly<Record<'ground' | 'surface1' | 'surface2' | 'chip' | 'line' | 'art', number>>
  readonly ink: number
  readonly preferred: Readonly<Record<'ink2' | 'ink3' | 'accent' | 'spark' | 'layer' | 'danger', number>>
  readonly shadow: Swatch['alpha']
  readonly shadowL: number
  /** Share of the palette's neutral chroma the surfaces keep; light surfaces need less tint to read as tinted. */
  readonly neutralChroma: number
}

/** Lightness per theme. Surfaces are fixed steps; text and colour roles start here and move only as far as contrast needs. */
const RECIPES: Readonly<Record<Theme, Recipe>> = {
  dark: {
    towards: 1,
    surfaces: { ground: 0.155, surface1: 0.195, surface2: 0.235, chip: 0.275, line: 0.335, art: 0.125 },
    ink: 0.965,
    preferred: { ink2: 0.82, ink3: 0.68, accent: 0.84, spark: 0.62, layer: 0.8, danger: 0.72 },
    shadow: 0.55,
    shadowL: 0.05,
    neutralChroma: 1,
  },
  light: {
    towards: 0,
    surfaces: { ground: 0.972, surface1: 0.995, surface2: 0.945, chip: 0.925, line: 0.86, art: 0.93 },
    ink: 0.2,
    preferred: { ink2: 0.4, ink3: 0.5, accent: 0.52, spark: 0.62, layer: 0.58, danger: 0.52 },
    shadow: 0.18,
    shadowL: 0.3,
    neutralChroma: 0.35,
  },
}

const NEUTRAL_INK_CHROMA = 0.012
const SOFT_CHROMA = 0.55

const solid = (oklch: Oklch): Swatch => ({ oklch, alpha: 1 })

export function resolvePalette(spec: PaletteSpec, theme: Theme): Resolved {
  const r = RECIPES[theme]
  const neutral = (l: number, c = spec.neutral.c * r.neutralChroma): Oklch => ({ l, c, h: spec.neutral.h })
  const s = r.surfaces
  const surfaces = { ground: neutral(s.ground), surface1: neutral(s.surface1), surface2: neutral(s.surface2), chip: neutral(s.chip) }
  const textBackdrops = Object.values(surfaces)
  const ink = neutral(r.ink, NEUTRAL_INK_CHROMA)
  const solve = (tint: Tint, preferred: number, floor: number): Oklch =>
    solveLightness({ l: tint.l?.[theme] ?? preferred, c: tint.c, h: tint.h }, textBackdrops, floor, r.towards)
  const accent = solve(spec.accent, r.preferred.accent, FLOORS.colour)
  /** The spark is the signal disc on the ink-filled primary action, so it is solved against ink, not the page. */
  const spark = solveLightness({ l: spec.spark.l?.[theme] ?? r.preferred.spark, c: spec.spark.c, h: spec.spark.h }, [ink], FLOORS.mark, r.towards === 1 ? 0 : 1)
  const onAccent = theme === 'dark' ? surfaces.ground : surfaces.surface1
  /** The darkest or lightest surface, or ink, whichever reads on a colour. */
  const on = (colour: Oklch, floor: number): Swatch => solid(contrast(colour, onAccent) >= floor ? onAccent : ink)
  const layers = Object.fromEntries(LAYERS.map((layer) => [layer, solid(solve(spec.layers[layer], r.preferred.layer, FLOORS.colour))])) as Record<Layer, Swatch>
  return {
    ...(Object.fromEntries(Object.entries(surfaces).map(([k, v]) => [k, solid(v)])) as Record<keyof typeof surfaces, Swatch>),
    line: solid(neutral(s.line)),
    art: solid(neutral(s.art)),
    ink: solid(ink),
    ink2: solid(solve({ h: spec.neutral.h, c: NEUTRAL_INK_CHROMA * 2 }, r.preferred.ink2, FLOORS.ink2)),
    ink3: solid(solve({ h: spec.neutral.h, c: NEUTRAL_INK_CHROMA * 3 }, r.preferred.ink3, FLOORS.ink3)),
    onInk: solid(theme === 'dark' ? surfaces.ground : surfaces.surface1),
    accent: solid(accent),
    accentSoft: solid(solve({ ...spec.accent, c: spec.accent.c * SOFT_CHROMA }, r.preferred.accent, FLOORS.colour)),
    onAccent: on(accent, FLOORS.colour),
    spark: solid(spark),
    /** onSpark draws the disc's icon, a graphic. */
    onSpark: on(spark, FLOORS.mark),
    danger: solid(solve(spec.danger, r.preferred.danger, FLOORS.colour)),
    shadow: { oklch: neutral(r.shadowL), alpha: r.shadow },
    ...layers,
  }
}

export { DEFAULT_PALETTE, PALETTE_IDS, isPaletteId, srgbVar, type PaletteId } from './palette-ids'

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
  '--spark': 'spark',
  '--on-spark': 'onSpark',
  '--danger': 'danger',
  '--layer-sky': 'sky',
  '--layer-kin': 'kin',
  '--layer-body': 'body',
  '--layer-number': 'number',
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

const withAlpha = (base: string, alpha: number): string => (alpha >= 1 ? base : `color-mix(in srgb, ${base} ${Math.round(alpha * 100)}%, transparent)`)

const srgbOf = (swatch: Swatch): string => withAlpha(toHex(swatch.oklch), swatch.alpha)
const p3Of = (swatch: Swatch): string => withAlpha(toP3(swatch.oklch), swatch.alpha)

/** Roles whose colour sRGB cannot fully show; only these get a P3 value. */
const WIDE_ROLES: readonly Role[] = ['accent', 'accentSoft', 'spark', 'danger', ...LAYERS]

const block = (selector: string, decls: readonly (readonly [string, string])[]): string =>
  `${selector}{${decls.map(([k, v]) => `${k}:${v}`).join(';')}}`

export const paletteSelector = (roots: readonly string[], id: PaletteId, theme: Theme): string =>
  roots.map((root) => `${root}[data-palette="${id}"][data-theme="${theme}"]`).join(',')

/**
 * The stylesheet for every palette and theme on each of `roots` (an element
 * carrying `data-palette` and `data-theme`): complete sRGB rules, then
 * Display P3 overrides for wide roles on displays that show P3.
 */
export function paletteCss(roots: readonly string[]): string {
  const pairs = PALETTES.flatMap((spec) => THEMES.map((theme) => ({ spec, theme, resolved: resolvePalette(spec, theme) })))
  const base = pairs.map(({ spec, theme, resolved }) =>
    block(paletteSelector(roots, spec.id, theme), [
      ...Object.entries(CSS_VARS).flatMap(([name, role]) => [
        [name, srgbOf(resolved[role])] as const,
        [srgbVar(name), srgbOf(resolved[role])] as const,
      ]),
      ...SYSTEM_VARS,
    ]),
  )
  const wide = pairs.map(({ spec, theme, resolved }) =>
    block(
      paletteSelector(roots, spec.id, theme),
      Object.entries(CSS_VARS)
        .filter(([, role]) => WIDE_ROLES.includes(role))
        .map(([name, role]) => [name, p3Of(resolved[role])] as const),
    ),
  )
  return `${base.join('')}@media (color-gamut:p3){@supports (color:color(display-p3 0 0 0)){${wide.join('')}}}`
}

export const paletteSpec = (id: PaletteId): PaletteSpec => PALETTES.find((p) => p.id === id) ?? PALETTES[0]
