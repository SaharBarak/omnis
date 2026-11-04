/**
 * Whether a raw tree was read whole (docs/redesign/FIGMA_PRINT.md §3.1): the record the
 * measure keeps of each read, and the faults the plan refuses a tree for.
 *
 *   node --test scripts/design/figma-print/plan/raw.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { faultsOf, mixesOf, projectionOf, whyNotDev, type RawPage, type RawPrint, type RawRead } from './raw.mts';

const whole: RawRead = {
  settled: { design: true, wire: true },
  restless: { design: 0, wire: 0 },
  geometry: { moved: 0, maxDelta: 0, samples: [] },
  reads: { design: { misses: 0, errors: 0, samples: [] }, wire: { misses: 0, errors: 0, samples: [] } },
};

describe('a raw tree read whole', () => {
  it('has no fault', () => {
    assert.deepEqual(faultsOf(whole), []);
  });

  it('may still show the wire read nudged a box by half a pixel or less, which the merge does not count', () => {
    assert.deepEqual(faultsOf({ ...whole, geometry: { moved: 0, maxDelta: 0.5, samples: [] } }), []);
  });
});

describe('a raw tree not read whole', () => {
  it('names the boxes the wire read moved, with the first', () => {
    const geometry = { moved: 3, maxDelta: 12, samples: [{ id: '812', tag: 'div', cls: ['tile', 'wide'], print: 'wire', primary: [0, 10, 100, 20] as const, twin: [0, 22, 100, 20] as const }] };
    assert.deepEqual(faultsOf({ ...whole, geometry }), [{ why: 'boxes moved between the prints', detail: '3, up to 12px; first 812 div.tile.wide [0, 10, 100, 20] -> wire [0, 22, 100, 20]' }]);
  });

  it('names the prints that did not settle and the scrollers left off their start', () => {
    assert.deepEqual(faultsOf({ ...whole, settled: { design: true, wire: false }, restless: { design: 2, wire: 0 } }), [
      { why: 'the page did not settle', detail: 'wire' },
      { why: 'scrollers off their start', detail: 'design 2' },
    ]);
  });

  it('names the DevTools reads that missed or failed, with the first', () => {
    const reads = { design: { misses: 0, errors: 0, samples: [] }, wire: { misses: 1, errors: 2, samples: ['9: not in the document', '2 matched styles: boom'] } };
    assert.deepEqual(faultsOf({ ...whole, reads }), [{ why: 'DevTools reads missed or failed', detail: 'wire 1 missed 2 failed; first 9: not in the document' }]);
  });

  it('is a tree with no record of how it was read', () => {
    const { reads: _reads, ...older } = whole;
    assert.deepEqual(faultsOf(older), [{ why: 'no record of how it was read', detail: 'no reads' }]);
    assert.deepEqual(faultsOf({}), [{ why: 'no record of how it was read', detail: 'no settled, restless, geometry, reads' }]);
  });
});

const DEV = { version: '16.2.9', dev: true } as const;
const stamp = (buildId: string | null, browser?: string, next: RawPage['stamp']['next'] = DEV): RawPage['stamp'] => ({ commit: 'c0ffee', dirty: [], base: 'http://localhost:3100', buildId, measuredAt: '2026-10-28T00:00:00.000Z', next, ...(browser ? { browser } : {}) });

describe('trees planned together', () => {
  it('come from one build, read by one browser', () => {
    assert.deepEqual(mixesOf([stamp('b1', '143.0.7499.4'), stamp('b1', '143.0.7499.4')]), []);
  });

  it('are refused from two builds, or read by two browsers, naming how many trees each read', () => {
    assert.deepEqual(mixesOf([stamp('b1', '143.0.7499.4'), stamp('b2', '143.0.7499.4')]), ['the trees come from 2 builds; measure them against one']);
    assert.deepEqual(mixesOf([stamp('b1', '143.0.7499.4'), stamp('b1', '143.0.7499.4'), stamp('b1', '144.0.7559.2')]), ['the trees were read by 2 browsers (143.0.7499.4: 2, 144.0.7559.2: 1); measure them with one']);
  });

  it('are refused from two Next versions', () => {
    assert.deepEqual(mixesOf([stamp('b1', '143.0.7499.4'), stamp('b1', '143.0.7499.4', { version: '16.3.0', dev: true })]), ['the trees were served by 2 Next versions (16.2.9: 1, 16.3.0: 1); measure them against one']);
  });

  it('count a tree with no browser stamped as read by another', () => {
    assert.deepEqual(mixesOf([stamp('b1', '143.0.7499.4'), stamp('b1')]), ['the trees were read by 2 browsers (143.0.7499.4: 1, no browser stamped: 1); measure them with one']);
  });
});

describe('the server a tree was read from', () => {
  it('is the dev server', () => {
    assert.deepEqual(whyNotDev(stamp('development')), []);
  });

  it('refuses a production server, or no record of one', () => {
    assert.deepEqual(whyNotDev(stamp('b1', undefined, { version: '16.2.9', dev: false })), ['read from a production server (Next 16.2.9)']);
    const { next: _next, ...unrecorded } = stamp('b1');
    assert.deepEqual(whyNotDev(unrecorded), ['no record of the server it was read from']);
  });
});

describe('a print of a tree', () => {
  it('holds that print’s styles, tokens, nodes and pseudo-elements alone, with what both share', () => {
    const printOf = (ink: string): RawPrint => ({ styles: [{ color: ink }], tokens: { '--np-ink': ink }, nodes: { '0': { s: 0 } }, pseudo: {} });
    const page = { ...whole, route: '/', viewport: 'wide', prints: { design: printOf('#191816'), wire: printOf('#737373') } } as unknown as RawPage;
    const wire = projectionOf(page, 'wire');
    assert.deepEqual([wire.print, wire.route, wire.tokens, wire.styles], ['wire', '/', { '--np-ink': '#737373' }, [{ color: '#737373' }]]);
    assert.equal('prints' in wire, false);
  });
});
