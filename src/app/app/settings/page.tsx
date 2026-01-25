'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// System definitions
type SystemKey = 'dreamspell' | 'tzolkin' | 'longcount' | 'astrology' | 'humandesign' | 'gematria'

interface SystemInfo {
  key: SystemKey
  label: string
  icon: string
  description: string
  requiresTime?: boolean
  requiresLocation?: boolean
}

const SYSTEMS: SystemInfo[] = [
  {
    key: 'dreamspell',
    label: 'Dreamspell',
    icon: '🌈',
    description: 'Modern Mayan calendar system by Jose Arguelles',
  },
  {
    key: 'tzolkin',
    label: 'Tzolkin',
    icon: '🗓️',
    description: 'Traditional Mayan 260-day sacred calendar',
  },
  {
    key: 'longcount',
    label: 'Long Count',
    icon: '🏛️',
    description: 'Ancient Mayan long count calendar system',
  },
  {
    key: 'astrology',
    label: 'Astrology',
    icon: '⭐',
    description: 'Western natal chart astrology',
    requiresTime: true,
    requiresLocation: true,
  },
  {
    key: 'humandesign',
    label: 'Human Design',
    icon: '🧬',
    description: 'Bodygraph analysis combining multiple systems',
    requiresTime: true,
    requiresLocation: true,
  },
  {
    key: 'gematria',
    label: 'Gematria',
    icon: '🔢',
    description: 'Hebrew numerology based on letter values',
  },
]

// Default system preferences - all enabled
const DEFAULT_PREFERENCES: Record<SystemKey, boolean> = {
  dreamspell: true,
  tzolkin: true,
  longcount: true,
  astrology: true,
  humandesign: true,
  gematria: true,
}

export interface SystemPreferences {
  enabledSystems: Record<SystemKey, boolean>
}

export default function SettingsPage() {
  const { profile, updateProfile, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Extract system preferences from profile
  const preferences = (profile?.preferences as { systems?: Record<SystemKey, boolean> } | null)?.systems ?? DEFAULT_PREFERENCES

  // Local state for toggles
  const [enabledSystems, setEnabledSystems] = useState<Record<SystemKey, boolean>>(DEFAULT_PREFERENCES)

  // Initialize from profile
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as { systems?: Record<SystemKey, boolean> }
      if (prefs.systems) {
        setEnabledSystems({ ...DEFAULT_PREFERENCES, ...prefs.systems })
      }
    }
  }, [profile])

  const handleToggle = (key: SystemKey, enabled: boolean) => {
    setEnabledSystems(prev => ({
      ...prev,
      [key]: enabled,
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentPrefs = (profile?.preferences as Record<string, unknown>) || {}
      await updateProfile({
        preferences: {
          ...currentPrefs,
          systems: enabledSystems,
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setEnabledSystems(DEFAULT_PREFERENCES)
    setSaved(false)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize the systems displayed
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Symbolic Systems</CardTitle>
          <CardDescription>
            Choose which systems will be displayed on your profile page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SYSTEMS.map((system) => (
            <div
              key={system.key}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{system.icon}</span>
                <div>
                  <Label htmlFor={system.key} className="text-base font-medium cursor-pointer">
                    {system.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {system.description}
                  </p>
                  {(system.requiresTime || system.requiresLocation) && (
                    <p className="text-xs text-amber-600 mt-1">
                      {system.requiresTime && system.requiresLocation && 'Requires birth time and location for full accuracy'}
                      {system.requiresTime && !system.requiresLocation && 'Requires birth time for full accuracy'}
                      {!system.requiresTime && system.requiresLocation && 'Requires birth location for full accuracy'}
                    </p>
                  )}
                </div>
              </div>
              <Switch
                id={system.key}
                checked={enabledSystems[system.key]}
                onCheckedChange={(checked) => handleToggle(system.key, checked)}
              />
            </div>
          ))}

          <div className="flex items-center gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleResetDefaults}>
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Future sections placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>
            Coming soon...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Additional settings will be added in future versions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
