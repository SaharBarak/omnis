/**
 * Components on the design system page (docs/redesign/FIGMA_PRINT.md §7): one unit
 * each, in the plan's dependency order. A component is rebuilt in place,
 * its main components kept so every instance keeps its link, when its hash,
 * the printer or a component it instantiates printed anew; otherwise it is
 * left alone. Every component is a component set, as the print is an axis of
 * every component. A copy a person makes of a root or a main is theirs.
 */
import type { ComponentSpec, VariantSpec } from '../../plan/schema.mts';
import { buildMain } from './build.mts';
import { arrange, draftOn, park, removeDrafts, sectionFor, shelve } from './canvas.mts';
import { pinConstraints } from './constraints.mts';
import { guard, type Run } from './context.mts';
import { digestOf } from './digest.mts';
import { attemptSync } from './failure.mts';
import type { UnitStatus } from './journal.mts';
import { carrying, claim, ENTRY, isCopy, KIND, keyOf, layersUnder, mark, printedOnes, read, release, stampId, write } from './keys.mts';
import { pageOf, type Role } from './pages.mts';
import { selfCheck } from './selfcheck.mts';
import { SETTINGS } from './settings.mts';
import { dependenciesOf, ownersOf } from './specs.mts';
import type { Units } from './units.mts';

const ROLE: Role = 'design-system';

/** A component group's section on the design system page. */
const groupSection = (run: Run, group: string): SectionNode => sectionFor(pageOf(run.pages, ROLE), ROLE, [group], group);

/** What prints a component: a component set, or in a file printed under protocol 1 a lone component, which a print replaces. */
export type Root = ComponentNode | ComponentSetNode;

/** What a unit root's hash entry holds: its plan hash under the printer, so a new printer (settings.mts) prints every unit again. */
export const printedHash = (planHash: string): string => digestOf(`${planHash}\n${SETTINGS.printer}`);

/** A printed unit's stamp: its hash and the stamps it printed against, so whatever instantiates it rebuilds when it does. */
export const stampOf = (root: BaseNode): string => digestOf(`${read(root, ENTRY.hash)}\n${read(root, ENTRY.deps)}`);

/** The stamp of the components a unit instantiates, as they printed. */
export const depsOf = (components: readonly string[], roots: ReadonlyMap<string, Root>): string =>
  components
    .map((key) => {
      const root = roots.get(key);
      return `${key}=${root ? stampOf(root) : ''}`;
    })
    .join('\n');

const isRoot = (node: SceneNode): node is Root => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET';

const unitOf = (node: SceneNode): string => read(node, ENTRY.unit);

const rootNodes = (page: PageNode): Root[] => carrying(page, ENTRY.kind).filter((node): node is Root => isRoot(node) && !node.removed && read(node, ENTRY.kind) === KIND.component);

/** The roots a page holds by component key, only read: the one that prints each key, never a person's copy of it. */
export const rootsOn = (page: PageNode): ReadonlyMap<string, Root> => printedOnes(rootNodes(page), unitOf).printed;

/**
 * The roots by component key, claimed (keys.mts), and the mains with them: a
 * main the print does not hold (mains.mts) is a person's copy, in a set or
 * on its own. Each copy is released to the person who made it, never
 * removed, so the instances they made of it keep their link.
 */
function claimRoots(page: PageNode, run: Run): Map<string, Root> {
  const released = (copy: SceneNode): void => {
    run.journal.error(keyOf(copy), 'a copy of this component carried its entries; the copy is released to whoever made it, and no print touches it');
  };
  const roots = claim(rootNodes(page), unitOf, released);
  const mains = page.findAllWithCriteria({ types: ['COMPONENT'] }).filter((node) => keyOf(node) !== '' && unitOf(node) !== '');
  for (const main of mains) {
    if (run.mains.component(keyOf(main)) === main) stampId(main);
    else {
      released(main);
      release(main);
    }
  }
  return roots;
}

const variantName = (variant: VariantSpec): string =>
  Object.entries(variant.values)
    .map(([axis, value]) => `${axis}=${value}`)
    .join(', ');

/** A property name without the `#id` Figma suffixes to TEXT, BOOLEAN and INSTANCE_SWAP properties. */
const plainName = (name: string): string => (name.includes('#') ? name.slice(0, name.lastIndexOf('#')) : name);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === 'object' && value !== null;

type VariantText = VariantSpec['texts'][number];

/**
 * The TEXT property a variant's text binds to. A property has one default for
 * the whole set, and every main shows it, so a name the plan's variants share
 * holds the value most of them give it (the first seen on a tie); a variant
 * that gives it another value binds a property of its own, named for the
 * variant's values, and so shows its own text in its main and its instances.
 */
function propertyNamer(variants: readonly VariantSpec[]): (variant: VariantSpec, text: VariantText) => string {
  const counts = new Map<string, Map<string, number>>();
  for (const text of variants.flatMap((variant) => variant.texts)) {
    const values = counts.get(text.property) ?? new Map<string, number>();
    values.set(text.value, (values.get(text.value) ?? 0) + 1);
    counts.set(text.property, values);
  }
  const shared = new Map([...counts].map(([property, values]) => [property, [...values].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0]] as const));
  return (variant, text) => (shared.get(text.property) === text.value ? text.property : `${text.property} (${Object.values(variant.values).join(' / ')})`);
}

/** The TEXT properties of a component, bound to each variant's text layer, each property's default the value its variants show. */
function bindTexts(owner: Root, built: readonly { readonly variant: VariantSpec; readonly main: ComponentNode }[], run: Run, key: string): void {
  const names = new Map<string, string>();
  for (const [full, definition] of Object.entries(owner.componentPropertyDefinitions)) if (definition.type === 'TEXT') names.set(plainName(full), full);
  const nameOf = propertyNamer(built.map(({ variant }) => variant));
  const defaults = new Map<string, string>();
  const shown: { readonly node: TextNode; readonly text: VariantText }[] = [];
  for (const { variant, main } of built) {
    const texts = new Map(layersUnder(main).filter((node) => node.type === 'TEXT').map((node) => [keyOf(node), node] as const));
    for (const text of variant.texts) {
      const node = texts.get(text.part);
      if (node?.type !== 'TEXT') {
        run.journal.error(text.part, `the TEXT property ${text.property} names it, and it is not a text of ${variant.key}`);
        continue;
      }
      const property = nameOf(variant, text);
      const full = names.get(property) ?? attemptSync(() => owner.addComponentProperty(property, 'TEXT', text.value)).unwrapOr(null);
      if (full === null) {
        run.journal.error(key, `the TEXT property ${property} could not be added`);
        continue;
      }
      names.set(property, full);
      defaults.set(full, text.value);
      const bound = guard(run, text.part, `TEXT property ${property}`, () => {
        node.componentPropertyReferences = { ...(node.componentPropertyReferences ?? {}), characters: full };
      });
      if (bound) shown.push({ node, text });
    }
  }
  for (const [full, value] of defaults) {
    const definition = owner.componentPropertyDefinitions[full];
    if (definition && definition.defaultValue !== value) guard(run, key, `default of ${plainName(full)}`, () => owner.editComponentProperty(full, { defaultValue: value }));
  }
  // A bound text shows its property's default: a main that shows another text than its plan's is an error.
  for (const { node, text } of shown) if (node.characters !== text.value) run.journal.error(text.part, `its main shows another text than its plan's, through the TEXT property ${text.property}`);
}

/**
 * Deletes the properties no layer of the component refers to any more (a
 * rebuild leaves the old ones behind). The typings list no reference a slot
 * holds to its SLOT property, so SLOT properties are pruned only when the
 * slots show theirs, one each; otherwise they stay.
 */
function pruneProperties(owner: Root, mains: readonly ComponentNode[], run: Run, key: string): void {
  const definitions = owner.componentPropertyDefinitions;
  const referenced = new Set<string>();
  let slots = 0;
  for (const main of mains) {
    for (const node of [main, ...layersUnder(main)]) {
      if (node.type === 'SLOT') slots += 1;
      const references: unknown = node.componentPropertyReferences;
      if (isRecord(references)) for (const value of Object.values(references)) if (typeof value === 'string') referenced.add(value);
    }
  }
  const slotsShown = [...referenced].filter((name) => definitions[name]?.type === 'SLOT').length >= slots;
  for (const [full, definition] of Object.entries(definitions)) {
    if (definition.type === 'VARIANT' || referenced.has(full) || (definition.type === 'SLOT' && !slotsShown)) continue;
    guard(run, key, `stale property ${full}`, () => {
      owner.deleteComponentProperty(full);
    });
  }
}

/** Variants in a square grid inside their set, the set sized around them. */
function layoutVariants(set: ComponentSetNode, mains: readonly ComponentNode[], run: Run, key: string): void {
  const gap = SETTINGS.spacing;
  if (set.layoutMode !== 'NONE') guard(run, key, 'set layout', () => (set.layoutMode = 'NONE'));
  const columns = Math.max(1, Math.ceil(Math.sqrt(mains.length)));
  const width = Math.max(0, ...mains.map((main) => main.width));
  const height = Math.max(0, ...mains.map((main) => main.height));
  mains.forEach((main, at) => {
    main.x = gap + (at % columns) * (width + gap);
    main.y = gap + Math.floor(at / columns) * (height + gap);
  });
  const rows = Math.ceil(mains.length / columns);
  set.resizeWithoutConstraints(gap + columns * (width + gap), gap + rows * (height + gap));
}

/** The set a component's variants print in: the one it had, or a new one in its group's section. */
function setOf(spec: ComponentSpec, mains: readonly ComponentNode[], existing: Root | undefined, run: Run): ComponentSetNode {
  const set = existing?.type === 'COMPONENT_SET' ? existing : figma.combineAsVariants(mains, groupSection(run, spec.group));
  for (const main of mains) if (main.parent !== set) set.appendChild(main);
  // A keyed variant no main is now is one the plan dropped, unless the plan is partial; a person's copy was released before.
  if (run.bundle.complete) for (const child of [...set.children]) if (child.type === 'COMPONENT' && !mains.includes(child) && keyOf(child) !== '' && !isCopy(child)) child.remove();
  set.name = spec.name;
  layoutVariants(set, mains, run, spec.key);
  return set;
}

interface Stage {
  readonly run: Run;
  readonly draft: FrameNode;
  readonly roots: Map<string, Root>;
  readonly owners: ReturnType<typeof ownersOf>;
}

/** A new main, in its group's section from its making, never on the page a person is looking at. */
function newMain(spec: ComponentSpec, run: Run): ComponentNode {
  const main = figma.createComponent();
  groupSection(run, spec.group).appendChild(main);
  return main;
}

async function printComponent(spec: ComponentSpec, stage: Stage): Promise<UnitStatus> {
  const { run, draft, roots, owners } = stage;
  const deps = depsOf(
    dependenciesOf(
      spec.variants.map((variant) => variant.root),
      owners,
      spec.key,
    ),
    roots,
  );
  const hash = printedHash(spec.hash);
  const existing = roots.get(spec.key);
  const whole = spec.variants.every((variant) => run.mains.component(variant.key) !== null);
  if (existing && whole && read(existing, ENTRY.hash) === hash && read(existing, ENTRY.deps) === deps) return 'unchanged';
  if (existing) write(existing, ENTRY.hash, '');
  const before = run.journal.errors.length;
  const built: { readonly variant: VariantSpec; readonly main: ComponentNode }[] = [];
  for (const variant of spec.variants) {
    const main = run.mains.component(variant.key) ?? newMain(spec, run);
    run.mains.forget(variant.key);
    for (const child of [...main.children]) child.remove();
    await buildMain(main, variant.root, { run, unit: spec.key, host: main, draft });
    mark(main, { key: variant.key, unit: spec.key, kind: KIND.variant });
    stampId(main);
    main.name = variantName(variant);
    run.mains.register(variant.key, main);
    built.push({ variant, main });
    await run.slicer.tick();
  }
  const mains = built.map((one) => one.main);
  const root = setOf(spec, mains, existing, run);
  mark(root, { key: spec.key, unit: spec.key, kind: KIND.component });
  stampId(root);
  bindTexts(root, built, run, spec.key);
  pruneProperties(root, mains, run, spec.key);
  if (root.description !== spec.description) root.description = spec.description;
  write(root, ENTRY.source, JSON.stringify(spec.source));
  for (const { variant, main } of built) {
    await selfCheck(main, variant.root, spec.key, run);
    pinConstraints(main, variant.root, spec.key, run);
  }
  roots.set(spec.key, root);
  // The old root goes unless it is one of the mains printed now (a lone component of protocol 1 that became a variant).
  const reused = existing?.type === 'COMPONENT' && mains.includes(existing);
  if (existing && existing !== root && !reused && !existing.removed) existing.remove();
  write(root, ENTRY.deps, deps);
  write(root, ENTRY.hash, run.journal.errors.length === before ? hash : '');
  return 'built';
}

/** Whether a node sits inside one of a set of nodes. */
function isInside(node: BaseNode, among: ReadonlySet<BaseNode>): boolean {
  for (let up = node.parent; up; up = up.parent) if (among.has(up)) return true;
  return false;
}

/**
 * Keyed roots and mains no planned component prints, when the plan is
 * complete: each removed as a unit of its own, counted before any runs. One
 * inside another goes with it.
 */
async function pruneComponents(page: PageNode, stage: Stage, units: Units): Promise<void> {
  if (!stage.run.bundle.complete) return;
  const planned = new Set(stage.run.bundle.components.map((spec) => spec.key));
  const variants = new Set(stage.run.bundle.components.flatMap((spec) => spec.variants.map((variant) => variant.key)));
  // Only roots and mains are units; an instance that shows its main's entries is neither.
  const strays = carrying(page, ENTRY.kind).filter((node): node is Root => {
    if (node.removed || !isRoot(node)) return false;
    const kind = read(node, ENTRY.kind);
    const unit = read(node, ENTRY.unit);
    return (kind === KIND.component && (!planned.has(unit) || stage.roots.get(unit) !== node)) || (kind === KIND.variant && node.type === 'COMPONENT' && !variants.has(keyOf(node)));
  });
  const among = new Set<BaseNode>(strays);
  const outermost = strays.filter((node) => !isInside(node, among));
  units.expect(outermost.length);
  for (const node of outermost) {
    await units.run('component', read(node, ENTRY.unit), () => {
      // A copy is a person's: released, as claimRoots does, never removed.
      if (isCopy(node)) release(node);
      else node.remove();
      return 'built';
    });
  }
}

/** The design system page in order: a section per kit group, side by side, each its roots in rows about as wide as they are tall. */
function layOut(run: Run, roots: ReadonlyMap<string, Root>): void {
  const groups = [...new Set(run.bundle.components.map((spec) => spec.group))];
  const shelves = groups.map((group) => {
    const nodes = run.bundle.components.flatMap((spec) => {
      const root = spec.group === group ? roots.get(spec.key) : undefined;
      return root && !root.removed ? [root] : [];
    });
    return { section: groupSection(run, group), rows: shelve(nodes, SETTINGS.gutter) };
  });
  arrange(pageOf(run.pages, ROLE), [shelves]);
}

/** The design system page laid out with the roots it already holds, before any unit builds: a print that stopped left its draft there. */
export function layOutDesignSystem(run: Run): void {
  const page = pageOf(run.pages, ROLE);
  removeDrafts(page);
  layOut(run, rootsOn(page));
}

/** Prints every component, prunes the ones the plan dropped, and lays the page out by group as each prints: the roots the routes instantiate. */
export async function printComponents(run: Run, units: Units): Promise<ReadonlyMap<string, Root>> {
  const page = pageOf(run.pages, ROLE);
  await figma.setCurrentPageAsync(page);
  const draft = draftOn(page, ROLE);
  const stage: Stage = { run, draft, roots: claimRoots(page, run), owners: ownersOf(run.bundle.components) };
  try {
    for (const spec of run.bundle.components) {
      const status = await units.run('component', spec.key, () => printComponent(spec, stage));
      // A component that printed takes its place at once, and the draft moves past the page it grew.
      if (status === 'built') {
        layOut(run, stage.roots);
        park(draft, page);
      }
    }
  } finally {
    if (!draft.removed) draft.remove();
  }
  await pruneComponents(page, stage, units);
  layOut(run, stage.roots);
  figma.commitUndo();
  return stage.roots;
}
