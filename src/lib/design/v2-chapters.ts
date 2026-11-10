import type { Chapter } from './palette-ids'

/**
 * The v2 home's sections in reading order and the ground each sits on
 * (BENTO_V2.md "Light and dark"): the page's own, or the other theme's on a
 * plate. The other ground is rare, so it stays a turn in the page: the
 * argument before the close. The product itself, after the hero, stands on
 * the page's own ground, so in the dark theme Maya's map is read in the dark.
 */
export const V2_SECTIONS = [
  ['top', 'page'],
  ['map', 'page'],
  ['pair', 'page'],
  ['circle', 'page'],
  ['why', 'inverse'],
  ['start', 'page'],
] as const satisfies readonly (readonly [string, Chapter | 'page'])[]

/** At most two sections leave the page's ground (the owner's rule, BENTO_V2.md "Light and dark"). */
export const V2_INVERSE_MAX = 2

export type V2Section = (typeof V2_SECTIONS)[number][0]

/** The sections in reading order: the page renders them from this, so the alternation the tests hold is the one shown. */
export const V2_RUN: readonly V2Section[] = V2_SECTIONS.map(([section]) => section)

/** The run's last section is the page's footer: it follows the main landmark rather than sitting in it. */
export const V2_FOOTER = 'start' as const satisfies V2Section

const GROUNDS: Readonly<Record<V2Section, Chapter | 'page'>> = Object.freeze(Object.fromEntries(V2_SECTIONS)) as Record<V2Section, Chapter | 'page'>

/** The chapter a section is drawn in, if it is not the page's own. */
export const chapterOf = (section: V2Section): Chapter | undefined => {
  const ground = GROUNDS[section]
  return ground === 'page' ? undefined : ground
}
