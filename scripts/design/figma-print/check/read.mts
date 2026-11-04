/**
 * The check's inputs as they come off the disk: JSON with no type until a
 * guard proves the parts the lines read. The planner and the plugin are the
 * only producers and both write the schema's types, so a guard proves the
 * shape the lines index into, not every field.
 */
import { isPrintName } from '../plan/prints.mts';
import type { PlanBundle, PrintReport } from '../plan/schema.mts';
import { PROTOCOL } from '../plan/schema.mts';
import { reportProblem } from '../reports.mts';

export type Read<Value> = { readonly ok: true; readonly value: Value } | { readonly ok: false; readonly error: string };

type Fields = Readonly<Record<string, unknown>>;
const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);
const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);
const isBox = (value: unknown): boolean => isList(value) && value.length === 4 && value.every((part) => typeof part === 'number' && Number.isFinite(part));
const text = (item: Fields, ...names: readonly string[]): boolean => names.every((name) => typeof item[name] === 'string');
const isTextList = (value: unknown): boolean => isList(value) && value.every((item) => typeof item === 'string');

/** The first item of a list that fails `ok`, as the problem it names, or null. */
function firstBad(list: readonly unknown[], name: string, ok: (item: Fields) => boolean): string | null {
  const at = list.findIndex((item) => !isFields(item) || !ok(item));
  return at < 0 ? null : `${name}[${at}] is not one`;
}

function bundleProblem(value: unknown): string | null {
  if (!isFields(value)) return 'the bundle is not a JSON object';
  if (value['protocol'] !== PROTOCOL) return `the bundle speaks protocol ${JSON.stringify(value['protocol'])}, not ${PROTOCOL}`;
  if (typeof value['revision'] !== 'string') return 'the bundle names no revision';
  if (typeof value['complete'] !== 'boolean') return 'the bundle does not say whether it is complete';
  const file = value['file'];
  if (!isFields(file) || typeof file['fileKey'] !== 'string' || typeof file['tolerance'] !== 'number') return 'the bundle has no file settings';
  const { routes, components } = value;
  const lists = ['collections', 'textStyles', 'effectStyles', 'components'].filter((name) => !isList(value[name]));
  if (lists.length > 0 || !isList(routes)) return `the bundle has no ${[...lists, ...(isList(routes) ? [] : ['routes'])].join(', ')} list`;
  const census = value['report'];
  if (!isFields(census) || !isFields(census['instances']) || !isList(census['frames'])) return 'the bundle has no census';
  const kit = isList(components) ? components : [];
  const variants = kit.flatMap((component) => (isFields(component) && isList(component['variants']) ? component['variants'] : []));
  return (
    firstBad(routes, 'routes', (route) => text(route, 'key', 'route', 'viewport') && isPrintName(route['print']) && isTextList(route['absent']) && isFields(route['frame'])) ??
    firstBad(kit, 'components', (component) => text(component, 'key') && isList(component['variants'])) ??
    firstBad(variants, 'variants', (variant) => text(variant, 'key', 'source') && isFields(variant['values']) && isFields(variant['root']))
  );
}

function printProblem(value: unknown): string | null {
  const envelope = reportProblem(value);
  if (envelope !== null) return envelope;
  if (!isFields(value)) return 'the report is not a JSON object';
  if ('print' in value) return `the report names one print for its file, and under protocol ${PROTOCOL} each frame is of its own`;
  if (typeof value['printer'] !== 'string') return 'the report names no printer';
  const { units, nodes, read, impure, strays, errors } = value;
  if (!isList(units) || !isList(nodes) || !isList(read) || !isList(impure) || !isList(strays) || !isList(errors)) return 'the report lacks its units, nodes, purity read, impure bindings, strays or errors';
  if (!isTextList(read)) return 'the report’s purity read is not a list of unit keys';
  return (
    firstBad(units, 'units', (unit) => text(unit, 'kind', 'key', 'status')) ??
    firstBad(nodes, 'nodes', (node) => text(node, 'key', 'type') && isBox(node['box'])) ??
    firstBad(impure, 'impure', (binding) => text(binding, 'unit', 'node', 'field', 'collection')) ??
    firstBad(strays, 'strays', (stray) => text(stray, 'unit', 'node')) ??
    firstBad(errors, 'errors', (error) => text(error, 'key', 'message'))
  );
}

const isBundle = (value: unknown): value is PlanBundle => bundleProblem(value) === null;
const isPrint = (value: unknown): value is PrintReport => printProblem(value) === null;

export const bundleOf = (value: unknown): Read<PlanBundle> => (isBundle(value) ? { ok: true, value } : { ok: false, error: bundleProblem(value) ?? 'the bundle is unreadable' });
export const printOf = (value: unknown): Read<PrintReport> => (isPrint(value) ? { ok: true, value } : { ok: false, error: printProblem(value) ?? 'the report is unreadable' });
