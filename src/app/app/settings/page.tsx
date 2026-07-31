'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  RotateCcw,
  Save,
  Orbit,
  CalendarDays,
  Landmark,
  Star,
  Dna,
  Hash,
  Calculator,
  Grid3x3,
  Sprout,
  Sparkles,
  Moon,
  Telescope,
  ScrollText,
  MoonStar,
  Sun,
  Flame,
  Sunrise,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  DEFAULT_SYSTEM_PREFERENCES,
  SYSTEM_CATALOG,
  resolveSystemPreferences,
  type SystemInfo as SharedSystemInfo,
  type SystemKey,
} from '@/lib/system-preferences'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard'
import {
  EASE_OUT,
  Eyebrow,
  fadeUp,
  staggerParent,
  VIEWPORT_ONCE,
} from '@/components/app-kit'
import { cn } from '@/lib/utils'

// System definitions — keys come from the shared preference module so the
// chooser, the person tabs, the Today board, and the digest email agree.
// Copy lives in the shared catalog; only the icon is web's to choose.
type SystemInfo = SharedSystemInfo & { icon: LucideIcon }

const SYSTEM_ICONS: Record<SystemKey, LucideIcon> = {
  dreamspell: Orbit,
  tzolkin: CalendarDays,
  longcount: Landmark,
  astrology: Star,
  humandesign: Dna,
  gematria: Hash,
  numerology: Calculator,
  bazi: Grid3x3,
  genekeys: Sprout,
  oracles: Sparkles,
  moon: Moon,
  sidereal: Telescope,
  hebrew: ScrollText,
  hijri: MoonStar,
  persian: Sun,
  chinese: Flame,
  panchang: Sunrise,
}

const SYSTEMS: SystemInfo[] = SYSTEM_CATALOG.map((system) => ({
  ...system,
  icon: SYSTEM_ICONS[system.key],
}))

const GROUPS: { id: SystemInfo['group']; title: string; blurb: string }[] = [
  {
    id: 'readings',
    title: 'Reading systems',
    blurb: 'Shape person pages and your readings',
  },
  {
    id: 'calendars',
    title: 'Calendars & sky',
    blurb: 'Shape the Today board and your daily brief',
  },
]

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

/** Requirement note for systems that need extra birth data. */
function requirementNote(system: SystemInfo): string | null {
  if (system.requiresTime && system.requiresLocation)
    return 'Requires birth time and location for full accuracy'
  if (system.requiresTime) return 'Requires birth time for full accuracy'
  if (system.requiresLocation) return 'Requires birth location for full accuracy'
  return null
}

export default function SettingsPage() {
  const { profile, updateProfile, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingDisplay, setSavingDisplay] = useState(false)
  const [savedDisplay, setSavedDisplay] = useState(false)
  const reduced = useReducedMotion()

  // Local state for toggles
  const [enabledSystems, setEnabledSystems] = useState<Record<SystemKey, boolean>>(DEFAULT_SYSTEM_PREFERENCES)

  // Display settings state
  const [locale, setLocale] = useState<'he' | 'en'>(profile?.locale ?? 'en')
  const [timezone, setTimezone] = useState<string>(profile?.timezone ?? 'Asia/Jerusalem')

  // Initialize from profile
  useEffect(() => {
    if (profile?.preferences) {
      setEnabledSystems(resolveSystemPreferences(profile.preferences))
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
    setEnabledSystems(DEFAULT_SYSTEM_PREFERENCES)
    setSaved(false)
  }

  if (authLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Customize the systems displayed"
      />

      <motion.div
        className="surface-card p-6"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.5, ease: EASE_OUT as [number, number, number, number] }}
      >
        <div className="mb-6 flex flex-col gap-1">
          <Eyebrow>Symbolic Systems</Eyebrow>
          <p className="text-sm text-white/50">
            Choose your systems — they shape person pages, the Today board,
            and your daily brief
          </p>
        </div>

        <motion.div
          variants={staggerParent}
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
        >
          {GROUPS.map((group, groupIndex) => (
            <div key={group.id} className={cn(groupIndex > 0 && 'mt-8')}>
              <div className="mb-1 flex items-baseline gap-3">
                <h3 className="font-display font-semibold tracking-tight text-white/90">
                  {group.title}
                </h3>
                <span className="text-xs text-white/40">{group.blurb}</span>
              </div>
              {SYSTEMS.filter((s) => s.group === group.id).map((system) => {
                const note = requirementNote(system)
                return (
                  <motion.div
                    key={system.key}
                    variants={fadeUp}
                    className="flex items-center justify-between border-b border-white/[0.07] py-4 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <system.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <Label
                          htmlFor={system.key}
                          className="cursor-pointer text-base font-medium text-white/90"
                        >
                          {system.label}
                        </Label>
                        <p className="mt-0.5 text-sm text-white/50">{system.description}</p>
                        {note && <p className="mt-1 text-xs text-amber">{note}</p>}
                      </div>
                    </div>
                    <Switch
                      id={system.key}
                      checked={enabledSystems[system.key]}
                      onCheckedChange={(checked) => handleToggle(system.key, checked)}
                    />
                  </motion.div>
                )
              })}
            </div>
          ))}
        </motion.div>

        <div className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
          >
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl active:scale-[0.98]"
            onClick={handleResetDefaults}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reset to Defaults
          </Button>
        </div>
      </motion.div>

      {/* Display Settings */}
      <motion.div
        className="surface-card p-6"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{
          duration: 0.5,
          delay: 0.06,
          ease: EASE_OUT as [number, number, number, number],
        }}
      >
        <div className="mb-2 flex flex-col gap-1">
          <Eyebrow>Display Settings</Eyebrow>
          <p className="text-sm text-white/50">
            Configure language and timezone preferences
          </p>
        </div>

        <div>
          {/* Language */}
          <div className="flex items-center justify-between border-b border-white/[0.07] py-4">
            <div>
              <Label className="text-base font-medium text-white/90">Language</Label>
              <p className="mt-0.5 text-sm text-white/50">
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
                <SelectItem value="he">Hebrew</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between py-4">
            <div>
              <Label className="text-base font-medium text-white/90">Timezone</Label>
              <p className="mt-0.5 text-sm text-white/50">
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

          <div className="mt-2 flex items-center gap-4 border-t border-white/[0.07] pt-4">
            <Button
              className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
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
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {savingDisplay ? 'Saving...' : savedDisplay ? 'Saved!' : 'Save Display Settings'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Loading skeleton — layout-matched shimmer (no spinners, no stock Skeleton)
function SettingsSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="skeleton-shimmer mb-2 h-8 w-32 rounded" />
        <div className="skeleton-shimmer h-4 w-56 rounded" />
      </div>

      {/* Systems card */}
      <div className="surface-card p-6">
        <div className="skeleton-shimmer mb-2 h-3 w-36 rounded" />
        <div className="skeleton-shimmer mb-6 h-4 w-64 rounded" />
        <div>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between py-4',
                i < 5 && 'border-b border-white/[0.07]'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="skeleton-shimmer size-9 rounded-lg" />
                <div>
                  <div className="skeleton-shimmer mb-2 h-4 w-24 rounded" />
                  <div className="skeleton-shimmer h-3 w-48 rounded" />
                </div>
              </div>
              <div className="skeleton-shimmer h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Display settings card */}
      <div className="surface-card p-6">
        <div className="skeleton-shimmer mb-2 h-3 w-36 rounded" />
        <div className="skeleton-shimmer mb-6 h-4 w-64 rounded" />
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <div className="skeleton-shimmer mb-2 h-4 w-20 rounded" />
                <div className="skeleton-shimmer h-3 w-48 rounded" />
              </div>
              <div className="skeleton-shimmer h-10 w-44 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
