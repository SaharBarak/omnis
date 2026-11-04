/**
 * Paints and effects from the plan. A colour the plan binds prints bound to
 * its variable, in its print's collection, with the variable carrying the
 * alpha and the paint its tint; a colour the plan measured only prints raw.
 * Raw is what the report counts (F4). Effects drawn through a shadow token
 * print as its effect style; others print as measured.
 */
import type { ColorRef, EffectSpec, PaintSpec } from '../../plan/schema.mts';
import { paintHexOf, rgbaHexOf, rgbaOf, rgbOf, tintedHexOf } from './colors.mts';
import { guard, variableOf, type Run } from './context.mts';
import { layersUnder } from './keys.mts';

export function solidOf(ref: ColorRef, run: Run, needer: string): SolidPaint {
  const variable = ref.variable === undefined ? null : variableOf(run, ref.variable, needer);
  const raw: SolidPaint = { type: 'SOLID', color: rgbOf(ref.rgba), opacity: ref.rgba[3] };
  return variable ? figma.variables.setBoundVariableForPaint({ ...raw, opacity: ref.tint ?? 1 }, 'color', variable) : raw;
}

function stopOf(stop: Extract<PaintSpec, { readonly stops: unknown }>['stops'][number], run: Run, needer: string): ColorStop {
  const variable = stop.color.variable === undefined ? null : variableOf(run, stop.color.variable, needer);
  const color = rgbaOf(stop.color.rgba);
  return variable ? { position: stop.at, color, boundVariables: { color: figma.variables.createVariableAlias(variable) } } : { position: stop.at, color };
}

export function paintOf(spec: PaintSpec, run: Run, needer: string): Paint {
  if (spec.type === 'SOLID') return solidOf(spec.color, run, needer);
  const [[a, b, c], [d, e, f]] = spec.transform;
  return { type: spec.type, gradientTransform: [[a, b, c], [d, e, f]], gradientStops: spec.stops.map((stop) => stopOf(stop, run, needer)) };
}

export const paintsOf = (specs: readonly PaintSpec[], run: Run, needer: string): Paint[] => specs.map((spec) => paintOf(spec, run, needer));

export function effectOf(spec: EffectSpec, run: Run, needer: string): Effect {
  const variable = spec.color.variable === undefined ? null : variableOf(run, spec.color.variable, needer);
  const shared = { color: rgbaOf(spec.color.rgba), offset: { x: spec.offset[0], y: spec.offset[1] }, radius: spec.radius, spread: spec.spread, visible: true, blendMode: 'NORMAL' } as const;
  const effect: DropShadowEffect | InnerShadowEffect = spec.type === 'DROP_SHADOW' ? { ...shared, type: 'DROP_SHADOW', showShadowBehindNode: false } : { ...shared, type: 'INNER_SHADOW' };
  return variable ? figma.variables.setBoundVariableForEffect(effect, 'color', variable) : effect;
}

/** What carries effects and an effect style. */
export type Shadowed = Pick<BlendMixin, 'effects' | 'effectStyleId' | 'setEffectStyleIdAsync'>;

const unspread = (effect: Effect): Effect => (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW' ? { ...effect, spread: 0 } : effect);

/**
 * A layer's effects: the effect style the plan names, when the file holds it,
 * or else the measured effects, unstyled, detached from a style it held. A
 * shadow's spread holds only on a clipping frame with a visible fill, so a
 * list Figma refuses prints again unspread.
 */
export async function applyEffects(node: Shadowed, effects: readonly EffectSpec[], styleKey: string | undefined, run: Run, needer: string): Promise<void> {
  const style = styleKey === undefined ? undefined : run.library.effectStyles.get(styleKey);
  if (style) {
    if (node.effectStyleId !== style.id) await node.setEffectStyleIdAsync(style.id);
    return;
  }
  if (styleKey !== undefined) run.journal.error(needer, `the effect style ${styleKey} is not in the file; the measured effects printed`);
  if (node.effectStyleId !== '') await node.setEffectStyleIdAsync('');
  const list = effects.map((effect) => effectOf(effect, run, needer));
  if (!guard(run, needer, 'effects', () => (node.effects = list))) node.effects = list.map(unspread);
}

/** What an effect prints, for comparison: its type, colour or variable, offset, radius and spread. */
export function effectSignature(effect: Effect): string {
  if (effect.type !== 'DROP_SHADOW' && effect.type !== 'INNER_SHADOW') return effect.type;
  const bound = effect.boundVariables?.color?.id;
  return JSON.stringify([effect.type, bound ?? rgbaHexOf(effect.color), effect.offset.x, effect.offset.y, effect.radius, effect.spread ?? 0]);
}

const isVisible = (paint: Paint): boolean => paint.visible !== false;

/** Whether a paint is a raw value: a solid with no colour variable, or a gradient with a stop that has none. */
export function isRaw(paint: Paint): boolean {
  if (!isVisible(paint)) return false;
  if (paint.type === 'SOLID') return paint.boundVariables?.color === undefined;
  if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
    return paint.gradientStops.some((stop) => stop.boundVariables?.color === undefined);
  }
  return false;
}

/**
 * What a solid paint shows, as `#rrggbbaa`: its variable's colour through
 * the paint's opacity when it is bound to one of the plan's, else its own
 * colour and opacity. A main binds its own print's variables, so that is the
 * colour the planner reads off the drawing's markup in that print, and a
 * recolor's `from` meets it whether the import bound the colour with its
 * alpha or by RGB alone.
 */
export function shownHexOfPaint(paint: SolidPaint, run: Run): string {
  const bound = paint.boundVariables?.color?.id;
  const key = bound === undefined ? undefined : run.library.variableKeys.get(bound);
  const held = key === undefined ? undefined : run.colors.get(key);
  return held ? tintedHexOf(held, paint.opacity ?? 1) : paintHexOf(paint.color, paint.opacity);
}

/** Passes every fill and stroke of a node and its layers through `swap`; a list that comes back the same is not written. */
export function repaintTree(root: SceneNode, swap: (paint: Paint) => Paint): void {
  const repainted = (paints: readonly Paint[]): Paint[] | null => {
    const next = paints.map(swap);
    return next.some((paint, at) => paint !== paints[at]) ? next : null;
  };
  for (const node of [root, ...('findAll' in root ? layersUnder(root) : [])]) {
    if ('fills' in node && typeof node.fills !== 'symbol') {
      const fills = repainted(node.fills);
      if (fills) node.fills = fills;
    }
    if ('strokes' in node) {
      const strokes = repainted(node.strokes);
      if (strokes) node.strokes = strokes;
    }
  }
}

/** A colour of an imported drawing and the variable it binds: matched by `#rrggbbaa`, or by RGB alone when one listed colour has it. */
export interface Binding {
  readonly variable: string;
  /** Matched with its alpha, so the variable carries the alpha too. */
  readonly exact: boolean;
}

export function bindingFor(hex: string, colors: readonly { readonly hex: string; readonly variable: string }[]): Binding | null {
  const wanted = hex.toLowerCase();
  const exact = colors.find((one) => one.hex.toLowerCase() === wanted);
  if (exact) return { variable: exact.variable, exact: true };
  const rgb = colors.filter((one) => one.hex.toLowerCase().slice(0, 7) === wanted.slice(0, 7));
  return rgb.length === 1 && rgb[0] ? { variable: rgb[0].variable, exact: false } : null;
}
