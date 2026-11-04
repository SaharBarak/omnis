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
    assert.match(markup, /<g transform="translate\(90 50\) rotate\(0\) scale\(1\.75\) translate\(-7 -4\)"><path d="M0 0 L8 4 L0 8 Z" fill="rgb\(59, 91, 219\)"/);
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

describe('the root', () => {
  it('is required: a page with none prints nothing', async () => {
    await assert.rejects(walked('<div>no root</div>'), /0 elements match \[data-print\]/);
  });

  it('is one: a page with two prints nothing', async () => {
    await assert.rejects(walked('<div data-print="wire"></div><div data-print="wire"></div>'), /2 elements match \[data-print\]/);
  });
});
