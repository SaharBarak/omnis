import type { QueryClient, QueryKey, UseMutationOptions } from '@tanstack/react-query'
import type { Edit } from './list-ops'

/**
 * A mutation that answers from the cache (docs/perf/APP_PERFORMANCE_PROMPT.md
 * "Mutations answer from the cache"). A declaration names the cached value it
 * changes, the request, and pure functions of that value; this module owns
 * the protocol around them, in TanStack Query's own callbacks:
 *
 * 1. Before the request: cancel the key's in-flight read, apply the guess.
 * 2. On failure: undo the guess, and only the guess.
 * 3. On success: apply the server's answer (a whole-value answer only when no
 *    later mutation's guess sits on top of it).
 * 4. Either way: refetch the key, the keys beneath it and the `also` keys in
 *    the background, each once no mutation under it is still running. The
 *    caller's promise resolves on the server's answer, not on the refetch.
 */

export interface CacheMutation<TData, TVariables, TResult> {
  /** The cached value this changes; queries beneath it derive from it and refresh with it. */
  readonly key: QueryKey
  readonly request: (variables: TVariables) => Promise<TResult>
  /** The guess, applied before the request leaves and undone if it fails. */
  readonly optimistic?: (variables: TVariables) => Edit<TData>
  /** An edit of the loaded value with the server's answer; a value not yet loaded stays unloaded. */
  readonly settle?: (result: TResult, variables: TVariables) => (data: TData) => TData
  /** The server's answer as the whole value, loaded or not, once no later mutation of the key is running. */
  readonly replace?: (result: TResult, variables: TVariables) => TData
  /** Other keys whose data embeds what this changes. */
  readonly also?: readonly QueryKey[]
  /** Run in order with the other serial mutations of this key, as autosaves must. */
  readonly serial?: boolean
}

export interface Rollback<TData> {
  readonly undo?: (current: TData) => TData
}

/** Writes a guess without making it look fresher than what the server last said. */
const writeGuess = <TData>(client: QueryClient, key: QueryKey, data: TData): void => {
  client.setQueryData<TData>(key, data, { updatedAt: client.getQueryState(key)?.dataUpdatedAt })
}

export function cacheMutation<TData, TVariables = void, TResult = unknown>({
  key,
  request,
  optimistic,
  settle,
  replace,
  also = [],
  serial = false,
}: CacheMutation<TData, TVariables, TResult>): UseMutationOptions<TResult, Error, TVariables, Rollback<TData>> {
  return {
    mutationKey: key,
    mutationFn: request,
    scope: serial ? { id: JSON.stringify(key) } : undefined,
    onMutate: async (variables, { client }) => {
      await client.cancelQueries({ queryKey: key, exact: true })
      const cached = client.getQueryData<TData>(key)
      if (optimistic === undefined || cached === undefined) return {}
      const guess = optimistic(variables)(cached)
      writeGuess(client, key, guess.data)
      return { undo: guess.undo }
    },
    onError: (_error, _variables, rollback, { client }) => {
      const cached = client.getQueryData<TData>(key)
      if (rollback?.undo !== undefined && cached !== undefined) writeGuess(client, key, rollback.undo(cached))
    },
    onSuccess: (result, variables, _rollback, { client }) => {
      // A whole-value answer would paint over a later mutation's guess; the last answer, or the refetch, lands instead.
      if (replace !== undefined && client.isMutating({ mutationKey: key }) <= 1) client.setQueryData<TData>(key, replace(result, variables))
      if (settle !== undefined) client.setQueryData<TData>(key, (data) => (data === undefined ? data : settle(result, variables)(data)))
    },
    onSettled: (_result, _error, _variables, _rollback, { client }) => {
      // Checked on the next task, when this mutation no longer counts as running, so of two that finish
      // together neither waits on the other; each key waits only for the mutations under it.
      setTimeout(() => {
        for (const queryKey of [key, ...also]) {
          if (client.isMutating({ mutationKey: queryKey }) === 0) void client.invalidateQueries({ queryKey })
        }
      }, 0)
    },
  }
}
