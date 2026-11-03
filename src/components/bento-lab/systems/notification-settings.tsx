'use client'

import { useCallback, useState } from 'react'
import type { NotificationSettings as Settings } from '@pleiad/engine/types/prediction'
import s from './systems.module.css'
import { SystemSection } from './system-page'
import { ErrorState, Field, Skeleton } from '../site'
import site from '../site/site.module.css'
import { useNotificationSettings } from '@/lib/hooks/use-notification-settings'

/**
 * Daily digest settings over the live endpoints, through the shared settings
 * cache (`useNotificationSettings`). Every save sends the whole record, so
 * fields this page does not show keep their stored values.
 */

const DEFAULT_HOUR = '08:00'

function Toggle({ id, label, hint, checked, onChange }: { readonly id: string; readonly label: string; readonly hint: string; readonly checked: boolean; readonly onChange: (next: boolean) => void }) {
  return (
    <li className={s.toggle}>
      <div className={s.toggleText}>
        <label htmlFor={id}>{label}</label>
        <span id={`${id}-hint`} className={site.hint}>
          {hint}
        </span>
      </div>
      <input id={id} type="checkbox" role="switch" className={s.switch} checked={checked} aria-describedby={`${id}-hint`} onChange={(e) => onChange(e.target.checked)} />
    </li>
  )
}

export function NotificationSettings() {
  const { settings, loading, error, retry, save: saveSettings } = useNotificationSettings()
  const [note, setNote] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const save = useCallback(
    async (patch: Partial<Settings>) => {
      setNote('Saving')
      try {
        await saveSettings(patch)
        setNote('Saved')
      } catch (e) {
        setNote(e instanceof Error ? e.message : 'Save failed')
      }
    },
    [saveSettings]
  )

  const sendTest = useCallback(async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error(`Test send returned ${res.status}`)
      setNote('Test email sent to your account address')
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Test send failed')
    } finally {
      setTesting(false)
    }
  }, [])

  return (
    <SystemSection id="notifications" title="Daily brief" lead="The morning brief by email, at your hour, in your profile's timezone.">
      {loading && <Skeleton height={220} />}
      {error !== null && settings === null && (
        <ErrorState
          title="Notification settings did not load"
          action={
            <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => void retry()}>
              Try again
            </button>
          }
        >
          {error}
        </ErrorState>
      )}
      {settings !== null && (
        <div className={site.card} style={{ display: 'grid', gap: 16 }}>
          <ul className={s.toggles}>
            <Toggle id="notify-enabled" label="Notifications" hint="The main switch. Off silences the brief, event notices and push." checked={settings.enabled} onChange={(enabled) => void save({ enabled })} />
            <Toggle id="notify-digest" label="Daily brief" hint="Kin, tone and the sky of the day, read against your birth date." checked={settings.dailyDigest} onChange={(dailyDigest) => void save({ dailyDigest })} />
            <Toggle
              id="notify-email"
              label="Email"
              hint="Push reaches your phone once the app registers it."
              checked={settings.channels.includes('email')}
              onChange={(on) =>
                void save({
                  channels: on ? [...new Set([...settings.channels, 'email' as const])] : settings.channels.filter((c) => c !== 'email'),
                })
              }
            />
          </ul>
          <div style={{ maxWidth: 280 }}>
            <Field
              id="notify-hour"
              label="Delivery hour"
              type="time"
              step={3600}
              value={settings.dailyDigestTime}
              hint="Read in your profile's timezone: 08:00 means 08:00 where you are."
              onChange={(e) => void save({ dailyDigestTime: e.target.value || DEFAULT_HOUR })}
            />
          </div>
          <div className={site.actions} style={{ alignItems: 'center' }}>
            <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => void sendTest()} disabled={testing}>
              {testing ? 'Sending' : 'Send a test email'}
            </button>
            <span className={s.status} role="status" aria-live="polite">
              {note}
            </span>
          </div>
          {!settings.enabled && <p className={s.status}>Notifications are off. Nothing is sent until the main switch is back on.</p>}
        </div>
      )}
    </SystemSection>
  )
}
