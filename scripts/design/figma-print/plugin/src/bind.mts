/**
 * Numbers the plan may bind to a variable (`Bound`): bound when the plan
 * names a variable, set raw otherwise, and unbound when a reused node carries
 * a binding the plan dropped. Visibility is a literal of its print.
 */
import type { Bound } from '../../plan/schema.mts';
import { variableOf, type Run } from './context.mts';
import { sameFloat } from './numbers.mts';

/** The number fields the plan binds. */
export type NumberField =
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'itemSpacing'
  | 'gridRowGap'
  | 'gridColumnGap'
  | 'topLeftRadius'
  | 'topRightRadius'
  | 'bottomRightRadius'
  | 'bottomLeftRadius'
  | 'strokeTopWeight'
  | 'strokeRightWeight'
  | 'strokeBottomWeight'
  | 'strokeLeftWeight'
  | 'opacity';

type Bindable = Pick<SceneNodeMixin, 'boundVariables' | 'setBoundVariable'>;

/** No variable: typed so the call takes the overload that accepts a variable, not the deprecated id form. */
const UNBOUND: Variable | null = null;

/** Clears a binding the node carries on a field. */
function unbind(node: Bindable, field: NumberField | 'visible'): void {
  if (node.boundVariables?.[field] !== undefined) node.setBoundVariable(field, UNBOUND);
}

export function setNumber<Field extends NumberField>(node: Bindable & Record<Field, number>, field: Field, bound: Bound, run: Run, needer: string): void {
  const variable = bound.variable === undefined ? null : variableOf(run, bound.variable, needer);
  if (variable) {
    if (node.boundVariables?.[field]?.id !== variable.id) node.setBoundVariable(field, variable);
    return;
  }
  unbind(node, field);
  const target: Record<Field, number> = node;
  if (target[field] !== bound.value) target[field] = bound.value;
}

/** Four sides as the plan lists them: top, right, bottom, left for strokes; from the top-left, clockwise, for radii. */
export type Sides = readonly [Bound, Bound, Bound, Bound];

export function setStrokeWeights(node: Bindable & IndividualStrokesMixin, [top, right, bottom, left]: Sides, run: Run, needer: string): void {
  setNumber(node, 'strokeTopWeight', top, run, needer);
  setNumber(node, 'strokeRightWeight', right, run, needer);
  setNumber(node, 'strokeBottomWeight', bottom, run, needer);
  setNumber(node, 'strokeLeftWeight', left, run, needer);
}

export function setRadii(node: Bindable & RectangleCornerMixin, [topLeft, topRight, bottomRight, bottomLeft]: Sides, run: Run, needer: string): void {
  setNumber(node, 'topLeftRadius', topLeft, run, needer);
  setNumber(node, 'topRightRadius', topRight, run, needer);
  setNumber(node, 'bottomRightRadius', bottomRight, run, needer);
  setNumber(node, 'bottomLeftRadius', bottomLeft, run, needer);
}

/** Shown or hidden; a node printed when a print switch bound its visibility loses that binding. */
export function setVisible(node: Bindable & { visible: boolean }, visible: boolean | undefined): void {
  unbind(node, 'visible');
  node.visible = visible ?? true;
}

/** The one value a variable holds in a single-mode collection, when it is a number. */
const heldNumber = (variable: Variable): number | null => {
  const [value] = Object.values(variable.valuesByMode);
  return typeof value === 'number' ? value : null;
};

/**
 * Layer opacity, bound or raw. A bound opacity is read back: the plan holds
 * opacity as a fraction, and a node that reads its variable on another scale
 * is reported against the variable, once.
 */
export function setOpacity(node: Bindable & { opacity: number }, opacity: Bound | undefined, run: Run, needer: string): void {
  setNumber(node, 'opacity', opacity ?? { value: 1 }, run, needer);
  const key = opacity?.variable;
  const variable = key === undefined ? undefined : run.library.variables.get(key);
  const held = variable ? heldNumber(variable) : null;
  if (key !== undefined && held !== null && !sameFloat(node.opacity, held)) {
    run.journal.error(key, `a layer bound to it reads opacity ${String(node.opacity)} while it holds ${String(held)}`);
  }
}
