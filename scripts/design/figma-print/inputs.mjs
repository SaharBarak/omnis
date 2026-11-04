/**
 * What a measured tree depends on (docs/redesign/FIGMA_PRINT.md §3.1,
 * "Provenance"): the route's source, derived, and the measure's own code,
 * each a content digest of its files as the working tree holds them. A
 * route's source is the module graph of the files Next renders it with
 * (`CONFIG.source`), so an import the page gains or loses moves the digest
 * as surely as an edit does. The measure takes the digests before it loads a
 * route and after its last read, and stamps both; the planner recomputes
 * them, so a commit that touches none keeps every tree, and a tree read
 * across a change of source stands for nothing.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { APP, CONFIG } from './config.mjs';

/** The inputs, by the name the planner reports each under. */
export const INPUTS = { site: { name: 'page source' }, measure: { name: 'measure code' } };

const dirsIn = (root, dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? [entry.name] : []));

/** The file of a Next convention (`page`, `layout`) in `dir`, under any of the source's extensions. */
const conventionIn = (root, source, dir, name) => source.extensions.map((ext) => path.join(dir, `${name}.${ext}`)).find((file) => fs.existsSync(path.join(root, file))) ?? null;

const isGroup = (name) => /^\(.+\)$/.test(name);
const isDynamic = (name) => /^\[[^.[\]]+\]$/.test(name);
const isCatchAll = (name) => /^\[\.\.\.[^\]]+\]$/.test(name);
const isOptionalCatchAll = (name) => /^\[\[\.\.\.[^\]]+\]\]$/.test(name);

/**
 * The directories from the app directory to the one whose page serves the
 * route's `segments`, as Next's app router matches them: a static segment
 * before a group's, a group's before a dynamic one, a catch-all last. A
 * parallel slot (`@slot`) or a private folder (`_name`) serves no URL.
 */
function chainOf(root, source, dir, segments) {
  const children = dirsIn(root, dir).filter((name) => !name.startsWith('@') && !name.startsWith('_'));
  const into = (child, rest) => {
    const chain = chainOf(root, source, path.join(dir, child), rest);
    return chain ? [dir, ...chain] : null;
  };
  if (segments.length === 0 && conventionIn(root, source, dir, source.page)) return [dir];
  const [first, ...rest] = segments;
  const tries = [
    ...(first === undefined ? [] : children.filter((name) => name === first).map((name) => () => into(name, rest))),
    ...children.filter(isGroup).map((name) => () => into(name, segments)),
    ...(first === undefined ? [] : children.filter(isDynamic).map((name) => () => into(name, rest))),
    ...(first === undefined ? [] : children.filter(isCatchAll).map((name) => () => into(name, []))),
    ...children.filter(isOptionalCatchAll).map((name) => () => into(name, [])),
  ];
  for (const attempt of tries) {
    const chain = attempt();
    if (chain) return chain;
  }
  return null;
}

/** The files Next renders a route with, relative to `root`: every layout and template on its segment chain, then its page. */
export function entriesOf(route, source = CONFIG.source, root = APP) {
  const chain = chainOf(root, source, source.app, route.split('/').filter(Boolean));
  if (!chain) throw new Error(`no page under ${source.app} serves ${route}`);
  const conventions = chain.flatMap((dir) => source.conventions.flatMap((name) => conventionIn(root, source, dir, name) ?? []));
  return [...conventions, conventionIn(root, source, chain.at(-1), source.page)];
}

/**
 * Resolves a bare import as the bundler does, tsconfig paths included, and
 * keeps only what resolves outside `node_modules`: a package is the
 * lockfile's. A root-relative CSS `url()` is the server's, not the graph's.
 */
const sourceOnly = {
  name: 'source-only',
  setup(bundler) {
    bundler.onResolve({ filter: /^\// }, (args) => (args.kind === 'url-token' || args.kind === 'import-rule' ? { path: args.path, external: true } : undefined));
    bundler.onResolve({ filter: /^[^./]/ }, async (args) => {
      if (args.pluginData === sourceOnly) return undefined;
      const resolved = await bundler.resolve(args.path, { kind: args.kind, resolveDir: args.resolveDir, importer: args.importer, pluginData: sourceOnly });
      return resolved.errors.length > 0 || resolved.external || resolved.path.includes(`${path.sep}node_modules${path.sep}`) ? { path: args.path, external: true } : { path: resolved.path };
    });
  },
};

/** Every source file the entries reach, relative to the app, sorted. */
export async function moduleGraphOf(entries) {
  const result = await build({
    absWorkingDir: APP,
    entryPoints: entries,
    bundle: true,
    write: false,
    metafile: true,
    outdir: 'graph',
    logLevel: 'silent',
    format: 'esm',
    platform: 'neutral',
    jsx: 'automatic',
    tsconfig: 'tsconfig.json',
    loader: CONFIG.source.loaders,
    plugins: [sourceOnly],
  });
  return Object.keys(result.metafile.inputs)
    .filter((file) => !file.includes(':') && !file.split('/').includes('node_modules'))
    .sort();
}

/** A route's source: its module graph and the config every route compiles with, as they exist. */
export const sourceFilesOf = async (route) => [...new Set([...(await moduleGraphOf(entriesOf(route))), ...CONFIG.source.compile.filter((file) => fs.existsSync(path.join(APP, file)))])].sort();

/** The measure's own code: the module graph of its entry. */
export const measureFilesOf = () => moduleGraphOf(CONFIG.source.measure);

/** A file set's digest: the sha256 of its sorted `path blob` lines, as 16 hex characters. */
export const digestOf = (entries) =>
  createHash('sha256')
    .update(entries.map(([file, blob]) => `${file} ${blob}`).sort().join('\n'))
    .digest('hex')
    .slice(0, 16);

/** A git call in `cwd`: its standard output, with `input` on its standard input. */
const git = (cwd, args, input) => execFileSync('git', args, { cwd, encoding: 'utf8', input, maxBuffer: Infinity });

/** One `--stdin-paths` line: git reads a line that opens with a quote as a C string, which carries any name. */
const lineOf = (file) => (/[\n\r"\\]/.test(file) ? `"${file.replace(/[\\"]/g, '\\$&').replaceAll('\n', '\\n').replaceAll('\r', '\\r')}"` : file);

/**
 * The digest of the files under `pathspecs` as the working tree in `cwd`
 * holds them: tracked or not, the ignored and the missing aside, each blob
 * hashed from its bytes on disk in one `git hash-object` call.
 */
export function workingDigestOf(cwd, pathspecs) {
  const listed = git(cwd, ['ls-files', '-z', '-co', '--exclude-standard', '--', ...pathspecs]).split('\0');
  const files = [...new Set(listed)].filter((file) => file !== '' && fs.statSync(path.resolve(cwd, file), { throwIfNoEntry: false })?.isFile());
  const blobs = git(cwd, ['hash-object', '--no-filters', '--stdin-paths'], files.map((file) => `${lineOf(path.resolve(cwd, file))}\n`).join('')).split('\n');
  return digestOf(files.map((file, at) => [file, blobs[at]]));
}

/** The digest of each input of a route as the working tree holds it: `{ site, measure }`. */
export const inputsOf = async (route) => ({ site: workingDigestOf(APP, await sourceFilesOf(route)), measure: workingDigestOf(APP, await measureFilesOf()) });

const sameInputs = (a, b) => a !== undefined && b !== undefined && Object.keys(INPUTS).every((input) => a[input] === b[input]);

/**
 * Why a measured tree no longer stands for what the measure reads now: each
 * input whose digest differs from the working tree's, or a stamp with none.
 * Empty while the tree stands.
 */
export const whyStale = (stamp, inputs) =>
  stamp.inputs ? Object.entries(INPUTS).filter(([input]) => stamp.inputs[input] !== inputs[input]).map(([, { name }]) => `${name} differs`) : ['no inputs in the stamp'];

/**
 * Why a measured tree was not read whole from one compile of its source: its
 * inputs changed between the first read and the last, or its page loaded
 * again between its walk and its protocol reads. The plan refuses such a tree
 * whatever the caller allows, and the measure reads the route again. Empty
 * for a sound tree.
 */
export const whyUnsound = (stamp) => [
  ...(sameInputs(stamp.inputs, stamp.inputsAfter) ? [] : ['the source changed while it was read']),
  ...(stamp.reloaded ? ['the page loaded again while it was read'] : []),
];
