/**
 * The planner (docs/redesign/FIGMA_PRINT.md §3.2): the measured raw trees in,
 * the print plan out, as `.figma-print/plans/bundle.json`. Each tree plans
 * once per print, each frame bound to its own print's collection only.
 *
 *   node scripts/design/figma-print/plan/index.mts [--routes=/lab/bento/wireframes] [--allow-stale] [--allow-drift]
 *
 * It refuses trees whose stamped inputs (`inputs.mjs`) differ from the working
 * tree's and trees not read whole (`faultsOf`), unless `--allow-stale` says
 * the caller knows. A tree read across a change of its source or a reload
 * (`whyUnsound`), a tree not read from a dev server (`whyNotDev`), and trees
 * from more than one build, Next version or browser (`mixesOf`), it refuses
 * whatever the caller allows. It refuses a plan whose class
 * grammars spell none of the measured classes, as Next has then renamed its
 * CSS-module classes. It writes the plan and exits non-zero when Figma's
 * layout, as modelled, puts a node off its measured box or cannot hold a
 * sizing (F9), unless `--allow-drift`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { APP, CONFIG } from '../config.mjs';
import { inputsOf, whyStale, whyUnsound } from '../inputs.mjs';
import { checkKit, KIT } from '../kit.mts';
import { ROUTE_GROUPS, stemOf } from '../../routes.mjs';
import { unboundOf } from './audit.mts';
import { census, digest, type PlannedRoute } from './components.mts';
import { type FrameFacts, type Notes, partOfClass, planPage, renderedBy } from './nodes.mts';
import { printOfVariant } from './prints.mts';
import { faultsOf, mixesOf, projectionOf, whyNotDev, type RawElement, type RawPage } from './raw.mts';
import { PROTOCOL, type FrameSpec, type NodeSpec, type PlanBundle, type PrintName, type RouteSpec, type ViewportName } from './schema.mts';
import { Variables } from './tokens.mts';
import { EffectStyles } from './effects.mts';
import { layOut } from './figma-layout.mts';
import { facesOf, TextStyles } from './type.mts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const allowStale = args.includes('--allow-stale');
const allowDrift = args.includes('--allow-drift');
const wanted = flag('routes')?.split(',').filter(Boolean) ?? null;

const fail = (message: string): never => {
  console.error(`plan: ${message}`);
  process.exit(1);
};

const problems = checkKit(APP);
if (problems.length > 0) fail(`the kit table does not match the kit:\n  ${problems.join('\n  ')}`);

const groupOf = new Map<string, string>(ROUTE_GROUPS.flatMap((entry) => entry.routes.map((route): [string, string] => [route, entry.group])));
const routes: readonly string[] = wanted ?? ROUTE_GROUPS.flatMap((entry) => entry.routes);
for (const route of routes) if (!groupOf.has(route)) fail(`${route} is not a route of scripts/design/routes.mjs`);

const viewports = CONFIG.viewports.map((viewport) => viewport.name as ViewportName);
const prints = CONFIG.prints as readonly PrintName[];
const pages: RawPage[] = [];
for (const route of routes) {
  for (const viewport of viewports) {
    const file = path.join(CONFIG.paths.raw, `${stemOf(route)}.${viewport}.json`);
    if (!fs.existsSync(file)) {
      if (wanted) fail(`${route} has no ${viewport} measure (${path.relative(APP, file)}); run measure.mjs first`);
      continue;
    }
    pages.push(JSON.parse(fs.readFileSync(file, 'utf8')) as RawPage);
  }
}
if (pages.length === 0) fail('no measured routes; run measure.mjs first');

/** Each reason some trees cannot stand, with the trees it holds against, and every tree refused. */
const refusals = (): { readonly refuse: (why: string, tree: string, detail?: string) => void; readonly fail: (from: number, advice: string) => void } => {
  const refusedBy = new Map<string, string[]>();
  const refusedTrees = new Set<string>();
  return {
    refuse: (why, tree, detail) => {
      refusedBy.set(why, [...(refusedBy.get(why) ?? []), detail ? `${tree} (${detail})` : tree]);
      refusedTrees.add(tree);
    },
    fail: (from, advice) => {
      if (refusedBy.size > 0) fail(`${refusedTrees.size} of ${from} trees cannot stand; ${advice}\n  ${[...refusedBy].map(([why, trees]) => `${why}: ${trees.join(', ')}`).join('\n  ')}`);
    },
  };
};

// A tree read across a change of its source, or a reload, is refused, stale allowed or not.
const unsound = refusals();
for (const page of pages) for (const why of [...whyUnsound(page.stamp), ...whyNotDev(page.stamp)]) unsound.refuse(why, `${page.route} ${page.viewport}`);
unsound.fail(pages.length, 'measure them again, with the source left alone while they are read; --allow-stale does not excuse it');
// The class grammars must spell the classes the installed Next wrote, or no element is a kit component.
const classesOf = (element: RawElement): string[] => [...element.cls, ...(element.kids ?? []).flatMap((kid) => ('text' in kid ? [] : classesOf(kid)))];
for (const page of pages) {
  const classes = classesOf(page.tree);
  if (classes.length > 0 && !classes.some((name) => partOfClass(name) !== null)) fail(`no class of ${page.route} ${page.viewport} matches CONFIG.classGrammars (for example ${classes.slice(0, 3).join(', ')}); Next has renamed its CSS-module classes`);
}
// One build, read by one browser, serves every tree of a bundle, stale allowed or not.
const mixed = mixesOf(pages.map((page) => page.stamp));
if (mixed.length > 0) fail(`${mixed.join('\n  ')}; --allow-stale does not excuse it`);

if (!allowStale) {
  // A tree stands while what it was read from does, whatever the commit: a commit to the planner or the plugin alone keeps every tree.
  // And only as a whole read: no box moved between the prints, both settled with their scrollers at rest, and every DevTools read answered.
  const inputs = new Map(await Promise.all([...new Set(pages.map((page) => page.route))].map(async (route) => [route, await inputsOf(route)] as const)));
  const stale = refusals();
  for (const page of pages) {
    const tree = `${page.route} ${page.viewport}`;
    for (const why of whyStale(page.stamp, inputs.get(page.route)!)) stale.refuse(why, tree);
    for (const fault of faultsOf(page)) stale.refuse(fault.why, tree, fault.detail);
  }
  stale.fail(pages.length, 'measure them again or pass --allow-stale');
}

// Plan every page in each print against one library, so a token or text style is one variable or style everywhere,
// and each frame binds its own print's twin of it.
const vars = new Variables(pages);
const type = new TextStyles();
const effects = new EffectStyles(pages);
const notes: Notes = { approximated: [], layouts: {}, misses: {} };
const elements = new Map<string, RawElement>();
const frames = new Map<string, FrameFacts>();
const planned: (PlannedRoute & { readonly route: string; readonly absent: readonly string[] })[] = pages.flatMap((page) => {
  // What each print renders, read from the measure apart from the planning, so F8 can hold each frame to it.
  const rendered = prints.map((print) => ({ print, keys: renderedBy(projectionOf(page, print)) }));
  return rendered.map(({ print, keys: own }) => {
    const absent = [...new Set(rendered.flatMap((other) => (other.print === print ? [] : [...other.keys])))].filter((one) => !own.has(one)).sort();
    const key = `${page.route}|${page.viewport}|${print}`;
    const context = { page: projectionOf(page, print), viewport: page.viewport, vars: vars.in(print), type, effects, faces: facesOf(page.fonts), notes, elements: new Map<string, RawElement>(), frames: new Map<string, FrameFacts>() };
    const frame = planPage(context, key);
    for (const [nodeKey, element] of context.elements) elements.set(nodeKey, element);
    for (const [nodeKey, facts] of context.frames) frames.set(nodeKey, facts);
    return { key, route: page.route, viewport: page.viewport, print, frame, absent };
  });
});

const kit = census(planned, elements, frames, KIT);
const collections = vars.build();
const styles = type.build();
const latest = pages.map((page) => page.stamp.measuredAt).sort().at(-1) ?? '';
const routeSpecs: RouteSpec[] = kit.routes.map((route, at) => ({
  key: route.key,
  route: planned[at]!.route,
  group: groupOf.get(planned[at]!.route) ?? 'Other',
  viewport: route.viewport,
  print: route.print,
  absent: planned[at]!.absent,
  hash: digest(route.frame),
  frame: route.frame,
}));
// The finished plan laid out as Figma lays it out: every node of every route frame and main, each its print's own,
// should land on its measured box.
const roots: { readonly print: string; readonly root: FrameSpec }[] = [
  ...routeSpecs.map((route) => ({ print: route.print, root: route.frame })),
  ...kit.components.flatMap((component) => component.variants.flatMap((variant) => (variant.root.type === 'FRAME' ? [{ print: printOfVariant(variant.values) ?? variant.key, root: variant.root }] : []))),
];
const mains = new Map(kit.components.flatMap((component) => component.variants.map((variant) => [variant.key, variant.root] as const)));
const drift: Record<string, number> = {};
const conflicts: Record<string, number> = {};
let drifted = 0;
for (const { print, root } of roots) {
  const laid = layOut(root, CONFIG.figma.tolerance, (variant) => mains.get(variant));
  drifted += laid.drift.length;
  for (const one of laid.drift) drift[`${print} · ${one.by} > ${one.name}`] = (drift[`${print} · ${one.by} > ${one.name}`] ?? 0) + 1;
  for (const one of laid.conflicts) conflicts[`${print} · ${one.what} · ${one.name}`] = (conflicts[`${print} · ${one.what} · ${one.name}`] ?? 0) + 1;
}

const body: Omit<PlanBundle, 'revision'> = {
  protocol: PROTOCOL,
  complete: wanted === null && pages.length === routes.length * viewports.length,
  stamp: { commit: pages[0]!.stamp.commit, buildId: pages[0]!.stamp.buildId, measuredAt: latest, base: pages[0]!.stamp.base },
  file: {
    fileKey: CONFIG.figma.fileKey,
    pages: CONFIG.figma.pages as PlanBundle['file']['pages'],
    pageLimit: CONFIG.figma.pageLimit,
    tolerance: CONFIG.figma.tolerance,
    boxed: CONFIG.figma.boxed,
    sliceMs: CONFIG.figma.sliceMs,
    receiver: `http://${CONFIG.receiver.host}:${CONFIG.receiver.port}`,
  },
  collections,
  textStyles: styles.styles,
  effectStyles: effects.build(),
  components: kit.components,
  routes: routeSpecs,
  fonts: styles.fonts,
  report: { instances: kit.instances, frames: kit.frames, derived: kit.derived, unbound: unboundOf(routeSpecs, kit.components), approximated: notes.approximated, layouts: notes.layouts, misses: notes.misses, drift, conflicts },
};
const bundle: PlanBundle = { ...body, revision: digest(body) };

fs.mkdirSync(CONFIG.paths.plans, { recursive: true });
const out = path.join(CONFIG.paths.plans, 'bundle.json');
fs.writeFileSync(out, JSON.stringify(bundle));

/** The largest counts of a tally, for the summary. */
const top = (tally: Readonly<Record<string, number>>): string =>
  Object.entries(tally)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([why, n]) => `${why} ${n}`)
    .join(', ');

/** A route's own nodes: its frames, texts and drawings, its instances, and what their slots hold. */
const count = (spec: NodeSpec): number => {
  if (spec.type === 'FRAME') return 1 + spec.children.reduce((sum, child) => sum + count(child), 0);
  if (spec.type === 'INSTANCE') return 1 + Object.values(spec.slots ?? {}).flat().reduce((sum, child) => sum + count(child), 0);
  return 1;
};
const variables = collections.reduce((sum, collection) => sum + collection.variables.length, 0);
const instanceCount = Object.values(kit.instances).reduce((sum, value) => sum + value, 0);
console.log(
  [
    `plan ${bundle.revision} -> ${path.relative(APP, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)${bundle.complete ? '' : ', partial: a print of it prunes nothing'}`,
    `  routes ${routeSpecs.length} (${prints.map((print) => `${print} ${routeSpecs.filter((route) => route.print === print).length}`).join(', ')}): ${routeSpecs.map((route) => `${route.route} ${route.viewport} ${route.print} ${count(route.frame)} nodes`).join(', ')}`,
    `  variables ${variables} (${collections.map((collection) => `${collection.name} ${collection.variables.length}`).join(', ')}), text styles ${styles.styles.length}, effect styles ${bundle.effectStyles.length}, fonts ${styles.fonts.map((font) => `${font.family} ${font.weight}`).join(', ')}`,
    `  components ${kit.components.length}, variants ${kit.components.reduce((sum, component) => sum + component.variants.length, 0)}, instances ${instanceCount}, kept as frames ${kit.frames.length}`,
    `  variant properties derived from shape: ${Object.entries(kit.derived).map(([component, property]) => `${component}.${property}`).join(', ') || 'none'}`,
    `  layouts ${Object.entries(notes.layouts).map(([mode, n]) => `${mode} ${n}`).join(', ')}; unbound colours ${bundle.report.unbound}; approximated ${notes.approximated.length}`,
    `  drift under Figma's layout: ${drifted} nodes${drifted > 0 ? `: ${top(drift)}` : ''}; sizing conflicts ${Object.values(conflicts).reduce((sum, n) => sum + n, 0)}${Object.keys(conflicts).length > 0 ? `: ${top(conflicts)}` : ''}`,
    `  free for want of a fit: ${
      Object.entries(notes.misses)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([why, n]) => `${why} ${n}`)
        .join(', ') || 'none'
    }`,
  ].join('\n')
);

// F9 (docs/redesign/FIGMA_PRINT.md §9): a plan Figma would lay out away from the measurement is not one to print.
const conflicted = Object.values(conflicts).reduce((sum, n) => sum + n, 0);
if ((drifted > 0 || conflicted > 0) && !allowDrift) {
  console.error(`plan: F9 fails, ${drifted} nodes drift and ${conflicted} sizings conflict under Figma's layout; fix the derivation, or pass --allow-drift to print it anyway`);
  process.exitCode = 1;
}
