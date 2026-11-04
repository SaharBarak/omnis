/**
 * Colours between the plan and Figma. A colour compares as the planner
 * writes it, `#rrggbbaa` through plan/css.mts's `hexOf`, so the plugin and
 * the planner round the same way and no float noise reads as a change.
 */
import { hexOf } from '../../plan/css.mts';
import type { CollectionSpec, Rgba } from '../../plan/schema.mts';
import { heldValuesOf } from './specs.mts';

export const rgbOf = ([r, g, b]: Rgba): RGB => ({ r, g, b });
export const rgbaOf = ([r, g, b, a]: Rgba): RGBA => ({ r, g, b, a });

/** A solid paint's colour and opacity as `#rrggbbaa`. */
export const paintHexOf = (color: RGB, opacity: number | undefined): string => hexOf([color.r, color.g, color.b, opacity ?? 1]);

/** An RGBA colour as `#rrggbbaa`. */
export const rgbaHexOf = (color: RGBA): string => hexOf([color.r, color.g, color.b, color.a]);

/** A colour shown through a paint's opacity, as `#rrggbbaa`: what the layer shows. */
export const tintedHexOf = ([r, g, b, a]: Rgba, opacity: number): string => hexOf([r, g, b, a * opacity]);

/** The colour every COLOR variable shows, by plan key, through its aliases. */
export function heldColorsOf(collections: readonly CollectionSpec[]): ReadonlyMap<string, Rgba> {
  const colors = new Map<string, Rgba>();
  for (const [key, value] of heldValuesOf(collections)) if (value.kind === 'color') colors.set(key, value.rgba);
  return colors;
}
