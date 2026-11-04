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

export const PRINT_TABLES: Readonly<Record<string, PrintTable>> = Object.freeze({
  /** The wireframes page: one greyscale print. */
  wireframe: {
    prints: [{ name: 'wire', collection: { key: 'wireframe', name: 'Wireframe' }, block: 'Wireframes' }],
    primitives: { key: 'primitives', name: 'Wireframe primitives' },
  },
  /** A design print and its wire twin, as the twin path's tests read it. */
  twin: {
    prints: [
      { name: 'design', collection: { key: 'bento', name: 'Bento' }, block: 'Design' },
      { name: 'wire', collection: { key: 'bento-wire', name: 'Bento wire' }, block: 'Wireframes' },
    ],
    primitives: { key: 'press', name: 'Press' },
  },
});

/** `FIGMA_PRINT_TABLE` names another table for a test run; the plugin bundle, which has no environment, carries the default. */
const named = (globalThis as { readonly process?: { readonly env?: Readonly<Record<string, string | undefined>> } }).process?.env?.['FIGMA_PRINT_TABLE'] ?? 'wireframe';
const chosen = PRINT_TABLES[named];
if (!chosen) throw new Error(`FIGMA_PRINT_TABLE names no print table; the tables are ${Object.keys(PRINT_TABLES).join(', ')}`);

export const PRINT_TABLE: readonly PrintRow[] = chosen.prints;

export const PRIMITIVES = chosen.primitives;
