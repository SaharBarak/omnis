import { contrast, hexToOklch, toHex, type Oklch } from './color'
import { apart, apartDichromat, seen, type Seen } from './color-vision'

/**
 * The gates a categorical colour set must clear (BENTO_COLOR.md "Layers"),
 * from the data-visualisation method and WCAG. Distances are ΔE OK on the
 * 0..1 scale; the method states them ×100 (15 and 8).
 */
export const CATEGORICAL_GATES = Object.freeze({
  /** Lightness grid the search walks, from the band's floor. */
  step: 0.02,
  /** Below this chroma a hue reads as grey. */
  chroma: 0.1,
  /** Against every surface the colour sits on (WCAG 1.4.11). */
  mark: 3,
  /** A label on the colour, in the better of the given label colours (WCAG 1.4.3). */
  label: 4.5,
  /** Every pair, full colour vision. */
  normal: 0.15,
  /** Every pair, under protan, deutan and tritan simulation. */
  dichromat: 0.08,
  /**
   * Each colour against the roles that share its page but not its meaning,
   * full colour vision. For colour-deficient vision those pairs are told apart
   * by form (BENTO_COLOR.md "Roles"), as WCAG 1.4.1 asks.
   */
  role: 0.12,
})

export interface CategoricalProblem<K extends string> {
  readonly slots: readonly { readonly key: K; readonly hue: number }[]
  readonly chroma: number
  /** Lightness band, inclusive. */
  readonly band: readonly [number, number]
  /** Surfaces every colour sits on. */
  readonly surfaces: readonly Oklch[]
  /** Colours a label on the set may take. */
  readonly labels: readonly Oklch[]
  /** Roles every colour must stay apart from. */
  readonly roles: readonly Oklch[]
}

interface Candidate {
  readonly l: number
  readonly seen: Seen
}

/** The colour exactly as the stylesheet emits it: an sRGB hex, read back. */
export const emitted = (color: Oklch): Oklch => hexToOklch(toHex(color))

const grid = ([lo, hi]: readonly [number, number], step: number): readonly number[] =>
  Array.from({ length: Math.floor((hi - lo) / step + 1e-9) + 1 }, (_, i) => Number((lo + i * step).toFixed(4)))

const legible = (color: Oklch, labels: readonly Oklch[]): number => Math.max(...labels.map((label) => contrast(color, label)))

function candidates<K extends string>(problem: CategoricalProblem<K>, hue: number): readonly Candidate[] {
  const g = CATEGORICAL_GATES
  const roles = problem.roles.map(seen)
  return grid(problem.band, g.step).flatMap((l) => {
    const color = emitted({ l, c: problem.chroma, h: hue })
    const view = seen(color)
    const passes =
      color.l >= problem.band[0] &&
      color.l <= problem.band[1] &&
      color.c >= g.chroma &&
      problem.surfaces.every((surface) => contrast(color, surface) >= g.mark) &&
      legible(color, problem.labels) >= g.label &&
      roles.every((role) => apart(view, role, 'normal') >= g.role)
    return passes ? [{ l, seen: view }] : []
  })
}

interface Best {
  readonly score: number
  readonly picks: readonly Candidate[]
}

/**
 * Snap every slot to a lightness on the grid so the whole set clears the
 * gates, and keep the set that clears them by the widest margin with the
 * least spread in lightness:
 *
 *   score = min(normal ÷ 0.15, dichromat ÷ 0.08) − (max L − min L)
 *
 * The walk is slot by slot in the given order, lightness ascending; a tie
 * keeps the set met first, so the result is deterministic. Throws when no
 * set passes, so a change that breaks the gates fails generation.
 */
export function solveCategorical<K extends string>(problem: CategoricalProblem<K>): Readonly<Record<K, number>> {
  const g = CATEGORICAL_GATES
  const pools = problem.slots.map(({ hue }) => candidates(problem, hue))
  let best: Best | undefined

  const walk = (picks: readonly Candidate[], normal: number, dichromat: number): void => {
    if (picks.length === pools.length) {
      const ls = picks.map((pick) => pick.l)
      const score = Math.min(normal / g.normal, dichromat / g.dichromat) - (Math.max(...ls) - Math.min(...ls))
      if (!best || score > best.score) best = { score, picks }
      return
    }
    for (const next of pools[picks.length]) {
      let n = normal
      let d = dichromat
      for (const pick of picks) {
        n = Math.min(n, apart(pick.seen, next.seen, 'normal'))
        d = Math.min(d, apartDichromat(pick.seen, next.seen))
      }
      if (n >= g.normal && d >= g.dichromat) walk([...picks, next], n, d)
    }
  }
  walk([], Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)

  if (!best) {
    const keys = problem.slots.map((slot) => slot.key).join(', ')
    throw new Error(`No lightness set for ${keys} clears the categorical gates (BENTO_COLOR.md "Layers")`)
  }
  const { picks } = best
  return Object.freeze(Object.fromEntries(problem.slots.map((slot, i) => [slot.key, picks[i].l]))) as Readonly<Record<K, number>>
}
