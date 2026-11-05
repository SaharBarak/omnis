/**
 * Voices (docs/redesign/BENTO_TYPE.md, "Voices"). A component's voice is its
 * text levels, each a role on the scale, and the pairs of levels a reader
 * compares. The table is the one place a component's levels meet the scale:
 * the component's root carries `voiceCssVars`, its CSS module reads only
 * `--voice-<level>`, and the tests hold every pair to the contrast rule.
 */

import { LEVEL_CONTRAST, TYPE_STEPS, sizeAt, stepSize, type TypeRole } from './type-scale'

export interface TypeVoice<Level extends string = string> {
  /** The CSS module that sets the component's text, from the repository root. */
  readonly sheet: string
  /** What each text is to the component, and the role it takes. */
  readonly levels: Readonly<Record<Level, TypeRole>>
  /** Levels a reader compares: each pair shares a size or clears the contrast rule. */
  readonly pairs: readonly (readonly [NoInfer<Level>, NoInfer<Level>])[]
}

const voice = <Level extends string>(v: TypeVoice<Level>): TypeVoice<Level> => Object.freeze(v)

export const TYPE_VOICES = Object.freeze({
  /** The atlas digest's tiles (BENTO_TYPE.md, "The digest"). */
  digest: voice({
    sheet: 'src/components/bento-lab/atlas/digest.module.css',
    levels: {
      eyebrow: 'caption',
      pin: 'micro',
      lead: 'heading',
      note: 'caption',
      figure: 'figure',
      value: 'body',
      /** A number standing as a support's mark: a word of its value's line, at its own weight. */
      numeral: 'body',
      label: 'caption',
    },
    pairs: [
      ['lead', 'note'],
      ['lead', 'value'],
      ['value', 'label'],
      ['eyebrow', 'lead'],
      ['note', 'value'],
    ],
  }),
  /** The card a mark or a fact opens (BENTO_TYPE.md, "The card"). */
  card: voice({
    sheet: 'src/components/bento-lab/atlas/card-body.module.css',
    levels: {
      eyebrow: 'caption',
      label: 'caption',
      value: 'body',
      meaning: 'caption',
      facts: 'caption',
    },
    pairs: [
      ['eyebrow', 'value'],
      ['label', 'value'],
      ['value', 'meaning'],
    ],
  }),
})

export type VoiceId = keyof typeof TYPE_VOICES

/** The larger of two roles' sizes over the smaller, on a window `width` px wide. */
export function ratioAt(a: TypeRole, b: TypeRole, width: number): number {
  const [x, y] = [a, b].map((role) => sizeAt(stepSize(TYPE_STEPS[role]), width)) as [number, number]
  return Math.max(x, y) / Math.min(x, y)
}

/**
 * The scale rounds each size to a hundredth of a pixel, which can leave an
 * exact ratio a hair under itself (title over figure at 1320 px is 1.24993).
 * A hundredth of a pixel on the smallest size is the most that rounding moves
 * a ratio; no real step is that small.
 */
const EPSILON = 0.01 / 11

/** Whether two roles may read against each other on a window `width` px wide: one size, or the contrast apart. */
export const holdsContrast = (a: TypeRole, b: TypeRole, width: number): boolean => a === b || ratioAt(a, b, width) >= LEVEL_CONTRAST - EPSILON

/** Every pair of a voice that fails the contrast rule at one of `widths`, as `upper/lower at width`. */
export const contrastFaults = (v: TypeVoice, widths: readonly number[]): readonly string[] =>
  v.pairs.flatMap(([a, b]) =>
    widths.filter((width) => !holdsContrast(v.levels[a]!, v.levels[b]!, width)).map((width) => `${a}/${b} at ${width}px: ${ratioAt(v.levels[a]!, v.levels[b]!, width).toFixed(3)}`),
  )

/**
 * The custom properties a voiced component's root carries: each level's
 * role's size, leading and tracking. The leading is the role's own, for
 * running text; a short UI line takes `--type-ui-lh` instead.
 */
export const voiceCssVars = (v: TypeVoice): Readonly<Record<string, string>> =>
  Object.fromEntries(
    Object.entries(v.levels).flatMap(([level, role]) => [
      [`--voice-${level}`, `var(--type-${role})`],
      [`--voice-${level}-lh`, `var(--type-${role}-lh)`],
      [`--voice-${level}-ls`, `var(--type-${role}-ls)`],
    ]),
  )
