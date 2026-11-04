/**
 * The acceptance lines (docs/redesign/FIGMA_PRINT.md §9), each a pure function of the
 * plan and the plugin's report. A line PASSes when the report proves it,
 * FAILs when the report disproves it, and stays UNPROVEN when the two do not
 * carry what it needs; its evidence gives the counts and the first offenders.
 */
import type { Box, ColorRef, FrameSpec, GridTrack, LayoutSpec, NodeSpec, PaintSpec, PlanBundle, PrintReport, TextSpec, VariantSpec } from '../plan/schema.mts';
import { heldOnRoutes } from './census.mts';
import { indexPlan, isFrameEntry, isInstanceEntry, isTextEntry, subtreeOf, type PlanEntry, type PlanIndex } from './plan-index.mts';
import { purityOf } from './purity.mts';

export type LineId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9';
export type Status = 'PASS' | 'FAIL' | 'UNPROVEN';
export type ReportNode = PrintReport['nodes'][number];
export type ReportUnit = PrintReport['units'][number];

export interface Offender {
  readonly key: string;
  readonly detail?: string;
}

export interface Evidence {
  readonly text: string;
  /** The first offenders, at most FIRST of them. */
  readonly offenders?: readonly Offender[];
  /** How many offenders there are in all. */
  readonly total?: number;
}

export interface Line {
  readonly id: LineId;
  readonly title: string;
  readonly status: Status;
  readonly evidence: readonly Evidence[];
}

/** How many offenders a line names. */
export const FIRST = 10;

/** The lines of docs/redesign/FIGMA_PRINT.md §9, as this check states what it proves. */
export const TITLES: Readonly<Record<LineId, string>> = {
  F1: 'Every plan key is printed exactly once, and the report names no key the plan does not',
  F2: 'Every figure part and instance lies within the tolerance of its measured box',
  F3: 'Every text node has its measured line count and width, a single line Figma sets wider on the edge that holds it',
  F4: 'No paint is raw unless the plan measured its colour, and every text node carries its text style',
  F5: 'The instances per variant equal the census less the reported frames, and none is detached',
  F6: 'Every row reads left to right in plan order, and every grid child sits in its cell',
  F7: 'Printing unchanged plans with an unchanged printer changes nothing',
  F8: 'Each print is pure: in the printed file and in the plan, a frame or main binds its own print’s collection only and holds no layer only another print renders; in the plan, its instances show its own print’s variants',
  F9: 'Before printing, the Figma layout model finds no drift and no sizing conflict in either print',
};

/** CSS `line-height: normal` as the planner sizes a text box with it (plan/nodes.mts): this many times the font size. */
export const NORMAL_LINE_HEIGHT = 1.2;

/** Units every print runs again: they prove a run, not a change, so F7 leaves them out. */
export const RUN_UNITS: ReadonlySet<ReportUnit['kind']> = new Set(['preflight']);

/** Floating point noise below this is no distance. */
const EPSILON = 1e-6;

export interface Context {
  readonly bundle: PlanBundle;
  readonly report: PrintReport;
  /** The report of the print before this one at the same revision by the same printer, when there was one. */
  readonly previous: PrintReport | null;
  readonly plan: PlanIndex;
  /** The first report node of each key. */
  readonly printed: ReadonlyMap<string, ReportNode>;
  readonly tolerance: number;
  /** The kit parts F2 holds to their measured boxes, beside every instance (`FileSpec.boxed`). */
  readonly boxed: ReadonlySet<string>;
}

export function contextOf(bundle: PlanBundle, report: PrintReport, previous: PrintReport | null): Context {
  const printed = new Map<string, ReportNode>();
  for (const node of report.nodes) if (!printed.has(node.key)) printed.set(node.key, node);
  return { bundle, report, previous, plan: indexPlan(bundle), printed, tolerance: bundle.file.tolerance, boxed: new Set(bundle.file.boxed) };
}

/** Why a report cannot be checked against this plan, or null when it can. */
export function comparable(bundle: PlanBundle, report: PrintReport): string | null {
  if (report.protocol !== bundle.protocol) return `the report speaks protocol ${report.protocol} and the plan ${bundle.protocol}`;
  if (report.revision !== bundle.revision) return `the report is of revision ${report.revision} and the plan on disk is ${bundle.revision}: print the current plan, or plan the revision the report printed`;
  if (report.fileKey !== null && report.fileKey !== bundle.file.fileKey) return `the report is of file ${report.fileKey} and the plan prints ${bundle.file.fileKey}`;
  return null;
}

// ---------------------------------------------------------------- evidence

const line = (id: LineId, status: Status, evidence: readonly Evidence[]): Line => ({ id, title: TITLES[id], status, evidence });

function verdict(failed: boolean, unproven: boolean): Status {
  if (failed) return 'FAIL';
  return unproven ? 'UNPROVEN' : 'PASS';
}

/** Evidence that names offenders, or none when there are none. */
const listed = (text: string, offenders: readonly Offender[]): Evidence[] =>
  offenders.length === 0 ? [] : [{ text: `${text} (${offenders.length})`, offenders: offenders.slice(0, FIRST), total: offenders.length }];

const noted = (when: boolean, text: string): Evidence[] => (when ? [{ text }] : []);

const keyed = (keys: Iterable<string>): Offender[] => [...keys].map((key) => ({ key }));

/** A count with its noun, singular for one. */
export const counted = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

const px = (value: number): string => `${Math.round(value * 100) / 100} px`;
const within = (distance: number, tolerance: number): boolean => distance <= tolerance + EPSILON;
const missOf = (a: Box, b: Box): number => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]), Math.abs(a[3] - b[3]));
const entriesOf = (plan: PlanIndex): readonly PlanEntry[] => [...plan.byKey.values()];

const add = (counts: Map<string, number>, key: string, by: number): void => {
  counts.set(key, (counts.get(key) ?? 0) + by);
};

function countBy<Item>(items: Iterable<Item>, keyOf: (item: Item) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) add(counts, keyOf(item), 1);
  return counts;
}

/** The last segment of a key, which names a layer among its siblings. */
const tail = (key: string): string => key.slice(key.lastIndexOf('/') + 1);

/** Each item with the one after it. */
function pairsOf<Item>(items: readonly Item[]): (readonly [Item, Item])[] {
  return items.flatMap((item, at) => {
    const next = items[at + 1];
    return next === undefined ? [] : [[item, next] as const];
  });
}

// ---------------------------------------------------------------- subjects

type Judgement = 'ok' | { readonly miss: string } | { readonly unprovable: string };

interface Tally {
  readonly subjects: number;
  readonly compared: number;
  readonly hidden: number;
  readonly misses: readonly Offender[];
  readonly unproven: readonly Offender[];
}

/** Judges every subject the report shows; a hidden one is counted, never compared. */
function tally<Entry extends PlanEntry>(subjects: readonly Entry[], printed: ReadonlyMap<string, ReportNode>, judge: (entry: Entry, node: ReportNode) => Judgement): Tally {
  const misses: Offender[] = [];
  const unproven: Offender[] = [];
  let hidden = 0;
  for (const entry of subjects) {
    const { key } = entry.node;
    const node = printed.get(key);
    if (!entry.shown) {
      hidden += 1;
      continue;
    }
    if (!node) {
      unproven.push({ key, detail: 'not in the report' });
      continue;
    }
    const judgement = judge(entry, node);
    if (judgement === 'ok') continue;
    if ('miss' in judgement) misses.push({ key, detail: judgement.miss });
    else unproven.push({ key, detail: judgement.unprovable });
  }
  return { subjects: subjects.length, compared: subjects.length - hidden - unproven.length, hidden, misses, unproven };
}

const tallied = (id: LineId, result: Tally, headline: string): Line =>
  line(id, verdict(result.misses.length > 0, result.unproven.length > 0), [
    { text: headline },
    ...noted(result.hidden > 0, `${result.hidden} hidden, not compared`),
    ...listed('miss', result.misses),
    ...listed('not proven', result.unproven),
  ]);

// ---------------------------------------------------------------- F1

export function keysLine({ plan, report }: Context): Line {
  const counts = countBy(report.nodes, (node) => node.key);
  const keys = [...plan.byKey.keys()];
  const missing = keys.filter((key) => !counts.has(key));
  const repeated = keys.flatMap((key) => {
    const count = counts.get(key) ?? 0;
    return count > 1 ? [{ key, detail: `${count} times` }] : [];
  });
  const unknown = [...counts.keys()].filter((key) => !plan.byKey.has(key) && !plan.structural.has(key));
  return line('F1', verdict(missing.length + repeated.length + unknown.length + plan.repeated.length > 0, false), [
    { text: `${counted(keys.length, 'plan key')}, ${keys.length - missing.length - repeated.length} printed exactly once` },
    ...listed('missing from the report', keyed(missing)),
    ...listed('printed more than once', repeated),
    ...listed('in the report and not in the plan', keyed(unknown)),
    ...listed('named more than once by the plan itself', keyed(plan.repeated)),
  ]);
}

// ---------------------------------------------------------------- F2

const boxedBy = (parts: ReadonlySet<string>) => ({ node }: PlanEntry): boolean => node.type === 'INSTANCE' || (node.part !== undefined && parts.has(node.part));

export function boxesLine({ plan, printed, tolerance, boxed }: Context): Line {
  const result = tally(entriesOf(plan).filter(boxedBy(boxed)), printed, ({ node }, shown) => {
    const miss = missOf(shown.box, node.abs);
    return within(miss, tolerance) ? 'ok' : { miss: `${px(miss)} from its measured box` };
  });
  const headline = `${result.compared} of ${result.subjects} figure parts and instances compared, ${result.compared - result.misses.length} within ${px(tolerance)} of their measured boxes`;
  return tallied('F2', result, headline);
}

// ---------------------------------------------------------------- F3

/** How far the nearest of a box's edges, or its centre, is from the same edge of another. */
const edgeMiss = (a: Box, b: Box): number => Math.min(Math.abs(a[0] - b[0]), Math.abs(a[0] + a[2] - b[0] - b[2]), Math.abs(a[0] + a[2] / 2 - b[0] - b[2] / 2));

export function textLine({ bundle, report, plan, printed, tolerance }: Context): Line {
  const styles = new Map(bundle.textStyles.map((style) => [style.key, style] as const));
  const linesHeld = new Map(report.fallbacks.flatMap((fallback) => (fallback.linesHeight === undefined ? [] : [[fallback.key, fallback.linesHeight] as const])));
  let wider = 0;
  const result = tally(entriesOf(plan).filter(isTextEntry), printed, ({ node: text }, shown) => {
    const style = styles.get(text.style);
    if (!style) return { unprovable: `its style ${text.style} is not in the plan` };
    const lineHeight = style.lineHeight ?? style.size * NORMAL_LINE_HEIGHT;
    if (!(lineHeight > 0)) return { unprovable: `its style ${style.name} has no line height` };
    // A text held at a height shows its lines by the height they took before (the self-check's), or by its minimum.
    const minimum = text.minHeight !== undefined && within(Math.abs(shown.box[3] - text.minHeight), tolerance) && text.lines * lineHeight <= text.minHeight + tolerance;
    const lines = Math.round((linesHeld.get(text.key) ?? (minimum ? text.lines * lineHeight : shown.box[3])) / lineHeight);
    // A single line Figma sets wider keeps its line, the edge that holds its box on the measured one (§3.3).
    const line = text.resize === 'WIDTH_AND_HEIGHT' && shown.box[2] > text.abs[2] && within(edgeMiss(shown.box, text.abs), tolerance);
    if (line && !within(shown.box[2] - text.abs[2], tolerance)) wider += 1;
    const misses = [
      ...(line || within(Math.abs(shown.box[2] - text.abs[2]), tolerance) ? [] : [`${px(shown.box[2])} wide for ${px(text.abs[2])}`]),
      ...(lines === text.lines ? [] : [`${lines} lines for ${text.lines}`]),
    ];
    return misses.length === 0 ? 'ok' : { miss: misses.join(', ') };
  });
  const headline = `${result.compared} of ${result.subjects} text nodes compared, ${result.compared - result.misses.length} at their measured width and line count, ${wider} of them single lines Figma sets wider on the edge that holds them`;
  return tallied('F3', result, headline);
}

// ---------------------------------------------------------------- F4

const unbound = (color: ColorRef): boolean => color.variable === undefined;
const measuredOnly = (paint: PaintSpec): boolean => (paint.type === 'SOLID' ? unbound(paint.color) : paint.stops.some((stop) => unbound(stop.color)));

/**
 * Whether the plan lets a node carry raw paints, because it marks one of the
 * node's colours as measured only. An instance may carry what its overrides
 * or its main component's layers measured. An imported drawing answers null:
 * its spec lists the colours it binds, not the ones it leaves raw.
 */
function rawAllowance(variants: ReadonlyMap<string, VariantSpec>): (node: NodeSpec) => boolean | null {
  const mains = new Map<string, boolean | null>();
  function anyOf(answers: readonly (boolean | null)[]): boolean | null {
    if (answers.includes(true)) return true;
    return answers.includes(null) ? null : false;
  }
  function ofMain(variant: string): boolean | null {
    const known = mains.get(variant);
    if (known !== undefined) return known;
    // A main that holds itself reads as unknowable rather than looping.
    mains.set(variant, null);
    const main = variants.get(variant);
    const answer = main ? anyOf(subtreeOf(main.root).map(allowed)) : null;
    mains.set(variant, answer);
    return answer;
  }
  function allowed(node: NodeSpec): boolean | null {
    switch (node.type) {
      case 'FRAME':
        return [...node.fills, ...node.strokes].some(measuredOnly);
      case 'TEXT':
        return [...node.fills, ...(node.runs ?? []).flatMap((run) => run.fills ?? [])].some(measuredOnly);
      case 'SVG':
        return null;
      case 'INSTANCE':
        return (
          node.overrides.some((override) => [...(override.fills ?? []), ...(override.strokes ?? [])].some(measuredOnly) || (override.recolor ?? []).some((pair) => unbound(pair.to))) ||
          ofMain(node.component)
        );
    }
  }
  return allowed;
}

/** The text styles a text node may carry: its own, and its runs'. */
const stylesOf = (text: TextSpec): ReadonlySet<string> => new Set([text.style, ...(text.runs ?? []).flatMap((run) => (run.style === undefined ? [] : [run.style]))]);

export function paintsLine({ plan, printed, report }: Context): Line {
  const allowed = rawAllowance(plan.variants);
  // A raw paint on a key the plan does not name is F1's to report.
  const raw = report.nodes.flatMap((node) => {
    const entry = plan.byKey.get(node.key);
    const count = node.rawPaints ?? 0;
    return entry && count > 0 ? [{ offender: { key: node.key, detail: `${count} raw` }, answer: allowed(entry.node) }] : [];
  });
  const forbidden = raw.filter(({ answer }) => answer === false).map(({ offender }) => offender);
  const unitemised = raw.filter(({ answer }) => answer === null).map(({ offender }) => offender);
  const unstyled: Offender[] = [];
  const restyled: Offender[] = [];
  const unreported: Offender[] = [];
  const texts = entriesOf(plan).filter(isTextEntry);
  for (const { node: text } of texts) {
    const node = printed.get(text.key);
    if (!node) unreported.push({ key: text.key, detail: 'not in the report' });
    else if (node.textStyle === undefined) unstyled.push({ key: text.key });
    else if (!stylesOf(text).has(node.textStyle)) restyled.push({ key: text.key, detail: `${node.textStyle}, not ${text.style}` });
  }
  const styled = texts.length - unstyled.length - restyled.length - unreported.length;
  return line('F4', verdict(forbidden.length + unstyled.length + restyled.length > 0, unitemised.length + unreported.length > 0), [
    { text: `${counted(raw.length, 'printed plan node')} with raw paints, ${raw.length - forbidden.length - unitemised.length} of them where the plan measured the colour; ${styled} of ${texts.length} text nodes carry their text style` },
    ...listed('raw paints where the plan binds every colour', forbidden),
    ...listed('raw paints on drawings, whose raw colours the plan does not list', unitemised),
    ...listed('text nodes with no text style', unstyled),
    ...listed('text nodes with another text style', restyled),
    ...listed('text nodes not proven', unreported),
  ]);
}

// ---------------------------------------------------------------- F5

/** Where two counts by key differ: each key with both counts, in key order. */
function differences(want: ReadonlyMap<string, number>, got: ReadonlyMap<string, number>, say: (got: number, want: number) => string): Offender[] {
  return [...new Set([...want.keys(), ...got.keys()])].toSorted().flatMap((key) => {
    const wanted = want.get(key) ?? 0;
    const found = got.get(key) ?? 0;
    return wanted === found ? [] : [{ key: key === '' ? 'no main component' : key, detail: say(found, wanted) }];
  });
}

export function instancesLine({ bundle, plan, printed, report }: Context): Line {
  const instances = entriesOf(plan).filter(isInstanceEntry);
  const planned = countBy(instances, ({ node }) => node.component);
  const shown = countBy(
    report.nodes.filter((node) => node.type === 'INSTANCE' && plan.byKey.has(node.key)),
    (node) => node.instanceOf ?? ''
  );
  const recounted = differences(planned, shown, (got, want) => `${got} printed for ${want} in the plan`);
  const detached: Offender[] = [];
  const relinked: Offender[] = [];
  for (const { node: spec } of instances) {
    const node = printed.get(spec.key);
    if (node && node.type !== 'INSTANCE') detached.push({ key: spec.key, detail: `printed as ${node.type}` });
    else if (node && node.instanceOf !== spec.component) relinked.push({ key: spec.key, detail: `an instance of ${node.instanceOf ?? 'no main component'}, not ${spec.component}` });
  }
  const onRoutes = instances.flatMap(({ node, onRoute }) => (onRoute ? [node] : []));
  const census = new Map(Object.entries(bundle.report.instances));
  const uncounted = differences(census, heldOnRoutes(plan.variants, onRoutes), (got, want) => `the routes hold ${got}, the census less its frames ${want}`);
  const frames = bundle.report.frames.map((frame) => ({ key: frame.key, detail: `${frame.component}: ${frame.reason}` }));
  const made = [...census.values()].reduce((sum, count) => sum + count, 0);
  return line('F5', verdict(recounted.length + detached.length + relinked.length + uncounted.length > 0, false), [
    { text: `${counted(instances.length, 'instance node')} in the plan; the census has ${counted(made, 'instance')}, and ${counted(frames.length, 'occurrence')} kept as frames` },
    ...listed('variants printed a different number of times than planned', recounted),
    ...listed('instances printed detached', detached),
    ...listed('instances of another main component', relinked),
    ...listed('variants whose census the route frames do not hold', uncounted),
    ...listed('occurrences the plan keeps as frames', frames),
  ]);
}

// ---------------------------------------------------------------- F6

type Grid = Extract<LayoutSpec, { readonly mode: 'GRID' }>;
type Cell = NonNullable<FrameSpec['grid']>;

export interface Span {
  readonly start: number;
  readonly end: number;
}

/** Each track's length at the length the grid printed: FLEX tracks share what the other tracks and the gaps leave, by weight. */
export function trackSizes(tracks: readonly GridTrack[], gap: number, length: number): readonly number[] {
  const set = tracks.reduce((sum, track) => sum + (track.type === 'FLEX' ? 0 : track.value), 0);
  const weight = tracks.reduce((sum, track) => sum + (track.type === 'FLEX' ? track.value : 0), 0);
  const free = Math.max(0, length - set - gap * Math.max(0, tracks.length - 1));
  const share = (track: GridTrack): number => (weight > 0 ? (free * track.value) / weight : 0);
  return tracks.map((track) => (track.type === 'FLEX' ? share(track) : track.value));
}

/** The run of `count` tracks from `index`, with the gaps between them, from the first track's edge. */
export function spanOf(sizes: readonly number[], gap: number, index: number, count: number): Span | null {
  if (index < 0 || count < 1 || index + count > sizes.length) return null;
  const sum = (from: number, to: number): number => sizes.slice(from, to).reduce((total, size) => total + size, 0);
  const start = sum(0, index) + gap * index;
  return { start, end: start + sum(index, index + count) + gap * (count - 1) };
}

/** A grid child's cell, as offsets from the top left of the grid's printed box. */
export function cellIn(frame: FrameSpec, grid: Grid, cell: Cell, printed: Box): { readonly x: Span; readonly y: Span } | null {
  const strokes = grid.strokesIncluded ? frame.strokeWeights : undefined;
  const inset = (side: 0 | 1 | 2 | 3): number => grid.padding[side].value + (strokes?.[side].value ?? 0);
  const [top, right, bottom, left] = [inset(0), inset(1), inset(2), inset(3)];
  const x = spanOf(trackSizes(grid.cols, grid.colGap.value, printed[2] - left - right), grid.colGap.value, cell.col, cell.colSpan);
  const y = spanOf(trackSizes(grid.rows, grid.rowGap.value, printed[3] - top - bottom), grid.rowGap.value, cell.row, cell.rowSpan);
  return x && y ? { x: { start: x.start + left, end: x.end + left }, y: { start: y.start + top, end: y.end + top } } : null;
}

type Where = { readonly kind: 'placed'; readonly key: string; readonly box: Box } | { readonly kind: 'hidden' } | { readonly kind: 'unproven'; readonly offender: Offender };

/** Where the report puts one child, or why it cannot tell. */
function whereIs(key: string, plan: PlanIndex, printed: ReadonlyMap<string, ReportNode>): Where {
  const shown = plan.byKey.get(key)?.shown;
  const node = printed.get(key);
  if (shown === false) return { kind: 'hidden' };
  if (!node) return { kind: 'unproven', offender: { key, detail: 'not in the report' } };
  return { kind: 'placed', key, box: node.box };
}

/** Why a grid child's cell cannot be placed: the plan gives none, the grid is not in the report, or the cell lies past its tracks. */
function noCell(planned: boolean, gridPrinted: boolean): string {
  if (!planned) return 'the plan gives it no cell';
  return gridPrinted ? 'its cell lies outside the grid tracks' : 'its grid is not in the report';
}

type Flow = readonly { readonly child: NodeSpec; readonly where: Where }[];

/** A frame's in-flow children, each where the report puts it. */
const flowOf = (frame: FrameSpec, plan: PlanIndex, printed: ReadonlyMap<string, ReportNode>): Flow =>
  frame.children.filter((child) => child.absolute === undefined).map((child) => ({ child, where: whereIs(child.key, plan, printed) }));

const unprovenIn = (flow: Flow): Offender[] => flow.flatMap(({ where }) => (where.kind === 'unproven' ? [where.offender] : []));

/** The first pair of a row's children that does not print left to right in plan order, or null. */
function rowOrder(frame: FrameSpec, flow: Flow, tolerance: number): Offender | null {
  const placed = flow.flatMap(({ where }) => (where.kind === 'placed' ? [where] : []));
  const swap = pairsOf(placed).find(([left, right]) => right.box[0] < left.box[0] - tolerance - EPSILON);
  return swap ? { key: frame.key, detail: `${tail(swap[1].key)} prints left of ${tail(swap[0].key)}` } : null;
}

interface Placement {
  readonly compared: number;
  readonly misplaced: readonly Offender[];
  readonly unproven: readonly Offender[];
}

/** A grid's printed children, each in the cell its plan gives or not; a child counts as in it when its centre is. */
function gridPlacement(frame: FrameSpec, grid: Grid, flow: Flow, box: Box | undefined, tolerance: number): Placement {
  const near = (value: number, span: Span): boolean => value >= span.start - tolerance - EPSILON && value <= span.end + tolerance + EPSILON;
  const misplaced: Offender[] = [];
  const unproven: Offender[] = [];
  let compared = 0;
  for (const { child, where } of flow) {
    if (where.kind !== 'placed') continue;
    const cell = child.grid && box ? cellIn(frame, grid, child.grid, box) : null;
    if (!child.grid || !box || !cell) {
      unproven.push({ key: child.key, detail: noCell(child.grid !== undefined, box !== undefined) });
      continue;
    }
    compared += 1;
    const x = where.box[0] - box[0] + where.box[2] / 2;
    const y = where.box[1] - box[1] + where.box[3] / 2;
    if (!near(x, cell.x) || !near(y, cell.y)) misplaced.push({ key: child.key, detail: `its centre is outside row ${child.grid.row + 1}, column ${child.grid.col + 1} from the left` });
  }
  return { compared, misplaced, unproven };
}

export function orderLine({ plan, printed, tolerance }: Context): Line {
  const frames = entriesOf(plan)
    .filter(isFrameEntry)
    .flatMap(({ node, shown }) => (shown ? [node] : []));
  const rows = frames.filter((frame) => frame.layout.mode === 'HORIZONTAL').map((frame) => ({ frame, flow: flowOf(frame, plan, printed) }));
  const reversed = rows.flatMap(({ frame, flow }) => {
    const swap = rowOrder(frame, flow, tolerance);
    return swap ? [swap] : [];
  });
  const grids = frames.flatMap((frame) => {
    if (frame.layout.mode !== 'GRID') return [];
    const flow = flowOf(frame, plan, printed);
    return [{ flow, ...gridPlacement(frame, frame.layout, flow, printed.get(frame.key)?.box, tolerance) }];
  });
  const misplaced = grids.flatMap((grid) => grid.misplaced);
  const unproven = [...rows.flatMap(({ flow }) => unprovenIn(flow)), ...grids.flatMap((grid) => [...unprovenIn(grid.flow), ...grid.unproven])];
  const cells = grids.reduce((sum, grid) => sum + grid.compared, 0);
  return line('F6', verdict(reversed.length + misplaced.length > 0, unproven.length > 0), [
    { text: `${counted(rows.length, 'row')}, ${rows.length - reversed.length} reading left to right in plan order; ${counted(cells, 'grid child', 'grid children')} compared, ${cells - misplaced.length} in their cells` },
    ...listed('rows whose children print out of order', reversed),
    ...listed('grid children outside their cells', misplaced),
    ...listed('not proven', unproven),
  ]);
}

// ---------------------------------------------------------------- F7

const unitOf = (unit: ReportUnit): string => `${unit.kind} ${unit.key}`;

export function repeatLine({ report, previous }: Context): Line {
  if (!previous) return line('F7', 'UNPROVEN', [{ text: 'no earlier print of this revision by this printer to compare with; printing the same plans again proves it' }]);
  const before = new Map(previous.units.map((unit) => [unitOf(unit), unit.status] as const));
  const content = report.units.filter((unit) => !RUN_UNITS.has(unit.kind));
  const changed: Offender[] = [];
  const excused: Offender[] = [];
  for (const unit of content) {
    if (unit.status === 'unchanged') continue;
    const earlier = before.get(unitOf(unit));
    if (unit.status === 'built' && earlier !== 'built' && earlier !== 'unchanged') excused.push({ key: unitOf(unit), detail: earlier === 'failed' ? 'the earlier print failed it' : 'the earlier print did not reach it' });
    else changed.push({ key: unitOf(unit), detail: unit.status });
  }
  return line('F7', verdict(changed.length > 0, excused.length > 0), [
    { text: `${counted(content.length, 'plan unit')} against the print of ${previous.startedAt}, ${content.length - changed.length - excused.length} unchanged` },
    ...listed('units printed again', changed),
    ...listed('units built that the earlier print did not finish', excused),
  ]);
}

// ---------------------------------------------------------------- F8

/**
 * Purity read twice: from the printed file, where the plugin lists every
 * binding to another collection than a unit's print's and every layer only
 * the other print renders under its unit roots, and from the plan, which must
 * ask for neither. A planned unit the plugin did not read in full (it did not
 * print, or the read failed or missed a main) keeps its purity unproven.
 */
export function purityLine({ bundle, report }: Context): Line {
  const plan = purityOf(bundle);
  const impure = report.impure.map(({ unit, node, field, collection }) => ({ key: node, detail: `${field} binds ${collection}, in ${unit}` }));
  const strays = report.strays.map(({ unit, node }) => ({ key: node, detail: `only the other print renders it, in ${unit}` }));
  const read = new Set(report.read);
  const units = [...bundle.routes.map((route) => route.key), ...bundle.components.map((component) => component.key)];
  const unread = units.filter((unit) => !read.has(unit));
  return line('F8', verdict(impure.length + strays.length + plan.crossed.length + plan.foreign.length + plan.strays.length > 0, unread.length + plan.unknown.length > 0), [
    {
      text: `${units.length - unread.length} of ${counted(units.length, 'unit')} read in the printed file, with ${counted(impure.length, 'binding')} across the prints and ${counted(strays.length, 'layer')} of the other print; ${plan.own} of ${counted(plan.bindings, 'planned binding')} in ${counted(plan.frames, 'frame')} and ${counted(plan.mains, 'main')} bind their own print’s collection`,
    },
    ...listed('bindings across the prints in the printed file, or to the primitives directly', impure),
    ...listed('layers only the other print renders, in the printed file', strays),
    ...listed('planned bindings to another print’s collection, or to the primitives directly', plan.crossed),
    ...listed('instances and swaps that show the other print’s variant', plan.foreign),
    ...listed('planned layers only the other print renders', plan.strays),
    ...listed('units the printed file did not give in full, whose purity was not read', keyed(unread)),
    ...listed('not proven', plan.unknown),
  ]);
}

// ---------------------------------------------------------------- F9

/** A tally of the plan report as offenders, the largest first. */
const countsOf = (counts: Readonly<Record<string, number>>): Offender[] =>
  Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([key, n]) => ({ key, detail: counted(n, 'node') }));

export function layoutLine({ bundle }: Context): Line {
  const sum = (counts: Readonly<Record<string, number>>): number => Object.values(counts).reduce((total, n) => total + n, 0);
  const drift = sum(bundle.report.drift);
  const conflicts = sum(bundle.report.conflicts);
  return line('F9', verdict(drift + conflicts > 0, false), [
    { text: `the plan's layout model puts ${counted(drift, 'node')} off its measured box and finds ${counted(conflicts, 'sizing', 'sizings')} Figma cannot hold` },
    ...listed('drift, by print, parent layout and node', countsOf(bundle.report.drift)),
    ...listed('sizing conflicts, by print, conflict and node', countsOf(bundle.report.conflicts)),
  ]);
}

// ---------------------------------------------------------------- all

export const LINES: readonly ((context: Context) => Line)[] = [keysLine, boxesLine, textLine, paintsLine, instancesLine, orderLine, repeatLine, purityLine, layoutLine];

export const evaluate = (context: Context): readonly Line[] => LINES.map((check) => check(context));
