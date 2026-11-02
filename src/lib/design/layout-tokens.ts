/**
 * Layout tokens (docs/redesign/BENTO_TYPE.md, "The scale"). The page's own
 * width, held once: the page rule reads it as a custom property, image
 * `sizes` read it as a number, and the type scale stops growing where the
 * page does.
 */

export const PAGE = Object.freeze({
  /** The page's widest box, gutters included, in px. */
  max: 1320,
  /** The page's side gutter from 720 px up, in px. */
  gutter: 24,
})

/** The page's content width at its widest, in px. */
export const pageContentMax = (): number => PAGE.max - 2 * PAGE.gutter

export const layoutCssVars = (): Readonly<Record<string, string>> => ({
  '--page-max': `${PAGE.max}px`,
  '--page-gutter': `${PAGE.gutter}px`,
})
