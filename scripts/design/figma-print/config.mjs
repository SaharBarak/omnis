/**
 * The one table the Figma print's stages read (docs/redesign/FIGMA_PRINT.md
 * §3): the measure script, the planner, the receiver and the plugin bundle
 * all take their settings from here, so no stage carries its own copy.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRINT_TABLE } from './prints-table.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** The repository root, where the Next app lives. */
export const APP = path.resolve(HERE, '../../..');
/** The directory an environment variable names, resolved, or null where it names none. */
const dirFromEnv = (name) => (process.env[name]?.trim() ? path.resolve(process.env[name]) : null);
/**
 * Build output of every stage (gitignored). `FIGMA_PRINT_OUT` moves the whole
 * tree, so a test or a second pipeline runs every stage against its own.
 * `FIGMA_PRINT_RAW` moves the measured trees alone, which the measure writes
 * and the plan reads, so one set of trees plans into more than one output.
 */
export const OUT = dirFromEnv('FIGMA_PRINT_OUT') ?? path.join(APP, '.figma-print');
const PLANS = path.join(OUT, 'plans');

export const CONFIG = {
  /** The dev server the measure reads (`npx next dev -p 3100`). */
  base: 'http://localhost:3100',
  viewports: [{ name: 'wide', width: 1440, height: 900 }],
  /** The prints, primary first (prints-table.mts). */
  prints: PRINT_TABLE.map((row) => row.name),
  /** The one element every printed page prints inside; its value names the print it shows. */
  root: '[data-print]',
  /**
   * How CSS-module class names spell `module.local`, tried in order. Turbopack's
   * dev server keeps the module (`wireframe-module__UNOcMW__sheet`), webpack
   * writes `Wireframe_sheet__AbCde`. Turbopack's production build drops the
   * module (`hash_local`), so the measure reads the dev server.
   */
  classGrammars: [
    { name: 'turbopack-dev', pattern: '^([a-z0-9_-]+?)-module__[A-Za-z0-9_-]{6}__(.+)$' },
    { name: 'webpack', pattern: '^([A-Za-z][A-Za-z0-9]*)_(.+?)__[A-Za-z0-9_-]{5}$' },
  ],
  /**
   * What a measured tree is read from (docs/redesign/FIGMA_PRINT.md §3.1,
   * "Provenance", inputs.mjs). A route's entries are the files Next's app
   * router renders it with: its page and every layout and template on its
   * segment chain under `app`. Its source is their module graph, resolved
   * as the dev server resolves it (tsconfig paths, CSS imports, CSS modules),
   * packages aside, which `compile` covers through the lockfile with the
   * config every route compiles with. The measure's own inputs are the graph
   * of `measure`.
   */
  source: {
    app: 'src/app',
    page: 'page',
    conventions: ['layout', 'template'],
    extensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
    compile: ['next.config.mjs', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'package-lock.json', 'src/middleware.ts'],
    loaders: { '.module.css': 'local-css', '.svg': 'empty', '.png': 'empty', '.jpg': 'empty', '.jpeg': 'empty', '.webp': 'empty', '.avif': 'empty', '.gif': 'empty', '.ico': 'empty', '.woff': 'empty', '.woff2': 'empty', '.ttf': 'empty', '.otf': 'empty' },
    measure: ['scripts/design/figma-print/measure.mjs'],
  },
  /** How long a page's layout must hold still before it is read, and the most the script waits for that. */
  settle: { quietMs: 1500, maxMs: 20_000, pollMs: 250 },
  /** CDP requests in flight at once. */
  cdpBatch: 64,
  /** The receiver, on loopback only; it reads a request body up to `bodyLimit` bytes, which a PNG of the tallest route frame fits. */
  receiver: { host: 'localhost', port: 4731, holdMs: 25_000, bodyLimit: 64 * 1024 * 1024 },
  /** The Figma file the plugin may print into, and its pages by role (docs/redesign/FIGMA_PRINT.md §8). */
  figma: {
    fileKey: 'Vc3AO7Ke23Xm8UHM9UeqhJ',
    namespace: 'pleiad',
    /** Pages a Starter file may hold. */
    pageLimit: 3,
    /** Each role adopts the one unclaimed page of its name on the first run. */
    pages: [
      { role: 'design-system', name: 'Design system', adopt: ['Components'] },
      { role: 'site', name: 'Wireframes', adopt: ['Templates · T1–T12'] },
    ],
    /** Box tolerance in px (docs/redesign/FIGMA_PRINT.md §9). */
    tolerance: 1,
    /** The kit parts F2 holds to their measured boxes beside every instance: a template's sheet and slot legend, a storyboard. */
    boxed: ['wireframe.sheet', 'wireframe.legend', 'wireframe.story'],
    /**
     * How far a text's glyphs may ink past its line box, as a share of its line
     * height: side bearings and overhanging marks. Stacking order is printed
     * wherever two layers' ink could meet.
     */
    textOverhang: 0.2,
    /**
     * Bounds on the variants the component census derives from shape: the
     * shapes one group of variant values may split into, and the variants a
     * component may gain so. A measured size in a shape could otherwise make a
     * variant of every occurrence.
     */
    census: { shapesPerGroup: 4, derivedPerComponent: 16 },
    /** Main-thread work per slice before the plugin yields to the editor. */
    sliceMs: 40,
  },
  paths: {
    raw: dirFromEnv('FIGMA_PRINT_RAW') ?? path.join(OUT, 'raw'),
    plans: PLANS,
    /** The plan bundle: the planner writes it, the plugin carries it, the receiver and the check read it. */
    bundle: path.join(PLANS, 'bundle.json'),
    reports: path.join(OUT, 'reports'),
    kit: path.join(OUT, 'kit.json'),
    plugin: path.join(HERE, 'plugin'),
  },
};

/** The computed properties the walker reads for every element. */
export const STYLE_PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'box-sizing',
  'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'align-self', 'justify-items', 'justify-self',
  'flex-grow', 'flex-shrink', 'flex-basis', 'order', 'row-gap', 'column-gap',
  'grid-template-columns', 'grid-template-rows', 'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end', 'grid-auto-flow',
  'width', 'height', 'min-width', 'max-width', 'min-height',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'overflow-x', 'overflow-y', 'clip-path',
  'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
  'box-shadow', 'opacity', 'visibility', 'mix-blend-mode', 'filter', 'backdrop-filter', 'transform', 'object-fit',
  'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'text-align', 'text-transform', 'text-decoration-line', 'white-space', 'direction', 'unicode-bidi',
  'font-variant-numeric', '-webkit-line-clamp', 'text-overflow', 'text-wrap-style', 'vertical-align',
];

/** The computed properties read for an input's placeholder. */
export const PLACEHOLDER_PROPS = ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'opacity'];

/**
 * The properties whose authored token the measure stage resolves, each with
 * the declarations that can set it, most specific first. A box side or corner
 * is written once, by its logical name: cascade.mjs maps it onto the physical
 * side each element's own direction gives it, so a left-to-right island (a
 * phone number, an e-mail field) resolves its own sides. `color` comes first,
 * since a `currentcolor` in any later property reads its chains.
 */
export const BOUND_PROPS = {
  color: ['color'],
  fill: ['fill'],
  stroke: ['stroke'],
  'background-color': ['background-color', 'background'],
  'background-image': ['background-image', 'background'],
  'box-shadow': ['box-shadow'],
  'font-size': ['font-size', 'font'],
  'font-family': ['font-family', 'font'],
  'line-height': ['line-height', 'font'],
  'letter-spacing': ['letter-spacing'],
  'row-gap': ['row-gap', 'gap', 'grid-row-gap', 'grid-gap'],
  'column-gap': ['column-gap', 'gap', 'grid-column-gap', 'grid-gap'],
  'padding-block-start': ['padding-block-start', 'padding-block', 'padding'],
  'padding-block-end': ['padding-block-end', 'padding-block', 'padding'],
  'padding-inline-start': ['padding-inline-start', 'padding-inline', 'padding'],
  'padding-inline-end': ['padding-inline-end', 'padding-inline', 'padding'],
  'border-block-start-color': ['border-block-start-color', 'border-block-color', 'border-block-start', 'border-block', 'border-color', 'border'],
  'border-block-end-color': ['border-block-end-color', 'border-block-color', 'border-block-end', 'border-block', 'border-color', 'border'],
  'border-inline-start-color': ['border-inline-start-color', 'border-inline-color', 'border-inline-start', 'border-inline', 'border-color', 'border'],
  'border-inline-end-color': ['border-inline-end-color', 'border-inline-color', 'border-inline-end', 'border-inline', 'border-color', 'border'],
  'border-block-start-width': ['border-block-start-width', 'border-block-width', 'border-block-start', 'border-block', 'border-width', 'border'],
  'border-start-start-radius': ['border-start-start-radius', 'border-radius'],
  'border-start-end-radius': ['border-start-end-radius', 'border-radius'],
  'border-end-start-radius': ['border-end-start-radius', 'border-radius'],
  'border-end-end-radius': ['border-end-end-radius', 'border-radius'],
};

/**
 * The properties whose declared keyword the plan needs where the computed
 * value resolves it away, with the declarations that can set each, as in
 * BOUND_PROPS: an `auto` margin takes a flex line's free space, and an
 * `auto` inset leaves its side of a positioned box unanchored, though Chrome
 * reports every inset of a positioned box in px.
 */
export const KEYWORD_PROPS = {
  'margin-block-start': ['margin-block-start', 'margin-block', 'margin'],
  'margin-block-end': ['margin-block-end', 'margin-block', 'margin'],
  'margin-inline-start': ['margin-inline-start', 'margin-inline', 'margin'],
  'margin-inline-end': ['margin-inline-end', 'margin-inline', 'margin'],
  'inset-block-start': ['inset-block-start', 'inset-block', 'inset'],
  'inset-block-end': ['inset-block-end', 'inset-block', 'inset'],
  'inset-inline-start': ['inset-inline-start', 'inset-inline', 'inset'],
  'inset-inline-end': ['inset-inline-end', 'inset-inline', 'inset'],
};

/** The keywords KEYWORD_PROPS records; any other declared value is the computed one. */
export const KEYWORDS = ['auto'];

/** The physical insets, which apply to positioned boxes only (CSS Position 3 §3.1). */
export const INSETS = ['top', 'right', 'bottom', 'left'];

/**
 * The initial values the cascade reads need, by physical property: what one
 * declared `initial`, or reset to it, or not declared at all, is. Every inset
 * starts `auto` (CSS Position 3 §3.1) and every border colour `currentcolor`
 * (CSS Backgrounds 3 §3.1), which reads the element's own colour.
 */
export const INITIAL_VALUES = Object.fromEntries(INSETS.flatMap((side) => [[side, 'auto'], [`border-${side}-color`, 'currentcolor']]));

/** Properties that inherit (CSS Cascade 5 §7.2; SVG 2 §13.2 for `fill` and `stroke`), besides every custom property: one left undeclared, or declared `unset`, takes its parent's declaration. */
export const INHERITED = new Set(['color', 'font-size', 'font-family', 'line-height', 'letter-spacing', 'fill', 'stroke']);
