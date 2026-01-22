'use client'

import { useMemo } from 'react'
import { useAuth } from './use-auth'

// System keys matching the database enum
export type SystemKey = 'dreamspell' | 'tzolkin' | 'longcount' | 'astrology' | 'humandesign' | 'gematria'

// Default - all systems enabled
export const DEFAULT_SYSTEM_PREFERENCES: Record<SystemKey, boolean> = {
  dreamspell: true,
  tzolkin: true,
  longcount: true,
  astrology: true,
  humandesign: true,
  gematria: true,
}

export interface SystemPreferences {
  enabledSystems: Record<SystemKey, boolean>
  isSystemEnabled: (system: SystemKey) => boolean
  loading: boolean
}

export function useSystemPreferences(): SystemPreferences {
  const { profile, loading } = useAuth()

  const enabledSystems = useMemo(() => {
    if (!profile?.preferences) {
      return DEFAULT_SYSTEM_PREFERENCES
    }

    const prefs = profile.preferences as { systems?: Record<SystemKey, boolean> }
    if (!prefs.systems) {
      return DEFAULT_SYSTEM_PREFERENCES
    }

    // Merge with defaults to ensure all keys exist
    return {
      ...DEFAULT_SYSTEM_PREFERENCES,
      ...prefs.systems,
    }
  }, [profile])

  const isSystemEnabled = (system: SystemKey): boolean => {
    return enabledSystems[system] ?? true
  }

  return {
    enabledSystems,
    isSystemEnabled,
    loading,
  }
}
