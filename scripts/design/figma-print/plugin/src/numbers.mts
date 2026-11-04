/**
 * How the plugin compares numbers it reads back from the file: floats at the
 * precision Figma stores them in, and lengths finer than the tolerance
 * (docs/redesign/FIGMA_PRINT.md §9) reads.
 */

/** Figma stores numbers as 32-bit floats: a difference below this share of their size is no difference. */
const FLOAT_EPSILON = 2 ** -23;

export const sameFloat = (a: number, b: number): boolean => Math.abs(a - b) <= FLOAT_EPSILON * Math.max(1, Math.abs(a), Math.abs(b));

/** A hundredth of a pixel. */
export const PX_EPSILON = 0.01;

export const samePx = (a: number, b: number): boolean => Math.abs(a - b) < PX_EPSILON;
