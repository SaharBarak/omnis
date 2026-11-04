/**
 * Variables (docs/redesign/FIGMA_PRINT.md §6): the custom properties the measured
 * pages print through, as Figma variables: a collection per print and one
 * of the primitives every print resolves alike (prints-table.mts), and the
 * binder each print ties its measured values with.
 *
 * A value binds to the first custom property in its authored chain whose
 * value on the stage equals the value measured on the element, in the print
 * that renders it. A property overridden in context (a spot tile recolouring
 * its children) therefore falls through to the token that really holds the
 * colour there. A frame of the primary print binds the token in the primary
 * collection; a twin print's frame binds its twin in that print's collection,
 * keyed by the print's prefix and the primary key, so no print binds
 * another's collection. With one print there are no twins.
 */
import { CONFIG } from '../config.mjs';
import { color, hexOf } from './css.mts';
import { PRIMITIVES, PRINT_TABLE } from '../prints-table.mts';
import { collectionOf, PRIMARY, TWINS } from './prints.mts';
import { printOf, type RawBinding, type RawPage } from './raw.mts';
import type { Bound, CollectionSpec, ColorRef, PrintName, Rgba, VariableScope, VariableSpec, VariableValue, ViewportName } from './schema.mts';

const PRINTS = CONFIG.prints as readonly PrintName[];

/** What a twin print's key is: this, then the primary key it twins. */
export const twinPrefix = (print: PrintName): string => `${print}:`;

/** A primary key as a print binds it: itself in the primary print, its twin in a twin print. */
export const twinOf = (key: string, print: PrintName): string => (print === PRIMARY ? key : `${twinPrefix(print)}${key}`);

/** The twin print a key is of, or null for a key of the primary print. */
export const twinPrintOf = (key: string): PrintName | null => TWINS.find((print) => key.startsWith(twinPrefix(print))) ?? null;

type Kind = 'color' | 'float';
type Slot = `${PrintName}|${ViewportName}`;

interface Token {
  readonly name: string;
  readonly values: Partial<Record<Slot, string>>;
  /** Per print, the custom properties this one's authored chains alias next, with how often. */
  readonly next: Map<PrintName, Map<string, number>>;
}

interface Use {
  readonly kind: Kind;
  readonly scopes: Set<VariableScope>;
}

/** A token a measured value binds to, and the share of the token's colour it shows. */
interface Resolved {
  readonly name: string;
  readonly tint: number;
}

/** One bound property on one element, as its print renders it. */
export interface Measured {
  readonly kind: Kind;
  readonly computed: string;
  readonly binding: RawBinding | undefined;
  readonly viewport: ViewportName;
  readonly scope: VariableScope;
}

/** How one print binds its measured values: to its own collection's variables, or to none where the code wrote a literal. */
export interface Binder {
  color(measured: Measured): ColorRef;
  float(measured: Measured): Bound;
}

/** A custom property's Figma name: its first dash-separated word is the group (`--np-ink` is `np/ink`). */
export const tokenNameOf = (token: string): string => {
  const bare = token.replace(/^--/, '');
  const dash = bare.indexOf('-');
  return dash < 0 ? bare : `${bare.slice(0, dash)}/${bare.slice(dash + 1)}`;
};

const floatOf = (value: string): number | null => {
  if (!/^-?[\d.]+(px)?$/.test(value.trim())) return null;
  return Number.parseFloat(value);
};

const sameColor = (a: string, b: string): boolean => {
  const left = color(a);
  const right = color(b);
  return left !== null && right !== null && hexOf(left) === hexOf(right);
};
/**
 * The share of a token's colour a measured colour shows, when the code mixed
 * the token with transparency (`color-mix(in srgb, var(--ink) 12%, transparent)`):
 * the same colour at a fraction of its alpha. Null for any other colour.
 */
const tintOf = (token: string | undefined, measured: string): number | null => {
  const left = token === undefined ? null : color(token);
  const right = color(measured);
  if (!left || !right || hexOf([...left.slice(0, 3), 1] as unknown as Rgba) !== hexOf([...right.slice(0, 3), 1] as unknown as Rgba)) return null;
  if (right[3] <= 0 || right[3] >= left[3]) return null;
  return Math.round((right[3] / left[3]) * 1000) / 1000;
};

/** The scopes whose paints carry an opacity of their own, so a tinted token binds there. */
const TINTABLE: ReadonlySet<VariableScope> = new Set(['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL']);

/** A value's top-level comma-separated arguments. */
function argumentsOf(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of value) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += character;
  }
  return [...parts, current.trim()];
}

/**
 * The share of its colour an authored `color-mix()` of a colour with
 * `transparent` shows: the colour's weight over both weights (an omitted one
 * is what the other leaves of 100%, both omitted are halves), times their sum
 * where it is under 100%. A paint opacity scales the token's own alpha the
 * same way. Any other way to lower the alpha, such as a relative colour with
 * a fixed alpha, does not, so it gives no share.
 */
export function mixShareOf(value: string): number | null {
  const mix = /^color-mix\(\s*in\s+[^,]+,(.*)\)$/is.exec(value.trim());
  if (!mix) return null;
  const parts = argumentsOf(mix[1]!);
  if (parts.length !== 2) return null;
  const split = (part: string): { readonly color: string; readonly weight: number | null } => {
    const weight = /(?:^|\s)(-?[\d.]+)%(?:\s|$)/.exec(part);
    return { color: part.replace(/(?:^|\s)-?[\d.]+%(?:\s|$)/, ' ').trim(), weight: weight ? Number(weight[1]) : null };
  };
  const [first, second] = parts.map(split) as [ReturnType<typeof split>, ReturnType<typeof split>];
  const clear = [first, second].findIndex((part) => /^transparent$/i.test(part.color));
  if (clear < 0 || /^transparent$/i.test([first, second][1 - clear]!.color)) return null;
  const weights = [first.weight, second.weight];
  const [a, b] = weights[0] === null && weights[1] === null ? [50, 50] : [weights[0] ?? 100 - weights[1]!, weights[1] ?? 100 - weights[0]!];
  const sum = a + b;
  if (!(sum > 0) || a < 0 || b < 0) return null;
  const own = clear === 0 ? b : a;
  return Math.round((own / sum) * Math.min(1, sum / 100) * 1000) / 1000;
}

const sameFloat = (a: string, b: string): boolean => {
  const left = floatOf(a);
  const right = floatOf(b);
  return left !== null && right !== null && Math.abs(left - right) < 0.01;
};

export class Variables {
  private readonly tokens = new Map<string, Token>();
  private readonly uses = new Map<string, Use>();

  /** Reads every page's stage tokens and the chains its elements authored. */
  constructor(pages: readonly RawPage[]) {
    for (const page of pages) {
      for (const print of PRINTS) {
        const read = printOf(page, print);
        for (const [name, value] of Object.entries(read.tokens)) {
          const token = this.token(name);
          token.values[`${print}|${page.viewport}`] ??= value;
        }
        const chains = (bind: Readonly<Record<string, RawBinding>> | undefined): void => {
          for (const binding of Object.values(bind ?? {})) {
            for (const chain of binding.chains) {
              for (let at = 0; at + 1 < chain.length; at += 1) {
                const nexts = this.token(chain[at]!).next;
                const next = nexts.get(print) ?? new Map<string, number>();
                next.set(chain[at + 1]!, (next.get(chain[at + 1]!) ?? 0) + 1);
                nexts.set(print, next);
              }
            }
          }
        };
        for (const node of Object.values(read.nodes)) chains(node.bind);
        for (const list of Object.values(read.pseudo)) for (const pseudo of list) chains(pseudo.bind);
      }
    }
  }

  private token(name: string): Token {
    let token = this.tokens.get(name);
    if (!token) {
      token = { name, values: {}, next: new Map() };
      this.tokens.set(name, token);
    }
    return token;
  }

  private value(name: string, print: PrintName, viewport: ViewportName): string | undefined {
    return this.tokens.get(name)?.values[`${print}|${viewport}`];
  }

  /** True when the token holds different values at the two viewports, in either print. */
  private byViewport(name: string): boolean {
    return PRINTS.some((print) => {
      const wide = this.value(name, print, 'wide');
      const narrow = this.value(name, print, 'narrow');
      return wide !== undefined && narrow !== undefined && wide.trim() !== narrow.trim();
    });
  }

  /** The variable key that holds `name` at a viewport. */
  private keyOf(name: string, viewport: ViewportName): string {
    return this.byViewport(name) ? `${name}@${viewport}` : name;
  }

  private use(key: string, kind: Kind, scope: VariableScope): void {
    let use = this.uses.get(key);
    if (!use) {
      use = { kind, scopes: new Set() };
      this.uses.set(key, use);
    }
    use.scopes.add(scope);
  }

  /**
   * The token of a chain that holds the measured value in one print, and the
   * share of it the value shows: 1, or less where the code mixed the token
   * with transparency and the paint can carry that as its opacity.
   */
  private resolve(measured: Measured, print: PrintName): Resolved | null {
    const { binding, computed } = measured;
    if (!binding) return null;
    const same = measured.kind === 'color' ? sameColor : sameFloat;
    for (const chain of binding.chains) {
      for (const name of chain) {
        const value = this.value(name, print, measured.viewport);
        if (value !== undefined && same(value, computed)) return { name, tint: 1 };
      }
    }
    // A tint only where the code mixed the token with transparency, at the share the mix gives.
    const share = measured.kind === 'color' && TINTABLE.has(measured.scope) ? mixShareOf(binding.value) : null;
    if (share === null) return null;
    for (const chain of binding.chains) {
      for (const name of chain) {
        const tint = tintOf(this.value(name, print, measured.viewport), computed);
        if (tint !== null && Math.abs(tint - share) <= 0.01) return { name, tint };
      }
    }
    return null;
  }

  private literal(kind: Kind, value: string): VariableValue {
    return kind === 'color' ? { kind: 'color', rgba: color(value) ?? [0, 0, 0, 0] } : { kind: 'float', value: floatOf(value) ?? 0 };
  }

  /**
   * The binder of one print: it resolves measured values in that print's
   * token values and binds that print's collection, recording each use on
   * the primary print's key so every twin carries its scopes.
   */
  in(print: PrintName): Binder {
    const bind = (measured: Measured): Resolved | null => {
      const token = this.resolve(measured, print);
      if (!token) return null;
      const key = this.keyOf(token.name, measured.viewport);
      this.use(key, measured.kind, measured.scope);
      return { name: twinOf(key, print), tint: token.tint };
    };
    return {
      color: (measured) => {
        const rgba: Rgba = color(measured.computed) ?? [0, 0, 0, 0];
        const bound = bind(measured);
        if (!bound) return { rgba };
        return bound.tint < 1 ? { rgba, variable: bound.name, tint: bound.tint } : { rgba, variable: bound.name };
      },
      float: (measured) => {
        const value = floatOf(measured.computed) ?? 0;
        const bound = bind(measured);
        return bound ? { value, variable: bound.name } : { value };
      },
    };
  }

  /**
   * The library: every token a print binds and the tokens its chains alias.
   * The primitives collection holds the tokens every print reads as one
   * literal and no node binds; the primary print's collection every other
   * token with its value there; each twin's collection each primary token's
   * twin with its value in the twin, an alias of the primary's variable where
   * the two agree.
   */
  build(): CollectionSpec[] {
    const wanted = new Map<string, { readonly name: string; readonly viewport: ViewportName | null }>();
    const parse = (key: string): { readonly name: string; readonly viewport: ViewportName | null } => {
      const [name, viewport] = key.split('@') as [string, ViewportName | undefined];
      return { name, viewport: viewport ?? null };
    };
    const queue = [...this.uses.keys()];
    const aliasOf = new Map<string, Partial<Record<PrintName, string>>>();
    while (queue.length > 0) {
      const key = queue.pop()!;
      if (wanted.has(key)) continue;
      const parsed = parse(key);
      wanted.set(key, parsed);
      const viewport = parsed.viewport ?? 'wide';
      const targets: Partial<Record<PrintName, string>> = {};
      for (const print of PRINTS) {
        const next = [...(this.tokens.get(parsed.name)?.next.get(print) ?? new Map()).entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!next) continue;
        const kind = this.uses.get(key)?.kind ?? 'color';
        const same = kind === 'color' ? sameColor : sameFloat;
        const mine = this.value(parsed.name, print, viewport);
        const theirs = this.value(next, print, viewport);
        if (mine !== undefined && theirs !== undefined && same(mine, theirs)) {
          const targetKey = this.keyOf(next, viewport);
          targets[print] = targetKey;
          if (!this.uses.has(targetKey)) this.uses.set(targetKey, { kind, scopes: new Set() });
          queue.push(targetKey);
        }
      }
      aliasOf.set(key, targets);
    }

    const keys = [...wanted.keys()].sort((a, b) => a.localeCompare(b));
    /** A key's value in one print, aliasing by primary key. */
    const valueIn = (key: string, print: PrintName): VariableValue => {
      const target = aliasOf.get(key)?.[print];
      if (target) return { kind: 'alias', key: target };
      const { name, viewport } = wanted.get(key)!;
      return this.literal(this.uses.get(key)!.kind, this.value(name, print, viewport ?? 'wide') ?? '');
    };
    /** Whether a twin resolves a key as the primary does: one literal, or one alias whose target they resolve alike. */
    const agreed = new Map<string, boolean>();
    const agree = (key: string, twin: PrintName): boolean => {
      const memo = `${twin}|${key}`;
      const known = agreed.get(memo);
      if (known !== undefined) return known;
      agreed.set(memo, false);
      const [main, own] = [valueIn(key, PRIMARY), valueIn(key, twin)];
      const alike = JSON.stringify(main) === JSON.stringify(own) && (main.kind !== 'alias' || agree(main.key, twin));
      agreed.set(memo, alike);
      return alike;
    };
    const shared = new Set(keys.filter((key) => this.uses.get(key)!.scopes.size === 0 && valueIn(key, PRIMARY).kind !== 'alias' && TWINS.every((twin) => agree(key, twin))));

    const primitives: VariableSpec[] = [];
    const primary: VariableSpec[] = [];
    const twins = new Map<PrintName, VariableSpec[]>(TWINS.map((twin) => [twin, []]));
    for (const key of keys) {
      const { name, viewport } = wanted.get(key)!;
      const use = this.uses.get(key)!;
      const spec = {
        name: `${tokenNameOf(name)}${viewport ? `/${viewport}` : ''}`,
        type: use.kind === 'color' ? 'COLOR' : 'FLOAT',
        scopes: [...use.scopes],
        css: `var(${name})`,
      } as const;
      const value = valueIn(key, PRIMARY);
      if (shared.has(key)) {
        primitives.push({ key, ...spec, value });
        continue;
      }
      primary.push({ key, ...spec, value });
      // A twin print's value: the primary's variable where the two resolve it alike, else what its own chain aliases, a
      // primitive every print shares or the twin of a primary token, or its own literal.
      for (const twin of TWINS) {
        const own = valueIn(key, twin);
        const twinValue: VariableValue = agree(key, twin) ? { kind: 'alias', key } : own.kind === 'alias' && !shared.has(own.key) ? { kind: 'alias', key: twinOf(own.key, twin) } : own;
        twins.get(twin)!.push({ key: twinOf(key, twin), ...spec, value: twinValue });
      }
    }
    const nameOf = (print: PrintName): string => PRINT_TABLE.find((row) => row.name === print)?.collection.name ?? print;
    return [
      ...(primitives.length > 0 ? [{ key: PRIMITIVES.key, name: PRIMITIVES.name, variables: primitives }] : []),
      { key: collectionOf(PRIMARY), name: nameOf(PRIMARY), variables: primary },
      ...TWINS.map((twin) => ({ key: collectionOf(twin), name: nameOf(twin), variables: twins.get(twin)! })),
    ];
  }
}
