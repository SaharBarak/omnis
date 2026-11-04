/**
 * Where printed units sit on their page: keyed sections in rows, below
 * whatever else the page holds (a person's nodes, a stale section that keeps
 * one of theirs), each sized to what it holds, which may be sections of its
 * own (a print's block of the site page holds a section per route group).
 * Placement is a pure function of the plan, the sizes printed and what else
 * the page holds, so a print of unchanged plans moves nothing.
 */
import type { Box } from '../../plan/schema.mts';
import { carrying, ENTRY, isKeyed, keyOf, KIND, mark, read } from './keys.mts';
import { MIN_LENGTH } from './layout.mts';
import { samePx } from './numbers.mts';
import type { Role } from './pages.mts';
import { absoluteBox } from './selfcheck.mts';
import { SETTINGS } from './settings.mts';

/** A section's key: its role's, then the path to it (a component group; a print's block, then a route group in it). */
export const sectionKey = (role: Role, path: readonly string[]): string => ['section', role, ...path].join(':');

const isSection = (node: SceneNode): node is SectionNode => node.type === 'SECTION';

/** A keyed section among a parent's children, the page's or a block's, made there when the parent has none. */
export function sectionFor(parent: PageNode | SectionNode, role: Role, path: readonly string[], name: string): SectionNode {
  const key = sectionKey(role, path);
  const found = parent.children.filter(isSection).find((section) => keyOf(section) === key);
  if (found) {
    if (found.name !== name) found.name = name;
    return found;
  }
  const section = figma.createSection();
  parent.appendChild(section);
  section.name = name;
  mark(section, { key, kind: KIND.section, role });
  return section;
}

const isDraft = (node: SceneNode): boolean => read(node, ENTRY.kind) === KIND.draft;

/** The x past everything on a page but its drafts: where a print builds, out of the way. */
export function clearX(page: PageNode): number {
  const rights = page.children
    .filter((node) => !isDraft(node))
    .map((node) => {
      const [x, , width] = absoluteBox(node);
      return x + width;
    });
  return rights.length === 0 ? 0 : Math.max(...rights) + SETTINGS.gutter;
}

/** Moves a draft past its page's content, which a layout of the page may have grown into. */
export function park(draft: FrameNode, page: PageNode): void {
  draft.x = clearX(page);
  draft.y = 0;
}

/** Removes the drafts on a page, and all they hold: one is left only by a print that stopped while it built. */
export function removeDrafts(page: PageNode): void {
  for (const node of carrying(page, ENTRY.kind)) if (!node.removed && read(node, ENTRY.kind) === KIND.draft) node.remove();
}

/**
 * Where a print builds on a page: a keyed frame without layout, out past the
 * page's content, that holds every node from its making until its parent
 * takes it. Figma makes a node on the page a person is looking at, which a
 * person can change while a print yields, so no node waits there; and a
 * print that stops leaves its half built nodes only here, for the next print
 * to remove with the draft.
 */
export function draftOn(page: PageNode, role: Role): FrameNode {
  removeDrafts(page);
  const draft = figma.createFrame();
  page.appendChild(draft);
  mark(draft, { key: `draft:${role}`, kind: KIND.draft });
  draft.name = KIND.draft;
  draft.fills = [];
  draft.clipsContent = false;
  park(draft, page);
  return draft;
}

/** What a shelf holds: a printed node, or a section with its own shelf. */
export type Shelved = SceneNode | Shelf;

/** A section and what it holds, in rows top to bottom, each row left to right. */
export interface Shelf {
  readonly section: SectionNode;
  readonly rows: readonly (readonly Shelved[])[];
}

/** Every node has a type; a shelf has none. */
const isShelf = (item: Shelved): item is Shelf => !('type' in item);

/** Moves a node so its top left lands on a page point, whatever coordinates its parent gives it. */
export function moveTo(node: SceneNode, x: number, y: number): void {
  const [[, , left], [, , top]] = node.absoluteTransform;
  if (!samePx(left, x)) node.x += x - left;
  if (!samePx(top, y)) node.y += y - top;
}

/** The box around nodes, or null when there are none. */
function boundsOf(nodes: readonly SceneNode[]): Box | null {
  const boxes = nodes.map(absoluteBox);
  if (boxes.length === 0) return null;
  const left = Math.min(...boxes.map((box) => box[0]));
  const top = Math.min(...boxes.map((box) => box[1]));
  const right = Math.max(...boxes.map((box) => box[0] + box[2]));
  const bottom = Math.max(...boxes.map((box) => box[1] + box[3]));
  return [left, top, right - left, bottom - top];
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** Nodes in rows about as wide as the set is tall, in their order: the shelf a component group fills. */
export function shelve(nodes: readonly SceneNode[], gutter: number): SceneNode[][] {
  const area = sum(nodes.map((node) => (node.width + gutter) * (node.height + gutter)));
  const target = Math.max(Math.sqrt(area), ...nodes.map((node) => node.width));
  const rows: SceneNode[][] = [];
  let width = 0;
  for (const node of nodes) {
    const last = rows[rows.length - 1];
    if (!last || width + node.width > target) {
      rows.push([node]);
      width = node.width + gutter;
    } else {
      last.push(node);
      width += node.width + gutter;
    }
  }
  return rows;
}

type Size = readonly [number, number];

/** Items in a row, a gutter between them: as wide as all of them, as tall as the tallest. */
const rowSize = (sizes: readonly Size[]): Size => [sum(sizes.map(([width]) => width)) + SETTINGS.gutter * Math.max(0, sizes.length - 1), Math.max(0, ...sizes.map(([, height]) => height))];

/** Rows stacked, a gutter between them: as wide as the widest, as tall as all of them. */
const stackSize = (rows: readonly Size[]): Size => [Math.max(0, ...rows.map(([width]) => width)), sum(rows.map(([, height]) => height)) + SETTINGS.gutter * Math.max(0, rows.length - 1)];

/** A node's size, or a section's: its rows with a gutter around them. */
function sizeOf(item: Shelved): Size {
  if (!isShelf(item)) return [item.width, item.height];
  const [width, height] = stackSize(item.rows.map((row) => rowSize(row.map(sizeOf))));
  return [width + 2 * SETTINGS.gutter, height + 2 * SETTINGS.gutter];
}

/** Puts every shelved node in its section and every section in its parent, before any is placed. */
function gather(rows: readonly (readonly Shelved[])[], parent: PageNode | SectionNode): void {
  for (const item of rows.flat()) {
    const node = isShelf(item) ? item.section : item;
    if (node.parent !== parent) parent.appendChild(node);
    if (isShelf(item)) gather(item.rows, item.section);
  }
}

/** Places rows of gathered items from a top left point on the page, a gutter between them. */
function placeRows(rows: readonly (readonly Shelved[])[], left: number, top: number): void {
  let y = top;
  for (const row of rows) {
    let x = left;
    for (const item of row) {
      if (isShelf(item)) place(item, x, y);
      else moveTo(item, x, y);
      x += sizeOf(item)[0] + SETTINGS.gutter;
    }
    y += rowSize(row.map(sizeOf))[1] + SETTINGS.gutter;
  }
}

/** A shelf's section at a page point, sized to its rows, and its rows inside it. */
function place(shelf: Shelf, left: number, top: number): void {
  const { section } = shelf;
  const [width, height] = sizeOf(shelf);
  moveTo(section, left, top);
  if (!samePx(section.width, width) || !samePx(section.height, height)) section.resizeWithoutConstraints(Math.max(width, MIN_LENGTH), Math.max(height, MIN_LENGTH));
  placeRows(shelf.rows, left + SETTINGS.gutter, top + SETTINGS.gutter);
}

/** A shelf's section and every section inside it. */
const sectionsOf = (shelf: Shelf): readonly SectionNode[] => [shelf.section, ...shelf.rows.flat().filter(isShelf).flatMap(sectionsOf)];

/** The sections under a parent, each before the ones it holds: Figma nests a section only in a page or a section, so no frame is walked. */
const sectionTree = (parent: PageNode | SectionNode): readonly SectionNode[] => parent.children.filter(isSection).flatMap((section) => [section, ...sectionTree(section)]);

/** Keyed sections no shelf names, at any depth: removed, the innermost first, once nothing is left in them; kept while a person's nodes are. */
function pruneSections(page: PageNode, kept: ReadonlySet<SectionNode>): void {
  for (const section of [...sectionTree(page)].reverse()) {
    if (section.removed || !isKeyed(section) || kept.has(section) || section.children.length > 0) continue;
    section.remove();
  }
}

/**
 * Lays the shelves out on their page, each section sized to what it holds.
 * Every shelved node is gathered into its section first, and the keyed
 * sections no shelf names are pruned once that empties them; the rows then
 * go below whatever the page still holds besides the shelves and its draft,
 * so a stale section a person's node keeps never lies under a new one. It
 * runs between units, so a print that stops leaves the page in order.
 */
export function arrange(page: PageNode, rows: readonly (readonly Shelf[])[]): void {
  const shelves = rows.flat();
  gather(rows, page);
  pruneSections(page, new Set(shelves.flatMap(sectionsOf)));
  const placed = new Set<SceneNode>(shelves.map((shelf) => shelf.section));
  const others = boundsOf(page.children.filter((node) => !placed.has(node) && !isDraft(node)));
  placeRows(rows, others ? others[0] : 0, others ? others[1] + others[3] + SETTINGS.gutter : 0);
}
