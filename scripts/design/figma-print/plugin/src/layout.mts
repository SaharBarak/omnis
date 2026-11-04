/**
 * Layout as the plan gives it (docs/redesign/FIGMA_PRINT.md §4, §5): the plan is
 * physical and its child lists are final, so the plugin writes boxes, modes
 * and order as given. Writes go in the order Figma needs: the mode, then
 * fixed axes and the size, then the children, then the hugging a frame does
 * around them; a child's FILL and position are its parent's.
 */
import type { Box, FrameSpec, GridTrack, LayoutSpec, NodeSpec } from '../../plan/schema.mts';
import { setNumber } from './bind.mts';
import { guard, type Run } from './context.mts';
import { samePx } from './numbers.mts';

/** The least length Figma resizes a node to. */
export const MIN_LENGTH = 0.01;

/** A node that lays out children: a frame, a main component, or a slot. */
export type Container = FrameNode | ComponentNode | SlotNode;

/** A node the plugin builds from a spec. */
export type Built = FrameNode | ComponentNode | SlotNode | TextNode | InstanceNode;

/** A text as wide as its line (§5, text boxes): its width is Figma's, never the measured one. */
export const isAutoWidth = (node: Built): node is TextNode => node.type === 'TEXT' && node.textAutoResize === 'WIDTH_AND_HEIGHT';

/** The share of a length change that lies left of a box, by the edge that holds it: none at the left edge, half at the centre, all at the right. */
const EDGE_SHARE = { MIN: 0, CENTER: 0.5, MAX: 1 } as const;

/** A text's own alignment, where nothing else holds its box. */
const TEXT_SHARE: Readonly<Record<TextNode['textAlignHorizontal'], number>> = { LEFT: 0, JUSTIFIED: 0, CENTER: 0.5, RIGHT: 1 };

/** An auto layout's alignment along the width: a baseline row starts at the left, and so does a grid cell's auto alignment. */
const ALIGN_SHARE: Readonly<Record<FrameNode['counterAxisAlignItems'] | TextNode['gridChildHorizontalAlign'], number>> = { ...EDGE_SHARE, BASELINE: 0, AUTO: 0 };

type Distributed = Exclude<FrameNode['primaryAxisAlignItems'], keyof typeof EDGE_SHARE>;

/** Where a row that spaces its children out gives way to one child's change of width: by its place among the children in flow, as the gaps take it up. */
const DISTRIBUTED_SHARE: Readonly<Record<Distributed, (at: number, count: number) => number>> = {
  SPACE_BETWEEN: (at, count) => (count > 1 ? at / (count - 1) : 0),
  SPACE_EVENLY: (at, count) => (at + 1) / (count + 1),
  SPACE_AROUND: (at, count) => (at + 0.5) / count,
};

const isEdge = (align: FrameNode['primaryAxisAlignItems']): align is keyof typeof EDGE_SHARE => align in EDGE_SHARE;

/** A row child's share, by the row's alignment along it. */
function rowShare(node: SceneNode, row: ChildrenMixin, align: FrameNode['primaryAxisAlignItems']): number {
  if (isEdge(align)) return EDGE_SHARE[align];
  const flowing = row.children.filter((child) => child.visible && !('layoutPositioning' in child && child.layoutPositioning === 'ABSOLUTE'));
  const at = flowing.indexOf(node);
  return at < 0 ? 0 : DISTRIBUTED_SHARE[align](at, flowing.length);
}

/**
 * How much of the width an auto width text spares its box, or takes past it,
 * lies left of the box, by what places the box: an absolute box by its
 * constraint, an auto layout's child by the layout's alignment, and only a
 * box nothing places by its text's alignment. The box is the line, so the
 * text's own alignment moves no glyph inside it. Any other node's box is its
 * own: none.
 */
export function shareOf(node: Built, spec: NodeSpec): number {
  if (!isAutoWidth(node)) return 0;
  const own = TEXT_SHARE[node.textAlignHorizontal];
  if (spec.absolute) {
    const { h } = spec.absolute;
    return h === 'STRETCH' || h === 'SCALE' ? own : EDGE_SHARE[h];
  }
  const { parent } = node;
  if (!parent || !('layoutMode' in parent)) return own;
  switch (parent.layoutMode) {
    case 'NONE':
      return own;
    case 'VERTICAL':
      return ALIGN_SHARE[parent.counterAxisAlignItems];
    case 'GRID':
      return ALIGN_SHARE[node.gridChildHorizontalAlign];
    case 'HORIZONTAL':
      return rowShare(node, parent, parent.primaryAxisAlignItems);
  }
}

/** A node's x where it is placed by hand: its box's left edge, less the share of the width its box spares or takes that lies left of it. */
export const xIn = (node: Built, box: Box, share: number): number => box[0] + (box[2] - node.width) * share;

type Grid = Extract<LayoutSpec, { readonly mode: 'GRID' }>;

/** Whether a node can hug its content: an auto layout frame, or an instance of one. */
const canHug = (node: Built): boolean => node.type !== 'TEXT' && node.layoutMode !== 'NONE';

/** Axes of a node, as flags. */
export interface Axes {
  readonly h: boolean;
  readonly v: boolean;
}

const BOTH: Axes = { h: true, v: true };

/**
 * Fixes the named axes of an auto layout node, whatever sizing Figma gave it
 * when its mode was set or its main was instantiated: what it hugs or fills
 * is written after, so a size that needs no resize still prints fixed.
 */
export function fixAxes(node: Built, axes: Axes, spec: NodeSpec, run: Run): void {
  if (!canHug(node)) return;
  if (axes.h && node.layoutSizingHorizontal !== 'FIXED') guard(run, spec.key, 'fixed width', () => (node.layoutSizingHorizontal = 'FIXED'));
  if (axes.v && node.layoutSizingVertical !== 'FIXED') guard(run, spec.key, 'fixed height', () => (node.layoutSizingVertical = 'FIXED'));
}

/**
 * A grid axis's tracks as Figma takes them, written whole. Figma hands each
 * track back as a live object, and every read or write through one spends a
 * callback id of the plugin's, of which a print of the whole site runs out,
 * so no track is ever read back or written one field at a time.
 */
const trackSizes = (tracks: readonly GridTrack[]): GridTrackSize[] => tracks.map((track): GridTrackSize => (track.type === 'HUG' ? { type: 'HUG' } : { type: track.type, value: track.value }));

/** A grid's track counts and tracks as the plan gives them; a count Figma refuses is in the journal. */
function applyTracks(frame: Container, layout: Grid, run: Run, key: string): void {
  const [columns, rows] = [Math.max(1, layout.cols.length), Math.max(1, layout.rows.length)];
  if (frame.gridColumnCount !== columns) guard(run, key, `grid column count ${String(columns)}`, () => (frame.gridColumnCount = columns));
  if (frame.gridRowCount !== rows) guard(run, key, `grid row count ${String(rows)}`, () => (frame.gridRowCount = rows));
  if (layout.cols.length > 0) guard(run, key, 'grid columns', () => (frame.gridColumnSizes = trackSizes(layout.cols)));
  if (layout.rows.length > 0) guard(run, key, 'grid rows', () => (frame.gridRowSizes = trackSizes(layout.rows)));
}

function applyGrid(frame: Container, layout: Grid, run: Run, key: string): void {
  if ('gridAutoTracks' in frame) guard(run, key, 'gridAutoTracks', () => (frame.gridAutoTracks = 'NONE'));
  if ('gridItemsPositioning' in frame) guard(run, key, 'gridItemsPositioning', () => (frame.gridItemsPositioning = 'MANUAL'));
  applyTracks(frame, layout, run, key);
  setNumber(frame, 'gridColumnGap', layout.colGap, run, key);
  setNumber(frame, 'gridRowGap', layout.rowGap, run, key);
}

/** A frame's layout: its mode, padding, gap and alignment, or its grid. */
export function applyLayout(frame: Container, spec: FrameSpec, run: Run): void {
  const { layout, key } = spec;
  if (layout.mode === 'NONE') {
    if (frame.layoutMode !== 'NONE') frame.layoutMode = 'NONE';
    return;
  }
  frame.layoutMode = layout.mode;
  // Fixed before the tracks: Figma refuses FLEX tracks along an axis the grid hugs.
  fixAxes(frame, BOTH, spec, run);
  const [top, right, bottom, left] = layout.padding;
  setNumber(frame, 'paddingTop', top, run, key);
  setNumber(frame, 'paddingRight', right, run, key);
  setNumber(frame, 'paddingBottom', bottom, run, key);
  setNumber(frame, 'paddingLeft', left, run, key);
  frame.strokesIncludedInLayout = layout.strokesIncluded;
  if (layout.mode === 'GRID') {
    applyGrid(frame, layout, run, key);
    return;
  }
  setNumber(frame, 'itemSpacing', layout.gap, run, key);
  frame.primaryAxisAlignItems = layout.primary;
  guard(run, key, `counterAxisAlignItems ${layout.counter}`, () => (frame.counterAxisAlignItems = layout.counter));
  frame.itemReverseZIndex = layout.reverseZ;
}

/** Resizes a node to a box's size when it is not that size already. */
export function resizeTo(node: Built, width: number, height: number): void {
  if (samePx(node.width, width) && samePx(node.height, height)) return;
  node.resize(Math.max(width, MIN_LENGTH), Math.max(height, MIN_LENGTH));
}

/** The axes a grid's FLEX tracks share out: Figma does not let a grid hug along them. */
const flexAxes = (spec: NodeSpec): Axes =>
  spec.type === 'FRAME' && spec.layout.mode === 'GRID'
    ? { h: spec.layout.cols.some((track) => track.type === 'FLEX'), v: spec.layout.rows.some((track) => track.type === 'FLEX') }
    : { h: false, v: false };

/**
 * A grid's tracks again once its children are in: an absolute child goes in
 * through a free cell before it leaves the flow, and a full grid takes a FLEX
 * row for it, which would stop the grid hugging. Before the hugging.
 */
export function settleGrid(frame: Container, spec: FrameSpec, run: Run): void {
  if (spec.layout.mode === 'GRID' && frame.layoutMode === 'GRID') applyTracks(frame, spec.layout, run, spec.key);
}

/** The hugging a node does around its children, once they are in. A text hugs by its resize mode instead. */
export function hug(node: Built, spec: NodeSpec, run: Run): void {
  if (!canHug(node)) return;
  const flex = flexAxes(spec);
  if (spec.sizing.h === 'HUG' && !flex.h) guard(run, spec.key, 'hug width', () => (node.layoutSizingHorizontal = 'HUG'));
  if (spec.sizing.v === 'HUG' && !flex.v) guard(run, spec.key, 'hug height', () => (node.layoutSizingVertical = 'HUG'));
}

/** Appends a child where its spec puts it: a grid child into its cell, any other child at the end. */
export function appendInto(parent: Container, child: Built, spec: NodeSpec): void {
  if (parent.layoutMode === 'GRID' && spec.absolute === undefined && spec.grid) parent.appendChildAt(child, spec.grid.row, spec.grid.col);
  else parent.appendChild(child);
}

/** A child's place in its parent once appended: out of flow at its box, or in flow with its cell span and FILL. */
export function placeIn(parent: Container, child: Built, spec: NodeSpec, run: Run): void {
  const flowing = parent.layoutMode !== 'NONE';
  const { absolute, grid, key } = spec;
  if (flowing && absolute) guard(run, key, 'absolute position', () => (child.layoutPositioning = 'ABSOLUTE'));
  if (!flowing || absolute) {
    child.x = xIn(child, spec.box, shareOf(child, spec));
    child.y = spec.box[1];
    // Its constraints wait for the unit to settle (constraints.mts): a parent resized meanwhile would stretch it.
    // Out of the flow a text takes no minimum, so the height CSS holds it at is fixed.
    if (child.type === 'TEXT' && spec.type === 'TEXT' && spec.minHeight !== undefined) guard(run, key, 'minimum height', () => holdHeight(child, spec.box[3]));
    return;
  }
  if (parent.layoutMode === 'GRID' && grid) {
    guard(run, key, 'grid span', () => {
      if (child.gridRowSpan !== grid.rowSpan) child.gridRowSpan = grid.rowSpan;
      if (child.gridColumnSpan !== grid.colSpan) child.gridColumnSpan = grid.colSpan;
    });
    guard(run, key, 'grid alignment', () => {
      child.gridChildHorizontalAlign = grid.h;
      child.gridChildVerticalAlign = grid.v;
    });
  }
  if (spec.sizing.h === 'FILL') guard(run, key, 'fill width', () => (child.layoutSizingHorizontal = 'FILL'));
  if (spec.sizing.v === 'FILL') guard(run, key, 'fill height', () => (child.layoutSizingVertical = 'FILL'));
  // In the flow a text keeps the height CSS holds it at as a minimum, so more lines still grow it.
  const { minHeight } = spec.type === 'TEXT' ? spec : {};
  if (minHeight !== undefined) guard(run, key, 'minimum height', () => (child.minHeight = minHeight));
}

/** A text held at a height: a fixed box at its width, the lines inside it. */
function holdHeight(text: TextNode, height: number): void {
  const { width } = text;
  text.textAutoResize = 'NONE';
  resizeTo(text, width, height);
}

/**
 * A child at its box in a parent without auto layout: the self-check's
 * fallback. An auto width text keeps its width, its box held by the share the
 * layout it leaves held it by (shareOf, read before the layout went).
 */
export function placeAt(child: Built, spec: NodeSpec, share: number): void {
  if (!isAutoWidth(child)) resizeTo(child, spec.box[2], spec.box[3]);
  child.x = xIn(child, spec.box, share);
  child.y = spec.box[1];
}
