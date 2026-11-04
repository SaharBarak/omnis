/**
 * An instance's overrides (OverrideSpec), in list order: a swap first puts a
 * nested instance on another variant and clears that layer's overrides, then
 * the overrides under it land on the variant it now shows. A text a TEXT
 * property exposes is set through the property, so the instance stays a
 * plain use of its main.
 */
import { ok } from 'neverthrow';
import type { ColorRef, OverrideSpec } from '../../plan/schema.mts';
import { setOpacity, setStrokeWeights, setVisible } from './bind.mts';
import { guard, type Run } from './context.mts';
import { attempt } from './failure.mts';
import { layerOf, type Layer } from './mains.mts';
import { applyEffects, paintsOf, repaintTree, shownHexOfPaint, solidOf } from './paint.mts';

/** Loads every font a text shows, so its characters can change. */
async function loadFontsOf(text: TextNode): Promise<void> {
  const fonts = text.characters.length > 0 ? text.getRangeAllFontNames(0, text.characters.length) : [text.fontName];
  await Promise.all(fonts.flatMap((font) => (typeof font === 'symbol' ? [] : [figma.loadFontAsync(font)])));
}

async function setCharacters(layer: Layer, characters: string): Promise<void> {
  const { node, owner } = layer;
  if (node.type !== 'TEXT') throw new Error(`${node.name} is a ${node.type}, not a text`);
  await loadFontsOf(node);
  const property = node.componentPropertyReferences?.characters;
  if (property !== undefined) owner.setProperties({ [property]: characters });
  else node.characters = characters;
}

/** Swaps an imported drawing's colours: each paint whose shown colour is a `from` takes its `to`. */
function recolor(root: SceneNode, pairs: NonNullable<OverrideSpec['recolor']>, run: Run, needer: string): void {
  const targets = new Map(pairs.map((pair) => [pair.from.toLowerCase(), pair.to] as const));
  repaintTree(root, (paint) => {
    const to: ColorRef | undefined = paint.type === 'SOLID' ? targets.get(shownHexOfPaint(paint, run)) : undefined;
    return to ? solidOf(to, run, needer) : paint;
  });
}

/** The layers that have a property. */
type Having<Key extends string> = Extract<SceneNode, Readonly<Record<Key, unknown>>>;

const having =
  <Key extends string,>(key: Key) =>
  (node: SceneNode): node is Having<Key> =>
    key in node;

/** Applies one override's fields to the layer it names, each isolated; a field the layer cannot take is reported. */
async function applyOne(layer: Layer, override: OverrideSpec, run: Run, needer: string): Promise<void> {
  const { node } = layer;
  const what = (field: string): string => `override ${field} on ${override.part === '' ? 'the instance' : override.part}`;
  const put = <Holder extends SceneNode,>(field: string, holds: (node: SceneNode) => node is Holder, set: (holder: Holder) => void): void => {
    if (holds(node)) {
      guard(run, needer, what(field), () => {
        set(node);
      });
    } else run.journal.error(needer, `${what(field)}: a ${node.type} layer has no ${field}`);
  };
  const putAsync = async <Holder extends SceneNode,>(field: string, holds: (node: SceneNode) => node is Holder, set: (holder: Holder) => Promise<void>): Promise<void> => {
    if (!holds(node)) {
      run.journal.error(needer, `${what(field)}: a ${node.type} layer has no ${field}`);
      return;
    }
    const done = await attempt(() => set(node));
    if (done.isErr()) run.journal.error(needer, `${what(field)}: ${done.error}`);
  };
  if (override.swap !== undefined) {
    const main = run.mains.component(override.swap);
    if (node.type !== 'INSTANCE' || !main) throw new Error(`${what('swap')}: ${node.type === 'INSTANCE' ? `no main component ${override.swap}` : 'the layer is no instance'}`);
    node.mainComponent = main;
  }
  if (override.characters !== undefined) await setCharacters(layer, override.characters);
  if (override.style !== undefined) {
    const style = run.library.textStyles.get(override.style);
    if (node.type === 'TEXT' && style) await node.setTextStyleIdAsync(style.id);
    else run.journal.error(needer, `${what('style')}: ${style ? 'the layer is no text' : `the style ${override.style} is not in the file`}`);
  }
  const { fills, strokes, strokeWeights, strokeAlign, dash, effects, effectStyle, visible, opacity, size, recolor: pairs } = override;
  if (fills) put('fills', having('fills'), (holder) => (holder.fills = paintsOf(fills, run, needer)));
  if (strokes) put('strokes', having('strokes'), (holder) => (holder.strokes = paintsOf(strokes, run, needer)));
  if (strokeWeights) {
    put('stroke weights', having('strokeTopWeight'), (holder) => {
      setStrokeWeights(holder, strokeWeights, run, needer);
    });
  }
  if (strokeAlign) put('stroke align', having('strokeAlign'), (holder) => (holder.strokeAlign = strokeAlign));
  if (dash) put('dash pattern', having('dashPattern'), (holder) => (holder.dashPattern = [...dash]));
  if (effects !== undefined || effectStyle !== undefined) {
    await putAsync(effectStyle === undefined ? 'effects' : 'effect style', having('effectStyleId'), (holder) => applyEffects(holder, effects ?? [], effectStyle, run, needer));
  }
  if (visible !== undefined) {
    guard(run, needer, what('visible'), () => {
      setVisible(node, visible);
    });
  }
  if (opacity) {
    put('opacity', having('opacity'), (holder) => {
      setOpacity(holder, opacity, run, needer);
    });
  }
  if (size) {
    put('size', having('resize'), (holder) => {
      holder.resize(size[0], size[1]);
    });
  }
  if (pairs) {
    guard(run, needer, what('recolor'), () => {
      recolor(node, pairs, run, needer);
    });
  }
}

/** Every override of an instance, each isolated: one that cannot land is reported and the rest still apply. */
export async function applyOverrides(instance: InstanceNode, overrides: readonly OverrideSpec[], run: Run, needer: string): Promise<void> {
  for (const override of overrides) {
    const layer = override.part === '' ? ok<Layer, string>({ node: instance, owner: instance }) : await layerOf(instance, override.part, run.mains);
    const applied = await layer.asyncAndThen((found) => attempt(() => applyOne(found, override, run, needer)));
    if (applied.isErr()) run.journal.error(needer, `override on ${override.part === '' ? 'the instance' : override.part}: ${applied.error}`);
    await run.slicer.tick();
  }
}
