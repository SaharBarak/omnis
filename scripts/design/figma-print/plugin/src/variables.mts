/**
 * Variables (docs/redesign/FIGMA_PRINT.md §6): one unit per collection, reconciled in
 * place by key, so every binding to a variable survives a rebuild. Each
 * collection has one mode, named for the print it holds (prints.mts), and
 * an alias may reach into another collection: a twin print's variable
 * aliases its primary twin where the prints agree.
 */
import type { CollectionSpec, VariableScope as PlanScope, VariableSpec, VariableValue as PlanValue } from '../../plan/schema.mts';
import { rgbaHexOf, rgbaOf } from './colors.mts';
import type { Library } from './context.mts';
import type { Journal, UnitStatus } from './journal.mts';
import { isKeyed, keyOf, mark } from './keys.mts';
import { sameFloat } from './numbers.mts';
import { printOfCollection } from './prints.mts';

/** Plan scopes are Figma's, by name; `satisfies` proves the schema names none Figma lacks. */
const SCOPES = (scopes: readonly PlanScope[]): VariableScope[] => scopes.map((scope) => scope satisfies VariableScope);

/** The code syntax platform a variable's custom property prints under. */
const WEB = 'WEB' satisfies CodeSyntaxPlatform;

/** The keyed variables and collections in the file, and every local one. */
export interface FileVariables {
  readonly collections: Map<string, VariableCollection>;
  readonly variables: Map<string, Variable>;
  readonly allCollections: readonly VariableCollection[];
  readonly allVariables: readonly Variable[];
}

/** Indexes the file's local variables by key; a key held twice keeps its first holder and reports the rest. */
export async function readFileVariables(journal: Journal): Promise<FileVariables> {
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = await figma.variables.getLocalVariablesAsync();
  const byKey = <Item extends PluginDataMixin & { readonly name: string }>(items: readonly Item[]): Map<string, Item> => {
    const found = new Map<string, Item>();
    for (const item of items.filter(isKeyed)) {
      const key = keyOf(item);
      if (found.has(key)) journal.error(key, `${item.name} carries a key another one carries; it is left as it is`);
      else found.set(key, item);
    }
    return found;
  };
  return { collections: byKey(allCollections), variables: byKey(allVariables), allCollections, allVariables };
}

/** What a collection unit reads and fills. */
export interface VariablesContext {
  readonly file: FileVariables;
  readonly specs: ReadonlyMap<string, { readonly spec: VariableSpec; readonly collection: CollectionSpec }>;
  readonly library: Library;
  readonly journal: Journal;
  /** Whether the plan is complete: a partial one removes no variable. */
  readonly complete: boolean;
}

/** Counts the edits a unit makes, so an unchanged unit reports so. */
interface Tally {
  edits: number;
}

function ensureCollection(spec: CollectionSpec, scope: VariablesContext, tally: Tally): VariableCollection {
  const found = scope.file.collections.get(spec.key);
  const collection = found ?? figma.variables.createVariableCollection(spec.name);
  if (!found) {
    mark(collection, { key: spec.key });
    scope.file.collections.set(spec.key, collection);
    tally.edits += 1;
  }
  if (collection.name !== spec.name) {
    collection.name = spec.name;
    tally.edits += 1;
  }
  const print = printOfCollection(spec.key);
  const mode = collection.modes.find((one) => one.modeId === collection.defaultModeId);
  if (print !== null && mode && mode.name !== print) {
    collection.renameMode(collection.defaultModeId, print);
    tally.edits += 1;
  }
  return collection;
}

const sameScopes = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().join() === [...b].sort().join();

function describe(variable: Variable, spec: VariableSpec, tally: Tally): void {
  if (variable.name !== spec.name) {
    variable.name = spec.name;
    tally.edits += 1;
  }
  const description = spec.description ?? '';
  if (variable.description !== description) {
    variable.description = description;
    tally.edits += 1;
  }
  if (!sameScopes(variable.scopes, spec.scopes)) {
    variable.scopes = SCOPES(spec.scopes);
    tally.edits += 1;
  }
  const web = variable.codeSyntax[WEB];
  if (spec.css !== undefined && web !== spec.css) {
    variable.setVariableCodeSyntax(WEB, spec.css);
    tally.edits += 1;
  } else if (spec.css === undefined && web !== undefined) {
    variable.removeVariableCodeSyntax(WEB);
    tally.edits += 1;
  }
}

/** A plan variable in its collection: found by key, recreated when its type or collection moved, described as the plan says. */
function ensureVariable(key: string, scope: VariablesContext, tally: Tally): Variable | null {
  const entry = scope.specs.get(key);
  if (!entry) return null;
  const { spec } = entry;
  const collection = ensureCollection(entry.collection, scope, tally);
  const found = scope.file.variables.get(key);
  const moved = found !== undefined && (found.resolvedType !== spec.type || found.variableCollectionId !== collection.id);
  if (found && moved) {
    found.remove();
    tally.edits += 1;
  }
  const kept = moved ? undefined : found;
  const variable = kept ?? figma.variables.createVariable(spec.name, collection, spec.type);
  if (!kept) {
    mark(variable, { key });
    scope.file.variables.set(key, variable);
    tally.edits += 1;
  }
  describe(variable, spec, tally);
  scope.library.variables.set(key, variable);
  scope.library.variableKeys.set(variable.id, key);
  return variable;
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === 'object' && value !== null;
const isAlias = (value: unknown): value is VariableAlias => isRecord(value) && value.type === 'VARIABLE_ALIAS' && typeof value.id === 'string';
const isColor = (value: unknown): value is RGB | RGBA => isRecord(value) && typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number';
const alphaOf = (color: RGB | RGBA): number => ('a' in color ? color.a : 1);

/** Whether the file's value is the one the plan asks for. */
function sameValue(current: VariableValue | undefined, wanted: VariableValue): boolean {
  if (current === undefined) return false;
  if (isAlias(wanted) || isAlias(current)) return isAlias(wanted) && isAlias(current) && wanted.id === current.id;
  if (isColor(wanted) && isColor(current)) return rgbaHexOf({ ...current, a: alphaOf(current) }) === rgbaHexOf({ ...wanted, a: alphaOf(wanted) });
  if (typeof wanted === 'number' && typeof current === 'number') return sameFloat(wanted, current);
  return current === wanted;
}

/** A plan value as Figma's; an alias makes sure its target exists first. */
function figmaValueOf(value: PlanValue, needer: string, scope: VariablesContext, tally: Tally): VariableValue | null {
  switch (value.kind) {
    case 'color':
      return rgbaOf(value.rgba);
    case 'float':
    case 'string':
      return value.value;
    case 'alias': {
      const target = ensureVariable(value.key, scope, tally);
      if (!target) scope.journal.error(needer, `it aliases ${value.key}, which the plan does not define`);
      return target ? figma.variables.createVariableAlias(target) : null;
    }
  }
}

/** Sets a variable's value in its collection's one mode, when it differs. */
function setValue(variable: Variable, modeId: string, value: VariableValue): boolean {
  if (sameValue(variable.valuesByMode[modeId], value)) return false;
  variable.setValueForMode(modeId, value);
  return true;
}

/** One collection: its variables, their descriptions and values, and the keyed ones it no longer names removed. */
export function printCollection(spec: CollectionSpec, scope: VariablesContext): UnitStatus {
  const tally: Tally = { edits: 0 };
  const collection = ensureCollection(spec, scope, tally);
  for (const variableSpec of spec.variables) {
    const variable = ensureVariable(variableSpec.key, scope, tally);
    if (!variable) continue;
    const value = figmaValueOf(variableSpec.value, variableSpec.key, scope, tally);
    if (value !== null && setValue(variable, collection.defaultModeId, value)) tally.edits += 1;
  }
  const named = new Set(spec.variables.map((variable) => variable.key));
  for (const variable of scope.file.allVariables) {
    if (!scope.complete || variable.variableCollectionId !== collection.id || !isKeyed(variable) || named.has(keyOf(variable))) continue;
    if (scope.file.variables.get(keyOf(variable)) === variable) scope.file.variables.delete(keyOf(variable));
    variable.remove();
    tally.edits += 1;
  }
  return tally.edits > 0 ? 'built' : 'unchanged';
}

/** Keyed collections the plan no longer names: removed once no variable a person made is left in them. */
export function strayCollections(collections: readonly CollectionSpec[], scope: VariablesContext): readonly VariableCollection[] {
  const named = new Set(collections.map((collection) => collection.key));
  return scope.file.allCollections.filter((collection) => isKeyed(collection) && !named.has(keyOf(collection)));
}

/** Removes a stray collection's keyed variables, then the collection when nothing of a person's is left in it. */
export function pruneCollection(collection: VariableCollection, scope: VariablesContext): UnitStatus {
  const inside = scope.file.allVariables.filter((variable) => variable.variableCollectionId === collection.id);
  for (const variable of inside.filter(isKeyed)) variable.remove();
  const kept = inside.filter((variable) => !isKeyed(variable));
  if (kept.length > 0) {
    scope.journal.error(keyOf(collection), `the plan no longer names this collection; it holds ${String(kept.length)} variables a person made, so it stays`);
    return inside.length > kept.length ? 'built' : 'unchanged';
  }
  collection.remove();
  return 'built';
}
