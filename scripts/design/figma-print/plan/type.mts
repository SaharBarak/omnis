/**
 * Text styles (docs/redesign/FIGMA_PRINT.md §3.2): every distinct run of type the
 * pages print becomes one style, named for the kit part that sets it when
 * there is one. The face is the one Chrome drew with, and the weight the one
 * CSS font matching picked from the faces the site loads.
 *
 * A style that binds its size binds one print's variable, so it is a style of
 * that print (§6): the wire print's is `wire:` and the design print's key,
 * named `· wire`. A style that binds nothing serves both prints.
 */
import { familiesOf, px } from './css.mts';
import type { RawFace } from './raw.mts';
import type { FontNeed, TextStyleSpec, ViewportName } from './schema.mts';
import { twinPrefix, twinPrintOf } from './tokens.mts';

interface Faces {
  /** Weight ranges per family, as the site's @font-face rules load them. */
  readonly ranges: ReadonlyMap<string, readonly (readonly [number, number])[]>;
}

export function facesOf(fonts: readonly RawFace[]): Faces {
  const ranges = new Map<string, [number, number][]>();
  for (const face of fonts) {
    if (face.style !== 'normal' && face.style !== 'italic') continue;
    const [low, high = low] = face.weight.split(/\s+/).map(Number);
    if (!Number.isFinite(low)) continue;
    const list = ranges.get(face.family) ?? [];
    list.push([low!, high!]);
    ranges.set(face.family, list);
  }
  return { ranges };
}

/** CSS font matching (CSS Fonts 4 §5.2) of a requested weight against the weights a family loads. */
export function matchWeight(requested: number, ranges: readonly (readonly [number, number])[]): number {
  if (ranges.length === 0) return requested;
  if (ranges.some(([low, high]) => requested >= low && requested <= high)) return requested;
  const below = ranges.flatMap(([low, high]) => (high < requested ? [high] : [])).sort((a, b) => b - a);
  const above = ranges.flatMap(([low]) => (low > requested ? [low] : [])).sort((a, b) => a - b);
  if (requested >= 400 && requested <= 500) {
    const upTo500 = above.filter((weight) => weight <= 500);
    return upTo500[0] ?? below[0] ?? above[0]!;
  }
  if (requested < 400) return below[0] ?? above[0]!;
  return above[0] ?? below[0]!;
}

export interface Type {
  readonly family: string;
  readonly weight: number;
  readonly italic: boolean;
  readonly size: number;
  readonly lineHeight: number | null;
  readonly letterSpacing: number;
  readonly textCase?: 'UPPER' | 'LOWER' | 'TITLE';
  readonly decoration?: 'UNDERLINE' | 'STRIKETHROUGH';
}

/** The type of a computed style, with the face Chrome used when the protocol reported it. */
export function typeOf(style: Readonly<Record<string, string>>, faces: Faces, face?: string): Type {
  const stack = familiesOf(style['font-family'] ?? '');
  const used = (face && stack.find((family) => face === family || face.startsWith(`${family} `))) ?? stack.find((family) => faces.ranges.has(family)) ?? stack[0] ?? 'Assistant';
  const family = used.replace(/ Fallback$/, '');
  const weight = matchWeight(Number(style['font-weight'] ?? 400), faces.ranges.get(family) ?? []);
  const transform = style['text-transform'];
  const decoration = style['text-decoration-line'];
  return {
    family,
    weight,
    italic: style['font-style'] === 'italic',
    size: px(style['font-size']),
    lineHeight: style['line-height'] === 'normal' ? null : px(style['line-height']),
    letterSpacing: style['letter-spacing'] === 'normal' ? 0 : px(style['letter-spacing']),
    ...(transform === 'uppercase' ? { textCase: 'UPPER' as const } : transform === 'lowercase' ? { textCase: 'LOWER' as const } : transform === 'capitalize' ? { textCase: 'TITLE' as const } : {}),
    ...(decoration?.includes('underline') ? { decoration: 'UNDERLINE' as const } : decoration?.includes('line-through') ? { decoration: 'STRIKETHROUGH' as const } : {}),
  };
}

const round = (value: number): number => Math.round(value * 100) / 100;
const keyOf = (type: Type): string =>
  ['type', type.family, type.weight, type.italic ? 'i' : 'n', round(type.size), type.lineHeight === null ? 'auto' : round(type.lineHeight), round(type.letterSpacing), type.textCase ?? '', type.decoration ?? ''].join('|');

/** Whether two runs print one type, so one style holds both. */
export const sameType = (a: Type, b: Type): boolean => keyOf(a) === keyOf(b);

/**
 * A run's type in its block's lines. CSS holds every line box at least as
 * tall as the block's line height (the strut), and Figma sets a line by its
 * characters' own line heights, so a run takes the larger: a line the block's
 * own characters share is as tall as before, and a line of the run alone is
 * as tall as CSS makes it.
 */
export const strutted = (run: Type, block: Type): Type =>
  run.lineHeight !== null && block.lineHeight !== null && block.lineHeight > run.lineHeight ? { ...run, lineHeight: block.lineHeight } : run;

export class TextStyles {
  private readonly styles = new Map<string, { type: Type; names: Map<string, number>; viewports: Set<ViewportName>; fontSize?: string }>();

  /**
   * The style key for a run of a type whose size binds `fontSize`, a print's
   * variable, or nothing; recording the kit part it came from to name it later.
   */
  use(type: Type, part: string | null, viewport: ViewportName, fontSize?: string): string {
    const twin = fontSize === undefined ? null : twinPrintOf(fontSize);
    const prefix = twin === null ? '' : twinPrefix(twin);
    const bound = twin === null ? fontSize : fontSize!.slice(prefix.length);
    const key = `${prefix}${keyOf(type)}${bound === undefined ? '' : `|${bound}`}`;
    let entry = this.styles.get(key);
    if (!entry) {
      entry = { type, names: new Map(), viewports: new Set(), ...(fontSize === undefined ? {} : { fontSize }) };
      this.styles.set(key, entry);
    }
    if (part) entry.names.set(part, (entry.names.get(part) ?? 0) + 1);
    entry.viewports.add(viewport);
    return key;
  }

  /**
   * Every style, named by its most frequent kit part, with a viewport suffix
   * where one name has two sizes; a wire print's style takes its design
   * twin's name, or its own, and `· wire`.
   */
  build(): { readonly styles: TextStyleSpec[]; readonly fonts: FontNeed[] } {
    const named = [...this.styles.entries()].map(([key, entry]) => {
      const part = [...entry.names.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const base = part ?? `${entry.type.family} ${round(entry.type.size)}`;
      return { key, entry, base };
    });
    const byBase = new Map<string, typeof named>();
    for (const item of named) if (twinPrintOf(item.key) === null) byBase.set(item.base, [...(byBase.get(item.base) ?? []), item]);
    const names = new Map<string, string>();
    for (const [base, items] of byBase) {
      const sorted = items.sort((a, b) => b.entry.type.size - a.entry.type.size || b.entry.type.weight - a.entry.type.weight);
      sorted.forEach((item, index) => {
        const only = item.entry.viewports.size === 1 ? [...item.entry.viewports][0] : null;
        const suffix = sorted.length === 1 ? '' : only && sorted.filter((other) => other.entry.viewports.size === 1 && [...other.entry.viewports][0] === only).length === 1 ? ` · ${only}` : ` · ${index + 1}`;
        names.set(item.key, `${base}${suffix}`);
      });
    }
    for (const item of named) {
      const twin = twinPrintOf(item.key);
      if (twin !== null) names.set(item.key, `${names.get(item.key.slice(twinPrefix(twin).length)) ?? item.base} · ${twin}`);
    }
    const styles: TextStyleSpec[] = named.map(({ key, entry }) => {
      const type = entry.type;
      return {
        key,
        name: names.get(key)!,
        family: type.family,
        weight: type.weight,
        italic: type.italic,
        size: type.size,
        lineHeight: type.lineHeight,
        letterSpacing: type.letterSpacing,
        ...(type.textCase ? { textCase: type.textCase } : {}),
        ...(type.decoration ? { decoration: type.decoration } : {}),
        ...(entry.fontSize ? { bind: { fontSize: entry.fontSize } } : {}),
      };
    });
    const fonts = new Map<string, FontNeed>();
    for (const style of styles) fonts.set(`${style.family}|${style.weight}|${style.italic}`, { family: style.family, weight: style.weight, italic: style.italic });
    return { styles: styles.sort((a, b) => a.name.localeCompare(b.name)), fonts: [...fonts.values()] };
  }
}
