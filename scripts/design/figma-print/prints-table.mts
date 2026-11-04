/**
 * The prints a page is read in (docs/redesign/FIGMA_PRINT.md §6): data only,
 * so the planner, the check and the plugin bundle all read this one copy.
 *
 * The first print is the primary one: the measured structure is its walk,
 * and its collection holds the tokens. Each later print is a twin, bound to a
 * collection of its own whose variables alias the primary's where the two
 * prints resolve a token alike. With one print there are no twins, no print
 * axis on components and nothing for a purity line to judge.
 */

export interface PrintRow {
  readonly name: string;
  /** The collection the print's frames and mains bind directly. */
  readonly collection: { readonly key: string; readonly name: string };
  /** The name of the print's block on the site page. */
  readonly block: string;
}

export interface PrintTable {
  readonly prints: readonly PrintRow[];
  /** The collection of the primitives no print binds directly and every print resolves alike. */
  readonly primitives: { readonly key: string; readonly name: string };
}

/** The wireframes page: one greyscale print. */
export const WIREFRAME: PrintTable = Object.freeze({
  prints: [{ name: 'wire', collection: { key: 'wireframe', name: 'Wireframe' }, block: 'Wireframes' }],
  primitives: { key: 'primitives', name: 'Wireframe primitives' },
});

/**
 * Where a test run puts another table before any stage loads
 * (`testing/twin-table.mts`, through `node --import`); the stages and the
 * plugin bundle, which nothing preloads, print the wireframe table.
 */
const SEAM = Symbol.for('figma-print/table');
const chosen = (globalThis as { readonly [SEAM]?: PrintTable })[SEAM] ?? WIREFRAME;

export const PRINT_TABLE: readonly PrintRow[] = chosen.prints;

export const PRIMITIVES = chosen.primitives;
