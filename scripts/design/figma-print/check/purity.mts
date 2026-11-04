/**
 * Purity as the plan states it (docs/redesign/FIGMA_PRINT.md §6, §9 F8): a
 * frame or main binds its own print's collection only (and the primitives
 * through its aliases); its instances and their swaps show its own print's
 * variants; and none holds a layer only another print renders, as the
 * measure tells (RouteSpec.absent), a main through the occurrence it is
 * drawn from. A binding counts wherever the plugin sets one: paints, effects
 * or their style, text styles and runs, layout, radii, stroke weights,
 * opacity, a drawing's colours, and every override.
 */
import { collectionOf, isPrintName, isStray, placementsOf, PRINT_AXIS, printOfVariant, type Placement } from '../plan/prints.mts';
import type { Bound, CollectionSpec, ColorRef, EffectSpec, EffectStyleSpec, LayoutSpec, NodeSpec, OverrideSpec, PaintSpec, PlanBundle, PrintName, TextStyleSpec } from '../plan/schema.mts';
import { subtreeOf } from './plan-index.mts';

export interface Finding {
  readonly key: string;
  readonly detail: string;
}

export interface Purity {
  readonly frames: number;
  readonly mains: number;
  readonly bindings: number;
  /** Bindings to their own print's collection. */
  readonly own: number;
  /** Bindings to a collection other than their print's. */
  readonly crossed: readonly Finding[];
  /** Instances and swaps that show a variant of the other print. */
  readonly foreign: readonly Finding[];
  /** Layers a frame or main holds that only the other print renders. */
  readonly strays: readonly Finding[];
  /** What the plan does not place: a main that names no print or no source on a route, a binding to a variable no collection holds. */
  readonly unknown: readonly Finding[];
}

interface Binding {
  readonly field: string;
  readonly variable: string;
}

interface Styles {
  readonly text: ReadonlyMap<string, TextStyleSpec>;
  readonly effect: ReadonlyMap<string, EffectStyleSpec>;
}

const bound = (field: string, variable: string | undefined): Binding[] => (variable === undefined ? [] : [{ field, variable }]);
const ofColors = (field: string, colors: readonly ColorRef[]): Binding[] => colors.flatMap((color) => bound(field, color.variable));
const ofBounds = (field: string, values: readonly (Bound | undefined)[]): Binding[] => values.flatMap((value) => bound(field, value?.variable));
const colorsOf = (paints: readonly PaintSpec[] = []): ColorRef[] => paints.flatMap((paint) => (paint.type === 'SOLID' ? [paint.color] : paint.stops.map((stop) => stop.color)));
const ofTextStyle = (styles: Styles, field: string, style: string | undefined): Binding[] => (style === undefined ? [] : bound(field, styles.text.get(style)?.bind?.fontSize));

/** A layer's shadows: its effect style's when it takes one, its own effects otherwise. */
function ofShadows(styles: Styles, effects: readonly EffectSpec[] | undefined, style: string | undefined): Binding[] {
  if (style !== undefined) return ofColors('effect style', (styles.effect.get(style)?.effects ?? []).map((effect) => effect.color));
  return ofColors('effects', (effects ?? []).map((effect) => effect.color));
}

function ofLayout(layout: LayoutSpec): Binding[] {
  switch (layout.mode) {
    case 'NONE':
      return [];
    case 'GRID':
      return [...ofBounds('padding', layout.padding), ...ofBounds('gap', [layout.colGap, layout.rowGap])];
    default:
      return [...ofBounds('padding', layout.padding), ...ofBounds('gap', [layout.gap])];
  }
}

function ofOverride(styles: Styles, override: OverrideSpec): Binding[] {
  const where = override.part === '' ? 'override' : `override at ${override.part}`;
  return [
    ...ofColors('fills', colorsOf(override.fills)),
    ...ofColors('strokes', colorsOf(override.strokes)),
    ...ofBounds('stroke weights', override.strokeWeights ?? []),
    ...ofShadows(styles, override.effects, override.effectStyle),
    ...ofTextStyle(styles, 'text style', override.style),
    ...ofBounds('opacity', [override.opacity]),
    ...ofColors('recolor', (override.recolor ?? []).map((pair) => pair.to)),
  ].map((binding) => ({ ...binding, field: `${where}: ${binding.field}` }));
}

/** Every variable a node binds itself, with the field that binds it; its children are nodes of their own. */
function bindingsOf(styles: Styles, node: NodeSpec): Binding[] {
  const own = ofBounds('opacity', [node.opacity]);
  switch (node.type) {
    case 'FRAME':
      return [
        ...own,
        ...ofColors('fills', colorsOf(node.fills)),
        ...ofColors('strokes', colorsOf(node.strokes)),
        ...ofBounds('stroke weights', node.strokeWeights ?? []),
        ...ofBounds('radii', node.radii ?? []),
        ...ofShadows(styles, node.effects, node.effectStyle),
        ...ofLayout(node.layout),
      ];
    case 'TEXT':
      return [
        ...own,
        ...ofColors('fills', colorsOf(node.fills)),
        ...ofTextStyle(styles, 'text style', node.style),
        ...(node.runs ?? []).flatMap((run) => [...ofColors('run fills', colorsOf(run.fills)), ...ofTextStyle(styles, 'run text style', run.style)]),
      ];
    case 'SVG':
      return [...own, ...node.colors.flatMap((color) => bound('colors', color.variable))];
    case 'INSTANCE':
      return [...own, ...node.overrides.flatMap((override) => ofOverride(styles, override))];
  }
}

/** The variants an instance shows: its own, and each one a swap puts a nested instance on. */
const shownBy = (node: NodeSpec): readonly string[] =>
  node.type === 'INSTANCE' ? [node.component, ...node.overrides.flatMap((override) => (override.swap === undefined ? [] : [override.swap]))] : [];

interface Unit {
  readonly key: string;
  readonly kind: 'frame' | 'main';
  readonly print: PrintName;
  readonly root: NodeSpec;
  /** Where its layers lie on their page, and what only the other print renders there. */
  readonly placement: Placement;
}

export function purityOf(bundle: PlanBundle): Purity {
  const collectionByVariable = new Map<string, CollectionSpec>(bundle.collections.flatMap((collection) => collection.variables.map((variable) => [variable.key, collection] as const)));
  const styles: Styles = {
    text: new Map(bundle.textStyles.map((style) => [style.key, style] as const)),
    effect: new Map(bundle.effectStyles.map((style) => [style.key, style] as const)),
  };
  const variants = bundle.components.flatMap((component) => component.variants);
  const printByVariant = new Map(variants.map((variant) => [variant.key, printOfVariant(variant.values)] as const));
  const crossed: Finding[] = [];
  const foreign: Finding[] = [];
  const strays: Finding[] = [];
  const unknown: Finding[] = [];
  const placements = placementsOf(bundle.routes, bundle.components);
  const units: Unit[] = [];
  for (const route of bundle.routes) {
    const placement = placements.get(route.key);
    if (placement) units.push({ key: route.key, kind: 'frame', print: route.print, root: route.frame, placement });
  }
  for (const variant of variants) {
    const print = printByVariant.get(variant.key);
    const placement = placements.get(variant.key);
    if (!isPrintName(print)) unknown.push({ key: variant.key, detail: `its main names no ${PRINT_AXIS ?? 'print'}` });
    else if (!placement) unknown.push({ key: variant.key, detail: `its main is drawn from ${variant.source}, which no planned route frame holds` });
    else units.push({ key: variant.key, kind: 'main', print, root: variant.root, placement });
  }
  let bindings = 0;
  let owned = 0;
  for (const unit of units) {
    const allowed = collectionOf(unit.print);
    for (const node of subtreeOf(unit.root)) {
      for (const { field, variable } of bindingsOf(styles, node)) {
        bindings += 1;
        const collection = collectionByVariable.get(variable);
        if (!collection) unknown.push({ key: node.key, detail: `${field} binds ${variable}, which no collection holds` });
        else if (collection.key !== allowed) crossed.push({ key: node.key, detail: `${field} binds ${variable} of ${collection.name}, in a ${unit.print} ${unit.kind}` });
        else owned += 1;
      }
      for (const variant of shownBy(node)) {
        const print = printByVariant.get(variant);
        if (isPrintName(print) && print !== unit.print) foreign.push({ key: node.key, detail: `shows ${variant}, a ${print} variant, in a ${unit.print} ${unit.kind}` });
      }
      if (isStray(node.key, unit.placement)) strays.push({ key: node.key, detail: `only the other print renders it, and the ${unit.print} ${unit.kind} ${unit.key} holds it` });
    }
  }
  const frames = units.filter((unit) => unit.kind === 'frame').length;
  return { frames, mains: units.length - frames, bindings, own: owned, crossed, foreign, strays, unknown };
}
