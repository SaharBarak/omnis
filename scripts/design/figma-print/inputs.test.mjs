/**
 * A route's entries as Next's app router renders it (docs/redesign/
 * FIGMA_PRINT.md §3.1, "Provenance"), read from an app directory laid out
 * for each case, and the module graph the entries reach.
 *
 *   node --test scripts/design/figma-print/inputs.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { CONFIG } from './config.mjs';
import { entriesOf, moduleGraphOf } from './inputs.mjs';

const roots = [];
after(() => roots.forEach((root) => fs.rmSync(root, { recursive: true, force: true })));

/** An app directory holding `files`, each an empty module. */
const appOf = (...files) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-print-app-'));
  roots.push(root);
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), '');
  }
  return root;
};

const entries = (route, root) => entriesOf(route, CONFIG.source, root);

describe("a route's entries", () => {
  it('are every layout and template on its chain, then its page', () => {
    const root = appOf('src/app/layout.tsx', 'src/app/lab/layout.tsx', 'src/app/lab/bento/template.tsx', 'src/app/lab/bento/wireframes/page.tsx');
    assert.deepEqual(entries('/lab/bento/wireframes', root), ['src/app/layout.tsx', 'src/app/lab/layout.tsx', 'src/app/lab/bento/template.tsx', 'src/app/lab/bento/wireframes/page.tsx']);
  });

  it('pass through a route group, its layout included', () => {
    const root = appOf('src/app/layout.tsx', 'src/app/(site)/layout.tsx', 'src/app/(site)/pricing/page.tsx');
    assert.deepEqual(entries('/pricing', root), ['src/app/layout.tsx', 'src/app/(site)/layout.tsx', 'src/app/(site)/pricing/page.tsx']);
  });

  it('take a static segment before a dynamic one, and a catch-all last', () => {
    const root = appOf('src/app/blog/new/page.tsx', 'src/app/blog/[slug]/page.tsx', 'src/app/docs/[...path]/page.tsx');
    assert.deepEqual(entries('/blog/new', root), ['src/app/blog/new/page.tsx']);
    assert.deepEqual(entries('/blog/first-post', root), ['src/app/blog/[slug]/page.tsx']);
    assert.deepEqual(entries('/docs/a/b', root), ['src/app/docs/[...path]/page.tsx']);
  });

  it('serve the index through an optional catch-all', () => {
    const root = appOf('src/app/shop/[[...rest]]/page.tsx');
    assert.deepEqual(entries('/shop', root), ['src/app/shop/[[...rest]]/page.tsx']);
  });

  it('never come from a parallel slot or a private folder', () => {
    const root = appOf('src/app/@modal/pricing/page.tsx', 'src/app/_parts/pricing/page.tsx');
    assert.throws(() => entries('/pricing', root), /no page under src\/app serves \/pricing/);
  });
});

describe('the module graph', () => {
  it('reaches what the page imports through tsconfig paths and CSS, and leaves packages to the lockfile', async () => {
    const graph = await moduleGraphOf(entriesOf('/lab/bento/wireframes'));
    for (const file of ['src/app/lab/layout.tsx', 'src/app/globals.css', 'src/components/bento-lab/wireframe/primitives.tsx', 'src/components/bento-lab/wireframe/wireframe.module.css']) assert.ok(graph.includes(file), `${file} is in the graph`);
    assert.ok(graph.every((file) => !file.includes('node_modules')));
  });
});
