/**
 * The layout derivation (docs/redesign/FIGMA_PRINT.md §5) on measured pages built by
 * hand: each case is one rule, a right-to-left box with the geometry Chrome
 * gives it, and the auto layout the planner must write for it; and the two
 * prints (§6), each planned from its own print and bound to its own
 * collection.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planPage, renderedBy, type PageContext } from './nodes.mts';
import { projectionOf, type RawBinding, type RawElement, type RawKid, type RawPage, type RawPrint, type RawPrintNode, type RawPseudo } from './raw.mts';
import type { Box, CollectionSpec, FrameSpec, NodeSpec, PrintName } from './schema.mts';
import { EffectStyles } from './effects.mts';
import { layOut } from './figma-layout.mts';
import { Variables } from './tokens.mts';
import { TextStyles, facesOf } from './type.mts';

type Style = Readonly<Record<string, string>>;

interface Element {
  readonly tag?: string;
  readonly cls?: readonly string[];
  readonly box: Box;
  readonly style?: Style;
  readonly kids?: readonly (Element | Text)[];
  readonly keywords?: Readonly<Record<string, string>>;
  readonly bind?: Readonly<Record<string, RawBinding>>;
  /** Its painting `::before` and `::after` boxes, as the measure reads them in both prints. */
  readonly pseudo?: readonly RawPseudo[];
  /** What one print renders otherwise: its own style over `style`. */
  readonly in?: Partial<Record<PrintName, Style>>;
}

interface Text {
  readonly text: string;
  readonly lines: readonly Box[];
}

const SIDES = ['top', 'right', 'bottom', 'left'];

/** A computed style with every property at its initial value, as the walker reads it, in a right-to-left page. */
const BASE: Style = {
  display: 'block',
  position: 'static',
  direction: 'rtl',
  'box-sizing': 'border-box',
  'z-index': 'auto',
  float: 'none',
  ...Object.fromEntries(SIDES.map((side) => [side, 'auto'])),
  ...Object.fromEntries(SIDES.flatMap((side) => [`margin-${side}`, `padding-${side}`, `border-${side}-width`].map((prop) => [prop, '0px']))),
  ...Object.fromEntries(SIDES.map((side) => [`border-${side}-style`, 'none'])),
  'flex-direction': 'row',
  'flex-wrap': 'nowrap',
  'flex-grow': '0',
  'justify-content': 'normal',
  'align-items': 'normal',
  'align-content': 'normal',
  'align-self': 'auto',
  'justify-items': 'normal',
  'justify-self': 'auto',
  'row-gap': 'normal',
  'column-gap': 'normal',
  'grid-template-columns': 'none',
  'grid-template-rows': 'none',
  'grid-auto-flow': 'row',
  'grid-column-start': 'auto',
  'grid-column-end': 'auto',
  'grid-row-start': 'auto',
  'grid-row-end': 'auto',
  'overflow-x': 'visible',
  'overflow-y': 'visible',
  'clip-path': 'none',
  'background-color': 'rgba(0, 0, 0, 0)',
  'background-image': 'none',
  'box-shadow': 'none',
  opacity: '1',
  visibility: 'visible',
  transform: 'none',
  'mix-blend-mode': 'normal',
  filter: 'none',
  'backdrop-filter': 'none',
  color: 'rgb(25, 24, 22)',
  'font-family': 'Assistant',
  'font-size': '16px',
  'font-weight': '400',
  'font-style': 'normal',
  'line-height': '24px',
  'letter-spacing': 'normal',
  'text-align': 'start',
  'text-transform': 'none',
  'white-space': 'normal',
  'text-overflow': 'clip',
  '-webkit-line-clamp': 'none',
};

const PRINTS: readonly PrintName[] = ['design', 'wire'];

/** The stage's tokens in both prints, unless a case gives a print its own. */
const TOKENS: Style = { '--np-ink': '#191816', '--np-shadow-soft': '0 1px 2px #14110e0d' };

function pageOf(root: Element, tokens: Partial<Record<PrintName, Style>>): RawPage {
  const prints = Object.fromEntries(PRINTS.map((print) => [print, { styles: [] as Style[], nodes: {} as Record<string, RawPrintNode>, pseudo: {} as Record<string, readonly RawPseudo[]> }]));
  let next = 0;
  const build = (element: Element, parent: string | null, index: number, at: number): RawElement => {
    const id = String(next++);
    for (const print of PRINTS) {
      const { styles, nodes, pseudo } = prints[print]!;
      styles.push({ ...BASE, ...element.style, ...element.in?.[print] });
      nodes[id] = { s: styles.length - 1, ...(element.keywords ? { keywords: element.keywords } : {}), ...(element.bind ? { bind: element.bind } : {}) };
      if (element.pseudo) pseudo[id] = element.pseudo;
    }
    let elements = 0;
    const kids: RawKid[] = (element.kids ?? []).map((kid, kidAt) => ('text' in kid ? { text: kid.text, at: kidAt, lines: kid.lines } : build(kid, id, elements++, kidAt)));
    return { id, parent, index, at, tag: element.tag ?? 'div', cls: element.cls ?? [], data: {}, attrs: {}, box: element.box, ...(kids.length > 0 ? { kids } : {}) };
  };
  const tree = build(root, null, 0, 0);
  const printOf = (print: PrintName): RawPrint => ({ ...prints[print]!, tokens: { ...TOKENS, ...tokens[print] } });
  return {
    route: '/test',
    viewport: 'wide',
    size: [1440, 900],
    stamp: { commit: 'test', dirty: [], base: 'http://localhost', buildId: null, measuredAt: '2026-01-01T00:00:00.000Z' },
    lang: 'he',
    dir: 'rtl',
    page: [1440, 900],
    settled: { design: true, wire: true },
    restless: { design: 0, wire: 0 },
    geometry: { moved: 0, maxDelta: 0, samples: [] },
    reads: { design: { misses: 0, errors: 0, samples: [] }, wire: { misses: 0, errors: 0, samples: [] } },
    fonts: [{ family: 'Assistant', weight: '400', style: 'normal' }],
    tree,
    prints: { design: printOf('design'), wire: printOf('wire') },
  };
}

/** One print's route frame, the misses noted, and the nodes Figma's layout, as modelled, puts off their measured box. */
interface Plan {
  readonly frame: FrameSpec;
  readonly misses: Readonly<Record<string, number>>;
  readonly drift: readonly string[];
}

/** The page planned in each print against one library, as the planner plans it, and the library's collections. */
/** The twin table's two prints (testing/twin-table.mts), which these cases read by name. */
function planPrints(root: Element, tokens: Partial<Record<PrintName, Style>> = {}): { readonly design: Plan; readonly wire: Plan; readonly collections: readonly CollectionSpec[] } {
  const page = pageOf(root, tokens);
  const vars = new Variables([page]);
  const type = new TextStyles();
  const effects = new EffectStyles([page]);
  const planned = PRINTS.map((print): Plan => {
    const context: PageContext = {
      page: projectionOf(page, print),
      viewport: 'wide',
      vars: vars.in(print),
      type,
      effects,
      faces: facesOf(page.fonts),
      notes: { approximated: [], layouts: {}, misses: {} },
      elements: new Map(),
      frames: new Map(),
    };
    const frame = planPage(context, `r|wide|${print}`);
    return { frame, misses: context.notes.misses, drift: layOut(frame, 0.75).drift.map((one) => `${one.key} want ${one.want} got ${one.got}`) };
  });
  return { design: planned[0]!, wire: planned[1]!, collections: vars.build() };
}

/** The design print's plan, where a case is about layout alone. */
const plan = (root: Element): Plan => planPrints(root).design;

const named = (spec: NodeSpec, name: string): NodeSpec[] => [...(spec.name === name ? [spec] : []), ...(spec.type === 'FRAME' ? spec.children.flatMap((child) => named(child, name)) : [])];

const frameOf = (spec: NodeSpec | undefined): FrameSpec => {
  assert.ok(spec && spec.type === 'FRAME', `expected a frame, got ${spec?.type}`);
  return spec;
};

/** An element of a CSS module, which names its layer after its local class. */
const item = (local: string, box: Box, style: Style = {}, extra: Partial<Element> = {}): Element => ({ cls: [`Test_${local}__abcde`], box, style, ...extra });

describe('grids', () => {
  it('pack their tracks from the right edge in a right-to-left grid', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 400, 100],
      style: { display: 'grid', 'grid-template-columns': '100px 100px', 'grid-template-rows': '100px', 'column-gap': '0px' },
      kids: [item('first', [300, 0, 100, 100]), item('second', [200, 0, 100, 100])],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.equal(frame.layout.mode, 'GRID');
    assert.deepEqual(
      frame.children.map((child) => [child.name, child.grid?.col]),
      [
        ['first', 1],
        ['second', 0],
      ]
    );
    // Figma starts the tracks at the left padding edge: the space they leave on the left is padding.
    assert.ok(frame.layout.mode === 'GRID');
    assert.equal(frame.layout.padding[3].value, 200);
  });

  it('spread the free space between tracks as space-between does', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 400, 50],
      style: { display: 'grid', 'grid-template-columns': '100px 100px', 'grid-template-rows': '50px', 'column-gap': '0px', 'justify-content': 'space-between' },
      kids: [item('first', [300, 0, 100, 50]), item('second', [0, 0, 100, 50])],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.ok(frame.layout.mode === 'GRID');
    assert.equal(frame.layout.colGap.value, 200);
  });

  it('give no track to a collapsed auto-fit track, and keep a zero track a child sits in', () => {
    const collapsed = plan({
      box: [0, 0, 212, 50],
      style: { display: 'grid', 'grid-template-columns': '100px 100px 0px', 'grid-template-rows': '50px', 'column-gap': '12px' },
      kids: [item('first', [112, 0, 100, 50]), item('second', [0, 0, 100, 50])],
    });
    assert.deepEqual([collapsed.misses, collapsed.drift], [{}, []]);
    assert.ok(collapsed.frame.layout.mode === 'GRID');
    assert.equal(collapsed.frame.layout.cols.length, 2);
    const filled = plan({
      box: [0, 0, 112, 50],
      style: { display: 'grid', 'grid-template-columns': '100px 0px', 'grid-template-rows': '50px', 'column-gap': '12px' },
      kids: [item('first', [12, 0, 100, 50]), item('empty', [0, 0, 0, 0])],
    });
    assert.deepEqual([filled.misses, filled.drift], [{}, []]);
    assert.ok(filled.frame.layout.mode === 'GRID');
    assert.deepEqual(
      filled.frame.layout.cols.map((track) => [track.type, track.value]),
      [
        ['FIXED', 0],
        ['FLEX', 1],
      ]
    );
  });

  it('read their tracks off the kids the print renders: a zero track only the other print fills collapses', () => {
    const { design, wire } = planPrints({
      box: [0, 0, 112, 50],
      style: { display: 'grid', 'grid-template-columns': '100px 0px', 'grid-template-rows': '50px', 'column-gap': '12px' },
      kids: [item('first', [12, 0, 100, 50]), item('mark', [0, 0, 0, 0], {}, { in: { design: { display: 'none' } } })],
    });
    assert.deepEqual([design.drift, wire.drift], [[], []]);
    assert.ok(design.frame.layout.mode === 'GRID' && wire.frame.layout.mode === 'GRID');
    assert.deepEqual([design.frame.layout.cols.length, wire.frame.layout.cols.length], [1, 2]);
  });

  it('stack items that share a cell, pinned where they align', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 200, 100],
      style: { display: 'grid', 'grid-template-columns': '200px', 'grid-template-rows': '100px' },
      kids: ['a', 'b'].map((cls) => item(cls, [0, 0, 200, 100], { 'grid-row-start': '1', 'grid-column-start': '1' })),
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    const stack = frameOf(frame.children[0]);
    assert.equal(stack.name, 'stack');
    assert.equal(stack.layout.mode, 'NONE');
    assert.deepEqual(
      stack.children.map((child) => child.absolute),
      [
        { h: 'STRETCH', v: 'STRETCH' },
        { h: 'STRETCH', v: 'STRETCH' },
      ]
    );
  });

  it('drop a baseline-aligned item from its cell top as padding', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 200, 30],
      style: { display: 'grid', 'grid-template-columns': '20px 180px', 'grid-template-rows': '30px', 'column-gap': '0px', 'align-items': 'baseline' },
      kids: [item('number', [180, 3, 20, 20]), item('title', [0, 0, 180, 30])],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    const baseline = frameOf(named(frame, 'baseline')[0]);
    assert.ok(baseline.layout.mode === 'VERTICAL');
    assert.equal(baseline.layout.padding[0].value, 3);
    assert.deepEqual(baseline.grid && [baseline.grid.col, baseline.grid.v], [1, 'MIN']);
  });

  it('hold a margin as padding around the item', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 200, 20],
      style: { display: 'grid', 'grid-template-columns': '8px 192px', 'grid-template-rows': '20px', 'column-gap': '0px' },
      kids: [item('dot', [192, 6, 8, 8], { 'margin-top': '6px', height: '8px' }), item('label', [0, 0, 192, 20])],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    const margin = frameOf(named(frame, 'margin')[0]);
    assert.ok(margin.layout.mode === 'VERTICAL');
    assert.equal(margin.layout.padding[0].value, 6);
    assert.deepEqual(margin.abs, [192, 0, 8, 14]);
  });
});

describe('flex lines', () => {
  it('give an auto margin a frame that fills its share, even under one gap', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 100, 82],
      style: { display: 'flex', 'flex-direction': 'column', 'row-gap': '8px' },
      kids: [item('head', [0, 0, 100, 40]), item('foot', [0, 52, 100, 30], {}, { keywords: { 'margin-top': 'auto' } })],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    const auto = frameOf(named(frame, 'auto margin')[0]);
    assert.ok(auto.layout.mode === 'VERTICAL');
    assert.equal(auto.layout.primary, 'MAX');
    assert.equal(auto.sizing.v, 'FILL');
    assert.deepEqual(auto.abs, [0, 48, 100, 34]);
  });

  it('keep the auto margin frame where there is no free space, so a part has one shape', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 100, 78],
      style: { display: 'flex', 'flex-direction': 'column', 'row-gap': '8px' },
      kids: [item('head', [0, 0, 100, 40]), item('foot', [0, 48, 100, 30], {}, { keywords: { 'margin-top': 'auto' } })],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.deepEqual(frameOf(named(frame, 'auto margin')[0]).abs, [0, 48, 100, 30]);
  });

  it('find a wrapping row its lines from margin boxes', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 300, 40],
      style: { display: 'flex', 'flex-wrap': 'wrap', 'column-gap': '16px', 'row-gap': '8px' },
      kids: [item('a', [200, 0, 100, 16]), item('b', [100, 0, 84, 16]), item('link', [244, 14, 56, 36], { 'margin-top': '-10px', 'margin-bottom': '-10px' })],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.equal(named(frame, 'line').length, 2);
    assert.equal(named(frame, 'margin box').length, 1);
  });

  it('give up the auto margin frames when the items they hold differ in size, as Figma shares free space equally', () => {
    const { misses } = plan({
      box: [0, 0, 300, 20],
      style: { display: 'flex' },
      kids: [item('a', [170, 0, 40, 20], {}, { keywords: { 'margin-left': 'auto' } }), item('b', [0, 0, 80, 20], {}, { keywords: { 'margin-left': 'auto' } })],
    });
    assert.deepEqual(Object.keys(misses), ['auto margins · div']);
  });

  it('space a line from its start by its gap where an item grows, as space-between then has no free space to share', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 100, 300],
      style: { display: 'flex', 'flex-direction': 'column', 'justify-content': 'space-between', 'row-gap': '32px' },
      kids: [item('stack', [0, 0, 100, 60]), item('figures', [0, 92, 100, 208], { 'flex-grow': '1' })],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.ok(frame.layout.mode === 'VERTICAL');
    assert.equal(frame.layout.primary, 'MIN');
    assert.equal(frame.layout.gap.value, 32);
    assert.equal(frameOf(named(frame, 'figures')[0]).sizing.v, 'FILL');
  });

  it('start a safe alignment that would overflow', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 100, 20],
      style: { display: 'flex', 'justify-content': 'safe center', 'column-gap': '10px' },
      kids: [item('a', [20, 0, 80, 20]), item('b', [-70, 0, 80, 20])],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.ok(frame.layout.mode === 'HORIZONTAL');
    assert.equal(frame.layout.primary, 'MAX');
  });

  it('span a wrapped anonymous text across the free space', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 200, 48],
      style: { display: 'flex', 'align-items': 'center', 'text-align': 'center' },
      kids: [{ text: 'שתי שורות של טקסט', lines: [[60, 0, 80, 24], [70, 24, 60, 24]] }],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    const text = frame.children[0];
    assert.equal(text?.type, 'TEXT');
    assert.deepEqual(text?.abs, [0, 0, 200, 48]);
  });
});

describe('block stacks', () => {
  it('space uneven children by their margins', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 200, 100],
      kids: [item('head', [0, 0, 200, 20]), item('question', [0, 32, 200, 30], { 'margin-top': '12px' }), item('foot', [0, 82, 200, 18], { 'margin-top': '20px' })],
    });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.ok(frame.layout.mode === 'VERTICAL');
    assert.equal(frame.layout.gap.value, 0);
    assert.deepEqual(
      named(frame, 'margin').map((margin) => (margin.type === 'FRAME' && margin.layout.mode === 'VERTICAL' ? margin.layout.padding[0].value : null)),
      [12, 20]
    );
  });

  it('hold a child a negative margin pulls out of its block in a frame at its margin box', () => {
    const { frame, misses, drift } = plan({
      box: [0, 0, 200, 100],
      kids: [item('viewport', [-4, -4, 208, 108], { 'margin-top': '-4px', 'margin-right': '-4px', 'margin-bottom': '-4px', 'margin-left': '-4px' })],
    });
    assert.deepEqual([misses, drift], [{}, []]);
    const place = frameOf(named(frame, 'margin box')[0]);
    assert.deepEqual(place.abs, [0, 0, 200, 100]);
    assert.deepEqual(place.children.map((child) => child.box), [[-4, -4, 208, 108]]);
  });

  it('keep the text of a moved block in its place: an anonymous box takes none of its parent’s offsets', () => {
    const { misses, drift, frame } = plan({
      box: [0, 4, 100, 24],
      style: { transform: 'matrix(1, 0, 0, 1, 0, 4)', 'padding-top': '2px' },
      kids: [{ text: 'בסדר', lines: [[60, 6, 40, 20]] }],
    });
    assert.deepEqual([misses, drift], [{}, []]);
    assert.equal(named(frame, 'margin box').length, 0);
  });

  it('print a multi-column list as a row of column stacks', () => {
    const right = [0, 20, 40].map((y) => item('entry', [160, y, 140, 20]));
    const left = [0, 20].map((y) => item('entry', [0, y, 140, 20]));
    const { frame, misses, drift } = plan({ tag: 'ul', box: [0, 0, 300, 60], style: { 'column-gap': '20px' }, kids: [...right, ...left] });
    assert.deepEqual(misses, {});
    assert.deepEqual(drift, []);
    assert.ok(frame.layout.mode === 'HORIZONTAL');
    const columns = named(frame, 'column').map(frameOf);
    assert.deepEqual(
      columns.map((column) => [column.key.split('/').pop(), column.abs[0], column.children.length]),
      [
        ['column#1', 0, 2],
        ['column#0', 160, 3],
      ]
    );
  });
});

describe('sizing', () => {
  it('fix a child at its size where its frame hugs only children that fill it, as Figma needs one to hug', () => {
    const { frame, drift } = plan({
      box: [0, 0, 100, 30],
      style: { display: 'grid', 'grid-template-columns': '100px', 'grid-template-rows': '30px' },
      kids: [item('track', [0, 6, 100, 24], { 'margin-top': '6px', height: '24px' })],
    });
    assert.deepEqual(drift, []);
    const margin = frameOf(named(frame, 'margin')[0]);
    assert.notEqual(margin.children[0]?.sizing.v, 'FILL');
  });

  it('let a border take layout space, and not the wire print’s inset ring', () => {
    const ring = plan({ box: [0, 0, 100, 40], style: { display: 'flex', 'padding-top': '8px' }, kids: [item('a', [0, 8, 100, 32])] });
    assert.ok(ring.frame.layout.mode === 'HORIZONTAL');
    assert.equal(ring.frame.layout.strokesIncluded, false);
    const border = plan({ box: [0, 0, 100, 40], style: { display: 'flex', 'border-top-width': '1px', 'border-top-style': 'solid', 'border-top-color': 'rgb(25, 24, 22)' }, kids: [item('a', [0, 1, 100, 39])] });
    assert.ok(border.frame.layout.mode === 'HORIZONTAL');
    assert.equal(border.frame.layout.strokesIncluded, true);
    assert.deepEqual(border.drift, []);
  });
});

describe('bindings', () => {
  it('bind a token mixed with transparency at that share, as the paint opacity', () => {
    const tinted: RawBinding = { value: 'color-mix(in srgb, var(--np-ink) 12%, transparent)', chains: [['--np-ink']] };
    const { frame } = plan({
      box: [0, 0, 100, 20],
      style: { 'background-color': 'rgba(25, 24, 22, 0.12)' },
      bind: { 'background-color': tinted },
    });
    const fill = frame.fills[0];
    assert.ok(fill && fill.type === 'SOLID');
    assert.equal(fill.color.variable, '--np-ink');
    assert.equal(fill.color.tint, 0.12);
  });

  it('bind each gradient stop through its own declared stop: a tint at its share, two tokens of one colour apart', () => {
    const background: RawBinding = {
      value: 'linear-gradient(to right, color-mix(in srgb, var(--np-ink) 20%, transparent) 0%, var(--np-paper) 50%, var(--np-white) 100%)',
      chains: [['--np-ink'], ['--np-paper'], ['--np-white']],
    };
    const { frame } = planPrints(
      { box: [0, 0, 100, 20], style: { 'background-image': 'linear-gradient(to right, rgba(25, 24, 22, 0.2) 0%, rgb(255, 255, 255) 50%, rgb(255, 255, 255) 100%)' }, bind: { 'background-image': background } },
      { design: { '--np-paper': '#ffffff', '--np-white': '#ffffff' } }
    ).design;
    const fill = frame.fills[0];
    assert.ok(fill && fill.type === 'GRADIENT_LINEAR');
    assert.deepEqual(
      fill.stops.map((stop) => [stop.color.variable, stop.color.tint]),
      [
        ['--np-ink', 0.2],
        ['--np-paper', undefined],
        ['--np-white', undefined],
      ]
    );
  });

  it('print a token’s lowered alpha as a literal where the code did not mix it with transparency', () => {
    const relative: RawBinding = { value: 'rgb(from var(--np-ink) r g b / 0.12)', chains: [['--np-ink']] };
    const { frame } = plan({ box: [0, 0, 100, 20], style: { 'background-color': 'rgba(25, 24, 22, 0.12)' }, bind: { 'background-color': relative } });
    const fill = frame.fills[0];
    assert.ok(fill && fill.type === 'SOLID');
    assert.equal(fill.color.variable, undefined);
  });

  it('give a shadow drawn through a shadow token its effect style', () => {
    const shadow: RawBinding = { value: 'var(--np-shadow-soft)', chains: [['--np-shadow-soft']] };
    const styled = plan({ box: [0, 0, 100, 20], style: { 'box-shadow': 'rgba(20, 17, 14, 0.05) 0px 1px 2px 0px' }, bind: { 'box-shadow': shadow } }).frame;
    assert.equal(styled.effectStyle, 'effect:--np-shadow-soft');
    const literal = plan({ box: [0, 0, 100, 20], style: { 'box-shadow': 'rgba(20, 17, 14, 0.05) 0px 1px 2px 0px' } }).frame;
    assert.equal(literal.effectStyle, undefined);
    assert.equal(literal.effects?.length, 1);
  });
});

describe('positioned children', () => {
  // Chrome reports every inset of a positioned box in px; the measure records the ones declared auto.
  const marked = (keywords?: Readonly<Record<string, string>>): FrameSpec =>
    plan({
      box: [0, 0, 200, 100],
      style: { position: 'relative' },
      kids: [item('mark', [180, 0, 20, 20], { position: 'absolute', top: '0px', right: '0px', bottom: '80px', left: '180px' }, keywords ? { keywords } : {})],
    }).frame;

  it('anchor to the sides their insets are declared on', () => {
    assert.deepEqual(named(marked({ bottom: 'auto', left: 'auto' }), 'mark')[0]?.absolute, { h: 'MAX', v: 'MIN' });
    assert.deepEqual(named(marked({ top: 'auto', right: 'auto' }), 'mark')[0]?.absolute, { h: 'MIN', v: 'MAX' });
  });

  it('stretch between two declared sides, and hold their start with none', () => {
    assert.deepEqual(named(marked(), 'mark')[0]?.absolute, { h: 'STRETCH', v: 'STRETCH' });
    assert.deepEqual(named(marked({ top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' }), 'mark')[0]?.absolute, { h: 'MAX', v: 'MIN' });
  });
});

describe('stacking order', () => {
  const row = (shadow: string): FrameSpec =>
    plan({
      box: [0, 0, 150, 20],
      style: { display: 'flex', 'column-gap': '10px', 'justify-content': 'flex-start' },
      kids: [item('first', [100, 0, 50, 20], { 'box-shadow': shadow }), item('second', [40, 0, 50, 20])],
    }).frame;

  it('keeps Figma’s default stacking where no two items’ ink meets', () => {
    const frame = row('none');
    assert.ok(frame.layout.mode === 'HORIZONTAL');
    assert.equal(frame.layout.reverseZ, false);
  });

  it('paints the earlier item on top where its shadow reaches the next', () => {
    const frame = row('rgba(0, 0, 0, 0.5) 0px 0px 20px 0px');
    assert.ok(frame.layout.mode === 'HORIZONTAL');
    assert.equal(frame.layout.reverseZ, true);
    assert.deepEqual(
      frame.children.map((child) => child.name),
      ['second', 'first']
    );
  });
});

describe('pseudo-elements', () => {
  it('print the text Chrome laid out, not the computed content with its alt text', () => {
    // CivicVotes.module.css: `content: '+' / ''`, which Chrome computes as `"+" / ""`.
    const plus: RawPseudo = { kind: 'before', box: [0, 0, 10, 24], style: { ...BASE, position: 'absolute', content: '"+" / ""' }, bind: {}, text: '+' };
    const { frame } = plan({ box: [0, 0, 100, 24], style: { position: 'relative' }, pseudo: [plus] });
    const text = named(frame, '+')[0];
    assert.ok(text && text.type === 'TEXT', 'the pseudo-element prints a text layer named for its text');
    assert.equal(text.characters, '+');
  });
});

/** Every key of a planned subtree, parents first. */
const keysOf = (spec: NodeSpec): string[] => [spec.key, ...(spec.type === 'FRAME' ? spec.children.flatMap(keysOf) : [])];

/** Every variable a planned subtree binds, wherever a paint, a number or a drawing names one. */
const boundIn = (value: unknown): string[] =>
  value !== null && typeof value === 'object' ? Object.entries(value).flatMap(([field, inner]) => (field === 'variable' && typeof inner === 'string' ? [inner] : boundIn(inner))) : [];

describe('prints', () => {
  it('print a layer only the wire print renders in the wire frame alone', () => {
    const { design, wire } = planPrints({
      box: [0, 0, 200, 40],
      style: { position: 'relative' },
      kids: [item('label', [0, 0, 200, 40]), item('mark', [180, 0, 20, 20], { position: 'absolute', top: '0px', right: '0px' }, { in: { design: { display: 'none' } } })],
    });
    assert.deepEqual(named(design.frame, 'mark'), []);
    assert.equal(named(wire.frame, 'mark').length, 1);
    assert.deepEqual([design.drift, wire.drift], [[], []]);
  });

  it('fade a layer its print hides with visibility, keeping its space in flow, and hide one out of flow', () => {
    const hidden = { wire: { visibility: 'hidden' } };
    const { design, wire } = planPrints({
      box: [0, 0, 100, 60],
      style: { position: 'relative' },
      kids: [item('note', [0, 0, 100, 30], {}, { in: hidden }), item('body', [0, 30, 100, 30]), item('badge', [80, 0, 20, 20], { position: 'absolute', top: '0px', right: '0px' }, { in: hidden })],
    });
    const [note, badge] = [named(wire.frame, 'note')[0], named(wire.frame, 'badge')[0]];
    assert.deepEqual([note?.opacity, note?.visible], [{ value: 0 }, undefined]);
    assert.deepEqual([badge?.opacity, badge?.visible], [undefined, false]);
    assert.deepEqual([named(design.frame, 'note')[0]?.opacity, named(design.frame, 'badge')[0]?.visible], [undefined, undefined]);
    assert.deepEqual(wire.drift, []);
  });

  it('bind a design frame to Bento and a wire frame to Bento wire alone', () => {
    const ink: RawBinding = { value: 'var(--np-ink)', chains: [['--np-ink']] };
    const pad: RawBinding = { value: 'var(--space-2)', chains: [['--space-2']] };
    const tokens = { design: { '--space-2': '8px' }, wire: { '--space-2': '8px', '--np-ink': '#737373' } };
    const { design, wire, collections } = planPrints(
      {
        box: [0, 0, 100, 40],
        style: { 'background-color': 'rgb(25, 24, 22)', 'padding-top': '8px', display: 'flex' },
        bind: { 'background-color': ink, 'padding-top': pad },
        in: { wire: { 'background-color': 'rgb(115, 115, 115)' } },
        kids: [item('a', [0, 8, 100, 32])],
      },
      tokens
    );
    assert.deepEqual(new Set(boundIn(design.frame)), new Set(['--np-ink', '--space-2']));
    assert.deepEqual(new Set(boundIn(wire.frame)), new Set(['wire:--np-ink', 'wire:--space-2']));
    const [bento, twins] = ['bento', 'bento-wire'].map((key) => new Map(collections.find((collection) => collection.key === key)!.variables.map((variable) => [variable.key, variable] as const)));
    // The twin of a token the prints read alike aliases its Bento twin; one they read otherwise holds the wire print's value.
    assert.deepEqual(twins!.get('wire:--space-2')?.value, { kind: 'alias', key: '--space-2' });
    assert.deepEqual(twins!.get('wire:--np-ink')?.value, { kind: 'color', rgba: [115 / 255, 115 / 255, 115 / 255, 1] });
    assert.equal(twins!.get('wire:--np-ink')?.name, bento!.get('--np-ink')?.name);
  });

  it('read what each print renders off the measure, by the keys the plan gives: a layer one print hides with all under it, and a wrapper it dissolves', () => {
    const root: Element = {
      box: [0, 0, 200, 80],
      style: { position: 'relative' },
      kids: [
        item('mark', [180, 0, 20, 20], { position: 'absolute', top: '0px', right: '0px' }, { in: { design: { display: 'none' } }, kids: [item('dot', [185, 5, 10, 10])] }),
        item('wrap', [0, 30, 200, 50], { display: 'contents' }, { kids: [item('cell', [0, 30, 100, 50])] }),
        item('mark', [0, 0, 20, 20], { position: 'absolute', top: '0px', left: '0px' }),
      ],
    };
    const page = pageOf(root, {});
    const [design, wire] = PRINTS.map((print) => renderedBy(projectionOf(page, print)));
    assert.deepEqual([...design!].sort(), ['', '/mark#1', '/wrap', '/wrap/cell']);
    const wireOnly = [...wire!].filter((key) => !design!.has(key)).sort();
    assert.deepEqual(wireOnly, ['/mark', '/mark/dot']);
    // The keys are the planner's: the wire frame holds each layer only it renders, the design frame none.
    const planned = planPrints(root);
    const keysIn = (print: 'design' | 'wire'): Set<string> => new Set(keysOf(planned[print].frame).map((key) => key.slice(`r|wide|${print}`.length)));
    assert.deepEqual([wireOnly.filter((key) => keysIn('wire').has(key)), wireOnly.filter((key) => keysIn('design').has(key))], [wireOnly, []]);
  });

  it('key an element alike in both prints but for the print, past a sibling one print lacks and a subgrid one print folds', () => {
    const mark = (box: Box, design: Style): Element => item('mark', box, { position: 'absolute', top: '0px', right: '0px' }, { in: { design } });
    const subgrid: Element = item('sub', [0, 0, 200, 50], { display: 'grid', 'grid-template-columns': 'subgrid', 'grid-template-rows': '50px', 'grid-column-start': '1', 'grid-column-end': '3' }, {
      in: { wire: { 'box-shadow': 'rgb(0, 0, 0) 0px 0px 0px 1px inset' } },
      kids: [item('cell', [100, 0, 100, 50]), item('cell', [0, 0, 100, 50])],
    });
    const { design, wire } = planPrints({
      box: [0, 0, 200, 80],
      style: { position: 'relative' },
      kids: [
        mark([190, 0, 10, 10], { display: 'none' }),
        mark([0, 0, 10, 10], {}),
        { text: 'כותרת', lines: [[150, 0, 50, 24]] },
        item('board', [0, 30, 200, 50], { display: 'grid', 'grid-template-columns': '100px 100px', 'grid-template-rows': '50px', 'column-gap': '0px' }, { kids: [subgrid] }),
      ],
    });
    // The design print folds the subgrid that paints nothing there; the wire print keeps it, as it draws an edge.
    assert.deepEqual([named(design.frame, 'sub').length, named(wire.frame, 'sub').length], [0, 1]);
    const ofDesign = keysOf(design.frame).map((key) => key.replace('r|wide|design', 'r|wide|wire'));
    const ofWire = new Set(keysOf(wire.frame));
    for (const key of ofDesign) assert.ok(ofWire.has(key), `${key} has no twin in the wire frame`);
    assert.deepEqual(
      keysOf(wire.frame)
        .filter((key) => /mark|text#|cell/.test(key))
        .sort(),
      ['r|wide|wire/board/sub/cell', 'r|wide|wire/board/sub/cell#1', 'r|wide|wire/mark', 'r|wide|wire/mark#1', 'r|wide|wire/text#0']
    );
  });
});
