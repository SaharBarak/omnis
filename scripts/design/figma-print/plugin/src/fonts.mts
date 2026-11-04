/**
 * The faces the plan sets text in (PlanBundle.fonts), resolved against the
 * fonts the editor has and loaded once, before any text is touched. A face
 * the editor lacks prints in the nearest one CSS would pick and is reported
 * missing; a variable family prints the exact weight on its `wght` axis.
 */
import type { FontNeed } from '../../plan/schema.mts';
import { matchFace } from './faces.mts';

/** The variation axis that carries a weight. */
const WEIGHT_AXIS = 'wght';

export interface FontBook {
  /** The font a need prints in. */
  fontOf(need: FontNeed): FontName;
  /** The font a new text node starts in, loaded. */
  readonly initial: FontName;
  /** Needs that print in another face than the one asked for. */
  readonly missing: readonly FontNeed[];
}

const needKey = (need: FontNeed): string => JSON.stringify([need.family, need.weight, need.italic]);
const fontKey = (font: FontName): string => JSON.stringify([font.family, font.style]);

/** The font a new text node starts in: what the editor gives one, read off a probe. */
function initialFont(available: readonly Font[]): FontName {
  const probe = figma.createText();
  const font = probe.fontName;
  probe.remove();
  const initial = typeof font === 'symbol' ? available[0]?.fontName : font;
  if (!initial) throw new Error('the editor lists no fonts');
  return initial;
}

/** The variation axes of a family, or null for a static one or an editor without the API. */
function axesOf(family: string): readonly string[] | null {
  if (typeof figma.getFontFamilyVariationAxes !== 'function') return null;
  try {
    return figma.getFontFamilyVariationAxes(family);
  } catch {
    return null;
  }
}

interface Resolved {
  readonly font: FontName;
  readonly exact: boolean;
}

function resolve(need: FontNeed, families: ReadonlyMap<string, readonly string[]>, initial: FontName): Resolved {
  const match = matchFace(need, families.get(need.family) ?? []);
  if (!match) return { font: initial, exact: false };
  const style = { family: need.family, style: match.face.style };
  if (match.exact) return { font: style, exact: true };
  const variable = match.face.italic === need.italic && (axesOf(need.family)?.includes(WEIGHT_AXIS) ?? false);
  return variable ? { font: { ...style, variationSettings: { [WEIGHT_AXIS]: need.weight } }, exact: true } : { font: style, exact: false };
}

/** Resolves and loads every need; a face that fails to load prints in the initial font. */
export async function loadFonts(needs: readonly FontNeed[]): Promise<FontBook> {
  const available = await figma.listAvailableFontsAsync();
  const families = new Map<string, string[]>();
  for (const { fontName } of available) families.set(fontName.family, [...(families.get(fontName.family) ?? []), fontName.style]);
  const initial = initialFont(available);
  const resolved = new Map(needs.map((need) => [needKey(need), resolve(need, families, initial)] as const));
  const fonts = new Map([initial, ...[...resolved.values()].map((entry) => entry.font)].map((font) => [fontKey(font), font] as const));
  const loads = await Promise.allSettled([...fonts.values()].map((font) => figma.loadFontAsync(font)));
  const failed = new Set([...fonts.keys()].filter((_, at) => loads[at]?.status === 'rejected'));
  if (failed.has(fontKey(initial))) throw new Error(`the initial font ${initial.family} ${initial.style} does not load`);
  const usable = (entry: Resolved): Resolved => (failed.has(fontKey(entry.font)) ? { font: initial, exact: false } : entry);
  const book = new Map([...resolved].map(([key, entry]) => [key, usable(entry)] as const));
  return {
    fontOf: (need) => book.get(needKey(need))?.font ?? initial,
    initial,
    missing: needs.filter((need) => book.get(needKey(need))?.exact !== true),
  };
}
