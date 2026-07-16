/**
 * Material 3 design system for Pleiad mobile.
 *
 * The colour roles live in m3-colors.ts (generated from the brand seed). This
 * file is everything else the M3 spec asks for: the type scale, the shape
 * scale, elevation-as-surface-tint, state layers, and the motion system.
 *
 * Two M3 conventions the rest of the app depends on:
 *
 *   Elevation is colour, not shadow. In an M3 dark scheme a raised surface is
 *   the same surface with `surfaceTint` mixed in at a level-specific opacity —
 *   that is why `surfaceAt()` exists and why almost nothing here casts a real
 *   shadow. Shadows are reserved for the components M3 says actually float.
 *
 *   Interaction is a state layer. A pressed component does not change its
 *   fill; it wears a translucent scrim of its own content colour on top. See
 *   `stateLayer()` and the StateLayer component.
 *
 * Typography follows M3's brand/plain split: Space Grotesk carries display and
 * headline (the brand typeface slot), Barlow carries title, body, and label
 * (the plain slot), and IBM Plex Mono carries the `data` roles — a documented
 * extension for tabular figures, since kin numbers and gate numbers must not
 * shift width between frames.
 */

import { useColorScheme } from 'react-native'

import { DARK_COLORS, LIGHT_COLORS, type M3ColorScheme } from './m3-colors'

export type { M3ColorRole, M3ColorScheme } from './m3-colors'
export { SEED_COLOR } from './m3-colors'

// ---------------------------------------------------------------------------
// Typography — the M3 type scale, in the app's brand + plain typefaces.
// ---------------------------------------------------------------------------

export const FONTS = {
  /** Brand typeface — display and headline only. Space Grotesk has no italic. */
  brand: 'SpaceGrotesk_600SemiBold',
  brandMedium: 'SpaceGrotesk_500Medium',
  /** Plain typeface — title, body, label. */
  plain: 'Barlow_400Regular',
  plainMedium: 'Barlow_500Medium',
  plainSemi: 'Barlow_600SemiBold',
  /** Data typeface — tabular figures. Never used for prose. */
  data: 'IBMPlexMono_400Regular',
  dataMedium: 'IBMPlexMono_500Medium',
} as const

interface TypeStyle {
  fontFamily: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  fontVariant?: Array<'tabular-nums'>
  textTransform?: 'uppercase'
}

/**
 * The fifteen M3 type roles, plus three `data*` roles for numerals.
 * Sizes and tracking are the M3 spec's; the faces are ours.
 */
export const TYPE = {
  displayLarge: { fontFamily: FONTS.brand, fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  displayMedium: { fontFamily: FONTS.brand, fontSize: 45, lineHeight: 52, letterSpacing: 0 },
  displaySmall: { fontFamily: FONTS.brand, fontSize: 36, lineHeight: 44, letterSpacing: 0 },

  headlineLarge: { fontFamily: FONTS.brand, fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium: { fontFamily: FONTS.brand, fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall: { fontFamily: FONTS.brand, fontSize: 24, lineHeight: 32, letterSpacing: 0 },

  titleLarge: { fontFamily: FONTS.brandMedium, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium: { fontFamily: FONTS.plainSemi, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall: { fontFamily: FONTS.plainMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },

  bodyLarge: { fontFamily: FONTS.plain, fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium: { fontFamily: FONTS.plain, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontFamily: FONTS.plain, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },

  labelLarge: { fontFamily: FONTS.plainMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontFamily: FONTS.plainMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontFamily: FONTS.plainMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },

  /** Extension roles — tabular numerals. Kin, gates, scores, dates. */
  dataLarge: {
    fontFamily: FONTS.dataMedium,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  dataMedium: {
    fontFamily: FONTS.dataMedium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  dataSmall: {
    fontFamily: FONTS.data,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
} as const satisfies Record<string, TypeStyle>

export type TypeRole = keyof typeof TYPE

// ---------------------------------------------------------------------------
// Shape — the M3 shape scale.
// ---------------------------------------------------------------------------

export const SHAPE = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
} as const

// ---------------------------------------------------------------------------
// Spacing — M3's 4dp grid.
// ---------------------------------------------------------------------------

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  /** Screen side margin. M3 compact window class. */
  margin: 16,
} as const

/** M3 accessibility floor. Every interactive element clears this. */
export const TOUCH_TARGET = 48

// ---------------------------------------------------------------------------
// Elevation — in M3, a raised surface is a *tinted* surface, not a shadowed one.
// ---------------------------------------------------------------------------

/** Surface-tint opacity per elevation level (M3 dark + light both use these). */
const TINT_OPACITY = [0, 0.05, 0.08, 0.11, 0.12, 0.14] as const

export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5

/**
 * The few components M3 lets cast a real shadow: FAB, menu, snackbar, and the
 * nav bar when content scrolls under it. Everything else uses tint alone.
 */
export const SHADOW = {
  level0: {},
  level1: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  level2: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  level3: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  level4: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  level5: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
} as const satisfies Record<`level${ElevationLevel}`, object>

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '')
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const pair = (n: number) => clamp(n).toString(16).padStart(2, '0')
  return `#${pair(r)}${pair(g)}${pair(b)}`
}

/** Composite `over` onto `base` at `alpha`. Opaque result — no alpha channel. */
export function blend(base: string, over: string, alpha: number): string {
  const a = parseHex(base)
  const b = parseHex(over)
  return toHex({
    r: a.r + (b.r - a.r) * alpha,
    g: a.g + (b.g - a.g) * alpha,
    b: a.b + (b.b - a.b) * alpha,
  })
}

/** Add an alpha channel to an opaque hex. For state layers and scrims. */
export function alpha(hex: string, value: number): string {
  const { r, g, b } = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${value})`
}

// ---------------------------------------------------------------------------
// State layers — M3 interaction feedback. A translucent veil of the content
// colour, laid over the component. The fill underneath never changes.
// ---------------------------------------------------------------------------

export const STATE_LAYER_OPACITY = {
  hover: 0.08,
  focus: 0.1,
  pressed: 0.1,
  dragged: 0.16,
  /** Disabled containers dim to 12%, disabled content to 38%. */
  disabledContainer: 0.12,
  disabledContent: 0.38,
} as const

export type StateLayerState = keyof typeof STATE_LAYER_OPACITY

/** The colour to paint over a component in a given interaction state. */
export function stateLayer(contentColor: string, state: StateLayerState): string {
  return alpha(contentColor, STATE_LAYER_OPACITY[state])
}

// ---------------------------------------------------------------------------
// Motion — M3's easing set and duration scale.
// ---------------------------------------------------------------------------

/**
 * M3 easing curves as cubic-bezier control points, for Reanimated's `Easing.bezier`.
 * `emphasized` is the default for anything the user initiated; `standard` is for
 * small, incidental changes.
 */
export const EASING = {
  emphasized: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  standard: [0.2, 0, 0, 1],
  standardDecelerate: [0, 0, 0, 1],
  standardAccelerate: [0.3, 0, 1, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

/** M3 duration tokens, in ms. Pick by how far the thing travels, not by feel. */
export const DURATION = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
} as const

/** M3 Expressive spatial springs. Reanimated `withSpring` configs. */
export const SPRING = {
  /** Default for anything that moves through space. Settles, never bounces. */
  spatial: { damping: 26, stiffness: 380, mass: 1 },
  /** Snappier — for indicators and selection that must feel immediate. */
  spatialFast: { damping: 26, stiffness: 700, mass: 1 },
  /** Effects (opacity, colour) — critically damped, no overshoot at all. */
  effects: { damping: 40, stiffness: 500, mass: 1 },
} as const

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface M3Theme {
  readonly dark: boolean
  readonly colors: M3ColorScheme
  /**
   * The colour of a surface at an elevation level — `surfaceTint` composited
   * over `surface` at the level's opacity. This is what "raised" means in M3.
   */
  readonly surfaceAt: (level: ElevationLevel) => string
}

function buildTheme(colors: M3ColorScheme, dark: boolean): M3Theme {
  // Precomputed: six blends per theme, resolved once, not on every render.
  const surfaces = TINT_OPACITY.map((opacity) =>
    blend(colors.surface, colors.surfaceTint, opacity)
  )
  return {
    dark,
    colors,
    surfaceAt: (level) => surfaces[level] ?? colors.surface,
  }
}

export const DARK_THEME = buildTheme(DARK_COLORS, true)
export const LIGHT_THEME = buildTheme(LIGHT_COLORS, false)

/**
 * The app's theme.
 *
 * Dark is the default and the fallback: this product is a night sky, and an
 * unset system preference should land there rather than on white. Light is a
 * complete, spec-correct scheme for the users whose phones ask for it.
 */
export function useTheme(): M3Theme {
  return useColorScheme() === 'light' ? LIGHT_THEME : DARK_THEME
}
