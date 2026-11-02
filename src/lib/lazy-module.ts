/**
 * A module loaded on first use through a dynamic import. Concurrent callers
 * share one load; a failed load is forgotten, so the next call retries
 * instead of replaying the same rejection for the life of the page.
 */
export function lazyModule<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null
  return () => {
    pending ??= load().catch((err: unknown) => {
      pending = null
      throw err
    })
    return pending
  }
}
