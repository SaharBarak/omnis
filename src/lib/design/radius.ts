/**
 * Radius roles (docs/redesign/BENTO_POLISH.md "Radius"). A surface takes a
 * role, never a size. A surface that holds another close to its edge derives
 * its radius from the inner one: outer = inner + padding + the outer's edge,
 * so the frame's is computed here and the rest in CSS with `calc()`.
 */

export const RADIUS = Object.freeze({
  /** A day in a calendar grid, a strip cell, a small toggle. */
  cell: 8,
  /** Inputs, selects, menu rows, rail links, notices, pin cards. */
  control: 12,
  /** A panel set inside a card: system tiles, quoted lines, notes, seats. */
  inset: 16,
  /** Cards, tiles, plans, FAQ items, empty states. */
  card: 22,
  /** A figure's art well, a page's large panel, a banner. */
  stage: 28,
})

export type RadiusRole = keyof typeof RADIUS | 'frame'

/** Every surface's edge: a border this wide, painted by the elevation scale. */
export const EDGE_WIDTH = 1

/** The rim a full-width figure's frame keeps around its stage, in px. */
export const FRAME_RIM = 6

/** The radius of a surface holding one of radius `inner` at `padding` px inside its edge. */
export const concentric = (inner: number, padding: number, edge = EDGE_WIDTH): number => inner + padding + edge

/** Every role, the frame derived from the stage it holds. */
export const RADII: Readonly<Record<RadiusRole, number>> = Object.freeze({ ...RADIUS, frame: concentric(RADIUS.stage, FRAME_RIM) })

export const radiusCssVars = (): Readonly<Record<string, string>> => ({
  ...Object.fromEntries(Object.entries(RADII).map(([role, px]) => [`--radius-${role}`, `${px}px`])),
  '--edge-w': `${EDGE_WIDTH}px`,
  '--frame-rim': `${FRAME_RIM}px`,
})
