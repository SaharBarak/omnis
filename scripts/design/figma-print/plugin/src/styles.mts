/**
 * Text and effect styles (docs/redesign/FIGMA_PRINT.md §6): one unit each, reconciled
 * in place by key so every node that carries a style keeps it. A keyed style
 * the plan no longer names is removed.
 */
import type { EffectStyleSpec, TextStyleSpec } from '../../plan/schema.mts';
import type { Run } from './context.mts';
import type { UnitStatus } from './journal.mts';
import { isKeyed, keyOf, mark } from './keys.mts';
import { samePx } from './numbers.mts';
import { effectOf, effectSignature } from './paint.mts';

interface Tally {
  edits: number;
}

/** Sets a property when it differs, and counts the edit. */
function set<Target, Key extends keyof Target>(target: Target, key: Key, value: Target[Key], same: (a: Target[Key], b: Target[Key]) => boolean, tally: Tally): void {
  if (same(target[key], value)) return;
  target[key] = value;
  tally.edits += 1;
}

const exactly = <Value,>(a: Value, b: Value): boolean => a === b;

const sameFont = (a: FontName, b: FontName): boolean =>
  a.family === b.family && a.style === b.style && (b.variationSettings === undefined || JSON.stringify(a.variationSettings ?? {}) === JSON.stringify(b.variationSettings));

const sameLineHeight = (a: LineHeight, b: LineHeight): boolean => a.unit === b.unit && (a.unit === 'AUTO' || b.unit === 'AUTO' || samePx(a.value, b.value));
const sameLetterSpacing = (a: LetterSpacing, b: LetterSpacing): boolean => a.unit === b.unit && samePx(a.value, b.value);

const lineHeightOf = (spec: TextStyleSpec): LineHeight => (spec.lineHeight === null ? { unit: 'AUTO' } : { unit: 'PIXELS', value: spec.lineHeight });

/** The text style spec's face, as the font book resolves it. */
export const fontOfStyle = (spec: TextStyleSpec, run: Run): FontName => run.fonts.fontOf({ family: spec.family, weight: spec.weight, italic: spec.italic });

function describeText(style: TextStyle, spec: TextStyleSpec, run: Run, tally: Tally): void {
  set(style, 'name', spec.name, exactly, tally);
  set(style, 'fontName', fontOfStyle(spec, run), sameFont, tally);
  set(style, 'fontSize', spec.size, samePx, tally);
  set(style, 'lineHeight', lineHeightOf(spec), sameLineHeight, tally);
  set(style, 'letterSpacing', { unit: 'PIXELS', value: spec.letterSpacing }, sameLetterSpacing, tally);
  set(style, 'textCase', spec.textCase ?? 'ORIGINAL', exactly, tally);
  set(style, 'textDecoration', spec.decoration ?? 'NONE', exactly, tally);
  const bound = style.boundVariables?.fontSize?.id;
  const key = spec.bind?.fontSize;
  const variable = key === undefined ? null : (run.library.variables.get(key) ?? null);
  if (key !== undefined && !variable) run.journal.error(spec.key, `its size binds ${key}, which the file does not hold`);
  if (variable && bound !== variable.id) {
    style.setBoundVariable('fontSize', variable);
    tally.edits += 1;
  } else if (!variable && bound !== undefined) {
    style.setBoundVariable('fontSize', null);
    tally.edits += 1;
  }
}

/** Keyed styles by key; a key two styles carry keeps the first and reports the other. */
function keyedStyles<Style extends BaseStyle>(styles: readonly Style[], run: Run): Map<string, Style> {
  const found = new Map<string, Style>();
  for (const style of styles.filter(isKeyed)) {
    if (found.has(keyOf(style))) run.journal.error(keyOf(style), `${style.name} carries a key another style carries; it is left as it is`);
    else found.set(keyOf(style), style);
  }
  return found;
}

/** Removes keyed styles the plan does not name. */
function prune(found: ReadonlyMap<string, BaseStyle>, named: ReadonlySet<string>, tally: Tally): void {
  for (const [key, style] of found) {
    if (named.has(key)) continue;
    style.remove();
    tally.edits += 1;
  }
}

export async function printTextStyles(specs: readonly TextStyleSpec[], run: Run): Promise<UnitStatus> {
  const tally: Tally = { edits: 0 };
  const found = keyedStyles(await figma.getLocalTextStylesAsync(), run);
  for (const spec of specs) {
    const existing = found.get(spec.key);
    const style = existing ?? figma.createTextStyle();
    if (!existing) {
      mark(style, { key: spec.key });
      tally.edits += 1;
    }
    describeText(style, spec, run, tally);
    run.library.textStyles.set(spec.key, style);
    run.library.styleKeys.set(style.id, spec.key);
  }
  if (run.bundle.complete) prune(found, new Set(specs.map((spec) => spec.key)), tally);
  return tally.edits > 0 ? 'built' : 'unchanged';
}

const sameEffects = (a: readonly Effect[], b: readonly Effect[]): boolean => a.map(effectSignature).join('\n') === b.map(effectSignature).join('\n');

export async function printEffectStyles(specs: readonly EffectStyleSpec[], run: Run): Promise<UnitStatus> {
  const tally: Tally = { edits: 0 };
  const found = keyedStyles(await figma.getLocalEffectStylesAsync(), run);
  for (const spec of specs) {
    const existing = found.get(spec.key);
    const style = existing ?? figma.createEffectStyle();
    if (!existing) {
      mark(style, { key: spec.key });
      tally.edits += 1;
    }
    set(style, 'name', spec.name, exactly, tally);
    set(
      style,
      'effects',
      spec.effects.map((effect) => effectOf(effect, run, spec.key)),
      sameEffects,
      tally,
    );
    run.library.effectStyles.set(spec.key, style);
  }
  if (run.bundle.complete) prune(found, new Set(specs.map((spec) => spec.key)), tally);
  return tally.edits > 0 ? 'built' : 'unchanged';
}
