/**
 * Font faces by their style names. The plan names a face by family, weight
 * and slope, the weight Chrome matched (docs/redesign/FIGMA_PRINT.md §2); Figma names
 * faces by style strings. A face the editor lacks falls back the way CSS
 * matches a weight (CSS Fonts 4 §5.2), so the fallback is the one a browser
 * would have drawn.
 */
import type { FontNeed } from '../../plan/schema.mts';

/** Style names by the weight they name, normalized: lower case, no spaces, hyphens or underscores. */
const WEIGHTS: ReadonlyMap<string, number> = new Map([
  ['thin', 100],
  ['hairline', 100],
  ['extralight', 200],
  ['ultralight', 200],
  ['light', 300],
  ['', 400],
  ['regular', 400],
  ['normal', 400],
  ['book', 400],
  ['roman', 400],
  ['medium', 500],
  ['semibold', 600],
  ['demibold', 600],
  ['bold', 700],
  ['extrabold', 800],
  ['ultrabold', 800],
  ['black', 900],
  ['heavy', 900],
]);

/** The weights CSS treats as the normal band: a weight in it looks up to its top first. */
const NORMAL_BAND = { low: 400, high: 500 } as const;

/** A slope in a style name; the global form strips every one. */
const SLOPE = /italic|oblique/;
const SLOPES = new RegExp(SLOPE.source, 'g');
const normalized = (style: string): string => style.toLowerCase().replace(/[\s_-]+/g, '');

export interface Face {
  readonly style: string;
  readonly weight: number;
  readonly italic: boolean;
}

/** What a style name says, or null when it names no weight this table reads. */
export function faceOf(style: string): Face | null {
  const name = normalized(style);
  const italic = SLOPE.test(name);
  const weight = WEIGHTS.get(name.replace(SLOPES, ''));
  return weight === undefined ? null : { style, weight, italic };
}

/** The weights in the order CSS tries them for `desired`. */
export function weightOrder(desired: number, weights: readonly number[]): readonly number[] {
  const unique = [...new Set(weights)];
  const up = (from: number, to = Infinity): number[] => unique.filter((weight) => weight >= from && weight <= to).sort((a, b) => a - b);
  const down = (below: number): number[] => unique.filter((weight) => weight < below).sort((a, b) => b - a);
  if (desired >= NORMAL_BAND.low && desired <= NORMAL_BAND.high) {
    return [...up(desired, NORMAL_BAND.high), ...down(desired), ...unique.filter((weight) => weight > NORMAL_BAND.high).sort((a, b) => a - b)];
  }
  return desired < NORMAL_BAND.low ? [...down(desired + 1), ...up(desired + 1)] : [...up(desired), ...down(desired)];
}

export interface Match {
  readonly face: Face;
  /** The face has the weight and slope asked for. */
  readonly exact: boolean;
}

/** The face of a family that prints a need: the exact one, else the one CSS would pick, the same slope first. */
export function matchFace(need: FontNeed, styles: readonly string[]): Match | null {
  const faces = styles.flatMap((style) => {
    const face = faceOf(style);
    return face ? [face] : [];
  });
  const sameSlope = faces.filter((face) => face.italic === need.italic);
  const pool = sameSlope.length > 0 ? sameSlope : faces;
  const [weight] = weightOrder(
    need.weight,
    pool.map((face) => face.weight),
  );
  const face = pool.find((one) => one.weight === weight);
  return face ? { face, exact: face.weight === need.weight && face.italic === need.italic } : null;
}
