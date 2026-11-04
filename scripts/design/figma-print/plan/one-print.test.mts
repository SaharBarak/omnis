/**
 * One print (docs/redesign/FIGMA_PRINT.md §6): the wireframes page's table
 * has no twins, so its tokens make one collection, its components carry no
 * print axis, and every main is of the one print.
 *
 *   node --test scripts/design/figma-print/plan/one-print.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { COLLECTION_OF, PRIMARY, PRINT_AXIS, PRINTS, printOfVariant, TWINS } from './prints.mts';
import type { RawBinding, RawPage } from './raw.mts';
import { type Measured, twinOf, Variables } from './tokens.mts';

const INK = '#222222';

/** A page whose stage holds the wireframe ink, and whose one element authored `chain`. */
const pageOf = (chain: readonly string[]): RawPage =>
  ({ viewport: 'wide', prints: { wire: { tokens: { '--wf-ink': INK }, nodes: { '0': { s: 0, bind: { color: { value: '', chains: [chain] } } } }, pseudo: {} } } }) as unknown as RawPage;

const fill = (computed: string, chain: readonly string[]): Measured => {
  const binding: RawBinding = { value: `var(${chain[0]})`, chains: [chain] };
  return { kind: 'color', computed, binding, viewport: 'wide', scope: 'FRAME_FILL' };
};

describe('one print', () => {
  it('is the primary print, with no twins and no print axis', () => {
    assert.deepEqual(PRINTS, ['wire']);
    assert.equal(PRIMARY, 'wire');
    assert.deepEqual(TWINS, []);
    assert.equal(PRINT_AXIS, null);
    assert.deepEqual(COLLECTION_OF, { wire: 'wireframe' });
  });

  it('names every main by the one print, whatever its values', () => {
    assert.equal(printOfVariant({}), 'wire');
    assert.equal(printOfVariant({ size: 'lg' }), 'wire');
  });

  it('binds a token by its own key, with no twin prefix', () => {
    assert.equal(twinOf('--wf-ink', 'wire'), '--wf-ink');
    const vars = new Variables([pageOf(['--wf-ink'])]);
    assert.equal(vars.in('wire').color(fill('rgb(34, 34, 34)', ['--wf-ink'])).variable, '--wf-ink');
  });

  it('builds one collection, named as the print table names it, with no empty primitives', () => {
    const vars = new Variables([pageOf(['--wf-ink'])]);
    vars.in('wire').color(fill('rgb(34, 34, 34)', ['--wf-ink']));
    const collections = vars.build();
    assert.deepEqual(
      collections.map((one) => [one.key, one.name, one.variables.map((variable) => variable.name)]),
      [['wireframe', 'Wireframe', ['wf/ink']]]
    );
  });
});
