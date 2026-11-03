'use client'

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider, defaultShouldDehydrateQuery, type Query } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState } from 'react'

/**
 * App-wide TanStack Query provider with localStorage persistence.
 *
 * The API sits in front of a Sydney-pinned database, so a network round trip
 * costs hundreds of milliseconds; persistence lets revisited screens paint
 * from the last-known data instantly while refetching in the background.
 * gcTime must outlive the persister's maxAge or entries are garbage-collected
 * before they can be restored.
 *
 * On the server (and the first client render, keeping hydration identical)
 * there is no localStorage — a plain provider is used there.
 *
 * Only confirmed data is persisted: a query with a mutation running under its
 * key holds a guess (lib/query/cache-mutation.ts) and is skipped until the
 * mutation settles; mutations themselves are never stored, since nothing
 * replays them offline; and a query may opt out with `meta: { persist: false }`.
 */

/** localStorage key — removed wholesale on sign-out (see use-auth). */
export const QUERY_CACHE_STORAGE_KEY = 'pleiad-query-cache'

const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: PERSIST_MAX_AGE_MS,
            retry: 2,
          },
        },
      })
  )
  const [persister] = useState(() =>
    typeof window === 'undefined'
      ? null
      : createSyncStoragePersister({
          storage: window.localStorage,
          key: QUERY_CACHE_STORAGE_KEY,
          throttleTime: 1_000,
        })
  )

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query: Query) =>
            defaultShouldDehydrateQuery(query) &&
            query.meta?.persist !== false &&
            queryClient.isMutating({ mutationKey: query.queryKey }) === 0,
          shouldDehydrateMutation: () => false,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
