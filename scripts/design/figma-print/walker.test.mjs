/**
 * The walker's drawings and root (docs/redesign/FIGMA_PRINT.md §3.1), read in
 * Chromium: an SVG comes out self-contained, as Figma's importer needs it,
 * and a page prints only from its one root.
 *
 *   node --test scripts/design/figma-print/walker.test.mjs
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { chromium } from 'playwright';
import { PLACEHOLDER_PROPS, STYLE_PROPS } from './config.mjs';
import { LAYOUT_UNIT, walk } from './walker.mjs';

const OPTIONS = { root: '[data-print]', styleProps: STYLE_PROPS, placeholderProps: PLACEHOLDER_PROPS, layoutUnit: LAYOUT_UNIT };

const DRAWING = `
  <style>
    :root { --ink: #222222; --note: #3b5bdb; }
    .line { stroke: var(--note); stroke-width: 2; fill: none; }
    .head { fill: var(--note); }
    .bold { stroke: var(--ink); stroke-width: 2; fill: none; }
    .label { font-family: Georgia, serif; font-size: 9px; font-weight: 600; fill: var(--ink); }
  </style>
  <div data-print="wire">
    <svg viewBox="0 0 100 100" width="100" height="100">
      <defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" class="head" /></marker></defs>
      <g style="--arrow: url(#arrow)">
        <line x1="10" y1="50" x2="90" y2="50" class="line" style="marker-end: var(--arrow)" />
        <line x1="10" y1="30" x2="90" y2="30" class="line" style="marker-start: var(--arrow); marker-end: var(--arrow)" />
        <path d="M10 10 L90 10" class="bold" pathLength="1" stroke-dasharray="0.5 1" />
        <text x="50" y="80" class="label" text-anchor="middle">Label</text>
      </g>
    </svg>
  </div>`;

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(() => browser?.close());

const walked = async (html) => {
  const page = await browser.newPage();
  try {
    await page.setContent(html);
    return await page.evaluate(walk, OPTIONS);
  } finally {
    await page.close();
  }
};

const svgNodeOf = (tree) => {
  const stack = [tree];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.svg) return node;
    stack.push(...(node.kids ?? []).filter((kid) => kid.text === undefined));
  }
  return null;
};

describe('a drawing', () => {
  it('expands a marker into shapes at the end it marks and drops the marker', async () => {
    const { markup } = { markup: svgNodeOf((await walked(DRAWING)).root).svg };
    assert.doesNotMatch(markup, /marker-end|<marker/);
    assert.match(markup, /<g transform="translate\(90 50\) rotate\(0\) scale\(2\) translate\(-6\.125 -3\.5\)" opacity="1"><g transform="matrix\(0\.875 0 0 0\.875 0 0\)"><path d="M0 0 L8 4 L0 8 Z" fill="rgb\(59, 91, 219\)"/);
  });

  it('rescales a pathLength dash to the shape’s own length', async () => {
    const markup = svgNodeOf((await walked(DRAWING)).root).svg;
    const path = /<path d="M10 10 L90 10"[^>]*>/.exec(markup)?.[0] ?? '';
    assert.match(path, /stroke-dasharray="40 80"/);
    assert.doesNotMatch(path, /pathLength/i);
  });

  it('writes a text’s computed type onto it', async () => {
    const markup = svgNodeOf((await walked(DRAWING)).root).svg;
    const text = /<text[^>]*>/.exec(markup)?.[0] ?? '';
    assert.match(text, /font-family="Georgia, serif"/);
    assert.match(text, /font-size="9px"/);
    assert.match(text, /font-weight="600"/);
    assert.match(text, /text-anchor="middle"/);
  });

  it('names each shape by its node id and lists its computed paints', async () => {
    const node = svgNodeOf((await walked(DRAWING)).root);
    for (const shape of node.shapes) for (const layer of shape.layers) assert.match(node.svg, new RegExp(`id="${layer.replace('.', '\\.')}"`));
    assert.deepEqual(
      node.shapes.map((shape) => [shape.cls[0], shape.stroke, shape.fill]),
      [
        ['line', 'rgb(59, 91, 219)', 'none'],
        ['head', 'none', 'rgb(59, 91, 219)'],
        ['line', 'rgb(59, 91, 219)', 'none'],
        ['bold', 'rgb(34, 34, 34)', 'none'],
        ['label', 'none', 'rgb(34, 34, 34)'],
      ]
    );
  });

  it('draws a marker’s shape once per end it marks, each copy a layer of its own', async () => {
    const node = svgNodeOf((await walked(DRAWING)).root);
    const head = node.shapes.find((shape) => shape.cls[0] === 'head');
    assert.deepEqual(head?.layers, [`fp-${head?.id}`, `fp-${head?.id}.1`, `fp-${head?.id}.2`]);
    assert.equal(new Set([...node.svg.matchAll(/id="([^"]+)"/g)].map((match) => match[1])).size, [...node.svg.matchAll(/id="/g)].length);
  });

  it('leaves a container its opacity only: its shapes carry the paints it would pass down', async () => {
    const group = /<g(?! transform)[^>]*>/.exec(svgNodeOf((await walked(DRAWING)).root).svg)?.[0] ?? '';
    assert.match(group, /opacity="1"/);
    assert.doesNotMatch(group, /\b(fill|stroke)=/);
  });
});

/** One drawing in a print root, with `css` for it. */
const drawingOf = (body, css = '') => `<style>${css}</style><div data-print="wire"><svg viewBox="0 0 100 100" width="100" height="100">${body}</svg></div>`;
const ARROW = '<marker id="a" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker>';
const tagsOf = (markup, tag) => [...markup.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map((match) => match[0]);

describe('a drawing’s transforms', () => {
  it('writes a CSS transform as the element’s own matrix', async () => {
    const node = svgNodeOf((await walked(drawingOf('<rect class="moved" x="0" y="0" width="10" height="10" />', '.moved { transform: translate(5px, 6px); }'))).root);
    assert.match(tagsOf(node.svg, 'rect')[0], /transform="matrix\(1 0 0 1 5 6\)"/);
  });

  it('puts a marker in the transform of the shape it marks', async () => {
    const node = svgNodeOf((await walked(drawingOf(`<defs>${ARROW}</defs><line x1="10" y1="50" x2="90" y2="50" transform="rotate(90 50 50)" stroke="black" marker-end="url(#a)" />`))).root);
    assert.match(node.svg, /<g transform="matrix\(0 1 -1 0 100 0\) translate\(90 50\) rotate\(0\)/);
  });

  it('fits a marker’s viewBox by its preserveAspectRatio', async () => {
    const marker = (fit) => `<marker id="w" viewBox="0 0 10 5" refX="0" refY="0" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" preserveAspectRatio="${fit}"><rect width="10" height="5" /></marker>`;
    const fitted = async (fit) => /<g transform="(matrix\([^)]*\))"><rect/.exec(svgNodeOf((await walked(drawingOf(`<defs>${marker(fit)}</defs><line x1="0" y1="0" x2="50" y2="0" stroke="black" marker-end="url(#w)" />`))).root).svg)?.[1];
    assert.equal(await fitted('xMidYMid meet'), 'matrix(1 0 0 1 0 2.5)');
    assert.equal(await fitted('xMinYMin meet'), 'matrix(1 0 0 1 0 0)');
    assert.equal(await fitted('none'), 'matrix(1 0 0 2 0 0)');
  });

  it('clips a marker to its viewport only where its content spills past it', async () => {
    const spilling = '<marker id="s" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse"><path d="M0 0 L12 4 L0 8 Z" /></marker>';
    const clipped = svgNodeOf((await walked(drawingOf(`<defs>${spilling}</defs><line x1="10" y1="50" x2="90" y2="50" stroke="black" marker-end="url(#s)" />`))).root).svg;
    assert.match(clipped, /<clipPath id="clip-[^"]+"><rect x="0" y="0" width="8" height="8"><\/rect><\/clipPath>/);
    assert.match(clipped, /<g transform="[^"]*" opacity="1" clip-path="url\(#clip-/);
    const contained = svgNodeOf((await walked(drawingOf(`<defs>${ARROW}</defs><line x1="10" y1="50" x2="90" y2="50" stroke="black" marker-end="url(#a)" />`))).root).svg;
    assert.doesNotMatch(contained, /clip-path|<clipPath/);
  });
});

describe('a drawing’s vertices', () => {
  it('marks each interior vertex of a polyline on the bisector of its turn', async () => {
    const node = svgNodeOf((await walked(drawingOf(`<defs>${ARROW}</defs><polyline points="10,10 50,10 50,50" fill="none" stroke="black" marker-mid="url(#a)" />`))).root);
    assert.match(node.svg, /<g transform="translate\(50 10\) rotate\(45\)/);
    assert.equal(node.unread, undefined);
  });

  it('lists a path’s mid markers as unread, as the DOM lists no vertices of a path', async () => {
    const node = svgNodeOf((await walked(drawingOf(`<defs>${ARROW}</defs><path d="M10 10 L50 10 L50 50" fill="none" stroke="black" marker-mid="url(#a)" />`))).root);
    assert.deepEqual(node.unread, ['marker-mid on a <path>']);
  });
});

describe('a drawing’s hidden parts', () => {
  it('drops a subtree its display hides: no layer, no shape', async () => {
    const node = svgNodeOf((await walked(drawingOf('<g class="off"><rect class="inner" width="10" height="10" /></g><rect class="on" width="5" height="5" />', '.off { display: none; }'))).root);
    assert.deepEqual(node.shapes.map((shape) => shape.cls[0]), ['on']);
    assert.match(tagsOf(node.svg, 'g')[0], /display="none"/);
    assert.doesNotMatch(tagsOf(node.svg, 'rect')[0], /id=/);
  });

  it('keeps a child its own visibility shows inside a hidden parent', async () => {
    const node = svgNodeOf((await walked(drawingOf('<g class="veil"><rect class="shown" width="10" height="10" /><rect class="kept" width="4" height="4" /></g>', '.veil { visibility: hidden; } .shown { visibility: visible; }'))).root);
    assert.deepEqual(node.shapes.map((shape) => shape.cls[0]), ['shown']);
    const [group] = tagsOf(node.svg, 'g');
    assert.doesNotMatch(group, /display=/);
    assert.match(group, /visibility="hidden"/);
    const [shown, kept] = tagsOf(node.svg, 'rect');
    assert.doesNotMatch(shown, /display=/);
    assert.match(kept, /display="none"/);
  });
});

describe('a drawing’s definitions', () => {
  it('writes the paints a gradient stop declares in CSS', async () => {
    const node = svgNodeOf((await walked(drawingOf('<defs><linearGradient id="g"><stop class="from" offset="0" /></linearGradient></defs><rect width="10" height="10" fill="url(#g)" />', '.from { stop-color: #3b5bdb; stop-opacity: 0.5; }'))).root);
    const [stop] = tagsOf(node.svg, 'stop');
    assert.match(stop, /stop-color="rgb\(59, 91, 219\)"/);
    assert.match(stop, /stop-opacity="0\.5"/);
  });

  it('leaves a symbol’s shape the fill it inherits, so the use that draws it passes its own', async () => {
    const node = svgNodeOf((await walked(drawingOf('<defs><symbol id="dot"><circle cx="5" cy="5" r="5" /></symbol></defs><use href="#dot" class="tinted" />', '.tinted { fill: #3b5bdb; }'))).root);
    assert.doesNotMatch(tagsOf(node.svg, 'circle')[0], /\bfill=/);
    assert.match(tagsOf(node.svg, 'use')[0], /fill="rgb\(59, 91, 219\)"/);
  });
});

describe('the root', () => {
  it('is required: a page with none prints nothing', async () => {
    await assert.rejects(walked('<div>no root</div>'), /0 elements match \[data-print\]/);
  });

  it('is one: a page with two prints nothing', async () => {
    await assert.rejects(walked('<div data-print="wire"></div><div data-print="wire"></div>'), /2 elements match \[data-print\]/);
  });
});
