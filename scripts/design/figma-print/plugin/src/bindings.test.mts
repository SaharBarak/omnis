/**
 * The purity read of a printed unit (docs/redesign/FIGMA_PRINT.md §9 F8) on nodes made
 * by hand, shaped as Figma's are: what a node binds through its own fields,
 * paints, gradient stops, effects, text segments and styles, judged against
 * its unit's collection, and the layers only the other print renders, told by
 * their keys.
 *
 *   node --test scripts/design/figma-print/plugin/src/bindings.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectionOf, type Placement } from '../../plan/prints.mts';
import { createReader, MISSING, type Lookups, type NodeLike, type PaintLike, type SegmentLike, type StyleLike } from './bindings.mts';

/** A node as the fakes hold it: its plan key, and a text's styled segments. */
interface Fake extends NodeLike {
  readonly key: string;
  readonly segments?: readonly SegmentLike[];
}

const DESIGN = '/|wide|design';
const WIRE = '/|wide|wire';

const alias = (id: string): object => ({ type: 'VARIABLE_ALIAS', id });
const solid = (variable: string): PaintLike => ({ type: 'SOLID', boundVariables: { color: alias(variable) } });

/** Each variable's collection, by the variable's id, as the file holds it; a person's collection by its name. */
const COLLECTIONS = new Map<string, string>([
  ['v:ink', collectionOf('design')],
  ['v:wire-ink', collectionOf('wire')],
  ['v:wire-lede', collectionOf('wire')],
  ['v:wire-shadow', collectionOf('wire')],
  ['v:np-ink', 'press'],
  ['v:mine', '(Mine)'],
]);

const STYLES = new Map<string, StyleLike>([
  ['s:lede', { type: 'TEXT', boundVariables: { fontSize: alias('v:wire-lede') } }],
  ['s:float', { type: 'EFFECT', effects: [{ type: 'DROP_SHADOW', boundVariables: { color: alias('v:wire-shadow') } }] }],
  ['s:ink', { type: 'PAINT', paints: [solid('v:ink')] }],
]);

/** The lookups over the fakes, counting what the read asks. */
function lookupsOf(): { readonly lookups: Lookups<Fake>; readonly asked: { styles: number; ticks: number } } {
  const asked = { styles: 0, ticks: 0 };
  return {
    asked,
    lookups: {
      keyOf: (node) => node.key,
      segmentsOf: (node) => node.segments ?? [],
      collectionOf: (id) => Promise.resolve(COLLECTIONS.get(id) ?? null),
      styleOf: (id) => {
        asked.styles += 1;
        return Promise.resolve(STYLES.get(id) ?? null);
      },
      tick: () => {
        asked.ticks += 1;
        return Promise.resolve();
      },
    },
  };
}

const node = (key: string, fields: Partial<Fake> = {}): Fake => ({ id: `id:${key}`, type: 'FRAME', key, ...fields });

const placed = (prefix: string, absent: readonly string[] = []): Placement => ({ prefix, at: '', absent: new Set(absent) });

describe('the purity read of a printed unit', () => {
  const design = [
    node(DESIGN, { fills: [solid('v:ink')], fillStyleId: 's:ink' }),
    node(`${DESIGN}/lede`, {
      type: 'TEXT',
      fills: Symbol('mixed'),
      segments: [
        { start: 0, end: 4, fills: [solid('v:ink')], fillStyleId: '', textStyleId: 's:lede' },
        { start: 4, end: 9, fills: [solid('v:ink')], fillStyleId: '', textStyleId: '', boundVariables: { fontSize: alias('v:np-ink') } },
      ],
    }),
    node('kit:Chip:c1/label', { type: 'TEXT', fills: [solid('v:wire-ink')] }),
    node(`${DESIGN}/card`, { effectStyleId: 's:float', effects: [{ type: 'DROP_SHADOW' }] }),
    node(`${DESIGN}/band`, { fills: [{ type: 'GRADIENT_LINEAR', gradientStops: [{ boundVariables: { color: alias('v:ink') } }, { boundVariables: { color: alias('v:wire-ink') } }] }] }),
    node(`${DESIGN}/rule`, { strokes: [solid('v:np-ink')], boundVariables: { strokeTopWeight: alias('v:np-ink') } }),
    node(`${DESIGN}/ghost`, { fills: [solid('v:gone')] }),
    node(`${DESIGN}/aside`, { fills: [solid('v:mine')] }),
    node(`${DESIGN}/main/mark`),
    node(`${DESIGN}/main/mark/::before`),
    node(`${DESIGN}/main/marker`),
  ];

  it('names every binding to another collection than the print’s, through runs, styles, stops and nested layers', async () => {
    const { lookups } = lookupsOf();
    const read = createReader(lookups);
    const { impure } = await read({ unit: DESIGN, collection: collectionOf('design'), placement: placed(DESIGN), nodes: design });
    assert.deepEqual(
      impure.map(({ node: key, field, collection }) => [key, field, collection]),
      [
        [`${DESIGN}/lede`, 'text[0:4].textStyle.fontSize', collectionOf('wire')],
        [`${DESIGN}/lede`, 'text[4:9].fontSize', 'press'],
        ['kit:Chip:c1/label', 'fills[0].color', collectionOf('wire')],
        [`${DESIGN}/card`, 'effectStyle.effects[0].color', collectionOf('wire')],
        [`${DESIGN}/band`, 'fills[0].stops[1].color', collectionOf('wire')],
        [`${DESIGN}/rule`, 'strokes[0].color', 'press'],
        [`${DESIGN}/ghost`, 'fills[0].color', MISSING],
        [`${DESIGN}/aside`, 'fills[0].color', '(Mine)'],
      ]
    );
  });

  it('judges the same bindings against the wire print’s collection in a wire unit', async () => {
    const { lookups } = lookupsOf();
    const { impure } = await createReader(lookups)({ unit: WIRE, collection: collectionOf('wire'), placement: placed(WIRE), nodes: [node(WIRE, { fills: [solid('v:wire-ink')], strokes: [solid('v:ink')] })] });
    assert.deepEqual(
      impure.map(({ field, collection }) => [field, collection]),
      [['strokes[0].color', collectionOf('design')]]
    );
  });

  it('names a layer at or under an element only the other print renders, and no other', async () => {
    const { lookups } = lookupsOf();
    const { strays } = await createReader(lookups)({ unit: DESIGN, collection: collectionOf('design'), placement: placed(DESIGN, ['/main/mark']), nodes: design });
    assert.deepEqual(
      strays.map((stray) => stray.node),
      [`${DESIGN}/main/mark`, `${DESIGN}/main/mark/::before`]
    );
  });

  it('reads a main’s layers on the page of the occurrence it is drawn from, and leaves its nested instances’ layers to their own mains', async () => {
    const { lookups } = lookupsOf();
    const main: Placement = { prefix: 'kit:Card:k1', at: '/main', absent: new Set(['/main/mark']) };
    const nodes = [node('kit:Card:k1'), node('kit:Card:k1/mark'), node('kit:Card:k1/title'), node('kit:Chip:c1/mark')];
    const { strays } = await createReader(lookups)({ unit: 'kit:Card', collection: collectionOf('design'), placement: main, nodes });
    assert.deepEqual(
      strays.map((stray) => stray.node),
      ['kit:Card:k1/mark']
    );
  });

  it('looks each style up once across units, and hands the editor a turn after each node', async () => {
    const { lookups, asked } = lookupsOf();
    const read = createReader(lookups);
    await read({ unit: DESIGN, collection: collectionOf('design'), placement: placed(DESIGN), nodes: design });
    await read({ unit: DESIGN, collection: collectionOf('design'), placement: placed(DESIGN), nodes: design });
    assert.equal(asked.styles, 3);
    assert.equal(asked.ticks, 2 * design.length);
  });
});
