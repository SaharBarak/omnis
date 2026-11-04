/**
 * Measure (docs/redesign/FIGMA_PRINT.md §3.1): reads every route at every
 * viewport in every print from the dev server, and writes one raw tree per
 * route and viewport to `.figma-print/raw/` (`CONFIG.paths.raw`).
 *
 * Each print is read in one load, back to back. Structure and boxes come from
 * the primary print's walk, and the tree counts every box a twin's walk moved
 * (`structure.mjs`). Paints, visibility and the authored token behind each
 * value are kept per print (`protocol.mjs`).
 *
 * It reads only a base on this machine's loopback. The inputs' digests are
 * taken before a route loads and after its last read; a route whose source
 * changed in between, or whose page loaded again, is read once more, and
 * stamped unsound if it changes again (`inputs.mjs`).
 *
 * usage: node scripts/design/figma-print/measure.mjs [base-url] [--routes=/lab/bento/wireframes]
 */
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROUTES, stemOf } from '../routes.mjs';
import { hasPrint, visit } from '../visit.mjs';
import { APP, CONFIG, PLACEHOLDER_PROPS, STYLE_PROPS } from './config.mjs';
import { inputsOf, sourceFilesOf, whyUnsound } from './inputs.mjs';
import { readProtocol, readsLine } from './protocol.mjs';
import { mergeStructure, structureOf } from './structure.mjs';
import { LAYOUT_UNIT, walk } from './walker.mjs';

const args = process.argv.slice(2);
const base = args.find((arg) => !arg.startsWith('--')) ?? CONFIG.base;
const only = args.find((arg) => arg.startsWith('--routes='))?.slice('--routes='.length).split(',');
const routes = only ?? ROUTES;
const [PRIMARY, ...TWINS] = CONFIG.prints;

const git = (...gitArgs) => execFileSync('git', gitArgs, { cwd: APP, encoding: 'utf8' }).trim();

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const isLoopback = (url) => {
  try {
    return LOOPBACK.has(new URL(url).hostname);
  } catch {
    return false;
  }
};

/**
 * Waits until the page's layout holds still: its height and element count
 * unchanged for the quiet window, and nothing busy.
 */
async function settle(page) {
  const { quietMs, maxMs, pollMs } = CONFIG.settle;
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const started = Date.now();
  let last = '';
  let quietSince = Date.now();
  while (Date.now() - started < maxMs) {
    const layout = await page.evaluate(
      (rootSelector) => {
        const root = document.querySelector(rootSelector) ?? document.body;
        return [document.documentElement.scrollHeight, root.querySelectorAll('*').length, document.querySelectorAll('[aria-busy="true"]').length];
      },
      CONFIG.root
    );
    const now = JSON.stringify(layout);
    if (now !== last) {
      last = now;
      quietSince = Date.now();
    } else if (Date.now() - quietSince >= quietMs && layout[2] === 0) {
      return true;
    }
    await page.waitForTimeout(pollMs);
  }
  return false;
}

/** One print's per-element facts from its walk, keyed by data-fp. */
function perPrint(walked, protocol) {
  const nodes = {};
  const visitTree = (node) => {
    const shapes = node.shapes?.map((shape) => ({ ...shape, ...(protocol.perNode[shape.id]?.bind ? { bind: protocol.perNode[shape.id].bind } : {}) }));
    nodes[node.id] = { s: node.style, ...(node.none ? { none: true } : {}), ...(node.svg ? { svg: node.svg, shapes, ...(node.unread ? { unread: node.unread } : {}) } : {}), ...(node.field ? { placeholder: node.field.placeholderStyle } : {}), ...protocol.perNode[node.id] };
    for (const kid of node.kids ?? []) if (kid.text === undefined) visitTree(kid);
  };
  visitTree(walked.root);
  return { styles: walked.styles, tokens: walked.tokens, nodes, pseudo: protocol.pseudo };
}

/**
 * Every scroller at its start, the document aside: the print shows what a
 * scroller holds at rest, where a scroll snap (with the snap turned off in the
 * style tag) or a script would move it only at runtime. Each one jumps, with
 * smooth scrolling off in the style tag too, and the page runs two frames so a
 * scroll handler can answer; the count is of the scrollers still off their start.
 */
const atRest = (page) =>
  page.evaluate(async () => {
    const offStart = () => [...document.querySelectorAll('*')].filter((element) => element !== document.scrollingElement && (element.scrollLeft !== 0 || element.scrollTop !== 0));
    for (const element of offStart()) element.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return offStart().length;
  });

/** The page's own clock origin: a page that loaded again has another. */
const loadOf = (page) => page.evaluate(() => performance.timeOrigin);

/** What the dev server says it is: Next's version, and whether its dev overlay runs. */
const nextOf = (page) => page.evaluate(() => ({ version: window.next?.version ?? null, dev: document.querySelector('nextjs-portal') !== null }));

async function measureOne(browser, route, viewport, stamp) {
  // Before the load: an edit that lands while the page loads then shows in the digest after the last read.
  const inputs = await inputsOf(route);
  const { page, status } = await visit(browser, base + route, { width: viewport.width, height: viewport.height });
  try {
    if (status < 200 || status >= 400) return { route, viewport: viewport.name, status, error: 'not loaded' };
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; scroll-snap-type: none !important; scroll-behavior: auto !important; }' });
    const loaded = await loadOf(page);
    const settled = {};
    // Per print, the most scrollers found off their start before any of its reads.
    const restless = {};
    const walks = {};
    // Every walk first and back to back, so the prints read one state of the page.
    for (const print of CONFIG.prints) {
      const shown = await hasPrint(page, CONFIG.root, print);
      if (!shown.ok) return { route, viewport: viewport.name, status, error: shown.error };
      settled[print] = await settle(page);
      restless[print] = await atRest(page);
      walks[print] = await page.evaluate(walk, { root: CONFIG.root, styleProps: STYLE_PROPS, placeholderProps: PLACEHOLDER_PROPS, layoutUnit: LAYOUT_UNIT });
    }
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const prints = {};
    const reads = {};
    for (const print of [...CONFIG.prints].reverse()) {
      restless[print] = Math.max(restless[print], await atRest(page));
      // DOM.getBoxModel answers in the viewport; the walk read the document.
      const scroll = await page.evaluate(() => [window.scrollX, window.scrollY]);
      const protocol = await readProtocol(cdp, walks[print], scroll);
      prints[print] = perPrint(walks[print], protocol);
      reads[print] = protocol.reads;
    }
    const html = await page.content();
    const buildId = /\\?"b\\?":\\?"([\w-]{10,40})\\?"/.exec(html)?.[1] ?? null;
    const tree = structureOf(walks[PRIMARY].root);
    const moves = TWINS.map((print) => mergeStructure(tree, walks[print].root, print));
    const geometry = { moved: moves.reduce((sum, move) => sum + move.moved, 0), maxDelta: Math.max(0, ...moves.map((move) => move.maxDelta)), samples: moves.flatMap((move) => move.samples) };
    return {
      route,
      viewport: viewport.name,
      size: [viewport.width, viewport.height],
      status,
      stamp: { ...stamp, dirty: git('status', '--porcelain', '--', ...(await sourceFilesOf(route))).split('\n').filter(Boolean), buildId, next: await nextOf(page), inputs, inputsAfter: await inputsOf(route), reloaded: (await loadOf(page)) !== loaded, measuredAt: new Date().toISOString() },
      lang: walks[PRIMARY].lang,
      dir: walks[PRIMARY].dir,
      page: walks[PRIMARY].page,
      settled,
      restless,
      geometry,
      reads,
      fonts: walks[PRIMARY].fonts,
      tree,
      prints,
    };
  } finally {
    await page.context().close();
  }
}

/** A route read whole: once more where the first read spanned a change of source or a reload. */
async function measureSound(browser, route, viewport, stamp) {
  const first = await measureOne(browser, route, viewport, stamp);
  if (first.error || whyUnsound(first.stamp).length === 0) return first;
  return measureOne(browser, route, viewport, stamp);
}

if (!isLoopback(base)) {
  console.error(`measure: ${base} is not on this machine's loopback; it reads only the dev server here`);
  process.exit(2);
}
await mkdir(CONFIG.paths.raw, { recursive: true });
const browser = await chromium.launch();
const stamp = {
  commit: git('rev-parse', 'HEAD'),
  base,
  browser: browser.version(),
};
const summary = [];
try {
  for (const route of routes) {
    for (const viewport of CONFIG.viewports) {
      const started = Date.now();
      const raw = await measureSound({ newPage: async (options) => (await browser.newContext(options)).newPage() }, route, viewport, stamp);
      const file = path.join(CONFIG.paths.raw, `${stemOf(route)}.${viewport.name}.json`);
      if (!raw.error) await writeFile(file, JSON.stringify(raw));
      const unsound = raw.error ? [] : whyUnsound(raw.stamp);
      const line = raw.error
        ? `${route} ${viewport.name}: ${raw.error} (status ${raw.status})`
        : `${route} ${viewport.name}: ${raw.page.join('×')}, moved ${raw.geometry.moved} (max ${raw.geometry.maxDelta}px), settled ${JSON.stringify(raw.settled)}${Object.values(raw.restless).some((count) => count > 0) ? `, restless ${JSON.stringify(raw.restless)}` : ''}${readsLine(raw.reads)}${unsound.length > 0 ? `, UNSOUND (${unsound.join(', ')})` : ''}, ${Math.round((Date.now() - started) / 1000)}s`;
      summary.push(line);
      console.log(line);
    }
  }
} finally {
  await browser.close();
}
await writeFile(path.join(CONFIG.paths.raw, 'summary.txt'), `${summary.join('\n')}\n`);
