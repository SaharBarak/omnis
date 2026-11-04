/**
 * The plan read as trees: pure helpers over the schema's specs, with no
 * Figma in them, so every stage walks the plan the same way the check does
 * (check/plan-index.mts).
 */
import type { CollectionSpec, ComponentSpec, NodeSpec, VariableSpec, VariableValue as PlanValue, VariantSpec } from '../../plan/schema.mts';

/** A value that is no alias. */
export type HeldValue = Exclude<PlanValue, { readonly kind: 'alias' }>;

/** A node's children in the plan: a frame's layers, or the content an instance's slots hold. */
export function childrenOf(node: NodeSpec): readonly NodeSpec[] {
  if (node.type === 'FRAME') return node.children;
  if (node.type === 'INSTANCE') return Object.values(node.slots ?? {}).flat();
  return [];
}

/** A node and everything under it, parents first. */
export function subtreeOf(root: NodeSpec): readonly NodeSpec[] {
  const nodes: NodeSpec[] = [];
  const visit = (node: NodeSpec): void => {
    nodes.push(node);
    for (const child of childrenOf(node)) visit(child);
  };
  visit(root);
  return nodes;
}

/** A spec with the spec above it and its depth below the unit's root. */
export interface Placed {
  readonly spec: NodeSpec;
  readonly parent: NodeSpec | null;
  readonly depth: number;
}

/** Every node of a unit by key, with its parent and depth; the first of a repeated key wins, as in the check. */
export function placedIn(root: NodeSpec): ReadonlyMap<string, Placed> {
  const placed = new Map<string, Placed>();
  const visit = (spec: NodeSpec, parent: NodeSpec | null, depth: number): void => {
    if (!placed.has(spec.key)) placed.set(spec.key, { spec, parent, depth });
    for (const child of childrenOf(spec)) visit(child, spec, depth + 1);
  };
  visit(root, null, 0);
  return placed;
}

/** Each variant's component, by variant key. */
export const ownersOf = (components: readonly ComponentSpec[]): ReadonlyMap<string, ComponentSpec> =>
  new Map(components.flatMap((component) => component.variants.map((variant) => [variant.key, component] as const)));

/** Each variant by its key. */
export const variantsOf = (components: readonly ComponentSpec[]): ReadonlyMap<string, VariantSpec> =>
  new Map(components.flatMap((component) => component.variants.map((variant) => [variant.key, variant] as const)));

/** The components a set of trees instantiates, by component key, sorted: every instance's, and every swap's. */
export function dependenciesOf(roots: readonly NodeSpec[], owners: ReadonlyMap<string, ComponentSpec>, self?: string): readonly string[] {
  const keys = new Set<string>();
  for (const root of roots) {
    for (const node of subtreeOf(root)) {
      if (node.type !== 'INSTANCE') continue;
      const variants = [node.component, ...node.overrides.flatMap((override) => (override.swap === undefined ? [] : [override.swap]))];
      for (const variant of variants) {
        const owner = owners.get(variant);
        if (owner && owner.key !== self) keys.add(owner.key);
      }
    }
  }
  return [...keys].sort();
}

/** Each variable spec by key, with the collection that holds it. */
export const variableSpecsOf = (collections: readonly CollectionSpec[]): ReadonlyMap<string, { readonly spec: VariableSpec; readonly collection: CollectionSpec }> =>
  new Map(collections.flatMap((collection) => collection.variables.map((spec) => [spec.key, { spec, collection }] as const)));

/**
 * Each variable's value through its aliases, across collections: what its
 * one mode shows, a primary variable's in the primary print and a twin's in
 * its own print. A chain that breaks or loops resolves to nothing.
 */
export function heldValuesOf(collections: readonly CollectionSpec[]): ReadonlyMap<string, HeldValue> {
  const specs = variableSpecsOf(collections);
  const resolved = new Map<string, HeldValue>();
  const resolve = (key: string, seen: ReadonlySet<string>): HeldValue | null => {
    const known = resolved.get(key);
    if (known) return known;
    const value = seen.has(key) ? undefined : specs.get(key)?.spec.value;
    if (!value) return null;
    const held = value.kind === 'alias' ? resolve(value.key, new Set([...seen, key])) : value;
    if (held) resolved.set(key, held);
    return held;
  };
  for (const key of specs.keys()) resolve(key, new Set());
  return resolved;
}

/** Distinct values in first-seen order. */
export const distinct = <Value,>(values: Iterable<Value>): readonly Value[] => [...new Set(values)];
