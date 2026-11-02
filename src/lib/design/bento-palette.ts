import { contrast, toHex, type Oklch } from './color'
import { LAYERS, PALETTES, THEMES, brandRoles, layerHue, onLayer, type Layer, type OnLayer, type Resolved, type Role, type Swatch, type Theme, type PaletteSpec } from './palette-spec'
import type { PaletteId } from './palette-ids'
import { PALETTE_TONES } from './palette-tones.gen'
import type { SystemKey } from './system-flavors'

/**
 * The resolved bento palette and its stylesheet (docs/redesign/BENTO_COLOR.md).
 * Every role but the layers comes from palette-spec.ts; the layers read their
 * lightness from the table the categorical solver writes (`npm run palette:tones`).
 */

export function resolvePalette(spec: PaletteSpec, theme: Theme): Resolved {
  const base = brandRoles(spec, theme)
  const tones = PALETTE_TONES[spec.id]?.[theme]
  if (!tones) throw new Error(`No layer tones for ${spec.id} ${theme}: run npm run palette:tones`)
  const ground = base.ground.oklch
  const ink = base.ink.oklch
  /** A label on a layer takes the ground or ink, whichever reads better; the solver guaranteed one reaches 4.5:1. */
  const label = (colour: Oklch): Oklch => (contrast(colour, ground) >= contrast(colour, ink) ? ground : ink)
  const layers = LAYERS.map((layer) => [layer, { l: tones[layer], c: spec.layerChroma, h: layerHue(spec, layer) }] as const)
  const solid = (oklch: Oklch): Swatch => ({ oklch, alpha: 1 })
  return {
    ...base,
    ...(Object.fromEntries(layers.map(([layer, colour]) => [layer, solid(colour)])) as Record<Layer, Swatch>),
    ...(Object.fromEntries(layers.map(([layer, colour]) => [onLayer(layer), solid(label(colour))])) as Record<OnLayer, Swatch>),
  }
}

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
  '--action-hover': 'actionHover',
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

/** An opaque role is a six-digit hex; a translucent one carries its alpha as the eighth and ninth digits. */
const colourOf = ({ oklch, alpha }: Swatch): string =>
  alpha >= 1 ? toHex(oklch) : `${toHex(oklch)}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`

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

