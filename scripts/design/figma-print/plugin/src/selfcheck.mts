/**
 * The self-check (docs/redesign/FIGMA_PRINT.md §3.3.4): once a unit is printed, every
 * keyed node's box is compared with its measured one, relative to the unit's
 * root. A node further than the tolerance is fixed in the order the plan
 * allows, each length by what holds it: its own fixed length is set again,
 * a length its parent fills is the parent's, and a hugging length becomes
 * its measured one only where the node's own length misses, deepest node
 * first and pass after pass, so a parent measures again after its children
 * are fixed and a child after its parent. An auto width text is never set
 * narrower than its line. Then an auto layout frame whose children still
 * miss becomes a frame without auto layout, its children at their measured
 * offsets, outermost first. A main component's sizing modes and layout are
 * what every instance inherits, so in a main only fixed lengths are set
 * again, and what still misses is read against the layout Figma gives the
 * leaves it printed (readMain). Layers inside an instance are its main's,
 * and stay as they are.
 */
import { boxesIn, type Size } from '../../plan/figma-layout.mts';
import type { Box, NodeSpec, Sizing } from '../../plan/schema.mts';
import { guard, type Run } from './context.mts';
import { attempt } from './failure.mts';
import { ENTRY, printedBy, read } from './keys.mts';
import { isAutoWidth, placeAt, resizeTo, shareOf, xIn, type Built, type Container } from './layout.mts';
import { placedIn, type Placed } from './specs.mts';

/** A node's box on the page: its bounding box, or its transform and size when it has none (a hidden node). */
export function absoluteBox(node: SceneNode): Box {
  const box = 'absoluteBoundingBox' in node ? node.absoluteBoundingBox : null;
  if (box) return [box.x, box.y, box.width, box.height];
  const [[, , x], [, , y]] = node.absoluteTransform;
  return [x, y, node.width, node.height];
}

/** A box relative to an origin box's top left. */
export const relativeTo = (box: Box, origin: Box): Box => [box[0] - origin[0], box[1] - origin[1], box[2], box[3]];

/** How far a printed box is from a measured one: its largest difference on any edge or size. */
export const missOf = (a: Box, b: Box): number => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]), Math.abs(a[3] - b[3]));

/** Whether a node shows: it and every ancestor up to the unit's root are visible. */
function shows(node: SceneNode, root: SceneNode): boolean {
  let current: BaseNode | null = node;
  while (current) {
    if ('visible' in current && !current.visible) return false;
    if (current === root) return true;
    current = current.parent;
  }
  return true;
}

const isBuilt = (node: SceneNode): node is Built =>
  node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'SLOT' || node.type === 'TEXT' || node.type === 'INSTANCE';

interface Subject {
  readonly node: Built;
  readonly placed: Placed;
}

type Axis = 'h' | 'v';

const AXES: readonly Axis[] = ['h', 'v'];

const lengthOf = (node: Built, axis: Axis): number => (axis === 'h' ? node.width : node.height);

const measuredLength = (spec: NodeSpec, axis: Axis): number => (axis === 'h' ? spec.abs[2] : spec.abs[3]);

/** How far a node's own length is from its measured one on an axis. */
const lengthMiss = (node: Built, spec: NodeSpec, axis: Axis): number => Math.abs(lengthOf(node, axis) - measuredLength(spec, axis));

/** A node's largest length miss on the axes given. */
const worstLength = (node: Built, spec: NodeSpec, axes: readonly Axis[]): number => Math.max(0, ...axes.map((axis) => lengthMiss(node, spec, axis)));

/** A node's sizing on an axis, as Figma holds it. */
const sizingOf = (node: Built, axis: Axis): Sizing => (axis === 'h' ? node.layoutSizingHorizontal : node.layoutSizingVertical);

function setSizing(node: Built, axis: Axis, sizing: Sizing): void {
  if (axis === 'h') node.layoutSizingHorizontal = sizing;
  else node.layoutSizingVertical = sizing;
}

/**
 * Sets a node's lengths on the axes given to their measured ones, and holds
 * every other axis as it was: Figma's resize fixes both of a frame's axes, so
 * one that hugged or filled takes its sizing back. A wrapping text keeps
 * wrapping, as sizeText sets it: a fixed box takes the size, then the height
 * follows the lines.
 */
function resizeToMeasured(node: Built, spec: NodeSpec, axes: readonly Axis[]): void {
  const length = (axis: Axis): number => (axes.includes(axis) ? measuredLength(spec, axis) : lengthOf(node, axis));
  const kept = AXES.filter((axis) => !axes.includes(axis)).map((axis) => [axis, sizingOf(node, axis)] as const);
  const wraps = node.type === 'TEXT' && node.textAutoResize === 'HEIGHT';
  if (wraps) node.textAutoResize = 'NONE';
  resizeTo(node, length('h'), length('v'));
  if (wraps) node.textAutoResize = 'HEIGHT';
  for (const [axis, sizing] of kept) if (sizingOf(node, axis) !== sizing) setSizing(node, axis, sizing);
}

/** What holds a node's length on an axis now: the node (FIXED), its content (HUG) or its parent (FILL); a text's by its resize mode. */
function holdOf(node: Built, axis: Axis): Sizing {
  const sizing = axis === 'h' ? node.layoutSizingHorizontal : node.layoutSizingVertical;
  if (node.type !== 'TEXT' || sizing === 'FILL') return sizing;
  if (node.textAutoResize === 'WIDTH_AND_HEIGHT') return 'HUG';
  return axis === 'v' && node.textAutoResize === 'HEIGHT' ? 'HUG' : 'FIXED';
}

/** Whether a node's parent leaves its place to it: a parent without auto layout, or a place out of the flow. */
function isFree(node: Built): boolean {
  const { parent } = node;
  return node.layoutPositioning === 'ABSOLUTE' || parent === null || !('layoutMode' in parent) || parent.layoutMode === 'NONE';
}

/**
 * A printed box as a layout can place it: an auto width text keeps its line,
 * so its width is no miss of its place, and it is read where the edge that
 * holds its box lands (shareOf).
 */
function placedBox(node: Built, spec: NodeSpec, printed: Box): Box {
  if (!isAutoWidth(node)) return printed;
  const [x, y, width, height] = printed;
  return [x + (width - spec.abs[2]) * shareOf(node, spec), y, spec.abs[2], height];
}

/** One unit's check: where it prints, how close is close enough, and whether it may change sizing modes and layout. */
interface Check {
  readonly root: SceneNode & ChildrenMixin;
  readonly run: Run;
  readonly tolerance: number;
  /** A main component's sizing modes and layout are what every instance inherits: it keeps them. */
  readonly main: boolean;
}

/** Checks a printed unit against its plan and takes the fallbacks it needs; each is in the journal, and so is a check that cannot finish. */
export async function selfCheck(root: SceneNode & ChildrenMixin, rootSpec: NodeSpec, unit: string, run: Run): Promise<void> {
  const checked = await attempt(() => checkUnit(root, rootSpec, unit, run));
  if (checked.isErr()) run.journal.error(unit, `self-check: ${checked.error}`);
}

async function checkUnit(root: SceneNode & ChildrenMixin, rootSpec: NodeSpec, unit: string, run: Run): Promise<void> {
  const plan = placedIn(rootSpec);
  const subjects: Subject[] = printedBy(root, unit).flatMap((node) => {
    const placed = plan.get(read(node, ENTRY.key));
    return placed && isBuilt(node) ? [{ node, placed }] : [];
  });
  const check: Check = { root, run, tolerance: run.bundle.file.tolerance, main: root.type === 'COMPONENT' };
  const outermostFirst = [...subjects].sort((a, b) => a.placed.depth - b.placed.depth);
  const shown = outermostFirst.filter((subject) => shows(subject.node, root));

  // Fixed lengths first, outermost first: no sizing mode changes, so a main takes them too.
  for (const subject of shown) fixFixed(subject, check);
  if (check.main) {
    readMain(shown, rootSpec, check);
    return;
  }
  // Then hugging lengths, deepest first, pass after pass until none changes a sizing mode. A
  // height waits while the width misses, as what it holds wraps at the width; once a pass
  // fixes nothing, one more takes the heights still waiting as they are.
  const deepestFirst = [...shown].reverse();
  for (let patient = true; ; ) {
    const changed = await fixHugs(deepestFirst, check, patient);
    if (!changed && !patient) break;
    patient = changed;
  }
  await freeLayouts(outermostFirst, check);
}

/** One pass of hugging fixes; true when a sizing mode changed. */
async function fixHugs(subjects: readonly Subject[], check: Check, patient: boolean): Promise<boolean> {
  let changed = false;
  for (const subject of subjects) {
    if (!fixHug(subject, check, patient)) continue;
    changed = true;
    await check.run.slicer.tick();
  }
  return changed;
}

/** How far a subject is from its measured box, relative to the unit's root, as a layout can place it. */
function missing(subject: Subject, check: Check): number {
  const { node, placed } = subject;
  return missOf(placedBox(node, placed.spec, relativeTo(absoluteBox(node), absoluteBox(check.root))), placed.spec.abs);
}

const boxText = ([x, y, width, height]: Box): string => `${String(+width.toFixed(2))} x ${String(+height.toFixed(2))} at ${String(+x.toFixed(2))}, ${String(+y.toFixed(2))}`;

/**
 * A main's nodes that miss their measured boxes, read against where the
 * layout model puts them around the leaves Figma printed (docs/redesign/FIGMA_PRINT.md
 * §5, Leaf sizes): a node within the tolerance of that box misses only by
 * what Figma's text metrics move, a fallback with both boxes; a node off it
 * is a layout the print got wrong, an error, so the component prints again.
 */
function readMain(subjects: readonly Subject[], rootSpec: NodeSpec, check: Check): void {
  const printed = new Map(subjects.map(({ node, placed }) => [placed.spec.key, node] as const));
  const leafSize = (leaf: NodeSpec): Size | undefined => {
    const node = printed.get(leaf.key);
    return node ? [node.width, node.height] : undefined;
  };
  const laidOut = rootSpec.type === 'FRAME' ? boxesIn(rootSpec, { leafSize, rootHugs: true }) : new Map<string, Box>();
  const origin = absoluteBox(check.root);
  for (const subject of subjects) {
    const miss = missing(subject, check);
    if (miss <= check.tolerance) continue;
    const { key, abs } = subject.placed.spec;
    const box = relativeTo(absoluteBox(subject.node), origin);
    const laid = laidOut.get(key);
    const off = laid ? missOf(box, laid) : miss;
    if (off <= check.tolerance) check.run.journal.fallback({ key, from: `measured ${boxText(abs)}`, to: `Figma's text metrics ${boxText(box)}`, miss });
    else check.run.journal.error(key, `its main misses its measured box by ${miss.toFixed(2)} px, and the layout Figma gives its leaves by ${off.toFixed(2)} px; a main keeps its sizing and layout, which its instances inherit`);
  }
}

/** A node's fixed lengths that miss, set again to their measured lengths. */
function fixFixed({ node, placed }: Subject, check: Check): void {
  const { spec } = placed;
  const axes = AXES.filter((axis) => holdOf(node, axis) === 'FIXED' && lengthMiss(node, spec, axis) > check.tolerance);
  if (axes.length === 0) return;
  const miss = worstLength(node, spec, axes);
  const done = guard(check.run, spec.key, 'measured size', () => {
    resizeToMeasured(node, spec, axes);
  });
  if (done) check.run.journal.fallback({ key: spec.key, from: `FIXED ${axes.join(', ')}`, to: `FIXED ${String(node.width)} x ${String(node.height)}`, miss });
}

/** A node's own hugging lengths that miss, fixed; true when a sizing mode changed, so the next pass measures again. */
function fixHug(subject: Subject, check: Check, patient: boolean): boolean {
  const { node } = subject;
  const misses = (axis: Axis): boolean => lengthMiss(node, subject.placed.spec, axis) > check.tolerance;
  const waits = (axis: Axis): boolean => axis === 'v' && patient && misses('h');
  return node.type === 'TEXT' ? fixText(node, subject.placed.spec, check, { misses, waits }) : fixFrame(node, subject.placed.spec, check, { misses, waits });
}

interface Judge {
  /** Whether the node's own length misses on an axis. */
  readonly misses: (axis: Axis) => boolean;
  /** Whether an axis waits for the next pass. */
  readonly waits: (axis: Axis) => boolean;
}

const hugOf = (axis: Axis): string => `HUG ${axis === 'h' ? 'width' : 'height'}`;

/**
 * A frame's or an instance's hugging axes that miss, fixed at their measured
 * lengths in one resize. Which axes is read before any is set, so a height
 * still waits while the width it wraps at misses, and an axis not fixed keeps
 * hugging.
 */
function fixFrame(node: Exclude<Built, TextNode>, spec: NodeSpec, check: Check, judge: Judge): boolean {
  const fixes = AXES.filter((axis) => spec.sizing[axis] === 'HUG' && holdOf(node, axis) === 'HUG' && judge.misses(axis) && !judge.waits(axis));
  if (fixes.length === 0) return false;
  const miss = worstLength(node, spec, AXES);
  const from = fixes.map(hugOf).join(', ');
  const fixed = guard(check.run, spec.key, from, () => {
    for (const axis of fixes) setSizing(node, axis, 'FIXED');
    resizeToMeasured(node, spec, fixes);
  });
  if (fixed) check.run.journal.fallback({ key: spec.key, from, to: `FIXED ${String(node.width)} x ${String(node.height)}`, miss });
  return fixed;
}

/**
 * An auto sized text that misses. An auto width text is never set narrower
 * than its line, which would wrap it: one Figma sets narrower than measured
 * takes the measured width and wraps as its content does, and one it sets
 * wider keeps its line, its aligned edge on the measured one where its
 * parent leaves the place to it. A wrapping text's height is fixed at its
 * measured length.
 */
function fixText(node: TextNode, spec: NodeSpec, check: Check, judge: Judge): boolean {
  const { run } = check;
  const [, , width, height] = spec.abs;
  const natural = node.width;
  const wide = judge.misses('h');
  let fixed = false;
  if (node.textAutoResize === 'WIDTH_AND_HEIGHT' && wide && natural < width) {
    // As sizeText does: a fixed box takes the width, then the height follows the lines.
    fixed = guard(run, spec.key, 'measured width', () => {
      node.textAutoResize = 'NONE';
      resizeTo(node, width, node.height);
      node.textAutoResize = 'HEIGHT';
    });
    if (fixed) run.journal.fallback({ key: spec.key, from: 'WIDTH_AND_HEIGHT', to: `HEIGHT ${String(width)}`, miss: width - natural });
  } else if (node.textAutoResize === 'HEIGHT' && judge.misses('v') && !judge.waits('v')) {
    const from = node.height;
    fixed = guard(run, spec.key, 'measured height', () => {
      node.textAutoResize = 'NONE';
      resizeTo(node, node.width, height);
    });
    if (fixed) run.journal.fallback({ key: spec.key, from: 'HEIGHT', to: `NONE ${String(node.width)} x ${String(height)}`, miss: Math.abs(height - from), linesHeight: from });
  }
  if (wide && isFree(node)) guard(run, spec.key, 'aligned edge', () => (node.x = xIn(node, spec.box, shareOf(node, spec))));
  return fixed;
}

/** A frame's children in reverse, and its layout's paint order flag set with them. */
function restack(node: Container, reversed: boolean): void {
  for (const child of [...node.children].reverse()) node.appendChild(child);
  node.itemReverseZIndex = reversed;
}

/**
 * Takes a frame's auto layout off in the paint order the layout gave it.
 * Without auto layout the last child paints on top, so a layout that painted
 * its first child on top gives its children in reverse first, the flag
 * cleared while it is still the layout's to clear. A frame Figma does not
 * free keeps its layout and its order.
 */
function freeLayout(node: Container, key: string, run: Run): boolean {
  const reversed = node.itemReverseZIndex;
  if (reversed && !guard(run, key, 'paint order', () => restack(node, false))) return false;
  if (guard(run, key, 'free layout', () => (node.layoutMode = 'NONE'))) return true;
  if (reversed) guard(run, key, 'paint order', () => restack(node, true));
  return false;
}

/** Outermost first, an auto layout frame whose children still miss lays them out at their measured offsets. */
async function freeLayouts(outermostFirst: readonly Subject[], check: Check): Promise<void> {
  const { run, root, tolerance } = check;
  const byKey = new Map(outermostFirst.map((subject) => [subject.placed.spec.key, subject] as const));
  for (const subject of outermostFirst) {
    const { node, placed } = subject;
    if (placed.spec.type !== 'FRAME' || placed.spec.layout.mode === 'NONE' || node.type === 'TEXT' || node.type === 'INSTANCE') continue;
    const children = placed.spec.children.flatMap((child) => {
      const found = byKey.get(child.key);
      return found && child.absolute === undefined ? [found] : [];
    });
    const worst = Math.max(0, ...children.filter((child) => shows(child.node, root)).map((child) => missing(child, check)));
    if (worst <= tolerance) continue;
    const from = node.layoutMode;
    // What holds each child's box is the layout's, read before it goes.
    const placing = children.map((child) => ({ child, share: shareOf(child.node, child.placed.spec) }));
    if (!freeLayout(node, placed.spec.key, run)) continue;
    guard(run, placed.spec.key, 'measured size', () => {
      resizeTo(node, placed.spec.box[2], placed.spec.box[3]);
    });
    for (const { child, share } of placing) {
      guard(run, child.placed.spec.key, 'measured offset', () => {
        placeAt(child.node, child.placed.spec, share);
      });
    }
    run.journal.fallback({ key: placed.spec.key, from, to: 'NONE', miss: worst });
    await run.slicer.tick();
  }
}
