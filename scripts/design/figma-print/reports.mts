/**
 * The plugin's reports on disk (docs/redesign/FIGMA_PRINT.md §3.3, §3.4): the envelope
 * the receiver accepts, and where it files what the plugin sends, so the
 * check finds it.
 *
 *   <reports>/latest.json                 the newest report, whole
 *   <reports>/<revision>/<stamp>.json     every report of one plan revision
 *   <reports>/<revision>/png/<name>.png   the PNGs exported at that revision
 *   <reports>/<revision>/check.md         the check's verdict on it
 *
 * A stamp is the print's start time in ISO 8601 basic format, so a name is
 * portable, sorts by time, and stays the same when a report is posted twice.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PROTOCOL } from './plan/schema.mts';

const LATEST = 'latest.json';
const PROGRESS = 'progress.json';
const CHECK = 'check.md';
const PNG = 'png';
const REPORT = '.json';

/** The longest file name APFS and ext4 take, in bytes. */
const NAME_MAX = 255;
/** Hex digits of a key's hash in its file name. */
const HASH_DIGITS = 8;
/** What a safe name keeps of its key: the rest of the name holds the hash and the longest extension here. */
const READABLE = NAME_MAX - HASH_DIGITS - 1 - REPORT.length;

const UNSAFE = /[^A-Za-z0-9_-]/g;
/** One plain path segment: no separator, and never `.` or `..`. */
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const STAMP = /^\d{8}T\d{6}\.\d{3}Z$/;

const hashOf = (text: string): string => createHash('sha256').update(text).digest('hex').slice(0, HASH_DIGITS);

/** A key as a file name: every character outside [A-Za-z0-9_-] becomes '_', and a hash of the key keeps keys that read alike apart. */
export const safeName = (key: string): string => `${key.replace(UNSAFE, '_').slice(0, READABLE)}-${hashOf(key)}`;

/** A revision as a directory name: itself when it is one plain segment that fits, its safe name otherwise. */
export const segmentOf = (revision: string): string => (SEGMENT.test(revision) && revision.length <= READABLE ? revision : safeName(revision));

/** Where the receiver keeps the running print's last step, overwritten each step. */
export const progressPath = (root: string): string => path.join(root, PROGRESS);
export const latestPath = (root: string): string => path.join(root, LATEST);
export const revisionDir = (root: string, revision: string): string => path.join(root, segmentOf(revision));
export const reportPath = (root: string, revision: string, stamp: string): string => path.join(revisionDir(root, revision), `${stamp}${REPORT}`);
export const pngPath = (root: string, revision: string, key: string): string => path.join(revisionDir(root, revision), PNG, `${safeName(key)}.png`);
export const checkPath = (root: string, revision: string): string => path.join(revisionDir(root, revision), CHECK);

const basic = (time: Date): string => time.toISOString().replace(/[-:]/g, '');

/** An ISO time as a stamp (`20261028T150405.123Z`), or null when it does not read as a time with a four-digit year. */
export function stampOf(time: string): string | null {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return null;
  const stamp = basic(date);
  return STAMP.test(stamp) ? stamp : null;
}

/** The stamp a report is filed under: its print's start, or the time it arrived when the start does not read as a time. */
export const reportStamp = (startedAt: unknown, arrived: Date): string => (typeof startedAt === 'string' ? stampOf(startedAt) : null) ?? basic(arrived);

/** The report files among a revision directory's names, oldest first. */
export const reportNames = (names: readonly string[]): readonly string[] =>
  names.filter((name) => name.endsWith(REPORT) && STAMP.test(name.slice(0, -REPORT.length))).toSorted();

/** The reports filed before `stamp`, newest first: the prints before the one that started then. */
export const earlierNames = (names: readonly string[], stamp: string): readonly string[] =>
  reportNames(names)
    .filter((name) => name.slice(0, -REPORT.length) < stamp)
    .toReversed();

type Fields = Readonly<Record<string, unknown>>;
const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Why a value is not a print report of this protocol, or null when it is one.
 * This is the envelope the store files by; the check reads the rest.
 */
export function reportProblem(value: unknown): string | null {
  if (!isFields(value)) return 'the report is not a JSON object';
  if (value['protocol'] !== PROTOCOL) return `the report speaks protocol ${JSON.stringify(value['protocol'])}, not ${PROTOCOL}`;
  if (typeof value['revision'] !== 'string' || value['revision'] === '') return 'the report names no revision';
  if (!Array.isArray(value['units'])) return 'the report has no units list';
  if (!Array.isArray(value['nodes'])) return 'the report has no nodes list';
  return null;
}

/** Writes a file whole or not at all, so a reader never meets half of it. */
export async function writeAtomic(file: string, data: string | Uint8Array): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const partial = `${file}.${randomUUID()}.partial`;
  try {
    await writeFile(partial, data);
    await rename(partial, file);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
}
