/**
 * Components (docs/redesign/FIGMA_PRINT.md §7): every kit occurrence the routes print
 * becomes an instance of its variant's main component.
 *
 * A variant's values come from the occurrence (its `data-*`, `aria-*`, the
 * parts it holds, the shape of its drawing) and, where the two viewports draw
 * it differently, the viewport. The main component is the shape most of the
 * variant's occurrences share; an occurrence of that shape is an instance
 * whose text, paints and visibility are overrides, and any other occurrence
 * stays a frame and is reported. Positions inside an instance come from its
 * main component, so the shape includes every position auto layout does not
 * derive.
 *
 * Each route prints twice, a design frame and a wire frame. An element's two
 * drawings are one occurrence, paired by the element they print, whose shape
 * is the pair of their shapes, so the variants and their bounds are found once
 * for both prints. Each variant then prints a main per print that draws it,
 * under the `print` property, both drawn from one pair of its modal shape
 * where one prints, and each drawing is an instance of its own print's main.
 *
 * Components are decided in dependency order, so a molecule's main component
 * already holds instances of the atoms inside it.
 */
import { createHash } from 'node:crypto';
import { CONFIG } from '../config.mjs';
import type { KitEntry } from '../kit.mts';
import { hexOf } from './css.mts';
import { localOf, partsOf, rel, type FrameFacts } from './nodes.mts';
import { PRINT_AXIS } from './prints.mts';
import type { RawElement } from './raw.mts';
import type { Bound, Box, ComponentSpec, FrameSpec, InstanceSpec, NodeSpec, OverrideSpec, PrintName, SvgSpec, TextSpec, VariantSpec, ViewportName } from './schema.mts';

export interface PlannedRoute {
  /** `route|viewport|print`, as `RouteSpec.key`. */
  readonly key: string;
  readonly viewport: ViewportName;
  readonly print: PrintName;
  readonly frame: FrameSpec;
}

export interface Census {
  readonly components: ComponentSpec[];
  readonly routes: PlannedRoute[];
  /** Instances per variant key. */
  readonly instances: Record<string, number>;
  readonly frames: { component: string; key: string; reason: string }[];
  /** The variant property the census derived from shape, by component. */
  readonly derived: Record<string, string>;
}

/** One print's drawing of an occurrence: the root it prints, and that root's shape. */
interface Side {
  readonly spec: FrameSpec | SvgSpec;
  readonly signature: string;
}

/**
 * One element the routes print, counted once for both prints: its drawing in
 * each print that renders it, its variant values, and its shape, the pair of
 * its sides' shapes.
 */
interface Occurrence {
  readonly viewport: ViewportName;
  readonly sides: Partial<Record<PrintName, Side>>;
  readonly values: Record<string, string>;
  signature: string;
}

const PRINTS = CONFIG.prints as readonly PrintName[];

export const digest = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

/** An occurrence's drawings, in print order. */
const drawn = (sides: Occurrence['sides']): (FrameSpec | SvgSpec)[] =>
  PRINTS.flatMap((print) => {
    const side = sides[print];
    return side ? [side.spec] : [];
  });

/** The page a planned route is one print of: `route|viewport` of its key. */
const pageOf = (route: PlannedRoute): string => route.key.slice(0, route.key.lastIndexOf('|'));

const ZERO: readonly [Bound, Bound, Bound, Bound] = [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
const round = (value: number): number => Math.round(value * 2) / 2;

// ---------------------------------------------------------------- traversal

/** Every node of a subtree, parents before children, instance slot contents included. */
function* walk(spec: NodeSpec): Generator<NodeSpec> {
  yield spec;
  if (spec.type === 'FRAME') for (const child of spec.children) yield* walk(child);
  if (spec.type === 'INSTANCE') for (const list of Object.values(spec.slots ?? {})) for (const child of list) yield* walk(child);
}

/** Rebuilds a subtree, replacing the nodes `swap` returns a node for. */
function mapTree(spec: NodeSpec, swap: (node: NodeSpec) => NodeSpec | undefined): NodeSpec {
  const swapped = swap(spec);
  if (swapped) return swapped;
  if (spec.type === 'FRAME') return { ...spec, children: spec.children.map((child) => mapTree(child, swap)) };
  if (spec.type === 'INSTANCE' && spec.slots) return { ...spec, slots: Object.fromEntries(Object.entries(spec.slots).map(([slot, list]) => [slot, list.map((child) => mapTree(child, swap))])) };
  return spec;
}

/** Moves a subtree's keys from one prefix to another. */
function reKey(spec: NodeSpec, from: string, to: string): NodeSpec {
  const key = spec.key === from ? to : spec.key.startsWith(from) ? to + spec.key.slice(from.length) : spec.key;
  if (spec.type === 'FRAME') return { ...spec, key, children: spec.children.map((child) => reKey(child, from, to)) };
  if (spec.type === 'INSTANCE') return { ...spec, key, ...(spec.slots ? { slots: Object.fromEntries(Object.entries(spec.slots).map(([slot, list]) => [slot, list.map((child) => reKey(child, from, to))])) } : {}) };
  return { ...spec, key };
}

/** Re-bases every `abs` of a subtree on a point. */
function shift(spec: NodeSpec, [x, y]: readonly [number, number]): NodeSpec {
  const abs: Box = [spec.abs[0] - x, spec.abs[1] - y, spec.abs[2], spec.abs[3]];
  if (spec.type === 'FRAME') return { ...spec, abs, children: spec.children.map((child) => shift(child, [x, y])) };
  if (spec.type === 'INSTANCE') return { ...spec, abs, ...(spec.slots ? { slots: Object.fromEntries(Object.entries(spec.slots).map(([slot, list]) => [slot, list.map((child) => shift(child, [x, y]))])) } : {}) };
  return { ...spec, abs };
}

// ---------------------------------------------------------------- identity

const entryOf = (spec: NodeSpec, elements: ReadonlyMap<string, RawElement>, kit: readonly KitEntry[]): KitEntry | null => {
  const element = elements.get(spec.key);
  if (!element || spec.type === 'INSTANCE') return null;
  const parts = partsOf(element.cls);
  return kit.find((entry) => parts.includes(entry.root)) ?? null;
};

/** A text occurrence as a component root: a hugging frame around it. */
function asRoot(spec: NodeSpec): FrameSpec | SvgSpec | null {
  if (spec.type === 'FRAME' || spec.type === 'SVG') return spec;
  if (spec.type !== 'TEXT') return null;
  const { absolute, grid, visible, opacity, part, ...text } = spec;
  return {
    type: 'FRAME',
    key: spec.key,
    name: spec.name,
    box: spec.box,
    abs: spec.abs,
    sizing: { h: 'HUG', v: 'HUG' },
    layout: { mode: 'HORIZONTAL', padding: ZERO, gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: false, reverseZ: false },
    fills: [],
    strokes: [],
    clips: false,
    children: [{ ...text, key: `${spec.key}/text`, box: [0, 0, spec.box[2], spec.box[3]], sizing: { h: spec.resize === 'WIDTH_AND_HEIGHT' ? 'HUG' : 'FIXED', v: 'HUG' } } as TextSpec],
    ...(absolute ? { absolute } : {}),
    ...(grid ? { grid } : {}),
    ...(visible !== undefined ? { visible } : {}),
    ...(opacity ? { opacity } : {}),
    ...(part ? { part } : {}),
  };
}

/** A drawing's shape and paint pattern: its markup without sizes and colours, each colour named by first use. */
function glyphOf(svg: string): string {
  const order = new Map<string, string>();
  const shape = svg
    .replace(/^<svg\b[^>]*>/, (open) => open.replace(/\s(width|height)="[^"]*"/g, ''))
    .replace(/\s(fill|stroke)="([^"]*)"/g, (_, kind: string, value: string) => {
      if (!order.has(value)) order.set(value, String.fromCharCode(65 + order.size));
      return ` ${kind}="${order.get(value)}"`;
    })
    .replace(/\s(fill-opacity|stroke-opacity|opacity|color)="[^"]*"/g, '');
  return digest(shape);
}

/** The parts under an occurrence's root in either print, as a variant's `has` axis reads them. */
const partsUnder = (sides: readonly (FrameSpec | SvgSpec)[], elements: ReadonlyMap<string, RawElement>): Set<string> =>
  new Set(sides.flatMap((spec) => [...walk(spec)].slice(1).flatMap((node) => partsOf(elements.get(node.key)?.cls ?? []))));

/** An occurrence's axis values: its drawings print one element, so its attributes and classes are one, and its drawing is the first print's. */
function valuesOf(entry: KitEntry, sides: readonly (FrameSpec | SvgSpec)[], elements: ReadonlyMap<string, RawElement>): Record<string, string> {
  const element = elements.get(sides[0]!.key);
  const own = new Set(element ? partsOf(element.cls) : []);
  const under = partsUnder(sides, elements);
  const svg = sides.find((spec): spec is SvgSpec => spec.type === 'SVG');
  const values: Record<string, string> = {};
  for (const axis of entry.axes) {
    const from = axis.from;
    let value: string | undefined;
    // A data attribute present with no value is a boolean attribute that is on.
    if ('data' in from) value = element?.data[from.data] === '' ? 'true' : element?.data[from.data];
    else if ('aria' in from) value = element?.attrs[`aria-${from.aria}`];
    else if ('classes' in from) value = Object.entries(from.classes).find(([part]) => own.has(part))?.[1];
    else if ('has' in from) value = Object.entries(from.has).find(([part]) => under.has(part))?.[1];
    else value = svg ? glyphOf(svg.svg) : undefined;
    values[axis.name] = value ?? axis.fallback;
  }
  return values;
}

// ---------------------------------------------------------------- shape

// A stroke, its weights, alignment and dashes are overrides, so a rule between list rows is no shape; so are effects,
// which an instance adds, edits or removes (Figma: "Apply overrides to instances").
const paintShape = (spec: FrameSpec): unknown => [spec.fills.map((paint) => paint.type), spec.radii?.map((radius) => round(radius.value)), spec.clips];

const layoutShape = (spec: FrameSpec): unknown => {
  const layout = spec.layout;
  if (layout.mode === 'NONE') return 'NONE';
  // A hugging track's size is its content's, so it is not part of the shape.
  const track = (one: { readonly type: string; readonly value: number }): unknown => (one.type === 'HUG' ? 'HUG' : [one.type, round(one.value)]);
  if (layout.mode === 'GRID') return ['GRID', layout.padding.map((pad) => round(pad.value)), layout.cols.map(track), layout.rows.map(track), round(layout.colGap.value), round(layout.rowGap.value)];
  return [layout.mode, layout.padding.map((pad) => round(pad.value)), round(layout.gap.value), layout.primary, layout.counter, layout.strokesIncluded, layout.reverseZ];
};

/**
 * What an instance cannot override: structure, layout, sizing modes, every
 * fixed size inside the root, and every position auto layout does not derive.
 */
export function shapeOf(spec: NodeSpec, root: boolean, free: boolean, container: boolean): unknown {
  const where = root ? null : [free || spec.absolute ? [round(spec.box[0]), round(spec.box[1])] : null, spec.absolute ?? null, spec.grid ?? null];
  const size = root ? null : [spec.sizing.h === 'FIXED' ? round(spec.box[2]) : spec.sizing.h, spec.sizing.v === 'FIXED' ? round(spec.box[3]) : spec.sizing.v];
  switch (spec.type) {
    case 'FRAME':
      if (container && root) return ['C', paintShape(spec)];
      return ['F', where, size, layoutShape(spec), paintShape(spec), spec.slot ?? false, spec.children.map((child) => shapeOf(child, false, spec.layout.mode === 'NONE', false))];
    case 'TEXT':
      return ['T', where, size, spec.style, spec.align, spec.resize, spec.maxLines ?? null, spec.minHeight ?? null, (spec.runs ?? []).map((run) => run.style ?? null)];
    case 'SVG':
      return ['S', where, size, glyphOf(spec.svg)];
    case 'INSTANCE':
      // Another variant of the same component is a swap, which an instance can override.
      return ['I', where, size, setOf(spec.component), Object.keys(spec.slots ?? {}).length];
  }
}

// ---------------------------------------------------------------- overrides

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** The component a variant key belongs to: `kit:Name:<values>` is a variant of `kit:Name`. */
const setOf = (variantKey: string): string => variantKey.slice(0, variantKey.lastIndexOf(':'));

/** A drawing's paints in document order, as `#rrggbbaa`. */
/** One paint a drawing's markup writes: the element's layer id, when it has one, which paint, and its colour. */
export interface MarkupPaint {
  readonly id: string | null;
  readonly kind: 'fill' | 'stroke';
  readonly hex: string;
}

export const markupPaints = (svg: string): MarkupPaint[] =>
  [...svg.matchAll(/<\w+\b([^>]*)>/g)].flatMap(([, attributes = '']) => {
    const id = /(?:^|\s)id="([^"]*)"/.exec(attributes)?.[1] ?? null;
    return (['fill', 'stroke'] as const).flatMap((kind) => {
      const value = new RegExp(`(?:^|\\s)${kind}="([^"]*)"`).exec(attributes)?.[1];
      const rgba = value && value !== 'none' ? /^rgba?\(([^)]+)\)$/.exec(value) : null;
      if (!rgba) return [];
      const [r = 0, g = 0, b = 0, a = 1] = rgba[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
      const opacity = Number(new RegExp(`(?:^|\\s)${kind}-opacity="([^"]*)"`).exec(attributes)?.[1] ?? 1);
      return [{ id, kind, hex: hexOf([r / 255, g / 255, b / 255, a * opacity]) }];
    });
  });

export const paintHexes = (svg: string): string[] => markupPaints(svg).map((paint) => paint.hex);

const rgbaOfHex = (hex: string): readonly [number, number, number, number] => [0, 2, 4, 6].map((at) => Number.parseInt(hex.slice(1 + at, 3 + at), 16) / 255) as unknown as readonly [number, number, number, number];

/** An effects override: the occurrence's effect style where it has one, or its effects where they differ from the main's. */
function effectsOverride(main: FrameSpec, occurrence: FrameSpec): Pick<OverrideSpec, 'effects' | 'effectStyle'> {
  if (occurrence.effectStyle) return occurrence.effectStyle === main.effectStyle ? {} : { effectStyle: occurrence.effectStyle };
  return !main.effectStyle && same(main.effects ?? [], occurrence.effects ?? []) ? {} : { effects: occurrence.effects ?? [] };
}

/** What a frame's paint overrides: its fills, its stroke with weights, alignment and dashes, and its effects. */
function surfaceOf(main: FrameSpec, occurrence: FrameSpec): Omit<OverrideSpec, 'part'> {
  const weights = (spec: FrameSpec): readonly [Bound, Bound, Bound, Bound] => spec.strokeWeights ?? ZERO;
  const stroked = occurrence.strokes.length > 0;
  return {
    ...(same(main.fills, occurrence.fills) ? {} : { fills: occurrence.fills }),
    ...(same(main.strokes, occurrence.strokes) ? {} : { strokes: occurrence.strokes }),
    ...(stroked && !same(weights(main), weights(occurrence)) ? { strokeWeights: weights(occurrence) } : {}),
    ...(stroked && (main.strokeAlign ?? 'INSIDE') !== (occurrence.strokeAlign ?? 'INSIDE') ? { strokeAlign: occurrence.strokeAlign ?? 'INSIDE' } : {}),
    ...(same(main.dash ?? [], occurrence.dash ?? []) ? {} : { dash: occurrence.dash ?? [] }),
    ...effectsOverride(main, occurrence),
  };
}

/** Overrides that turn the main's node into the occurrence's, collected over two subtrees of one shape. */
function overridesOf(main: NodeSpec, occurrence: NodeSpec, part: string, mains: ReadonlyMap<string, VariantSpec>, out: OverrideSpec[]): void {
  const override: { -readonly [K in keyof OverrideSpec]?: OverrideSpec[K] } = {};
  // The instance carries its own visibility and opacity; below it they are overrides.
  if (part !== '' && !same(main.visible, occurrence.visible)) override.visible = occurrence.visible ?? true;
  if (part !== '' && !same(main.opacity, occurrence.opacity)) override.opacity = occurrence.opacity ?? { value: 1 };
  if (main.type === 'TEXT' && occurrence.type === 'TEXT') {
    if (main.characters !== occurrence.characters) override.characters = occurrence.characters;
    if (!same(main.fills, occurrence.fills)) override.fills = occurrence.fills;
  }
  if (main.type === 'FRAME' && occurrence.type === 'FRAME') Object.assign(override, surfaceOf(main, occurrence));
  if (main.type === 'SVG' && occurrence.type === 'SVG' && main.svg !== occurrence.svg) {
    const from = paintHexes(main.svg);
    const to = paintHexes(occurrence.svg);
    const recolor = new Map<string, OverrideSpec['recolor'] extends readonly (infer R)[] | undefined ? R : never>();
    from.forEach((hex, at) => {
      const target = to[at];
      if (!target || target === hex || recolor.has(hex)) return;
      const variable = occurrence.colors.find((entry) => entry.hex === target)?.variable;
      recolor.set(hex, { from: hex, to: { rgba: rgbaOfHex(target), ...(variable ? { variable } : {}) } });
    });
    if (recolor.size > 0) override.recolor = [...recolor.values()];
  }
  if (main.type === 'INSTANCE' && occurrence.type === 'INSTANCE') {
    if (main.component !== occurrence.component) {
      // Another variant: swap to it, then its own overrides, relative to its own main, under this path.
      out.push({ part, swap: occurrence.component });
      for (const mine of occurrence.overrides) out.push({ ...mine, part: mine.part === '' ? part : `${part} > ${mine.part}` });
    } else out.push(...changesOf(main, occurrence, part, mains));
  }
  if (Object.keys(override).length > 0) out.push({ part, ...override } as OverrideSpec);
  if (main.type === 'FRAME' && occurrence.type === 'FRAME') {
    main.children.forEach((child, at) => {
      const other = occurrence.children[at];
      if (other) overridesOf(child, other, child.key, mains, out);
    });
  }
}

/** One override per layer: a list's entries for a part merged in order, a swap starting the layer afresh. */
function byPart(list: readonly OverrideSpec[]): Map<string, OverrideSpec> {
  const merged = new Map<string, OverrideSpec>();
  for (const one of list) merged.set(one.part, one.swap === undefined ? { ...merged.get(one.part), ...one } : one);
  return merged;
}

const depthOf = (part: string): number => (part === '' ? 0 : part.split(' > ').length);
const isBelow = (part: string, layer: string): boolean => layer === '' || part.startsWith(`${layer} > `);

/**
 * The layer a part path names under a variant's main, and for an instance
 * the variant it shows: each ' > ' step enters the nested instance there, on
 * the variant a swap of the path puts there, or else one its own main sets.
 */
function layerAt(variant: VariantSpec, part: string, mains: ReadonlyMap<string, VariantSpec>, swaps: ReadonlyMap<string, string>): { readonly node: NodeSpec; readonly shows?: string } | undefined {
  if (part === '') return { node: variant.root };
  const known = new Map(swaps);
  let current: VariantSpec | undefined = variant;
  let path = '';
  for (const step of part.split(' > ')) {
    const node: NodeSpec | undefined = current && [...walk(current.root)].find((one) => one.key === step);
    if (!node) return undefined;
    path = path === '' ? step : `${path} > ${step}`;
    if (node.type !== 'INSTANCE') return path === part ? { node } : undefined;
    for (const own of node.overrides) {
      const below = own.part === '' ? path : `${path} > ${own.part}`;
      if (own.swap !== undefined && !known.has(below)) known.set(below, own.swap);
    }
    const shows = known.get(path) ?? node.component;
    if (path === part) return { node, shows };
    current = mains.get(shows);
  }
  return undefined;
}

/**
 * What an occurrence's nested instance changes from the main's instance of
 * the same variant, layer by layer, outer layers first: the occurrence's
 * overrides over a reset of the main's, a swap the two do not share set or
 * undone, and below a layer swapped either way only the occurrence's own, as
 * a swap clears what was set below it.
 */
function changesOf(main: InstanceSpec, occurrence: InstanceSpec, part: string, mains: ReadonlyMap<string, VariantSpec>): OverrideSpec[] {
  const inner = mains.get(main.component);
  const mine = byPart(occurrence.overrides);
  const theirs = byPart(main.overrides);
  const swaps = new Map([...mine].flatMap(([layer, one]) => (one.swap === undefined ? [] : [[layer, one.swap] as const])));
  const layers = [...new Set([...mine.keys(), ...theirs.keys()])].sort((a, b) => depthOf(a) - depthOf(b));
  const swapped: string[] = [];
  const out: OverrideSpec[] = [];
  for (const layer of layers) {
    const path = layer === '' ? part : `${part} > ${layer}`;
    const own = mine.get(layer);
    const applied = theirs.get(layer);
    if (swapped.some((above) => isBelow(layer, above))) {
      if (own) out.push({ ...own, part: path });
      continue;
    }
    if (same(own, applied)) continue;
    const found = inner && layerAt(inner, layer, mains, swaps);
    if (own?.swap !== applied?.swap) {
      swapped.push(layer);
      const swap = own?.swap ?? found?.shows;
      out.push({ ...own, part: path, ...(swap === undefined ? {} : { swap }) });
      continue;
    }
    out.push({ ...(applied ? resetOf(found?.node, applied, path) : {}), ...own, part: path });
  }
  return out;
}

/** The override that puts a nested layer back to its own main's values. */
function resetOf(node: NodeSpec | undefined, applied: OverrideSpec, path: string): OverrideSpec {
  const reset: { -readonly [K in keyof OverrideSpec]?: OverrideSpec[K] } = { part: path };
  if (!node) return reset as OverrideSpec;
  if (applied.characters !== undefined && node.type === 'TEXT') reset.characters = node.characters;
  if (applied.fills && (node.type === 'TEXT' || node.type === 'FRAME')) reset.fills = node.fills;
  if (applied.strokes && node.type === 'FRAME') reset.strokes = node.strokes;
  if (applied.strokeWeights && node.type === 'FRAME') reset.strokeWeights = node.strokeWeights ?? ZERO;
  if (applied.strokeAlign && node.type === 'FRAME') reset.strokeAlign = node.strokeAlign ?? 'INSIDE';
  if (applied.dash && node.type === 'FRAME') reset.dash = node.dash ?? [];
  if ((applied.effects || applied.effectStyle) && node.type === 'FRAME') {
    if (node.effectStyle) reset.effectStyle = node.effectStyle;
    else reset.effects = node.effects ?? [];
  }
  if (applied.visible !== undefined) reset.visible = node.visible ?? true;
  if (applied.opacity) reset.opacity = node.opacity ?? { value: 1 };
  if (applied.recolor) reset.recolor = applied.recolor.map((one) => ({ from: hexOf(one.to.rgba), to: { rgba: rgbaOfHex(one.from) } }));
  return reset as OverrideSpec;
}

// ---------------------------------------------------------------- the census

/** The order to decide components in: every component after the ones its occurrences contain. */
function dependencyOrder(routes: readonly PlannedRoute[], elements: ReadonlyMap<string, RawElement>, kit: readonly KitEntry[]): KitEntry[] {
  const inside = new Map<KitEntry, Set<KitEntry>>(kit.map((entry) => [entry, new Set()]));
  const visit = (spec: NodeSpec, open: readonly KitEntry[]): void => {
    const entry = entryOf(spec, elements, kit);
    if (entry) for (const outer of open) if (outer !== entry) inside.get(outer)!.add(entry);
    const next = entry ? [...open, entry] : open;
    if (spec.type === 'FRAME') for (const child of spec.children) visit(child, next);
  };
  for (const route of routes) visit(route.frame, []);
  const ordered: KitEntry[] = [];
  const placed = new Set<KitEntry>();
  const place = (entry: KitEntry, path: Set<KitEntry>): void => {
    if (placed.has(entry) || path.has(entry)) return;
    path.add(entry);
    for (const dependency of inside.get(entry) ?? []) place(dependency, path);
    path.delete(entry);
    placed.add(entry);
    ordered.push(entry);
  };
  for (const entry of kit) place(entry, new Set());
  return ordered;
}

interface Group {
  readonly values: Record<string, string>;
  readonly list: Occurrence[];
}

/** An occurrence's signatures by how often they print, most first, a tie broken by the signature. */
function shapesOf(list: readonly Occurrence[]): string[] {
  const counts = new Map<string, number>();
  for (const occurrence of list) counts.set(occurrence.signature, (counts.get(occurrence.signature) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([signature]) => signature);
}

/**
 * Completes the occurrences of one set of values that only one print renders:
 * each takes the shape of the most printed occurrence both prints render whose
 * drawing in its print is alike, so it is an instance of that variant there,
 * not a variant of its own.
 */
function complete(list: readonly Occurrence[]): void {
  const whole = list.filter((occurrence) => PRINTS.every((print) => occurrence.sides[print]));
  const shapes = shapesOf(whole).map((signature) => whole.find((occurrence) => occurrence.signature === signature)!);
  for (const occurrence of list) {
    const [print, ...more] = PRINTS.filter((one) => occurrence.sides[one]);
    if (!print || more.length > 0) continue;
    const twin = shapes.find((shape) => shape.sides[print]!.signature === occurrence.sides[print]!.signature);
    if (twin) occurrence.signature = twin.signature;
  }
}

/**
 * Splits each group of variant values whose occurrences print more than one
 * shape into a variant per shape (docs/redesign/FIGMA_PRINT.md §7), so an occurrence
 * of another shape is an instance of its own variant, not a frame. The split
 * is a variant property of the whole component: the part whose presence tells
 * the two shapes of every split group apart, or else `form`, a shape's
 * signature. A group keeps its most printed shapes and the component its
 * derived variants within CONFIG.figma.census; what they leave stays a frame.
 */
function splitByShape(entry: KitEntry, groups: readonly Group[], elements: ReadonlyMap<string, RawElement>): { readonly groups: Group[]; readonly property: string | null } {
  const { shapesPerGroup, derivedPerComponent } = CONFIG.figma.census;
  let budget = derivedPerComponent;
  const kept = new Map<Group, string[]>();
  for (const group of [...groups].sort((a, b) => b.list.length - a.list.length)) {
    const shapes = shapesOf(group.list).slice(0, Math.min(shapesPerGroup, 1 + budget));
    budget -= shapes.length - 1;
    kept.set(group, shapes);
  }
  const split = groups.filter((group) => kept.get(group)!.length > 1);
  if (split.length === 0) return { groups: [...groups], property: null };

  // A part tells two shapes apart when every occurrence of one holds it and no occurrence of the other does.
  const holding = new Map<Occurrence, Set<string>>(groups.flatMap((group) => group.list.map((occurrence) => [occurrence, partsUnder(drawn(occurrence.sides), elements)] as const)));
  const byShape = (group: Group, signature: string): Occurrence[] => group.list.filter((occurrence) => occurrence.signature === signature);
  const presence = (list: readonly Occurrence[], part: string): boolean | null => {
    const held = list.map((occurrence) => holding.get(occurrence)!.has(part));
    return held.every(Boolean) ? true : held.some(Boolean) ? null : false;
  };
  const tells = (part: string): boolean =>
    split.every((group) => {
      const shapes = kept.get(group)!;
      if (shapes.length !== 2) return false;
      const [a, b] = shapes.map((signature) => presence(byShape(group, signature), part));
      return a !== null && b !== null && a !== b;
    });
  const taken = new Set(entry.axes.map((axis) => axis.name));
  const candidates = [...new Set(split.flatMap((group) => group.list.flatMap((occurrence) => [...holding.get(occurrence)!])))].sort();
  const part = candidates.find((one) => tells(one) && !taken.has(localOf(one) ?? one));
  const property = part ? (localOf(part) ?? part) : taken.has('form') ? 'derived form' : 'form';
  // A form is named by its signature, so a variant keeps its name while other shapes come and go.
  const valueOf = (group: Group, signature: string): string => (part ? String(presence(byShape(group, signature), part) ?? false) : signature.slice(0, 6));

  const next: Group[] = [];
  for (const group of groups) {
    const shapes = kept.get(group)!;
    for (const [at, signature] of shapes.entries()) {
      // What a group leaves of its shapes goes with its most printed one, and is kept as a frame there.
      const list = group.list.filter((occurrence) => occurrence.signature === signature || (at === 0 && !shapes.includes(occurrence.signature)));
      next.push({ values: { ...group.values, [property]: valueOf(group, signature) }, list });
    }
  }
  return { groups: next, property };
}

/** The text property a main's text layer is exposed as. */
function propertyName(text: TextSpec, rootLocal: string | null, taken: Set<string>): string {
  const local = localOf(text.part);
  let name = 'label';
  if (local && rootLocal && local !== rootLocal && local.startsWith(rootLocal)) name = local.charAt(rootLocal.length).toLowerCase() + local.slice(rootLocal.length + 1);
  else if (local && local !== rootLocal) name = local;
  let unique = name;
  for (let count = 2; taken.has(unique); count += 1) unique = `${name} ${count}`;
  taken.add(unique);
  return unique;
}

/**
 * A container instance's sizing. Its main fills its slot, so along an axis
 * the occurrence hugs the instance has nothing to hug: it holds the length it
 * was measured at. Fixed and filling axes stay as they are.
 */
const heldOf = (sizing: FrameSpec['sizing']): FrameSpec['sizing'] => ({ h: sizing.h === 'HUG' ? 'FIXED' : sizing.h, v: sizing.v === 'HUG' ? 'FIXED' : sizing.v });

/** The main component of a container variant: its surface and padding around one slot. */
function containerMain(occurrence: FrameSpec, facts: FrameFacts | undefined, variantKey: string): FrameSpec {
  const content: Box = facts ? rel(facts.content, occurrence.abs) : [0, 0, occurrence.box[2], occurrence.box[3]];
  const slot: FrameSpec = {
    type: 'FRAME',
    key: `${variantKey}/content`,
    name: 'content',
    box: content,
    abs: content,
    sizing: { h: 'FILL', v: 'FILL' },
    layout: { mode: 'VERTICAL', padding: ZERO, gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: false, reverseZ: false },
    fills: [],
    strokes: [],
    clips: false,
    children: [],
    slot: true,
  };
  const { absolute, grid, visible, opacity, ...root } = occurrence;
  return {
    ...root,
    key: variantKey,
    box: [0, 0, occurrence.box[2], occurrence.box[3]],
    abs: [0, 0, occurrence.box[2], occurrence.box[3]],
    sizing: { h: 'FIXED', v: 'FIXED' },
    layout: { mode: 'VERTICAL', padding: facts?.padding() ?? ZERO, gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: facts?.strokesIncluded ?? false, reverseZ: false },
    children: [slot],
  };
}

/**
 * A container occurrence's own content: one frame with its layout, in the
 * slot. The main component holds the container's padding; what the content
 * keeps is only what the measurement adds to it (a first child's margin).
 */
function contentOf(occurrence: FrameSpec, facts: FrameFacts | undefined): FrameSpec {
  const abs = facts?.content ?? occurrence.abs;
  const css = facts?.padding() ?? ZERO;
  const residual = (padding: readonly [Bound, Bound, Bound, Bound]): readonly [Bound, Bound, Bound, Bound] =>
    padding.map((pad, side) => {
      const left = round(pad.value - css[side]!.value);
      return left > 0 ? { value: left } : { value: 0 };
    }) as unknown as readonly [Bound, Bound, Bound, Bound];
  const layout = occurrence.layout.mode === 'NONE' ? occurrence.layout : { ...occurrence.layout, padding: residual(occurrence.layout.padding) };
  return {
    type: 'FRAME',
    key: `${occurrence.key}/content`,
    name: 'content',
    box: [0, 0, abs[2], abs[3]],
    abs,
    sizing: { h: 'FILL', v: 'FILL' },
    layout,
    fills: [],
    strokes: [],
    clips: false,
    children: occurrence.children.map((child) => ({ ...child, box: rel(child.abs, abs) }) as NodeSpec),
  };
}

export function census(routes: readonly PlannedRoute[], elements: ReadonlyMap<string, RawElement>, frames: ReadonlyMap<string, FrameFacts>, kit: readonly KitEntry[]): Census {
  let trees = routes.map((route) => route.frame);
  const components: ComponentSpec[] = [];
  const instances: Record<string, number> = {};
  const reported: Census['frames'] = [];
  const derived: Census['derived'] = {};
  const mains = new Map<string, VariantSpec>();

  for (const entry of dependencyOrder(routes, elements, kit)) {
    // The occurrences, outermost first, each element's drawings paired across the prints: one nested in another of the same kind stays a frame.
    const paired = new Map<string, { readonly viewport: ViewportName; readonly sides: Partial<Record<PrintName, Side>> }>();
    trees.forEach((tree, at) => {
      const route = routes[at]!;
      const visit = (spec: NodeSpec): void => {
        if (entryOf(spec, elements, kit) === entry) {
          const root = asRoot(spec);
          if (root) {
            // A container's shape is its surface and padding; its content is each occurrence's own.
            const padding = entry.container ? frames.get(root.key)?.padding().map((pad) => round(pad.value)) : null;
            const id = JSON.stringify([pageOf(route), elements.get(spec.key)!.id]);
            const pair = paired.get(id) ?? { viewport: route.viewport, sides: {} };
            pair.sides[route.print] = { spec: root, signature: digest([shapeOf(root, true, false, entry.container ?? false), padding]) };
            paired.set(id, pair);
            return;
          }
        }
        if (spec.type === 'FRAME') spec.children.forEach(visit);
      };
      visit(tree);
    });
    if (paired.size === 0) continue;
    // A print that does not render the element has no side, and no shape in the pair.
    const found: Occurrence[] = [...paired.values()].map(({ viewport, sides }) => ({
      viewport,
      sides,
      values: valuesOf(entry, drawn(sides), elements),
      signature: digest(PRINTS.map((print) => sides[print]?.signature ?? null)),
    }));

    // Glyph values, named by how often they print.
    const glyphAxes = entry.axes.filter((axis) => 'glyph' in axis.from).map((axis) => axis.name);
    for (const axis of glyphAxes) {
      const counts = new Map<string, number>();
      for (const occurrence of found) counts.set(occurrence.values[axis]!, (counts.get(occurrence.values[axis]!) ?? 0) + 1);
      const names = new Map([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value], index) => [value, String(index + 1)]));
      for (const occurrence of found) occurrence.values[axis] = names.get(occurrence.values[axis]!)!;
    }

    // Variants: the axis values, split by viewport only where the viewports draw one variant differently.
    const modal = (list: readonly Occurrence[]): string => shapesOf(list)[0]!;
    const byValues = new Map<string, Occurrence[]>();
    for (const occurrence of found) {
      const id = JSON.stringify(occurrence.values);
      byValues.set(id, [...(byValues.get(id) ?? []), occurrence]);
    }
    for (const list of byValues.values()) complete(list);
    const splitsByViewport = [...byValues.values()].some((list) => {
      const wide = list.filter((one) => one.viewport === 'wide');
      const narrow = list.filter((one) => one.viewport === 'narrow');
      return wide.length > 0 && narrow.length > 0 && modal(wide) !== modal(narrow);
    });
    const byGroup = new Map<string, Group>();
    for (const occurrence of found) {
      const values = splitsByViewport ? { ...occurrence.values, viewport: occurrence.viewport } : occurrence.values;
      const id = JSON.stringify(values);
      const group = byGroup.get(id) ?? { values, list: [] };
      group.list.push(occurrence);
      byGroup.set(id, group);
    }
    const { groups, property } = splitByShape(entry, [...byGroup.values()], elements);
    if (property) derived[entry.name] = property;

    const componentKey = `kit:${entry.name}`;
    const variants: VariantSpec[] = [];
    const replacements = new Map<string, NodeSpec>();
    const rootLocal = localOf(entry.root);
    // A component of one set of values varies by print alone.
    const single = groups.length === 1;
    for (const { values, list } of groups) {
      const shape = modal(list);
      // Every shape a group keeps has its own variant, so an occurrence of another is past the census bounds: each of its drawings stays a frame.
      for (const occurrence of list) {
        if (occurrence.signature === shape) continue;
        for (const spec of drawn(occurrence.sides)) reported.push({ component: entry.name, key: spec.key, reason: `its shape is past the shapes CONFIG.figma.census keeps for a ${entry.name} variant` });
      }
      // The variant's mains come from one pair of its shape, both prints' drawings of one element, where such a pair prints.
      const ofShape = list.filter((occurrence) => occurrence.signature === shape);
      const pair = ofShape.find((occurrence) => PRINTS.every((print) => occurrence.sides[print])) ?? ofShape[0];
      for (const print of PRINTS) {
        // Its main in a print is the pair's drawing there, or another occurrence's of its shape the pair lacks; a print that draws none has no main.
        const representative = pair?.sides[print] ?? ofShape.find((occurrence) => occurrence.sides[print])?.sides[print];
        if (!representative) continue;
        // With one print there is no print axis: the main's values are its own axes alone.
        const axis: Readonly<Record<string, string>> = PRINT_AXIS === null ? {} : { [PRINT_AXIS]: print };
        const printed = { ...values, ...axis };
        const variantKey = `${componentKey}:${digest(printed)}`;
        const origin: readonly [number, number] = [representative.spec.abs[0], representative.spec.abs[1]];
        let root: FrameSpec | SvgSpec;
        if (entry.container && representative.spec.type === 'FRAME') {
          root = containerMain(shift(representative.spec, origin) as FrameSpec, shiftFacts(frames.get(representative.spec.key), origin), variantKey);
        } else {
          const { absolute, grid, visible, opacity, ...bare } = shift(reKey(representative.spec, representative.spec.key, variantKey), origin) as FrameSpec | SvgSpec;
          root = { ...bare, box: [0, 0, bare.box[2], bare.box[3]] } as FrameSpec | SvgSpec;
        }
        const variant: VariantSpec = { key: variantKey, values: single ? axis : printed, root, source: representative.spec.key, texts: [] };
        mains.set(variantKey, variant);

        // Instances of this print's drawings, and the texts their overrides change.
        const varying = new Set<string>();
        for (const occurrence of list) {
          const side = occurrence.sides[print];
          if (!side || occurrence.signature !== shape) continue;
          const overrides: OverrideSpec[] = [];
          let slots: InstanceSpec['slots'];
          const main = entry.container ? null : (reKey(representative.spec, representative.spec.key, variantKey) as FrameSpec | SvgSpec);
          if (main) overridesOf(main, side.spec, '', mains, overrides);
          else if (side.spec.type === 'FRAME' && representative.spec.type === 'FRAME') {
            const surface: OverrideSpec = { part: '', ...surfaceOf(representative.spec, side.spec) };
            if (Object.keys(surface).length > 1) overrides.push(surface);
            slots = { [`${variantKey}/content`]: [contentOf(side.spec, frames.get(side.spec.key))] };
          }
          for (const override of overrides) if (override.characters !== undefined && !override.part.includes(' > ')) varying.add(override.part);
          const { spec } = side;
          const instance: InstanceSpec = {
            type: 'INSTANCE',
            key: spec.key,
            name: spec.name,
            box: spec.box,
            abs: spec.abs,
            sizing: spec.type !== 'FRAME' ? { h: 'FIXED', v: 'FIXED' } : entry.container ? heldOf(spec.sizing) : spec.sizing,
            ...(spec.absolute ? { absolute: spec.absolute } : {}),
            ...(spec.grid ? { grid: spec.grid } : {}),
            ...(spec.visible !== undefined ? { visible: spec.visible } : {}),
            ...(spec.opacity ? { opacity: spec.opacity } : {}),
            ...(spec.part ? { part: spec.part } : {}),
            component: variantKey,
            overrides,
            ...(slots ? { slots } : {}),
          };
          replacements.set(spec.key, instance);
          instances[variantKey] = (instances[variantKey] ?? 0) + 1;
        }
        // One variant's text properties. A name variants share is one property of the set where they give it one value; the plugin binds a variant that differs to its own.
        const taken = new Set<string>();
        const texts = [...walk(root)].flatMap((node) => (node.type === 'TEXT' && varying.has(node.key) ? [{ part: node.key, property: propertyName(node, rootLocal, taken), value: node.characters }] : []));
        variants.push({ ...variant, texts });
        mains.set(variantKey, { ...variant, texts });
      }
    }

    trees = trees.map((tree) => mapTree(tree, (node) => replacements.get(node.key)) as FrameSpec);
    const spec: Omit<ComponentSpec, 'hash'> = {
      key: componentKey,
      name: entry.name,
      group: entry.group,
      description: entry.description,
      source: { export: entry.source.symbol, file: entry.source.file },
      variants,
    };
    components.push({ ...spec, hash: digest(spec) });
  }
  return { components, routes: routes.map((route, at) => ({ ...route, frame: trees[at]! })), instances, frames: reported, derived };
}

const shiftFacts = (facts: FrameFacts | undefined, [x, y]: readonly [number, number]): FrameFacts | undefined =>
  facts ? { ...facts, content: [facts.content[0] - x, facts.content[1] - y, facts.content[2], facts.content[3]] } : undefined;
