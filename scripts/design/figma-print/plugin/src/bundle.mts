/**
 * The plan as the panel posts it: JSON with no type until this guard proves
 * the envelope the stages index into. The planner writes the schema's types,
 * so the guard proves the protocol, the file it prints and the lists, as
 * check/read.mts does for the check.
 */
import { err, ok, type Result } from 'neverthrow';
import { PROTOCOL, type PlanBundle } from '../../plan/schema.mts';

type Fields = Readonly<Record<string, unknown>>;
const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The lists every stage walks. */
const LISTS = ['collections', 'textStyles', 'effectStyles', 'components', 'routes', 'fonts'] as const satisfies readonly (keyof PlanBundle)[];

function fileProblem(file: unknown): string | null {
  if (!isFields(file)) return 'the plan has no file settings';
  const { fileKey, pages, tolerance, sliceMs, receiver } = file;
  if (typeof fileKey !== 'string' || !Array.isArray(pages) || typeof tolerance !== 'number' || typeof sliceMs !== 'number' || typeof receiver !== 'string') {
    return 'the plan has no file key, pages, tolerance, slice or receiver';
  }
  return null;
}

/** Why a value is not a plan this plugin prints into this file, or null when it is one. */
function problemOf(value: unknown, fileKey: string | undefined): string | null {
  if (!isFields(value)) return 'the plan is not a JSON object';
  if (value.protocol !== PROTOCOL) return `the plan speaks protocol ${JSON.stringify(value.protocol)}, and this plugin ${String(PROTOCOL)}`;
  if (typeof value.revision !== 'string' || value.revision === '') return 'the plan names no revision';
  if (typeof value.complete !== 'boolean') return 'the plan does not say whether it is complete';
  const file = fileProblem(value.file);
  if (file !== null) return file;
  const missing = LISTS.filter((name) => !Array.isArray(value[name]));
  if (missing.length > 0) return `the plan has no ${missing.join(', ')} list`;
  const planned = isFields(value.file) ? value.file.fileKey : undefined;
  if (fileKey !== undefined && planned !== fileKey) return `the plan prints file ${String(planned)}, and this is file ${fileKey}`;
  return null;
}

const isPlan = (value: unknown, fileKey: string | undefined): value is PlanBundle => problemOf(value, fileKey) === null;

/** The plan, when it is one for this protocol and, when Figma names the file, for this file. */
export const readBundle = (value: unknown, fileKey: string | undefined): Result<PlanBundle, string> =>
  isPlan(value, fileKey) ? ok(value) : err(problemOf(value, fileKey) ?? 'the plan is unreadable');
