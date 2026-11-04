/**
 * The twin print table, for the tests of the twin path (docs/redesign/
 * FIGMA_PRINT.md §6): a design print and its wire twin, as Taruu prints
 * them. Preloaded before any stage loads, so every module reads it:
 *
 *   node --import ./scripts/design/figma-print/testing/twin-table.mts --test …
 */
import type { PrintTable } from '../prints-table.mts';

const TWIN: PrintTable = Object.freeze({
  prints: [
    { name: 'design', collection: { key: 'bento', name: 'Bento' }, block: 'Design' },
    { name: 'wire', collection: { key: 'bento-wire', name: 'Bento wire' }, block: 'Wireframes' },
  ],
  primitives: { key: 'press', name: 'Press' },
});

(globalThis as { [key: symbol]: unknown })[Symbol.for('figma-print/table')] = TWIN;
