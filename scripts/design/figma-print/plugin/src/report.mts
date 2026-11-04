/**
 * The report (docs/redesign/FIGMA_PRINT.md §3.3.5, PrintReport): every keyed node of
 * every unit, read off the file whether this print built the unit or found
 * it unchanged, with its box relative to its route frame or main component,
 * what it is, the text style it carries and the paints it holds raw; and what
 * the purity read found (purity.mts): the units it read whole, the bindings
 * across the prints and the layers only the other print renders.
 */
import { PROTOCOL, type PlanBundle, type PrintReport } from '../../plan/schema.mts';
import type { Root } from './components.mts';
import type { Run } from './context.mts';
import type { Journal, NodeRecord } from './journal.mts';
import { ENTRY, exists, keyOf, printedBy, read } from './keys.mts';
import { isRaw } from './paint.mts';
import type { PurityRead } from './purity.mts';
import { absoluteBox, relativeTo } from './selfcheck.mts';
import { SETTINGS } from './settings.mts';

/** The raw paints of a node's own fills and strokes; a text's by its styled segments. */
function ownRaw(node: SceneNode): number {
  const count = (paints: readonly Paint[]): number => paints.filter(isRaw).length;
  let raw = 0;
  if (node.type === 'TEXT') raw += node.getStyledTextSegments(['fills']).reduce((sum, segment) => sum + count(segment.fills), 0);
  else if ('fills' in node && typeof node.fills !== 'symbol') raw += count(node.fills);
  if ('strokes' in node) raw += count(node.strokes);
  return raw;
}

/** The raw paints a node prints: its own, and those of every layer under it no keyed node of its unit reports. */
function rawIn(node: SceneNode, unit: string, root: boolean): number {
  if (!root && read(node, ENTRY.unit) === unit && keyOf(node) !== '') return 0;
  const below = 'children' in node ? node.children.filter(exists).reduce((sum, child) => sum + rawIn(child, unit, false), 0) : 0;
  return ownRaw(node) + below;
}

/** The plan key of the text style a text carries; a text of several styles is read by its longest one. */
function textStyleOf(text: TextNode, run: Run): string | undefined {
  if (typeof text.textStyleId === 'string') return run.library.styleKeys.get(text.textStyleId);
  const lengths = new Map<string, number>();
  for (const segment of text.getStyledTextSegments(['textStyleId'])) lengths.set(segment.textStyleId, (lengths.get(segment.textStyleId) ?? 0) + segment.end - segment.start);
  const [longest] = [...lengths].sort((a, b) => b[1] - a[1]);
  return longest ? run.library.styleKeys.get(longest[0]) : undefined;
}

async function recordOf(node: SceneNode, unit: string, origin: SceneNode, run: Run): Promise<NodeRecord> {
  const main = node.type === 'INSTANCE' ? await node.getMainComponentAsync() : null;
  const instanceOf = main ? keyOf(main) : '';
  const textStyle = node.type === 'TEXT' ? textStyleOf(node, run) : undefined;
  const rawPaints = rawIn(node, unit, true);
  return {
    key: keyOf(node),
    unit,
    type: node.type,
    box: relativeTo(absoluteBox(node), absoluteBox(origin)),
    ...(instanceOf === '' ? {} : { instanceOf }),
    ...(textStyle === undefined ? {} : { textStyle }),
    ...(rawPaints === 0 ? {} : { rawPaints }),
  };
}

/** The keyed nodes a unit printed under one root, those whose key carries `prefix` when one is given. */
async function recordsUnder(root: SceneNode & ChildrenMixin, unit: string, run: Run, prefix?: string): Promise<NodeRecord[]> {
  const records: NodeRecord[] = [];
  for (const node of printedBy(root, unit)) {
    const key = keyOf(node);
    if (key === '' || (prefix !== undefined && key !== prefix && !key.startsWith(`${prefix}/`))) continue;
    records.push(await recordOf(node, unit, root, run));
    await run.slicer.tick();
  }
  return records;
}

/** Every keyed node of every planned unit the file holds. */
export async function collectNodes(run: Run, frames: ReadonlyMap<string, FrameNode>, roots: ReadonlyMap<string, Root>): Promise<readonly NodeRecord[]> {
  const records: NodeRecord[] = [];
  for (const route of run.bundle.routes) {
    const frame = frames.get(route.key);
    if (frame && !frame.removed) records.push(...(await recordsUnder(frame, route.key, run)));
  }
  for (const component of run.bundle.components) {
    if (!roots.get(component.key)) continue;
    for (const variant of component.variants) {
      const main = run.mains.component(variant.key);
      if (main) records.push(...(await recordsUnder(main, component.key, run, variant.key)));
    }
  }
  return records;
}

/** What a report is read off: the plan and the journal. */
export interface Reported {
  readonly bundle: PlanBundle;
  readonly journal: Journal;
}

/** What the file holds once the units printed: every keyed node, and its purity. */
export interface Read extends PurityRead {
  readonly nodes: readonly NodeRecord[];
}

/** What a print that read nothing reports of the file. */
export const NOTHING_READ: Read = { nodes: [], read: [], impure: [], strays: [] };

/** The report of a print, as the receiver files it and the check reads it. */
export const reportOf = ({ bundle, journal }: Reported, startedAt: string, { nodes, read, impure, strays }: Read): PrintReport => ({
  protocol: PROTOCOL,
  revision: bundle.revision,
  printer: SETTINGS.printer,
  fileKey: figma.fileKey ?? null,
  startedAt,
  finishedAt: new Date().toISOString(),
  units: journal.units,
  nodes,
  read,
  impure,
  strays,
  fallbacks: journal.fallbacks,
  missingFonts: journal.missingFonts,
  errors: journal.errors,
});
