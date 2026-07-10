'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { NotificationSettings as NotificationSettingsType, PredictionIntensity, PredictionSystem } from '@pleiad/engine/types/prediction'

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

export function NotificationSettings({ onSave, className }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Fetch current settings
  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/notifications/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

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
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading settings...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how and when you receive prediction notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Enable */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="font-medium">
              Enable Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
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
              <Label className="font-medium">Notification Channels</Label>
              <div className="flex flex-wrap gap-2">
                {(['in-app', 'email'] as const).map((channel) => (
                  <Button
                    key={channel}
                    variant={settings.channels.includes(channel) ? 'default' : 'outline'}
                    size="sm"
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
                  <Label htmlFor="dailyDigest" className="font-medium">
                    Daily Digest
                  </Label>
                  <p className="text-sm text-muted-foreground">
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
                <div className="pl-4 space-y-2">
                  <Label className="text-sm">Time (UTC)</Label>
                  <select
                    value={settings.dailyDigestTime}
                    onChange={(e) => updateSetting('dailyDigestTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={`${String(i).padStart(2, '0')}:00`}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Weekly Digest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyDigest" className="font-medium">
                    Weekly Digest
                  </Label>
                  <p className="text-sm text-muted-foreground">
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
                <div className="pl-4 space-y-2">
                  <Label className="text-sm">Day</Label>
                  <select
                    value={settings.weeklyDigestDay}
                    onChange={(e) => updateSetting('weeklyDigestDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  >
                    {DAYS.map((day, i) => (
                      <option key={i} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Systems */}
            <div className="space-y-3">
              <Label className="font-medium">Systems</Label>
              <p className="text-sm text-muted-foreground">
                Which systems to receive notifications for
              </p>
              <div className="flex flex-wrap gap-2">
                {SYSTEMS.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={settings.systems.includes(value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSystem(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Minimum Intensity */}
            <div className="space-y-3">
              <Label className="font-medium">Minimum Intensity</Label>
              <p className="text-sm text-muted-foreground">
                Only notify for events at or above this level
              </p>
              <div className="grid grid-cols-2 gap-2">
                {INTENSITIES.map(({ value, label, description }) => (
                  <Button
                    key={value}
                    variant={settings.minIntensity === value ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col items-start"
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
              <Label className="font-medium">Advance Notice</Label>
              <p className="text-sm text-muted-foreground">
                Days before an event to send notification
              </p>
              <select
                value={settings.advanceNotice}
                onChange={(e) => updateSetting('advanceNotice', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value={0}>Same day</option>
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
                <option value={14}>2 weeks before</option>
                <option value={30}>1 month before</option>
              </select>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          {settings.channels.includes('email') && (
            <Button variant="outline" onClick={handleTest} disabled={isTesting}>
              {isTesting ? 'Sending...' : 'Send Test'}
            </Button>
          )}
          {testResult && (
            <span className="text-sm text-muted-foreground">{testResult}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
