'use client'

import { useMemo } from 'react'
import { useAuth } from './use-auth'
import {
  DEFAULT_SYSTEM_PREFERENCES,
  resolveSystemPreferences,
  type SystemKey,
} from '@/lib/system-preferences'

/**
 * Client hook over the shared preferred-systems resolver
 * (`@/lib/system-preferences`) — reads `profile.preferences.systems`
 * from the authed session. See that module for the semantics.
 */

export { DEFAULT_SYSTEM_PREFERENCES }
export type { SystemKey, ReadingSystemKey, CalendarSystemKey } from '@/lib/system-preferences'

export interface SystemPreferences {
  enabledSystems: Record<SystemKey, boolean>
  isSystemEnabled: (system: SystemKey) => boolean
  loading: boolean
}

export function useSystemPreferences(): SystemPreferences {
  const { profile, loading } = useAuth()

  const enabledSystems = useMemo(
    () => resolveSystemPreferences(profile?.preferences),
    [profile]
  )

  const isSystemEnabled = (system: SystemKey): boolean => {
    return enabledSystems[system] ?? true
  }

  return {
    enabledSystems,
    isSystemEnabled,
    loading,
  }
}
