/**
 * The structure every print shares (docs/redesign/FIGMA_PRINT.md §3.1):
 * identity, boxes, text and children, read in the primary print, with the
 * elements only a twin print renders spliced in where that print has them.
 * The merge counts the boxes a twin's read moved; the plan refuses a tree
 * with any (plan/raw.mts). With one print there is nothing to merge.
 */

/** How many moved boxes a tree keeps as examples. */
const MOVE_SAMPLES = 12;

/** The structure of one walked node: its print's style, svg and field paints left to the print. */
export function structureOf(node) {
  const { style, svg, none, field, kids, ...rest } = node;
  const out = { ...rest };
  if (none) out.none = true;
  if (field) out.field = { value: field.value, placeholder: field.placeholder };
  if (kids) out.kids = kids.map((kid) => (kid.text === undefined ? structureOf(kid) : kid));
  return out;
}

/**
 * `kids` with `copy` where the wire parent has it: `before` is the kids
 * ahead of it in the wire parent, elements and texts, nearest last. It goes
 * after the nearest element of `before` that `kids` holds, or at the start
 * where none is, and then past as many texts as the wire parent puts between
 * that element and it, so a text run ahead of it in both DOMs stays ahead. A
 * child's DOM index differs between the two DOMs, so the neighbours both
 * hold place it, never a sort by index.
 */
export function spliceAfter(kids, copy, before) {
  const ids = kids.map((kid) => kid.id);
  const anchor = before.findLastIndex((kid) => kid.text === undefined && ids.includes(kid.id));
  const texts = before.slice(anchor + 1).filter((kid) => kid.text !== undefined).length;
  let at = anchor < 0 ? 0 : ids.indexOf(before[anchor].id) + 1;
  for (let passed = 0; passed < texts && kids[at]?.text !== undefined; passed += 1) at += 1;
  return [...kids.slice(0, at), copy, ...kids.slice(at)];
}

/**
 * Merges twin print `print`'s walk `twin` into the primary structure
 * `primary`, in place: an element the primary print hides takes its twin box
 * and children, and one only the twin DOM holds is spliced in by its
 * preceding twin siblings, texts included (spliceAfter). Returns how many
 * boxes the twin's read moved, the largest move, and the first few.
 */
export function mergeStructure(primary, twin, print) {
  const byId = new Map();
  const index = (node) => {
    byId.set(node.id, node);
    for (const kid of node.kids ?? []) if (kid.text === undefined) index(kid);
  };
  index(primary);
  let moved = 0;
  let maxDelta = 0;
  const samples = [];
  const visitTwin = (node, twinParent) => {
    const known = byId.get(node.id);
    if (known) {
      const delta = Math.max(...known.box.map((value, at) => Math.abs(value - node.box[at])));
      if (!known.none && !node.none && delta > 0.5) {
        moved += 1;
        if (samples.length < MOVE_SAMPLES) samples.push({ id: node.id, tag: node.tag, cls: node.cls.slice(0, 2), print, primary: known.box, twin: node.box });
      }
      if (!known.none && !node.none) maxDelta = Math.max(maxDelta, delta);
      if (known.none && !node.none) {
        known.box = node.box;
        delete known.none;
        if (node.kids && !known.kids) {
          known.kids = structureOf(node).kids;
          for (const kid of known.kids) if (kid.text === undefined) index(kid);
        }
      }
    } else {
      const parent = byId.get(node.parent);
      if (parent && twinParent) {
        const copy = structureOf(node);
        parent.kids = spliceAfter(parent.kids ?? [], copy, twinParent.kids.slice(0, twinParent.kids.indexOf(node)));
        index(copy);
      }
    }
    for (const kid of node.kids ?? []) if (kid.text === undefined) visitTwin(kid, node);
  };
  visitTwin(twin, null);
  return { moved, maxDelta, samples };
}
