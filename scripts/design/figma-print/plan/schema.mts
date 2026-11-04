/**
 * The print plan (docs/redesign/FIGMA_PRINT.md §3.2): what the planner writes and the
 * plugin prints. Everything here is already Figma's: physical boxes, Figma
 * enums, variables by key. The plugin decides nothing the plan can say.
 */

export const PROTOCOL = 2;

/** A print's name, as prints-table.mts lists it. */
export type PrintName = string;
export type ViewportName = 'wide' | 'narrow';

/** sRGB channels and alpha, each 0–1. */
export type Rgba = readonly [number, number, number, number];
/** x, y, width, height in px. */
export type Box = readonly [number, number, number, number];
/** A 2×3 affine transform, Figma's gradient matrix. */
export type Affine = readonly [readonly [number, number, number], readonly [number, number, number]];

export type VariableType = 'COLOR' | 'FLOAT' | 'STRING';
export type VariableScope =
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR'
  | 'CORNER_RADIUS'
  | 'GAP'
  | 'WIDTH_HEIGHT'
  | 'STROKE_FLOAT'
  | 'OPACITY'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'FONT_FAMILY'
  | 'FONT_WEIGHT';

export type VariableValue =
  | { readonly kind: 'color'; readonly rgba: Rgba }
  | { readonly kind: 'float'; readonly value: number }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'alias'; readonly key: string };

export interface VariableSpec {
  readonly key: string;
  readonly name: string;
  readonly type: VariableType;
  /** Its value in its collection's print, or an alias of its primary twin where the prints agree. */
  readonly value: VariableValue;
  readonly scopes: readonly VariableScope[];
  /** The custom property it prints, as WEB code syntax. */
  readonly css?: string;
  readonly description?: string;
}

export interface CollectionSpec {
  readonly key: string;
  readonly name: string;
  readonly variables: readonly VariableSpec[];
}

export interface ColorRef {
  readonly rgba: Rgba;
  /** The variable the colour is bound to; absent when the value is measured only. */
  readonly variable?: string;
  /** The share of the variable's colour the paint shows, where the code mixed the token with transparency: the paint's opacity. */
  readonly tint?: number;
}

export type PaintSpec =
  | { readonly type: 'SOLID'; readonly color: ColorRef }
  | {
      readonly type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
      readonly stops: readonly { readonly at: number; readonly color: ColorRef }[];
      readonly transform: Affine;
    };

export interface EffectSpec {
  readonly type: 'DROP_SHADOW' | 'INNER_SHADOW';
  readonly color: ColorRef;
  readonly offset: readonly [number, number];
  readonly radius: number;
  readonly spread: number;
}

/** A number, bound to a FLOAT variable when the code authored it through one. */
export interface Bound {
  readonly value: number;
  readonly variable?: string;
}

export interface TextStyleSpec {
  readonly key: string;
  readonly name: string;
  readonly family: string;
  /** The weight Chrome used, after matching against the faces the site loads. */
  readonly weight: number;
  readonly italic: boolean;
  readonly size: number;
  /** px; null is the face's normal line height. */
  readonly lineHeight: number | null;
  readonly letterSpacing: number;
  readonly textCase?: 'UPPER' | 'LOWER' | 'TITLE';
  readonly decoration?: 'UNDERLINE' | 'STRIKETHROUGH';
  readonly bind?: { readonly fontSize?: string };
}

export interface EffectStyleSpec {
  readonly key: string;
  readonly name: string;
  readonly effects: readonly EffectSpec[];
}

export type Sizing = 'FIXED' | 'HUG' | 'FILL';
export type Align = 'MIN' | 'CENTER' | 'MAX';
export type Constraint = 'MIN' | 'MAX' | 'CENTER' | 'STRETCH' | 'SCALE';

export interface NodeBase {
  readonly key: string;
  readonly name: string;
  /** Relative to the parent node, physical. */
  readonly box: Box;
  /** Relative to the route frame (or the main component), for the plugin's self-check. */
  readonly abs: Box;
  readonly sizing: { readonly h: Sizing; readonly v: Sizing };
  /** Out of its auto layout parent's flow, at `box`, held by these constraints. */
  readonly absolute?: { readonly h: Constraint; readonly v: Constraint };
  /** Its cell in a GRID parent, 0-based from the top left. */
  readonly grid?: {
    readonly row: number;
    readonly col: number;
    readonly rowSpan: number;
    readonly colSpan: number;
    readonly h: Align;
    readonly v: Align;
  };
  /** False for a layer out of flow that its print hides with `visibility: hidden`; a layer the print does not render is not planned at all. */
  readonly visible?: boolean;
  /** Layer opacity; zero for a layer in flow that its print hides with `visibility: hidden`, so it keeps its space. */
  readonly opacity?: Bound;
  /** The kit part it prints (`wireframe.sheet`), recorded in its shared plugin data. */
  readonly part?: string;
}

/**
 * A grid track: FIXED at `value` px, FLEX with `value` as its fr weight, or
 * HUG, sized to its content (`value` is the size measured, for the check).
 */
export interface GridTrack {
  readonly type: 'FIXED' | 'FLEX' | 'HUG';
  readonly value: number;
}

export type LayoutSpec =
  | { readonly mode: 'NONE' }
  | {
      readonly mode: 'HORIZONTAL' | 'VERTICAL';
      readonly padding: readonly [Bound, Bound, Bound, Bound];
      readonly gap: Bound;
      readonly primary: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
      readonly counter: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
      readonly strokesIncluded: boolean;
      readonly reverseZ: boolean;
    }
  | {
      readonly mode: 'GRID';
      readonly padding: readonly [Bound, Bound, Bound, Bound];
      /** Left to right. */
      readonly cols: readonly GridTrack[];
      /** Top to bottom. */
      readonly rows: readonly GridTrack[];
      readonly colGap: Bound;
      readonly rowGap: Bound;
      readonly strokesIncluded: boolean;
    };

export interface FrameSpec extends NodeBase {
  readonly type: 'FRAME';
  readonly layout: LayoutSpec;
  readonly fills: readonly PaintSpec[];
  readonly strokes: readonly PaintSpec[];
  /** top, right, bottom, left. */
  readonly strokeWeights?: readonly [Bound, Bound, Bound, Bound];
  readonly strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  readonly dash?: readonly number[];
  /** top-left, top-right, bottom-right, bottom-left. */
  readonly radii?: readonly [Bound, Bound, Bound, Bound];
  readonly effects?: readonly EffectSpec[];
  /** The effect style its effects come from, a shadow token drawn alike in both prints; `effects` stays the measured list. */
  readonly effectStyle?: string;
  readonly clips: boolean;
  readonly children: readonly NodeSpec[];
  /** In a container's main component: this frame is its slot. */
  readonly slot?: true;
}

export interface TextRun {
  readonly start: number;
  readonly end: number;
  readonly style?: string;
  readonly fills?: readonly PaintSpec[];
}

export interface TextSpec extends NodeBase {
  readonly type: 'TEXT';
  readonly characters: string;
  /** Text style key. */
  readonly style: string;
  readonly fills: readonly PaintSpec[];
  readonly align: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  readonly resize: 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'NONE';
  /** The line count Chrome laid it in. */
  readonly lines: number;
  readonly runs?: readonly TextRun[];
  readonly maxLines?: number;
  /** The height CSS holds the text's box at when its lines are fewer (`min-height`): a minimum, so more lines grow it. */
  readonly minHeight?: number;
}

export interface SvgSpec extends NodeBase {
  readonly type: 'SVG';
  readonly svg: string;
  /** Imported paints to rebind: the colour as `#rrggbbaa`, and its variable. */
  readonly colors: readonly { readonly hex: string; readonly variable: string }[];
  /** Imported layers to rebind by the id the markup gave them, each paint to its own shape's token, then to name; these come before `colors`. */
  readonly layers: readonly { readonly id: string; readonly name: string; readonly fill?: string; readonly stroke?: string }[];
}

/**
 * One override of an instance, applied in list order. A swap comes before
 * every override under its layer: it puts the nested instance on another
 * variant and clears that layer's overrides, so the ones after it are
 * relative to the variant it now shows.
 */
export interface OverrideSpec {
  /**
   * The main component's node key this override lands on; '' is the instance
   * itself. A layer inside a nested instance is the path of main keys from the
   * outer main down, joined by ' > '; below a swap the keys are the swapped-in
   * variant's.
   */
  readonly part: string;
  /** A nested instance shows this variant of its component (the variant's key). */
  readonly swap?: string;
  readonly characters?: string;
  readonly style?: string;
  readonly fills?: readonly PaintSpec[];
  readonly strokes?: readonly PaintSpec[];
  /** Top, right, bottom, left, as on a frame; an override with strokes and no weights keeps the main's. */
  readonly strokeWeights?: readonly [Bound, Bound, Bound, Bound];
  readonly strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  /** The dash pattern; empty is a solid line. */
  readonly dash?: readonly number[];
  readonly effects?: readonly EffectSpec[];
  /** The effect style the layer's effects come from. */
  readonly effectStyle?: string;
  readonly visible?: boolean;
  readonly opacity?: Bound;
  readonly size?: readonly [number, number];
  /** An imported drawing's paints: each colour of the main (`#rrggbbaa`) and the occurrence's colour in its place. */
  readonly recolor?: readonly { readonly from: string; readonly to: ColorRef }[];
}

export interface InstanceSpec extends NodeBase {
  readonly type: 'INSTANCE';
  /** The variant's key. */
  readonly component: string;
  readonly overrides: readonly OverrideSpec[];
  /** Content for the main component's slots, by the slot frame's key in the main. */
  readonly slots?: Readonly<Record<string, readonly NodeSpec[]>>;
}

export type NodeSpec = FrameSpec | TextSpec | SvgSpec | InstanceSpec;

export interface VariantSpec {
  readonly key: string;
  /** Variant property values; empty for a component with one shape. */
  readonly values: Readonly<Record<string, string>>;
  /** The main component: its root is the component, its descendants its layers, keyed relative to it. */
  readonly root: FrameSpec | SvgSpec;
  /** The occurrence the main is drawn from, by its node key in its route frame: a layer keyed `<variant key><rest>` prints that frame's `<source><rest>`. */
  readonly source: string;
  /** Text layers exposed as TEXT properties, by node key. */
  readonly texts: readonly { readonly part: string; readonly property: string; readonly value: string }[];
}

export interface ComponentSpec {
  readonly key: string;
  readonly name: string;
  readonly group: string;
  readonly description: string;
  /** The kit export and source file it prints. */
  readonly source: { readonly export: string; readonly file: string };
  /** A content hash: an unchanged component is not rebuilt. */
  readonly hash: string;
  readonly variants: readonly VariantSpec[];
}

export interface RouteSpec {
  /** `route|viewport|print`; every node key in the frame starts with it, and an element's node keys differ between its two prints by the print alone. */
  readonly key: string;
  readonly route: string;
  readonly group: string;
  readonly viewport: ViewportName;
  /** The print this frame is: it binds that print's collection only (docs/redesign/FIGMA_PRINT.md §6). */
  readonly print: PrintName;
  /**
   * The elements only another print renders on this page, by their node key
   * below the route key, read from the measure: neither this frame nor a
   * main drawn from it holds a layer at or under one of them (F8).
   */
  readonly absent: readonly string[];
  /** A content hash: an unchanged route frame is not replaced. */
  readonly hash: string;
  readonly frame: FrameSpec;
}

export interface FileSpec {
  readonly fileKey: string;
  /** The pages the plugin writes; on the first run each role adopts the one unclaimed page named by its name or one of `adopt`. */
  readonly pages: readonly { readonly role: 'design-system' | 'site'; readonly name: string; readonly adopt: readonly string[] }[];
  /** The pages the file's plan allows: a role with no page gets a new one only under this limit. */
  readonly pageLimit: number;
  /** px: a printed box further than this from its measured box is a miss. */
  readonly tolerance: number;
  /** The kit parts F2 holds to their measured boxes, beside every instance: the page's figures. */
  readonly boxed: readonly string[];
  /** ms of work between yields to the editor. */
  readonly sliceMs: number;
  /** Where reports go: the receiver's origin on the loopback interface. */
  readonly receiver: string;
}

export interface FontNeed {
  readonly family: string;
  readonly weight: number;
  readonly italic: boolean;
}

export interface PlanReport {
  readonly instances: Readonly<Record<string, number>>;
  /** Occurrences printed as frames because their shape differs from their variant's main component. */
  readonly frames: readonly { readonly component: string; readonly key: string; readonly reason: string }[];
  /** The variant property the census derived from shape, by component: one for the kit to name (docs/redesign/FIGMA_PRINT.md §7). */
  readonly derived: Readonly<Record<string, string>>;
  /** Colours printed as measured values, with no token behind them. */
  readonly unbound: number;
  readonly approximated: readonly { readonly key: string; readonly what: string }[];
  readonly layouts: Readonly<Record<string, number>>;
  /** Frames left without auto layout because the measurement fit none: counts by reason and part. */
  readonly misses: Readonly<Record<string, number>>;
  /** Nodes Figma's layout, as modelled, puts more than the tolerance from their measured box: counts by print, parent layout and node. */
  readonly drift: Readonly<Record<string, number>>;
  /** Sizings Figma cannot hold as planned: counts by print, conflict and node. */
  readonly conflicts: Readonly<Record<string, number>>;
}

export interface PlanBundle {
  readonly protocol: number;
  readonly revision: string;
  /**
   * Whether the plan names every route at every viewport. A partial plan (a
   * `--routes` subset, or a route not measured) carries the library of the
   * routes it names only, so a print of it prunes nothing.
   */
  readonly complete: boolean;
  readonly stamp: { readonly commit: string; readonly buildId: string | null; readonly measuredAt: string; readonly base: string };
  readonly file: FileSpec;
  /** `press`, `bento` (the design print) and `bento-wire` (the wire print, keys `wire:<bento key>`). */
  readonly collections: readonly CollectionSpec[];
  readonly textStyles: readonly TextStyleSpec[];
  readonly effectStyles: readonly EffectStyleSpec[];
  /** In dependency order: a component comes after every component its main contains. */
  readonly components: readonly ComponentSpec[];
  readonly routes: readonly RouteSpec[];
  readonly fonts: readonly FontNeed[];
  readonly report: PlanReport;
}

/** What the plugin reports after a print (docs/redesign/FIGMA_PRINT.md §3.3), read by `check.mts`. */
export interface PrintReport {
  readonly protocol: number;
  /** The plan revision printed. */
  readonly revision: string;
  /** The printer's stamp: a digest of the plugin's main thread and settings as built. A unit prints again when it changes. */
  readonly printer: string;
  readonly fileKey: string | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly units: readonly {
    readonly kind: 'preflight' | 'variables' | 'styles' | 'component' | 'route';
    readonly key: string;
    readonly status: 'built' | 'unchanged' | 'failed';
    readonly ms: number;
  }[];
  /** Every keyed node as printed: its box relative to its route frame (or main component), and what it is. */
  readonly nodes: readonly {
    readonly key: string;
    readonly unit: string;
    readonly type: string;
    readonly box: Box;
    /** The variant key of an instance's main component. */
    readonly instanceOf?: string;
    /** The text style a text node carries, by plan key. */
    readonly textStyle?: string;
    /** Paints set as raw values, with no variable behind them. */
    readonly rawPaints?: number;
  }[];
  /**
   * The units whose purity the plugin read from the printed file in full: a
   * route frame by its key, a component by its key once every main of it was
   * found and read. A planned unit missing here was not read (F8).
   */
  readonly read: readonly string[];
  /**
   * Bindings to another collection than the unit's print's, read from the
   * printed file (F8): every node under a unit root, nested instance
   * sublayers, text segments and styles included, that binds such a variable
   * directly, the primitives included; `(missing)` for a variable the file lacks.
   */
  readonly impure: readonly { readonly unit: string; readonly node: string; readonly field: string; readonly collection: string }[];
  /** Layers a unit holds that only another print renders (RouteSpec.absent), read from the printed file (F8). */
  readonly strays: readonly { readonly unit: string; readonly node: string }[];
  /**
   * Layout the self-check replaced because a child missed its measured box,
   * and a main's nodes Figma's text metrics moved. A text the self-check held
   * at its measured height carries the height its lines took at its width
   * (`linesHeight`), which its box no longer shows.
   */
  readonly fallbacks: readonly { readonly key: string; readonly from: string; readonly to: string; readonly miss: number; readonly linesHeight?: number }[];
  readonly missingFonts: readonly FontNeed[];
  readonly errors: readonly { readonly key: string; readonly message: string }[];
}
