import type { NotificationSettings } from '@pleiad/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { showToast } from '@/lib/toast'

/**
 * Notification preferences data layer — F12. GET returns server defaults
 * when nothing is stored yet; PUT sanitizes field by field, so partial
 * updates are safe.
 */

export const NOTIFICATION_SETTINGS_QUERY_KEY = ['notification-settings'] as const

export type NotificationSettingsPatch = Partial<Omit<NotificationSettings, 'userId'>>

export function useNotificationSettings(enabled = true) {
  return useQuery<NotificationSettings>({
    queryKey: NOTIFICATION_SETTINGS_QUERY_KEY,
    queryFn: () => api.notifications.getSettings(),
    staleTime: 60_000,
    enabled,
  })
}

interface Context {
  previous: NotificationSettings | undefined
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation<NotificationSettings, unknown, NotificationSettingsPatch, Context>({
    mutationFn: (patch) => api.notifications.updateSettings(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY })
      const previous = queryClient.getQueryData<NotificationSettings>(
        NOTIFICATION_SETTINGS_QUERY_KEY
      )
      if (previous !== undefined) {
        queryClient.setQueryData<NotificationSettings>(
          NOTIFICATION_SETTINGS_QUERY_KEY,
          { ...previous, ...patch }
        )
      }
      return { previous }
    },
    onError: (_error, _patch, context) => {
      queryClient.setQueryData(NOTIFICATION_SETTINGS_QUERY_KEY, context?.previous)
      showToast("The preference didn't hold. Try again.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY })
    },
  })
}
