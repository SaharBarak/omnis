'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard'
import { DataRow, Notice, PageSection, getFlavor } from '@/components/app-kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

/**
 * Notification settings (#65) — the page every digest email's "Manage
 * notifications" footer has been linking to. Daily digest opt-in, the
 * delivery hour (read in your profile's timezone by the hourly cron),
 * email channel, and a test send.
 */

const FLAVOR = getFlavor('integration')

interface SettingsData {
  enabled: boolean
  channels: string[]
  dailyDigest: boolean
  dailyDigestTime: string
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/notifications/settings', { credentials: 'include' })
        const data = await res.json()
        if (!cancelled && data?.data) {
          setSettings({
            enabled: Boolean(data.data.enabled),
            channels: data.data.channels ?? ['in-app'],
            dailyDigest: Boolean(data.data.dailyDigest),
            dailyDigestTime: data.data.dailyDigestTime ?? '08:00',
          })
        }
      } catch {
        if (!cancelled) toast.error('Could not load notification settings')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(
    async (next: SettingsData) => {
      setSettings(next)
      setSaving(true)
      try {
        const res = await fetch('/api/notifications/settings', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
        if (!res.ok) throw new Error(`save failed: ${res.status}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const sendTest = useCallback(async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`test send failed: ${res.status}`)
      toast.success('Test email sent — check your inbox')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test send failed')
    } finally {
      setTesting(false)
    }
  }, [])

  const emailOn = settings?.channels.includes('email') ?? false

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="The daily forecast, delivered — at your hour, in your timezone"
      />

      {!settings ? (
        <div className="surface-card h-40 animate-pulse p-5" />
      ) : (
        <>
          <PageSection index={0} accent={FLAVOR.accent} eyebrow="Daily digest">
            <div className="surface-card space-y-4 p-5">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/80">
                  Notifications enabled
                  <span className="block text-xs text-white/40">
                    The master switch — off silences everything.
                  </span>
                </span>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => void save({ ...settings, enabled })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/80">
                  Daily forecast digest
                  <span className="block text-xs text-white/40">
                    Kin, tone, and the day&rsquo;s sky, personalized by your birth date.
                  </span>
                </span>
                <Switch
                  checked={settings.dailyDigest}
                  onCheckedChange={(dailyDigest) => void save({ ...settings, dailyDigest })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/80">
                  Email channel
                  <span className="block text-xs text-white/40">
                    Push reaches your phone automatically once the app registers it.
                  </span>
                </span>
                <Switch
                  checked={emailOn}
                  onCheckedChange={(on) =>
                    void save({
                      ...settings,
                      channels: on
                        ? [...new Set([...settings.channels, 'email'])]
                        : settings.channels.filter((c) => c !== 'email'),
                    })
                  }
                />
              </label>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/80">
                  Delivery hour
                  <span className="block text-xs text-white/40">
                    Read in your profile&rsquo;s timezone — 08:00 means 08:00 where you are.
                  </span>
                </span>
                <Input
                  type="time"
                  value={settings.dailyDigestTime}
                  step={3600}
                  onChange={(e) =>
                    void save({ ...settings, dailyDigestTime: e.target.value || '08:00' })
                  }
                  className="w-fit"
                />
              </div>
            </div>
            {saving && <p className="mt-2 text-xs text-white/35">Saving…</p>}
          </PageSection>

          <PageSection index={1} accent={FLAVOR.accent} eyebrow="Test">
            <div className="surface-card p-5">
              <DataRow
                label="Send a test email"
                value=""
                detail="Delivers the test template to your account email right now."
                last
              />
              <div className="mt-3">
                <Button onClick={() => void sendTest()} disabled={testing}>
                  {testing ? 'Sending…' : 'Send test email'}
                </Button>
              </div>
            </div>
          </PageSection>

          {!settings.enabled && (
            <Notice variant="info">
              Notifications are off — the digest, event notices, and push are
              all silenced until the master switch comes back on.
            </Notice>
          )}
        </>
      )}
    </div>
  )
}
