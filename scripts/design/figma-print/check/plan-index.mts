/**
 * The plan as the check reads it (docs/redesign/FIGMA_PRINT.md §9): every node the
 * bundle names, flattened, with the unit that prints it and whether it shows.
 * Each print is a frame of its own (§6), so a node's visibility is a literal
 * of its plan.
 */
import type { FrameSpec, InstanceSpec, NodeSpec, PlanBundle, TextSpec, VariantSpec } from '../plan/schema.mts';

export interface PlanEntry<Node extends NodeSpec = NodeSpec> {
  readonly node: Node;
  /** The unit that prints it: its route's key, or its component's. */
  readonly unit: string;
  /** Whether it shows, its ancestors included. */
  readonly shown: boolean;
  /** It sits in a route frame (slot contents included), not in a main component. */
  readonly onRoute: boolean;
}

export interface PlanIndex {
  /** One entry per key, the first the plan names, in plan order. */
  readonly byKey: ReadonlyMap<string, PlanEntry>;
  /** Keys the plan names more than once. */
  readonly repeated: readonly string[];
  /** Route, component and variant keys that are no node's: a report may name them, and need not. */
  readonly structural: ReadonlySet<string>;
  /** Each variant, by its key. */
  readonly variants: ReadonlyMap<string, VariantSpec>;
}

/** A node's children in the plan: a frame's layers, or the content an instance's slots hold. */
export function childrenOf(node: NodeSpec): readonly NodeSpec[] {
  if (node.type === 'FRAME') return node.children;
  if (node.type === 'INSTANCE') return Object.values(node.slots ?? {}).flat();
  return [];
}

/** A node and everything under it, parents first. */
export const subtreeOf = (node: NodeSpec): readonly NodeSpec[] => [node, ...childrenOf(node).flatMap(subtreeOf)];

export const isTextEntry = (entry: PlanEntry): entry is PlanEntry<TextSpec> => entry.node.type === 'TEXT';
export const isFrameEntry = (entry: PlanEntry): entry is PlanEntry<FrameSpec> => entry.node.type === 'FRAME';
export const isInstanceEntry = (entry: PlanEntry): entry is PlanEntry<InstanceSpec> => entry.node.type === 'INSTANCE';

export function indexPlan(bundle: PlanBundle): PlanIndex {
  const byKey = new Map<string, PlanEntry>();
  const repeated = new Set<string>();
  const visit = (node: NodeSpec, unit: string, onRoute: boolean, above: boolean): void => {
    const shown = above && node.visible !== false;
    if (byKey.has(node.key)) repeated.add(node.key);
    else byKey.set(node.key, { node, unit, shown, onRoute });
    for (const child of childrenOf(node)) visit(child, unit, onRoute, shown);
  };
  for (const route of bundle.routes) visit(route.frame, route.key, true, true);
  for (const component of bundle.components) for (const variant of component.variants) visit(variant.root, component.key, false, true);
  const named = [...bundle.routes.map((route) => route.key), ...bundle.components.flatMap((component) => [component.key, ...component.variants.map((variant) => variant.key)])];
  return {
    byKey,
    repeated: [...repeated],
    structural: new Set(named.filter((key) => !byKey.has(key))),
    variants: new Map(bundle.components.flatMap((component) => component.variants.map((variant) => [variant.key, variant] as const))),
  };
}
