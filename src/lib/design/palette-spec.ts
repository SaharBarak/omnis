import { CATEGORICAL_GATES, type CategoricalProblem } from './categorical'
import { contrast, hexToOklch, mix, solveLightness, type Oklch } from './color'
import { PALETTE_LABELS, type Chapter, type PaletteId } from './palette-ids'

/**
 * The bento palette as data, and every role but the layers derived from it
 * (docs/redesign/BENTO_COLOR.md). A palette is authored as the mark's anchor
 * colours plus the few values listed under "Authored data"; surfaces take
 * the theme recipe's lightness, and text and colour roles are solved for
 * WCAG contrast against what they sit on. The layers are solved separately
 * (`layerProblem`, `npm run palette:tones`), so this module never reads the
 * generated table and the generator can always run.
 */

export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

/** The other theme: where an inverse section takes its palette. */
export const otherTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark')

/** The theme a chapter is resolved in (BENTO_COLOR.md "Inverse sections"). */
export const schemeOf = (theme: Theme, chapter: Chapter): Theme => (chapter === 'inverse' ? otherTheme(theme) : theme)

export const LAYERS = ['sky', 'kin', 'body', 'number'] as const
export type Layer = (typeof LAYERS)[number]

export type OnLayer = `on${Capitalize<Layer>}`
export const onLayer = (layer: Layer): OnLayer => `on${layer[0].toUpperCase()}${layer.slice(1)}` as OnLayer

/**
 * The source colours a tradition draws its categories in (BENTO_BOARDS.md
 * "Source colours"): four chromatic, solved per theme as a categorical set
 * (`tintProblem`), and the two neutral extremes, the light paper and the
 * night ground, told apart by form.
 */
export const SOURCE_HUES = ['red', 'yellow', 'green', 'blue'] as const
export type SourceHue = (typeof SOURCE_HUES)[number]
export const TINTS = [...SOURCE_HUES, 'white', 'black'] as const
export type TintKey = (typeof TINTS)[number]
const capital = <K extends string>(k: K): Capitalize<K> => `${k[0].toUpperCase()}${k.slice(1)}` as Capitalize<K>
export type TintRole = `tint${Capitalize<TintKey>}`
export type OnTintRole = `onTint${Capitalize<TintKey>}`
export const tintRole = (k: TintKey): TintRole => `tint${capital(k)}`
export const onTintRole = (k: TintKey): OnTintRole => `onTint${capital(k)}`

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
  /** One chroma for all four layers, so no layer outweighs another; the source colours take it too. */
  readonly layerChroma: number
  /** Each chromatic source colour as its named sRGB colour; its hue is that colour's in OKLCH. */
  readonly sourceColours: Readonly<Record<SourceHue, string>>
  /** Red, the convention for an error; the one hue outside the rectangle. */
  readonly danger: Tint
  /** Chroma of the three ink tiers, rising so the quieter tiers keep the tile's hue. */
  readonly inkChroma: readonly [number, number, number]
  /** Share of the frame's chroma the soft accent keeps. */
  readonly softShare: number
  /** The primary action's hover step toward its disc colour, and the strength of the light that follows the pointer. */
  readonly action: Readonly<{ hover: number; glow: number }>
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
    sourceColours: { red: '#ff0000', yellow: '#ffff00', green: '#008000', blue: '#0000ff' },
    danger: { h: 28, c: 0.19 },
    inkChroma: [0.012, 0.024, 0.036],
    softShare: 0.55,
    action: { hover: 0.12, glow: 0.45 },
  },
])

export const paletteSpec = (id: PaletteId): PaletteSpec => PALETTES.find((p) => p.id === id) ?? PALETTES[0]

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
  'actionHover',
  'actionGlow',
  'danger',
  'shadow',
  ...LAYERS,
  ...LAYERS.map(onLayer),
  ...TINTS.map(tintRole),
  ...TINTS.map(onTintRole),
] as const
export type Role = (typeof ROLES)[number]
export type BrandRole = Exclude<Role, Layer | OnLayer | TintRole | OnTintRole>

/** The surfaces text and marks sit on. */
export const TEXT_SURFACES = ['ground', 'surface1', 'surface2', 'chip'] as const satisfies readonly Role[]

export interface Swatch {
  readonly oklch: Oklch
  readonly alpha: number
}

export type Resolved = Readonly<Record<Role, Swatch>>

/** Committed layer and source-colour lightness per palette and theme, written by `npm run palette:tones`. */
export type PaletteTones = Readonly<Record<PaletteId, Readonly<Record<Theme, Readonly<Record<Layer | SourceHue, number>>>>>>

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

/** Every role but the layers, per theme: what the layers are solved against and what the page is built from. */
export function brandRoles(spec: PaletteSpec, theme: Theme): Readonly<Record<BrandRole, Swatch>> {
  const r = RECIPES[theme]
  const { frame, window, tile } = anchorsOf(spec)
  const [inkChroma, ink2Chroma, ink3Chroma] = spec.inkChroma
  const neutral = (l: number, c = tile.c * r.neutralChroma): Oklch => ({ l, c, h: tile.h })
  const s = r.surfaces
  const surfaces = { ground: neutral(s.ground), surface1: neutral(s.surface1), surface2: neutral(s.surface2), chip: neutral(s.chip) }
  const backdrops = Object.values(surfaces)
  const ink = neutral(r.ink, inkChroma)
  const solve = (color: Oklch, floor: number): Oklch => solveLightness(color, backdrops, floor, r.towards)
  /** The surface farthest from ink: what sits on ink, and on the accent where it reads. */
  const far = backdrops.reduce((a, b) => (contrast(b, ink) > contrast(a, ink) ? b : a))
  const accent = solve({ ...frame, l: r.preferred.accent ?? frame.l }, FLOORS.colour)
  /** Night is the dark pole of the neutral ramp: the ground in the dark theme, ink in the light one. */
  const night = surfaces.ground.l < ink.l ? surfaces.ground : ink
  /** The action pill takes the spark where the spark reads against the page, otherwise night; its label and disc take the other. */
  const sparkLeads = contrast(window, surfaces.ground) >= FLOORS.mark
  const action = sparkLeads ? window : night
  const onAction = sparkLeads ? night : window
  return {
    ground: solid(surfaces.ground),
    surface1: solid(surfaces.surface1),
    surface2: solid(surfaces.surface2),
    chip: solid(surfaces.chip),
    line: solid(neutral(s.line)),
    art: solid(neutral(s.art)),
    ink: solid(ink),
    ink2: solid(solve({ h: tile.h, c: ink2Chroma, l: r.preferred.ink2 }, FLOORS.ink2)),
    ink3: solid(solve({ h: tile.h, c: ink3Chroma, l: r.preferred.ink3 }, FLOORS.ink3)),
    onInk: solid(far),
    accent: solid(accent),
    accentSoft: solid(solve({ ...frame, c: frame.c * spec.softShare, l: r.preferred.accent ?? frame.l }, FLOORS.colour)),
    onAccent: solid(contrast(accent, far) >= FLOORS.colour ? far : ink),
    spark: solid(window),
    sparkMark: solid(solveLightness(window, [surfaces.surface1], FLOORS.mark, r.towards)),
    action: solid(action),
    onAction: solid(onAction),
    actionHover: solid(mix(action, onAction, spec.action.hover)),
    /** The light that follows the pointer: the brightest spark-hued light the label still reads on. */
    actionGlow: { oklch: solveLightness({ ...window, l: 1 }, [onAction], FLOORS.colour, 0), alpha: spec.action.glow },
    danger: solid(solve({ ...spec.danger, l: r.preferred.danger }, FLOORS.colour)),
    shadow: { oklch: neutral(r.shadowL), alpha: r.shadow },
  }
}

/** The layer set's problem for the categorical solver: the rectangle's hues, the theme's band, and every role it must clear. */
export function layerProblem(spec: PaletteSpec, theme: Theme): CategoricalProblem<Layer> {
  const base = brandRoles(spec, theme)
  const at = (role: BrandRole): Oklch => base[role].oklch
  return {
    slots: LAYERS.map((layer) => ({ key: layer, hue: layerHue(spec, layer) })),
    chroma: spec.layerChroma,
    band: RECIPES[theme].band,
    surfaces: TEXT_SURFACES.map(at),
    labels: [at('ground'), at('ink')],
    roles: [at('accent'), at('spark'), at('danger')],
  }
}

/** A chromatic source colour's hue: its named sRGB colour's, in OKLCH. */
export const sourceHue = (spec: PaletteSpec, hue: SourceHue): number => hexToOklch(spec.sourceColours[hue]).h

/**
 * The source colours' problem for the categorical solver (BENTO_COLOR.md
 * "Source colours"): their own hues, as saturated as the palette's signal
 * (danger's chroma), in the layers' band, on every text surface, each
 * carrying a legible label. Every pair stays as far apart as two colours
 * that share a page but not a meaning (the role gate) under full colour
 * vision; under colour-deficient vision the form that always travels with
 * a source colour (its glyph, its name) tells them apart, and the score
 * still ranks every set by that distance too. No brand role gate: a source
 * colour is drawn only as a board's cell ground, swatch or mark, a form no
 * brand role takes.
 */
export function tintProblem(spec: PaletteSpec, theme: Theme): CategoricalProblem<SourceHue> {
  const base = brandRoles(spec, theme)
  const at = (role: BrandRole): Oklch => base[role].oklch
  return {
    slots: SOURCE_HUES.map((hue) => ({ key: hue, hue: sourceHue(spec, hue) })),
    chroma: spec.danger.c,
    band: RECIPES[theme].band,
    surfaces: TEXT_SURFACES.map(at),
    labels: [at('ground'), at('ink')],
    roles: [],
    floors: { normal: CATEGORICAL_GATES.role, dichromat: 0 },
  }
}

