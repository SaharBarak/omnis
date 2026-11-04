/**
 * Purity as a printed unit holds it (docs/redesign/FIGMA_PRINT.md §6, §9 F8). Every
 * node under the unit's root, the layers of its nested instances included, is
 * read for each variable it binds directly: on its own fields, in its paints,
 * gradient stops and effects, in its text's styled segments, and through the
 * fill, stroke, effect and text styles it or a segment carries. A variable of
 * any collection but the unit's print's is a binding across the prints,
 * the primitives and a variable the file does not hold included; an alias between
 * variables is no node's binding. A node keyed at or under an element only
 * another print renders is a stray (plan/prints.mts).
 *
 * The read is plain: it takes node-shaped values, as Figma's scene nodes,
 * paints and styles are, and the lookups the plugin hands it (purity.mts), so
 * it is proven on values made by hand (bindings.test.mts).
 */
import { isStray, type Placement } from '../../plan/prints.mts';
import type { Impurity, Stray } from './journal.mts';

/** What a binding names in place of a collection when the file holds no variable, or no collection, by its id. */
export const MISSING = '(missing)';

/** What an item binds on its own fields, as Figma holds it: a variable alias per field, or a list of them. Effects and gradient stops are plain objects, as a kind that binds nothing has no such field. */
interface Bindable {
  readonly boundVariables?: unknown;
}

/** A paint, as Figma's `Paint` is: a gradient's stops bind on their own. */
export interface PaintLike extends Bindable {
  readonly type: string;
  readonly gradientStops?: readonly object[];
}

/** A style, as Figma's `BaseStyle` is: a paint style's paints and an effect style's effects bind on their own. */
export interface StyleLike extends Bindable {
  readonly type: string;
  readonly paints?: readonly PaintLike[];
  readonly effects?: readonly object[];
}

/** A text's styled segment, as `getStyledTextSegments` gives it with its fills, styles and bindings. */
export interface SegmentLike extends Bindable {
  readonly start: number;
  readonly end: number;
  readonly fills: readonly PaintLike[];
  readonly fillStyleId: string;
  readonly textStyleId: string;
}

/** A node, as Figma's `SceneNode` is: the fields that can hold a binding or a style. */
export interface NodeLike extends Bindable {
  readonly id: string;
  readonly type: string;
  /** Figma's `mixed` symbol on a text of several fills; its segments are read instead. */
  readonly fills?: readonly PaintLike[] | symbol;
  readonly strokes?: readonly PaintLike[];
  readonly effects?: readonly object[];
  readonly fillStyleId?: string | symbol;
  readonly strokeStyleId?: string;
  readonly effectStyleId?: string;
}

/** What the read asks of the file. */
export interface Lookups<Node extends NodeLike> {
  /** A node's plan key; '' for a node without one. */
  readonly keyOf: (node: Node) => string;
  /** A text node's styled segments; none for any other node. */
  readonly segmentsOf: (node: Node) => readonly SegmentLike[];
  /** The collection a variable lives in, by the variable's id: its plan key, its name in parentheses where no plan keyed it, or null where the file holds neither. */
  readonly collectionOf: (id: string) => Promise<string | null>;
  /** A style by its id, or null where the file holds none. */
  readonly styleOf: (id: string) => Promise<StyleLike | null>;
  /** Hands the editor its turn between nodes. */
  readonly tick: () => Promise<void>;
}

/** One unit to read: its key, the collection its print binds, where its layers lie on their page, and its nodes, root first. */
export interface UnitToRead<Node extends NodeLike> {
  readonly unit: string;
  readonly collection: string;
  readonly placement: Placement;
  readonly nodes: readonly Node[];
}

/** What a unit's read found. */
export interface UnitRead {
  readonly impure: readonly Impurity[];
  readonly strays: readonly Stray[];
}

/** A variable bound directly, by id, and the field that binds it. */
interface Binding {
  readonly field: string;
  readonly id: string;
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === 'object' && value !== null;
const isAlias = (value: unknown): value is { readonly type: 'VARIABLE_ALIAS'; readonly id: string } => isRecord(value) && value['type'] === 'VARIABLE_ALIAS' && typeof value['id'] === 'string';

const within = (outer: string, inner: string): string => (outer === '' ? inner : `${outer}.${inner}`);
const indexed = (field: string, at: number): string => `${field}[${String(at)}]`;

/** The aliases a `boundVariables` value holds, each with the field it sits under: one alias, a list of them, or a record of either. */
function aliasesIn(bound: unknown, field: string): readonly Binding[] {
  if (isAlias(bound)) return [{ field, id: bound.id }];
  if (Array.isArray(bound)) return bound.flatMap((one: unknown, at) => aliasesIn(one, indexed(field, at)));
  if (isRecord(bound)) return Object.entries(bound).flatMap(([name, value]) => aliasesIn(value, within(field, name)));
  return [];
}

/** What an item binds on its own fields: a node, a paint, a gradient stop, an effect, a style or a text segment. */
const ownAliases = (item: object, field: string): readonly Binding[] => aliasesIn('boundVariables' in item ? item.boundVariables : undefined, field);

/** What a paint binds: its own colour, and each gradient stop's. */
const paintAliases = (paint: PaintLike, field: string): readonly Binding[] => [
  ...ownAliases(paint, field),
  ...(paint.gradientStops ?? []).flatMap((stop, at) => ownAliases(stop, indexed(within(field, 'stops'), at))),
];

const listAliases = <Item extends object>(items: readonly Item[], field: string, of: (item: Item, field: string) => readonly Binding[]): readonly Binding[] =>
  items.flatMap((item, at) => of(item, indexed(field, at)));

/** What a style binds, relative to it: a paint style's paints, an effect style's effects, and its own fields. */
const styleAliases = (style: StyleLike): readonly Binding[] => [
  ...listAliases(style.paints ?? [], 'paints', paintAliases),
  ...listAliases(style.effects ?? [], 'effects', ownAliases),
  ...ownAliases(style, ''),
];

/** A style a node or a segment carries, by id, under the field it carries it in. */
interface StyleUse {
  readonly field: string;
  readonly id: unknown;
}

/** The styles a node carries itself; a text's fill style is read segment by segment. */
const stylesOf = (node: NodeLike): readonly StyleUse[] => [
  { field: 'fillStyle', id: node.type === 'TEXT' ? '' : node.fillStyleId },
  { field: 'strokeStyle', id: node.strokeStyleId },
  { field: 'effectStyle', id: node.effectStyleId },
];

/** A promise per key, made once. */
function cached<Value>(cache: Map<string, Promise<Value>>, key: string, make: () => Promise<Value>): Promise<Value> {
  const known = cache.get(key);
  if (known) return known;
  const made = make();
  cache.set(key, made);
  return made;
}

/** A reader for one report: each variable's collection and each style's bindings are looked up once, whatever unit asks. */
export function createReader<Node extends NodeLike>(lookups: Lookups<Node>): (unit: UnitToRead<Node>) => Promise<UnitRead> {
  const collections = new Map<string, Promise<string | null>>();
  const styles = new Map<string, Promise<readonly Binding[]>>();
  const collectionOf = (id: string): Promise<string | null> => cached(collections, id, () => lookups.collectionOf(id));
  const bindingsOfStyle = (id: string): Promise<readonly Binding[]> =>
    cached(styles, id, async () => {
      const style = await lookups.styleOf(id);
      return style ? styleAliases(style) : [];
    });

  async function viaStyles(uses: readonly StyleUse[], field: string): Promise<readonly Binding[]> {
    const found: Binding[] = [];
    for (const use of uses) {
      if (typeof use.id !== 'string' || use.id === '') continue;
      const prefix = within(field, use.field);
      for (const binding of await bindingsOfStyle(use.id)) found.push({ field: within(prefix, binding.field), id: binding.id });
    }
    return found;
  }

  /** What a text binds segment by segment: each segment's fills, its own fields and the styles it carries. */
  async function segmentsOf(node: Node): Promise<readonly Binding[]> {
    const found: Binding[] = [];
    for (const segment of lookups.segmentsOf(node)) {
      const field = `text[${String(segment.start)}:${String(segment.end)}]`;
      found.push(...listAliases(segment.fills, within(field, 'fills'), paintAliases), ...ownAliases(segment, field));
      found.push(...(await viaStyles([{ field: 'fillStyle', id: segment.fillStyleId }, { field: 'textStyle', id: segment.textStyleId }], field)));
    }
    return found;
  }

  /** Every variable a node binds directly, the most specific field first. */
  async function bindingsOf(node: Node): Promise<readonly Binding[]> {
    const fills = node.fills !== undefined && typeof node.fills !== 'symbol' ? listAliases(node.fills, 'fills', paintAliases) : [];
    const strokes = listAliases(node.strokes ?? [], 'strokes', paintAliases);
    const effects = listAliases(node.effects ?? [], 'effects', ownAliases);
    return [...fills, ...strokes, ...effects, ...(await segmentsOf(node)), ...(await viaStyles(stylesOf(node), '')), ...ownAliases(node, '')];
  }

  return async ({ unit, collection, placement, nodes }) => {
    const impure: Impurity[] = [];
    const strays: Stray[] = [];
    for (const node of nodes) {
      const key = lookups.keyOf(node);
      if (key !== '' && isStray(key, placement)) strays.push({ unit, node: key });
      // A variable bound on several fields of one node is one binding, reported on its first field.
      const seen = new Set<string>();
      for (const { field, id } of await bindingsOf(node)) {
        if (seen.has(id)) continue;
        seen.add(id);
        const held = await collectionOf(id);
        if (held !== collection) impure.push({ unit, node: key === '' ? node.id : key, field, collection: held ?? MISSING });
      }
      await lookups.tick();
    }
    return { impure, strays };
  };
}
