/**
 * The check (docs/redesign/FIGMA_PRINT.md §3.4, §9): reads the plan bundle and one
 * print report, writes the verdict of F1 to F9 with its evidence to
 * `<reports>/<revision>/check.md`, and prints a summary.
 *
 * It exits 0 when no line fails, 1 when one does, and 2 when the report and
 * the plan cannot be compared: a file is missing or unreadable, or the
 * report is of another revision, protocol or file.
 *
 * usage: node scripts/design/figma-print/check.mts [report.json]
 * The report defaults to the latest one the receiver filed.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { comparable, contextOf, evaluate } from './check/lines.mts';
import { bundleOf, printOf, type Read } from './check/read.mts';
import { markdownOf, summaryOf, tallyOf } from './check/render.mts';
import { CONFIG } from './config.mjs';
import type { PrintReport } from './plan/schema.mts';
import { checkPath, earlierNames, latestPath, revisionDir, stampOf, writeAtomic } from './reports.mts';

const USAGE = 'usage: node scripts/design/figma-print/check.mts [report.json]';

/** The lines pass, a line fails, or the inputs cannot be compared. */
const EXIT = { pass: 0, fail: 1, unusable: 2 } as const;

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));
/** A path as the reader should see it: relative inside the working directory, absolute outside it. */
const shown = (file: string): string => {
  const relative = path.relative(process.cwd(), file);
  return relative === '' || relative.startsWith('..') || path.isAbsolute(relative) ? file : relative;
};
const isMissing = (error: unknown): boolean => error instanceof Error && 'code' in error && error.code === 'ENOENT';

async function jsonAt(file: string): Promise<Read<unknown>> {
  try {
    return { ok: true, value: JSON.parse(await readFile(file, 'utf8')) as unknown };
  } catch (error) {
    return { ok: false, error: `${shown(file)}: ${isMissing(error) ? 'not found' : messageOf(error)}` };
  }
}

async function readAs<Value>(file: string, guard: (value: unknown) => Read<Value>): Promise<Read<Value>> {
  const json = await jsonAt(file);
  if (!json.ok) return json;
  const read = guard(json.value);
  return read.ok ? read : { ok: false, error: `${shown(file)}: ${read.error}` };
}

function targetOf(argv: readonly string[]): Read<string> {
  try {
    const { positionals } = parseArgs({ args: [...argv], allowPositionals: true, strict: true, options: {} });
    if (positionals.length > 1) return { ok: false, error: `one report at most, not ${positionals.join(' ')}` };
    return { ok: true, value: path.resolve(positionals[0] ?? latestPath(CONFIG.paths.reports)) };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

/**
 * The report of the newest print before this one at the same revision by the
 * same printer, and where it was filed, or null. Another printer prints every
 * unit again by design, so only a print by this one proves F7.
 */
async function previousOf(report: PrintReport): Promise<{ readonly report: PrintReport; readonly file: string } | null> {
  const stamp = stampOf(report.startedAt);
  if (stamp === null) return null;
  const directory = revisionDir(CONFIG.paths.reports, report.revision);
  for (const name of earlierNames(await readdir(directory).catch(() => []), stamp)) {
    const file = path.join(directory, name);
    const earlier = await readAs(file, printOf);
    if (!earlier.ok) console.warn(`check: F7 passes over ${name}, since ${earlier.error}`);
    else if (earlier.value.printer === report.printer) return { report: earlier.value, file };
  }
  return null;
}

async function main(argv: readonly string[]): Promise<number> {
  const target = targetOf(argv);
  if (!target.ok) {
    console.error(`check: ${target.error}\n${USAGE}`);
    return EXIT.unusable;
  }
  const [bundle, report] = await Promise.all([readAs(CONFIG.paths.bundle, bundleOf), readAs(target.value, printOf)]);
  if (!bundle.ok || !report.ok) {
    for (const read of [bundle, report]) if (!read.ok) console.error(`check: ${read.error}`);
    return EXIT.unusable;
  }
  const mismatch = comparable(bundle.value, report.value);
  if (mismatch !== null) {
    console.error(`check: ${mismatch}`);
    return EXIT.unusable;
  }
  const previous = await previousOf(report.value);
  const lines = evaluate(contextOf(bundle.value, report.value, previous?.report ?? null));
  const out = checkPath(CONFIG.paths.reports, report.value.revision);
  await writeAtomic(out, markdownOf({ bundle: bundle.value, report: report.value, path: shown(target.value), previous: previous ? shown(previous.file) : null }, lines));
  for (const text of summaryOf(lines)) console.log(text);
  console.log(`check · revision ${report.value.revision} · ${tallyOf(lines)} · ${shown(out)}`);
  return lines.some((line) => line.status === 'FAIL') ? EXIT.fail : EXIT.pass;
}

process.exitCode = await main(process.argv.slice(2));
