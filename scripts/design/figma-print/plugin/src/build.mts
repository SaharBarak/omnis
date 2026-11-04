/**
 * NodeSpec to node (docs/redesign/FIGMA_PRINT.md §3.3): a FRAME is a frame, or the
 * main's slot; a TEXT is a text in its style; an SVG is the editor's import
 * with its colours rebound; an INSTANCE is an instance of its variant's main
 * with its overrides and slot content. Every node is isolated: one that
 * throws is removed and reported, and its siblings still print.
 */
import type { FrameSpec, InstanceSpec, NodeSpec, SvgSpec, TextSpec, TextStyleSpec } from '../../plan/schema.mts';
import { setOpacity, setRadii, setStrokeWeights, setVisible, type Sides } from './bind.mts';
import { paintHexOf } from './colors.mts';
import { guard, variableOf, type Run } from './context.mts';
import { attempt, attemptSync } from './failure.mts';
import { layersUnder, mark } from './keys.mts';
import { appendInto, applyLayout, fixAxes, hug, MIN_LENGTH, placeIn, resizeTo, settleGrid, type Built, type Container } from './layout.mts';
import { layerOf } from './mains.mts';
import { samePx } from './numbers.mts';
import { applyOverrides } from './overrides.mts';
import { applyEffects, bindingFor, paintsOf, repaintTree } from './paint.mts';
import { fontOfStyle } from './styles.mts';

export interface Scope {
  readonly run: Run;
  /** The unit the nodes print for: the route's key, or the component's. */
  readonly unit: string;
  /** The main a slot frame is made in; null outside a main. */
  readonly host: ComponentNode | null;
  /** Where a node waits from its making until its parent takes it: the stage's draft (canvas.mts). */
  readonly draft: FrameNode;
}

/**
 * Configures a node made for a spec, in the scope's draft from the moment it
 * is made (a main's slot is made in its main); a node that fails half way is
 * removed, so nothing half built stays in the file.
 */
async function made<Node extends Built>(node: Node, scope: Scope, configure: (node: Node) => Promise<void> | void): Promise<Node> {
  try {
    if (node.type !== 'SLOT') scope.draft.appendChild(node);
    await configure(node);
    return node;
  } catch (error) {
    if (!node.removed) node.remove();
    throw error;
  }
}

/**
 * What a printed node carries. It is no unit root until its stage says so,
 * even where an instance shows its main's entries, and a node rebuilt in
 * place (a main) loses a part the plan no longer gives it.
 */
const markOf = (spec: NodeSpec, scope: Scope): Parameters<typeof mark>[1] => ({ key: spec.key, unit: scope.unit, kind: '', part: spec.part ?? '' });

/** The radii a frame without them has. */
const SQUARE: Sides = [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];

function applyLook(frame: Container, spec: FrameSpec, run: Run): void {
  const { key } = spec;
  frame.fills = paintsOf(spec.fills, run, key);
  frame.strokes = paintsOf(spec.strokes, run, key);
  if (spec.strokeWeights) setStrokeWeights(frame, spec.strokeWeights, run, key);
  frame.strokeAlign = spec.strokeAlign ?? 'INSIDE';
  frame.dashPattern = [...(spec.dash ?? [])];
  setRadii(frame, spec.radii ?? SQUARE, run, key);
  // Clipping before effects: a shadow's spread holds only on a clipping frame.
  frame.clipsContent = spec.clips;
}

/** Appends and places each child; a child that cannot be placed is appended plainly and reported. */
async function buildChildren(parent: Container, children: readonly NodeSpec[], scope: Scope): Promise<void> {
  for (const child of children) {
    const node = await buildNode(child, scope);
    if (node) {
      const placed = attemptSync(() => {
        appendInto(parent, node, child);
        placeIn(parent, node, child, scope.run);
      });
      if (placed.isErr()) {
        scope.run.journal.error(child.key, `placing it: ${placed.error}`);
        const appended = node.parent === parent || guard(scope.run, child.key, 'appending it', () => {
          parent.appendChild(node);
        });
        if (!appended) node.remove();
      }
    }
    await scope.run.slicer.tick();
  }
}

/** A frame's look, layout, size and children, its grid tracks again, then the hugging it does around them. */
export async function fillFrame(frame: Container, spec: FrameSpec, scope: Scope): Promise<void> {
  frame.name = spec.name;
  mark(frame, markOf(spec, scope));
  applyLook(frame, spec, scope.run);
  await applyEffects(frame, spec.effects ?? [], spec.effectStyle, scope.run, spec.key);
  applyLayout(frame, spec, scope.run);
  resizeTo(frame, spec.box[2], spec.box[3]);
  await buildChildren(frame, spec.children, scope);
  settleGrid(frame, spec, scope.run);
  hug(frame, spec, scope.run);
  setVisible(frame, spec.visible);
  setOpacity(frame, spec.opacity, scope.run, spec.key);
}

const buildFrame = (spec: FrameSpec, scope: Scope): Promise<Container> =>
  made<Container>(spec.slot && scope.host ? scope.host.createSlot() : figma.createFrame(), scope, (frame) => fillFrame(frame, spec, scope));

function sizeText(text: TextNode, spec: TextSpec): void {
  const [, , width, height] = spec.box;
  if (spec.resize === 'WIDTH_AND_HEIGHT') {
    text.textAutoResize = 'WIDTH_AND_HEIGHT';
    return;
  }
  text.textAutoResize = 'NONE';
  resizeTo(text, width, height);
  if (spec.resize === 'HEIGHT') text.textAutoResize = 'HEIGHT';
}

/** A run's range, clamped to the characters; null when nothing is left of it. */
const rangeOf = (start: number, end: number, length: number): readonly [number, number] | null => {
  const [from, to] = [Math.max(0, start), Math.min(end, length)];
  return from < to ? [from, to] : null;
};

/** A text's face when its style is not in the file: the style's own values, unbound. */
function applyFace(text: TextNode, spec: TextStyleSpec): void {
  text.fontSize = spec.size;
  text.lineHeight = spec.lineHeight === null ? { unit: 'AUTO' } : { unit: 'PIXELS', value: spec.lineHeight };
  text.letterSpacing = { unit: 'PIXELS', value: spec.letterSpacing };
  text.textCase = spec.textCase ?? 'ORIGINAL';
  text.textDecoration = spec.decoration ?? 'NONE';
}

async function fillText(text: TextNode, spec: TextSpec, scope: Scope): Promise<void> {
  const { run } = scope;
  text.name = spec.name;
  mark(text, markOf(spec, scope));
  const styleSpec = run.textStyleSpecs.get(spec.style);
  text.fontName = styleSpec ? fontOfStyle(styleSpec, run) : run.fonts.initial;
  text.characters = spec.characters;
  const style = run.library.textStyles.get(spec.style);
  if (style) await text.setTextStyleIdAsync(style.id);
  else {
    run.journal.error(spec.key, `its text style ${spec.style} is not in the file; its face printed unstyled`);
    if (styleSpec) applyFace(text, styleSpec);
  }
  const length = text.characters.length;
  for (const textRun of spec.runs ?? []) {
    const range = rangeOf(textRun.start, textRun.end, length);
    const runStyle = textRun.style === undefined ? undefined : run.library.textStyles.get(textRun.style);
    if (range && runStyle) await text.setRangeTextStyleIdAsync(range[0], range[1], runStyle.id);
  }
  text.fills = paintsOf(spec.fills, run, spec.key);
  for (const textRun of spec.runs ?? []) {
    const range = rangeOf(textRun.start, textRun.end, length);
    if (range && textRun.fills) text.setRangeFills(range[0], range[1], paintsOf(textRun.fills, run, spec.key));
  }
  text.textAlignHorizontal = spec.align;
  sizeText(text, spec);
  const { maxLines } = spec;
  if (maxLines !== undefined) {
    // A line limit holds only once the text truncates.
    guard(run, spec.key, 'max lines', () => {
      text.textTruncation = 'ENDING';
      text.maxLines = maxLines;
    });
  }
  setVisible(text, spec.visible);
  setOpacity(text, spec.opacity, run, spec.key);
}

const buildText = (spec: TextSpec, scope: Scope): Promise<TextNode> => made(figma.createText(), scope, (text) => fillText(text, spec, scope));

/** A paint list with each solid paint bound to `variable`. */
const boundPaints = (paints: readonly Paint[], variable: Variable): Paint[] => paints.map((paint) => (paint.type === 'SOLID' ? figma.variables.setBoundVariableForPaint(paint, 'color', variable) : paint));

/**
 * Binds each layer the spec names by its markup id to its own shape's tokens
 * (docs/redesign/FIGMA_PRINT.md §6), then names it; a layer named by no id is
 * left to the colour rebinding.
 */
function bindLayers(root: SceneNode & ChildrenMixin, layers: SvgSpec['layers'], run: Run, needer: string): void {
  if (layers.length === 0) return;
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  for (const node of layersUnder(root)) {
    const layer = byId.get(node.name);
    if (!layer) continue;
    guard(run, needer, `bind ${layer.id}`, () => {
      if ('fills' in node && layer.fill && node.fills !== figma.mixed) {
        const variable = variableOf(run, layer.fill, needer);
        if (variable) node.fills = boundPaints(node.fills, variable);
      }
      if ('strokes' in node && layer.stroke) {
        const variable = variableOf(run, layer.stroke, needer);
        if (variable) node.strokes = boundPaints(node.strokes, variable);
      }
      node.name = layer.name;
    });
  }
}

/** Rebinds an imported drawing's paints: each named layer to its own tokens, then any colour still unbound to the variables its spec lists. */
export function bindDrawing(root: SceneNode & ChildrenMixin, spec: Pick<SvgSpec, 'colors' | 'layers'>, run: Run, needer: string): void {
  bindLayers(root, spec.layers, run, needer);
  const colors = spec.colors;
  if (colors.length === 0) return;
  repaintTree(root, (paint) => {
    if (paint.type !== 'SOLID' || paint.boundVariables?.color) return paint;
    const binding = bindingFor(paintHexOf(paint.color, paint.opacity), colors);
    const variable = binding ? variableOf(run, binding.variable, needer) : null;
    return binding && variable ? figma.variables.setBoundVariableForPaint(binding.exact ? { ...paint, opacity: 1 } : paint, 'color', variable) : paint;
  });
}

const SCALE: Constraints = { horizontal: 'SCALE', vertical: 'SCALE' };

/**
 * Makes an imported drawing scale with its frame, every layer at any depth
 * that takes constraints (a group takes none, its layers do), so an instance
 * of it resized scales too; then fits it to its measured size when the import
 * came out another size.
 */
function fitDrawing(frame: FrameNode | ComponentNode, spec: SvgSpec, run: Run): void {
  for (const layer of layersUnder(frame)) {
    if ('constraints' in layer && (layer.constraints.horizontal !== 'SCALE' || layer.constraints.vertical !== 'SCALE')) guard(run, spec.key, 'scale constraints', () => (layer.constraints = SCALE));
  }
  const [, , width, height] = spec.box;
  if (samePx(frame.width, width) && samePx(frame.height, height)) return;
  frame.resize(Math.max(width, MIN_LENGTH), Math.max(height, MIN_LENGTH));
}

const buildSvg = (spec: SvgSpec, scope: Scope): Promise<FrameNode> =>
  made(figma.createNodeFromSvg(spec.svg), scope, (frame) => {
    frame.name = spec.name;
    mark(frame, markOf(spec, scope));
    bindDrawing(frame, spec, scope.run, spec.key);
    fitDrawing(frame, spec, scope.run);
    setVisible(frame, spec.visible);
    setOpacity(frame, spec.opacity, scope.run, spec.key);
  });

/** Each slot's content, built into the slot the instance shows for the main's slot frame. */
async function fillSlots(instance: InstanceNode, spec: InstanceSpec, scope: Scope): Promise<void> {
  for (const [slotKey, content] of Object.entries(spec.slots ?? {})) {
    const layer = await layerOf(instance, slotKey, scope.run.mains);
    if (layer.isErr()) {
      scope.run.journal.error(spec.key, `slot ${slotKey}: ${layer.error}`);
      continue;
    }
    const slot = layer.value.node;
    if (slot.type !== 'SLOT' && slot.type !== 'FRAME') {
      scope.run.journal.error(spec.key, `slot ${slotKey}: the instance shows a ${slot.type} there, not a slot`);
      continue;
    }
    await buildChildren(slot, content, scope);
  }
}

async function fillInstance(instance: InstanceNode, spec: InstanceSpec, scope: Scope): Promise<void> {
  instance.name = spec.name;
  mark(instance, markOf(spec, scope));
  await applyOverrides(instance, spec.overrides, scope.run, spec.key);
  await fillSlots(instance, spec, scope);
  const fixed = { h: spec.sizing.h !== 'HUG', v: spec.sizing.v !== 'HUG' };
  fixAxes(instance, fixed, spec, scope.run);
  if (fixed.h || fixed.v) resizeTo(instance, spec.box[2], spec.box[3]);
  hug(instance, spec, scope.run);
  setVisible(instance, spec.visible);
  setOpacity(instance, spec.opacity, scope.run, spec.key);
}

function buildInstance(spec: InstanceSpec, scope: Scope): Promise<InstanceNode> {
  const main = scope.run.mains.component(spec.component);
  if (!main) throw new Error(`its main component ${spec.component} is not in the file`);
  return made(main.createInstance(), scope, (instance) => fillInstance(instance, spec, scope));
}

function buildSpec(spec: NodeSpec, scope: Scope): Promise<Built> {
  switch (spec.type) {
    case 'FRAME':
      return buildFrame(spec, scope);
    case 'TEXT':
      return buildText(spec, scope);
    case 'SVG':
      return buildSvg(spec, scope);
    case 'INSTANCE':
      return buildInstance(spec, scope);
  }
}

/** Builds a node and everything under it, or null when it throws; the throw is in the journal against its key. */
export async function buildNode(spec: NodeSpec, scope: Scope): Promise<Built | null> {
  const built = await attempt(() => buildSpec(spec, scope));
  if (built.isOk()) return built.value;
  scope.run.journal.error(spec.key, built.error);
  return null;
}

/** Prints a variant's root into its main component, which is kept so its instances keep their link. */
export async function buildMain(main: ComponentNode, root: FrameSpec | SvgSpec, scope: Scope): Promise<void> {
  if (root.type === 'FRAME') {
    await fillFrame(main, root, scope);
    return;
  }
  const drawing = figma.createNodeFromSvg(root.svg);
  try {
    main.name = root.name;
    mark(main, markOf(root, scope));
    main.layoutMode = 'NONE';
    main.fills = [];
    main.clipsContent = drawing.clipsContent;
    resizeTo(main, drawing.width, drawing.height);
    for (const child of [...drawing.children]) {
      const { x, y } = child;
      main.appendChild(child);
      child.x = x;
      child.y = y;
    }
    bindDrawing(main, root, scope.run, root.key);
    fitDrawing(main, root, scope.run);
    setVisible(main, root.visible);
    setOpacity(main, root.opacity, scope.run, root.key);
  } finally {
    if (!drawing.removed) drawing.remove();
  }
}
