/**
 * Route frames on the site page (docs/redesign/FIGMA_PRINT.md §3.3.3, §8): one unit
 * per route, viewport and print. A route frame is a replaceable zone: a
 * changed one is built anew in the page's draft and takes the old one's place
 * once it printed; a failed build leaves the old frame as it was. A copy a
 * person makes of a route frame is theirs. The page holds two blocks apart,
 * one per print, each with a section per route group.
 */
import type { PrintName, RouteSpec } from '../../plan/schema.mts';
import { fillFrame } from './build.mts';
import { arrange, draftOn, moveTo, park, removeDrafts, sectionFor, type Shelf } from './canvas.mts';
import { pinConstraints } from './constraints.mts';
import { depsOf, printedHash, type Root } from './components.mts';
import type { Run } from './context.mts';
import { attempt } from './failure.mts';
import type { UnitStatus } from './journal.mts';
import { carrying, claim, ENTRY, KIND, keyOf, mark, printedOnes, read, stampId, write } from './keys.mts';
import { pageOf, type Role } from './pages.mts';
import { blockOf } from '../../plan/prints.mts';
import { selfCheck } from './selfcheck.mts';
import { dependenciesOf, distinct, ownersOf } from './specs.mts';
import type { Units } from './units.mts';

const ROLE: Role = 'site';

interface Stage {
  readonly run: Run;
  readonly page: PageNode;
  readonly draft: FrameNode;
  readonly frames: Map<string, FrameNode>;
  readonly roots: ReadonlyMap<string, Root>;
  readonly owners: ReturnType<typeof ownersOf>;
}

const routeFrames = (page: PageNode): FrameNode[] =>
  carrying(page, ENTRY.kind).filter((node): node is FrameNode => node.type === 'FRAME' && !node.removed && read(node, ENTRY.kind) === KIND.route);

/** The route frames a page holds by route key, only read: the one that prints each key, never a person's copy of it. */
export const routeFramesOn = (page: PageNode): ReadonlyMap<string, FrameNode> => printedOnes(routeFrames(page), keyOf).printed;

/** The route frames by key, claimed (keys.mts): a person's copy of one carries its entries, and is released to them, never removed. */
const claimFrames = (page: PageNode, run: Run): Map<string, FrameNode> =>
  claim(routeFrames(page), keyOf, (copy) => {
    run.journal.error(keyOf(copy), 'a copy of this route frame carried its entries; the copy is released to whoever made it, and no print touches it');
  });

/** A frame that printed leaves the draft: into the place of the frame it replaces, or onto the page where it was built. */
function takePlace(frame: FrameNode, old: FrameNode | undefined, page: PageNode): void {
  const parent = old?.parent;
  if (old && parent) {
    parent.insertChild(parent.children.indexOf(old), frame);
    frame.x = old.x;
    frame.y = old.y;
    old.remove();
    return;
  }
  const [[, , x], [, , y]] = frame.absoluteTransform;
  page.appendChild(frame);
  moveTo(frame, x, y);
}

async function printRoute(spec: RouteSpec, stage: Stage): Promise<UnitStatus> {
  const { run, page, draft, frames } = stage;
  const deps = depsOf(dependenciesOf([spec.frame], stage.owners), stage.roots);
  const hash = printedHash(spec.hash);
  const old = frames.get(spec.key);
  if (old && read(old, ENTRY.hash) === hash && read(old, ENTRY.deps) === deps) return 'unchanged';
  const before = run.journal.errors.length;
  const frame = figma.createFrame();
  draft.appendChild(frame);
  const filled = await attempt(() => fillFrame(frame, spec.frame, { run, unit: spec.key, host: null, draft }));
  if (filled.isErr()) {
    if (!frame.removed) frame.remove();
    throw new Error(filled.error);
  }
  await selfCheck(frame, spec.frame, spec.key, run);
  pinConstraints(frame, spec.frame, spec.key, run);
  // Marked, stamped and in place at once: the page never holds two frames that print one route.
  mark(frame, { key: spec.key, unit: spec.key, kind: KIND.route });
  stampId(frame);
  write(frame, ENTRY.deps, deps);
  write(frame, ENTRY.hash, run.journal.errors.length === before ? hash : '');
  takePlace(frame, old, page);
  frames.set(spec.key, frame);
  return 'built';
}

/** What lays the site page out: the plan, the page, and the route frames it holds by route key. */
interface Placing {
  readonly run: Run;
  readonly page: PageNode;
  readonly frames: ReadonlyMap<string, FrameNode>;
}

/** The rows of a group's section in a print's block: one per route, its viewports side by side in plan order, each the print's frame. */
function shelfOf(print: PrintName, group: string, block: SectionNode, placing: Placing): Shelf {
  const routes = placing.run.bundle.routes.filter((route) => route.print === print && route.group === group);
  const viewports = distinct(placing.run.bundle.routes.map((route) => route.viewport));
  const rows = distinct(routes.map((route) => route.route))
    .map((path) =>
      viewports.flatMap((viewport) => {
        const spec = routes.find((route) => route.route === path && route.viewport === viewport);
        const frame = spec ? placing.frames.get(spec.key) : undefined;
        return frame && !frame.removed ? [frame] : [];
      }),
    )
    .filter((row) => row.length > 0);
  return { section: sectionFor(block, ROLE, [print, group], group), rows };
}

/** A print's block: its section, holding a section per route group in plan order, side by side. */
function blockShelfOf(print: PrintName, placing: Placing): Shelf {
  const section = sectionFor(placing.page, ROLE, [print], blockOf(print));
  const groups = distinct(placing.run.bundle.routes.filter((route) => route.print === print).map((route) => route.group));
  return { section, rows: [groups.map((group) => shelfOf(print, group, section, placing))] };
}

/** The site page in order: the blocks one above the other, in plan order, each a row of its groups' sections. */
function layOut(placing: Placing): void {
  const blocks = distinct(placing.run.bundle.routes.map((route) => route.print)).map((print) => blockShelfOf(print, placing));
  arrange(placing.page, blocks.map((block) => [block]));
}

/** The site page laid out with the route frames it already holds, before any unit builds: a print that stopped left its frames where they were built. */
export function layOutSite(run: Run): void {
  const page = pageOf(run.pages, ROLE);
  removeDrafts(page);
  layOut({ run, page, frames: routeFramesOn(page) });
}

/** Prints every route frame, prunes the ones the plan dropped, and lays the page out by print and group: the frames, by route key. */
export async function printRoutes(run: Run, roots: ReadonlyMap<string, Root>, units: Units): Promise<ReadonlyMap<string, FrameNode>> {
  const page = pageOf(run.pages, ROLE);
  await figma.setCurrentPageAsync(page);
  const draft = draftOn(page, ROLE);
  const stage: Stage = { run, page, draft, frames: claimFrames(page, run), roots, owners: ownersOf(run.bundle.components) };
  try {
    for (const spec of run.bundle.routes) {
      const status = await units.run('route', spec.key, () => printRoute(spec, stage));
      // A frame that printed takes its place at once, and the draft moves past the page it grew.
      if (status === 'built') {
        layOut(stage);
        park(draft, page);
      }
    }
  } finally {
    if (!draft.removed) draft.remove();
  }
  // A partial plan leaves the routes it does not name as they are; the frames a complete one drops are counted before any goes.
  const planned = new Set(run.bundle.routes.map((route) => route.key));
  const dropped = run.bundle.complete ? [...stage.frames].filter(([key]) => !planned.has(key)) : [];
  units.expect(dropped.length);
  for (const [key, frame] of dropped) {
    await units.run('route', key, () => {
      frame.remove();
      stage.frames.delete(key);
      return 'built';
    });
  }
  layOut(stage);
  figma.commitUndo();
  return stage.frames;
}
