/**
 * One print's state: the plan, the pages, the fonts, and the library each
 * stage fills for the stages after it (variables, then styles, then the
 * components routes instantiate).
 */
import type { PlanBundle, Rgba, TextStyleSpec } from '../../plan/schema.mts';
import { attemptSync } from './failure.mts';
import type { FontBook } from './fonts.mts';
import type { Journal } from './journal.mts';
import type { Mains } from './mains.mts';
import type { Pages } from './pages.mts';
import type { Slicer } from './slice.mts';

/** What the units print with, by plan key, and the plan keys of what the file holds. */
export interface Library {
  readonly variables: Map<string, Variable>;
  /** Plan keys by Figma variable id. */
  readonly variableKeys: Map<string, string>;
  readonly textStyles: Map<string, TextStyle>;
  /** Plan keys by Figma style id. */
  readonly styleKeys: Map<string, string>;
  readonly effectStyles: Map<string, EffectStyle>;
}

export const createLibrary = (): Library => ({
  variables: new Map(),
  variableKeys: new Map(),
  textStyles: new Map(),
  styleKeys: new Map(),
  effectStyles: new Map(),
});

export interface Run {
  readonly bundle: PlanBundle;
  readonly journal: Journal;
  readonly slicer: Slicer;
  readonly pages: Pages;
  readonly fonts: FontBook;
  readonly library: Library;
  /** The colour each variable shows, by plan key, through aliases: what a recolor matches a drawing's paints by. */
  readonly colors: ReadonlyMap<string, Rgba>;
  /** The plan's text styles by key. */
  readonly textStyleSpecs: ReadonlyMap<string, TextStyleSpec>;
  readonly mains: Mains;
}

/** The variable a plan key names; a key the file does not hold is recorded once against the node that needs it. */
export function variableOf(run: Run, key: string, needer: string): Variable | null {
  const variable = run.library.variables.get(key);
  if (!variable) run.journal.error(needer, `the variable ${key} is not in the file; the raw value printed`);
  return variable ?? null;
}

/**
 * Runs one property write the API may refuse, and keeps the refusal to the
 * node that asked: the node prints without that property, and the journal
 * says which one.
 */
export const guard = (run: Run, needer: string, what: string, work: () => void): boolean =>
  attemptSync(work).match(
    () => true,
    (message) => {
      run.journal.error(needer, `${what}: ${message}`);
      return false;
    },
  );
