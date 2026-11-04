/**
 * What a measured tree depends on (docs/redesign/FIGMA_PRINT.md §3.1,
 * "Provenance"): the page's source, the config the dev server compiles it
 * with, and the measure's own code, each a content digest of its files as the
 * working tree holds them. The measure takes the digests before its first
 * read and after its last, and stamps both; the planner recomputes them, so
 * a commit that touches none keeps every tree, and a tree read across a
 * change of source stands for nothing.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { APP } from './config.mjs';

const HERE = import.meta.dirname;

/** Each input, by the name the planner reports it under, with its files as pathspecs relative to the app. */
export const INPUTS = {
  site: {
    name: 'page source',
    // The printed page, the kit it is made of, the root layout and styles it renders in, and what the dev server compiles them with.
    pathspecs: ['src/app/lab/bento', 'src/components/bento-lab', 'src/app/layout.tsx', 'src/app/globals.css', 'next.config.mjs', 'postcss.config.mjs', 'tsconfig.json', 'package-lock.json'],
  },
  measure: {
    name: 'measure code',
    pathspecs: ['walker.mjs', 'measure.mjs', 'protocol.mjs', 'structure.mjs', 'cascade.mjs', 'config.mjs', 'prints-table.mts', '../routes.mjs', '../visit.mjs'].map((file) => path.relative(APP, path.join(HERE, file))),
  },
};

/** The pathspecs of the page's source: what the stamp lists uncommitted, for the reader of a tree. */
export const SOURCE_PATHSPECS = INPUTS.site.pathspecs;

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

/** The digest of each input as the working tree holds it: `{ site, measure }`. */
export const inputsOf = () => Object.fromEntries(Object.entries(INPUTS).map(([input, { pathspecs }]) => [input, workingDigestOf(APP, pathspecs)]));

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
