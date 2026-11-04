/**
 * Keys in the file (docs/redesign/FIGMA_PRINT.md §3.3): every node, variable, style,
 * page and section the plugin writes carries its plan key in shared plugin
 * data, so a rebuild finds it again. A node without a key belongs to a
 * person and is never touched.
 */
import { attemptSync } from './failure.mts';
import { SETTINGS } from './settings.mts';

/** The shared plugin data entries the plugin writes. */
export const ENTRY = {
  /** The plan key: a node's, a variable's, a style's, a section's. */
  key: 'key',
  /** The unit that printed the node: its route's key, or its component's. */
  unit: 'unit',
  /** What a keyed root is (KIND). */
  kind: 'kind',
  /** The kit part a node prints. */
  part: 'part',
  /** A unit root's plan hash under the printer that printed it, written once the unit printed clean. */
  hash: 'hash',
  /** A unit root's stamp of the components it instantiates, as printed. */
  deps: 'deps',
  /** A page's role, or a section's. */
  role: 'role',
  /** A component's kit export and source file. */
  source: 'source',
  /** A unit root's or a main's own node id: a copy a person makes carries the entries, and so another node's id. */
  id: 'id',
} as const;

export type Entry = (typeof ENTRY)[keyof typeof ENTRY];

/** Entries an earlier protocol wrote and none writes now: cleared where they were written, so a file keeps none of them. */
export const LEGACY = {
  /** The print a file showed, on the document, while a switch showed one print at a time. */
  print: 'print',
} as const;

/** What a keyed root is. */
export const KIND = {
  route: 'route',
  /** A component set; a file printed under protocol 1 also holds a lone component as one, which a print finds and replaces. */
  component: 'component',
  /** A variant inside a component set. */
  variant: 'variant',
  section: 'section',
  /** Where a print builds on its page (canvas.mts): left only by a print that never finished. */
  draft: 'draft',
} as const;

export type Kind = (typeof KIND)[keyof typeof KIND];

type Holder = Pick<PluginDataMixin, 'getSharedPluginData' | 'setSharedPluginData'>;

export const read = (holder: Holder, entry: Entry): string => holder.getSharedPluginData(SETTINGS.namespace, entry);

export const write = (holder: Holder, entry: Entry, value: string): void => {
  if (holder.getSharedPluginData(SETTINGS.namespace, entry) !== value) holder.setSharedPluginData(SETTINGS.namespace, entry, value);
};

export const keyOf = (holder: Holder): string => read(holder, ENTRY.key);
export const isKeyed = (holder: Holder): boolean => keyOf(holder) !== '';

/** Clears every legacy entry a holder carries. */
export function clearLegacy(holder: Holder): void {
  for (const entry of Object.values(LEGACY)) if (holder.getSharedPluginData(SETTINGS.namespace, entry) !== '') holder.setSharedPluginData(SETTINGS.namespace, entry, '');
}

/** What a keyed node carries; an empty value clears its entry. */
export interface Mark {
  readonly key: string;
  readonly unit?: string;
  /** '' for a node that is no unit root, whatever the main it instantiates carries. */
  readonly kind?: Kind | '';
  readonly part?: string;
  readonly role?: string;
}

export function mark(holder: Holder, { key, unit, kind, part, role }: Mark): void {
  write(holder, ENTRY.key, key);
  if (unit !== undefined) write(holder, ENTRY.unit, unit);
  if (kind !== undefined) write(holder, ENTRY.kind, kind);
  if (part !== undefined) write(holder, ENTRY.part, part);
  if (role !== undefined) write(holder, ENTRY.role, role);
}

/**
 * Whether a layer can be read. Once a main changes, an instance can still
 * list a layer of the main it showed before, and Figma's index of plugin data
 * can still name it, but Figma refuses every read of it: such a layer is not
 * in the file, and no walk of the file meets it.
 */
export const exists = (node: SceneNode): boolean => attemptSync(() => !node.removed && typeof read(node, ENTRY.key) === 'string').unwrapOr(false);

/** The layers under a root that exist, at any depth, instance layers included. */
export const layersUnder = (root: ChildrenMixin): SceneNode[] => root.findAll(exists);

/** Whether a node exists and holds the entry it was found by. */
const holds = (node: SceneNode, entry: Entry): boolean => exists(node) && read(node, entry) !== '';

/**
 * Every node under a root that carries an entry, at any depth, instance
 * layers included. The plugin data index answers at once, but once a main
 * changes it can name a layer its instances no longer have, or refuse the
 * query: such a layer is dropped, and a refused query walks the tree, which
 * holds only layers that exist.
 */
export const carrying = (root: ChildrenMixin, entry: Entry): SceneNode[] =>
  attemptSync((): SceneNode[] => root.findAllWithCriteria({ sharedPluginData: { namespace: SETTINGS.namespace, keys: [entry] } }))
    .match(
      (found) => found,
      () => layersUnder(root),
    )
    .filter((node) => holds(node, entry));

/** The nodes under a root, and the root itself, that a unit printed. */
export function printedBy(root: SceneNode & ChildrenMixin, unit: string): readonly SceneNode[] {
  const own = read(root, ENTRY.unit) === unit ? [root] : [];
  return [...own, ...carrying(root, ENTRY.unit).filter((node) => read(node, ENTRY.unit) === unit)];
}

/** Records a unit root's or a main's own id on it. */
export const stampId = (node: SceneNode): void => {
  write(node, ENTRY.id, node.id);
};

const carriesOwnId = (node: SceneNode): boolean => read(node, ENTRY.id) === node.id;

/** Whether a node is a person's copy of one the plugin printed: Figma copies its entries with it, the id among them, which is then another node's. */
export const isCopy = (node: SceneNode): boolean => read(node, ENTRY.id) !== '' && !carriesOwnId(node);

/** The node that prints each key, and the copies of it a person made. */
export interface Printed<Node extends SceneNode> {
  readonly printed: Map<string, Node>;
  readonly copies: readonly Node[];
}

/**
 * Sorts the nodes that carry a key into the one that prints it and copies: a
 * node that carries its own id prints its key, and on a page printed before
 * ids were, the first one does. Each other node is a copy.
 */
export function printedOnes<Node extends SceneNode>(nodes: readonly Node[], keyOfNode: (node: Node) => string): Printed<Node> {
  const printed = new Map<string, Node>();
  const copies: Node[] = [];
  for (const node of nodes) {
    const key = keyOfNode(node);
    const held = printed.get(key);
    if (isCopy(node) || (held && (carriesOwnId(held) || !carriesOwnId(node)))) copies.push(node);
    else {
      if (held) copies.push(held);
      printed.set(key, node);
    }
  }
  return { printed, copies };
}

/** Hands a copy to the person who made it: every entry cleared, on it and on every main inside it, so no print finds it again; nothing of it is removed. */
export function release(node: SceneNode): void {
  const mains = 'findAllWithCriteria' in node ? node.findAllWithCriteria({ types: ['COMPONENT'] }) : [];
  for (const one of [node, ...mains]) for (const entry of Object.values(ENTRY)) write(one, entry, '');
}

/** The node that prints each key, claimed: it carries its own id from now on, and each copy is told to `released`, then released. */
export function claim<Node extends SceneNode>(nodes: readonly Node[], keyOfNode: (node: Node) => string, released: (copy: Node) => void): Map<string, Node> {
  const { printed, copies } = printedOnes(nodes, keyOfNode);
  for (const copy of copies) {
    released(copy);
    release(copy);
  }
  for (const node of printed.values()) stampId(node);
  return printed;
}
