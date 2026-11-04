/**
 * The prints (docs/redesign/FIGMA_PRINT.md §6, §8). The file shows every
 * print at once, apart, and nothing switches between them: a route frame or
 * a main is one print, bound to its print's collection only
 * (plan/prints.mts), and a route frame sits in its print's block of the site
 * page (`blockOf`).
 */
import { COLLECTION_OF, isPrintName } from '../../plan/prints.mts';
import type { PrintName } from '../../plan/schema.mts';

const NAMES: readonly PrintName[] = Object.keys(COLLECTION_OF).filter(isPrintName);

/** The print a collection holds, by the collection's key; the primitives collection, which every print reaches through its aliases, holds none. */
export const printOfCollection = (key: string): PrintName | null => NAMES.find((name) => COLLECTION_OF[name] === key) ?? null;
