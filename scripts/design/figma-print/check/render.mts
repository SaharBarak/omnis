/**
 * The check's verdict as people read it: a Markdown page in the revision's
 * reports directory, and a summary for the terminal.
 */
import type { PlanBundle, PrintReport } from '../plan/schema.mts';
import { counted, type Evidence, type Line, type Offender, type Status } from './lines.mts';

export interface Source {
  readonly bundle: PlanBundle;
  readonly report: PrintReport;
  /** Where the report was read from, as the reader should see it. */
  readonly path: string;
  /** Where the report F7 compares with was read from, when there was one. */
  readonly previous: string | null;
}

const STATUSES: readonly Status[] = ['PASS', 'FAIL', 'UNPROVEN'];
const STATUS_WIDTH = Math.max(...STATUSES.map((status) => status.length));

/** Inline code that holds any text: its fence is one backtick longer than the longest run inside. */
function code(text: string): string {
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map((run) => run[0].length));
  const fence = '`'.repeat(longest + 1);
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

/** Text safe in a Markdown table cell. */
const cell = (text: string): string => text.replaceAll('|', '\\|').replaceAll('\n', ' ');

const rest = (evidence: Evidence): number => (evidence.total ?? 0) - (evidence.offenders?.length ?? 0);

function offendersOf(evidence: Evidence, key: (text: string) => string): string {
  const named = (evidence.offenders ?? []).map((offender: Offender) => `${key(offender.key)}${offender.detail ? ` (${offender.detail})` : ''}`);
  if (named.length === 0) return '';
  return `: ${named.join(', ')}${rest(evidence) > 0 ? `, and ${rest(evidence)} more` : ''}`;
}

/** How many lines have each status, in a phrase. */
export const tallyOf = (lines: readonly Line[]): string =>
  STATUSES.map((status) => `${lines.filter((line) => line.status === status).length} ${status.toLowerCase()}`).join(', ');

export function markdownOf({ bundle, report, path, previous }: Source, lines: readonly Line[]): string {
  const { stamp } = bundle;
  const build = stamp.buildId ? `, build ${code(stamp.buildId)}` : '';
  return [
    '# Figma print check',
    '',
    `Revision ${code(report.revision)}, printed by printer ${code(report.printer.slice(0, 16))} into file ${code(report.fileKey ?? 'unknown')} from ${report.startedAt} to ${report.finishedAt}. ` +
      `The plan measured commit ${code(stamp.commit)}${build} at ${stamp.base} on ${stamp.measuredAt}. The tolerance is ${bundle.file.tolerance} px.`,
    '',
    `The report is ${code(path)}${previous ? `, compared for F7 with ${code(previous)}` : ''}. ` +
      `It lists ${counted(report.nodes.length, 'node')}, ${counted(report.fallbacks.length, 'layout fallback')}, ${counted(report.missingFonts.length, 'missing font')} and ${counted(report.errors.length, 'error')}.`,
    '',
    `**${tallyOf(lines)}.**`,
    '',
    '| Line | Status | Evidence |',
    '| ---- | ------ | -------- |',
    ...lines.map((line) => `| ${line.id} | ${line.status} | ${cell(line.evidence[0]?.text ?? '')} |`),
    '',
    ...lines.flatMap((line) => [`## ${line.id} · ${line.status}`, '', `${line.title}.`, '', ...line.evidence.map((evidence) => `- ${evidence.text}${offendersOf(evidence, code)}`), '']),
  ].join('\n');
}

/** One line per acceptance line, and for each that does not pass, its evidence under it. */
export function summaryOf(lines: readonly Line[]): readonly string[] {
  return lines.flatMap((line) => {
    const head = `${line.id}  ${line.status.padEnd(STATUS_WIDTH)}  `;
    const under = line.status === 'PASS' ? [] : line.evidence.slice(1);
    return [`${head}${line.evidence[0]?.text ?? ''}`, ...under.map((evidence) => `${' '.repeat(head.length)}${evidence.text}${offendersOf(evidence, (key) => key)}`)];
  });
}
