/**
 * The acceptance lines on tiny plans and reports: each line passes what it
 * proves, fails what it disproves, and stays unproven where the two do not
 * carry what it needs.
 *
 *   node --test scripts/design/figma-print/check.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  boxesLine,
  cellIn,
  comparable,
  contextOf,
  counted,
  instancesLine,
  keysLine,
  layoutLine,
  orderLine,
  paintsLine,
  purityLine,
  repeatLine,
  spanOf,
  textLine,
  trackSizes,
  type Context,
  type Line,
} from './check/lines.mts';
import { heldOnRoutes } from './check/census.mts';
import { bundleOf as readBundle, printOf } from './check/read.mts';
import { markdownOf, summaryOf } from './check/render.mts';
import { collectionOf } from './plan/prints.mts';
import { PROTOCOL, type Box, type ComponentSpec, type FrameSpec, type InstanceSpec, type NodeSpec, type PaintSpec, type PlanBundle, type PrintReport, type SvgSpec, type TextSpec } from './plan/schema.mts';

type Printed = PrintReport['nodes'][number];
type Unit = PrintReport['units'][number];

const ROUTE = '/|wide|design';
const BOUND = { rgba: [0, 0, 0, 1], variable: 'ink' } as const;
const MEASURED = { rgba: [0.2, 0.4, 0.6, 1] } as const;

const frame = (key: string, abs: Box, children: readonly NodeSpec[] = [], extra: Partial<FrameSpec> = {}): FrameSpec => ({
  type: 'FRAME',
  key,
  name: key,
  box: abs,
  abs,
  sizing: { h: 'FIXED', v: 'FIXED' },
  layout: { mode: 'NONE' },
  fills: [],
  strokes: [],
  clips: false,
  children,
  ...extra,
});

const text = (key: string, abs: Box, extra: Partial<TextSpec> = {}): TextSpec => ({
  type: 'TEXT',
  key,
  name: key,
  box: abs,
  abs,
  sizing: { h: 'HUG', v: 'HUG' },
  characters: 'שלום',
  style: 'body',
  fills: [{ type: 'SOLID', color: BOUND }],
  align: 'RIGHT',
  resize: 'WIDTH_AND_HEIGHT',
  lines: 1,
  ...extra,
});

const instance = (key: string, abs: Box, component: string, extra: Partial<InstanceSpec> = {}): InstanceSpec => ({
  type: 'INSTANCE',
  key,
  name: key,
  box: abs,
  abs,
  sizing: { h: 'FIXED', v: 'FIXED' },
  component,
  overrides: [],
  ...extra,
});

const drawing = (key: string, abs: Box): SvgSpec => ({ type: 'SVG', key, name: key, box: abs, abs, sizing: { h: 'FIXED', v: 'FIXED' }, svg: '<svg/>', colors: [], layers: [] });

/** A component of hand-made variants, each drawn from an occurrence on the route frame unless it names its own. */
const component = (
  key: string,
  variants: readonly { readonly key: string; readonly root: FrameSpec | SvgSpec; readonly values?: Readonly<Record<string, string>>; readonly source?: string }[]
): ComponentSpec => ({
  key,
  name: key.replace(/^kit:/, ''),
  group: 'tile',
  description: '',
  source: { export: key, file: 'apps/web/src/kit.tsx' },
  hash: 'h',
  variants: variants.map(({ values = {}, source = `${ROUTE}/${key}`, ...variant }) => ({ ...variant, values, source, texts: [] })),
});

/** The plan's census: the occurrences made instances per variant, and the ones kept as frames. */
const censusOf = (instances: Readonly<Record<string, number>> = {}, frames: PlanBundle['report']['frames'] = []): PlanBundle['report'] => ({
  instances,
  frames,
  derived: {},
  unbound: 0,
  approximated: [],
  layouts: {},
  misses: {},
  drift: {},
  conflicts: {},
});

const bundleOf = (route: FrameSpec, extra: Partial<PlanBundle> = {}): PlanBundle => ({
  protocol: PROTOCOL,
  revision: 'r1',
  complete: true,
  stamp: { commit: 'c0ffee', buildId: null, measuredAt: '2026-10-28T09:00:00.000Z', base: 'http://localhost:3602' },
  file: { fileKey: 'F', pages: [], pageLimit: 3, tolerance: 1, boxed: ['Bento.tile'], sliceMs: 40, receiver: 'http://localhost:4719' },
  collections: [],
  textStyles: [{ key: 'body', name: 'Body', family: 'Heebo', weight: 400, italic: false, size: 16, lineHeight: 24, letterSpacing: 0 }],
  effectStyles: [],
  components: [],
  routes: [{ key: ROUTE, route: '/', group: 'Home', viewport: 'wide', print: 'design', absent: [], hash: 'h', frame: route }],
  fonts: [],
  report: censusOf(),
  ...extra,
});

/** A report node where the plan put it, or where `extra` moves it. */
const at = (spec: NodeSpec, extra: Partial<Printed> = {}): Printed => ({
  key: spec.key,
  unit: ROUTE,
  type: spec.type === 'SVG' ? 'FRAME' : spec.type,
  box: spec.abs,
  ...(spec.type === 'INSTANCE' ? { instanceOf: spec.component } : {}),
  ...(spec.type === 'TEXT' ? { textStyle: spec.style } : {}),
  ...extra,
});

/** Every node of a plan where the plan put it. */
const all = (...specs: readonly NodeSpec[]): Printed[] => specs.map((spec) => at(spec));

const reportOf = (nodes: readonly Printed[], extra: Partial<PrintReport> = {}): PrintReport => ({
  protocol: PROTOCOL,
  revision: 'r1',
  printer: 'p1',
  fileKey: 'F',
  startedAt: '2026-10-28T10:00:00.000Z',
  finishedAt: '2026-10-28T10:01:00.000Z',
  units: [],
  nodes,
  read: [],
  impure: [],
  strays: [],
  fallbacks: [],
  missingFonts: [],
  errors: [],
  ...extra,
});

const unit = (kind: Unit['kind'], key: string, status: Unit['status']): Unit => ({ kind, key, status, ms: 1 });

const run = (check: (context: Context) => Line, bundle: PlanBundle, report: PrintReport, previous: PrintReport | null = null): Line => check(contextOf(bundle, report, previous));

const offendersOf = (line: Line): string[] => line.evidence.flatMap((evidence) => (evidence.offenders ?? []).map((offender) => offender.key));

describe('F1, every plan key printed once', () => {
  const a = frame(`${ROUTE}/a`, [0, 0, 50, 50]);
  const b = text(`${ROUTE}/b`, [50, 0, 50, 24]);
  const route = frame(ROUTE, [0, 0, 100, 100], [a, b]);

  it('passes when every key is printed exactly once', () => {
    assert.equal(run(keysLine, bundleOf(route), reportOf(all(route, a, b))).status, 'PASS');
  });

  it('names the keys missing, repeated and unknown', () => {
    const result = run(keysLine, bundleOf(route), reportOf([at(route), at(a), at(a), { key: 'stray', unit: ROUTE, type: 'FRAME', box: [0, 0, 1, 1] }]));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [b.key, a.key, 'stray']);
  });

  it('lets a report name a component without requiring it', () => {
    const root = frame('kit:Tile:v1', [0, 0, 40, 40]);
    const bundle = bundleOf(route, { components: [component('kit:Tile', [{ key: root.key, root }])] });
    assert.equal(run(keysLine, bundle, reportOf([...all(route, a, b, root), { key: 'kit:Tile', unit: 'kit:Tile', type: 'COMPONENT_SET', box: [0, 0, 40, 40] }])).status, 'PASS');
  });

  it('fails a plan that names one key twice', () => {
    const twice = frame(ROUTE, [0, 0, 100, 100], [a, a]);
    assert.equal(run(keysLine, bundleOf(twice), reportOf(all(twice, a))).status, 'FAIL');
  });
});

describe('F2, figure parts and instances at their measured boxes', () => {
  const tile = frame(`${ROUTE}/tile`, [10, 10, 200, 100], [], { part: 'Bento.tile' });
  const loose = frame(`${ROUTE}/loose`, [0, 200, 10, 10]);
  const route = frame(ROUTE, [0, 0, 400, 400], [tile, loose]);

  it('passes a tile within the tolerance, and ignores a frame no line holds', () => {
    const result = run(boxesLine, bundleOf(route), reportOf([at(route), at(tile, { box: [10.8, 10, 200, 100] }), at(loose, { box: [50, 50, 10, 10] })]));
    assert.equal(result.status, 'PASS');
  });

  it('fails a tile further than the tolerance', () => {
    const result = run(boxesLine, bundleOf(route), reportOf([at(route), at(tile, { box: [11.5, 10, 200, 100] }), at(loose)]));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [tile.key]);
  });

  it('cannot prove a tile the report lacks', () => {
    assert.equal(run(boxesLine, bundleOf(route), reportOf(all(route, loose))).status, 'UNPROVEN');
  });

  it('does not compare a hidden tile', () => {
    const hidden = frame(`${ROUTE}/tile`, [10, 10, 200, 100], [], { part: 'Bento.tile', visible: false });
    const bundle = bundleOf(frame(ROUTE, [0, 0, 400, 400], [hidden]));
    const result = run(boxesLine, bundle, reportOf([at(route), at(hidden, { box: [0, 0, 0, 0] })]));
    assert.equal(result.status, 'PASS');
    assert.match(result.evidence.map((evidence) => evidence.text).join(' '), /1 hidden, not compared/);
  });

  it('holds every instance to its box', () => {
    const one = instance(`${ROUTE}/pill`, [0, 0, 30, 20], 'kit:Pill:v1');
    const bundle = bundleOf(frame(ROUTE, [0, 0, 100, 100], [one]));
    assert.equal(run(boxesLine, bundle, reportOf([at(route), at(one, { box: [0, 3, 30, 20] })])).status, 'FAIL');
  });
});

describe('F3, text at its measured width and line count', () => {
  const two = text(`${ROUTE}/lede`, [0, 0, 300, 48], { lines: 2, resize: 'HEIGHT' });
  const route = frame(ROUTE, [0, 0, 400, 400], [two]);

  it('passes text whose height holds its lines', () => {
    assert.equal(run(textLine, bundleOf(route), reportOf(all(route, two))).status, 'PASS');
  });

  it('fails text that wraps to another line count', () => {
    const result = run(textLine, bundleOf(route), reportOf([at(route), at(two, { box: [0, 0, 300, 72] })]));
    assert.equal(result.status, 'FAIL');
    assert.match(result.evidence.flatMap((evidence) => evidence.offenders ?? []).map((offender) => offender.detail).join(), /3 lines for 2/);
  });

  it('fails text wider than the tolerance', () => {
    assert.equal(run(textLine, bundleOf(route), reportOf([at(route), at(two, { box: [0, 0, 302, 48] })])).status, 'FAIL');
  });

  it('passes a single line Figma sets wider on the edge that holds it, and fails one moved off its edges', () => {
    const line = text(`${ROUTE}/label`, [100, 0, 60, 24], { resize: 'WIDTH_AND_HEIGHT' });
    const bundle = bundleOf(frame(ROUTE, [0, 0, 400, 400], [line]));
    const at400 = frame(ROUTE, [0, 0, 400, 400], [line]);
    assert.equal(run(textLine, bundle, reportOf([at(at400), at(line, { box: [97, 0, 63, 24] })])).status, 'PASS');
    assert.equal(run(textLine, bundle, reportOf([at(at400), at(line, { box: [110, 0, 64, 24] })])).status, 'FAIL');
  });

  it('reads the lines of a text held at a height from the height they took', () => {
    const held = reportOf([at(route), at(two)], { fallbacks: [{ key: two.key, from: 'HEIGHT', to: 'NONE 300 x 48', miss: 24, linesHeight: 72 }] });
    assert.equal(run(textLine, bundleOf(route), held).status, 'FAIL');
  });

  it('reads a text held at its minimum height by its own lines', () => {
    const tall = text(`${ROUTE}/title`, [0, 0, 300, 48], { resize: 'HEIGHT', minHeight: 48 });
    const titled = frame(ROUTE, [0, 0, 400, 400], [tall]);
    assert.equal(run(textLine, bundleOf(titled), reportOf(all(titled, tall))).status, 'PASS');
  });

  it('reads a normal line height as 1.2 times the size', () => {
    const small = text(`${ROUTE}/note`, [0, 0, 100, 24], { style: 'note', lines: 2 });
    const bundle = bundleOf(frame(ROUTE, [0, 0, 400, 400], [small]), {
      textStyles: [{ key: 'note', name: 'Note', family: 'Assistant', weight: 400, italic: false, size: 10, lineHeight: null, letterSpacing: 0 }],
    });
    assert.equal(run(textLine, bundle, reportOf(all(route, small))).status, 'PASS');
  });

  it('cannot prove text whose style the plan lacks', () => {
    const lost = text(`${ROUTE}/lost`, [0, 0, 100, 24], { style: 'gone' });
    assert.equal(run(textLine, bundleOf(frame(ROUTE, [0, 0, 400, 400], [lost])), reportOf(all(route, lost))).status, 'UNPROVEN');
  });
});

describe('F4, raw paints only where the plan measured them, and text styles', () => {
  const measured = frame(`${ROUTE}/wash`, [0, 0, 10, 10], [], { fills: [{ type: 'SOLID', color: MEASURED }] });
  const bound = frame(`${ROUTE}/ink`, [0, 10, 10, 10], [], { fills: [{ type: 'SOLID', color: BOUND }] });
  const label = text(`${ROUTE}/label`, [0, 20, 10, 24]);
  const route = frame(ROUTE, [0, 0, 100, 100], [measured, bound, label]);

  it('passes raw paints on a measured colour and styled text', () => {
    assert.equal(run(paintsLine, bundleOf(route), reportOf([at(route), at(measured, { rawPaints: 1 }), at(bound), at(label)])).status, 'PASS');
  });

  it('fails raw paints where every colour is bound', () => {
    const result = run(paintsLine, bundleOf(route), reportOf([at(route), at(measured), at(bound, { rawPaints: 1 }), at(label)]));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [bound.key]);
  });

  it('fails text with no text style, or another one', () => {
    const bare: Printed = { key: label.key, unit: ROUTE, type: 'TEXT', box: label.abs };
    assert.equal(run(paintsLine, bundleOf(route), reportOf([at(route), at(measured), at(bound), bare])).status, 'FAIL');
    assert.equal(run(paintsLine, bundleOf(route), reportOf([at(route), at(measured), at(bound), at(label, { textStyle: 'display' })])).status, 'FAIL');
  });

  it('accepts a run style on mixed text', () => {
    const mixed = text(`${ROUTE}/mixed`, [0, 0, 10, 24], { runs: [{ start: 0, end: 2, style: 'strong' }] });
    const bundle = bundleOf(frame(ROUTE, [0, 0, 100, 100], [mixed]));
    assert.equal(run(paintsLine, bundle, reportOf([at(route), at(mixed, { textStyle: 'strong' })])).status, 'PASS');
  });

  it('cannot prove raw paints on an imported drawing', () => {
    const glyph = drawing(`${ROUTE}/glyph`, [0, 0, 12, 12]);
    const bundle = bundleOf(frame(ROUTE, [0, 0, 100, 100], [glyph]));
    assert.equal(run(paintsLine, bundle, reportOf([at(route), at(glyph, { rawPaints: 2 })])).status, 'UNPROVEN');
  });

  it('lets an instance carry what its main component measured', () => {
    const root = frame('kit:Chip:v1', [0, 0, 20, 10], [], { fills: [{ type: 'SOLID', color: MEASURED }] });
    const chip = instance(`${ROUTE}/chip`, [0, 0, 20, 10], root.key);
    const bundle = bundleOf(frame(ROUTE, [0, 0, 100, 100], [chip]), { components: [component('kit:Chip', [{ key: root.key, root }])] });
    assert.equal(run(paintsLine, bundle, reportOf([at(route), at(chip, { rawPaints: 1 }), at(root)])).status, 'PASS');
  });
});

describe('F5, instances per variant against the census', () => {
  const pillRoot = frame('kit:Pill:v1', [0, 0, 30, 20]);
  const nested = instance('kit:Tile:v1/pill', [5, 5, 30, 20], pillRoot.key);
  const tileRoot = frame('kit:Tile:v1', [0, 0, 100, 60], [nested]);
  const components = [component('kit:Pill', [{ key: pillRoot.key, root: pillRoot }]), component('kit:Tile', [{ key: tileRoot.key, root: tileRoot }])];
  const tiles = [instance(`${ROUTE}/tile`, [0, 0, 100, 60], tileRoot.key), instance(`${ROUTE}/tile#1`, [0, 70, 100, 60], tileRoot.key)];
  const pill = instance(`${ROUTE}/pill`, [0, 140, 30, 20], pillRoot.key);
  const route = frame(ROUTE, [0, 0, 200, 200], [...tiles, pill]);
  // Three pills on the route: one of its own, and one inside each tile.
  const census = { [pillRoot.key]: 3, [tileRoot.key]: 2 };
  const bundle = bundleOf(route, { components, report: censusOf(census) });
  const printed = all(route, ...tiles, pill, pillRoot, nested, tileRoot);

  it('passes when the file holds the census, nested instances counted', () => {
    assert.equal(run(instancesLine, bundle, reportOf(printed)).status, 'PASS');
  });

  it('fails a detached instance', () => {
    const result = run(instancesLine, bundle, reportOf(printed.map((node) => (node.key === pill.key ? { ...node, type: 'FRAME', instanceOf: undefined } : node))));
    assert.equal(result.status, 'FAIL');
    assert.ok(offendersOf(result).includes(pill.key));
  });

  it('fails an instance of another main component', () => {
    const result = run(instancesLine, bundle, reportOf(printed.map((node) => (node.key === pill.key ? { ...node, instanceOf: tileRoot.key } : node))));
    assert.equal(result.status, 'FAIL');
  });

  it('fails a census the route frames do not hold', () => {
    const more = bundleOf(route, { components, report: censusOf({ ...census, [pillRoot.key]: 4 }) });
    assert.equal(run(instancesLine, more, reportOf(printed)).status, 'FAIL');
  });

  it('lists the occurrences kept as frames without failing them', () => {
    const kept = bundleOf(route, { components, report: censusOf(census, [{ component: 'Tile', key: `${ROUTE}/odd`, reason: 'its shape differs' }]) });
    const result = run(instancesLine, kept, reportOf(printed));
    assert.equal(result.status, 'PASS');
    assert.ok(offendersOf(result).includes(`${ROUTE}/odd`));
  });
});

describe('F5, the census through swaps', () => {
  const meterA = frame('kit:Meter:a', [0, 0, 10, 10]);
  const meterB = frame('kit:Meter:b', [0, 0, 10, 10]);
  const rowV = frame('kit:Row:v', [0, 0, 50, 10], [instance('kit:Row:v/meter', [0, 0, 10, 10], meterA.key)]);
  const rowW = frame('kit:Row:w', [0, 0, 50, 10], [instance('kit:Row:w/meter', [0, 0, 10, 10], meterA.key)]);
  const swapped = instance('kit:Panel:p/row', [0, 0, 50, 10], rowV.key, { overrides: [{ part: 'kit:Row:v/meter', swap: meterB.key }] });
  const panel = frame('kit:Panel:p', [0, 0, 60, 20], [swapped]);
  const components = [
    component('kit:Meter', [
      { key: meterA.key, root: meterA },
      { key: meterB.key, root: meterB },
    ]),
    component('kit:Row', [
      { key: rowV.key, root: rowV },
      { key: rowW.key, root: rowW },
    ]),
    component('kit:Panel', [{ key: panel.key, root: panel }]),
  ];
  const variants = new Map(components.flatMap((one) => one.variants.map((variant) => [variant.key, variant] as const)));
  const held = (...onRoutes: readonly InstanceSpec[]): Record<string, number> => Object.fromEntries([...heldOnRoutes(variants, onRoutes)].toSorted(([a], [b]) => a.localeCompare(b)));

  it('counts the variant an instance swaps its nested instance to', () => {
    const row = instance(`${ROUTE}/row`, [0, 0, 50, 10], rowV.key, { overrides: [{ part: 'kit:Row:v/meter', swap: meterB.key }] });
    const route = frame(ROUTE, [0, 0, 100, 100], [row]);
    const printed = all(route, row, rowV, ...rowV.children, rowW, ...rowW.children, meterA, meterB);
    const census = (instances: Readonly<Record<string, number>>): PlanBundle => bundleOf(route, { components: components.slice(0, 2), report: censusOf(instances) });
    assert.equal(run(instancesLine, census({ [rowV.key]: 1, [meterB.key]: 1 }), reportOf(printed)).status, 'PASS');
    const unswapped = run(instancesLine, census({ [rowV.key]: 1, [meterA.key]: 1 }), reportOf(printed));
    assert.equal(unswapped.status, 'FAIL');
    assert.deepEqual(offendersOf(unswapped), [meterA.key, meterB.key]);
  });

  it("keeps a nested instance's own swap, unless the outer instance lands on that part or swaps the nested instance", () => {
    const keeps = instance(`${ROUTE}/panel`, [0, 0, 60, 20], panel.key);
    const lands = instance(`${ROUTE}/panel#1`, [0, 30, 60, 20], panel.key, { overrides: [{ part: 'kit:Panel:p/row > kit:Row:v/meter', fills: [] }] });
    const swaps = instance(`${ROUTE}/panel#2`, [0, 60, 60, 20], panel.key, { overrides: [{ part: 'kit:Panel:p/row', swap: rowW.key }] });
    assert.deepEqual(held(keeps), { [meterB.key]: 1, [panel.key]: 1, [rowV.key]: 1 });
    assert.deepEqual(held(lands), { [meterA.key]: 1, [panel.key]: 1, [rowV.key]: 1 });
    assert.deepEqual(held(swaps), { [meterA.key]: 1, [panel.key]: 1, [rowW.key]: 1 });
  });

  it('follows a swap two instances deep, keyed in the swapped-in main', () => {
    const deep = instance(`${ROUTE}/panel`, [0, 0, 60, 20], panel.key, {
      overrides: [
        { part: 'kit:Panel:p/row', swap: rowW.key },
        { part: 'kit:Panel:p/row > kit:Row:w/meter', swap: meterB.key },
      ],
    });
    assert.deepEqual(held(deep), { [meterB.key]: 1, [panel.key]: 1, [rowW.key]: 1 });
  });

  it('counts a main that holds itself once, rather than looping', () => {
    const loop = frame('kit:Loop:l', [0, 0, 10, 10], [instance('kit:Loop:l/self', [0, 0, 10, 10], 'kit:Loop:l')]);
    const looped = new Map([['kit:Loop:l', { key: 'kit:Loop:l', values: {}, root: loop, source: `${ROUTE}/loop`, texts: [] }]]);
    assert.deepEqual(Object.fromEntries(heldOnRoutes(looped, [instance(`${ROUTE}/loop`, [0, 0, 10, 10], 'kit:Loop:l')])), { 'kit:Loop:l': 2 });
  });
});

describe('F6, rows read left to right and grid children sit in their cells', () => {
  const first = frame(`${ROUTE}/row/a`, [0, 0, 50, 20]);
  const second = frame(`${ROUTE}/row/b`, [60, 0, 50, 20]);
  const mark = frame(`${ROUTE}/row/mark`, [0, 0, 8, 8], [], { absolute: { h: 'MAX', v: 'MIN' } });
  const row = frame(`${ROUTE}/row`, [0, 0, 110, 20], [first, second, mark], {
    layout: { mode: 'HORIZONTAL', padding: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }], gap: { value: 10 }, primary: 'MAX', counter: 'MIN', strokesIncluded: false, reverseZ: true },
  });
  const rowRoute = frame(ROUTE, [0, 0, 200, 200], [row]);

  it('passes a row printed in plan order, out-of-flow children aside', () => {
    assert.equal(run(orderLine, bundleOf(rowRoute), reportOf([...all(rowRoute, row, first, second), at(mark, { box: [100, 0, 8, 8] })])).status, 'PASS');
  });

  it('fails a row printed mirrored', () => {
    const result = run(orderLine, bundleOf(rowRoute), reportOf([...all(rowRoute, row, mark), at(first, { box: [60, 0, 50, 20] }), at(second, { box: [0, 0, 50, 20] })]));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [row.key]);
  });

  const right = frame(`${ROUTE}/grid/start`, [110, 0, 100, 50], [], { grid: { row: 0, col: 1, rowSpan: 1, colSpan: 1, h: 'MIN', v: 'MIN' } });
  const grid = frame(`${ROUTE}/grid`, [0, 0, 210, 50], [right], {
    layout: {
      mode: 'GRID',
      padding: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
      cols: [
        { type: 'FLEX', value: 1 },
        { type: 'FLEX', value: 1 },
      ],
      rows: [{ type: 'FIXED', value: 50 }],
      colGap: { value: 10 },
      rowGap: { value: 0 },
      strokesIncluded: false,
    },
  });
  const gridRoute = frame(ROUTE, [0, 0, 300, 300], [grid]);

  it('passes a grid child in the column its cell gives, counted from the left', () => {
    assert.equal(run(orderLine, bundleOf(gridRoute), reportOf(all(gridRoute, grid, right))).status, 'PASS');
  });

  it('fails a grid child printed in the mirrored column', () => {
    const result = run(orderLine, bundleOf(gridRoute), reportOf([...all(gridRoute, grid), at(right, { box: [0, 0, 100, 50] })]));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [right.key]);
  });

  it('cannot place a grid child when the grid is not in the report', () => {
    assert.equal(run(orderLine, bundleOf(gridRoute), reportOf(all(gridRoute, right))).status, 'UNPROVEN');
  });

  it('shares free space among flex tracks by weight', () => {
    assert.deepEqual(trackSizes([{ type: 'FLEX', value: 4 }, { type: 'FLEX', value: 5 }, { type: 'FLEX', value: 4 }], 0, 1300), [400, 500, 400]);
    assert.deepEqual(trackSizes([{ type: 'FIXED', value: 100 }, { type: 'FLEX', value: 1 }, { type: 'HUG', value: 40 }], 10, 300), [100, 140, 40]);
    assert.deepEqual(spanOf([100, 100, 100], 10, 1, 2), { start: 110, end: 320 });
    assert.equal(spanOf([100], 10, 1, 1), null);
  });

  it('measures a cell inside the padding, and inside the stroke when it is in the layout', () => {
    if (grid.layout.mode !== 'GRID') throw new Error('the fixture is a grid');
    const padded = { ...grid.layout, padding: [{ value: 5 }, { value: 0 }, { value: 0 }, { value: 20 }], strokesIncluded: true } as const;
    const stroked = { ...grid, strokeWeights: [{ value: 2 }, { value: 2 }, { value: 2 }, { value: 2 }] } as const satisfies FrameSpec;
    assert.deepEqual(cellIn(stroked, padded, { row: 0, col: 0, rowSpan: 1, colSpan: 1, h: 'MIN', v: 'MIN' }, [0, 0, 234, 50]), { x: { start: 22, end: 122 }, y: { start: 7, end: 57 } });
  });
});

describe('F7, printing unchanged plans changes nothing', () => {
  const route = frame(ROUTE, [0, 0, 10, 10]);
  const units = (status: Unit['status']): Unit[] => [unit('preflight', 'preflight', 'built'), unit('variables', 'variables', 'unchanged'), unit('route', ROUTE, status)];

  it('stays unproven with no earlier print', () => {
    assert.equal(run(repeatLine, bundleOf(route), reportOf([], { units: units('unchanged') })).status, 'UNPROVEN');
  });

  it('passes when every plan unit is unchanged, the preflight aside', () => {
    assert.equal(run(repeatLine, bundleOf(route), reportOf([], { units: units('unchanged') }), reportOf([], { units: units('built') })).status, 'PASS');
  });

  it('fails a unit printed again', () => {
    const result = run(repeatLine, bundleOf(route), reportOf([], { units: units('built') }), reportOf([], { units: units('built') }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [`route ${ROUTE}`]);
  });

  it('cannot prove a unit the earlier print failed', () => {
    assert.equal(run(repeatLine, bundleOf(route), reportOf([], { units: units('built') }), reportOf([], { units: units('failed') })).status, 'UNPROVEN');
  });
});

describe('F8, each print pure', () => {
  const WIRE = '/|wide|wire';
  const ink = (variable: string): readonly PaintSpec[] => [{ type: 'SOLID', color: { rgba: [0, 0, 0, 1], variable } }];
  const collections = [
    { key: 'press', name: 'Press', variables: [{ key: 'np/ink', name: 'np/ink', type: 'COLOR', value: { kind: 'color', rgba: [0, 0, 0, 1] }, scopes: [] }] },
    {
      key: collectionOf('design'),
      name: 'Bento',
      variables: [
        { key: 'ink', name: 'ink', type: 'COLOR', value: { kind: 'alias', key: 'np/ink' }, scopes: ['ALL_FILLS'] },
        { key: 'type/lede', name: 'type/lede', type: 'FLOAT', value: { kind: 'float', value: 20 }, scopes: ['FONT_SIZE'] },
      ],
    },
    { key: collectionOf('wire'), name: 'Bento wire', variables: [{ key: 'wire:ink', name: 'ink', type: 'COLOR', value: { kind: 'alias', key: 'ink' }, scopes: ['ALL_FILLS'] }] },
  ] as const satisfies PlanBundle['collections'];
  const designChip = frame('kit:Chip:design', [0, 0, 20, 10], [], { fills: ink('ink') });
  const wireChip = frame('kit:Chip:wire', [0, 0, 20, 10], [], { fills: ink('wire:ink') });
  const chipOf = (design: FrameSpec = designChip): ComponentSpec =>
    component('kit:Chip', [
      { key: design.key, root: design, values: { print: 'design' }, source: `${ROUTE}/chip` },
      { key: wireChip.key, root: wireChip, values: { print: 'wire' }, source: `${WIRE}/chip` },
    ]);
  const chip = chipOf();
  const designOf = (...children: readonly NodeSpec[]): FrameSpec => frame(ROUTE, [0, 0, 100, 100], [instance(`${ROUTE}/chip`, [0, 0, 20, 10], designChip.key), ...children], { fills: ink('ink') });
  const wireOf = (...children: readonly NodeSpec[]): FrameSpec => frame(WIRE, [0, 0, 100, 100], [instance(`${WIRE}/chip`, [0, 0, 20, 10], wireChip.key), ...children], { fills: ink('wire:ink') });
  /** The page's two frames; `wireOnly` names the elements, below the route key, only the wire print renders. */
  const planOf = (design: FrameSpec, wire: FrameSpec, extra: Partial<PlanBundle> = {}, wireOnly: readonly string[] = []): PlanBundle =>
    bundleOf(design, {
      collections,
      components: [chip],
      routes: [
        { key: ROUTE, route: '/', group: 'Home', viewport: 'wide', print: 'design', absent: wireOnly, hash: 'h', frame: design },
        { key: WIRE, route: '/', group: 'Home', viewport: 'wide', print: 'wire', absent: [], hash: 'h', frame: wire },
      ],
      ...extra,
    });
  const units = [unit('route', ROUTE, 'built'), unit('route', WIRE, 'built'), unit('component', chip.key, 'unchanged')];
  const read = [ROUTE, WIRE, chip.key];

  it('passes when the file and the plan bind each print to its own collection', () => {
    const result = run(purityLine, planOf(designOf(), wireOf()), reportOf([], { units, read }));
    assert.equal(result.status, 'PASS');
    assert.match(result.evidence[0]?.text ?? '', /^3 of 3 units read in the printed file, with 0 bindings across the prints and 0 layers of the other print; 4 of 4 planned bindings in 2 frames and 2 mains/);
  });

  it('fails a binding across the prints, or to Press directly, read from the printed file', () => {
    const impure = [
      { unit: WIRE, node: `${WIRE}/chip`, field: 'fills[0].color', collection: collectionOf('design') },
      { unit: ROUTE, node: `${ROUTE}/chip`, field: 'strokes[0].color', collection: 'press' },
    ];
    const result = run(purityLine, planOf(designOf(), wireOf()), reportOf([], { units, read, impure }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [`${WIRE}/chip`, `${ROUTE}/chip`]);
  });

  it('fails a wire frame that binds a Bento key, and a design frame that binds Press directly', () => {
    const rule = frame(`${WIRE}/rule`, [0, 20, 100, 1], [], { fills: ink('ink') });
    const raw = frame(`${ROUTE}/raw`, [0, 20, 100, 1], [], { fills: ink('np/ink') });
    const result = run(purityLine, planOf(designOf(raw), wireOf(rule)), reportOf([], { units, read }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [raw.key, rule.key]);
  });

  it('reads bindings through overrides and text styles', () => {
    const recoloured = instance(`${ROUTE}/chip#1`, [0, 20, 20, 10], designChip.key, { overrides: [{ part: '', fills: ink('wire:ink') }] });
    const lede = text(`${WIRE}/lede`, [0, 40, 100, 28], { style: 'lede', fills: ink('wire:ink') });
    const textStyles = [{ key: 'lede', name: 'Lede', family: 'Heebo', weight: 400, italic: false, size: 20, lineHeight: 28, letterSpacing: 0, bind: { fontSize: 'type/lede' } }];
    const result = run(purityLine, planOf(designOf(recoloured), wireOf(lede), { textStyles }), reportOf([], { units, read }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [recoloured.key, lede.key]);
  });

  it("fails an instance that shows the other print's variant", () => {
    const borrowed = instance(`${ROUTE}/chip#1`, [0, 20, 20, 10], wireChip.key);
    const result = run(purityLine, planOf(designOf(borrowed), wireOf()), reportOf([], { units, read }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [borrowed.key]);
  });

  it('fails a design frame, and a design main, that hold a layer only the wire print renders, keyed as the design print keys it', () => {
    // The wire print alone renders the mark, inside the chip and beside it: planned into the design print, it is keyed under the design route.
    const mark = frame(`${ROUTE}/mark`, [0, 20, 10, 10], [frame(`${ROUTE}/mark::before`, [0, 20, 4, 4])]);
    const marked = frame(designChip.key, [0, 0, 20, 10], [frame(`${designChip.key}/mark`, [0, 0, 4, 4])], { fills: ink('ink') });
    const bundle = planOf(designOf(mark), wireOf(frame(`${WIRE}/mark`, [0, 20, 10, 10])), { components: [chipOf(marked)] }, ['/mark', '/chip/mark']);
    const result = run(purityLine, bundle, reportOf([], { units, read }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [mark.key, `${ROUTE}/mark::before`, `${designChip.key}/mark`]);
  });

  it('fails a layer only the other print renders, read from the printed file', () => {
    const strays = [{ unit: ROUTE, node: `${ROUTE}/mark` }];
    const result = run(purityLine, planOf(designOf(), wireOf()), reportOf([], { units, read, strays }));
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(offendersOf(result), [`${ROUTE}/mark`]);
  });

  it('cannot prove a unit the printed file did not give in full, though every unit printed and no binding was found', () => {
    const errors = [{ key: 'F', message: 'the purity of the prints could not be read: the file went away' }];
    const result = run(purityLine, planOf(designOf(), wireOf()), reportOf([], { units, read: [], errors }));
    assert.equal(result.status, 'UNPROVEN');
    assert.deepEqual(offendersOf(result), read);
    assert.equal(run(purityLine, planOf(designOf(), wireOf()), reportOf([], { units, read: [ROUTE, WIRE] })).status, 'UNPROVEN');
  });

  it('cannot prove a main that names no print, or whose source no route frame holds', () => {
    const unnamed = component('kit:Chip', [{ key: designChip.key, root: designChip, source: `${ROUTE}/chip` }]);
    const lost = component('kit:Tag', [{ key: 'kit:Tag:design', root: frame('kit:Tag:design', [0, 0, 10, 10]), values: { print: 'design' }, source: '/gone|wide|design/tag' }]);
    const result = run(purityLine, planOf(designOf(), frame(WIRE, [0, 0, 100, 100], [], { fills: ink('wire:ink') }), { components: [unnamed, lost] }), reportOf([], { units, read: [...read, lost.key] }));
    assert.equal(result.status, 'UNPROVEN');
    assert.deepEqual(offendersOf(result), [designChip.key, 'kit:Tag:design']);
  });
});

describe('F9, Figma’s layout as modelled holds the measurement', () => {
  const route = frame(ROUTE, [0, 0, 10, 10]);
  const planned = (report: Partial<PlanBundle['report']>): PlanBundle => {
    const bundle = bundleOf(route);
    return { ...bundle, report: { ...bundle.report, ...report } };
  };

  it('passes a plan with no drift and no sizing conflict', () => {
    assert.equal(run(layoutLine, planned({}), reportOf([])).status, 'PASS');
  });

  it('fails a plan whose layout model drifts or conflicts, naming the nodes', () => {
    const drifting = run(layoutLine, planned({ drift: { 'design · roster GRID > member': 69 } }), reportOf([]));
    assert.equal(drifting.status, 'FAIL');
    assert.ok(JSON.stringify(drifting.evidence).includes('roster GRID > member'));
    assert.equal(run(layoutLine, planned({ conflicts: { 'wire · hug without content · wrapper': 1 } }), reportOf([])).status, 'FAIL');
  });
});

describe('the plan index and the inputs', () => {
  it('refuses a report of another revision or file', () => {
    const bundle = bundleOf(frame(ROUTE, [0, 0, 1, 1]));
    assert.equal(comparable(bundle, reportOf([])), null);
    assert.match(comparable(bundle, reportOf([], { revision: 'r0' })) ?? '', /revision r0/);
    assert.match(comparable(bundle, reportOf([], { fileKey: 'other' })) ?? '', /file other/);
  });

  it('reads JSON into a bundle and a report only when their shapes hold', () => {
    const bundle = bundleOf(frame(ROUTE, [0, 0, 1, 1]));
    assert.equal(readBundle(JSON.parse(JSON.stringify(bundle))).ok, true);
    assert.equal(readBundle({ ...bundle, routes: 'none' }).ok, false);
    const unprinted = readBundle({ ...bundle, routes: bundle.routes.map(({ print: _, ...route }) => route) });
    assert.match(unprinted.ok ? '' : unprinted.error, /routes\[0\]/);
    const unplaced = readBundle({ ...bundle, routes: bundle.routes.map(({ absent: _, ...route }) => route) });
    assert.match(unplaced.ok ? '' : unplaced.error, /routes\[0\]/);
    const root = frame('kit:Tile:v1', [0, 0, 40, 40]);
    const sourceless = component('kit:Tile', [{ key: root.key, root }]).variants.map(({ source: _, ...variant }) => variant);
    const unsourced = readBundle({ ...bundle, components: [{ ...component('kit:Tile', [{ key: root.key, root }]), variants: sourceless }] });
    assert.match(unsourced.ok ? '' : unsourced.error, /variants\[0\]/);
    assert.equal(printOf(JSON.parse(JSON.stringify(reportOf(all(frame(ROUTE, [0, 0, 1, 1])))))).ok, true);
    const broken = printOf({ ...reportOf([]), nodes: [{ key: 'x', unit: ROUTE, type: 'FRAME', box: [0, 0, 1] }] });
    assert.equal(broken.ok, false);
    assert.match(broken.ok ? '' : broken.error, /nodes\[0\]/);
  });

  it('refuses a report that names one print for its file, or lacks its purity read', () => {
    const { impure: _, ...unread } = reportOf([]);
    const named = printOf({ ...reportOf([]), print: 'design' });
    assert.match(named.ok ? '' : named.error, /names one print/);
    const missing = printOf(unread);
    assert.match(missing.ok ? '' : missing.error, /impure bindings/);
    const bad = printOf({ ...reportOf([]), impure: [{ unit: ROUTE, node: 'x', field: 'fills' }] });
    assert.match(bad.ok ? '' : bad.error, /impure\[0\]/);
    const { strays: __, ...strayless } = reportOf([]);
    assert.equal(printOf(strayless).ok, false);
    const unkeyed = printOf({ ...reportOf([]), read: [ROUTE, 3] });
    assert.match(unkeyed.ok ? '' : unkeyed.error, /purity read/);
    const loose = printOf({ ...reportOf([]), strays: [{ unit: ROUTE }] });
    assert.match(loose.ok ? '' : loose.error, /strays\[0\]/);
  });

  it('renders every line, with its offenders, for people and the terminal', () => {
    const route = frame(ROUTE, [0, 0, 100, 100], [frame(`${ROUTE}/a`, [0, 0, 10, 10])]);
    const bundle = bundleOf(route);
    const report = reportOf(all(route));
    const lines = [keysLine, boxesLine].map((check) => run(check, bundle, report));
    const page = markdownOf({ bundle, report, path: 'latest.json', previous: null }, lines);
    assert.match(page, /\| F1 \| FAIL \|/);
    assert.match(page, /`\/\|wide\|design\/a`/);
    assert.match(summaryOf(lines).join('\n'), /missing from the report \(1\): \/\|wide\|design\/a/);
  });

  it('counts one thing in the singular and any other number in the plural', () => {
    assert.equal(counted(1, 'grid child', 'grid children'), '1 grid child');
    assert.equal(counted(0, 'grid child', 'grid children'), '0 grid children');
    const lone = frame(ROUTE, [0, 0, 1, 1]);
    const pair = frame(ROUTE, [0, 0, 100, 100], [frame(`${ROUTE}/a`, [0, 0, 10, 10])]);
    assert.match(run(keysLine, bundleOf(lone), reportOf(all(lone))).evidence[0]?.text ?? '', /^1 plan key,/);
    assert.match(run(keysLine, bundleOf(pair), reportOf(all(pair))).evidence[0]?.text ?? '', /^2 plan keys,/);
    const page = markdownOf({ bundle: bundleOf(lone), report: reportOf(all(lone)), path: 'latest.json', previous: null }, []);
    assert.match(page, /It lists 1 node, 0 layout fallbacks, 0 missing fonts and 0 errors\./);
  });
});
