/**
 * Text styles (docs/redesign/FIGMA_PRINT.md §3.2, §6): one per type, shared by both
 * prints while it binds nothing, and one per print where it binds its size.
 *
 *   node --test scripts/design/figma-print/plan/type.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { strutted, TextStyles, type Type } from './type.mts';

const title: Type = { family: 'Heebo', weight: 700, italic: false, size: 24, lineHeight: 28, letterSpacing: 0 };

describe('text styles', () => {
  it('give both prints one style for a type whose size binds nothing', () => {
    const styles = new TextStyles();
    assert.equal(styles.use(title, 'Bento.title', 'wide'), styles.use(title, 'Bento.title', 'wide'));
    assert.deepEqual(
      styles.build().styles.map((style) => style.name),
      ['Bento.title']
    );
  });

  it('give each print its own style where the size binds its print’s variable, the wire one named for its design twin', () => {
    const styles = new TextStyles();
    const design = styles.use(title, 'Bento.title', 'wide', '--np-size-xl');
    const wire = styles.use(title, 'Bento.title', 'wide', 'wire:--np-size-xl');
    assert.equal(wire, `wire:${design}`);
    assert.deepEqual(
      styles.build().styles.map((style) => [style.key === wire ? 'wire' : 'design', style.name, style.bind?.fontSize]),
      [
        ['design', 'Bento.title', '--np-size-xl'],
        ['wire', 'Bento.title · wire', 'wire:--np-size-xl'],
      ]
    );
  });
});

describe('the strut', () => {
  const type = (size: number, lineHeight: number | null): Type => ({ family: 'Assistant', weight: 400, italic: false, size, lineHeight, letterSpacing: 0 });

  it('holds a smaller run at its block line height, as CSS holds every line box', () => {
    assert.deepEqual(strutted(type(13.33, 19.99), type(16, 24)), type(13.33, 24));
  });

  it('keeps a run taller than its block, and a normal line height, as they are', () => {
    assert.deepEqual(strutted(type(20, 30), type(16, 24)), type(20, 30));
    assert.deepEqual(strutted(type(13.33, null), type(16, 24)), type(13.33, null));
    assert.deepEqual(strutted(type(13.33, 19.99), type(16, null)), type(13.33, 19.99));
  });
});
