/**
 * The two prints as a plan holds them apart (docs/redesign/FIGMA_PRINT.md §6, §7):
 * the collection each print's frames and mains bind, the variant property a
 * main carries its print in, and where a unit's layers lie on their page, so
 * a layer only the other print renders is told by its key. The planner writes
 * by them, the plugin prints and reads purity by them, the check judges by
 * them; this is their one copy. It reads nothing, so the plugin bundles it as
 * it is.
 */
import { PRINT_TABLE } from '../prints-table.mts';
import type { ComponentSpec, PrintName, RouteSpec } from './schema.mts';

/** The prints, primary first (prints-table.mts). */
export const PRINTS: readonly PrintName[] = PRINT_TABLE.map((row) => row.name);

/** The primary print: its walk is the measured structure, its collection holds the tokens. */
export const PRIMARY: PrintName = PRINTS[0]!;

/** The prints after the primary, each bound to its own twin collection. */
export const TWINS: readonly PrintName[] = PRINTS.slice(1);

/** The collection each print binds directly, by key (PlanBundle.collections). */
export const COLLECTION_OF: Readonly<Record<PrintName, string>> = Object.freeze(Object.fromEntries(PRINT_TABLE.map((row) => [row.name, row.collection.key])));

/** The variant property a main carries its print in, where there is more than one print to tell apart. */
export const PRINT_AXIS: string | null = TWINS.length > 0 ? 'print' : null;

/** The collection a print binds directly; a print the table does not hold is a fault in the caller. */
export const collectionOf = (print: PrintName): string => {
  const key = COLLECTION_OF[print];
  if (key === undefined) throw new Error(`the print table holds no print ${print}`);
  return key;
};

/** The name of each print's block on the site page. */
export const BLOCK_OF: Readonly<Record<PrintName, string>> = Object.freeze(Object.fromEntries(PRINT_TABLE.map((row) => [row.name, row.block])));

/** The name of a print's block on the site page. */
export const blockOf = (print: PrintName): string => {
  const block = BLOCK_OF[print];
  if (block === undefined) throw new Error(`the print table holds no print ${print}`);
  return block;
};

export const isPrintName = (name: unknown): name is PrintName => typeof name === 'string' && Object.prototype.hasOwnProperty.call(COLLECTION_OF, name);

/** The print a main is of: its print axis value, or the one print. */
export const printOfVariant = (values: Readonly<Record<string, string>>): string | undefined => (PRINT_AXIS === null ? PRIMARY : values[PRINT_AXIS]);

/** A node key below a unit's key, or null when the node is not the unit's: its root, a layer under it, or a pseudo-element of it. */
const belowOf = (key: string, prefix: string): string | null =>
  key === prefix || key.startsWith(`${prefix}/`) || key.startsWith(`${prefix}::`) ? key.slice(prefix.length) : null;

/** The page keys a key below its route key lies at or under: its own and each enclosing layer's, cut where a segment or a pseudo-element starts. */
function enclosing(below: string): readonly string[] {
  const keys: string[] = [];
  let key = '';
  for (const step of below.split(/(?=\/|::)/)) {
    if (step === '') continue;
    key += step;
    keys.push(key);
  }
  return keys;
}

/** Where a unit's layers lie on their page: the key their keys start with, the page key it stands for, and the elements only another print renders there. */
export interface Placement {
  readonly prefix: string;
  /** '' for a route frame; for a main, its source occurrence below the route key. */
  readonly at: string;
  readonly absent: ReadonlySet<string>;
}

/**
 * Whether a unit's node is a layer only another print renders: at or under
 * one of its page's absent elements. A node whose key the unit's prefix does
 * not start (a nested instance's layer, which its own main prints) is
 * another unit's, and never this one's stray.
 */
export function isStray(key: string, placement: Placement): boolean {
  const below = belowOf(key, placement.prefix);
  return below !== null && enclosing(placement.at + below).some((page) => placement.absent.has(page));
}

/**
 * Each unit's placement, by its key: a route frame's by its route key, a
 * main's by its variant key, on the page of the route frame its source
 * occurrence sits in. A main whose source no planned route holds has none.
 */
export function placementsOf(routes: readonly RouteSpec[], components: readonly ComponentSpec[]): ReadonlyMap<string, Placement> {
  const frames: readonly Placement[] = routes.map((route) => ({ prefix: route.key, at: '', absent: new Set(route.absent) }));
  const placements = new Map<string, Placement>(frames.map((frame) => [frame.prefix, frame] as const));
  for (const variant of components.flatMap((component) => component.variants)) {
    for (const frame of frames) {
      const at = belowOf(variant.source, frame.prefix);
      if (at === null) continue;
      placements.set(variant.key, { prefix: variant.key, at, absent: frame.absent });
      break;
    }
  }
  return placements;
}
