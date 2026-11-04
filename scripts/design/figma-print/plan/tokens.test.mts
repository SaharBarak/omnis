/**
 * Variables (docs/redesign/FIGMA_PRINT.md §6): each print binds its own collection,
 * `Bento` and its twin `Bento wire`, and the twin aliases its `Bento` twin
 * wherever the prints read the token alike.
 *
 *   node --test scripts/design/figma-print/plan/tokens.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RawBinding, RawPage } from './raw.mts';
import type { CollectionSpec, PrintName, VariableSpec } from './schema.mts';
import { type Measured, Variables } from './tokens.mts';

type Tokens = Record<string, string>;

/** A page whose stage holds these tokens in each print, and whose one element authored these chains in each. */
const pageOf = (tokens: Record<PrintName, Tokens>, chains: Record<PrintName, readonly (readonly string[])[]>): RawPage =>
  ({
    viewport: 'wide',
    prints: {
      design: { tokens: tokens.design, nodes: { '0': { s: 0, bind: { color: { value: '', chains: chains.design } } } }, pseudo: {} },
      wire: { tokens: tokens.wire, nodes: { '0': { s: 0, bind: { color: { value: '', chains: chains.wire } } } }, pseudo: {} },
    },
  }) as unknown as RawPage;

const fill = (computed: string, chain: readonly string[]): Measured => {
  const binding: RawBinding = { value: `var(${chain[0]})`, chains: [chain] };
  return { kind: 'color', computed, binding, viewport: 'wide', scope: 'FRAME_FILL' };
};

const collection = (collections: readonly CollectionSpec[], key: string): ReadonlyMap<string, VariableSpec> => new Map(collections.find((one) => one.key === key)!.variables.map((variable) => [variable.key, variable] as const));

const RED = '#d92e1d';
const INK = '#191816';
const GREY = '#737373';

describe('a print’s binder', () => {
  it('binds the design print to the Bento key and the wire print to its twin', () => {
    const vars = new Variables([pageOf({ design: { '--np-ink': INK }, wire: { '--np-ink': INK } }, { design: [], wire: [] })]);
    assert.equal(vars.in('design').color(fill('rgb(25, 24, 22)', ['--np-ink'])).variable, '--np-ink');
    assert.equal(vars.in('wire').color(fill('rgb(25, 24, 22)', ['--np-ink'])).variable, 'wire:--np-ink');
  });

  it('leaves a value no token of its own print holds as a literal', () => {
    const vars = new Variables([pageOf({ design: { '--np-ink': INK }, wire: { '--np-ink': GREY } }, { design: [], wire: [] })]);
    assert.equal(vars.in('wire').color(fill('rgb(25, 24, 22)', ['--np-ink'])).variable, undefined);
  });
});

describe('the collections', () => {
  it('give every Bento token a twin of one name, aliasing it where the prints agree, and hold no empty primitives collection', () => {
    const vars = new Variables([pageOf({ design: { '--np-ink': INK }, wire: { '--np-ink': INK } }, { design: [], wire: [] })]);
    vars.in('design').color(fill('rgb(25, 24, 22)', ['--np-ink']));
    const collections = vars.build();
    assert.deepEqual(
      collections.map((one) => [one.key, one.name]),
      [
        ['bento', 'Bento'],
        ['bento-wire', 'Bento wire'],
      ]
    );
    const twin = collection(collections, 'bento-wire').get('wire:--np-ink');
    assert.deepEqual([twin?.name, twin?.type, twin?.scopes, twin?.value], ['np/ink', 'COLOR', ['FRAME_FILL'], { kind: 'alias', key: '--np-ink' }]);
  });

  it('hold the wire print’s own value where the prints differ: its literal, the twin its chain aliases, or a primitive both share', () => {
    const tokens = {
      design: { '--bento-mark': RED, '--bento-edge': RED, '--np-red': RED, '--np-ink': INK, '--np-line': RED },
      wire: { '--bento-mark': INK, '--bento-edge': GREY, '--np-red': RED, '--np-ink': INK, '--np-line': GREY },
    };
    const chains = { design: [['--bento-mark', '--np-red'], ['--bento-edge', '--np-line']], wire: [['--bento-mark', '--np-ink'], ['--bento-edge', '--np-line']] };
    const vars = new Variables([pageOf(tokens, chains)]);
    vars.in('design').color(fill('rgb(217, 46, 29)', ['--bento-mark', '--np-red']));
    vars.in('design').color(fill('rgb(217, 46, 29)', ['--bento-edge', '--np-line']));
    const collections = vars.build();
    const [press, bento, wire] = ['press', 'bento', 'bento-wire'].map((key) => collection(collections, key));
    // Both prints read --np-red and --np-ink alike and nothing binds them: primitives, in Press alone.
    assert.deepEqual([...press!.keys()].sort(), ['--np-ink', '--np-red']);
    assert.deepEqual(bento!.get('--bento-mark')?.value, { kind: 'alias', key: '--np-red' });
    assert.deepEqual(wire!.get('wire:--bento-mark')?.value, { kind: 'alias', key: '--np-ink' });
    // --np-line differs by print, so it is a Bento token with a twin, and the wire chain aliases that twin.
    assert.deepEqual(wire!.get('wire:--bento-edge')?.value, { kind: 'alias', key: 'wire:--np-line' });
    assert.deepEqual(wire!.get('wire:--np-line')?.value, { kind: 'color', rgba: [115 / 255, 115 / 255, 115 / 255, 1] });
    assert.deepEqual([...wire!.keys()], [...bento!.keys()].map((key) => `wire:${key}`));
  });
});
