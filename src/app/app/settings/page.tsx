'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard'
import { RotateCcw, Save } from 'lucide-react'

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

// Common timezones for selection
const COMMON_TIMEZONES = [
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  { value: 'UTC', label: 'UTC' },
]

export interface SystemPreferences {
  enabledSystems: Record<SystemKey, boolean>
}

export default function SettingsPage() {
  const { profile, updateProfile, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingDisplay, setSavingDisplay] = useState(false)
  const [savedDisplay, setSavedDisplay] = useState(false)

  // Extract system preferences from profile
  const preferences = (profile?.preferences as { systems?: Record<SystemKey, boolean> } | null)?.systems ?? DEFAULT_PREFERENCES

  // Local state for toggles
  const [enabledSystems, setEnabledSystems] = useState<Record<SystemKey, boolean>>(DEFAULT_PREFERENCES)

  // Display settings state
  const [locale, setLocale] = useState<'he' | 'en'>(profile?.locale ?? 'en')
  const [timezone, setTimezone] = useState<string>(profile?.timezone ?? 'Asia/Jerusalem')

  // Initialize from profile
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as { systems?: Record<SystemKey, boolean> }
      if (prefs.systems) {
        setEnabledSystems({ ...DEFAULT_PREFERENCES, ...prefs.systems })
      }
    }
    if (profile?.locale) {
      setLocale(profile.locale)
    }
    if (profile?.timezone) {
      setTimezone(profile.timezone)
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
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Customize the systems displayed"
      />

      <div className="surface-card p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">Symbolic Systems</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which systems will be displayed on profile pages
        </p>

        <div className="space-y-4">
          {SYSTEMS.map((system) => (
            <div
              key={system.key}
              className="flex items-center justify-between py-4 border-b border-border last:border-0"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{system.icon}</span>
                <div>
                  <Label htmlFor={system.key} className="text-base font-medium text-foreground cursor-pointer">
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

          <div className="flex items-center gap-3 pt-4 border-t border-border mt-6">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleResetDefaults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="surface-card p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-1">Display Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure language and timezone preferences
        </p>

        <div className="space-y-6">
          {/* Language */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium text-foreground">Language</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choose your preferred interface language
              </p>
            </div>
            <Select value={locale} onValueChange={(value: 'he' | 'en') => {
              setLocale(value)
              setSavedDisplay(false)
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="he">עברית (Hebrew)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium text-foreground">Timezone</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Used for date/time calculations and predictions
              </p>
            </div>
            <Select value={timezone} onValueChange={(value) => {
              setTimezone(value)
              setSavedDisplay(false)
            }}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border mt-6">
            <Button
              onClick={async () => {
                setSavingDisplay(true)
                try {
                  await updateProfile({ locale, timezone })
                  setSavedDisplay(true)
                  setTimeout(() => setSavedDisplay(false), 2000)
                } catch (error) {
                  console.error('Error saving display settings:', error)
                } finally {
                  setSavingDisplay(false)
                }
              }}
              disabled={savingDisplay}
            >
              <Save className="w-4 h-4 mr-2" />
              {savingDisplay ? 'Saving...' : savedDisplay ? 'Saved!' : 'Save Display Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton
function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Systems card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-border last:border-0">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Display settings card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-4 w-36 mb-1" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-20 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-20 mb-1" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-10 w-56" />
          </div>
        </div>
      </div>
    </div>
  )
}
