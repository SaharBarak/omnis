/**
 * Throws as values: the Figma API reports most refusals by throwing, and the
 * print isolates every node and every unit, so each throw becomes a Result.
 */
import { Result, ResultAsync } from 'neverthrow';

export const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** Runs work that may throw or reject. */
export const attempt = <Value,>(work: () => Value | PromiseLike<Value>): ResultAsync<Value, string> =>
  ResultAsync.fromPromise(Promise.resolve().then(work), messageOf);

/** Runs work that may throw. */
export const attemptSync = <Value,>(work: () => Value): Result<Value, string> => Result.fromThrowable(work, messageOf)();
