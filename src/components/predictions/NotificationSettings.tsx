'use client'

import { useState, useEffect } from 'react'
import type { NotificationSettings as NotificationSettingsType, PredictionIntensity, PredictionSystem } from '@pleiad/engine/types/prediction'
import { Eyebrow } from '@/components/app-kit'
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
import { cn } from '@/lib/utils'

interface NotificationSettingsProps {
  onSave?: (settings: NotificationSettingsType) => void
  className?: string
}

const SYSTEMS: { value: PredictionSystem; label: string }[] = [
  { value: 'dreamspell', label: 'Dreamspell' },
  { value: 'tzolkin', label: 'Tzolkin' },
  { value: 'longcount', label: 'Long Count' },
  { value: 'astrology', label: 'Astrology' },
  { value: 'humandesign', label: 'Human Design' },
]

const INTENSITIES: { value: PredictionIntensity; label: string; description: string }[] = [
  { value: 'low', label: 'All', description: 'Get notified for all events' },
  { value: 'medium', label: 'Medium+', description: 'Medium, high, and peak events' },
  { value: 'high', label: 'High+', description: 'Only high and peak events' },
  { value: 'peak', label: 'Peak only', description: 'Only major milestones' },
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const ADVANCE_NOTICE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Same day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: 14, label: '2 weeks before' },
  { value: 30, label: '1 month before' },
]

export function NotificationSettings({ onSave, className }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Fetch current settings
  useEffect(() => {
    let cancelled = false
    async function fetchSettings() {
      try {
        const response = await fetch('/api/notifications/settings')
        const data = await response.json()
        if (data.success && !cancelled) {
          setSettings(data.data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    if (!settings) return
    setIsSaving(true)

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (data.success) {
        onSave?.(data.data)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTest() {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      })
      const data = await response.json()
      setTestResult(data.success ? 'Test notification sent!' : 'Failed to send test')
    } catch (error) {
      setTestResult('Error sending test notification')
    } finally {
      setIsTesting(false)
    }
  }

  function updateSetting<K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  function toggleChannel(channel: 'in-app' | 'email' | 'sms') {
    if (!settings) return
    const channels = settings.channels.includes(channel)
      ? settings.channels.filter((c) => c !== channel)
      : [...settings.channels, channel]
    updateSetting('channels', channels)
  }

  function toggleSystem(system: PredictionSystem) {
    if (!settings) return
    const systems = settings.systems.includes(system)
      ? settings.systems.filter((s) => s !== system)
      : [...settings.systems, system]
    updateSetting('systems', systems)
  }

  if (!settings) {
    return (
      <div className={cn('surface-card p-6', className)}>
        <div className="skeleton-shimmer h-3 w-32 rounded" />
        <div className="skeleton-shimmer mt-3 h-5 w-56 rounded" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="skeleton-shimmer h-10 w-full rounded" />
          <div className="skeleton-shimmer h-10 w-full rounded" />
          <div className="skeleton-shimmer h-10 w-2/3 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('surface-card p-6', className)}>
      <div className="flex flex-col gap-1">
        <Eyebrow>Notifications</Eyebrow>
        <h3 className="font-display text-lg font-semibold tracking-tight text-white/90">
          Notification settings
        </h3>
        <p className="text-sm text-white/50">
          Configure how and when you receive prediction notifications
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Master Enable */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="font-medium text-white/90">
              Enable Notifications
            </Label>
            <p className="text-sm text-white/50">
              Receive notifications for upcoming events
            </p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Channels */}
            <div className="space-y-3">
              <Label className="font-medium text-white/90">Notification Channels</Label>
              <div className="flex flex-wrap gap-2">
                {(['in-app', 'email'] as const).map((channel) => (
                  <Button
                    key={channel}
                    variant={settings.channels.includes(channel) ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full active:scale-[0.98]"
                    onClick={() => toggleChannel(channel)}
                  >
                    {channel === 'in-app' ? 'In-App' : 'Email'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Daily Digest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dailyDigest" className="font-medium text-white/90">
                    Daily Digest
                  </Label>
                  <p className="text-sm text-white/50">
                    Get a summary each morning
                  </p>
                </div>
                <Switch
                  id="dailyDigest"
                  checked={settings.dailyDigest}
                  onCheckedChange={(checked) => updateSetting('dailyDigest', checked)}
                />
              </div>
              {settings.dailyDigest && (
                <div className="space-y-2 pl-4">
                  <Label className="text-sm text-white/70">Time (UTC)</Label>
                  <Select
                    value={settings.dailyDigestTime}
                    onValueChange={(value) => updateSetting('dailyDigestTime', value)}
                  >
                    <SelectTrigger className="w-full font-mono [font-variant-numeric:tabular-nums]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={`${String(i).padStart(2, '0')}:00`}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Weekly Digest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyDigest" className="font-medium text-white/90">
                    Weekly Digest
                  </Label>
                  <p className="text-sm text-white/50">
                    Get a weekly overview
                  </p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
                />
              </div>
              {settings.weeklyDigest && (
                <div className="space-y-2 pl-4">
                  <Label className="text-sm text-white/70">Day</Label>
                  <Select
                    value={String(settings.weeklyDigestDay)}
                    onValueChange={(value) => updateSetting('weeklyDigestDay', parseInt(value, 10))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Systems */}
            <div className="space-y-3">
              <Label className="font-medium text-white/90">Systems</Label>
              <p className="text-sm text-white/50">
                Which systems to receive notifications for
              </p>
              <div className="flex flex-wrap gap-2">
                {SYSTEMS.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={settings.systems.includes(value) ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full active:scale-[0.98]"
                    onClick={() => toggleSystem(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Minimum Intensity */}
            <div className="space-y-3">
              <Label className="font-medium text-white/90">Minimum Intensity</Label>
              <p className="text-sm text-white/50">
                Only notify for events at or above this level
              </p>
              <div className="grid grid-cols-2 gap-2">
                {INTENSITIES.map(({ value, label, description }) => (
                  <Button
                    key={value}
                    variant={settings.minIntensity === value ? 'default' : 'outline'}
                    className="h-auto flex-col items-start rounded-xl py-3 active:scale-[0.98]"
                    onClick={() => updateSetting('minIntensity', value)}
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-xs opacity-70">{description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Advance Notice */}
            <div className="space-y-3">
              <Label className="font-medium text-white/90">Advance Notice</Label>
              <p className="text-sm text-white/50">
                Days before an event to send notification
              </p>
              <Select
                value={String(settings.advanceNotice)}
                onValueChange={(value) => updateSetting('advanceNotice', parseInt(value, 10))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADVANCE_NOTICE_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={String(value)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-white/[0.07] pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl active:scale-[0.98]">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          {settings.channels.includes('email') && (
            <Button variant="outline" onClick={handleTest} disabled={isTesting} className="rounded-xl active:scale-[0.98]">
              {isTesting ? 'Sending...' : 'Send Test'}
            </Button>
          )}
          {testResult && (
            <span className="text-sm text-white/50">{testResult}</span>
          )}
        </div>
      </div>
    </div>
  )
}
