/**
 * One print of a plan (docs/redesign/FIGMA_PRINT.md §3.3), in the order each stage
 * needs the one before it: preflight (pages, fonts, file), variables, styles,
 * components, routes, and the report's two reads of the file. The whole plan
 * prints in one run, the design and the wire print side by side, and nothing
 * switches between them. Every unit is its own undo step and fails alone; the
 * print ends on the site page.
 */
import { err, ok, type Result } from 'neverthrow';
import type { FontNeed, PlanBundle, PrintReport } from '../../plan/schema.mts';
import { heldColorsOf } from './colors.mts';
import { layOutDesignSystem, printComponents, rootsOn, type Root } from './components.mts';
import { createLibrary, type Run } from './context.mts';
import { attempt, attemptSync } from './failure.mts';
import { loadFonts, type FontBook } from './fonts.mts';
import { createJournal, type Journal, type NodeRecord } from './journal.mts';
import { clearLegacy, keyOf } from './keys.mts';
import { createMains } from './mains.mts';
import { pageOf, preparePages, type Pages } from './pages.mts';
import { readPurity, type PurityRead } from './purity.mts';
import { collectNodes, NOTHING_READ, reportOf, type Read } from './report.mts';
import { layOutSite, printRoutes, routeFramesOn } from './routes.mts';
import { createSlicer, type YieldToEditor } from './slice.mts';
import { variableSpecsOf } from './specs.mts';
import { printEffectStyles, printTextStyles } from './styles.mts';
import { createUnits, type Units } from './units.mts';
import { printCollection, pruneCollection, readFileVariables, strayCollections, type VariablesContext } from './variables.mts';

/** Told as each step ends: a unit, or a read of the file as it starts. */
export type Progress = (done: number, total: number, label: string) => void;

export interface Printed {
  readonly report: PrintReport;
  /** The route frames the file holds, by route key: what the receiver gets a PNG of. */
  readonly frames: ReadonlyMap<string, FrameNode>;
  /** The pages the print wrote, when preflight found them. */
  readonly pages: Pages | null;
}

/** Every face the plan sets text in: its font list and each text style's face, once each. */
function needsOf(bundle: PlanBundle): readonly FontNeed[] {
  const needs = [...bundle.fonts, ...bundle.textStyles.map(({ family, weight, italic }) => ({ family, weight, italic }))];
  return [...new Map(needs.map((need) => [JSON.stringify([need.family, need.weight, need.italic]), need] as const)).values()];
}

interface Preflown {
  readonly pages: Pages;
  readonly fonts: FontBook;
}

/** The file key first, so nothing changes in another file; then the pages, then the fonts (a probe text is made on the design system page, never on another). */
async function preflight(bundle: PlanBundle, journal: Journal): Promise<Result<Preflown, string>> {
  if (figma.fileKey === undefined) return err('Figma names no file key here, so the file is not proven to be the one the plan prints; nothing was changed');
  if (figma.fileKey !== bundle.file.fileKey) return err(`this file is ${figma.fileKey}, and the plan prints ${bundle.file.fileKey}; nothing was changed`);
  const pages = await preparePages(bundle.file);
  if (pages.isErr()) return err(pages.error);
  const opened = await attempt(() => figma.setCurrentPageAsync(pageOf(pages.value, 'design-system')));
  if (opened.isErr()) return err(`the design system page does not open: ${opened.error}`);
  const fonts = await attempt(() => loadFonts(needsOf(bundle)));
  if (fonts.isErr()) return err(`the fonts do not load: ${fonts.error}`);
  for (const need of fonts.value.missing) journal.missingFont(need);
  // The document keeps nothing of the print switch an earlier protocol recorded on it.
  clearLegacy(figma.root);
  return ok({ pages: pages.value, fonts: fonts.value });
}

/** The reads of the file the report takes once the units printed, each a step of its own. */
const READ = { nodes: 'read nodes', purity: 'read purity' } as const;

/** The steps a plan counts: preflight, its collections, the two style units, its components and routes, and the reads; prunes add their own as found. */
const stepsIn = (bundle: PlanBundle): number => 1 + bundle.collections.length + 2 + bundle.components.length + bundle.routes.length + Object.keys(READ).length;

/** What the stages leave for the report: the component roots and the route frames the file holds. */
interface Printing {
  readonly roots: ReadonlyMap<string, Root>;
  readonly frames: ReadonlyMap<string, FrameNode>;
}

/** The roots on the design system page, when a stage could not say: what the routes instantiate and the report reads. */
const rootsFound = (run: Run): ReadonlyMap<string, Root> => attemptSync(() => rootsOn(pageOf(run.pages, 'design-system'))).unwrapOr(new Map());

/** The route frames on the site page, when a stage could not say: what the report reads and the receiver gets a PNG of. */
const framesFound = (run: Run): ReadonlyMap<string, FrameNode> => attemptSync(() => routeFramesOn(pageOf(run.pages, 'site'))).unwrapOr(new Map());

/** Variables, styles, components and routes: each stage's throw is the journal's, and the stages after it still run. */
async function printStages(run: Run, units: Units): Promise<Printing> {
  const { bundle, journal } = run;
  const context: VariablesContext = {
    file: await readFileVariables(journal),
    specs: variableSpecsOf(bundle.collections),
    library: run.library,
    journal,
    complete: bundle.complete,
  };
  for (const collection of bundle.collections) await units.run('variables', collection.key, () => printCollection(collection, context));
  const strays = bundle.complete ? strayCollections(bundle.collections, context) : [];
  units.expect(strays.length);
  for (const stray of strays) await units.run('variables', keyOf(stray), () => pruneCollection(stray, context));

  await units.run('styles', 'text', () => printTextStyles(bundle.textStyles, run));
  await units.run('styles', 'effect', () => printEffectStyles(bundle.effectStyles, run));

  const roots = await attempt(() => printComponents(run, units)).match(
    (found) => found,
    (message) => {
      journal.error('components', message);
      return rootsFound(run);
    },
  );
  const frames = await attempt(() => printRoutes(run, roots, units)).match(
    (found): ReadonlyMap<string, FrameNode> => found,
    (message) => {
      journal.error('routes', message);
      return framesFound(run);
    },
  );
  return { roots, frames };
}

/** What the file holds once the units printed, each read a step of its own: a read that throws is the journal's, and reads nothing. */
async function readPrinted(run: Run, frames: ReadonlyMap<string, FrameNode>, roots: ReadonlyMap<string, Root>, step: (label: string) => void): Promise<Read> {
  const { journal, bundle } = run;
  step(READ.nodes);
  const nodes = await attempt(() => collectNodes(run, frames, roots)).match(
    (found) => found,
    (message): readonly NodeRecord[] => {
      journal.error(bundle.file.fileKey, `the report could not read the file: ${message}`);
      return [];
    },
  );
  step(READ.purity);
  const purity = await attempt(() => readPurity(run, frames, roots)).match(
    (found) => found,
    (message): PurityRead => {
      journal.error(bundle.file.fileKey, `the purity of the prints could not be read: ${message}`);
      return NOTHING_READ;
    },
  );
  return { ...purity, nodes };
}

export async function printPlan(bundle: PlanBundle, progress: Progress, yieldToEditor: YieldToEditor): Promise<Printed> {
  const startedAt = new Date().toISOString();
  const journal = createJournal();
  let total = stepsIn(bundle);
  let done = 0;
  const step = (label: string): void => {
    done += 1;
    progress(done, total, label);
  };
  const units = createUnits(journal, {
    step,
    expect: (count) => {
      total += count;
    },
  });
  figma.skipInvisibleInstanceChildren = false;

  const began = Date.now();
  const flown = await preflight(bundle, journal);
  journal.unit({ kind: 'preflight', key: bundle.file.fileKey, status: flown.isOk() ? 'built' : 'failed', ms: Date.now() - began });
  if (flown.isErr()) {
    journal.error(bundle.file.fileKey, flown.error);
    return { report: reportOf({ bundle, journal }, startedAt, NOTHING_READ), frames: new Map(), pages: null };
  }
  const { pages, fonts } = flown.value;
  step('preflight');

  const run: Run = {
    bundle,
    journal,
    slicer: createSlicer(bundle.file.sliceMs, yieldToEditor),
    pages,
    fonts,
    library: createLibrary(),
    colors: heldColorsOf(bundle.collections),
    textStyleSpecs: new Map(bundle.textStyles.map((style) => [style.key, style] as const)),
    mains: createMains(pageOf(pages, 'design-system')),
  };

  // Both pages in order before any unit builds: a print that stopped left its units where they were built.
  const laid = attemptSync(() => {
    layOutDesignSystem(run);
    layOutSite(run);
  });
  if (laid.isErr()) journal.error(bundle.file.fileKey, `the pages could not be laid out: ${laid.error}`);
  figma.commitUndo();

  const { roots, frames } = await attempt(() => printStages(run, units)).match(
    (printing) => printing,
    (message): Printing => {
      journal.error(bundle.file.fileKey, message);
      return { roots: rootsFound(run), frames: framesFound(run) };
    },
  );

  // The print ends on the site page, whatever a stage did.
  const opened = await attempt(() => figma.setCurrentPageAsync(pageOf(pages, 'site')));
  if (opened.isErr()) journal.error(bundle.file.fileKey, `the site page does not open: ${opened.error}`);
  return { report: reportOf(run, startedAt, await readPrinted(run, frames, roots, step)), frames, pages };
}
