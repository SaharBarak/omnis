/**
 * Type scale (docs/redesign/BENTO_TYPE.md). Pure data and arithmetic, the
 * twin of motion-tokens.ts: every font size in the lab is a role on one
 * modular scale, emitted once as custom properties on the lab root.
 *
 * Utopia's method with two ratios: the scale steps up from the body at a
 * dense ratio on a phone and an open one on a wide window, rising linearly
 * between the two widths. Steps below the body stay at the dense ratio at
 * every width, so small text never shrinks as the window grows. The wide
 * end is the page's own widest box, so a size stops growing where the
 * columns it sits in do.
 */

import { PAGE } from './layout-tokens'

const round = (value: number, places = 4): number => Number(value.toFixed(places))

export const TYPE_SCALE = Object.freeze({
  /** The body, in px: the scale's step 0, and every browser's default rem. */
  base: 16,
  /** Window widths, in px, between which a heading's size rises: a small phone, and the page at its widest. */
  narrow: { width: 360, ratio: 1.125 },
  wide: { width: PAGE.max, ratio: 1.25 },
  /**
   * Leading and tracking. Running text (the lead and everything below it)
   * keeps prose leading. Headings take the leading that falls along the
   * reciprocal of their size from the first heading to the display, and
   * every role takes its tracking along the reciprocal from the body to the
   * display, so larger type sets tighter, smaller type sets looser, and no
   * role keeps a setting tuned for another size. The ends are set at the
   * wide end's sizes; the reciprocal is linear in size once multiplied
   * out, so CSS applies it exactly at whatever size a fluid role resolves.
   */
  set: {
    text: { leading: 1.5 },
    heading: { leading: 1.25 },
    display: { leading: 1.02 },
    tracking: { body: 0, display: -0.028 },
  },
  /** Small type stops loosening here; past it, extra tracking reads as gaps. */
  loosest: { tracking: 0.01 },
})

/** A face's metrics, in em. */
export interface Face {
  /** The cap height, from the OS/2 table's `sCapHeight`. */
  readonly capHeight: number
  /** The line metrics a browser lays a line out by. */
  readonly ascent: number
  readonly descent: number
  /** Set widths of the glyphs something is sized from, at the weight they are set in. */
  readonly advances: Readonly<Record<string, number>>
}

/**
 * Each face's metrics: Barlow (text) and Space Grotesk (display). The cap,
 * ascent and descent come from the fonts' OS/2 and hhea tables, as Next's
 * capsize metrics record them (`next/dist/server/capsize-font-metrics.json`;
 * a test holds them equal). The P's advance is the display face's at weight
 * 500, measured from the font; the e2e lockup check measures it again in the
 * live font. The brand lockup sets its mark in cap heights, as wide as the
 * name's initial sets; a trimmed line is one cap height tall.
 */
export const FACES: Readonly<Record<'text' | 'display', Face>> = Object.freeze({
  text: Object.freeze({ capHeight: 0.7, ascent: 1, descent: 0.2, advances: Object.freeze({}) }),
  display: Object.freeze({ capHeight: 0.7, ascent: 0.984, descent: 0.292, advances: Object.freeze({ P: 0.6026 }) }),
})

/** How far the middle of a face's capitals sits below the middle of its untrimmed line, in em. */
export const capOffset = (face: Face): number => (face.ascent - face.descent - face.capHeight) / 2

/** The display face's metrics; where a browser lacks the `cap` unit, its ratio stands in. */
export const DISPLAY_FACE = FACES.display

/**
 * Trimmed lines (BENTO_TYPE.md, "Trimmed lines"). A line trimmed to its cap
 * height and baseline is `cap` em tall; the lines of one fact stand apart by
 * the room the upper line's em box leaves below its capitals, `room` em of
 * that line; the parts of a component stand apart by `group` pairs of the
 * body, which proximity reads as a new group.
 */
export const TRIM = Object.freeze({
  cap: FACES.text.capHeight,
  room: round(1 - FACES.text.capHeight, 3),
  group: 2,
})

/** The space between a component's parts, and its inset, in px: `group` pairs of the body. */
export const groupPx = (scale = TYPE_SCALE): number => round(TRIM.group * TRIM.room * scale.base, 2)

/**
 * Levels that read against each other share a size or differ by at least
 * the open end's ratio, the step a reader sees as a new level at every width
 * (BENTO_TYPE.md, "Contrast"). One dense step (1.125) reads as an accident.
 */
export const LEVEL_CONTRAST = TYPE_SCALE.wide.ratio

/** Each role's place on the scale. Steps at or below `lead` are running text. */
export const TYPE_STEPS = Object.freeze({
  /** Numbers set as graphics: a feature tile's number, a system page's big number. The ceiling. */
  poster: 7,
  display: 5,
  title: 4,
  figure: 3,
  heading: 2,
  lead: 1,
  body: 0,
  small: -1,
  caption: -2,
  micro: -3,
})

export type TypeRole = keyof typeof TYPE_STEPS

/** A size as CSS writes it: fixed, or fluid between the scale's two widths. */
export type TypeSize =
  | { readonly kind: 'fixed'; readonly px: number }
  | { readonly kind: 'fluid'; readonly min: number; readonly max: number; readonly rem: number; readonly vw: number }

/** The size of a step: fluid above the body, fixed at the dense ratio at and below it. */
export function stepSize(step: number, scale = TYPE_SCALE): TypeSize {
  const min = scale.base * scale.narrow.ratio ** step
  if (step <= 0) return { kind: 'fixed', px: round(min, 2) }
  const max = scale.base * scale.wide.ratio ** step
  const slope = (max - min) / (scale.wide.width - scale.narrow.width)
  return { kind: 'fluid', min: round(min, 2), max: round(max, 2), rem: round((min - slope * scale.narrow.width) / scale.base), vw: round(slope * 100) }
}

/** The largest px a size reaches, at the scale's wide end. */
export const largestPx = (size: TypeSize): number => (size.kind === 'fixed' ? size.px : size.max)

/** The px a size resolves to on the narrowest window. */
export const smallestPx = (size: TypeSize): number => (size.kind === 'fixed' ? size.px : size.min)

/** The px a size resolves to on a window `width` px wide. */
export function sizeAt(size: TypeSize, width: number, scale = TYPE_SCALE): number {
  if (size.kind === 'fixed') return size.px
  return Math.min(size.max, Math.max(size.min, size.rem * scale.base + (size.vw * width) / 100))
}

/** The size a role reaches on the wide end, where its leading and tracking are set. */
const widestOf = (role: TypeRole, scale = TYPE_SCALE): number => largestPx(stepSize(TYPE_STEPS[role], scale))

/** Running text: the lead and every role below it. */
export const isText = (role: TypeRole): boolean => TYPE_STEPS[role] <= TYPE_STEPS.lead

/**
 * The reciprocal through two settings, `from` at size `a` and `to` at size
 * `b`, as `k + c / size`. Times the size it is `k·size + c`: a length CSS
 * writes as `calc(k·1em + c)`, true at every size.
 */
export interface Reciprocal {
  readonly k: number
  readonly c: number
}
const through = ([a, from]: readonly [number, number], [b, to]: readonly [number, number]): Reciprocal => {
  const c = (to - from) / (1 / b - 1 / a)
  return { k: from - c / a, c }
}
const valueAt = ({ k, c }: Reciprocal, size: number): number => k + c / size

export const headingLeading = (scale = TYPE_SCALE): Reciprocal =>
  through([widestOf('heading', scale), scale.set.heading.leading], [widestOf('display', scale), scale.set.display.leading])

export const roleTracking = (scale = TYPE_SCALE): Reciprocal =>
  through([widestOf('body', scale), scale.set.tracking.body], [widestOf('display', scale), scale.set.tracking.display])

/** A role's leading (unitless) and tracking (em) at a size, by default its wide-end size. */
export function roleSet(role: TypeRole, size = widestOf(role), scale = TYPE_SCALE): { readonly leading: number; readonly tracking: number } {
  const leading = isText(role) ? scale.set.text.leading : valueAt(headingLeading(scale), size)
  return { leading: round(leading, 3), tracking: round(Math.min(scale.loosest.tracking, valueAt(roleTracking(scale), size)), 3) }
}

/** Tracking for words set in capitals at small sizes (labels, the eyebrow), on top of the role's own. */
export const CAPS_TRACKING = 0.08

/** The shortest line, in characters, at which a paragraph keeps its role (BENTO_TYPE.md, "Measure"); a card's text column holds it. */
export const MEASURE_CH = 45

export const cssSize = (size: TypeSize): string =>
  size.kind === 'fixed' ? `${round(size.px / TYPE_SCALE.base)}rem` : `clamp(${round(size.min / TYPE_SCALE.base)}rem, ${size.rem}rem + ${size.vw}vw, ${round(size.max / TYPE_SCALE.base)}rem)`

/** A reciprocal as a length: `k` em of the element's own size plus `c` px, in rem. */
const cssReciprocal = ({ k, c }: Reciprocal): string => `calc(${round(k)}em + ${round(c / TYPE_SCALE.base)}rem)`

/**
 * The scale as custom properties: `--type-<role>` (size), `-lh` (leading) and
 * `-ls` (tracking), plus caps tracking and UI leading. A heading's leading and
 * every tracking are lengths from the reciprocal, so they hold at the size
 * the role resolves to on this window, not only at the wide end.
 */
export const typeCssVars = (): Readonly<Record<string, string>> => ({
  ...Object.fromEntries(
    (Object.keys(TYPE_STEPS) as TypeRole[]).flatMap((role) => [
      [`--type-${role}`, cssSize(stepSize(TYPE_STEPS[role]))],
      [`--type-${role}-lh`, isText(role) ? String(TYPE_SCALE.set.text.leading) : cssReciprocal(headingLeading())],
      [`--type-${role}-ls`, `min(${TYPE_SCALE.loosest.tracking}em, ${cssReciprocal(roleTracking())})`],
    ]),
  ),
  '--type-caps-ls': `${CAPS_TRACKING}em`,
  /** Short UI strings that may wrap once (a value, a seal's title): the first heading's leading, not prose leading. */
  '--type-ui-lh': String(TYPE_SCALE.set.heading.leading),
  /** A trimmed line's height, in em of its size. */
  '--type-cap': String(TRIM.cap),
  /** The space under a trimmed line before the next line of its fact, in em of the upper line's size. */
  '--type-room': String(TRIM.room),
  /** The space between a component's parts, and its inset. */
  '--type-group': `${round(groupPx() / TYPE_SCALE.base)}rem`,
  /** The measure, in characters of the element's own face and size. */
  '--type-measure': `${MEASURE_CH}ch`,
})
