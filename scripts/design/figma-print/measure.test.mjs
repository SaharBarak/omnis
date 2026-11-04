/**
 * The measure's pure halves (docs/redesign/FIGMA_PRINT.md §3.1), on answers built by
 * hand: the structure both prints share, the DevTools reads and what they
 * count, and the data hold. The shapes of the CDP and DOMSnapshot answers are
 * the ones headless Chromium gives.
 *
 *   node --test scripts/design/figma-print/measure.test.mjs
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { keywordsOf } from './cascade.mjs';
import { boxOfQuad, generatedOf, inBatches, paintsPseudo, readProtocol, readsLine } from './protocol.mjs';
import { mergeStructure, spliceAfter, structureOf } from './structure.mjs';

/** A walked element: its id, parent, DOM index, box and kids. */
const element = (id, parent, at, box, kids) => ({ id, parent, index: 0, at, tag: 'div', cls: [`c${id}`], data: {}, attrs: {}, box, style: 0, ...(kids ? { kids } : {}) });
const ids = (node) => (node.kids ?? []).map((kid) => kid.id ?? `"${kid.text}"`);

describe('the structure both prints share', () => {
  const of = (...names) => names.map((name) => (name.startsWith('"') ? { text: name.slice(1, -1) } : { id: name }));
  const named = (kids) => kids.map((kid) => kid.id ?? `"${kid.text}"`);

  it('splices a new child after the nearest preceding sibling the parent holds', () => {
    const kids = of('a', 'b');
    assert.deepEqual(named(spliceAfter(kids, { id: 'x' }, of('a'))), ['a', 'x', 'b']);
    assert.deepEqual(named(spliceAfter(kids, { id: 'x' }, of('a', 'gone'))), ['a', 'x', 'b']);
    assert.deepEqual(named(spliceAfter(kids, { id: 'x' }, of('b', 'a'))), ['a', 'x', 'b']);
  });

  it('splices it first when no preceding sibling is in the parent', () => {
    assert.deepEqual(named(spliceAfter(of('"t"', 'b'), { id: 'x' }, [])), ['x', '"t"', 'b']);
    assert.deepEqual(named(spliceAfter(of('b'), { id: 'x' }, of('elsewhere'))), ['x', 'b']);
  });

  it('splices it past the texts the wire parent puts between its anchor and it', () => {
    assert.deepEqual(named(spliceAfter(of('"lead"', 'b'), { id: 'x' }, of('"lead"'))), ['"lead"', 'x', 'b']);
    assert.deepEqual(named(spliceAfter(of('a', '"one"', '"two"', 'b'), { id: 'x' }, of('a', '"one"'))), ['a', '"one"', 'x', '"two"', 'b']);
    // A text the design parent does not hold there is passed by no more than the texts it has.
    assert.deepEqual(named(spliceAfter(of('a', 'b'), { id: 'x' }, of('a', '"only wire"'))), ['a', 'x', 'b']);
  });

  it('places a wire-only element by its wire neighbours, whatever the DOM indexes of the two DOMs say', () => {
    // The design DOM numbers its children 0 and 1; the wire DOM, with a text node between, numbers them 0, 2 and 4.
    const design = structureOf(element('0', null, 0, [0, 0, 100, 100], [element('1', '0', 0, [0, 0, 100, 10]), element('2', '0', 1, [0, 10, 100, 10])]));
    const wire = element('0', null, 0, [0, 0, 100, 100], [element('1', '0', 0, [0, 0, 100, 10]), element('9', '0', 4, [0, 10, 100, 0]), element('2', '0', 2, [0, 10, 100, 10])]);
    mergeStructure(design, wire);
    assert.deepEqual(ids(design), ['1', '9', '2']);
  });

  it('keeps a wire-only element after a text that precedes it in both DOMs', () => {
    const design = structureOf(element('0', null, 0, [0, 0, 100, 100], [{ text: 'lead', at: 0, lines: [] }, element('2', '0', 1, [0, 10, 100, 10])]));
    const wire = element('0', null, 0, [0, 0, 100, 100], [{ text: 'lead', at: 0, lines: [] }, element('9', '0', 1, [0, 0, 1, 1]), element('2', '0', 2, [0, 10, 100, 10])]);
    mergeStructure(design, wire);
    assert.deepEqual(ids(design), ['"lead"', '9', '2']);
  });

  it('keeps consecutive wire-only elements in their wire order, and puts one with no known neighbour first', () => {
    const design = structureOf(element('0', null, 0, [0, 0, 100, 100], [{ text: 'lead', at: 0, lines: [] }, element('2', '0', 1, [0, 10, 100, 10])]));
    const wire = element('0', null, 0, [0, 0, 100, 100], [element('7', '0', 0, [0, 0, 1, 1]), element('8', '0', 1, [0, 0, 1, 1]), element('2', '0', 2, [0, 10, 100, 10])]);
    mergeStructure(design, wire);
    assert.deepEqual(ids(design), ['7', '8', '"lead"', '2']);
  });

  it('counts the boxes the wire read moved, and gives a box the design print hides its wire box and children', () => {
    const hidden = { ...element('3', '0', 2, [0, 0, 0, 0]), none: true };
    const design = structureOf(element('0', null, 0, [0, 0, 100, 100], [element('1', '0', 0, [0, 0, 100, 10]), element('2', '0', 1, [0, 10, 100, 10]), hidden]));
    const wire = element('0', null, 0, [0, 0, 100, 100], [element('1', '0', 0, [0, 0, 100, 10]), element('2', '0', 1, [0, 12, 100, 10]), element('3', '0', 2, [0, 30, 50, 5], [element('4', '3', 0, [0, 30, 5, 5])])]);
    const geometry = mergeStructure(design, wire);
    assert.equal(geometry.moved, 1);
    assert.equal(geometry.maxDelta, 2);
    assert.deepEqual(geometry.samples, [{ id: '2', tag: 'div', cls: ['c2'], design: [0, 10, 100, 10], wire: [0, 12, 100, 10] }]);
    const shown = design.kids.find((kid) => kid.id === '3');
    assert.deepEqual([shown.box, shown.none, ids(shown)], [[0, 30, 50, 5], undefined, ['4']]);
  });
});

/** A computed style of a pseudo-element that paints no box of its own. */
const bare = (content) => ({ content, display: 'inline', 'background-color': 'rgba(0, 0, 0, 0)', 'background-image': 'none', 'box-shadow': 'none', ...Object.fromEntries(['top', 'right', 'bottom', 'left'].flatMap((side) => [[`border-${side}-width`, '0px'], [`border-${side}-style`, 'none']])) });

describe('a painting pseudo-element', () => {
  it('paints with any generated text: a string, a counter, an attribute, a quote', () => {
    for (const [content, text] of [['"str"', 'str'], ['counter(c) ". "', '3. '], ['attr(data-x)', 'hi'], ['open-quote', '“']]) assert.equal(paintsPseudo(bare(content), { text, image: false }), true, content);
  });

  it('paints with a generated image', () => {
    assert.equal(paintsPseudo(bare('url("a.svg")'), { text: '', image: true }), true);
  });

  it('does not paint with nothing generated and no box paint: an empty string, a blank, a missing attribute', () => {
    for (const [content, text] of [['""', ''], ['" "', ' '], ['attr(data-missing)', '']]) assert.equal(paintsPseudo(bare(content), { text, image: false }), false, content);
  });

  it('paints a box of its own whatever its content generates, and never without content', () => {
    assert.equal(paintsPseudo({ ...bare('""'), 'background-color': 'rgb(0, 0, 0)' }), true);
    assert.equal(paintsPseudo({ ...bare('""'), 'border-top-width': '1px', 'border-top-style': 'solid' }), true);
    assert.equal(paintsPseudo({ ...bare('none'), 'background-color': 'rgb(0, 0, 0)' }), false);
  });
});

/**
 * A DOMSnapshot answer for pseudo-elements by backend node id: each with its
 * own box and the layout entries its content generated, as `[text, bounds]`.
 */
function snapshotOf(pseudos) {
  const strings = [];
  const at = (text) => (text === null ? -1 : strings.push(text) - 1);
  const nodes = { backendNodeId: [500], pseudoType: { index: [], value: [] } };
  const layout = { nodeIndex: [0], bounds: [[0, 0, 100, 100]], text: [-1] };
  for (const [backend, own, made] of pseudos) {
    const node = nodes.backendNodeId.push(backend) - 1;
    nodes.pseudoType.index.push(node);
    for (const [text, bounds] of [[null, own], ...made]) {
      layout.nodeIndex.push(node);
      layout.bounds.push(bounds);
      layout.text.push(at(text));
    }
  }
  return { documents: [{ nodes, layout }], strings };
}

describe('what a pseudo-element generates', () => {
  it('is the text its content laid out and whether it laid out an image, read past its own box', () => {
    const generated = generatedOf(
      snapshotOf([
        [11, [0, 18, 16, 18], [['3', [0, 18, 8, 18]], ['. ', [8, 18, 8, 18]]]],
        [12, [0, 54, 10, 18], [[null, [0, 58, 10, 10]]]],
        [13, [0, 72, 0, 18], [[null, [0, 0, 0, 0]]]],
      ])
    );
    assert.deepEqual(generated.get(11), { text: '3. ', image: false });
    assert.deepEqual(generated.get(12), { text: '', image: true });
    assert.deepEqual(generated.get(13), { text: '', image: false });
    assert.equal(generated.has(500), false);
  });
});

describe('a pseudo-element box', () => {
  it('moves from the viewport, where DOM.getBoxModel answers, into the document, where the walker reads', () => {
    assert.deepEqual(boxOfQuad([0, 667, 16, 667, 16, 685, 0, 685], [0, 1500]), [0, 2167, 16, 18]);
    assert.deepEqual(boxOfQuad([10, 20, 30, 20, 30, 40, 10, 40], [5, 0]), [15, 20, 20, 20]);
  });

  it('rounds to Chrome layout unit', () => {
    assert.deepEqual(boxOfQuad([0.005, 0, 1, 0, 1, 1, 0.005, 1], [0, 0]), [0, 0, 1, 1]);
    assert.deepEqual(boxOfQuad([0.01, 0, 1, 0, 1, 1, 0.01, 1], [0, 0]), [1 / 64, 0, 63 / 64, 1]);
  });
});

describe('batched reads', () => {
  it('keep every result in order and turn a throw into its error', async () => {
    const results = await inBatches([1, 2, 3], async (n) => (n === 2 ? Promise.reject(new Error('boom')) : n * 10), 2);
    assert.deepEqual(results, [10, { error: 'boom' }, 30]);
  });
});

/** An author rule for a matched-styles answer. */
const rule = (declarations) => ({ rule: { origin: 'regular', style: { cssProperties: Object.entries(declarations).map(([name, value]) => ({ name, value })) } } });

describe('the DevTools reads of a print', () => {
  // The walk names 0 (with 1 and 2 under it) and 9, which the document no longer holds.
  const walked = {
    styles: [{ direction: 'rtl', position: 'static' }],
    root: { id: '0', style: 0, kids: [{ id: '1', style: 0, kids: [{ text: 'שלום', at: 0, lines: [] }] }, { id: '2', style: 0 }, { id: '9', style: 0 }] },
  };
  const documentNode = {
    nodeId: 1,
    children: [
      { nodeId: 10, attributes: ['data-fp', '0'], children: [] },
      { nodeId: 11, attributes: ['data-fp', '1'], pseudoElements: [{ nodeId: 111, backendNodeId: 11, pseudoType: 'before' }, { nodeId: 112, backendNodeId: 14, pseudoType: 'after' }] },
      { nodeId: 12, attributes: ['class', 'x', 'data-fp', '2'], pseudoElements: [{ nodeId: 121, backendNodeId: 12, pseudoType: 'before' }, { nodeId: 122, backendNodeId: 13, pseudoType: 'after' }] },
    ],
  };
  const pseudoMatch = { matchedCSSRules: [rule({ 'margin-inline-start': 'auto', color: 'var(--np-ink)' })], inherited: [] };
  const answers = {
    'DOM.getDocument': () => ({ root: documentNode }),
    'CSS.getMatchedStylesForNode': ({ nodeId }) => {
      if (nodeId === 12) throw new Error('Protocol error (CSS.getMatchedStylesForNode): boom');
      return nodeId > 100 ? pseudoMatch : { matchedCSSRules: [rule({ color: 'var(--np-ink)' })], inherited: [] };
    },
    'CSS.getPlatformFontsForNode': () => ({ fonts: [{ familyName: 'Assistant', glyphCount: 1 }, { familyName: 'Heebo', glyphCount: 4 }] }),
    // 11 counts, 12 lays out nothing, 13 has no layout box, 14 lays out text but has no box model.
    'DOMSnapshot.captureSnapshot': () =>
      snapshotOf([
        [11, [0, 10, 16, 18], [['3', [0, 10, 8, 18]]]],
        [12, [0, 0, 0, 18], [[null, [0, 0, 0, 0]]]],
        [14, [0, 0, 8, 18], [['x', [0, 0, 8, 18]]]],
      ]),
    'CSS.getComputedStyleForNode': () => ({ computedStyle: Object.entries({ ...bare('counter(c)'), position: 'absolute' }).map(([name, value]) => ({ name, value })) }),
    'DOM.getBoxModel': ({ nodeId }) => {
      if (nodeId === 112) throw new Error('Protocol error (DOM.getBoxModel): Could not compute box model.');
      return { model: { border: [0, 10, 16, 10, 16, 28, 0, 28] } };
    },
  };
  const calls = [];
  const cdp = {
    send: async (method, params) => {
      calls.push([method, params?.nodeId]);
      return answers[method](params);
    },
  };

  it('counts each element the document no longer holds and each read that failed, with examples', async () => {
    const { reads } = await readProtocol(cdp, walked, [0, 100]);
    assert.equal(reads.misses, 1);
    assert.equal(reads.errors, 2);
    assert.deepEqual(reads.samples, ['9: not in the document', '2 matched styles: Protocol error (CSS.getMatchedStylesForNode): boom', '1::after: Protocol error (DOM.getBoxModel): Could not compute box model.']);
  });

  it('keeps what answered: bindings, the face drawn most, and the painting pseudo-element in document space with its keywords and text', async () => {
    const { perNode, pseudo } = await readProtocol(cdp, walked, [0, 100]);
    assert.deepEqual(perNode['0'].bind.color.chains, [['--np-ink']]);
    assert.equal(perNode['1'].face, 'Heebo');
    assert.equal(perNode['2'], undefined);
    const keywords = keywordsOf(pseudoMatch, 'rtl');
    assert.ok(Object.keys(keywords).length > 0);
    assert.deepEqual(pseudo['1'], [{ kind: 'before', box: [0, 110, 16, 18], style: { ...bare('counter(c)'), position: 'absolute' }, bind: pseudo['1'][0].bind, keywords, text: '3' }]);
    assert.equal(pseudo['2'], undefined);
  });

  it('reads no box of a pseudo-element without layout, nor of one that paints nothing', async () => {
    calls.length = 0;
    await readProtocol(cdp, walked, [0, 0]);
    const boxed = calls.filter(([method]) => method === 'DOM.getBoxModel').map(([, nodeId]) => nodeId);
    assert.deepEqual(boxed.sort(), [111, 112]);
  });

  it('counts a failed layout snapshot, and reads the pseudo-elements by their box paints alone', async () => {
    const broken = { send: async (method, params) => (method === 'DOMSnapshot.captureSnapshot' ? Promise.reject(new Error('snapshot gone')) : answers[method](params)) };
    const { reads, pseudo } = await readProtocol(broken, walked, [0, 0]);
    assert.ok(reads.samples.includes('DOMSnapshot.captureSnapshot: snapshot gone'));
    assert.deepEqual(pseudo, {});
  });

  it('show on the measure line only when a print missed or failed one', () => {
    assert.equal(readsLine({ design: { misses: 0, errors: 0, samples: [] }, wire: { misses: 0, errors: 0, samples: [] } }), '');
    assert.equal(readsLine({ design: { misses: 0, errors: 0, samples: [] }, wire: { misses: 2, errors: 1, samples: [] } }), ', wire reads 2 missed 1 failed');
  });
});
