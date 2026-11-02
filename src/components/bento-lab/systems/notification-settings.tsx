'use client'

import { useCallback, useEffect, useState } from 'react'
import s from './systems.module.css'
import { SystemSection } from './system-page'
import { ErrorState, Field, Skeleton } from '../site'
import site from '../site/site.module.css'

/**
 * Daily digest settings over the live endpoints (`/api/notifications/settings`,
 * `/api/notifications/test`). Every save sends the whole record it read back,
 * so fields this page does not show keep their stored values.
 */

const ENDPOINT = '/api/notifications/settings'
const DEFAULT_HOUR = '08:00'

interface DigestSettings {
  readonly enabled: boolean
  readonly channels: readonly string[]
  readonly dailyDigest: boolean
  readonly dailyDigestTime: string
  readonly [field: string]: unknown
}

type Load = { readonly kind: 'loading' } | { readonly kind: 'error'; readonly message: string } | { readonly kind: 'ready'; readonly settings: DigestSettings }

const normalise = (raw: Record<string, unknown>): DigestSettings => ({
  ...raw,
  enabled: Boolean(raw.enabled),
  channels: Array.isArray(raw.channels) ? raw.channels.filter((c): c is string => typeof c === 'string') : ['in-app'],
  dailyDigest: Boolean(raw.dailyDigest),
  dailyDigestTime: typeof raw.dailyDigestTime === 'string' ? raw.dailyDigestTime : DEFAULT_HOUR,
})

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
  const [load, setLoad] = useState<Load>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    let live = true
    fetch(ENDPOINT, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Settings returned ${res.status}`)
        const body = (await res.json()) as { data?: Record<string, unknown> }
        if (!body.data) throw new Error('Settings came back empty')
        if (live) setLoad({ kind: 'ready', settings: normalise(body.data) })
      })
      .catch((e: unknown) => live && setLoad({ kind: 'error', message: e instanceof Error ? e.message : String(e) }))
    return () => {
      live = false
    }
  }, [attempt])

  const save = useCallback(async (next: DigestSettings) => {
    setLoad({ kind: 'ready', settings: next })
    setNote('Saving')
    try {
      const res = await fetch(ENDPOINT, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) })
      if (!res.ok) throw new Error(`Save returned ${res.status}`)
      setNote('Saved')
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Save failed')
    }
  }, [])

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
      {load.kind === 'loading' && <Skeleton height={220} />}
      {load.kind === 'error' && (
        <ErrorState
          title="Notification settings did not load"
          action={
            <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </button>
          }
        >
          {load.message}
        </ErrorState>
      )}
      {load.kind === 'ready' && (
        <div className={site.card} style={{ display: 'grid', gap: 16 }}>
          <ul className={s.toggles}>
            <Toggle id="notify-enabled" label="Notifications" hint="The main switch. Off silences the brief, event notices and push." checked={load.settings.enabled} onChange={(enabled) => void save({ ...load.settings, enabled })} />
            <Toggle id="notify-digest" label="Daily brief" hint="Kin, tone and the sky of the day, read against your birth date." checked={load.settings.dailyDigest} onChange={(dailyDigest) => void save({ ...load.settings, dailyDigest })} />
            <Toggle
              id="notify-email"
              label="Email"
              hint="Push reaches your phone once the app registers it."
              checked={load.settings.channels.includes('email')}
              onChange={(on) =>
                void save({
                  ...load.settings,
                  channels: on ? [...new Set([...load.settings.channels, 'email'])] : load.settings.channels.filter((c) => c !== 'email'),
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
              value={load.settings.dailyDigestTime}
              hint="Read in your profile's timezone: 08:00 means 08:00 where you are."
              onChange={(e) => void save({ ...load.settings, dailyDigestTime: e.target.value || DEFAULT_HOUR })}
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
          {!load.settings.enabled && <p className={s.status}>Notifications are off. Nothing is sent until the main switch is back on.</p>}
        </div>
      )}
    </SystemSection>
  )
}
