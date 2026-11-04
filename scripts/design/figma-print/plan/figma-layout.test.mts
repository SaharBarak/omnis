/**
 * The Figma layout model (docs/redesign/FIGMA_PRINT.md §5) on frames built by hand:
 * each case is one rule Figma lays out by, and where it puts the children.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { boxesIn, layOut } from './figma-layout.mts';
import type { Bound, Box, FrameSpec, LayoutSpec, NodeSpec, Sizing, TextSpec } from './schema.mts';

const b = (value: number): Bound => ({ value });
const FIXED = { h: 'FIXED', v: 'FIXED' } as const;

const auto = (mode: 'HORIZONTAL' | 'VERTICAL', over: Partial<Extract<LayoutSpec, { mode: 'HORIZONTAL' | 'VERTICAL' }>> = {}): LayoutSpec => ({
  mode,
  padding: [b(0), b(0), b(0), b(0)],
  gap: b(0),
  primary: 'MIN',
  counter: 'MIN',
  strokesIncluded: false,
  reverseZ: false,
  ...over,
});

const frame = (key: string, box: Box, layout: LayoutSpec, children: NodeSpec[] = [], sizing: { h: Sizing; v: Sizing } = FIXED, extra: Partial<FrameSpec> = {}): FrameSpec => ({
  type: 'FRAME',
  key,
  name: key,
  box,
  abs: box,
  sizing,
  layout,
  fills: [],
  strokes: [],
  clips: false,
  children,
  ...extra,
});

const leaf = (key: string, box: Box, sizing: { h: Sizing; v: Sizing } = FIXED, extra: Partial<FrameSpec> = {}): FrameSpec => frame(key, box, { mode: 'NONE' }, [], sizing, extra);

const drifted = (root: FrameSpec): string[] => layOut(root, 0.5).drift.map((one) => one.key);

describe('auto layout', () => {
  it('packs a row at its end, as a right-to-left row starts', () => {
    const row = frame('row', [0, 0, 300, 20], auto('HORIZONTAL', { primary: 'MAX', gap: b(10) }), [leaf('a', [170, 0, 40, 20]), leaf('b', [220, 0, 80, 20])]);
    assert.deepEqual(drifted(row), []);
  });

  it('shares free space equally between the children that fill, whatever they hold', () => {
    const slot = (key: string, x: number, w: number, item: number): FrameSpec =>
      frame(key, [x, 0, w, 20], auto('HORIZONTAL', { primary: 'MAX' }), [leaf(`${key}/item`, [w - item, 0, item, 20])], { h: 'FILL', v: 'FIXED' });
    // CSS gives each auto margin an equal share of the free space: slots of 130 and 170.
    const row = frame('row', [0, 0, 300, 20], auto('HORIZONTAL'), [slot('a', 0, 130, 40), slot('b', 130, 170, 80)]);
    assert.deepEqual(drifted(row).filter((key) => !key.includes('/')), ['a', 'b']);
  });

  it('keeps children inside a border that takes layout space', () => {
    const box = frame('box', [0, 0, 100, 40], auto('VERTICAL', { padding: [b(8), b(8), b(8), b(8)], strokesIncluded: true }), [leaf('a', [10, 10, 20, 20])], FIXED, {
      strokes: [{ type: 'SOLID', color: { rgba: [0, 0, 0, 1] } }],
      strokeWeights: [b(2), b(2), b(2), b(2)],
    });
    assert.deepEqual(drifted(box), []);
  });

  it('gives no space to a hidden layer', () => {
    const column = frame('column', [0, 0, 100, 100], auto('VERTICAL'), [leaf('hidden', [0, 0, 100, 30], FIXED, { visible: false }), leaf('shown', [0, 0, 100, 30])]);
    assert.deepEqual(drifted(column), []);
  });

  it('keeps the space of a layer faded out, as `visibility: hidden` keeps it', () => {
    const column = frame('column', [0, 0, 100, 100], auto('VERTICAL'), [leaf('faded', [0, 0, 100, 30], FIXED, { opacity: { value: 0 } }), leaf('shown', [0, 30, 100, 30])]);
    assert.deepEqual(drifted(column), []);
  });

  it('hugs its children, their gaps and its padding', () => {
    const column = frame('column', [0, 0, 50, 64], auto('VERTICAL', { padding: [b(4), b(0), b(4), b(0)], gap: b(8) }), [leaf('a', [0, 4, 50, 20]), leaf('b', [0, 32, 50, 28])], { h: 'FIXED', v: 'HUG' });
    const page = frame('page', [0, 0, 50, 64], auto('VERTICAL'), [column]);
    assert.deepEqual(drifted(page), []);
  });

  it('reports a frame that hugs only children that fill it', () => {
    const wrapper = frame('wrapper', [0, 0, 100, 20], auto('HORIZONTAL'), [leaf('a', [0, 0, 100, 20], { h: 'FILL', v: 'FIXED' })], { h: 'HUG', v: 'FIXED' });
    const conflicts = layOut(frame('page', [0, 0, 100, 20], auto('HORIZONTAL'), [wrapper]), 0.5).conflicts;
    assert.deepEqual(conflicts.map((one) => [one.key, one.what]), [['wrapper', 'hug without content']]);
  });

  it('reports an instance that hugs a main whose one child fills it, as a container main does', () => {
    const slot = leaf('main/content', [8, 8, 84, 24], { h: 'FILL', v: 'FILL' });
    const main = frame('main', [0, 0, 100, 40], auto('VERTICAL', { padding: [b(8), b(8), b(8), b(8)] }), [slot]);
    const instance = (key: string, sizing: { h: Sizing; v: Sizing }): NodeSpec => ({ type: 'INSTANCE', key, name: key, box: [0, 0, 100, 40], abs: [0, 0, 100, 40], sizing, component: 'main', overrides: [] });
    const page = frame('page', [0, 0, 100, 80], auto('VERTICAL'), [instance('hugs', { h: 'FIXED', v: 'HUG' }), instance('holds', FIXED)]);
    const conflicts = layOut(page, 0.5, (variant) => (variant === 'main' ? main : undefined)).conflicts;
    assert.deepEqual(conflicts.map((one) => [one.key, one.what]), [['hugs', 'hug without content']]);
  });
});

describe('grids', () => {
  const grid = (cols: Extract<LayoutSpec, { mode: 'GRID' }>['cols'], padding: number, kids: NodeSpec[]): FrameSpec =>
    frame('grid', [0, 0, 400, 50], { mode: 'GRID', padding: [b(0), b(0), b(0), b(padding)], cols, rows: [{ type: 'FIXED', value: 50 }], colGap: b(0), rowGap: b(0), strokesIncluded: false }, kids);
  const cell = (key: string, col: number, x: number): NodeSpec => ({ ...leaf(key, [x, 0, 100, 50]), grid: { row: 0, col, rowSpan: 1, colSpan: 1, h: 'MIN', v: 'MIN' } });
  const tracks = [
    { type: 'FIXED', value: 100 },
    { type: 'FIXED', value: 100 },
  ] as const;

  it('starts fixed tracks at the left padding edge, so a right-to-left grid carries its free space as padding', () => {
    assert.deepEqual(drifted(grid(tracks, 200, [cell('a', 0, 200), cell('b', 1, 300)])), []);
    assert.deepEqual(drifted(grid(tracks, 0, [cell('a', 0, 200), cell('b', 1, 300)])), ['a', 'b']);
  });

  it('shares what fixed tracks leave between flexible ones by weight', () => {
    const flex = [
      { type: 'FLEX', value: 1 },
      { type: 'FLEX', value: 3 },
    ] as const;
    const kids = [
      { ...leaf('a', [0, 0, 100, 50], { h: 'FILL', v: 'FIXED' }), grid: { row: 0, col: 0, rowSpan: 1, colSpan: 1, h: 'MIN', v: 'MIN' } },
      { ...leaf('b', [100, 0, 300, 50], { h: 'FILL', v: 'FIXED' }), grid: { row: 0, col: 1, rowSpan: 1, colSpan: 1, h: 'MIN', v: 'MIN' } },
    ] as NodeSpec[];
    assert.deepEqual(drifted(grid(flex, 0, kids)), []);
  });
});

describe('leaf sizes', () => {
  const text = (key: string, box: Box): TextSpec => ({
    type: 'TEXT',
    key,
    name: key,
    box,
    abs: box,
    sizing: { h: 'HUG', v: 'HUG' },
    characters: key,
    style: 'type|Assistant|600|n|13.33|19.99|0||',
    fills: [],
    align: 'RIGHT',
    resize: 'WIDTH_AND_HEIGHT',
    lines: 1,
  });
  // A button that hugs an arrow and a label, packed from its right edge, as the site's call to action is.
  const button = (): FrameSpec =>
    frame('cta', [0, 0, 130.3125, 44], auto('HORIZONTAL', { padding: [b(0), b(20), b(0), b(20)], gap: b(8), primary: 'CENTER', counter: 'CENTER' }), [text('cta/arrow', [20, 12, 12.375, 20]), text('cta/label', [40.375, 12, 69.9375, 20])], {
      h: 'HUG',
      v: 'FIXED',
    });

  it('lays a main out at its measured boxes when no leaf size is given', () => {
    const boxes = boxesIn(button(), { rootHugs: true });
    assert.deepEqual(boxes.get('cta'), [0, 0, 130.3125, 44]);
    assert.deepEqual(boxes.get('cta/label'), [40.375, 12, 69.9375, 20]);
  });

  it('moves a hugging root and the siblings of a leaf by the size Figma printed it at', () => {
    const printed = new Map<string, readonly [number, number]>([['cta/arrow', [14, 20]], ['cta/label', [70, 20]]]);
    const boxes = boxesIn(button(), { rootHugs: true, leafSize: (leaf) => printed.get(leaf.key) });
    assert.deepEqual(boxes.get('cta'), [0, 0, 132, 44]);
    assert.deepEqual(boxes.get('cta/arrow'), [20, 12, 14, 20]);
    assert.deepEqual(boxes.get('cta/label'), [42, 12, 70, 20]);
  });

  it('keeps a route frame at its box, whatever its leaves print at', () => {
    const boxes = boxesIn(button(), { leafSize: () => [100, 20] });
    assert.deepEqual(boxes.get('cta'), [0, 0, 130.3125, 44]);
  });
});
