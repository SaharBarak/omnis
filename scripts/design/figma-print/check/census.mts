/**
 * The census as the plan holds it (docs/redesign/FIGMA_PRINT.md §9, F5): how many
 * occurrences of each variant the route frames show. The planner makes
 * occurrences instances innermost first (plan/components.mts), so an
 * occurrence inside another is one of the outer instance's nested instances,
 * and it shows the variant the outer instance's swaps give it.
 */
import type { InstanceSpec, NodeSpec, OverrideSpec, VariantSpec } from '../plan/schema.mts';
import { childrenOf } from './plan-index.mts';

/**
 * What overrides say of one part of a main: undefined when none lands on it,
 * and otherwise the variant a swap shows there, or null for the main's own.
 */
type Landing = string | null | undefined;
type Landings = (part: string) => Landing;

/** Joins the main keys of a part inside a nested instance (OverrideSpec.part). */
const NESTED = ' > ';

const NONE: Landings = () => undefined;

/** The overrides by the part they land on; a part several land on swaps if any of them does. */
function landingsOf(overrides: readonly OverrideSpec[]): Landings {
  const swaps = new Map<string, string | null>();
  for (const { part, swap } of overrides) swaps.set(part, swap ?? swaps.get(part) ?? null);
  return (part) => swaps.get(part);
}

/**
 * Counts every instance the main of `variant` holds, by the variant each one
 * shows. An override that lands on a nested part replaces the main's own
 * there, since the planner writes one wherever an occurrence differs from the
 * main and never resets a swap; below a swap only the outer overrides apply,
 * keyed in the swapped-in variant's main.
 */
function holdings(variants: ReadonlyMap<string, VariantSpec>, variant: string, outer: Landings, count: (variant: string) => void, within: ReadonlySet<string>): void {
  const main = variants.get(variant);
  // A main that holds itself holds nothing more, rather than looping.
  if (!main || within.has(variant)) return;
  const inside = new Set([...within, variant]);
  const visit = (node: NodeSpec): void => {
    if (node.type === 'INSTANCE') {
      const shows = outer(node.key) ?? node.component;
      count(shows);
      const own = shows === node.component ? landingsOf(node.overrides) : NONE;
      const below: Landings = (part) => {
        const mine = outer(`${node.key}${NESTED}${part}`);
        return mine === undefined ? own(part) : mine;
      };
      holdings(variants, shows, below, count, inside);
    }
    childrenOf(node).forEach(visit);
  };
  visit(main.root);
}

/** The occurrences of each variant the route frames show: every instance on a route, and every instance each one holds. */
export function heldOnRoutes(variants: ReadonlyMap<string, VariantSpec>, onRoutes: Iterable<InstanceSpec>): ReadonlyMap<string, number> {
  const total = new Map<string, number>();
  const count = (variant: string): void => {
    total.set(variant, (total.get(variant) ?? 0) + 1);
  };
  for (const instance of onRoutes) {
    count(instance.component);
    holdings(variants, instance.component, landingsOf(instance.overrides), count, new Set());
  }
  return total;
}
