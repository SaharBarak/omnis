/**
 * What the plan prints with no token behind it (docs/redesign/FIGMA_PRINT.md §6):
 * every colour of the finished plan, in its routes, its components' mains
 * and its instances' overrides, that no variable carries.
 */
import { markupPaints } from './components.mts';
import type { ColorRef, ComponentSpec, EffectSpec, NodeSpec, OverrideSpec, PaintSpec, RouteSpec } from './schema.mts';

const loose = (color: ColorRef): number => (color.variable === undefined && color.rgba[3] > 0 ? 1 : 0);

const ofPaints = (list: readonly PaintSpec[] | undefined): number =>
  (list ?? []).reduce((sum, paint) => sum + (paint.type === 'SOLID' ? loose(paint.color) : paint.stops.reduce((stops, stop) => stops + loose(stop.color), 0)), 0);

const ofEffects = (list: readonly EffectSpec[] | undefined): number => (list ?? []).reduce((sum, effect) => sum + loose(effect.color), 0);

const ofOverride = (override: OverrideSpec): number =>
  ofPaints(override.fills) + ofPaints(override.strokes) + ofEffects(override.effects) + (override.recolor ?? []).reduce((sum, one) => sum + loose(one.to), 0);

function ofNode(spec: NodeSpec): number {
  switch (spec.type) {
    case 'FRAME':
      return ofPaints(spec.fills) + ofPaints(spec.strokes) + (spec.effectStyle ? 0 : ofEffects(spec.effects)) + spec.children.reduce((sum, child) => sum + ofNode(child), 0);
    case 'TEXT':
      return ofPaints(spec.fills) + (spec.runs ?? []).reduce((sum, run) => sum + ofPaints(run.fills), 0);
    case 'SVG': {
      // A shape's paint is bound by its own layer first, then by its colour (`SvgSpec.layers`, `colors`).
      const byColor = new Set(spec.colors.map((entry) => entry.hex));
      const byLayer = new Map(spec.layers.map((layer) => [layer.id, layer]));
      const loose = markupPaints(spec.svg).filter((paint) => !paint.hex.endsWith('00') && !byColor.has(paint.hex) && (paint.id === null || byLayer.get(paint.id)?.[paint.kind] === undefined));
      return new Set(loose.map((paint) => paint.hex)).size;
    }
    case 'INSTANCE':
      return (
        spec.overrides.reduce((sum, override) => sum + ofOverride(override), 0) +
        Object.values(spec.slots ?? {})
          .flat()
          .reduce((sum, child) => sum + ofNode(child), 0)
      );
  }
}

/** The colours the plan prints as measured values only. */
export function unboundOf(routes: readonly RouteSpec[], components: readonly ComponentSpec[]): number {
  const inRoutes = routes.reduce((sum, route) => sum + ofNode(route.frame), 0);
  const inMains = components.reduce((sum, component) => sum + component.variants.reduce((variants, variant) => variants + ofNode(variant.root), 0), 0);
  return inRoutes + inMains;
}
