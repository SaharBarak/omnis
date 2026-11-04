/**
 * Effect styles (docs/redesign/FIGMA_PRINT.md §6): one per shadow token, one per
 * viewport where the token's value differs between them, and one of the wire
 * print's own where it draws the token otherwise.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EffectStyles } from './effects.mts';
import type { RawPage } from './raw.mts';
import type { EffectSpec } from './schema.mts';

const pageAt = (viewport: 'wide' | 'narrow', tokens: Record<string, string>, wire: Record<string, string> = tokens): RawPage => ({ viewport, prints: { design: { tokens }, wire: { tokens: wire } } }) as unknown as RawPage;
const shadow = (blur: number, variable?: string): EffectSpec[] => [{ type: 'DROP_SHADOW', color: { rgba: [0, 0, 0, 0.1], ...(variable ? { variable } : {}) }, offset: [0, 1], radius: blur, spread: 0 }];

describe('effect styles', () => {
  it('share one style for a token alike at both viewports', () => {
    const styles = new EffectStyles([pageAt('wide', { '--np-shadow': '0 1px 2px #0001' }), pageAt('narrow', { '--np-shadow': '0 1px 2px #0001' })]);
    assert.equal(styles.use('--np-shadow', shadow(2), 'wide', 'design'), styles.use('--np-shadow', shadow(2), 'narrow', 'design'));
    assert.equal(styles.build().length, 1);
  });

  it('give a token that differs by viewport a style at each', () => {
    const styles = new EffectStyles([pageAt('wide', { '--np-shadow': '0 2px 8px #0002' }), pageAt('narrow', { '--np-shadow': '0 1px 2px #0001' })]);
    const wide = styles.use('--np-shadow', shadow(8), 'wide', 'design');
    const narrow = styles.use('--np-shadow', shadow(2), 'narrow', 'design');
    assert.notEqual(wide, narrow);
    assert.deepEqual(
      styles.build().map((style) => [style.key, style.effects[0]?.radius]),
      [
        ['effect:--np-shadow@narrow', 2],
        ['effect:--np-shadow@wide', 8],
      ]
    );
  });

  it('share the design style with the wire print where it draws the token alike and binds nothing', () => {
    const styles = new EffectStyles([pageAt('wide', { '--np-shadow': '0 1px 2px #0001' })]);
    assert.equal(styles.use('--np-shadow', shadow(2), 'wide', 'wire'), styles.use('--np-shadow', shadow(2), 'wide', 'design'));
    assert.equal(styles.build().length, 1);
  });

  it('give the wire print a style of its own where it draws the token otherwise, or binds its own variables', () => {
    const differs = new EffectStyles([pageAt('wide', { '--np-shadow': '0 1px 2px #0001' }, { '--np-shadow': '0 0 0 1px #000' })]);
    differs.use('--np-shadow', shadow(2), 'wide', 'design');
    differs.use('--np-shadow', shadow(0), 'wide', 'wire');
    assert.deepEqual(
      differs.build().map((style) => [style.key, style.name]),
      [
        ['effect:--np-shadow', 'np/shadow'],
        ['wire:effect:--np-shadow', 'np/shadow · wire'],
      ]
    );
    const binds = new EffectStyles([pageAt('wide', { '--np-shadow': '0 1px 2px #0001' })]);
    assert.equal(binds.use('--np-shadow', shadow(2, 'wire:--np-ink'), 'wide', 'wire'), 'wire:effect:--np-shadow');
  });

  it('keep the wire print off a design style that binds variables of the design print', () => {
    const styles = new EffectStyles([pageAt('wide', { '--np-shadow': '0 1px 2px #0001' })]);
    const design = styles.use('--np-shadow', shadow(2, '--np-ink'), 'wide', 'design');
    const wire = styles.use('--np-shadow', shadow(2), 'wide', 'wire');
    assert.equal(design, 'effect:--np-shadow');
    assert.equal(wire, 'wire:effect:--np-shadow');
  });
});
