/**
 * What `measure.mjs` writes (docs/redesign/FIGMA_PRINT.md §3.1): one raw tree per
 * route and viewport, the structure both prints share plus each print's
 * computed styles, authored tokens and pseudo-elements, and the record of how
 * the page was read, which the plan checks (`faultsOf`) before it trusts one.
 */
import type { Box, PrintName, ViewportName } from './schema.mts';

export interface RawText {
  readonly text: string;
  readonly at: number;
  /** Chrome's glyph rects of the text, one per line and direction run. */
  readonly lines: readonly Box[];
  /** How far the text's line box starts above its glyph rects, measured on a probe line of its face. */
  readonly lead?: number;
}

export interface RawElement {
  readonly id: string;
  readonly parent: string | null;
  readonly index: number;
  readonly at: number;
  readonly tag: string;
  readonly cls: readonly string[];
  readonly data: Readonly<Record<string, string>>;
  readonly attrs: Readonly<Record<string, string>>;
  readonly box: Box;
  /** Rendered in neither print. */
  readonly none?: true;
  readonly kids?: readonly RawKid[];
  readonly img?: { readonly src: string; readonly natural: readonly [number, number] };
  readonly canvas?: { readonly size: readonly [number, number] };
  readonly field?: { readonly value: string; readonly placeholder: string };
}

export type RawKid = RawElement | RawText;

export const isText = (kid: RawKid): kid is RawText => 'text' in kid;

export interface RawBinding {
  /** The declared value (or its shorthand component) that sets the property. */
  readonly value: string;
  /** For each var() in it, the chain of custom properties it aliases. */
  readonly chains: readonly (readonly string[])[];
}

export interface RawPrintNode {
  /** Index into the print's style table. */
  readonly s: number;
  readonly none?: true;
  readonly svg?: string;
  /** A drawing's shapes, with their computed paints, their authored chains and the markup ids that draw them. */
  readonly shapes?: readonly RawShape[];
  /** What a drawing's markup could not carry to the importer (a mid marker on a path), which the plan lists as approximated. */
  readonly unread?: readonly string[];
  readonly placeholder?: Readonly<Record<string, string>>;
  readonly bind?: Readonly<Record<string, RawBinding>>;
  /** Declared keywords the computed style resolves away (an `auto` margin, a positioned box's `auto` inset), by physical property. */
  readonly keywords?: Readonly<Record<string, string>>;
  /** The platform face Chrome drew the element's text with. */
  readonly face?: string;
}

export interface RawShape {
  readonly id: string;
  readonly cls: readonly string[];
  readonly fill: string;
  readonly stroke: string;
  /** The markup ids that draw the shape: its own, and one more per end a marker of it marks. */
  readonly layers: readonly string[];
  readonly bind?: Readonly<Record<string, RawBinding>>;
}

export interface RawPseudo {
  readonly kind: 'before' | 'after';
  readonly box: Box;
  readonly style: Readonly<Record<string, string>>;
  readonly bind: Readonly<Record<string, RawBinding>>;
  /** As on an element: the declared keywords its computed style resolves away. */
  readonly keywords?: Readonly<Record<string, string>>;
  /** The text its content generated as Chrome laid it out (a string, a counter, an attribute, a quote), when it is not blank. */
  readonly text?: string;
}

export interface RawPrint {
  readonly styles: readonly Readonly<Record<string, string>>[];
  /** Every custom property's computed value on the stage. */
  readonly tokens: Readonly<Record<string, string>>;
  readonly nodes: Readonly<Record<string, RawPrintNode>>;
  readonly pseudo: Readonly<Record<string, readonly RawPseudo[]>>;
}

export interface RawFace {
  readonly family: string;
  readonly weight: string;
  readonly style: string;
}

/** One box a twin print's read put elsewhere than the primary print's read. */
export interface RawMove {
  readonly id: string;
  readonly tag: string;
  readonly cls: readonly string[];
  /** The twin print that moved it. */
  readonly print: PrintName;
  readonly primary: Box;
  readonly twin: Box;
}

/** What the twin prints' reads did to the primary read's boxes: how many they moved, by at most how far in px, and the first few. */
export interface RawGeometry {
  readonly moved: number;
  readonly maxDelta: number;
  readonly samples: readonly RawMove[];
}

/** One print's DevTools reads: those that found no element of the walk, those that failed, and the first few of either. */
export interface RawReads {
  readonly misses: number;
  readonly errors: number;
  readonly samples: readonly string[];
}

/** How a page was read, which a tree must show was whole before the plan trusts it. */
export interface RawRead {
  /** Per print, whether the page held still (layout quiet, nothing busy, no data read in flight) before the read. */
  readonly settled: Readonly<Record<PrintName, boolean>>;
  /** Per print, the most scrollers found off their start before any of its reads. */
  readonly restless: Readonly<Record<PrintName, number>>;
  readonly geometry: RawGeometry;
  readonly reads: Readonly<Record<PrintName, RawReads>>;
}

export interface RawPage extends RawRead {
  readonly route: string;
  readonly viewport: ViewportName;
  readonly size: readonly [number, number];
  readonly stamp: {
    readonly commit: string;
    /** The page's source paths that differ from the commit, as the dev server served them. */
    readonly dirty: readonly string[];
    /** Content digests of the page source and the measure's own code as the working tree held them before the first read (`inputs.mjs`); the planner refuses a tree without them. */
    readonly inputs?: { readonly site: string; readonly measure: string };
    /** The same digests after the last read; a tree whose two differ was read across a change of its source. */
    readonly inputsAfter?: { readonly site: string; readonly measure: string };
    /** Whether the page loaded again between its walk and its protocol reads. */
    readonly reloaded?: boolean;
    readonly base: string;
    /** What the dev server said it is. */
    readonly next?: { readonly version: string | null; readonly dev: boolean };
    /** The Chromium version that read the page; the planner refuses trees read by more than one. */
    readonly browser?: string;
    readonly buildId: string | null;
    readonly measuredAt: string;
  };
  readonly lang: string;
  readonly dir: 'rtl' | 'ltr';
  readonly page: readonly [number, number];
  readonly fonts: readonly RawFace[];
  readonly tree: RawElement;
  readonly prints: Readonly<Record<PrintName, RawPrint>>;
}

/**
 * One print of a page (docs/redesign/FIGMA_PRINT.md §6): the structure both prints
 * share, with that print's styles, tokens, nodes and pseudo-elements only, so
 * a frame planned from it cannot read the other print.
 */
export interface RawProjection extends Omit<RawPage, 'prints'>, RawPrint {
  readonly print: PrintName;
}

/** One print's reads of a page; a print the page was not read in is a fault in the caller. */
export const printOf = (page: Pick<RawPage, 'prints' | 'route'>, print: PrintName): RawPrint => {
  const read = page.prints[print];
  if (read === undefined) throw new Error(`${page.route} was not read in the ${print} print`);
  return read;
};

export const projectionOf = (page: RawPage, print: PrintName): RawProjection => {
  const { prints, ...shared } = page;
  return { ...shared, ...printOf({ prints, route: page.route }, print), print };
};

/** One reason a tree was not read whole, with what shows it. */
export interface RawFault {
  readonly why: string;
  readonly detail: string;
}

/** A box as the faults show it. */
const boxText = (box: Box): string => `[${box.join(', ')}]`;

/**
 * Why a page was not read whole: a box the wire read moved, a print that did
 * not settle, a scroller left off its start, a DevTools read that missed or
 * failed, or no record of the read at all. Empty while the read was whole.
 */
export function faultsOf(read: Partial<RawRead>): readonly RawFault[] {
  const { settled, restless, geometry, reads } = read;
  if (!settled || !restless || !geometry || !reads) {
    const missing = Object.entries({ settled, restless, geometry, reads }).flatMap(([name, value]) => (value === undefined ? [name] : []));
    return [{ why: 'no record of how it was read', detail: `no ${missing.join(', ')}` }];
  }
  const faults: RawFault[] = [];
  if (geometry.moved > 0) {
    const first = geometry.samples[0];
    faults.push({ why: 'boxes moved between the prints', detail: `${geometry.moved}, up to ${geometry.maxDelta}px${first ? `; first ${first.id} ${[first.tag, ...first.cls].join('.')} ${boxText(first.primary)} -> ${first.print} ${boxText(first.twin)}` : ''}` });
  }
  const unsettled = Object.entries(settled).flatMap(([print, still]) => (still ? [] : [print]));
  if (unsettled.length > 0) faults.push({ why: 'the page did not settle', detail: unsettled.join(', ') });
  const off = Object.entries(restless).filter(([, count]) => count > 0);
  if (off.length > 0) faults.push({ why: 'scrollers off their start', detail: off.map(([print, count]) => `${print} ${count}`).join(', ') });
  const failed = Object.entries(reads).filter(([, one]) => one.misses + one.errors > 0);
  if (failed.length > 0) {
    const first = failed.flatMap(([, one]) => one.samples)[0];
    faults.push({ why: 'DevTools reads missed or failed', detail: `${failed.map(([print, one]) => `${print} ${one.misses} missed ${one.errors} failed`).join(', ')}${first ? `; first ${first}` : ''}` });
  }
  return faults;
}

/** How many trees carry each value of `of`, a value missing counted under `none`. */
const tally = (stamps: readonly RawPage['stamp'][], of: (stamp: RawPage['stamp']) => string | null | undefined, none: string): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const stamp of stamps) {
    const value = of(stamp) ?? none;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
};

/**
 * Why a tree was not read from what the measure reads, the dev server, whose
 * class names keep their module (docs/redesign/FIGMA_PRINT.md §2): a
 * production server, or no record of the server. Empty for a dev read.
 */
export const whyNotDev = (stamp: RawPage['stamp']): readonly string[] =>
  stamp.next === undefined ? ['no record of the server it was read from'] : stamp.next.dev ? [] : [`read from a production server (Next ${stamp.next.version ?? 'of no version'})`];

/**
 * Why a set of trees cannot be planned together, by their stamps: more than
 * one build, Next version or browser read them. Empty while one of each did.
 */
export function mixesOf(stamps: readonly RawPage['stamp'][]): readonly string[] {
  const builds = tally(stamps, (stamp) => stamp.buildId, 'no build id');
  const nexts = tally(stamps, (stamp) => stamp.next?.version, 'no Next version stamped');
  const browsers = tally(stamps, (stamp) => stamp.browser, 'no browser stamped');
  return [
    ...(builds.size > 1 ? [`the trees come from ${builds.size} builds; measure them against one`] : []),
    ...(nexts.size > 1 ? [`the trees were served by ${nexts.size} Next versions (${[...nexts].map(([version, n]) => `${version}: ${n}`).join(', ')}); measure them against one`] : []),
    ...(browsers.size > 1 ? [`the trees were read by ${browsers.size} browsers (${[...browsers].map(([version, n]) => `${version}: ${n}`).join(', ')}); measure them with one`] : []),
  ];
}
