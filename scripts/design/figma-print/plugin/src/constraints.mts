/**
 * Constraints (docs/redesign/FIGMA_PRINT.md §3.3): an absolute layer keeps the edges
 * CSS anchored it by, written once its unit has settled. Figma applies a
 * constraint whenever the parent resizes, and a print resizes parents while
 * grid tracks settle, fills resolve and the self-check fixes lengths, so a
 * layer that stretched then would keep a size no layout gave it. The
 * constraints are for what a person resizes later, and for an instance of a
 * main its print resizes.
 */
import type { NodeSpec } from '../../plan/schema.mts';
import { guard, type Run } from './context.mts';
import { ENTRY, printedBy, read } from './keys.mts';
import { placedIn } from './specs.mts';

/** Writes the measured constraints of every absolute layer a unit printed under a root. */
export function pinConstraints(root: SceneNode & ChildrenMixin, rootSpec: NodeSpec, unit: string, run: Run): void {
  const plan = placedIn(rootSpec);
  for (const node of printedBy(root, unit)) {
    const absolute = plan.get(read(node, ENTRY.key))?.spec.absolute;
    if (!absolute || !('constraints' in node)) continue;
    const { horizontal, vertical } = node.constraints;
    if (horizontal === absolute.h && vertical === absolute.v) continue;
    guard(run, read(node, ENTRY.key), 'constraints', () => (node.constraints = { horizontal: absolute.h, vertical: absolute.v }));
  }
}
