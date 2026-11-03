'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { NotificationSettings } from '@pleiad/engine/types/prediction'
import { fetchJson, jsonInit } from '@/lib/http/json'
import { cacheMutation } from '@/lib/query/cache-mutation'
import { QUERY_KEYS } from '@/lib/query/keys'
import { swap } from '@/lib/query/list-ops'

/**
 * The signed-in user's notification settings, one cache entry for every
 * screen that shows them (docs/perf/APP_PERFORMANCE_PROMPT.md "Server reads
 * go through queries"). The PUT replaces the whole record, so `save` merges a
 * patch into the cached record and sends all of it: a field a screen does not
 * show keeps its stored value. Saves run in order, so the last edit lands
 * last, and each carries everything the screen shows: a change whose own save
 * failed goes up again with the next one, so the stored record ends as the
 * screen does.
 */

const SETTINGS_URL = '/api/notifications/settings'

const SAVE = cacheMutation<NotificationSettings, NotificationSettings, NotificationSettings>({
  key: QUERY_KEYS.notificationSettings,
  serial: true,
  request: async (next) => (await fetchJson<{ data: NotificationSettings }>(SETTINGS_URL, jsonInit('PUT', next))).data,
  optimistic: (next) => swap(next),
  replace: (saved) => saved,
})

export function useNotificationSettings() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: QUERY_KEYS.notificationSettings,
    queryFn: async ({ signal }) => (await fetchJson<{ data: NotificationSettings }>(SETTINGS_URL, { signal })).data,
  })
  const { mutateAsync } = useMutation(SAVE)

  const save = useCallback(
    (patch: Partial<NotificationSettings>): Promise<NotificationSettings> => {
      const current = queryClient.getQueryData<NotificationSettings>(QUERY_KEYS.notificationSettings)
      if (current === undefined) return Promise.reject(new Error('Settings have not loaded yet'))
      return mutateAsync({ ...current, ...patch })
    },
    [queryClient, mutateAsync]
  )

  return {
    settings: query.data ?? null,
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    retry: query.refetch,
    save,
  }
}
