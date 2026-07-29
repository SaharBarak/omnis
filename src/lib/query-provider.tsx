'use client'

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE_MS }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
