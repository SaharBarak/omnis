/**
 * Figma's layout, modelled (docs/redesign/FIGMA_PRINT.md §5): a planned frame laid out
 * as the plugin writes it, by the rules Figma applies to auto layout, grids,
 * hugging and filling. The planner solves each container against the
 * measurement; this lays out what it wrote, so a shape whose Figma reading
 * differs from the solve shows as drift before anything prints.
 *
 * Sizes not laid out here are given (§5 Leaf sizes): a text, a drawing and an
 * instance are leaves, as large as their measured box unless their parent
 * fills them, or as large as Figma printed them when the plugin reads a main
 * against its print; a node's size along an axis it neither hugs nor fills
 * is its box. An instance hugs by its main's layout, so its hug is checked
 * there: a main without auto layout, or whose children only fill, gives it
 * nothing to hug.
 */
import type { Box, FrameSpec, LayoutSpec, NodeSpec } from './schema.mts';

type Auto = Extract<LayoutSpec, { readonly mode: 'HORIZONTAL' | 'VERTICAL' }>;
type Grid = Extract<LayoutSpec, { readonly mode: 'GRID' }>;
export type Size = readonly [number, number];
type Insets = readonly [number, number, number, number];

/** A node the model places away from its measured box, relative to its parent. */
export interface Drift {
  readonly key: string;
  readonly name: string;
  /** What placed it: its parent's name and layout mode. */
  readonly by: string;
  readonly want: Box;
  readonly got: Box;
}

/** A sizing Figma cannot hold: it resolves it to something the plan did not say. */
export interface Conflict {
  readonly key: string;
  readonly name: string;
  readonly what: 'hug without content' | 'fill outside auto layout' | 'hug without auto layout';
}

export interface Layout {
  readonly drift: Drift[];
  readonly conflicts: Conflict[];
}

/** Whether a node takes part in layout: Figma's auto layout skips hidden layers. */
const shown = (node: NodeSpec): boolean => node.visible !== false;

const ZERO: Insets = [0, 0, 0, 0];

/** The space a frame's padding and, where they take layout space, its strokes keep from its children. */
function insetsOf(frame: FrameSpec, layout: Auto | Grid): Insets {
  const share = frame.strokeAlign === 'OUTSIDE' ? 0 : frame.strokeAlign === 'CENTER' ? 0.5 : 1;
  const strokes = layout.strokesIncluded && frame.strokes.length > 0 ? (frame.strokeWeights ?? []).map((weight) => weight.value * share) : ZERO;
  return layout.padding.map((pad, side) => pad.value + (strokes[side] ?? 0)) as unknown as Insets;
}

const isAuto = (layout: LayoutSpec): layout is Auto => layout.mode === 'HORIZONTAL' || layout.mode === 'VERTICAL';

/** A main component's root by its variant key. */
export type MainOf = (variant: string) => NodeSpec | undefined;

/** What the model is given beyond the plan. */
export interface ModelOptions {
  readonly mainOf?: MainOf;
  /** A leaf's size along the axes its parent does not fill, when it is not its measured box: the size Figma printed it at. */
  readonly leafSize?: (leaf: NodeSpec) => Size | undefined;
  /** Whether the root takes its own sizing, hugging what it holds, as a main does; a route frame keeps its box. */
  readonly rootHugs?: boolean;
}

/** Where the model puts a node, relative to its parent, and what placed it: its parent's name and layout mode. */
interface Placement {
  readonly box: Box;
  readonly by: string;
}

/** Where the model puts every node it lays out, and the sizings Figma cannot hold. */
interface Model {
  readonly root: Box;
  readonly placements: ReadonlyMap<NodeSpec, Placement>;
  readonly conflicts: Conflict[];
}

/** Lays out a root at its own size, and every frame under it; a node the model puts more than the tolerance from its box is drift. */
export function layOut(root: FrameSpec, tolerance: number, mainOf: MainOf = () => undefined): Layout {
  const { placements, conflicts } = model(root, { mainOf });
  const drift = [...placements].flatMap(([node, { box, by }]): Drift[] =>
    box.some((value, at) => Math.abs(value - node.box[at]!) > tolerance) ? [{ key: node.key, name: node.name, by, want: node.box, got: box }] : [],
  );
  return { drift, conflicts };
}

/**
 * Where the model puts every node under a root, by key, relative to the
 * root's top left, the root included; a node the model does not place (a
 * slot's content, a hidden layer) is at its box in its parent.
 */
export function boxesIn(root: FrameSpec, options: ModelOptions = {}): ReadonlyMap<string, Box> {
  const { root: rootBox, placements } = model(root, options);
  const boxes = new Map<string, Box>();
  const visit = (node: NodeSpec, own: Box, origin: readonly [number, number]): void => {
    const box: Box = [origin[0] + own[0], origin[1] + own[1], own[2], own[3]];
    if (!boxes.has(node.key)) boxes.set(node.key, box);
    if (node.type === 'FRAME') for (const child of node.children) visit(child, placements.get(child)?.box ?? child.box, [box[0], box[1]]);
  };
  visit(root, rootBox, [0, 0]);
  return boxes;
}

function model(root: FrameSpec, { mainOf = () => undefined, leafSize = () => undefined, rootHugs = false }: ModelOptions): Model {
  const placements = new Map<NodeSpec, Placement>();
  const conflicts: Conflict[] = [];
  const sizes = new WeakMap<NodeSpec, Size>();
  const inFlow = (frame: FrameSpec): NodeSpec[] => frame.children.filter((child) => child.absolute === undefined && shown(child));
  const along = (size: Size, horizontal: boolean): number => (horizontal ? size[0] : size[1]);
  const fills = (node: NodeSpec, horizontal: boolean): boolean => (horizontal ? node.sizing.h : node.sizing.v) === 'FILL';

  /** A grid's tracks along one axis, given the room between its insets, or null to hug them. */
  const tracksOf = (frame: FrameSpec, layout: Grid, horizontal: boolean, room: number | null): number[] => {
    const tracks = horizontal ? layout.cols : layout.rows;
    const gap = (horizontal ? layout.colGap : layout.rowGap).value;
    const kids = inFlow(frame);
    const sized = tracks.map((track, index) => {
      if (track.type === 'FIXED') return track.value;
      if (track.type === 'FLEX') return null;
      const items = kids.filter((kid) => (horizontal ? kid.grid?.col === index && kid.grid.colSpan === 1 : kid.grid?.row === index && kid.grid.rowSpan === 1));
      return Math.max(0, ...items.map((item) => (fills(item, horizontal) ? 0 : along(sizeOf(item), horizontal))));
    });
    const weight = tracks.reduce((sum, track) => sum + (track.type === 'FLEX' ? track.value : 0), 0);
    const left = room === null ? 0 : room - sized.reduce<number>((sum, size) => sum + (size ?? 0), 0) - gap * Math.max(0, tracks.length - 1);
    return sized.map((size, index) => size ?? (weight > 0 ? Math.max(0, (left * tracks[index]!.value) / weight) : 0));
  };

  /** A frame's size along an axis it hugs: its in-flow content and insets. */
  const hugOf = (frame: FrameSpec, horizontal: boolean): number => {
    const { layout } = frame;
    if (layout.mode === 'NONE') return along([frame.box[2], frame.box[3]], horizontal);
    const insets = insetsOf(frame, layout);
    const ends = horizontal ? insets[1] + insets[3] : insets[0] + insets[2];
    const kids = inFlow(frame);
    if (layout.mode === 'GRID') {
      const tracks = tracksOf(frame, layout, horizontal, null);
      const gap = (horizontal ? layout.colGap : layout.rowGap).value;
      return ends + tracks.reduce((sum, size) => sum + size, 0) + gap * Math.max(0, tracks.length - 1);
    }
    const sized = kids.filter((kid) => !fills(kid, horizontal));
    if (kids.length > 0 && sized.length === 0) conflicts.push({ key: frame.key, name: frame.name, what: 'hug without content' });
    const extents = sized.map((kid) => along(sizeOf(kid), horizontal));
    const primary = (layout.mode === 'HORIZONTAL') === horizontal;
    if (!primary) return ends + Math.max(0, ...extents);
    return ends + extents.reduce((sum, size) => sum + size, 0) + layout.gap.value * Math.max(0, kids.length - 1);
  };

  /** Whether an instance's main lets it hug what it hugs. Its size stays its box: the overrides that change it are not modelled. */
  const checkHug = (instance: Extract<NodeSpec, { type: 'INSTANCE' }>): void => {
    const main = mainOf(instance.component);
    const axes = [true, false].filter((horizontal) => (horizontal ? instance.sizing.h : instance.sizing.v) === 'HUG');
    if (main?.type !== 'FRAME' || axes.length === 0) return;
    if (main.layout.mode === 'NONE') conflicts.push({ key: instance.key, name: instance.name, what: 'hug without auto layout' });
    else if (main.layout.mode !== 'GRID') {
      const kids = inFlow(main);
      if (kids.length > 0 && axes.some((horizontal) => kids.every((kid) => fills(kid, horizontal)))) conflicts.push({ key: instance.key, name: instance.name, what: 'hug without content' });
    }
  };

  /** A node's size where its parent does not fill it: hugged, its leaf size, or its box. */
  function sizeOf(node: NodeSpec): Size {
    const known = sizes.get(node);
    if (known) return known;
    let size: Size = [node.box[2], node.box[3]];
    if (node.type === 'FRAME') {
      if (node.layout.mode === 'NONE' && (node.sizing.h === 'HUG' || node.sizing.v === 'HUG')) conflicts.push({ key: node.key, name: node.name, what: 'hug without auto layout' });
      else size = [node.sizing.h === 'HUG' ? hugOf(node, true) : size[0], node.sizing.v === 'HUG' ? hugOf(node, false) : size[1]];
    } else {
      if (node.type === 'INSTANCE') checkHug(node);
      size = leafSize(node) ?? size;
    }
    sizes.set(node, size);
    return size;
  }

  /** Where Figma puts a frame's children at this size, and the same below each. */
  function arrange(frame: FrameSpec, size: Size): void {
    const { layout } = frame;
    const by = `${frame.name} ${layout.mode}`;
    const placed = new Map<NodeSpec, Box>();
    for (const child of frame.children) {
      if (!shown(child)) continue;
      if (layout.mode === 'NONE' || child.absolute !== undefined) {
        if (layout.mode === 'NONE' && (child.sizing.h === 'FILL' || child.sizing.v === 'FILL')) conflicts.push({ key: child.key, name: child.name, what: 'fill outside auto layout' });
        const [w, h] = sizeOf(child);
        placed.set(child, [child.box[0], child.box[1], w, h]);
      }
    }
    if (isAuto(layout)) {
      const horizontal = layout.mode === 'HORIZONTAL';
      const [top, right, bottom, left] = insetsOf(frame, layout);
      const kids = inFlow(frame);
      const room = horizontal ? size[0] - left - right : size[1] - top - bottom;
      const across = horizontal ? size[1] - top - bottom : size[0] - left - right;
      const own = kids.map((kid) => (fills(kid, horizontal) ? null : along(sizeOf(kid), horizontal)));
      const spacing = layout.primary === 'SPACE_BETWEEN' ? 0 : layout.gap.value;
      const filling = own.filter((value) => value === null).length;
      const share = filling > 0 ? Math.max(0, (room - own.reduce<number>((sum, value) => sum + (value ?? 0), 0) - spacing * Math.max(0, kids.length - 1)) / filling) : 0;
      const mains = own.map((value) => value ?? share);
      const total = mains.reduce((sum, value) => sum + value, 0);
      let step = layout.gap.value;
      let cursor = 0;
      if (layout.primary === 'SPACE_BETWEEN') step = kids.length > 1 ? (room - total) / (kids.length - 1) : 0;
      else if (layout.primary === 'MAX') cursor = room - total - step * Math.max(0, kids.length - 1);
      else if (layout.primary === 'CENTER') cursor = (room - total - step * Math.max(0, kids.length - 1)) / 2;
      kids.forEach((kid, at) => {
        const main = mains[at]!;
        const cross = fills(kid, !horizontal) ? across : along(sizeOf(kid), !horizontal);
        const start = layout.counter === 'MAX' ? across - cross : layout.counter === 'CENTER' ? (across - cross) / 2 : 0;
        // Figma aligns a row's baselines by font metrics the plan does not carry: a baseline item keeps its measured offset.
        const offset = layout.counter === 'BASELINE' && !fills(kid, !horizontal) ? (horizontal ? kid.box[1] - top : kid.box[0] - left) : start;
        placed.set(kid, horizontal ? [left + cursor, top + offset, main, cross] : [left + offset, top + cursor, cross, main]);
        cursor += main + step;
      });
    } else if (layout.mode === 'GRID') {
      const [top, right, bottom, left] = insetsOf(frame, layout);
      const cols = tracksOf(frame, layout, true, size[0] - left - right);
      const rows = tracksOf(frame, layout, false, size[1] - top - bottom);
      const edge = (tracks: readonly number[], gap: number, from: number, at: number): number => from + tracks.slice(0, at).reduce((sum, value) => sum + value, 0) + gap * at;
      for (const kid of inFlow(frame)) {
        const cell = kid.grid;
        if (!cell) {
          placed.set(kid, [kid.box[0], kid.box[1], ...sizeOf(kid)]);
          continue;
        }
        const x = edge(cols, layout.colGap.value, left, cell.col);
        const y = edge(rows, layout.rowGap.value, top, cell.row);
        const w = edge(cols, layout.colGap.value, left, cell.col + cell.colSpan) - layout.colGap.value - x;
        const h = edge(rows, layout.rowGap.value, top, cell.row + cell.rowSpan) - layout.rowGap.value - y;
        const [ownW, ownH] = sizeOf(kid);
        const kw = fills(kid, true) ? w : ownW;
        const kh = fills(kid, false) ? h : ownH;
        const at = (align: 'MIN' | 'CENTER' | 'MAX', from: number, room: number, extent: number): number => (align === 'MAX' ? from + room - extent : align === 'CENTER' ? from + (room - extent) / 2 : from);
        placed.set(kid, [fills(kid, true) ? x : at(cell.h, x, w, kw), fills(kid, false) ? y : at(cell.v, y, h, kh), kw, kh]);
      }
    }
    for (const [child, got] of placed) {
      placements.set(child, { box: got, by });
      if (child.type === 'FRAME') arrange(child, [got[2], got[3]]);
      if (child.type === 'INSTANCE') for (const content of Object.values(child.slots ?? {}).flat()) if (content.type === 'FRAME' && shown(content)) arrange(content, [content.box[2], content.box[3]]);
    }
  }

  const [width, height] = rootHugs ? sizeOf(root) : [root.box[2], root.box[3]];
  arrange(root, [width, height]);
  return { root: [0, 0, width, height], placements, conflicts };
}
