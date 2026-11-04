/**
 * The kit table (docs/redesign/FIGMA_PRINT.md §7): which measured elements
 * are kit components and how an occurrence names its variant.
 *
 * Each row names the kit export that renders the component, the CSS-module
 * part of its root element (`wireframe.pill`), and the axes its variants
 * differ on. Every part names its module, and `MODULES` says which stylesheet
 * each module is. The table is data; `checkKit` proves every export, file and
 * class it names against the kit's source, so a renamed class or export
 * fails the plan instead of printing a component that no longer exists.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Where a variant axis reads its value on an occurrence. */
export type AxisSource =
  /** A `data-*` attribute of the root. */
  | { readonly data: string }
  /** An `aria-*` attribute of the root. */
  | { readonly aria: string }
  /** The first of these parts found on the root's own classes. */
  | { readonly classes: Readonly<Record<string, string>> }
  /** The first of these parts found under the root. */
  | { readonly has: Readonly<Record<string, string>> }
  /** The drawing's shape and paint pattern (an SVG root), named by frequency. */
  | { readonly glyph: true };

export interface KitAxis {
  readonly name: string;
  readonly from: AxisSource;
  /** The value when the source is absent. */
  readonly fallback: string;
}

export interface KitEntry {
  /** The component's name in Figma, as the kit names it. */
  readonly name: string;
  readonly group: 'glyph' | 'control' | 'molecule' | 'tile' | 'chrome';
  readonly description: string;
  /** The source that renders it: an export, a local function, or an exported class constant. */
  readonly source: { readonly file: string; readonly symbol: string; readonly kind: 'export' | 'local' | 'class' };
  /** The CSS-module part of the root element (`wireframe.pill`). */
  readonly root: string;
  readonly axes: readonly KitAxis[];
  /** A container: the root's children are each occurrence's own content, carried in a slot. */
  readonly container?: true;
}

/** Each CSS module a part may name, by the module name its classes carry, and its stylesheet. */
export const MODULES: Readonly<Record<string, string>> = {
  wireframe: 'src/components/bento-lab/wireframe/wireframe.module.css',
};

const KIT_DIR = 'src/components/bento-lab/wireframe';
const PRIMITIVES = `${KIT_DIR}/primitives.tsx`;
const STORYBOARD = `${KIT_DIR}/storyboard.tsx`;
const glyph: KitAxis = { name: 'glyph', from: { glyph: true }, fallback: '1' };
const slotted: KitAxis = { name: 'slot', from: { has: { 'wireframe.n': 'yes' } }, fallback: 'no' };

/** Atoms first: a component's main may hold instances of the rows above it. */
export const KIT: readonly KitEntry[] = [
  { name: 'Slot tag', group: 'glyph', description: 'A numbered slot: the legend under the sheet says what the built page puts here.', source: { file: PRIMITIVES, symbol: 'Tag', kind: 'local' }, root: 'wireframe.n', axes: [] },
  { name: 'Legend key', group: 'glyph', description: "A slot's number in the legend.", source: { file: PRIMITIVES, symbol: 'Figure', kind: 'export' }, root: 'wireframe.legendKey', axes: [] },
  { name: 'Frame number', group: 'glyph', description: "A storyboard frame's place in its strip.", source: { file: STORYBOARD, symbol: 'Storyboard', kind: 'export' }, root: 'wireframe.storyN', axes: [] },
  { name: 'Engine mark', group: 'glyph', description: 'The mark of the one engine that moves a frame.', source: { file: STORYBOARD, symbol: 'EngineTag', kind: 'local' }, root: 'wireframe.engineMark', axes: [glyph] },
  { name: 'Engine tag', group: 'control', description: 'The engine that moves a frame: its mark and its name.', source: { file: STORYBOARD, symbol: 'EngineTag', kind: 'local' }, root: 'wireframe.engine', axes: [] },
  {
    name: 'Pill',
    group: 'control',
    description: 'A choice or an action: outlined, or solid for the primary one, with an optional icon.',
    source: { file: PRIMITIVES, symbol: 'Pill', kind: 'export' },
    root: 'wireframe.pill',
    axes: [
      { name: 'fill', from: { classes: { 'wireframe.pillSolid': 'solid' } }, fallback: 'outline' },
      { name: 'icon', from: { has: { 'wireframe.ico': 'yes' } }, fallback: 'no' },
      slotted,
    ],
  },
  { name: 'Field', group: 'control', description: 'A labelled input with its hint.', source: { file: PRIMITIVES, symbol: 'Field', kind: 'export' }, root: 'wireframe.field', axes: [slotted] },
  {
    name: 'Placeholder',
    group: 'molecule',
    description: 'Where a figure, a photo or a chart will be: hatched, with an optional caption.',
    source: { file: PRIMITIVES, symbol: 'Ph', kind: 'export' },
    root: 'wireframe.ph',
    axes: [
      { name: 'shape', from: { classes: { 'wireframe.round': 'round' } }, fallback: 'rect' },
      { name: 'caption', from: { has: { 'wireframe.cap': 'yes' } }, fallback: 'no' },
      slotted,
    ],
  },
  { name: 'Text lines', group: 'molecule', description: 'Body copy as grey lines.', source: { file: PRIMITIVES, symbol: 'Lines', kind: 'export' }, root: 'wireframe.lines', axes: [] },
  {
    name: 'Title lines',
    group: 'molecule',
    description: 'A heading as ink lines, in three sizes.',
    source: { file: PRIMITIVES, symbol: 'Title', kind: 'export' },
    root: 'wireframe.title',
    axes: [{ name: 'size', from: { classes: { 'wireframe.titleLg': 'lg', 'wireframe.titleSm': 'sm' } }, fallback: 'md' }, slotted],
  },
  { name: 'Rule', group: 'molecule', description: 'A divider.', source: { file: PRIMITIVES, symbol: 'Rule', kind: 'export' }, root: 'wireframe.rule', axes: [] },
  { name: 'Storyboard frame', group: 'tile', description: 'One moment of a storyboard: its number, time, engine, drawing and caption.', source: { file: STORYBOARD, symbol: 'Storyboard', kind: 'export' }, root: 'wireframe.storyFrame', axes: [], container: true },
];

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Proves every row against the kit's source; each problem is one line. */
export function checkKit(appDir: string, kit: readonly KitEntry[] = KIT, modules: Readonly<Record<string, string>> = MODULES): string[] {
  const problems: string[] = [];
  const sources = new Map<string, string>();
  const read = (file: string): string | null => {
    if (!sources.has(file)) {
      const full = path.join(appDir, file);
      sources.set(file, fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '');
    }
    return sources.get(file) || null;
  };
  /** Why a part names no class of its module's stylesheet, or null when it does. */
  const whyNoClass = (part: string): string | null => {
    const [module, local] = part.split('.');
    const sheet = module === undefined ? undefined : modules[module];
    if (!sheet || local === undefined) return `${part} names no module of MODULES`;
    const css = read(sheet);
    if (!css) return `${sheet} does not exist`;
    return new RegExp(`\\.${escape(local)}(?![\\w-])`).test(css) ? null : `no class ${local} in ${sheet}`;
  };
  const names = new Set<string>();
  const roots = new Map<string, string>();
  for (const entry of kit) {
    if (names.has(entry.name)) problems.push(`${entry.name}: named twice`);
    names.add(entry.name);
    const owner = roots.get(entry.root);
    if (owner) problems.push(`${entry.name}: its root ${entry.root} is ${owner}'s root too`);
    roots.set(entry.root, entry.name);
    const source = read(entry.source.file);
    if (!source) {
      problems.push(`${entry.name}: ${entry.source.file} does not exist`);
      continue;
    }
    const symbol = escape(entry.source.symbol);
    const declared = entry.source.kind === 'local' ? new RegExp(`\\bfunction ${symbol}\\b|\\bconst ${symbol}\\b`) : new RegExp(`\\bexport (?:function|const) ${symbol}\\b`);
    if (!declared.test(source)) problems.push(`${entry.name}: ${entry.source.file} declares no ${entry.source.kind} ${entry.source.symbol}`);
    const rootWhy = whyNoClass(entry.root);
    if (rootWhy) problems.push(`${entry.name}: ${rootWhy}`);
    for (const axis of entry.axes) {
      const parts = 'has' in axis.from ? Object.keys(axis.from.has) : 'classes' in axis.from ? Object.keys(axis.from.classes) : [];
      for (const part of parts) {
        const why = whyNoClass(part);
        if (why) problems.push(`${entry.name}.${axis.name}: ${why}`);
      }
    }
  }
  return problems;
}
