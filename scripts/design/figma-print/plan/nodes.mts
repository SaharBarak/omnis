/**
 * Elements to layers (docs/redesign/FIGMA_PRINT.md §§4–5): one measured element
 * becomes a frame, a text layer or a drawing, with its paints bound to
 * variables and its children laid out right to left. A page is planned once
 * per print, from that print alone (§6): what it does not render is not
 * printed, and its paints bind its own print's variables.
 *
 * Auto layout is written only where it lands every child on its measured box;
 * anywhere else the frame keeps its children at their measured offsets. The
 * measured geometry is the authority, so a right-to-left page cannot come out
 * mirrored.
 */
import { CONFIG } from '../config.mjs';
import { color, gradientArgumentsOf, gradients, hexOf, isClear, isFlat, matrixOf, meanOf, px, shadows, splitTop } from './css.mts';
import { isText, type RawBinding, type RawElement, type RawKid, type RawPrintNode, type RawProjection, type RawShape, type RawText } from './raw.mts';
import type { Align, Bound, Box, ColorRef, Constraint, EffectSpec, FrameSpec, GridTrack, LayoutSpec, NodeSpec, PaintSpec, Rgba, Sizing, SvgSpec, TextRun, TextSpec, VariableScope, ViewportName } from './schema.mts';
import type { EffectStyles } from './effects.mts';
import type { Binder } from './tokens.mts';
import { type TextStyles, facesOf, sameType, strutted, typeOf } from './type.mts';

/** Geometry agreement, in px: a solved position within this of the measured one is the same position. */
export const FIT = 0.75;

type Style = Readonly<Record<string, string>>;
type Edges = readonly [number, number, number, number];
/** The linear part of a 2D transform, CSS order: a, b, c, d. */
type Linear = readonly [number, number, number, number];

export interface Notes {
  readonly approximated: { key: string; what: string }[];
  readonly layouts: Record<string, number>;
  /** Auto layouts the measurement did not fit, so their frames place children freely: by reason and part. */
  readonly misses: Record<string, number>;
}

export interface PageContext {
  /** The page as the print being planned renders it. */
  readonly page: RawProjection;
  readonly viewport: ViewportName;
  /** That print's binder: its values bind its own collection. */
  readonly vars: Binder;
  readonly type: TextStyles;
  readonly effects: EffectStyles;
  readonly faces: ReturnType<typeof facesOf>;
  readonly notes: Notes;
  /** Every planned element by its node key, for the component census. */
  readonly elements: Map<string, RawElement>;
  /** Every planned frame's content box and padding, for the component census's containers. */
  readonly frames: Map<string, FrameFacts>;
}

/** What a container component needs of the frame an occurrence printed. */
export interface FrameFacts {
  /** The content box, inside padding and borders, in the same space as the node's `abs`. */
  content: Box;
  readonly padding: () => readonly [Bound, Bound, Bound, Bound];
  readonly strokesIncluded: boolean;
}

/** What the print renders of one element: its node and its computed style. */
interface Facts {
  readonly node: RawPrintNode | undefined;
  readonly style: Style;
}

const EMPTY: Style = {};

/**
 * The box properties of an anonymous box at their initial values: CSS wraps
 * contiguous text in one, which inherits the parent's text properties and
 * none of its offsets, margins, transform or self-alignment.
 */
const ANONYMOUS: Style = {
  position: 'static',
  ...Object.fromEntries(['top', 'right', 'bottom', 'left'].map((side) => [side, 'auto'])),
  ...Object.fromEntries(['top', 'right', 'bottom', 'left'].flatMap((side) => [`margin-${side}`, `padding-${side}`, `border-${side}-width`].map((prop) => [prop, '0px']))),
  transform: 'none',
  float: 'none',
  'z-index': 'auto',
  'align-self': 'auto',
  'justify-self': 'auto',
  'flex-grow': '0',
  'flex-basis': 'auto',
  order: '0',
  ...Object.fromEntries(['grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end'].map((prop) => [prop, 'auto'])),
};
const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const;

/** What one print renders of an element, read off that print's projection. */
function factsIn(page: RawProjection, id: string): Facts {
  const node = page.nodes[id];
  return { node, style: node ? (page.styles[node.s] ?? EMPTY) : EMPTY };
}

const factsOf = (context: PageContext, id: string): Facts => factsIn(context.page, id);

/** Whether the print renders the element. */
const shown = (facts: Facts): boolean => facts.node !== undefined && !facts.node.none && facts.style['display'] !== 'none';

/** How the bundler spells a CSS-module class, tried in order (`CONFIG.classGrammars`). */
const CLASS_GRAMMARS: readonly RegExp[] = CONFIG.classGrammars.map((grammar) => new RegExp(grammar.pattern));

/** A class's CSS-module part, `module.local`, or null for a class no grammar spells (`wireframe-module__UNOcMW__sheet` is `wireframe.sheet`). */
export const partOfClass = (name: string): string | null => {
  for (const grammar of CLASS_GRAMMARS) {
    const match = grammar.exec(name);
    if (match) return `${match[1]}.${match[2]}`;
  }
  return null;
};

/** The CSS-module parts of a class list. */
export const partsOf = (classes: readonly string[]): string[] => classes.flatMap((name) => partOfClass(name) ?? []);

/** The first CSS-module part of a class list. */
export const partOf = (classes: readonly string[]): string | null => partsOf(classes)[0] ?? null;

export const localOf = (part: string | null | undefined): string | null => part?.split('.')[1] ?? null;

const hasPaint = (style: Style): boolean =>
  !isClear(color(style['background-color'] ?? '')) ||
  (style['background-image'] ?? 'none') !== 'none' ||
  (style['box-shadow'] ?? 'none') !== 'none' ||
  SIDES.some((side) => px(style[`border-${side}-width`]) > 0 && !/^(none|hidden)$/.test(style[`border-${side}-style`] ?? 'none'));

const isOutOfFlow = (style: Style): boolean => style['position'] === 'absolute' || style['position'] === 'fixed';

export const rel = (box: Box, origin: Box): Box => [box[0] - origin[0], box[1] - origin[1], box[2], box[3]];

const unionOf = (boxes: readonly Box[]): Box => {
  const x0 = Math.min(...boxes.map((box) => box[0]));
  const y0 = Math.min(...boxes.map((box) => box[1]));
  const x1 = Math.max(...boxes.map((box) => box[0] + box[2]));
  const y1 = Math.max(...boxes.map((box) => box[1] + box[3]));
  return [x0, y0, x1 - x0, y1 - y0];
};

export const near = (a: number, b: number): boolean => Math.abs(a - b) <= FIT;

/** A short, stable hash of a string, for keys built from data. */
export function hashOf(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const cssOf = (rgba: Rgba): string => `rgba(${Math.round(rgba[0] * 255)}, ${Math.round(rgba[1] * 255)}, ${Math.round(rgba[2] * 255)}, ${rgba[3]})`;

const insetOf = (style: Style, kind: 'padding' | 'border'): Edges =>
  SIDES.map((side) => (kind === 'padding' ? px(style[`padding-${side}`]) : /^(none|hidden)$/.test(style[`border-${side}-style`] ?? 'none') ? 0 : px(style[`border-${side}-width`]))) as unknown as Edges;

/** The content box of an element: its border box less borders and padding. */
function contentOf(style: Style, box: Box): Box {
  const padding = insetOf(style, 'padding');
  const border = insetOf(style, 'border');
  return [box[0] + padding[3] + border[3], box[1] + padding[0] + border[0], box[2] - padding[1] - padding[3] - border[1] - border[3], box[3] - padding[0] - padding[2] - border[0] - border[2]];
}

// ---------------------------------------------------------------- bindings

const bindingOf = (facts: Facts, prop: string): RawBinding | undefined => facts.node?.bind?.[prop];

/** A colour as the element's declaration authored it, bound where a token holds it; `computed` is the property's value unless given. */
function measuredColor(context: PageContext, facts: Facts, prop: string, scope: VariableScope, computed = facts.style[prop] ?? ''): ColorRef {
  return context.vars.color({ kind: 'color', computed, binding: bindingOf(facts, prop), viewport: context.viewport, scope });
}

function measuredFloat(context: PageContext, facts: Facts, prop: string, scope: VariableScope): Bound {
  return context.vars.float({ kind: 'float', computed: facts.style[prop] ?? '0', binding: bindingOf(facts, prop), viewport: context.viewport, scope });
}

// ---------------------------------------------------------------- paints

interface Paints {
  readonly fills: PaintSpec[];
  readonly strokes: PaintSpec[];
  readonly strokeWeights?: readonly [Bound, Bound, Bound, Bound];
  readonly strokeAlign?: 'INSIDE' | 'OUTSIDE';
  readonly dash?: readonly number[];
  readonly effects: EffectSpec[];
  readonly effectStyle?: string;
  readonly radii?: readonly [Bound, Bound, Bound, Bound];
}

/**
 * The shadow token a box draws all its shadows through: its declaration is
 * the token alone and the token's value on the stage is the shadow measured.
 */
function shadowTokenOf(context: PageContext, facts: Facts): string | undefined {
  const measured = facts.style['box-shadow'] ?? 'none';
  const token = /^var\(\s*(--[\w-]+)\s*\)$/.exec(bindingOf(facts, 'box-shadow')?.value.trim() ?? '')?.[1];
  const value = token ? context.page.tokens[token] : undefined;
  if (measured === 'none' || !token || value === undefined) return undefined;
  const [left, right] = [shadows(value), shadows(measured)];
  const same = left.length === right.length && left.every((one, at) => {
    const other = right[at]!;
    return one.inset === other.inset && one.x === other.x && one.y === other.y && one.blur === other.blur && one.spread === other.spread && hexOf(one.color) === hexOf(other.color);
  });
  return same ? token : undefined;
}

/** The custom properties a declared value names, one chain each, in the order the cascade read gives their chains (cascade.mjs). */
const VAR = /var\(\s*--[\w-]+/g;

/** A gradient's first argument when it is its direction or shape, not a stop. */
const GRADIENT_LINE = /^(to\s|[-+\d.]+(deg|rad|grad|turn)\b|circle\b|ellipse\b|closest-|farthest-|at\s)/i;

/**
 * A background's declared stops per gradient layer, each its own binding:
 * the stop's colour without its positions, and its share of the background's
 * chains, one per `var()` in declaration order. Empty where it declares none.
 */
function declaredStopsOf(binding: RawBinding | undefined): readonly (readonly RawBinding[])[] {
  if (!binding) return [];
  let at = 0;
  return gradientArgumentsOf(binding.value).map((args) =>
    args.flatMap((arg, index) => {
      const count = [...arg.matchAll(VAR)].length;
      const chains = binding.chains.slice(at, at + count);
      at += count;
      const text = arg.trim();
      return index === 0 && GRADIENT_LINE.test(text) ? [] : [{ value: splitTop(text, ' ')[0] ?? text, chains }];
    })
  );
}

/**
 * The colour of one gradient stop, bound as the stop declared it: first
 * through the declared stop at its place (a repeating gradient's later
 * periods repeat its declared stops), then through any other the background
 * declares, so a tinted stop reads its own mix and two stops of one colour
 * keep their own tokens.
 */
function stopColor(context: PageContext, declared: readonly (readonly RawBinding[])[], layer: number, stop: number, rgba: Rgba): ColorRef {
  if (rgba[3] <= 0) return { rgba };
  const stops = declared[layer] ?? [];
  const placed = stops.length > 0 ? stops[stop % stops.length] : undefined;
  for (const binding of [...(placed ? [placed] : []), ...declared.flat().filter((other) => other !== placed)]) {
    const ref = context.vars.color({ kind: 'color', computed: cssOf(rgba), binding, viewport: context.viewport, scope: 'FRAME_FILL' });
    if (ref.variable) return ref;
  }
  return { rgba };
}

function gradientPaints(context: PageContext, facts: Facts, box: Box, key: string): PaintSpec[] {
  const { style } = facts;
  const { layers, unread } = gradients(style['background-image'] ?? 'none', box[2], box[3], style['background-size'], style['background-repeat']);
  const declared = declaredStopsOf(bindingOf(facts, 'background-image'));
  for (const one of new Set(unread)) context.notes.approximated.push({ key, what: `background not read: ${one}` });
  const paints = layers.map((layer, layerAt): PaintSpec => {
    if (layer.tile || isFlat(layer)) {
      // A tiled pattern Figma cannot repeat, or a gradient of one colour: its mean colour, flat.
      if (layer.tile) context.notes.approximated.push({ key, what: `a ${layer.tile[0]}x${layer.tile[1]} px pattern printed as its mean tint` });
      return { type: 'SOLID', color: { rgba: layer.tile ? meanOf(layer) : layer.stops[0]!.color } };
    }
    return { type: layer.kind === 'linear' ? 'GRADIENT_LINEAR' : 'GRADIENT_RADIAL', stops: layer.stops.map((stop, stopAt) => ({ at: stop.at, color: stopColor(context, declared, layerAt, stopAt, stop.color) })), transform: layer.transform };
  });
  // CSS lists the top layer first; Figma paints the last fill on top.
  return paints.reverse();
}

const sideWidth = (style: Style, side: (typeof SIDES)[number]): number => (/^(none|hidden)$/.test(style[`border-${side}-style`] ?? 'none') ? 0 : px(style[`border-${side}-width`]));

/** A used corner radius: a percentage resolves against the shorter side, an elliptical pair takes its smaller radius. */
const radiusOf = (value: string | undefined, w: number, h: number): number =>
  Math.min(
    ...(value ?? '0')
      .trim()
      .split(/\s+/)
      .map((token, axis) => (token.endsWith('%') ? (Number.parseFloat(token) / 100) * (axis === 0 ? w : h) : px(token)))
  );

function radiiOf(context: PageContext, facts: Facts, box: Box): Paints['radii'] {
  const [, , w, h] = box;
  const raw = CORNERS.map((corner) => radiusOf(facts.style[`border-${corner}-radius`], w, h));
  if (raw.every((radius) => radius <= 0)) return undefined;
  // CSS scales every radius down when two on one side overlap.
  const [tl, tr, br, bl] = raw as unknown as Edges;
  const scale = Math.min(1, ...[w / (tl + tr), w / (bl + br), h / (tl + bl), h / (tr + br)].filter(Number.isFinite));
  const cap = Math.min(w, h) / 2;
  return CORNERS.map((corner, at) => {
    const used = raw[at]! * scale;
    const bound = measuredFloat(context, facts, `border-${corner}-radius`, 'CORNER_RADIUS');
    // A bound token keeps its own value when Figma's clamp to half the shorter side lands where CSS did.
    if (bound.variable && Math.abs(Math.min(bound.value, cap) - used) < 0.01) return bound;
    return { value: used };
  }) as unknown as readonly [Bound, Bound, Bound, Bound];
}

function paintsOf(context: PageContext, facts: Facts, box: Box, key: string): Paints {
  const { style } = facts;
  const fills: PaintSpec[] = [];
  const strokes: PaintSpec[] = [];
  const effects: EffectSpec[] = [];

  if (!isClear(color(style['background-color'] ?? ''))) fills.push({ type: 'SOLID', color: measuredColor(context, facts, 'background-color', 'FRAME_FILL') });
  fills.push(...gradientPaints(context, facts, box, key));

  // Borders: one stroke with a weight per side, coloured as the first side that has one.
  let strokeWeights: Paints['strokeWeights'];
  let strokeAlign: Paints['strokeAlign'];
  let dash: Paints['dash'];
  const side = SIDES.find((one) => sideWidth(style, one) > 0);
  if (side) {
    strokes.push({ type: 'SOLID', color: measuredColor(context, facts, `border-${side}-color`, 'STROKE_COLOR') });
    strokeWeights = SIDES.map((one) => ({ value: sideWidth(style, one) })) as unknown as readonly [Bound, Bound, Bound, Bound];
    strokeAlign = 'INSIDE';
    const kind = style[`border-${side}-style`];
    const weight = sideWidth(style, side);
    if (kind === 'dashed') dash = [weight * 3, weight * 3];
    if (kind === 'dotted') dash = [weight, weight];
  }

  // Shadows: a ring (no offset, no blur) is a stroke when the box has no border; the rest are effects.
  const cast = shadows(style['box-shadow'] ?? 'none');
  for (const shape of cast) {
    const ref = measuredColor(context, facts, 'box-shadow', 'EFFECT_COLOR', cssOf(shape.color));
    const ring = shape.x === 0 && shape.y === 0 && shape.blur === 0 && shape.spread > 0;
    if (ring && strokes.length === 0) {
      strokes.push({ type: 'SOLID', color: ref });
      strokeWeights = [{ value: shape.spread }, { value: shape.spread }, { value: shape.spread }, { value: shape.spread }];
      strokeAlign = shape.inset ? 'INSIDE' : 'OUTSIDE';
    } else {
      effects.push({ type: shape.inset ? 'INNER_SHADOW' : 'DROP_SHADOW', color: ref, offset: [shape.x, shape.y], radius: shape.blur, spread: shape.spread });
    }
  }

  // A box drawing all its shadows through one shadow token takes the token's effect style.
  const token = effects.length > 0 && effects.length === cast.length ? shadowTokenOf(context, facts) : undefined;
  const radii = radiiOf(context, facts, box);
  return {
    fills,
    strokes,
    effects,
    ...(token ? { effectStyle: context.effects.use(token, effects, context.viewport, context.page.print) } : {}),
    ...(strokeWeights ? { strokeWeights } : {}),
    ...(strokeAlign ? { strokeAlign } : {}),
    ...(dash ? { dash } : {}),
    ...(radii ? { radii } : {}),
  };
}

const paintsSomething = (paints: Paints): boolean => paints.fills.length + paints.strokes.length + paints.effects.length > 0;

/**
 * Whether the frame's stroke takes layout space: a border does, as CSS lays
 * it out; a ring drawn from a box-shadow, the wire print's edge, does not.
 */
const strokesInLayout = (facts: Facts): boolean => insetOf(facts.style, 'border').some((width) => width > 0);

// ---------------------------------------------------------------- text

const RTL_MARK = '‏';
const STRONG_RTL = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/;
const STRONG_LTR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;

interface Directed {
  readonly text: string;
  /** Where a character of the plain text sits in the marked one. */
  readonly at: (index: number) => number;
}

/**
 * Figma takes a paragraph's direction from its first strong character, CSS
 * from the box. In a right-to-left box every paragraph that does not open with
 * a right-to-left letter gets a right-to-left mark, so it lays out the way Chrome did.
 */
function directed(text: string, rtl: boolean): Directed {
  if (!rtl) return { text, at: (index) => index };
  const marks: number[] = [];
  let out = '';
  let offset = 0;
  const paragraphs = text.split('\n');
  paragraphs.forEach((paragraph, index) => {
    const first = [...paragraph].find((character) => STRONG_RTL.test(character) || STRONG_LTR.test(character));
    if (paragraph.length > 0 && !(first && STRONG_RTL.test(first))) {
      marks.push(offset);
      out += RTL_MARK;
    }
    out += paragraph;
    if (index < paragraphs.length - 1) out += '\n';
    offset += paragraph.length + 1;
  });
  return { text: out, at: (index) => index + marks.filter((mark) => mark <= index).length };
}

function alignOf(style: Style): TextSpec['align'] {
  const rtl = style['direction'] === 'rtl';
  switch (style['text-align']) {
    case 'center':
    case '-webkit-center':
      return 'CENTER';
    case 'justify':
      return 'JUSTIFIED';
    case 'left':
    case '-webkit-left':
      return 'LEFT';
    case 'right':
    case '-webkit-right':
      return 'RIGHT';
    case 'end':
      return rtl ? 'LEFT' : 'RIGHT';
    default:
      return rtl ? 'RIGHT' : 'LEFT';
  }
}

/** Joins text the way CSS collapses white space, keeping each piece's offsets. */
class Characters {
  text = '';
  private readonly pre: boolean;
  constructor(pre: boolean) {
    this.pre = pre;
  }
  add(raw: string): readonly [number, number] {
    const start = this.text.length;
    if (this.pre) this.text += raw;
    else {
      const collapsed = raw.replace(/\s+/g, ' ');
      this.text += this.text.endsWith(' ') || this.text.endsWith('\n') || this.text === '' ? collapsed.replace(/^ /, '') : collapsed;
    }
    return [start, this.text.length];
  }
  newline(): void {
    this.text = `${this.text.replace(/ $/, '')}\n`;
  }
}

/** Line boxes from text fragment rects: fragments whose heights mostly overlap share a line. */
function linesOf(rects: readonly Box[]): Box[] {
  const lines: Box[] = [];
  for (const rect of [...rects].filter((one) => one[3] > 0).sort((a, b) => a[1] - b[1])) {
    const last = lines[lines.length - 1];
    if (last) {
      const overlap = Math.min(last[1] + last[3], rect[1] + rect[3]) - Math.max(last[1], rect[1]);
      if (overlap >= Math.min(last[3], rect[3]) / 2) {
        lines[lines.length - 1] = unionOf([last, rect]);
        continue;
      }
    }
    lines.push(rect);
  }
  return lines;
}

/** An element whose content is text and inline text, which one text layer carries. */
function isInlineText(context: PageContext, element: RawElement): boolean {
  if (element.tag === 'svg' || element.tag === 'img' || element.tag === 'canvas' || element.field) return false;
  const facts = factsOf(context, element.id);
  if (!shown(facts)) return true;
  if ((facts.style['display'] ?? 'inline') !== 'inline' && element.tag !== 'br') return false;
  if (isOutOfFlow(facts.style)) return false;
  return (element.kids ?? []).every((kid) => isText(kid) || isInlineText(context, kid));
}

interface TextBuild {
  readonly spec: TextSpec;
  /** Inline boxes that paint (a headline chip), printed behind the text. */
  readonly behind: readonly FrameSpec[];
}

/**
 * One text layer for an inline formatting context. `block` is the owner's
 * content box when the text is all the owner holds; the layer then takes that
 * box exactly. `span` is the left and right edge an anonymous box spans in
 * its formatting context (a block's content width, the free space a wrapped
 * flex item shrank to); the layer takes its lines at that width. Otherwise
 * the layer takes its line boxes.
 */
function textOf(context: PageContext, owner: RawElement, kids: readonly RawKid[], block: Box | null, key: string, part: string | null, span: readonly [number, number] | null = null): TextBuild | null {
  const ownerFacts = factsOf(context, owner.id);
  const { style } = ownerFacts;
  const whiteSpace = style['white-space'] ?? 'normal';
  const characters = new Characters(/^(pre|pre-wrap|break-spaces)$/.test(whiteSpace));
  const runs: TextRun[] = [];
  const rects: Box[] = [];
  /** Where each glyph rect's line box starts, when the measure probed its face. */
  const starts = new Map<Box, number>();
  const behind: FrameSpec[] = [];
  const local = localOf(part);
  const baseType = typeOf(style, context.faces, ownerFacts.node?.face);
  const fontSize = measuredFloat(context, ownerFacts, 'font-size', 'FONT_SIZE').variable;
  const baseStyle = context.type.use(baseType, local, context.viewport, fontSize);
  const baseFill = measuredColor(context, ownerFacts, 'color', 'TEXT_FILL');
  // Each inline element under the text in tree order, whichever print paints it: its boxes' keys, alike in both prints.
  const inline = new Map<RawElement, number>();
  const number = (kid: RawKid): void => {
    if (isText(kid)) return;
    inline.set(kid, inline.size);
    for (const inner of kid.kids ?? []) number(inner);
  };
  for (const kid of kids) number(kid);

  const visit = (kid: RawKid, facts: Facts, kidPart: string | null, own: boolean): void => {
    if (isText(kid)) {
      const [start, end] = characters.add(kid.text);
      rects.push(...kid.lines);
      if (kid.lead !== undefined) for (const rect of kid.lines) starts.set(rect, rect[1] - kid.lead);
      if (!own && end > start) {
        // A run of the owner's type takes the owner's style, its size binding with it.
        const runType = strutted(typeOf(facts.style, context.faces, facts.node?.face), baseType);
        const runStyle = context.type.use(runType, localOf(kidPart), context.viewport, sameType(runType, baseType) ? fontSize : undefined);
        const fill = measuredColor(context, facts, 'color', 'TEXT_FILL');
        const sameStyle = runStyle === baseStyle;
        const sameFill = fill.variable === baseFill.variable && hexOf(fill.rgba) === hexOf(baseFill.rgba);
        if (!sameStyle || !sameFill) runs.push({ start, end, ...(sameStyle ? {} : { style: runStyle }), ...(sameFill ? {} : { fills: [{ type: 'SOLID', color: fill }] }) });
      }
      return;
    }
    if (kid.tag === 'br') {
      characters.newline();
      return;
    }
    const kidFacts = factsOf(context, kid.id);
    if (!shown(kidFacts)) return;
    const innerPart = partOf(kid.cls) ?? kidPart;
    if (hasPaint(kidFacts.style)) {
      // An inline box that paints: one rect per line it spans, padded, behind the text.
      const fragments = linesOf((kid.kids ?? []).flatMap((inner) => (isText(inner) ? inner.lines : [])));
      const [pt, pr, pb, pl] = insetOf(kidFacts.style, 'padding');
      for (const [at, fragment] of fragments.entries()) {
        const box: Box = [fragment[0] - pl, fragment[1] - pt, fragment[2] + pl + pr, fragment[3] + pt + pb];
        const boxKey = `${key}/box#${inline.get(kid)}${at > 0 ? `.${at}` : ''}`;
        behind.push({
          type: 'FRAME',
          key: boxKey,
          name: localOf(innerPart) ?? 'inline',
          box,
          abs: box,
          sizing: { h: 'FIXED', v: 'FIXED' },
          layout: { mode: 'NONE' },
          ...paintsOf(context, kidFacts, box, boxKey),
          clips: false,
          children: [],
          ...(innerPart ? { part: innerPart } : {}),
        });
      }
    }
    for (const inner of kid.kids ?? []) visit(inner, kidFacts, innerPart, false);
  };
  for (const kid of kids) visit(kid, ownerFacts, part, true);

  const lead = characters.text.length - characters.text.replace(/^\s+/, '').length;
  const plain = characters.text.trim();
  if (plain === '' || rects.length === 0) return null;
  const lines = linesOf(rects);
  const lineCount = lines.length;
  const lineHeight = baseType.lineHeight ?? baseType.size * 1.2;
  const ink = unionOf(lines);
  const first = lines[0]!;
  const nowrap = /^(nowrap|pre)$/.test(whiteSpace);
  const clamp = style['-webkit-line-clamp'] && style['-webkit-line-clamp'] !== 'none' ? Number(style['-webkit-line-clamp']) : null;
  const ellipsis = style['text-overflow'] === 'ellipsis' && nowrap;
  const align = alignOf(style);
  // The first line box starts where the earliest of its fragments' line boxes does: measured, or half the leading above the glyphs.
  const fragments = rects.filter((rect) => rect[1] >= first[1] - FIT && rect[1] + rect[3] <= first[1] + first[3] + FIT);
  const top = Math.min(...fragments.map((rect) => starts.get(rect) ?? rect[1] - (lineHeight - rect[3]) / 2));
  const height = lineCount * lineHeight;

  let box: Box;
  let resize: TextSpec['resize'];
  let minHeight: number | undefined;
  // A box that shrinks to its one line hugs it; a wider box keeps its width and its alignment holds the edge.
  const tight = block !== null && block[2] - ink[2] <= Math.max(2, ink[2] * 0.02);
  // An ellipsis cuts only a line wider than its box; a line that fits is as wide as it reads.
  const truncated = ellipsis && (block === null || ink[2] > block[2] + FIT);
  if (truncated) {
    box = block ?? (span ? [span[0], top, span[1] - span[0], lineHeight] : [ink[0], top, ink[2], lineHeight]);
    resize = 'HEIGHT';
  } else if (block && lineCount === 1 && (nowrap || tight)) {
    box = [block[0], block[1], block[2], block[3]];
    resize = 'WIDTH_AND_HEIGHT';
  } else if (block) {
    box = block;
    resize = 'HEIGHT';
    // A box CSS holds taller than its lines keeps that height only as a minimum: it still grows with more lines.
    if (px(style['min-height']) > 0 && block[3] > height + FIT) minHeight = block[3];
  } else if (span) {
    box = [span[0], top, span[1] - span[0], height];
    resize = 'HEIGHT';
  } else if (lineCount === 1) {
    box = [ink[0], top, ink[2], height];
    resize = 'WIDTH_AND_HEIGHT';
  } else {
    // Wrapped text with no box of its own: its lines, with slack on the side its alignment leaves free.
    const slack = Math.max(2, ink[2] * 0.02);
    const x = align === 'RIGHT' ? ink[0] - slack : align === 'CENTER' ? ink[0] - slack / 2 : ink[0];
    box = [x, top, ink[2] + slack, height];
    resize = 'HEIGHT';
  }

  const rtl = style['direction'] === 'rtl';
  const marked = directed(plain, rtl);
  const characterRuns = runs
    .map((run) => ({ ...run, start: Math.max(0, run.start - lead), end: Math.min(plain.length, run.end - lead) }))
    .filter((run) => run.end > run.start)
    .map((run) => ({ ...run, start: marked.at(run.start), end: marked.at(run.end - 1) + 1 }));
  const maxLines = truncated ? 1 : clamp;
  const spec: TextSpec = {
    type: 'TEXT',
    key,
    name: local ?? plain.slice(0, 40),
    box,
    abs: box,
    sizing: { h: resize === 'WIDTH_AND_HEIGHT' ? 'HUG' : 'FIXED', v: 'HUG' },
    characters: marked.text,
    style: baseStyle,
    fills: [{ type: 'SOLID', color: baseFill }],
    align,
    resize,
    lines: lineCount,
    ...(characterRuns.length > 0 ? { runs: characterRuns } : {}),
    ...(maxLines ? { maxLines } : {}),
    ...(minHeight === undefined ? {} : { minHeight }),
    ...(part ? { part } : {}),
  };
  return { spec, behind };
}

// ---------------------------------------------------------------- layout

type Side = (typeof SIDES)[number];

interface Placed {
  readonly spec: NodeSpec;
  readonly style: Style;
  readonly flow: boolean;
  /** The sides its margin is declared `auto` on. */
  readonly autos?: readonly Side[];
  /** Its other margins, top, right, bottom, left: the space its margin box adds around its box. */
  readonly margins?: readonly [number, number, number, number];
  /** Its grid placement holds for the grid laying it out: it is the grid's own child. */
  readonly placed?: true;
  /** The sides a positioned item's inset is declared on; none for an item that is not positioned. */
  readonly anchors?: readonly Side[];
  /** CSS paint layer: -1 negative z, 0 behind in-flow content, 1 in flow, 2 positioned, 3 positive z. */
  readonly layer: number;
  readonly z: number;
  /** Tree order. */
  readonly order: number;
}

interface Laid {
  readonly layout: LayoutSpec;
  readonly children: NodeSpec[];
  readonly sizing: { readonly h: FrameSpec['sizing']['h']; readonly v: FrameSpec['sizing']['v'] };
}

const byPaint = (a: Placed, b: Placed): number => a.layer - b.layer || a.z - b.z || a.order - b.order;

/** How far a relative offset or a translation moved a box from where layout put it, in px. */
function shiftOf(style: Style): readonly [number, number] {
  const offset = (start: string, end: string): number => {
    const a = style[start] ?? 'auto';
    const b = style[end] ?? 'auto';
    return a !== 'auto' ? px(a) : b !== 'auto' ? -px(b) : 0;
  };
  const relative = (style['position'] ?? 'static') === 'relative' ? [offset('left', 'right'), offset('top', 'bottom')] : [0, 0];
  const matrix = matrixOf(style['transform'] ?? 'none');
  const translates = matrix !== null && matrix[0] === 1 && matrix[1] === 0 && matrix[2] === 0 && matrix[3] === 1;
  return [relative[0]! + (translates ? matrix[4] : 0), relative[1]! + (translates ? matrix[5] : 0)];
}

/** An item's margins, top, right, bottom, left, with its `auto` sides left to the line. */
const marginsIn = (style: Style, autos: readonly Side[]): readonly [number, number, number, number] =>
  SIDES.map((side) => (autos.includes(side) ? 0 : px(style[`margin-${side}`]))) as unknown as readonly [number, number, number, number];

/** The sides an element's margin is declared `auto` on. */
const autoMarginsOf = (context: PageContext, element: RawElement): Side[] => SIDES.filter((side) => factsOf(context, element.id).node?.keywords?.[`margin-${side}`] === 'auto');

/** The sides an element's inset is declared on. */
const anchorsOf = (context: PageContext, element: RawElement, style: Style): Side[] => anchorsIn(style, factsOf(context, element.id).node?.keywords);

/** Notes why the children did not fit an auto layout, and gives that layout up. */
const miss = (context: PageContext, reason: string, hint: string): null => {
  const key = `${reason} · ${hint}`;
  context.notes.misses[key] = (context.notes.misses[key] ?? 0) + 1;
  return null;
};

/**
 * A positioned item's constraints (CSS Position 3 §3.1): anchored to each side
 * its inset is declared on, stretched between two, and with neither, held at
 * its static position's start, the right in right-to-left.
 */
function constraintsOf(anchors: readonly Side[], rtl: boolean): { readonly h: Constraint; readonly v: Constraint } {
  const set = (side: Side): boolean => anchors.includes(side);
  const h: Constraint = set('left') && set('right') ? 'STRETCH' : set('right') ? 'MAX' : set('left') ? 'MIN' : rtl ? 'MAX' : 'MIN';
  const v: Constraint = set('top') && set('bottom') ? 'STRETCH' : set('bottom') ? 'MAX' : 'MIN';
  return { h, v };
}

/**
 * A child placed in its parent: its box relative to the parent, and the
 * sizing the parent's layout gives it. A text its parent stretches wraps at
 * the parent's width; one that hugs is as wide as its line.
 */
function withBox(spec: NodeSpec, box: Box, extra?: Partial<Pick<NodeSpec, 'sizing' | 'grid' | 'absolute'>>): NodeSpec {
  const placed = { ...spec, box, ...extra } as NodeSpec;
  if (placed.type !== 'TEXT' || !extra?.sizing || placed.resize === 'NONE') return placed;
  if (placed.sizing.h === 'FILL') return { ...placed, resize: 'HEIGHT' };
  return placed;
}

const absoluteOf = (item: Placed, origin: Box, rtl: boolean): NodeSpec => withBox(item.spec, rel(item.spec.abs, origin), { absolute: constraintsOf(item.anchors ?? [], rtl) });

/**
 * The sides a positioned box's inset is declared on. Chrome resolves every
 * inset of a positioned box to px, so the measure records the `auto` ones; a
 * tree without that record anchors every side, as its px insets say.
 */
const anchorsIn = (style: Style, keywords: Readonly<Record<string, string>> | undefined): Side[] =>
  (style['position'] ?? 'static') === 'static' ? [] : SIDES.filter((side) => keywords?.[side] !== 'auto');

/** Where layout put an item's margin box, before a relative offset or a translation moved the item. */
function marginBoxOf(item: Placed): Box {
  const [mt, mr, mb, ml] = item.margins ?? [0, 0, 0, 0];
  const [dx, dy] = shiftOf(item.style);
  const [x, y, w, h] = item.spec.abs;
  return [x - dx - ml, y - dy - mt, w + ml + mr, h + mt + mb];
}

/**
 * An item in its parent's flow by its margin box, as Figma has no margins: a
 * positive margin is padding in a frame its margin box wide, and a negative
 * one, or an offset that moved the item, is a frame holding its place with the
 * item at its own box inside, so the item moves with its place. `outer` sizes
 * that frame in the parent; `inner` sizes the item in the frame, or in the
 * parent with none.
 */
function inMarginBox(
  item: Placed,
  origin: Box,
  rtl: boolean,
  mode: 'HORIZONTAL' | 'VERTICAL',
  outer: FrameSpec['sizing'],
  inner: NodeSpec['sizing'],
  grid?: NodeSpec['grid']
): NodeSpec {
  const [mt, mr, mb, ml] = item.margins ?? [0, 0, 0, 0];
  const [dx, dy] = shiftOf(item.style);
  const margin = marginBoxOf(item);
  const frame = (suffix: string, name: string, sizing: FrameSpec['sizing'], layout: LayoutSpec, children: NodeSpec[]): FrameSpec => ({
    type: 'FRAME',
    key: `${item.spec.key}/${suffix}`,
    name,
    box: rel(margin, origin),
    abs: margin,
    sizing,
    ...(grid ? { grid } : {}),
    layout,
    fills: [],
    strokes: [],
    clips: false,
    children,
  });
  if (mt < 0 || mr < 0 || mb < 0 || ml < 0 || dx !== 0 || dy !== 0) {
    // A frame without auto layout neither hugs nor fills what it holds: the place keeps the measured size, and so does
    // the item in it.
    const fixed = (sizing: Sizing): Sizing => (sizing === 'HUG' ? 'FIXED' : sizing);
    const own = { h: inner.h === 'FILL' ? 'FIXED' : inner.h, v: inner.v === 'FILL' ? 'FIXED' : inner.v } as const;
    // The place resizes only along an axis the item fills, and the item resizes with it there.
    const along = (sizing: Sizing, start: Constraint): Constraint => (sizing === 'FILL' ? 'STRETCH' : start);
    const held = withBox(item.spec, rel(item.spec.abs, margin), { sizing: own, absolute: { h: along(inner.h, rtl ? 'MAX' : 'MIN'), v: along(inner.v, 'MIN') } });
    return frame('place', 'margin box', { h: fixed(outer.h), v: fixed(outer.v) }, { mode: 'NONE' }, [held]);
  }
  if (mt > 0 || mr > 0 || mb > 0 || ml > 0) {
    const layout: LayoutSpec = { mode, padding: [{ value: mt }, { value: mr }, { value: mb }, { value: ml }], gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: false, reverseZ: false };
    return frame('margin', 'margin', outer, layout, [withBox(item.spec, rel(item.spec.abs, margin), { sizing: inner })]);
  }
  return withBox(item.spec, rel(item.spec.abs, origin), { sizing: inner, ...(grid ? { grid } : {}) });
}

/** An alignment value without its overflow keyword, and whether that keyword was `safe`. */
function overflowSafe(value: string): readonly [string, boolean] {
  const match = /^(safe|unsafe)\s+(.+)$/.exec(value.trim());
  return match ? [match[2]!, match[1] === 'safe'] : [value, false];
}

/** What paints past a layer's own box, top, right, bottom, left: a drop shadow, a stroke outside it, a glyph past its line. */
function outsetOf(spec: NodeSpec): readonly [number, number, number, number] {
  if (spec.type === 'TEXT') {
    const reach = (spec.box[3] / Math.max(1, spec.lines)) * CONFIG.figma.textOverhang;
    return [reach, reach, reach, reach];
  }
  if (spec.type !== 'FRAME') return [0, 0, 0, 0];
  const share = spec.strokes.length === 0 ? 0 : spec.strokeAlign === 'OUTSIDE' ? 1 : spec.strokeAlign === 'CENTER' ? 0.5 : 0;
  const stroke = (spec.strokeWeights ?? []).map((weight) => weight.value * share);
  const shadows = (spec.effects ?? []).filter((effect) => effect.type === 'DROP_SHADOW');
  const cast = (side: number, toward: (effect: EffectSpec) => number): number => Math.max(stroke[side] ?? 0, ...shadows.map((effect) => Math.max(0, effect.radius + effect.spread + toward(effect))));
  return [cast(0, (effect) => -effect.offset[1]), cast(1, (effect) => effect.offset[0]), cast(2, (effect) => effect.offset[1]), cast(3, (effect) => -effect.offset[0])];
}

/**
 * Where a layer can paint, as far as the plan knows: its box and its
 * descendants', each grown by what paints past it. A clipping frame holds its
 * descendants to its box, and an inline drawing clips to its own.
 */
function inkOf(spec: NodeSpec): Box {
  const [top, right, bottom, left] = outsetOf(spec);
  let x0 = spec.abs[0] - left;
  let y0 = spec.abs[1] - top;
  let x1 = spec.abs[0] + spec.abs[2] + right;
  let y1 = spec.abs[1] + spec.abs[3] + bottom;
  if (spec.type === 'FRAME' && !spec.clips) {
    for (const child of spec.children) {
      const [x, y, w, h] = inkOf(child);
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + w), Math.max(y1, y + h)];
    }
  }
  return [x0, y0, x1 - x0, y1 - y0];
}

/** Whether any two of a set of boxes overlap by more than the layout tolerance. */
const anyMeet = (boxes: readonly Box[]): boolean =>
  boxes.some((a, at) => boxes.slice(at + 1).some((b) => a[0] < b[0] + b[2] - FIT && b[0] < a[0] + a[2] - FIT && a[1] < b[1] + b[3] - FIT && b[1] < a[1] + a[3] - FIT));

/**
 * The child list of an auto layout frame: in-flow children in their physical
 * order, the rest placed by paint order around them. With `reverseZ` the
 * first child paints on top, so the list runs top to bottom.
 */
function stackOrder(flow: readonly NodeSpec[], others: readonly Placed[], origin: Box, rtl: boolean, reverseZ: boolean): NodeSpec[] {
  const below = others.filter((item) => item.layer < 1).sort(byPaint).map((item) => absoluteOf(item, origin, rtl));
  const above = others.filter((item) => item.layer >= 1).sort(byPaint).map((item) => absoluteOf(item, origin, rtl));
  return reverseZ ? [...above.reverse(), ...flow, ...below.reverse()] : [...below, ...flow, ...above];
}

/** The children as a frame without auto layout: every child at its measured offset, in paint order. */
function free(placed: readonly Placed[], box: Box, rtl: boolean): Laid {
  return {
    layout: { mode: 'NONE' },
    children: [...placed].sort(byPaint).map((item) => withBox(item.spec, rel(item.spec.abs, box), item.flow ? {} : { absolute: constraintsOf(item.anchors ?? [], rtl) })),
    sizing: { h: 'FIXED', v: 'FIXED' },
  };
}

const padBound = (context: PageContext, facts: Facts): readonly [Bound, Bound, Bound, Bound] =>
  SIDES.map((side) => measuredFloat(context, facts, `padding-${side}`, 'GAP')) as unknown as readonly [Bound, Bound, Bound, Bound];

const gapOf = (context: PageContext, facts: Facts, prop: 'row-gap' | 'column-gap'): Bound => (facts.style[prop] === 'normal' || facts.style[prop] === undefined ? { value: 0 } : measuredFloat(context, facts, prop, 'GAP'));

/** Where Figma puts each child along one axis of a single-line auto layout. */
function solveAxis(sizes: readonly number[], start: number, end: number, gap: number, align: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN'): number[] {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const span = end - start;
  let step = gap;
  let cursor = start;
  if (align === 'SPACE_BETWEEN' && sizes.length > 1) step = (span - total) / (sizes.length - 1);
  else if (align === 'MAX') cursor = end - total - gap * (sizes.length - 1);
  else if (align === 'CENTER') cursor = start + (span - total - gap * (sizes.length - 1)) / 2;
  return sizes.map((size) => {
    const at = cursor;
    cursor += size + step;
    return at;
  });
}

interface Line {
  readonly layout: Extract<LayoutSpec, { mode: 'HORIZONTAL' | 'VERTICAL' }>;
  readonly children: NodeSpec[];
  readonly hugMain: boolean;
  readonly hugCross: boolean;
  readonly fillMain: boolean;
  readonly fillCross: boolean;
}

/**
 * Solves one flex line as a Figma auto layout: the order, alignment and gap
 * that land every item on its measured box, or null when none does.
 */
function solveLine(
  context: PageContext,
  facts: Facts,
  items: readonly Placed[],
  inner: { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number },
  origin: Box,
  hint: string,
  padding: readonly [Bound, Bound, Bound, Bound],
  strokesIncluded: boolean
): Line | null {
  const { style } = facts;
  const row = (style['flex-direction'] ?? 'row').startsWith('row');
  const reverse = (style['flex-direction'] ?? '').endsWith('reverse');
  const rtl = style['direction'] === 'rtl';
  // Figma has no margins, so a line is solved on its items' margin boxes, which a frame can hold only when they
  // are not inside out.
  const boxOf = marginBoxOf;
  if (items.some((item) => boxOf(item)[2] < -FIT || boxOf(item)[3] < -FIT)) return miss(context, 'negative margin box', hint);
  const ordered = [...items].sort((a, b) => (row ? boxOf(a)[0] - boxOf(b)[0] : boxOf(a)[1] - boxOf(b)[1]));
  const mainStartIsMax = row ? rtl !== reverse : reverse;
  const startAlign = mainStartIsMax ? 'MAX' : 'MIN';
  const endAlign = mainStartIsMax ? 'MIN' : 'MAX';
  const [justify, safe] = overflowSafe(style['justify-content'] ?? 'normal');
  let primary: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
  if (/^(normal|flex-start|start|stretch)$/.test(justify)) primary = startAlign;
  else if (/^(flex-end|end)$/.test(justify)) primary = endAlign;
  else if (justify === 'center') primary = 'CENTER';
  else if (justify === 'space-between') primary = ordered.length > 1 ? 'SPACE_BETWEEN' : startAlign;
  else if (justify === 'left') primary = row ? 'MIN' : startAlign;
  else if (justify === 'right') primary = row ? 'MAX' : startAlign;
  else return miss(context, `justify-content ${justify}`, hint);

  const crossStartIsMax = row ? false : rtl;
  const [alignItems] = overflowSafe(style['align-items'] ?? 'normal');
  const [cross0, cross1] = row ? [inner.y0, inner.y1] : [inner.x0, inner.x1];
  const crossSize = (item: Placed): number => (row ? boxOf(item)[3] : boxOf(item)[2]);
  const crossPos = (item: Placed): number => (row ? boxOf(item)[1] : boxOf(item)[0]);
  const stretch = /^(normal|stretch)$/.test(alignItems);
  let counter: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
  if (stretch || /^(flex-start|start|self-start)$/.test(alignItems)) counter = crossStartIsMax ? 'MAX' : 'MIN';
  else if (/^(flex-end|end|self-end)$/.test(alignItems)) counter = crossStartIsMax ? 'MIN' : 'MAX';
  else if (alignItems === 'center') counter = 'CENTER';
  else if (/baseline/.test(alignItems) && ordered.every((item) => near(crossPos(item), cross0))) counter = 'MIN';
  // Figma aligns a row's first baselines as CSS does.
  else if (/baseline/.test(alignItems) && row) counter = 'BASELINE';
  else return miss(context, `align-items ${alignItems}`, hint);

  const gap = gapOf(context, facts, row ? 'column-gap' : 'row-gap');
  const mainOf = (box: Box): number => (row ? box[2] : box[3]);
  const mainSizes = ordered.map((item) => mainOf(boxOf(item)));
  const [main0, main1] = row ? [inner.x0, inner.x1] : [inner.y0, inner.y1];
  // Figma's FILL shares the free space equally, so growing items fill only when they measured equal.
  const growing = ordered.filter((item) => Number(item.style['flex-grow'] ?? 0) > 0);
  const growSizes = growing.map((item) => mainOf(item.spec.abs));
  const fillMain = growing.length > 0 && growSizes.every((size) => near(size, growSizes[0]!));
  // An item that grows takes the free space space-between would share, so the line is spaced by its gap from the
  // start, as Figma spaces a line with a filling child: under SPACE_BETWEEN its spacing is auto, the gap dropped.
  if (fillMain && primary === 'SPACE_BETWEEN') primary = startAlign;

  // Auto margins share the free space a growing item leaves, equally. An item with one is a frame that fills its
  // share of the line and holds the item at the side away from the margin, with or without free space, so every
  // occurrence of a part has one shape.
  const autoBefore = (item: Placed): boolean => (item.autos ?? []).includes(row ? 'left' : 'top');
  const autoAfter = (item: Placed): boolean => (item.autos ?? []).includes(row ? 'right' : 'bottom');
  const autoCount = (item: Placed): number => Number(autoBefore(item)) + Number(autoAfter(item));
  const used = mainSizes.reduce((sum, size) => sum + size, 0) + gap.value * Math.max(0, ordered.length - 1);
  const free = main1 - main0 - used;
  // A safe alignment that would push the items out of the line starts them instead.
  if (safe && free < -FIT) primary = startAlign;
  const autos = growing.length > 0 ? 0 : ordered.reduce((sum, item) => sum + autoCount(item), 0);
  const share = autos > 0 ? Math.max(0, free) / autos : 0;
  const pushed = autos > 0 ? ordered.filter((item) => autoCount(item) > 0) : [];
  // Figma shares free space equally between the frames that fill it, so a frame per item lands where CSS puts the
  // item only when each stands for as many margins and the items it holds are alike in size.
  const alike = (item: Placed): boolean => autoCount(item) === autoCount(pushed[0]!) && near(mainOf(boxOf(item)), mainOf(boxOf(pushed[0]!)));
  if (!pushed.every(alike)) return miss(context, 'auto margins', hint);
  const slotSizes = ordered.map((item) => mainOf(boxOf(item)) + (pushed.includes(item) ? share * autoCount(item) : 0));
  const solved = solveAxis(slotSizes, main0, main1, gap.value, autos > 0 ? startAlign : primary);
  const lead = (item: Placed): number => (pushed.includes(item) && autoBefore(item) ? share : 0);
  if (ordered.some((item, at) => !near(solved[at]! + lead(item), row ? boxOf(item)[0] : boxOf(item)[1]))) return miss(context, 'flex main axis', hint);

  const children: NodeSpec[] = [];
  let fillCross = false;
  for (const [at, item] of ordered.entries()) {
    const size = crossSize(item);
    const margin = boxOf(item);
    const fills = stretch && (item.style['align-self'] ?? 'auto') === 'auto' && near(size, cross1 - cross0) && near(crossPos(item), cross0);
    let expected = cross0;
    if (!fills && counter === 'MAX') expected = cross1 - size;
    else if (!fills && counter === 'CENTER') expected = cross0 + (cross1 - cross0 - size) / 2;
    const grow = fillMain && growing.includes(item);
    const sizing = { ...item.spec.sizing };
    if (row) {
      if (grow) sizing.h = 'FILL';
      if (fills) sizing.v = 'FILL';
    } else {
      if (grow) sizing.v = 'FILL';
      if (fills) sizing.h = 'FILL';
    }
    const mainSizing = grow ? 'FILL' : 'HUG';
    const crossSizing = fills ? 'FILL' : 'HUG';
    let node = inMarginBox(item, origin, rtl, row ? 'HORIZONTAL' : 'VERTICAL', row ? { h: mainSizing, v: crossSizing } : { h: crossSizing, v: mainSizing }, sizing);

    if (counter !== 'BASELINE' && !near(expected, crossPos(item))) {
      // An item its own align-self puts elsewhere on the line: a wrapper as tall as the line aligns it, as
      // Figma aligns no single child.
      const at = crossPos(item);
      const own = near(at, cross0) ? 'MIN' : near(at + size, cross1) ? 'MAX' : near(at + size / 2, (cross0 + cross1) / 2) ? 'CENTER' : null;
      if (!own) return miss(context, 'flex cross axis', hint);
      const wrap: Box = row ? [margin[0], cross0, margin[2], cross1 - cross0] : [cross0, margin[1], cross1 - cross0, margin[3]];
      const placedIn = { ...node, box: rel(node.abs, wrap) } as NodeSpec;
      node = {
        type: 'FRAME',
        key: `${item.spec.key}/align`,
        name: 'align-self',
        box: rel(wrap, origin),
        abs: wrap,
        sizing: row ? { h: grow ? 'FILL' : 'HUG', v: 'FILL' } : { h: 'FILL', v: grow ? 'FILL' : 'HUG' },
        layout: { mode: row ? 'VERTICAL' : 'HORIZONTAL', padding: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }], gap: { value: 0 }, primary: own, counter: 'MIN', strokesIncluded: false, reverseZ: false },
        fills: [],
        strokes: [],
        clips: false,
        children: [placedIn],
      };
    } else fillCross ||= fills;
    if (pushed.includes(item)) {
      const slot: Box = row ? [solved[at]!, node.abs[1], slotSizes[at]!, node.abs[3]] : [node.abs[0], solved[at]!, node.abs[2], slotSizes[at]!];
      const across = (row ? node.sizing.v : node.sizing.h) === 'FILL' ? 'FILL' : 'HUG';
      const side = autoBefore(item) && autoAfter(item) ? 'CENTER' : autoBefore(item) ? 'MAX' : 'MIN';
      node = {
        type: 'FRAME',
        key: `${item.spec.key}/auto`,
        name: 'auto margin',
        box: rel(slot, origin),
        abs: slot,
        sizing: row ? { h: 'FILL', v: across } : { h: across, v: 'FILL' },
        layout: { mode: row ? 'HORIZONTAL' : 'VERTICAL', padding: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }], gap: { value: 0 }, primary: side, counter: 'MIN', strokesIncluded: false, reverseZ: false },
        fills: [],
        strokes: [],
        clips: false,
        children: [{ ...node, box: rel(node.abs, slot) } as NodeSpec],
      };
    }
    children.push(node);
  }
  const domOrder = [...items].sort((a, b) => a.order - b.order);
  // Paint order shows only where two items' ink meets; elsewhere the line keeps Figma's default stacking.
  const reversed = ordered.length > 1 && ordered.every((item, at) => item === domOrder[domOrder.length - 1 - at]) && anyMeet(children.map(inkOf));
  return {
    layout: { mode: row ? 'HORIZONTAL' : 'VERTICAL', padding, gap, primary: autos > 0 ? startAlign : primary, counter, strokesIncluded, reverseZ: reversed },
    children,
    hugMain: !fillMain && autos === 0 && primary !== 'SPACE_BETWEEN' && near(used, main1 - main0),
    hugCross: !fillCross && near(Math.max(...ordered.map(crossSize)), cross1 - cross0),
    fillMain: fillMain || autos > 0,
    fillCross,
  };
}

function flexLayout(context: PageContext, facts: Facts, box: Box, placed: readonly Placed[], hint: string, key: string): Laid | null {
  const { style } = facts;
  const rtl = style['direction'] === 'rtl';
  const row = (style['flex-direction'] ?? 'row').startsWith('row');
  const flow = placed.filter((item) => item.flow);
  const others = placed.filter((item) => !item.flow);
  if (flow.length === 0) return null;
  const border = insetOf(style, 'border');
  const content = contentOf(style, box);
  const inner = { x0: content[0], x1: content[0] + content[2], y0: content[1], y1: content[1] + content[3] };
  const padding = padBound(context, facts);
  const strokesIncluded = strokesInLayout(facts);

  // The items' lines: items whose margin boxes overlap across the line share one.
  const lineBoxes = linesOf(
    flow.map((item) => {
      const margin = marginBoxOf(item);
      return row ? margin : ([margin[1], margin[0], margin[3], margin[2]] as Box);
    })
  );
  const wraps = style['flex-wrap'] !== 'nowrap' && lineBoxes.length > 1;
  if (!wraps) {
    const line = solveLine(context, facts, flow, inner, box, hint, padding, strokesIncluded);
    if (!line) return null;
    const sizing = row
      ? { h: line.hugMain ? 'HUG' : 'FIXED', v: line.hugCross ? 'HUG' : 'FIXED' }
      : { h: line.hugCross ? 'HUG' : 'FIXED', v: line.hugMain ? 'HUG' : 'FIXED' };
    return { layout: line.layout, children: stackOrder(line.children, others, box, rtl, line.layout.reverseZ), sizing: sizing as Laid['sizing'] };
  }
  if (!row) return miss(context, 'wrapping column', hint);

  // A wrapping row: one horizontal line frame per measured line, stacked, since Figma's wrap fills from the left.
  const lineFrames: NodeSpec[] = [];
  const zero: readonly [Bound, Bound, Bound, Bound] = [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
  let counted = 0;
  for (const [index, lineBox] of lineBoxes.entries()) {
    const members = flow.filter((item) => {
      const margin = marginBoxOf(item);
      const mid = margin[1] + margin[3] / 2;
      return mid >= lineBox[1] - FIT && mid <= lineBox[1] + lineBox[3] + FIT;
    });
    counted += members.length;
    const abs: Box = [inner.x0, lineBox[1], inner.x1 - inner.x0, lineBox[3]];
    const line = solveLine(context, facts, members, { x0: abs[0], x1: abs[0] + abs[2], y0: abs[1], y1: abs[1] + abs[3] }, abs, hint, zero, false);
    if (!line) return null;
    lineFrames.push({
      type: 'FRAME',
      key: `${key}/line#${index}`,
      name: 'line',
      box: rel(abs, box),
      abs,
      sizing: { h: 'FILL', v: 'HUG' },
      layout: line.layout,
      fills: [],
      strokes: [],
      clips: false,
      children: line.children,
    });
  }
  if (counted !== flow.length) return miss(context, 'wrapped lines', hint);
  const rowGap = gapOf(context, facts, 'row-gap');
  const gaps = lineBoxes.slice(1).map((lineBox, at) => lineBox[1] - (lineBoxes[at]![1] + lineBoxes[at]![3]));
  if (!near(lineBoxes[0]![1], inner.y0) || gaps.some((gap) => !near(gap, rowGap.value))) return miss(context, 'wrapped lines', hint);
  const used = lineBoxes.reduce((sum, lineBox) => sum + lineBox[3], 0) + rowGap.value * (lineBoxes.length - 1);
  return {
    layout: { mode: 'VERTICAL', padding, gap: rowGap, primary: 'MIN', counter: rtl ? 'MAX' : 'MIN', strokesIncluded, reverseZ: false },
    children: stackOrder(lineFrames, others, box, rtl, false),
    sizing: { h: 'FIXED', v: near(used, inner.y1 - inner.y0) ? 'HUG' : 'FIXED' },
  };
}

/** A computed track list in px, or null when any track is not a length (subgrid, masonry). */
const tracksOf = (value: string | undefined): number[] | null => {
  const tokens = (value ?? 'none').replace(/\[[^\]]*\]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens[0] === 'none') return [];
  return tokens.every((token) => /^-?[\d.]+px$/.test(token)) ? tokens.map(px) : null;
};

/** Where a grid item's self-alignment puts it in its cell, physically, or STRETCH when it fills the cell. */
function selfAlign(self: string | undefined, items: string | undefined, rtl: boolean, inline: boolean): Align | 'STRETCH' {
  const value = (!self || self === 'auto' ? (items ?? 'normal') : self).replace(/^(legacy|unsafe|safe)\s+/, '').trim();
  const start: Align = inline && rtl ? 'MAX' : 'MIN';
  const end: Align = inline && rtl ? 'MIN' : 'MAX';
  if (/^(start|self-start|flex-start|baseline|first baseline)$/.test(value)) return start;
  if (/^(end|self-end|flex-end|last baseline)$/.test(value)) return end;
  if (value === 'center') return 'CENTER';
  if (inline && value === 'left') return 'MIN';
  if (inline && value === 'right') return 'MAX';
  return 'STRETCH';
}

/** A grid's tracks as page-space edges, left to right and top to bottom. */
export interface GridLines {
  readonly cols: readonly Edge[];
  readonly rows: readonly Edge[];
}
type Edge = readonly [number, number];

/** A rectangle of grid cells, 0-based from the top left. */
interface Area {
  readonly row: number;
  readonly col: number;
  readonly rowSpan: number;
  readonly colSpan: number;
}

const meets = (a: Area, b: Area): boolean => a.row < b.row + b.rowSpan && b.row < a.row + a.rowSpan && a.col < b.col + b.colSpan && b.col < a.col + a.colSpan;

/** Items whose areas overlap, grouped with the rectangle of cells they cover between them, until no two groups meet. */
function overlapGroups<T extends Area>(cells: readonly T[]): { readonly area: Area; readonly members: readonly T[] }[] {
  const groups: { area: Area; members: T[] }[] = cells.map((cell) => ({ area: { row: cell.row, col: cell.col, rowSpan: cell.rowSpan, colSpan: cell.colSpan }, members: [cell] }));
  for (let at = 0; at < groups.length; at += 1) {
    for (let other = at + 1; other < groups.length; other += 1) {
      if (!meets(groups[at]!.area, groups[other]!.area)) continue;
      const members = [...groups[at]!.members, ...groups[other]!.members];
      const row = Math.min(...members.map((member) => member.row));
      const col = Math.min(...members.map((member) => member.col));
      const rowSpan = Math.max(...members.map((member) => member.row + member.rowSpan)) - row;
      const colSpan = Math.max(...members.map((member) => member.col + member.colSpan)) - col;
      groups[at] = { area: { row, col, rowSpan, colSpan }, members };
      groups.splice(other, 1);
      // The grown area may meet a group already passed: look again from the first.
      at = -1;
      break;
    }
  }
  return groups;
}

/**
 * A track list's edges in inline order, between `start` and `start + size`:
 * packed from the inline start (the right edge of a right-to-left axis)
 * unless the content distribution moves them or spreads the free space
 * between them. A distribution falls back where there is no space to share,
 * space-between to the start and the others to a safe centre, as does a safe
 * alignment that would overflow.
 */
function trackEdges(list: readonly number[], start: number, size: number, gap: number, fromEnd: boolean, distribution: string | undefined): Edge[] {
  const end = start + size;
  const count = list.length;
  const free = size - list.reduce((sum, one) => sum + one, 0) - gap * (count - 1);
  const [aligned, safe] = overflowSafe(distribution ?? 'normal');
  const spread = free > 0 && !(aligned === 'space-between' && count < 2);
  const mode = !spread && /^space-/.test(aligned) ? (aligned === 'space-between' ? 'start' : 'center') : aligned;
  const physical = mode === 'left' ? (fromEnd ? 'end' : 'start') : mode === 'right' ? (fromEnd ? 'start' : 'end') : mode;
  const share = (parts: number): number => (spread ? free / parts : 0);
  let lead = 0;
  let step = gap;
  if (/^(end|flex-end)$/.test(physical)) lead = free;
  else if (physical === 'center') lead = free / 2;
  else if (physical === 'space-between') step = gap + share(count - 1);
  else if (physical === 'space-around') [lead, step] = [share(2 * count), gap + share(count)];
  else if (physical === 'space-evenly') [lead, step] = [share(count + 1), gap + share(count + 1)];
  if (safe && free < 0) lead = 0;
  let cursor = lead;
  return list.map((one): Edge => {
    const edge: Edge = fromEnd ? [end - cursor - one, end - cursor] : [start + cursor, start + cursor + one];
    cursor += one + step;
    return edge;
  });
}

/**
 * The grid's track edges: its computed tracks from its content box, or for a
 * subgrid the tracks it borrows from its grid, cut to its content box, as
 * its padding takes space from its edge tracks. `items` are the boxes of its
 * in-flow children, which tell an empty collapsed track from a filled one.
 */
function gridLinesOf(context: PageContext, facts: Facts, box: Box, borrowed: GridLines | undefined, items: readonly Box[]): GridLines | null {
  const { style } = facts;
  const content = contentOf(style, box);
  const axis = (value: string | undefined, start: number, size: number, gap: number, fromEnd: boolean, distribution: string | undefined, parent: readonly Edge[] | undefined, horizontal: boolean): Edge[] | null => {
    const end = start + size;
    if ((value ?? '').startsWith('subgrid')) {
      if (!parent) return null;
      const inside = parent.filter(([a, b]) => (near(a, b) ? a >= start - FIT && a <= end + FIT : Math.min(b, end) - Math.max(a, start) > FIT));
      return inside.length > 0 ? inside.map(([a, b]): Edge => [Math.max(a, start), Math.min(b, end)]) : null;
    }
    const sizes = tracksOf(value);
    if (sizes === null) return null;
    const full = trackEdges(sizes.length > 0 ? sizes : [size], start, size, gap, fromEnd, distribution);
    // An auto-fit repeat collapses the tracks it leaves empty to 0, and the gutters beside them with them. At the
    // inline end, where auto placement leaves them, a zero track that no child touches is collapsed: it takes no
    // room, and Figma's grid gets no track for it. A zero track a child sits in keeps its gutter.
    const kept = sizes.slice(0, sizes.length - [...sizes].reverse().findIndex((one) => one !== 0));
    const edgeOf = (item: Box): readonly number[] => (horizontal ? [item[0], item[0] + item[2]] : [item[1], item[1] + item[3]]);
    const touched = (at: number): boolean => items.some((item) => edgeOf(item).some((edge) => Math.abs(edge - full[at]![0]) <= FIT));
    const trailing = sizes.map((_, at) => at).slice(kept.length);
    const collapsed = gap > 2 * FIT && kept.length > 0 && trailing.length > 0 && !trailing.some(touched);
    const ordered = collapsed ? trackEdges(kept, start, size, gap, fromEnd, distribution) : full;
    // Computed tracks run from the inline start; Figma's run from the left.
    return fromEnd ? [...ordered].reverse() : ordered;
  };
  const cols = axis(style['grid-template-columns'], content[0], content[2], gapOf(context, facts, 'column-gap').value, style['direction'] === 'rtl', style['justify-content'], borrowed?.cols, true);
  const rows = axis(style['grid-template-rows'], content[1], content[3], gapOf(context, facts, 'row-gap').value, false, style['align-content'], borrowed?.rows, false);
  return cols && rows ? { cols, rows } : null;
}

function gridLayout(context: PageContext, facts: Facts, box: Box, placed: readonly Placed[], hint: string, lines: GridLines | null): Laid | null {
  const { style } = facts;
  const rtl = style['direction'] === 'rtl';
  const content = contentOf(style, box);
  if (!lines) return miss(context, 'grid tracks', hint);
  const flow = placed.filter((item) => item.flow);
  if (flow.length === 0) return null;
  const colEdges = lines.cols;
  const rowEdges = lines.rows;
  const cols = colEdges.map(([a, b]) => b - a);
  const rowsUsed = rowEdges.map(([a, b]) => b - a);
  // One gap per axis: the measured one between the tracks, bound when it is the grid's own.
  const gapAlong = (list: readonly Edge[], prop: 'column-gap' | 'row-gap'): Bound | null => {
    const own = gapOf(context, facts, prop);
    const gaps = list.slice(1).map((edge, at) => edge[0] - list[at]![1]);
    if (gaps.some((gap) => !near(gap, gaps[0]!))) return null;
    return gaps.length === 0 || near(gaps[0]!, own.value) ? own : { value: gaps[0]! };
  };
  const colGap = gapAlong(colEdges, 'column-gap');
  const rowGap = gapAlong(rowEdges, 'row-gap');
  if (!colGap || !rowGap) return miss(context, 'grid gaps', hint);
  // A declared line placement is where the item sits; an auto or named one, where its box falls.
  const declared = (item: Placed, axis: 'row' | 'column', count: number): readonly [number, number] | null => {
    if (!item.placed) return null;
    const line = (value: string): number | null => {
      if (!/^-?\d+$/.test(value)) return null;
      const n = Number(value);
      return n > 0 ? n : count + 2 + n;
    };
    const spanOf = (value: string): number | null => (/^span \d+$/.test(value) ? Number(value.slice(5)) : null);
    const start = item.style[`grid-${axis}-start`] ?? 'auto';
    const end = item.style[`grid-${axis}-end`] ?? 'auto';
    let from: number | null = null;
    let size: number | null = null;
    if (line(start) !== null) {
      from = line(start)! - 1;
      size = line(end) !== null ? line(end)! - 1 - from : (spanOf(end) ?? (end === 'auto' ? 1 : null));
    } else if (spanOf(start) !== null && line(end) !== null) {
      size = spanOf(start)!;
      from = line(end)! - 1 - size;
    }
    if (from === null || size === null || size < 1 || from < 0 || from + size > count) return null;
    // Column lines run from the inline start; the edges run from the left.
    return axis === 'column' && rtl ? [count - from - size, size] : [from, size];
  };
  const span = (list: readonly Edge[], from: number, to: number): readonly [number, number] | null => {
    // An item may start in a collapsed track (an area no item fills), which is where the item starts.
    const first = list.findIndex(([start, end]) => near(from, start) || (from > start && from < end - FIT / 2));
    if (first < 0) return null;
    let last = first;
    while (last < list.length - 1 && to > list[last]![1] + FIT) last += 1;
    return to > list[last]![1] + FIT ? null : [first, last - first + 1];
  };
  const alignIn = (start: number, size: number, from: number, to: number): Align | 'FILL' | null => {
    if (near(start, from) && near(start + size, to)) return 'FILL';
    if (near(start, from)) return 'MIN';
    if (near(start + size, to)) return 'MAX';
    if (near(start + size / 2, (from + to) / 2)) return 'CENTER';
    return null;
  };
  // Every item's cells, found from its margin box, which is what grid alignment places.
  const cells: (Area & { readonly item: Placed; readonly margin: Box })[] = [];
  for (const item of [...flow].sort(byPaint)) {
    const margin = marginBoxOf(item);
    const [x, y, w, h] = margin;
    if (w < -FIT || h < -FIT) return miss(context, 'negative margin box', hint);
    const across = declared(item, 'column', colEdges.length) ?? span(colEdges, x, x + w);
    const down = declared(item, 'row', rowEdges.length) ?? span(rowEdges, y, y + h);
    if (!across || !down) return miss(context, 'grid cell', hint);
    cells.push({ item, margin, col: across[0], colSpan: across[1], row: down[0], rowSpan: down[1] });
  }
  const boxOfArea = (area: Area): Box => {
    const x0 = colEdges[area.col]![0];
    const y0 = rowEdges[area.row]![0];
    return [x0, y0, colEdges[area.col + area.colSpan - 1]![1] - x0, rowEdges[area.row + area.rowSpan - 1]![1] - y0];
  };
  const frameIn = (key: string, name: string, abs: Box, sizing: FrameSpec['sizing'], grid: NonNullable<NodeSpec['grid']>, layout: LayoutSpec, children: NodeSpec[]): FrameSpec => ({
    type: 'FRAME',
    key,
    name,
    box: rel(abs, box),
    abs,
    sizing,
    grid,
    layout,
    fills: [],
    strokes: [],
    clips: false,
    children,
  });
  const FIXED = { h: 'FIXED', v: 'FIXED' } as const;
  const children: NodeSpec[] = [];
  /** Each child's own sizing, before the grid stretches it: what it would be in a track that hugs it. */
  const natural = new Map<string, NodeSpec['sizing']>();
  for (const { area, members } of overlapGroups(cells)) {
    const cell = boxOfArea(area);
    const spans = { row: area.row, col: area.col, rowSpan: area.rowSpan, colSpan: area.colSpan };
    if (members.length > 1) {
      // Items sharing cells (a deck of cards in one area) are one stack, as Figma's grid puts no two children in a
      // cell: each keeps its measured place in it, pinned as it aligns in the area.
      const pin = (start: number, size: number, from: number, to: number): Constraint => {
        if (near(start, from)) return near(start + size, to) ? 'STRETCH' : 'MIN';
        if (near(start + size, to)) return 'MAX';
        return near(start + size / 2, (from + to) / 2) ? 'CENTER' : 'MIN';
      };
      const stacked = [...members]
        .sort((a, b) => byPaint(a.item, b.item))
        .map(({ item }) => {
          const [x, y, w, h] = item.spec.abs;
          return withBox(item.spec, rel(item.spec.abs, cell), { absolute: { h: pin(x, w, cell[0], cell[0] + cell[2]), v: pin(y, h, cell[1], cell[1] + cell[3]) } });
        });
      const key = `${stacked[0]!.key}/stack`;
      natural.set(key, FIXED);
      children.push(frameIn(key, 'stack', cell, { h: 'FILL', v: 'FILL' }, { ...spans, h: 'MIN', v: 'MIN' }, { mode: 'NONE' }, stacked));
      continue;
    }
    const { item, margin } = members[0]!;
    const [x, y, w, h] = margin;
    // An item as wide as its track stretched to it only when its self-alignment stretches; otherwise it sized
    // the track, and keeps its own size where it aligns. A drawing never stretches.
    const settle = (align: Align | 'FILL' | null, self: Align | 'STRETCH'): Align | 'FILL' | null => {
      if (align !== 'FILL') return align;
      if (self !== 'STRETCH') return self;
      return item.spec.type === 'SVG' ? 'MIN' : 'FILL';
    };
    const alignH = settle(alignIn(x, w, cell[0], cell[0] + cell[2]), selfAlign(item.style['justify-self'], style['justify-items'], rtl, true));
    const alignV = settle(alignIn(y, h, cell[1], cell[1] + cell[3]), selfAlign(item.style['align-self'], style['align-items'], rtl, false));
    const ownV = item.style['align-self'] ?? 'auto';
    const vertical = ownV === 'auto' ? (style['align-items'] ?? 'normal') : ownV;
    const [mt, mr, mb, ml] = item.margins ?? [0, 0, 0, 0];
    const [dx, dy] = shiftOf(item.style);
    const still = dx === 0 && dy === 0 && Math.min(mt, mr, mb, ml) >= 0;
    if (alignH !== null && alignV === null && /baseline/.test(vertical) && still && y >= cell[1] - FIT && y + h <= cell[1] + cell[3] + FIT) {
      // A baseline, which Figma's grid does not align to: the item drops from its cell's top by what the baselines
      // measured, as padding in a frame.
      const drop = Math.max(0, y - cell[1]);
      const held: Box = [x, cell[1], w, h + drop];
      const key = `${item.spec.key}/baseline`;
      natural.set(key, { h: 'HUG', v: 'HUG' });
      const padding: readonly [Bound, Bound, Bound, Bound] = [{ value: drop + mt }, { value: mr }, { value: mb }, { value: ml }];
      const inner = withBox(item.spec, rel(item.spec.abs, held), { sizing: { h: alignH === 'FILL' ? 'FILL' : item.spec.sizing.h, v: item.spec.sizing.v } });
      const layout: LayoutSpec = { mode: 'VERTICAL', padding, gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: false, reverseZ: false };
      children.push(frameIn(key, 'baseline', held, { h: alignH === 'FILL' ? 'FILL' : 'HUG', v: 'HUG' }, { ...spans, h: alignH === 'FILL' ? 'MIN' : alignH, v: 'MIN' }, layout, [inner]));
      continue;
    }
    if (alignH === null || alignV === null) {
      // A place no cell alignment gives: the item keeps it in a frame that fills its cell.
      miss(context, 'grid alignment', hint);
      const key = `${item.spec.key}/cell`;
      natural.set(key, FIXED);
      children.push(frameIn(key, 'cell', cell, { h: 'FILL', v: 'FILL' }, { ...spans, h: 'MIN', v: 'MIN' }, { mode: 'NONE' }, [withBox(item.spec, rel(item.spec.abs, cell))]));
      continue;
    }
    const outer = { h: alignH === 'FILL' ? 'FILL' : 'HUG', v: alignV === 'FILL' ? 'FILL' : 'HUG' } as const;
    const sizing = { h: alignH === 'FILL' ? 'FILL' : item.spec.sizing.h, v: alignV === 'FILL' ? 'FILL' : item.spec.sizing.v } as const;
    const held = inMarginBox(item, box, rtl, 'VERTICAL', outer, sizing, { ...spans, h: alignH === 'FILL' ? 'MIN' : alignH, v: alignV === 'FILL' ? 'MIN' : alignV });
    natural.set(held.key, held.key === item.spec.key ? item.spec.sizing : held.type === 'FRAME' && held.layout.mode === 'NONE' ? FIXED : { h: 'HUG', v: 'HUG' });
    children.push(held);
  }
  // Track kinds, from the measurement: a track its items hug hugs; tracks that share what is left of a
  // fixed width flex, weighted by size; the rest are fixed.
  const kindsOf = (sizes: readonly number[], axis: 'col' | 'row', room: number, gap: number): GridTrack[] => {
    const at = (child: NodeSpec): number | undefined => (axis === 'col' ? (child.grid?.colSpan === 1 ? child.grid.col : undefined) : child.grid?.rowSpan === 1 ? child.grid.row : undefined);
    const extent = (child: NodeSpec): number => (axis === 'col' ? child.box[2] : child.box[3]);
    const sizingOf = (child: NodeSpec): string => (axis === 'col' ? child.sizing.h : child.sizing.v);
    const kinds = sizes.map((size, index) => {
      const items = children.filter((child) => at(child) === index);
      // A track with no room shares none: Figma weighs a flexible track by its size.
      if (items.length === 0 || size <= FIT) return 'FIXED';
      // A row is as tall as the tallest item in it, which stretches the rest; a column flexes where its items stretch.
      if (axis === 'row' || items.every((child) => sizingOf(child) !== 'FILL')) return near(Math.max(...items.map(extent)), size) ? 'HUG' : 'FIXED';
      return 'FLEX';
    });
    const used = sizes.reduce((sum, size) => sum + size, 0) + gap * (sizes.length - 1);
    const flexing = sizes.filter((_, index) => kinds[index] === 'FLEX');
    const unit = Math.min(...flexing);
    // Flex shares only a definite size, and only when the tracks fill it.
    const canFlex = axis === 'col' && flexing.length > 0 && near(used, room);
    return sizes.map((size, index) => {
      const kind = kinds[index]!;
      if (kind === 'FLEX' && canFlex) return { type: 'FLEX', value: Math.round((size / unit) * 100) / 100 };
      if (kind === 'HUG') return { type: 'HUG', value: size };
      return { type: 'FIXED', value: size };
    });
  };
  const colTracks = kindsOf(cols, 'col', content[2], colGap.value);
  const rowTracks = kindsOf(rowsUsed, 'row', content[3], rowGap.value);
  const hugs = rowTracks.map((track) => track.type === 'HUG');
  // In a row that hugs, an item takes its own height: the tallest sizes the row, as it did the CSS track.
  const sized = children.map((child) => {
    if (!child.grid || !hugs[child.grid.row] || child.grid.rowSpan !== 1 || child.sizing.v !== 'FILL') return child;
    return { ...child, sizing: { ...child.sizing, v: natural.get(child.key)?.v ?? 'FIXED' } } as NodeSpec;
  });
  const others = placed.filter((item) => !item.flow);
  const usedRows = rowsUsed.reduce((sum, size) => sum + size, 0) + rowGap.value * (rowsUsed.length - 1);
  // Figma's grid starts its tracks at the top left padding edge: the space the tracks leave before them (the left
  // of a right-to-left grid, or what a content alignment moved them by) is padding there, and so is what they leave
  // after them. Tracks may overflow at the bottom and right, as a scroller's do, but not before the start.
  const left = [rowEdges[0]![0] - content[1], content[0] + content[2] - colEdges[colEdges.length - 1]![1], content[1] + content[3] - rowEdges[rowEdges.length - 1]![1], colEdges[0]![0] - content[0]];
  if (left[0]! < -FIT || left[3]! < -FIT) return miss(context, 'grid overflow', hint);
  const padding = padBound(context, facts).map((pad, side) => (left[side]! <= FIT ? pad : { value: pad.value + left[side]! })) as unknown as readonly [Bound, Bound, Bound, Bound];
  return {
    layout: { mode: 'GRID', padding, cols: colTracks, rows: rowTracks, colGap, rowGap, strokesIncluded: strokesInLayout(facts) },
    children: stackOrder(sized, others, box, rtl, false),
    sizing: { h: 'FIXED', v: hugs.every(Boolean) && near(usedRows, content[3]) ? 'HUG' : 'FIXED' },
  };
}

/**
 * A block's in-flow children, one under another: a vertical auto layout.
 * Evenly spaced children share one gap; unevenly spaced ones are spaced by
 * their margins, collapsed between neighbours, as padding around the child
 * whose margin it is. Children standing in several columns from the top (a
 * multi-column list) are a row of column stacks.
 */
function stackLayout(context: PageContext, facts: Facts, box: Box, placed: readonly Placed[], hint: string, key: string): Laid | null {
  const { style } = facts;
  const rtl = style['direction'] === 'rtl';
  const flow = placed.filter((item) => item.flow);
  if (flow.length === 0) return null;
  const others = placed.filter((item) => !item.flow);
  const border = insetOf(style, 'border');
  const content = contentOf(style, box);
  const columns = columnsOf(flow);
  if (columns.length > 1 && columns.every((column) => near(column[0]!.spec.abs[1], content[1])) && flow.every((item) => (item.style['float'] ?? 'none') === 'none')) {
    return multicolLayout(context, facts, box, columns, others, hint, key);
  }
  const stack = blockFlow(context, flow, content[0], content[0] + content[2], box, rtl, hint);
  if (!stack) return null;
  // Margins move the first and last child; the padding Figma needs is what was measured.
  const bound = padBound(context, facts);
  const firstTop = stack.top - box[1] - border[0];
  const lastBottom = box[1] + box[3] - border[2] - stack.bottom;
  const padding: readonly [Bound, Bound, Bound, Bound] = [near(bound[0].value, firstTop) ? bound[0] : { value: Math.max(0, firstTop) }, bound[1], near(bound[2].value, lastBottom) ? bound[2] : { value: Math.max(0, lastBottom) }, bound[3]];
  return {
    layout: { mode: 'VERTICAL', padding, gap: { value: stack.gap }, primary: 'MIN', counter: stack.counter ?? (rtl ? 'MAX' : 'MIN'), strokesIncluded: strokesInLayout(facts), reverseZ: false },
    children: stackOrder(stack.children, others, box, rtl, false),
    sizing: { h: 'FIXED', v: near(padding[0].value + padding[2].value + border[0] + border[2] + stack.bottom - stack.top, box[3]) ? 'HUG' : 'FIXED' },
  };
}

interface Stack {
  readonly children: NodeSpec[];
  readonly gap: number;
  readonly counter: 'MIN' | 'MAX' | 'CENTER' | null;
  /** The first child's top and the last child's bottom. */
  readonly top: number;
  readonly bottom: number;
}

/** Whether an item's own box is not its place in flow: a negative margin or an offset moved it off its margin box. */
const displaced = (item: Placed): boolean => (item.margins ?? [0, 0, 0, 0]).some((margin) => margin < 0) || shiftOf(item.style).some((delta) => delta !== 0);

/**
 * Children one under another between x0 and x1, as a vertical auto layout's
 * children placed in `origin`. Each takes its place by its border box, as
 * block margins collapse between neighbours into the gaps measured, except
 * where a negative margin or an offset displaced it: that one takes its
 * margin box, a frame holding its place with the item inside (`inMarginBox`).
 */
function blockFlow(context: PageContext, items: readonly Placed[], x0: number, x1: number, origin: Box, rtl: boolean, hint: string): Stack | null {
  const placeOf = (item: Placed): Box => (displaced(item) ? marginBoxOf(item) : item.spec.abs);
  const flow = [...items].sort((a, b) => placeOf(a)[1] - placeOf(b)[1]);
  const gaps = flow.slice(1).map((item, at) => placeOf(item)[1] - (placeOf(flow[at]!)[1] + placeOf(flow[at]!)[3]));
  if (gaps.some((gap) => gap < -FIT)) return miss(context, 'stack overlap', hint);
  if (flow.some((item) => placeOf(item)[2] < -FIT || placeOf(item)[3] < -FIT)) return miss(context, 'negative margin box', hint);
  const even = gaps.every((gap) => near(gap, gaps[0]!));
  // Each child's top and bottom padding: an uneven gap goes to the neighbour that declared the larger margin.
  const pads = flow.map((): [number, number] => [0, 0]);
  if (!even) {
    for (const [at, gap] of gaps.entries()) {
      if (near(gap, 0)) continue;
      if ((flow[at]!.margins?.[2] ?? 0) > (flow[at + 1]!.margins?.[0] ?? 0)) pads[at]![1] = gap;
      else pads[at + 1]![0] = gap;
    }
  }
  let counter: 'MIN' | 'MAX' | 'CENTER' | null = null;
  const children: NodeSpec[] = [];
  for (const [at, item] of flow.entries()) {
    const [x, y, w, h] = placeOf(item);
    let align: 'MIN' | 'MAX' | 'CENTER' | 'FILL';
    if (near(x, x0) && near(x + w, x1)) align = 'FILL';
    else if (near(x + w, x1)) align = 'MAX';
    else if (near(x, x0)) align = 'MIN';
    else if (near(x + w / 2, (x0 + x1) / 2)) align = 'CENTER';
    else return miss(context, 'stack alignment', hint);
    if (align !== 'FILL') {
      if (counter && counter !== align) return miss(context, 'stack mixed alignment', hint);
      counter = align;
    }
    const sizing = align === 'FILL' ? { ...item.spec.sizing, h: 'FILL' as const } : item.spec.sizing;
    const placed = displaced(item) ? inMarginBox(item, origin, rtl, 'VERTICAL', { h: align === 'FILL' ? 'FILL' : 'FIXED', v: 'FIXED' }, item.spec.sizing) : withBox(item.spec, rel(item.spec.abs, origin), { sizing });
    const [top, bottom] = pads[at]!;
    if (top === 0 && bottom === 0) {
      children.push(placed);
      continue;
    }
    const held: Box = [x, y - top, w, h + top + bottom];
    children.push({
      type: 'FRAME',
      key: `${item.spec.key}/margin`,
      name: 'margin',
      box: rel(held, origin),
      abs: held,
      sizing: { h: align === 'FILL' ? 'FILL' : 'HUG', v: 'HUG' },
      layout: { mode: 'VERTICAL', padding: [{ value: top }, { value: 0 }, { value: bottom }, { value: 0 }], gap: { value: 0 }, primary: 'MIN', counter: 'MIN', strokesIncluded: false, reverseZ: false },
      fills: [],
      strokes: [],
      clips: false,
      children: [{ ...placed, box: rel(placed.abs, held) } as NodeSpec],
    });
  }
  const last = flow[flow.length - 1]!;
  return { children, gap: even ? Math.max(0, gaps[0] ?? 0) : 0, counter, top: placeOf(flow[0]!)[1], bottom: placeOf(last)[1] + placeOf(last)[3] };
}

/** In-flow children by the column their boxes stand in, left to right, each top to bottom. */
function columnsOf(flow: readonly Placed[]): Placed[][] {
  const columns: { x1: number; items: Placed[] }[] = [];
  for (const item of [...flow].sort((a, b) => a.spec.abs[0] - b.spec.abs[0])) {
    const [x, , w] = item.spec.abs;
    const last = columns[columns.length - 1];
    if (last && x < last.x1 - FIT) {
      last.x1 = Math.max(last.x1, x + w);
      last.items.push(item);
    } else columns.push({ x1: x + w, items: [item] });
  }
  return columns.map((column) => column.items.sort((a, b) => a.spec.abs[1] - b.spec.abs[1]));
}

/**
 * A multi-column flow: a row of its columns, each a stack. CSS gives the
 * columns one width, as FILL shares a row, and spaces them by the column gap,
 * `normal` being the font size.
 */
function multicolLayout(context: PageContext, facts: Facts, box: Box, columns: readonly Placed[][], others: readonly Placed[], hint: string, key: string): Laid | null {
  const { style } = facts;
  const rtl = style['direction'] === 'rtl';
  const border = insetOf(style, 'border');
  const content = contentOf(style, box);
  const gap = (style['column-gap'] ?? 'normal') === 'normal' ? { value: px(style['font-size'] ?? '16px') } : gapOf(context, facts, 'column-gap');
  const count = columns.length;
  const width = (content[2] - gap.value * (count - 1)) / count;
  const frames: NodeSpec[] = [];
  let tallest = 0;
  for (const [index, items] of columns.entries()) {
    const x0 = content[0] + index * (width + gap.value);
    if (items.some(({ spec }) => spec.abs[0] < x0 - FIT || spec.abs[0] + spec.abs[2] > x0 + width + FIT)) return miss(context, 'columns', hint);
    const origin: Box = [x0, content[1], width, 0];
    const stack = blockFlow(context, items, x0, x0 + width, origin, rtl, hint);
    if (!stack) return null;
    const abs: Box = [x0, content[1], width, stack.bottom - content[1]];
    tallest = Math.max(tallest, abs[3]);
    frames.push({
      type: 'FRAME',
      key: `${key}/column#${rtl ? count - 1 - index : index}`,
      name: 'column',
      box: rel(abs, box),
      abs,
      sizing: { h: 'FILL', v: 'HUG' },
      layout: { mode: 'VERTICAL', padding: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }], gap: { value: stack.gap }, primary: 'MIN', counter: stack.counter ?? (rtl ? 'MAX' : 'MIN'), strokesIncluded: false, reverseZ: false },
      fills: [],
      strokes: [],
      clips: false,
      children: stack.children,
    });
  }
  const padding = padBound(context, facts);
  return {
    layout: { mode: 'HORIZONTAL', padding, gap, primary: rtl ? 'MAX' : 'MIN', counter: 'MIN', strokesIncluded: strokesInLayout(facts), reverseZ: false },
    children: stackOrder(frames, others, box, rtl, false),
    sizing: { h: 'FIXED', v: near(padding[0].value + padding[2].value + border[0] + border[2] + tallest, box[3]) ? 'HUG' : 'FIXED' },
  };
}

// ---------------------------------------------------------------- elements

export interface Planned {
  readonly spec: NodeSpec;
  readonly style: Style;
  readonly flow: boolean;
}

/** Visibility and opacity: a layer the print hides with `visibility: hidden` keeps its space in flow, so it fades instead of leaving its auto layout. */
function presenceOf(style: Style, inFlow: boolean): Pick<NodeSpec, 'visible' | 'opacity'> {
  if (style['visibility'] === 'hidden') return inFlow ? { opacity: { value: 0 } } : { visible: false };
  const opacity = Number(style['opacity'] ?? 1);
  return opacity === 1 ? {} : { opacity: { value: opacity } };
}

/** The stable key segment of one element among its siblings. */
function segmentOf(element: RawElement, part: string | null): string {
  const data = element.data;
  const id = data['section'] ?? data['rail-key'] ?? data['key'] ?? data['id'];
  const local = localOf(part);
  const base = data['area'] ? `area-${data['area']}` : (local ?? element.tag);
  return id ? `${base}:${id.length > 24 ? hashOf(id) : id}` : base;
}

function nameOf(element: RawElement, part: string | null): string {
  const local = localOf(part);
  const detail = element.data['area'] ?? element.data['section'];
  if (local) return detail ? `${local} · ${detail}` : local;
  return element.attrs['aria-label']?.slice(0, 40) ?? element.tag;
}

/** How many `::before` and `::after` boxes the print draws for the element. */
const pseudoCount = (context: PageContext, element: RawElement): number => (context.page.pseudo[element.id] ?? []).filter((pseudo) => pseudo.box[2] > 0 && pseudo.box[3] > 0).length;

/**
 * A subgrid that only borrows its grid's tracks: it paints, pads and moves
 * nothing, and its items sit in the grid's own tracks, so they are the grid's
 * items. Figma has no subgrid, and this is the shape it takes there.
 */
function isPlainSubgrid(context: PageContext, kid: RawElement): boolean {
  const { style } = factsOf(context, kid.id);
  if (!/grid/.test(style['display'] ?? '') || isOutOfFlow(style) || (style['position'] ?? 'static') === 'sticky') return false;
  const cols = style['grid-template-columns'] ?? 'none';
  const rows = style['grid-template-rows'] ?? 'none';
  const subCols = cols.startsWith('subgrid');
  const subRows = rows.startsWith('subgrid');
  if (!subCols && !subRows) return false;
  // Along the axis it does not borrow, it may hold one track only, or its items would sit between the grid's lines.
  const own = (value: string, borrowed: boolean): boolean => borrowed || (tracksOf(value)?.length ?? 2) <= 1;
  if (!own(cols, subCols) || !own(rows, subRows)) return false;
  const still =
    !hasPaint(style) &&
    insetOf(style, 'padding').every((value) => value === 0) &&
    (style['transform'] ?? 'none') === 'none' &&
    Number(style['opacity'] ?? 1) === 1 &&
    (style['clip-path'] ?? 'none') === 'none' &&
    !/hidden|clip|auto|scroll/.test(`${style['overflow-x'] ?? ''} ${style['overflow-y'] ?? ''}`);
  return still && pseudoCount(context, kid) === 0;
}

/** A kid as its parent plans it, with the node key an element kid takes. */
interface Kid {
  readonly kid: RawKid;
  readonly key: string;
}

/**
 * An element's kids, each element kid with its node key. A key follows the
 * tree, its segment counted among its siblings there, whatever either print
 * renders or dissolves: an element's keys in the two prints differ by the
 * route key's print alone. A text kid takes its parent's key.
 */
function keyedKids(element: RawElement, key: string): Kid[] {
  const seen = new Map<string, number>();
  return (element.kids ?? []).map((kid): Kid => {
    if (isText(kid)) return { kid, key };
    const segment = segmentOf(kid, partOf(kid.cls));
    const ordinal = seen.get(segment) ?? 0;
    seen.set(segment, ordinal + 1);
    return { kid, key: `${key}/${segment}${ordinal > 0 ? `#${ordinal}` : ''}` };
  });
}

/** An element's kids with `display: contents` wrappers dissolved into their own kids, and in a grid its plain subgrids, each keyed as `keyedKids` keys it. */
function kidsOf(context: PageContext, element: RawElement, key: string, grid: boolean): Kid[] {
  return keyedKids(element, key).flatMap((one): Kid[] => {
    const { kid } = one;
    if (isText(kid)) return [one];
    if (factsOf(context, kid.id).style['display'] === 'contents') return kidsOf(context, kid, one.key, grid);
    if (grid && isPlainSubgrid(context, kid)) return kidsOf(context, kid, one.key, true);
    return [one];
  });
}

/**
 * The elements a print renders, by their node keys below the route key (the
 * stage is ''): each it shows whose parent it renders. Read from the measure,
 * not from what the plan made of it, so the plan's frames can be held to it
 * (RouteSpec.absent, docs/redesign/FIGMA_PRINT.md §9 F8).
 */
export function renderedBy(page: RawProjection): ReadonlySet<string> {
  const rendered = new Set<string>();
  const visit = (element: RawElement, key: string): void => {
    if (!shown(factsIn(page, element.id))) return;
    rendered.add(key);
    for (const { kid, key: kidKey } of keyedKids(element, key)) if (!isText(kid)) visit(kid, kidKey);
  };
  visit(page.tree, '');
  return rendered;
}

const IDENTITY: Linear = [1, 0, 0, 1];
const compose = (outer: Linear, inner: Linear): Linear => [
  outer[0] * inner[0] + outer[2] * inner[1],
  outer[1] * inner[0] + outer[3] * inner[1],
  outer[0] * inner[2] + outer[2] * inner[3],
  outer[1] * inner[2] + outer[3] * inner[3],
];
const linearOf = (transform: string | undefined): Linear => {
  const matrix = matrixOf(transform ?? 'none');
  return matrix ? [matrix[0], matrix[1], matrix[2], matrix[3]] : IDENTITY;
};
const isIdentity = (linear: Linear): boolean => linear.every((value, at) => Math.abs(value - IDENTITY[at]!) < 1e-6);
const isMirror = (linear: Linear): boolean => Math.abs(linear[1]) < 1e-6 && Math.abs(linear[2]) < 1e-6 && Math.abs(Math.abs(linear[0]) - 1) < 1e-6 && Math.abs(Math.abs(linear[3]) - 1) < 1e-6;

/** Bakes a CSS transform into the drawing, about the centre of its view box, as `transform-origin: 50% 50%` applies it. */
function bake(markup: string, linear: Linear): string {
  const open = /^<svg\b[^>]*>/.exec(markup);
  if (!open) return markup;
  const viewBox = /\bviewBox="([^"]+)"/.exec(open[0])?.[1]?.split(/[\s,]+/).map(Number);
  const width = Number(/\bwidth="([\d.]+)"/.exec(open[0])?.[1] ?? 0);
  const height = Number(/\bheight="([\d.]+)"/.exec(open[0])?.[1] ?? 0);
  const [vx = 0, vy = 0, vw = width, vh = height] = viewBox ?? [];
  const [cx, cy] = [vx + vw / 2, vy + vh / 2];
  const [a, b, c, d] = linear;
  const body = markup.slice(open[0].length).replace(/<\/svg>\s*$/, '');
  return `${open[0]}<g transform="translate(${cx} ${cy}) matrix(${a} ${b} ${c} ${d} 0 0) translate(${-cx} ${-cy})">${body}</g></svg>`;
}

/** Every paint of a drawing in document order: the attribute, and its colour with that paint's opacity folded in. */
function svgPaints(markup: string): { readonly kind: 'fill' | 'stroke'; readonly rgba: Rgba }[] {
  const attribute = (attributes: string, name: string): string | undefined => new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes)?.[1];
  return [...markup.matchAll(/<(\w+)\b([^>]*)>/g)].flatMap(([, , attributes = '']) =>
    (['fill', 'stroke'] as const).flatMap((kind) => {
      const rgba = color(attribute(attributes, kind) ?? 'none');
      if (!rgba) return [];
      const opacity = Number(attribute(attributes, `${kind}-opacity`) ?? 1);
      return [{ kind, rgba: [rgba[0], rgba[1], rgba[2], rgba[3] * opacity] as Rgba }];
    })
  );
}

/** Binds each colour of a drawing's markup where the element's colour token holds it. */
function svgColors(context: PageContext, facts: Facts, markup: string): SvgSpec['colors'] {
  const bound = new Map<string, string>();
  for (const paint of svgPaints(markup)) {
    const hex = hexOf(paint.rgba);
    if (paint.rgba[3] === 0 || bound.has(hex)) continue;
    const ref = measuredColor(context, facts, 'color', 'SHAPE_FILL', cssOf(paint.rgba));
    if (ref.variable) bound.set(hex, ref.variable);
  }
  return [...bound.entries()].map(([hex, variable]) => ({ hex, variable }));
}

/**
 * Each shape of a drawing whose fill or stroke binds a token, by its layer id
 * in the markup (docs/redesign/FIGMA_PRINT.md §6): its own authored chain,
 * not the drawing's colour, says which token it paints with. The layer is
 * named by its CSS-module part, or `shape`.
 */
function svgLayers(context: PageContext, shapes: readonly RawShape[]): SvgSpec['layers'] {
  return shapes.flatMap((shape) => {
    const facts: Facts = { node: { s: -1, ...(shape.bind ? { bind: shape.bind } : {}) }, style: { fill: shape.fill, stroke: shape.stroke } };
    const fill = color(shape.fill) ? measuredColor(context, facts, 'fill', 'SHAPE_FILL').variable : undefined;
    const stroke = color(shape.stroke) ? measuredColor(context, facts, 'stroke', 'STROKE_COLOR').variable : undefined;
    if (!fill && !stroke) return [];
    const name = localOf(partOf(shape.cls)) ?? 'shape';
    return shape.layers.map((id) => ({ id, name, ...(fill ? { fill } : {}), ...(stroke ? { stroke } : {}) }));
  });
}

/** Painting `::before` and `::after` boxes, as layers out of flow. */
function pseudoOf(context: PageContext, element: RawElement, key: string): { readonly spec: NodeSpec; readonly style: Style; readonly before: boolean; readonly anchors: readonly Side[] }[] {
  return (context.page.pseudo[element.id] ?? []).flatMap((pseudo) => {
    if (pseudo.box[2] <= 0 || pseudo.box[3] <= 0) return [];
    const facts: Facts = { node: { s: -1, bind: pseudo.bind }, style: pseudo.style };
    const pseudoKey = `${key}/::${pseudo.kind}`;
    const paints = paintsOf(context, facts, pseudo.box, pseudoKey);
    // The text Chrome laid out, not the computed `content`: that keeps alt text (`"+" / ""`) and leaves a counter or an attribute unresolved.
    const content = pseudo.text ?? '';
    const children: NodeSpec[] = [];
    if (content.trim() !== '') {
      children.push({
        type: 'TEXT',
        key: `${pseudoKey}/text`,
        name: content.slice(0, 40),
        box: [0, 0, pseudo.box[2], pseudo.box[3]],
        abs: pseudo.box,
        sizing: { h: 'FIXED', v: 'FIXED' },
        characters: content,
        style: context.type.use(typeOf(pseudo.style, context.faces), null, context.viewport),
        fills: [{ type: 'SOLID', color: measuredColor(context, facts, 'color', 'TEXT_FILL') }],
        align: 'CENTER',
        resize: 'NONE',
        lines: 1,
      });
    }
    if (!paintsSomething(paints) && children.length === 0) return [];
    const spec: FrameSpec = { type: 'FRAME', key: pseudoKey, name: `::${pseudo.kind}`, box: pseudo.box, abs: pseudo.box, sizing: { h: 'FIXED', v: 'FIXED' }, layout: { mode: 'NONE' }, ...paints, clips: false, children, ...presenceOf(pseudo.style, false) };
    return [{ spec, style: pseudo.style, before: pseudo.kind === 'before', anchors: anchorsIn(pseudo.style, pseudo.keywords) }];
  });
}

const SR_ONLY = /^(sr-only|visually-hidden|srOnly)$/;

/** The paint layer CSS puts a child in, and its z-index. */
function layerOf(style: Style, flow: boolean, inFlexOrGrid: boolean): { readonly layer: number; readonly z: number } {
  const zText = style['z-index'] ?? 'auto';
  const z = zText === 'auto' ? 0 : Number(zText);
  const positioned = !flow || /^(relative|sticky)$/.test(style['position'] ?? 'static') || (inFlexOrGrid && zText !== 'auto') || (style['transform'] ?? 'none') !== 'none' || Number(style['opacity'] ?? 1) < 1;
  if (!positioned) return { layer: 1, z: 0 };
  if (z < 0) return { layer: -1, z };
  if (z > 0) return { layer: 3, z };
  return { layer: 2, z: 0 };
}

/** Plans one element and its subtree, or nothing when the print does not render it. `borrowed` is its grid's lines, for a subgrid. */
export function planElement(context: PageContext, element: RawElement, key: string, mirror: Linear = IDENTITY, borrowed?: GridLines): Planned | null {
  const facts = factsOf(context, element.id);
  if (!shown(facts)) return null;
  const { style } = facts;
  const [, , w, h] = element.box;
  const part = partOf(element.cls);
  const local = localOf(part);
  // Screen-reader text and clipped-away boxes print nothing.
  if (element.cls.some((name) => SR_ONLY.test(name)) || local === 'srOnly') return null;
  if ((w <= 1 || h <= 1) && ((style['overflow-x'] ?? 'visible') !== 'visible' || (style['clip-path'] ?? 'none') !== 'none')) return null;
  context.elements.set(key, element);
  context.frames.set(key, { content: contentOf(style, element.box), padding: () => padBound(context, facts), strokesIncluded: strokesInLayout(facts) });
  const flow = !isOutOfFlow(style);
  const presence = presenceOf(style, flow);
  const name = nameOf(element, part);
  const base = { key, name, box: element.box, abs: element.box, sizing: { h: 'FIXED' as const, v: 'FIXED' as const }, ...presence, ...(part ? { part } : {}) };
  const own = linearOf(style['transform']);
  const total = compose(mirror, own);

  if (element.tag === 'svg') {
    const markup = facts.node?.svg ?? '';
    for (const what of facts.node?.unread ?? []) context.notes.approximated.push({ key, what: `drawing not read whole: ${what}` });
    const spec: SvgSpec = { ...base, type: 'SVG', svg: isIdentity(total) ? markup : bake(markup, total), colors: svgColors(context, facts, markup), layers: svgLayers(context, facts.node?.shapes ?? []) };
    return { spec, style, flow };
  }
  if (!isIdentity(own) && !isMirror(own) && own[0] !== 0) context.notes.approximated.push({ key, what: `transform ${style['transform']} kept only in its measured box` });

  const paints = paintsOf(context, facts, element.box, key);
  const clips = /hidden|clip|auto|scroll/.test(`${style['overflow-x'] ?? ''} ${style['overflow-y'] ?? ''}`);

  if (element.tag === 'img' || element.tag === 'canvas') {
    context.notes.approximated.push({ key, what: `${element.tag === 'img' ? 'image' : 'riso field'} printed as its placeholder` });
    const label = element.attrs['alt'] ? `${name} · ${element.attrs['alt'].slice(0, 30)}` : name;
    return { spec: { ...base, type: 'FRAME', name: label, layout: { mode: 'NONE' }, ...paints, clips, children: [] }, style, flow };
  }

  if (element.field) {
    const shownText = element.field.value || element.field.placeholder;
    const children: NodeSpec[] = [];
    if (shownText) {
      const textStyle = element.field.value ? style : { ...style, ...(facts.node?.placeholder ?? {}) };
      const area = contentOf(style, element.box);
      const type = typeOf(textStyle, context.faces, facts.node?.face);
      const lineHeight = type.lineHeight ?? type.size * 1.2;
      const textBox: Box = [area[0], area[1] + (area[3] - lineHeight) / 2, area[2], lineHeight];
      const rgba: Rgba = color(textStyle['color'] ?? '') ?? [0, 0, 0, 1];
      children.push({
        type: 'TEXT',
        key: `${key}/value`,
        name: element.field.value ? 'value' : 'placeholder',
        box: rel(textBox, element.box),
        abs: textBox,
        sizing: { h: 'FIXED', v: 'HUG' },
        characters: directed(shownText, style['direction'] === 'rtl').text,
        style: context.type.use(type, 'field', context.viewport),
        fills: [{ type: 'SOLID', color: { rgba } }],
        align: alignOf(style),
        resize: 'HEIGHT',
        lines: 1,
        maxLines: 1,
      });
    }
    return { spec: { ...base, type: 'FRAME', layout: { mode: 'NONE' }, ...paints, clips: true, children }, style, flow };
  }

  const display = style['display'] ?? 'block';
  const flexOrGrid = /flex|grid/.test(display);
  const keyed = kidsOf(context, element, key, display.includes('grid'));
  const kids = keyed.map((one) => one.kid);
  // A grid's tracks are read off the kids this print renders in flow; one only the other print renders has that print's box.
  const inFlowBoxes = kids
    .filter((kid): kid is RawElement => {
      if (isText(kid)) return false;
      const kidFacts = factsOf(context, kid.id);
      return shown(kidFacts) && !isOutOfFlow(kidFacts.style);
    })
    .map((kid) => kid.box);
  const lines = display.includes('grid') ? gridLinesOf(context, facts, element.box, borrowed, inFlowBoxes) : null;
  const rtl = style['direction'] === 'rtl';
  const hint = local ?? element.tag;
  const pseudo = pseudoOf(context, element, key);
  // A positioned pseudo-element paints with the positioned children, in tree order. A static one is an
  // item of its flex, grid or block parent, so it takes part in the layout; in a line of text it floats.
  const pseudoPlaced = (offset: number, inline: boolean): Placed[] =>
    pseudo.map((item, at) => {
      const isStatic = (item.style['position'] ?? 'static') === 'static';
      const flowItem = isStatic && !inline && (item.style['display'] ?? 'inline') !== 'inline';
      return {
        spec: item.spec,
        style: item.style,
        margins: marginsIn(item.style, []),
        anchors: item.anchors,
        flow: flowItem || (isStatic && !inline && flexOrGrid),
        ...(isStatic ? { layer: item.before ? 0 : 1, z: 0 } : layerOf(item.style, false, flexOrGrid)),
        order: item.before ? -1 - (pseudo.length - at) : offset + at,
      };
    });

  // An inline formatting context: one text layer, in a frame when the element paints, pads or fades.
  const hasText = kids.some(function spoken(kid: RawKid): boolean {
    return isText(kid) ? kid.text.trim() !== '' : (kid.kids ?? []).some(spoken);
  });
  if (!flexOrGrid && hasText && kids.every((kid) => isText(kid) || isInlineText(context, kid))) {
    const built = textOf(context, element, kids, contentOf(style, element.box), `${key}/text`, part);
    if (!built) return null;
    const padded = insetOf(style, 'padding').some((value) => value > 0) || insetOf(style, 'border').some((value) => value > 0);
    if (!paintsSomething(paints) && pseudo.length === 0 && built.behind.length === 0 && !padded) {
      return { spec: { ...built.spec, key, ...presence, ...(part ? { part } : {}) }, style, flow };
    }
    const placed: Placed[] = [
      ...pseudoPlaced(1, true),
      ...built.behind.map((spec, at) => ({ spec, style: EMPTY, flow: false, layer: 0, z: 0, order: at })),
      { spec: built.spec, style: { ...style, ...ANONYMOUS }, flow: true, layer: 1, z: 0, order: 0 },
    ];
    const stacked = stackLayout(context, facts, element.box, placed, hint, key) ?? free(placed, element.box, rtl);
    context.notes.layouts[stacked.layout.mode] = (context.notes.layouts[stacked.layout.mode] ?? 0) + 1;
    return { spec: { ...base, type: 'FRAME', layout: stacked.layout, ...paints, clips, children: stacked.children, sizing: stacked.sizing }, style, flow };
  }

  // Children: elements, bare text runs (anonymous items) and painting pseudo-elements.
  const placed: Placed[] = [];
  let order = 0;
  const childMirror = isMirror(own) || isIdentity(own) ? total : mirror;
  // Text runs with no element between them are one anonymous item, as CSS boxes them: in a block, or a
  // flex column that stretches, it spans the content width.
  const content = contentOf(style, element.box);
  const row = (style['flex-direction'] ?? 'row').startsWith('row');
  const spans = !flexOrGrid || (display.includes('flex') && !row && /^(normal|stretch)$/.test(style['align-items'] ?? 'normal'));
  const anonymous: { readonly at: number; readonly kids: readonly RawText[] }[] = [];
  let run: RawText[] = [];
  // A run is keyed by how many runs come before it, which the tree decides, not by what the print plans around it.
  let runs = 0;
  const closeRun = (): void => {
    const spoken = run.filter((kid) => kid.text.trim() !== '' && kid.lines.length > 0);
    run = [];
    if (spoken.length === 0) return;
    const built = textOf(context, element, spoken, null, `${key}/text#${runs++}`, part, spans ? [content[0], content[0] + content[2]] : null);
    if (!built) return;
    for (const spec of built.behind) placed.push({ spec, style: EMPTY, flow: false, layer: 0, z: 0, order: order++ });
    anonymous.push({ at: placed.length, kids: spoken });
    placed.push({ spec: built.spec, style: { ...style, ...ANONYMOUS }, flow: true, layer: 1, z: 0, order: order++ });
  };
  for (const { kid, key: kidKey } of keyed) {
    if (isText(kid)) {
      run.push(kid);
      continue;
    }
    closeRun();
    const planned = planElement(context, kid, kidKey, childMirror, lines ?? undefined);
    if (!planned) continue;
    const autos = autoMarginsOf(context, kid);
    placed.push({ spec: planned.spec, style: planned.style, flow: planned.flow, autos, margins: marginsIn(planned.style, autos), anchors: anchorsOf(context, kid, planned.style), ...(kid.parent === element.id ? { placed: true as const } : {}), ...layerOf(planned.style, planned.flow, flexOrGrid), order: order++ });
  }
  closeRun();
  placed.push(...pseudoPlaced(order, false));
  // An anonymous item of a flex row that wrapped shrank to the free space between its neighbours, and spans it:
  // only a soft wrap says so, as a forced break wraps a text that may still leave space, and only one such item, as
  // two that shrink share the space in a way their boxes do not tell.
  const forced = (runKids: readonly RawText[]): boolean => /^pre/.test(style['white-space'] ?? 'normal') && runKids.some((kid) => kid.text.includes('\n'));
  const wrapped = anonymous.filter(({ at, kids: runKids }) => {
    const spec = placed[at]!.spec;
    return spec.type === 'TEXT' && spec.lines > 1 && !forced(runKids);
  });
  if (display.includes('flex') && row && style['flex-wrap'] === 'nowrap' && wrapped.length === 1) {
    const gap = (style['column-gap'] ?? 'normal') === 'normal' ? 0 : px(style['column-gap']);
    for (const { at, kids: runKids } of wrapped) {
      const item = placed[at]!;
      const [x, , w] = item.spec.abs;
      const neighbours = placed.filter((other) => other !== item && other.flow).map(marginBoxOf);
      const start = Math.max(content[0], ...neighbours.filter((other) => other[0] + other[2] <= x + FIT).map((other) => other[0] + other[2] + gap));
      const end = Math.min(content[0] + content[2], ...neighbours.filter((other) => other[0] >= x + w - FIT).map((other) => other[0] - gap));
      const built = textOf(context, element, runKids, null, item.spec.key, part, [start, end]);
      if (built) placed[at] = { ...item, spec: built.spec };
    }
  }

  let result: Laid | null = null;
  if (placed.some((item) => item.flow)) {
    if (display.includes('flex')) result = flexLayout(context, facts, element.box, placed, hint, key);
    else if (display.includes('grid')) result = gridLayout(context, facts, element.box, placed, hint, lines);
    else result = stackLayout(context, facts, element.box, placed, hint, key);
  }
  result ??= free(placed, element.box, rtl);
  context.notes.layouts[result.layout.mode] = (context.notes.layouts[result.layout.mode] ?? 0) + 1;
  return { spec: { ...base, type: 'FRAME', layout: result.layout, ...paints, clips, children: result.children, sizing: result.sizing }, style, flow };
}

/** Re-bases every `abs` box of a subtree on a new origin. */
export function shiftAbs(spec: NodeSpec, origin: readonly [number, number]): NodeSpec {
  const abs: Box = [spec.abs[0] - origin[0], spec.abs[1] - origin[1], spec.abs[2], spec.abs[3]];
  if (spec.type === 'FRAME') return { ...spec, abs, children: spec.children.map((child) => shiftAbs(child, origin)) };
  if (spec.type === 'INSTANCE') return { ...spec, abs, ...(spec.slots ? { slots: Object.fromEntries(Object.entries(spec.slots).map(([slot, list]) => [slot, list.map((child) => shiftAbs(child, origin))])) } : {}) };
  return { ...spec, abs };
}

/**
 * Sizing Figma can hold: an axis an auto layout hugs needs a child that does
 * not fill it, or Figma has nothing to hug and collapses the frame. Children
 * that would only fill a hugging axis keep their measured size on it.
 */
function settle(spec: NodeSpec): NodeSpec {
  if (spec.type !== 'FRAME') return spec;
  let children = spec.children.map(settle);
  if (spec.layout.mode === 'HORIZONTAL' || spec.layout.mode === 'VERTICAL') {
    const inFlow = children.filter((child) => child.absolute === undefined);
    for (const axis of ['h', 'v'] as const) {
      if (spec.sizing[axis] !== 'HUG' || inFlow.length === 0 || !inFlow.every((child) => child.sizing[axis] === 'FILL')) continue;
      children = children.map((child) => (child.absolute === undefined ? ({ ...child, sizing: { ...child.sizing, [axis]: 'FIXED' } } as NodeSpec) : child));
    }
  }
  return { ...spec, children };
}

/** Plans one measured page as its route frame, every `abs` box relative to it. */
export function planPage(context: PageContext, routeKey: string): FrameSpec {
  const planned = planElement(context, context.page.tree, routeKey);
  if (!planned || planned.spec.type !== 'FRAME') throw new Error(`${routeKey}: the stage printed nothing`);
  const origin = planned.spec.abs;
  const shifted = shiftAbs(planned.spec, [origin[0], origin[1]]) as FrameSpec;
  for (const facts of context.frames.values()) facts.content = [facts.content[0] - origin[0], facts.content[1] - origin[1], facts.content[2], facts.content[3]];
  return settle({ ...shifted, box: [0, 0, origin[2], origin[3]], name: `${context.page.route} · ${context.page.size[0]}` }) as FrameSpec;
}
