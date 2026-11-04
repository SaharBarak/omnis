/**
 * Purity (docs/redesign/FIGMA_PRINT.md §6, F8), read off the printed file once the
 * units printed: every planned route frame and every main the file holds is
 * read by bindings.mts against its print's collection and its page's
 * elements only another print renders. A unit counts as read only when the
 * whole of it was: a route frame found and read, a component once every
 * main of it was. What the read could not reach stays unread, and the check
 * holds its purity unproven.
 */
import { collectionOf, isPrintName, placementsOf, PRINT_AXIS, printOfVariant, type Placement } from '../../plan/prints.mts';
import type { PrintName } from '../../plan/schema.mts';
import { createReader, type UnitRead, type UnitToRead } from './bindings.mts';
import type { Root } from './components.mts';
import type { Run } from './context.mts';
import { attempt } from './failure.mts';
import type { Impurity, Stray } from './journal.mts';
import { keyOf, layersUnder } from './keys.mts';

/** What the purity read found, and the units it read in full. */
export interface PurityRead {
  readonly read: readonly string[];
  readonly impure: readonly Impurity[];
  readonly strays: readonly Stray[];
}

/** The fields the read takes of a text's segments. */
const SEGMENT_FIELDS = ['fills', 'fillStyleId', 'textStyleId', 'boundVariables'] as const satisfies readonly (keyof StyledTextSegment)[];

/** The reader over the file: nodes as Figma holds them, variables and styles by their ids. */
const fileReader = (run: Run): ((unit: UnitToRead<SceneNode>) => Promise<UnitRead>) =>
  createReader<SceneNode>({
    keyOf,
    segmentsOf: (node) => (node.type === 'TEXT' ? node.getStyledTextSegments([...SEGMENT_FIELDS]) : []),
    collectionOf: async (id) => {
      const variable = await figma.variables.getVariableByIdAsync(id);
      const collection = variable ? await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId) : null;
      if (!collection) return null;
      const key = keyOf(collection);
      return key === '' ? `(${collection.name})` : key;
    },
    styleOf: (id) => figma.getStyleByIdAsync(id),
    tick: () => run.slicer.tick(),
  });

/** One root of a unit to read, with what it is read against. */
interface Part {
  readonly root: SceneNode & ChildrenMixin;
  readonly print: PrintName;
  readonly placement: Placement;
}

/** A planned unit's roots in the file, or why it cannot be read whole: a route's frame, or every main of a component. */
type Parts = { readonly ok: true; readonly parts: readonly Part[] } | { readonly ok: false; readonly why: string };

function routeParts(run: Run, frames: ReadonlyMap<string, FrameNode>, placements: ReadonlyMap<string, Placement>): ReadonlyMap<string, Parts> {
  return new Map(
    run.bundle.routes.map((route): [string, Parts] => {
      const frame = frames.get(route.key);
      const placement = placements.get(route.key);
      if (!frame || frame.removed) return [route.key, { ok: false, why: 'its frame is not in the file' }];
      return [route.key, placement ? { ok: true, parts: [{ root: frame, print: route.print, placement }] } : { ok: false, why: 'the plan places it on no page' }];
    }),
  );
}

function componentParts(run: Run, roots: ReadonlyMap<string, Root>, placements: ReadonlyMap<string, Placement>): ReadonlyMap<string, Parts> {
  return new Map(
    run.bundle.components.map((component): [string, Parts] => {
      if (!roots.get(component.key)) return [component.key, { ok: false, why: 'it is not in the file' }];
      const parts: Part[] = [];
      for (const variant of component.variants) {
        const main = run.mains.component(variant.key);
        const print = printOfVariant(variant.values);
        const placement = placements.get(variant.key);
        if (!main) return [component.key, { ok: false, why: `its main ${variant.key} is not in the file` }];
        if (!isPrintName(print)) return [component.key, { ok: false, why: `its variant ${variant.key} names no ${PRINT_AXIS ?? 'print'}` }];
        if (!placement) return [component.key, { ok: false, why: `its main ${variant.key} is drawn from ${variant.source}, which no planned route frame holds` }];
        parts.push({ root: main, print, placement });
      }
      return [component.key, { ok: true, parts }];
    }),
  );
}

/**
 * Every binding across the prints and every stray layer in every planned
 * unit the file holds, whether this print built the unit or found it
 * unchanged. A unit that cannot be read whole, or that the read throws on,
 * is reported and left unread, and the others are still read.
 */
export async function readPurity(run: Run, frames: ReadonlyMap<string, FrameNode>, roots: ReadonlyMap<string, Root>): Promise<PurityRead> {
  const placements = placementsOf(run.bundle.routes, run.bundle.components);
  const readUnit = fileReader(run);
  const read: string[] = [];
  const impure: Impurity[] = [];
  const strays: Stray[] = [];
  for (const [unit, found] of [...routeParts(run, frames, placements), ...componentParts(run, roots, placements)]) {
    if (!found.ok) {
      run.journal.error(unit, `its purity is not read: ${found.why}`);
      continue;
    }
    const whole = await attempt(async () => {
      const results: UnitRead[] = [];
      for (const { root, print, placement } of found.parts) results.push(await readUnit({ unit, collection: collectionOf(print), placement, nodes: [root, ...layersUnder(root)] }));
      return results;
    });
    if (whole.isErr()) {
      run.journal.error(unit, `its purity could not be read: ${whole.error}`);
      continue;
    }
    read.push(unit);
    for (const result of whole.value) {
      impure.push(...result.impure);
      strays.push(...result.strays);
    }
  }
  return { read, impure, strays };
}
