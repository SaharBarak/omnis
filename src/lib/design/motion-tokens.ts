/**
 * Motion tokens (docs/redesign/BENTO_MOTION.md "Tokens"). Pure data:
 * milliseconds and Bézier tuples, held once. Each engine's wrapper converts
 * them where it imports that engine; this module imports none.
 */

export type Curve = readonly [number, number, number, number]

export const DURATION = Object.freeze({
  none: 0,
  /** Press feedback. */
  press: 120,
  /** Hover, toggles, small state changes. */
  quick: 220,
  /** An icon turning in place, e.g. the primary action's arrow. */
  turn: 350,
  /** A component arriving; exits use `quick`. */
  settle: 480,
  /** A ring or line drawing itself. */
  draw: 1200,
  /** A sequence resting on one beat before the next, e.g. a lifted layer. */
  hold: 800,
})

export const CURVE = Object.freeze({
  standard: [0.2, 0, 0, 1] as Curve,
  emphasized: [0.05, 0.7, 0.1, 1] as Curve,
})

/** Anything pressable scales to this while pressed: tactile, never below 0.95. */
export const PRESS_SCALE = 0.97

/**
 * A pointer-following control: it leans toward the pointer by `pull` of the
 * pointer's offset from its centre, never further than `reach` px.
 */
export const MAGNET = Object.freeze({ pull: 0.18, reach: 6 })

/** How far a small surface moves as it appears or leaves, in px: a card over a drawing. */
export const TRAVEL = 4

/** Motion's spring for responses; specific to Motion, not mirrored in the other engines. */
export const SPRING = Object.freeze({ type: 'spring' as const, stiffness: 260, damping: 30, mass: 1 })

export const STAGGER = Object.freeze({
  /** Delay between siblings in a set. */
  step: 40,
  /** The whole set starts within this, however many siblings it has. */
  cap: 600,
})

/** Per-sibling delay for a set of `count`, so long sets compress instead of trailing. */
export const staggerStep = (count: number): number => (count <= 1 ? 0 : Math.min(STAGGER.step, STAGGER.cap / (count - 1)))

export const seconds = (ms: number): number => ms / 1000

export const cssCurve = (curve: Curve): string => `cubic-bezier(${curve.join(', ')})`

/** Shortest signed turn from one angle to another, in degrees (−180, 180]. */
export const shortestTurn = (from: number, to: number): number => {
  const d = (((to - from) % 360) + 540) % 360 - 180
  return d === -180 ? 180 : d
}

/** The tokens as CSS custom properties, for CSS transitions and first-paint keyframes. */
export const motionCssVars = (): Readonly<Record<string, string>> => ({
  ...Object.fromEntries(Object.entries(DURATION).map(([k, v]) => [`--dur-${k}`, `${v}ms`])),
  ...Object.fromEntries(Object.entries(CURVE).map(([k, v]) => [`--ease-${k}`, cssCurve(v)])),
  '--stagger': `${STAGGER.step}ms`,
  '--press-scale': String(PRESS_SCALE),
  '--travel': `${TRAVEL}px`,
})
