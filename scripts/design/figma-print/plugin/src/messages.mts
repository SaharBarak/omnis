/**
 * What the panel and the main thread say to each other. The panel decodes
 * the plan it carries and posts it; the main thread prints it and answers
 * with progress, the report and the captures it found.
 */
import type { PrintReport } from '../../plan/schema.mts';

/** An unkeyed top-level node on a page the plugin writes: a person's, or an old capture. */
export interface Capture {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly page: string;
}

/** The plan the panel shows, from its stamp. */
export interface PlanFacts {
  readonly revision: string;
  readonly commit: string;
  readonly measuredAt: string;
}

export type ToMain =
  | { readonly type: 'plan'; readonly bundle: unknown }
  | { readonly type: 'decode-failed'; readonly message: string }
  | { readonly type: 'remove-captures'; readonly ids: readonly string[] }
  | { readonly type: 'resume'; readonly turn: number };

export type ToUi =
  | { readonly type: 'turn'; readonly turn: number }
  | { readonly type: 'state'; readonly plan: PlanFacts | null; readonly running: boolean }
  | { readonly type: 'progress'; readonly done: number; readonly total: number; readonly label: string }
  | { readonly type: 'fatal'; readonly message: string }
  | { readonly type: 'report'; readonly report: PrintReport }
  | { readonly type: 'receiver'; readonly ok: boolean; readonly message: string }
  | { readonly type: 'captures'; readonly captures: readonly Capture[] }
  | { readonly type: 'removed'; readonly removed: number; readonly kept: number };

type Fields = Readonly<Record<string, unknown>>;
const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The message types each side reads, so a guard checks the discriminant against the union. */
const TO_MAIN = { plan: true, 'decode-failed': true, 'remove-captures': true, resume: true } as const satisfies Record<ToMain['type'], true>;
const TO_UI = { turn: true, state: true, progress: true, fatal: true, report: true, receiver: true, captures: true, removed: true } as const satisfies Record<ToUi['type'], true>;

const typed = (table: Fields, value: unknown): value is Fields & { readonly type: string } =>
  isFields(value) && typeof value.type === 'string' && Object.prototype.hasOwnProperty.call(table, value.type);

/**
 * A message the main thread reads. Only the panel posts to it, so the guard
 * proves the discriminant and the fields each branch reads.
 */
export function isToMain(value: unknown): value is ToMain {
  if (!typed(TO_MAIN, value)) return false;
  switch (value.type) {
    case 'remove-captures':
      return Array.isArray(value.ids) && value.ids.every((id) => typeof id === 'string');
    case 'decode-failed':
      return typeof value.message === 'string';
    case 'resume':
      return typeof value.turn === 'number';
    default:
      return true;
  }
}

/** A message the panel reads; only the main thread posts to it. */
export const isToUi = (value: unknown): value is ToUi => typed(TO_UI, value);
