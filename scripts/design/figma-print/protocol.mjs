/**
 * The DevTools reads of measure.mjs (docs/redesign/FIGMA_PRINT.md §3.1), one print at
 * a time: the authored token behind each value, the face Chrome drew each
 * text with, and the `::before` and `::after` boxes that paint, keyed by
 * data-fp. A read that finds no element of the walk, or that fails, is
 * counted with the first few as examples, never dropped: the plan refuses a
 * tree with any (plan/raw.mts).
 */
import { bindingsOf, keywordsOf } from './cascade.mjs';
import { CONFIG, INSETS, STYLE_PROPS } from './config.mjs';
import { LAYOUT_UNIT } from './walker.mjs';

/** How many missed or failed reads a tree keeps as examples. */
const READ_SAMPLES = 8;

/** Every element node of a DOM.getDocument tree by its data-fp id, with its pseudo-elements. */
export function indexDocument(documentNode) {
  const byFp = new Map();
  const stack = [documentNode];
  while (stack.length > 0) {
    const node = stack.pop();
    const attributes = node.attributes ?? [];
    for (let index = 0; index < attributes.length; index += 2) {
      if (attributes[index] === 'data-fp') byFp.set(attributes[index + 1], node);
    }
    for (const child of node.children ?? []) stack.push(child);
    if (node.contentDocument) stack.push(node.contentDocument);
  }
  return byFp;
}

/** Runs `task` over `items` with at most `size` in flight: each result, or `{ error }` where it threw. */
export async function inBatches(items, task, size = CONFIG.cdpBatch) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]).catch((error) => ({ error: String(error?.message ?? error) }));
    }
  });
  await Promise.all(workers);
  return results;
}

/** What a pseudo-element with no layout snapshot generates. */
const NOTHING = { text: '', image: false };

/**
 * What each rendered pseudo-element generates, by backend node id, from a
 * DOMSnapshot.captureSnapshot answer: the text its content lays out (a
 * string, a counter, an attribute, a quote) and whether it lays out an image
 * (`url()`, a gradient). A pseudo-element's first layout entry is its own box
 * and the rest are what its content generated: a text run carries its text,
 * an image an area and no text.
 */
export function generatedOf(snapshot) {
  const generated = new Map();
  for (const doc of snapshot.documents) {
    const pseudoAt = new Set(doc.nodes.pseudoType?.index ?? []);
    const entries = new Map();
    doc.layout.nodeIndex.forEach((node, entry) => {
      if (pseudoAt.has(node)) entries.set(node, [...(entries.get(node) ?? []), entry]);
    });
    for (const [node, [, ...made]] of entries) {
      const texts = made.map((entry) => doc.layout.text[entry]).filter((text) => text !== undefined && text >= 0);
      const image = made.some((entry) => !(doc.layout.text[entry] >= 0) && doc.layout.bounds[entry][2] > 0 && doc.layout.bounds[entry][3] > 0);
      generated.set(doc.nodes.backendNodeId[node], { text: texts.map((text) => snapshot.strings[text]).join(''), image });
    }
  }
  return generated;
}

/** Whether a computed style paints its own box: a background, a shadow or a border side. */
const paintsBox = (style) =>
  style['background-color'] !== 'rgba(0, 0, 0, 0)' ||
  style['background-image'] !== 'none' ||
  style['box-shadow'] !== 'none' ||
  ['top', 'right', 'bottom', 'left'].some((side) => style[`border-${side}-width`] !== '0px' && style[`border-${side}-style`] !== 'none');

/** Whether a pseudo-element paints: it renders, and its box paints or its content generates visible text or an image. */
export const paintsPseudo = (style, generated = NOTHING) =>
  style.content !== 'none' && style.content !== 'normal' && style.display !== 'none' && (paintsBox(style) || generated.text.trim() !== '' || generated.image);

/**
 * A border quad from DOM.getBoxModel, which is relative to the viewport, as a
 * box in document space, where the walker reads every element's: shifted by
 * the document's scroll offset and rounded to the layout unit.
 */
export function boxOfQuad(quad, [scrollX, scrollY]) {
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  const round = (value) => Math.round(value / LAYOUT_UNIT) * LAYOUT_UNIT;
  return [round(Math.min(...xs) + scrollX), round(Math.min(...ys) + scrollY), round(Math.max(...xs) - Math.min(...xs)), round(Math.max(...ys) - Math.min(...ys))];
}

/** A box's keywords without its insets unless it is positioned: an inset applies to nothing else. */
export const positionedKeywords = (keywords, position) => (position && position !== 'static' ? keywords : Object.fromEntries(Object.entries(keywords).filter(([name]) => !INSETS.includes(name))));

/** The summary of a page's DevTools reads, for its measure line: empty while every read in every print answered. */
export const readsLine = (reads) =>
  Object.entries(reads)
    .filter(([, read]) => read.misses + read.errors > 0)
    .map(([print, read]) => `, ${print} reads ${read.misses} missed ${read.errors} failed`)
    .join('');

/**
 * The DevTools reads of one print, on CDP session `cdp`, for the elements of
 * its walk `walked`, with the document scrolled to `scroll`: per element its
 * bindings, keywords and face, its painting pseudo-elements, and `reads`,
 * the reads that found no element (`misses`) or failed (`errors`).
 */
export async function readProtocol(cdp, walked, scroll) {
  const { root: documentNode } = await cdp.send('DOM.getDocument', { depth: -1, pierce: false });
  const byFp = indexDocument(documentNode);
  const rendered = [];
  const withText = [];
  // Each element's computed direction maps its logical sides; a pseudo-element reads its host's.
  const directionOf = new Map();
  const positionOf = new Map();
  const visitTree = (node) => {
    if (!node.none) rendered.push(node.id);
    directionOf.set(node.id, walked.styles[node.style]?.direction);
    positionOf.set(node.id, walked.styles[node.style]?.position);
    // A drawing's shapes bind their own paints (docs/redesign/FIGMA_PRINT.md §6), read in the drawing's direction.
    for (const shape of node.none ? [] : (node.shapes ?? [])) {
      rendered.push(shape.id);
      directionOf.set(shape.id, walked.styles[node.style]?.direction);
    }
    if (node.kids?.some((kid) => kid.text !== undefined)) withText.push(node.id);
    for (const kid of node.kids ?? []) if (kid.text === undefined) visitTree(kid);
  };
  visitTree(walked.root);
  const failures = [];
  const failed = (what, message) => failures.push(`${what}: ${message}`);

  // An element the walk named and the document no longer holds was replaced after the walk.
  const found = rendered.filter((fp) => byFp.has(fp));
  const missed = rendered.filter((fp) => !byFp.has(fp));
  const bindings = await inBatches(found, async (fp) => {
    const match = await cdp.send('CSS.getMatchedStylesForNode', { nodeId: byFp.get(fp).nodeId });
    return { bind: bindingsOf(match, directionOf.get(fp)), keywords: keywordsOf(match, directionOf.get(fp)) };
  });
  const texts = withText.filter((fp) => byFp.has(fp));
  const faces = await inBatches(texts, async (fp) => {
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: byFp.get(fp).nodeId });
    return fonts.slice().sort((a, b) => b.glyphCount - a.glyphCount)[0]?.familyName ?? null;
  });

  // The layout snapshot says which pseudo-elements render and what their content generates.
  const snapshot = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: [] }).catch((error) => {
    failed('DOMSnapshot.captureSnapshot', String(error?.message ?? error));
    return null;
  });
  const generated = snapshot ? generatedOf(snapshot) : null;
  const pseudoTargets = found.flatMap((fp) =>
    (byFp.get(fp).pseudoElements ?? []).filter((pseudo) => (pseudo.pseudoType === 'before' || pseudo.pseudoType === 'after') && (!generated || generated.has(pseudo.backendNodeId))).map((pseudo) => ({ fp, pseudo }))
  );
  const pseudos = await inBatches(pseudoTargets, async ({ fp, pseudo }) => {
    const { computedStyle } = await cdp.send('CSS.getComputedStyleForNode', { nodeId: pseudo.nodeId });
    const style = Object.fromEntries(computedStyle.filter((entry) => entry.name === 'content' || STYLE_PROPS.includes(entry.name)).map((entry) => [entry.name, entry.value]));
    const made = generated?.get(pseudo.backendNodeId) ?? NOTHING;
    if (!paintsPseudo(style, made)) return null;
    const { model } = await cdp.send('DOM.getBoxModel', { nodeId: pseudo.nodeId });
    const match = await cdp.send('CSS.getMatchedStylesForNode', { nodeId: pseudo.nodeId });
    const keywords = positionedKeywords(keywordsOf(match, directionOf.get(fp)), style.position);
    return {
      fp,
      kind: pseudo.pseudoType,
      box: boxOfQuad(model.border, scroll),
      style,
      bind: bindingsOf(match, directionOf.get(fp)),
      ...(Object.keys(keywords).length > 0 ? { keywords } : {}),
      ...(made.text.trim() !== '' ? { text: made.text } : {}),
    };
  });

  const perNode = {};
  found.forEach((fp, index) => {
    const read = bindings[index];
    if (read.error) {
      failed(`${fp} matched styles`, read.error);
      return;
    }
    if (Object.keys(read.bind).length > 0) (perNode[fp] ??= {}).bind = read.bind;
    const keywords = positionedKeywords(read.keywords, positionOf.get(fp));
    if (Object.keys(keywords).length > 0) (perNode[fp] ??= {}).keywords = keywords;
  });
  texts.forEach((fp, index) => {
    if (faces[index]?.error) failed(`${fp} platform fonts`, faces[index].error);
    else if (typeof faces[index] === 'string') (perNode[fp] ??= {}).face = faces[index];
  });
  const pseudo = {};
  pseudos.forEach((entry, index) => {
    if (entry?.error) failed(`${pseudoTargets[index].fp}::${pseudoTargets[index].pseudo.pseudoType}`, entry.error);
    else if (entry) {
      const { fp, ...read } = entry;
      (pseudo[fp] ??= []).push(read);
    }
  });
  const reads = { misses: missed.length, errors: failures.length, samples: [...missed.map((fp) => `${fp}: not in the document`), ...failures].slice(0, READ_SAMPLES) };
  return { perNode, pseudo, reads };
}
