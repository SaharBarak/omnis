/**
 * The component census (docs/redesign/FIGMA_PRINT.md §7) on planned trees built by
 * hand: which occurrences become instances, of which variant, and the
 * overrides that turn each main into its occurrence, with each route printed
 * as a design frame and a wire frame.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../config.mjs';
import type { KitEntry } from '../kit.mts';
import { census, type Census, type PlannedRoute } from './components.mts';
import type { RawElement } from './raw.mts';
import type { Box, EffectSpec, FrameSpec, InstanceSpec, NodeSpec, PrintName, TextSpec, VariantSpec } from './schema.mts';

const PRINTS = CONFIG.prints as readonly PrintName[];
const FIXED = { h: 'FIXED', v: 'FIXED' } as const;
const SHADOW: EffectSpec = { type: 'DROP_SHADOW', color: { rgba: [0, 0, 0, 0.25] }, offset: [0, 2], radius: 8, spread: 0 };

const frame = (key: string, box: Box, children: NodeSpec[] = [], extra: Partial<FrameSpec> = {}): FrameSpec => ({
  type: 'FRAME',
  key,
  name: key.split('/').pop()!,
  box,
  abs: box,
  sizing: FIXED,
  layout: { mode: 'NONE' },
  fills: [],
  strokes: [],
  clips: false,
  children,
  ...extra,
});

const text = (key: string, box: Box, characters: string): TextSpec => ({
  type: 'TEXT',
  key,
  name: key.split('/').pop()!,
  box,
  abs: box,
  sizing: FIXED,
  characters,
  style: 'type|Assistant|400|n|16|24|0||',
  fills: [],
  align: 'RIGHT',
  resize: 'NONE',
  lines: 1,
});

/** A subtree with each child's box made relative to its parent, as the planner writes it; built with page boxes. */
function relative(spec: NodeSpec, parent: Box = [0, 0, 0, 0]): NodeSpec {
  const box: Box = [spec.abs[0] - parent[0], spec.abs[1] - parent[1], spec.abs[2], spec.abs[3]];
  return spec.type === 'FRAME' ? { ...spec, box, children: spec.children.map((child) => relative(child, spec.abs)) } : { ...spec, box };
}

const nodesOf = (spec: NodeSpec): NodeSpec[] => [spec, ...(spec.type === 'FRAME' ? spec.children.flatMap(nodesOf) : [])];

/**
 * One route printed twice, each print one page frame under its route key, and
 * the elements that name each layer's CSS-module part. `draw` lays out a
 * print's layers under the key it is given; a layer's element is its key past
 * that one, so the two prints of a layer print one element. `parts` and `data`
 * are by element.
 */
function routeOf(
  draw: (at: string, print: PrintName) => NodeSpec[],
  parts: Readonly<Record<string, string>>,
  data: Readonly<Record<string, Readonly<Record<string, string>>>> = {}
): { routes: PlannedRoute[]; elements: Map<string, RawElement> } {
  const elements = new Map<string, RawElement>();
  const routes = PRINTS.map((print): PlannedRoute => {
    const key = `r|wide|${print}`;
    const page = relative(frame(key, [0, 0, 1000, 1000], draw(key, print))) as FrameSpec;
    for (const node of nodesOf(page)) {
      const id = node.key.slice(key.length + 1);
      const part = parts[id];
      if (!part) continue;
      const [module, local] = part.split('.');
      elements.set(node.key, { id, parent: null, index: 0, at: 0, tag: 'div', cls: [`${module}_${local}__abcde`], data: data[id] ?? {}, attrs: {}, box: [0, 0, 0, 0] });
    }
    return { key, viewport: 'wide', print, frame: page };
  });
  return { routes, elements };
}

const entry = (name: string, root: string, extra: Partial<KitEntry> = {}): KitEntry => ({ name, group: 'molecule', description: name, source: { file: 'x.tsx', symbol: name, kind: 'export' }, root, axes: [], ...extra });

const instances = (spec: NodeSpec): InstanceSpec[] => (spec.type === 'INSTANCE' ? [spec] : spec.type === 'FRAME' ? spec.children.flatMap(instances) : []);

/** A print's route frame after the census. */
const frameIn = (kit: Census, print: PrintName): FrameSpec => kit.routes.find((route) => route.print === print)!.frame;

const variantsOf = (kit: Census, name: string): readonly VariantSpec[] => kit.components.find((component) => component.name === name)!.variants;

const byPrint = (variants: readonly VariantSpec[], print: PrintName): VariantSpec[] => variants.filter((variant) => variant.values['print'] === print);

describe('shape', () => {
  it('leaves effects to an override: a card without the shadow is an instance that removes it', () => {
    const card = (key: string, x: number, shadow: boolean): FrameSpec => frame(key, [x, 0, 100, 50], [text(`${key}/title`, [x + 10, 10, 80, 24], 'כותרת')], shadow ? { effects: [SHADOW] } : {});
    const { routes, elements } = routeOf((at) => [card(`${at}/a`, 0, true), card(`${at}/b`, 200, true), card(`${at}/c`, 400, false)], { a: 'Kit.card', b: 'Kit.card', c: 'Kit.card' });
    const kit = census(routes, elements, new Map(), [entry('Card', 'Kit.card')]);
    assert.deepEqual(kit.frames, []);
    for (const print of PRINTS) {
      const placed = instances(frameIn(kit, print));
      assert.equal(placed.length, 3);
      assert.deepEqual(placed.find((one) => one.key === `r|wide|${print}/c`)?.overrides, [{ part: '', effects: [] }]);
    }
  });
});

describe('containers', () => {
  it('hold the length an occurrence hugs, as the main only fills its slot', () => {
    const column = { mode: 'VERTICAL', padding: [{ value: 8 }, { value: 8 }, { value: 8 }, { value: 8 }], gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: false, reverseZ: false } as const;
    const tile = (key: string, x: number, lines: number): FrameSpec =>
      frame(key, [x, 0, 200, 16 + lines * 24], [text(`${key}/body`, [x + 8, 8, 184, lines * 24], 'שורה')], { layout: column, sizing: { h: 'FILL', v: 'HUG' } });
    const { routes, elements } = routeOf((at) => [tile(`${at}/a`, 0, 1), tile(`${at}/b`, 300, 3)], { a: 'Kit.tile', b: 'Kit.tile' });
    const kit = census(routes, elements, new Map(), [entry('Tile', 'Kit.tile', { container: true })]);
    for (const print of PRINTS) {
      assert.deepEqual(
        instances(frameIn(kit, print)).map((one) => [one.key, one.sizing.h, one.sizing.v, one.box[3]]),
        [
          [`r|wide|${print}/a`, 'FILL', 'FIXED', 40],
          [`r|wide|${print}/b`, 'FILL', 'FIXED', 88],
        ]
      );
    }
  });
});

describe('derived variants', () => {
  it('split a group whose shapes one part tells apart, named after the part', () => {
    const pill = (key: string, x: number, live: boolean): FrameSpec =>
      frame(key, [x, 0, 80, 30], [text(`${key}/label`, [x + 10, 3, 40, 24], 'דף'), ...(live ? [frame(`${key}/dot`, [x + 60, 11, 8, 8])] : [])]);
    const parts = { a: 'Kit.pill', b: 'Kit.pill', c: 'Kit.pill', 'c/dot': 'Kit.dot' };
    const { routes, elements } = routeOf((at) => [pill(`${at}/a`, 0, false), pill(`${at}/b`, 100, false), pill(`${at}/c`, 200, true)], parts);
    const kit = census(routes, elements, new Map(), [entry('Pill', 'Kit.pill')]);
    assert.deepEqual(kit.frames, []);
    assert.deepEqual(kit.derived, { Pill: 'dot' });
    assert.deepEqual(
      variantsOf(kit, 'Pill')
        .map((variant) => variant.values)
        .sort((a, b) => `${a['dot']} ${a['print']}`.localeCompare(`${b['dot']} ${b['print']}`)),
      [
        { dot: 'false', print: 'design' },
        { dot: 'false', print: 'wire' },
        { dot: 'true', print: 'design' },
        { dot: 'true', print: 'wire' },
      ]
    );
  });

  it('name shapes no part tells apart by their signature, and keep a frame past the bound', () => {
    // One row more than a group keeps, each its own padding: the last prints as a frame in both prints.
    const { shapesPerGroup } = CONFIG.figma.census;
    const row = (key: string, y: number, pad: number): FrameSpec =>
      frame(key, [0, y, 300, 40], [text(`${key}/label`, [pad, y + 8, 100, 24], 'שורה')], {
        layout: { mode: 'HORIZONTAL', padding: [{ value: 8 }, { value: pad }, { value: 8 }, { value: pad }], gap: { value: 0 }, primary: 'MAX', counter: 'MIN', strokesIncluded: false, reverseZ: false },
      });
    const ids = Array.from({ length: shapesPerGroup + 1 }, (_, at) => `row${at}`);
    const { routes, elements } = routeOf(
      (at) => ids.map((id, index) => row(`${at}/${id}`, index * 50, 10 + index * 2)),
      Object.fromEntries(ids.map((id) => [id, 'Kit.row']))
    );
    const kit = census(routes, elements, new Map(), [entry('Row', 'Kit.row')]);
    assert.deepEqual(kit.derived, { Row: 'form' });
    for (const print of PRINTS) assert.equal(byPrint(variantsOf(kit, 'Row'), print).length, shapesPerGroup);
    assert.ok(variantsOf(kit, 'Row').every((variant) => /^[0-9a-f]{6}$/.test(variant.values['form'] ?? '')));
    assert.equal(kit.frames.length, PRINTS.length);
  });
});

describe('pairs', () => {
  const pill = (key: string, x: number, dot: boolean): FrameSpec =>
    frame(key, [x, 0, 80, 30], [text(`${key}/label`, [x + 10, 3, 40, 24], 'דף'), ...(dot ? [frame(`${key}/dot`, [x + 60, 11, 8, 8])] : [])]);
  const pillParts = { a: 'Kit.pill', b: 'Kit.pill', c: 'Kit.pill', 'a/dot': 'Kit.dot', 'b/dot': 'Kit.dot', 'c/dot': 'Kit.dot' };

  it('make a component whose wire drawing lacks a child one variant, with a design main and a wire main', () => {
    const { routes, elements } = routeOf((at, print) => ['a', 'b', 'c'].map((id, index) => pill(`${at}/${id}`, index * 100, print === 'design')), pillParts);
    const kit = census(routes, elements, new Map(), [entry('Pill', 'Kit.pill')]);
    assert.deepEqual(kit.frames, []);
    assert.deepEqual(kit.derived, {});
    const variants = variantsOf(kit, 'Pill');
    assert.deepEqual(
      variants.map((variant) => variant.values),
      PRINTS.map((print) => ({ print }))
    );
    const layers = (print: PrintName): number => (byPrint(variants, print)[0]!.root as FrameSpec).children.length;
    assert.deepEqual([layers('design'), layers('wire')], [2, 1]);
  });

  it('give a component only the design print draws a design main only', () => {
    const halo = (key: string): FrameSpec => frame(key, [500, 0, 40, 40]);
    const { routes, elements } = routeOf((at, print) => [pill(`${at}/a`, 0, false), ...(print === 'design' ? [halo(`${at}/h`)] : [])], { a: 'Kit.pill', h: 'Kit.halo' });
    const kit = census(routes, elements, new Map(), [entry('Pill', 'Kit.pill'), entry('Halo', 'Kit.halo')]);
    const [only, ...more] = variantsOf(kit, 'Halo');
    assert.deepEqual([only?.values, more], [{ print: 'design' }, []]);
    assert.deepEqual(
      PRINTS.map((print) => instances(frameIn(kit, print)).filter((one) => one.component === only!.key).length),
      [1, 0]
    );
    assert.deepEqual(
      variantsOf(kit, 'Pill').map((variant) => variant.values),
      PRINTS.map((print) => ({ print }))
    );
  });

  it('make an element one print leaves out an instance of its twins’ variant, not a variant of its own', () => {
    const { routes, elements } = routeOf((at, print) => ['a', 'b', 'c'].flatMap((id, index) => (print === 'wire' && id === 'c' ? [] : [pill(`${at}/${id}`, index * 100, false)])), pillParts);
    const kit = census(routes, elements, new Map(), [entry('Pill', 'Kit.pill')]);
    assert.deepEqual([kit.frames, kit.derived], [[], {}]);
    const variants = variantsOf(kit, 'Pill');
    assert.equal(variants.length, PRINTS.length);
    assert.deepEqual(
      PRINTS.map((print) => instances(frameIn(kit, print)).every((one) => one.component === byPrint(variants, print)[0]!.key)),
      [true, true]
    );
    assert.deepEqual(
      PRINTS.map((print) => kit.instances[byPrint(variants, print)[0]!.key]),
      [3, 2]
    );
  });

  it('draw a variant’s mains in both prints from one element, though an element one print leaves out comes first', () => {
    const { routes, elements } = routeOf((at, print) => ['a', 'b', 'c'].flatMap((id, index) => (print === 'wire' && id === 'a' ? [] : [pill(`${at}/${id}`, index * 100, false)])), pillParts);
    const kit = census(routes, elements, new Map(), [entry('Pill', 'Kit.pill')]);
    const variants = variantsOf(kit, 'Pill');
    assert.deepEqual(
      PRINTS.map((print) => byPrint(variants, print)[0]?.source),
      PRINTS.map((print) => `r|wide|${print}/b`)
    );
  });

  it('put a wire frame’s instances, and those nested in a wire main, on wire variants', () => {
    const atom = (key: string, x: number): FrameSpec => frame(key, [x, 0, 60, 20], [text(`${key}/label`, [x + 5, 0, 50, 20], 'א')]);
    const molecule = (key: string, x: number): FrameSpec => frame(key, [x, 0, 100, 30], [atom(`${key}/atom`, x + 20)]);
    const { routes, elements } = routeOf((at) => [atom(`${at}/z`, 600), molecule(`${at}/m`, 0)], { z: 'Kit.atom', m: 'Kit.molecule', 'm/atom': 'Kit.atom' });
    const kit = census(routes, elements, new Map(), [entry('Atom', 'Kit.atom'), entry('Molecule', 'Kit.molecule')]);
    const printOf = new Map(kit.components.flatMap((component) => component.variants.map((variant) => [variant.key, variant.values['print']] as const)));
    for (const print of PRINTS) {
      const placed = instances(frameIn(kit, print));
      assert.equal(placed.length, 2);
      assert.ok(placed.every((one) => printOf.get(one.component) === print));
      const nested = instances(byPrint(variantsOf(kit, 'Molecule'), print)[0]!.root);
      assert.equal(nested.length, 1);
      assert.equal(printOf.get(nested[0]!.component), print);
    }
  });

  it('count derived-variant bounds on pairs, not on drawings', () => {
    // Every row its own padding in the design print, all alike in the wire print: as many shapes as rows, one past the bound.
    const { shapesPerGroup } = CONFIG.figma.census;
    const row = (key: string, y: number, pad: number): FrameSpec =>
      frame(key, [0, y, 300, 40], [text(`${key}/label`, [pad, y + 8, 100, 24], 'שורה')], {
        layout: { mode: 'HORIZONTAL', padding: [{ value: 8 }, { value: pad }, { value: 8 }, { value: pad }], gap: { value: 0 }, primary: 'MAX', counter: 'MIN', strokesIncluded: false, reverseZ: false },
      });
    const ids = Array.from({ length: shapesPerGroup + 1 }, (_, at) => `row${at}`);
    const { routes, elements } = routeOf(
      (at, print) => ids.map((id, index) => row(`${at}/${id}`, index * 50, print === 'design' ? 10 + index * 2 : 10)),
      Object.fromEntries(ids.map((id) => [id, 'Kit.row']))
    );
    const kit = census(routes, elements, new Map(), [entry('Row', 'Kit.row')]);
    const variants = variantsOf(kit, 'Row');
    const forms = (print: PrintName): string[] => byPrint(variants, print).map((variant) => variant.values['form']!).sort();
    assert.equal(forms('design').length, shapesPerGroup);
    assert.deepEqual(forms('wire'), forms('design'));
    // The pair past the bound stays a frame in both prints: one element, its design and its wire drawing.
    const kept = kit.frames.map((one) => one.key);
    assert.equal(kept.length, PRINTS.length);
    assert.deepEqual(new Set(kept.map((key) => key.slice(key.indexOf('/')))).size, 1);
  });
});

describe('nested overrides', () => {
  it('undo a swap the main’s nested instance carries, where the occurrence shows the default', () => {
    // A glyph in two shapes, an atom holding one, and a molecule holding an atom. The atom's main shows a star; the
    // molecule's main is built from an occurrence whose atom shows a dot, so it carries that swap.
    const glyph = (key: string, x: number): FrameSpec => frame(key, [x, 5, 10, 10]);
    const atom = (key: string, x: number): FrameSpec => frame(key, [x, 0, 60, 20], [glyph(`${key}/glyph`, x + 5)]);
    const molecule = (key: string, x: number): FrameSpec => frame(key, [x, 0, 100, 30], [atom(`${key}/atom`, x + 20)]);
    const shapes: Record<string, string> = { 'z/glyph': 'star', 'a/atom/glyph': 'dot', 'b/atom/glyph': 'dot', 'c/atom/glyph': 'star' };
    const parts: Record<string, string> = { z: 'Kit.atom', ...Object.fromEntries(Object.keys(shapes).map((id) => [id, 'Kit.glyph'])) };
    for (const id of ['a', 'b', 'c']) Object.assign(parts, { [id]: 'Kit.molecule', [`${id}/atom`]: 'Kit.atom' });
    const { routes, elements } = routeOf(
      (at) => [atom(`${at}/z`, 600), molecule(`${at}/a`, 0), molecule(`${at}/b`, 200), molecule(`${at}/c`, 400)],
      parts,
      Object.fromEntries(Object.entries(shapes).map(([id, shape]) => [id, { shape }]))
    );
    const kit = census(routes, elements, new Map(), [
      entry('Glyph', 'Kit.glyph', { axes: [{ name: 'shape', from: { data: 'shape' }, fallback: 'star' }] }),
      entry('Atom', 'Kit.atom'),
      entry('Molecule', 'Kit.molecule'),
    ]);
    assert.deepEqual(kit.frames, []);
    for (const print of PRINTS) {
      const star = byPrint(variantsOf(kit, 'Glyph'), print).find((variant) => variant.values['shape'] === 'star')!;
      const plain = instances(frameIn(kit, print)).find((one) => one.key === `r|wide|${print}/c`)!;
      assert.equal(plain.overrides.length, 1, JSON.stringify(plain.overrides));
      assert.equal(plain.overrides[0]!.swap, star.key);
      assert.match(plain.overrides[0]!.part, / > /);
    }
  });
});
