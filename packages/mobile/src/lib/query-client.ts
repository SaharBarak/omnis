import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'

/**
 * Single app-wide query client — module-scoped so non-React code (the auth
 * store's sign-out cache purge, F12) can reach it without a provider.
 *
 * The cache persists to AsyncStorage (see persister below + the
 * PersistQueryClientProvider in app/_layout.tsx) so screens paint from the
 * last-known data immediately after cold start and refetch in the background.
 * The API lives an ocean away (Sydney-pinned database) — persistence takes
 * that latency out of the critical path. gcTime must outlive the persister's
 * maxAge or entries are garbage-collected before they can be restored.
 */
/** How long restored cache entries remain usable before being dropped. */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: PERSIST_MAX_AGE_MS,
      retry: 2,
    },
  },
})

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'pleiad-query-cache',
  // Batch rapid cache updates into one AsyncStorage write.
  throttleTime: 1_000,
})
