/**
 * Main components by variant key, and the layers inside an instance that a
 * main's plan keys name. An instance's layer has the id of its main's layer
 * prefixed by the instance's own (`I<instance>;<layer>`, one segment per
 * nesting), so a part path resolves segment by segment, each against the
 * main the layer before it shows, a swapped one included.
 */
import { err, ok, type Result } from 'neverthrow';
import { ENTRY, carrying, keyOf, printedOnes, read } from './keys.mts';

export interface Mains {
  /** The main component of a variant. */
  component(variantKey: string): ComponentNode | null;
  /** Records a variant's main, built or found. */
  register(variantKey: string, node: ComponentNode): void;
  /** Drops a variant whose main is being rebuilt, with the layer index read off it. */
  forget(variantKey: string): void;
  /** The id of a main's layer by its plan key, the main itself included. */
  layerId(variantKey: string, part: string): string | null;
}

/** The layer ids of a variant's main by plan key: its own layers, never a nested instance's. */
function layersOf(main: ComponentNode, variantKey: string): ReadonlyMap<string, string> {
  const own = `${variantKey}/`;
  const layers = new Map<string, string>([[variantKey, main.id]]);
  for (const node of carrying(main, ENTRY.key)) {
    const key = keyOf(node);
    if (key.startsWith(own) && read(node, ENTRY.unit) === read(main, ENTRY.unit) && !layers.has(key)) layers.set(key, node.id);
  }
  return layers;
}

/** The mains a page holds, by the variant key each carries: the one that prints each key, never a person's copy of it (keys.mts). */
export function createMains(page: PageNode): Mains {
  const keyed = page.findAllWithCriteria({ types: ['COMPONENT'] }).filter((node) => keyOf(node) !== '' && read(node, ENTRY.unit) !== '');
  const mains = printedOnes(keyed, keyOf).printed;
  const layers = new Map<string, ReadonlyMap<string, string>>();
  const live = (variantKey: string): ComponentNode | null => {
    const node = mains.get(variantKey);
    return node && !node.removed ? node : null;
  };
  return {
    component: live,
    register: (variantKey, node) => {
      mains.set(variantKey, node);
      layers.delete(variantKey);
    },
    forget: (variantKey) => {
      mains.delete(variantKey);
      layers.delete(variantKey);
    },
    layerId: (variantKey, part) => {
      const main = live(variantKey);
      if (!main) return null;
      const known = layers.get(variantKey) ?? layersOf(main, variantKey);
      layers.set(variantKey, known);
      return known.get(part) ?? null;
    },
  };
}

/** The separator of a nested part path (OverrideSpec.part). */
export const PATH = ' > ';

/** The id prefix of an instance's layers. */
const layerPrefix = (instance: InstanceNode): string => (instance.id.startsWith('I') ? instance.id : `I${instance.id}`);

const isScene = (node: BaseNode | null): node is SceneNode => node !== null && node.type !== 'DOCUMENT' && node.type !== 'PAGE';

/** A layer and the instance whose main holds it. */
export interface Layer {
  readonly node: SceneNode;
  readonly owner: InstanceNode;
}

/** One step: the layer of an instance that its main's part names. */
async function stepInto(instance: InstanceNode, part: string, mains: Mains): Promise<Result<SceneNode, string>> {
  const main = await instance.getMainComponentAsync();
  const variantKey = main ? keyOf(main) : '';
  const layer = mains.layerId(variantKey, part);
  if (layer === null) return err(`${part} is not a layer of ${variantKey === '' ? 'the main component' : variantKey}`);
  const node = await figma.getNodeByIdAsync(`${layerPrefix(instance)};${layer}`);
  const found = isScene(node) ? node : instance.findOne((one) => one.id.endsWith(`;${layer}`));
  return found ? ok(found) : err(`the instance shows no layer ${part}`);
}

/** The layer a part path names inside an instance, with the instance whose main holds it. */
export async function layerOf(instance: InstanceNode, part: string, mains: Mains): Promise<Result<Layer, string>> {
  const segments = part.split(PATH);
  let owner = instance;
  for (const [at, segment] of segments.entries()) {
    const step = await stepInto(owner, segment, mains);
    if (step.isErr()) return err(step.error);
    if (at === segments.length - 1) return ok({ node: step.value, owner });
    if (step.value.type !== 'INSTANCE') return err(`${segment} is not an instance, so ${part} names nothing`);
    owner = step.value;
  }
  return err('the part path is empty');
}
