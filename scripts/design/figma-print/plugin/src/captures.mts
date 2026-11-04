/**
 * Old captures: the unkeyed top-level nodes on the pages the plugin writes.
 * They belong to a person, so the plugin lists them and removes them only
 * when the person presses "Remove old captures", and then only the ones it
 * listed that are still unkeyed and still on those pages.
 */
import type { Capture } from './messages.mts';
import { isKeyed } from './keys.mts';
import type { Pages } from './pages.mts';

export const capturesOn = (pages: Pages): readonly Capture[] =>
  [...pages.values()].flatMap((page) => page.children.filter((node) => !isKeyed(node)).map((node) => ({ id: node.id, name: node.name, type: node.type, page: page.name })));

/** Removes the listed captures that still qualify; the rest are kept. */
export async function removeCaptures(ids: readonly string[], pages: Pages): Promise<{ readonly removed: number; readonly kept: number }> {
  const owners = new Set([...pages.values()].map((page) => page.id));
  let removed = 0;
  for (const id of new Set(ids)) {
    const node = await figma.getNodeByIdAsync(id);
    const parent = node && 'parent' in node ? node.parent : null;
    if (!node || node.type === 'PAGE' || node.type === 'DOCUMENT' || !parent || !owners.has(parent.id) || isKeyed(node)) continue;
    node.remove();
    removed += 1;
  }
  return { removed, kept: new Set(ids).size - removed };
}
