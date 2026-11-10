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
      eyebrow: 'micro',
      pin: 'micro',
      lead: 'lead',
      note: 'micro',
      figure: 'figure',
      value: 'small',
      /** A number standing as a support's mark: a word of its value's line, at its own weight. */
      numeral: 'small',
      label: 'micro',
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
  /** A calendar's board: its mast, set as the kin tile sets a kin, and what comes next and its facts (BENTO_TYPE.md, "The board"). */
  board: voice({
    sheet: 'src/components/bento-v2/day-board.module.css',
    levels: {
      /** The calendar's name in capitals, and its own script beside it. */
      name: 'caption',
      /** The day's number in the calendar, a figure as the digest's is: set beside the title, never read as a line of it. */
      numeral: 'display',
      /** The value's name beside the numeral, as the kin tile sets a kin's. */
      title: 'figure',
      /** The line under the title, each word led by its glyph; what the tradition reads into the value. */
      words: 'small',
      /** A part's name in capitals: the calendar's view, Next, Facts. */
      part: 'caption',
      /** The view's caption, what comes next and when, the facts. */
      text: 'caption',
    },
    pairs: [
      ['title', 'words'],
      ['name', 'title'],
      ['part', 'text'],
    ],
  }),
  /** A board's calendar: its cells, their notes and heads, the readout and the legend (BENTO_TYPE.md, "The board"). */
  calendar: voice({
    sheet: 'src/components/bento-v2/board-calendar.module.css',
    levels: {
      /** A cell's numeral and its mark's line. */
      cell: 'small',
      /** A cell's civil date or name under its numeral. */
      note: 'micro',
      /** The weekdays over the columns, a section's name. */
      head: 'micro',
      /** The words of the cell under the pointer or focus. */
      readout: 'small',
      /** What each mark and band means. */
      legend: 'micro',
    },
    pairs: [
      ['cell', 'note'],
      ['readout', 'legend'],
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
