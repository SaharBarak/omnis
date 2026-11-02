'use client'

import { useEffect, useMemo, useState } from 'react'
import s from './systems.module.css'
import { requiredParts, undash } from './model'
import { NotificationSettings } from './notification-settings'
import { PlanSettings } from './plan-settings'
import { SelectField, SystemSection } from './system-page'
import kit from '../kit.module.css'
import { Skeleton } from '../site'
import site from '../site/site.module.css'
import { PageHead } from '../site/page-head'
import { routeTitle } from '@/lib/site/routes'
import { useAuth } from '@/lib/hooks/use-auth'
import { DEFAULT_SYSTEM_PREFERENCES, SYSTEM_CATALOG, resolveSystemPreferences, type SystemGroup, type SystemInfo, type SystemKey } from '@/lib/system-preferences'

const GROUPS: readonly { readonly id: SystemGroup; readonly title: string; readonly lead: string }[] = [
  { id: 'readings', title: 'Reading systems', lead: 'They shape person pages and readings.' },
  { id: 'calendars', title: 'Calendars and sky', lead: 'They shape the Today board and the daily brief.' },
]

const describe = (system: SystemInfo): string => undash(system.description)

const needs = (system: SystemInfo): string | null => {
  const parts = requiredParts(system)
  if (parts.length === 0) return null
  return parts.length === 2 ? 'Needs a birth time and place' : `Needs a birth ${parts[0]}`
}

const SECTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'systems', label: 'Systems' },
  { id: 'display', label: 'Language and time' },
  { id: 'notifications', label: 'Daily brief' },
  { id: 'plan', label: 'Plan' },
]

const LOCALES: readonly { readonly value: 'en' | 'he'; readonly label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'Hebrew' },
]

const timeZones = (current: string): readonly string[] => {
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return all.includes(current) ? all : [current, ...all]
}

function useSaveNote() {
  const [note, setNote] = useState<string | null>(null)
  const run = async (work: () => Promise<unknown>) => {
    setNote('Saving')
    try {
      await work()
      setNote('Saved')
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Save failed')
    }
  }
  return { note, run }
}

function SystemsSettings() {
  const { profile, updateProfile, loading } = useAuth()
  const stored = useMemo(() => resolveSystemPreferences(profile?.preferences), [profile])
  const [draft, setDraft] = useState<Record<SystemKey, boolean> | null>(null)
  const { note, run } = useSaveNote()
  const value = draft ?? stored
  const counts = (group: SystemGroup) => SYSTEM_CATALOG.filter((x) => x.group === group).length

  const save = () =>
    run(async () => {
      const current = (profile?.preferences ?? {}) as Record<string, unknown>
      await updateProfile({ preferences: { ...current, systems: value } })
      setDraft(null)
    })

  return (
    <SystemSection id="systems" title="Systems" lead="Choose the systems you read. The choice reaches person pages, the Today board and the daily brief.">
      {loading ? (
        <Skeleton height={420} />
      ) : (
        <div className={site.card} style={{ display: 'grid', gap: 24 }}>
          {GROUPS.map((group) => (
            <div key={group.id} style={{ display: 'grid', gap: 4 }}>
              <h3 className={site.h3}>
                {group.title}, {counts(group.id)}
              </h3>
              <span className={site.hint}>{group.lead}</span>
              <ul className={s.toggles}>
                {SYSTEM_CATALOG.filter((x) => x.group === group.id).map((system) => {
                  const need = needs(system)
                  const id = `system-${system.key}`
                  return (
                    <li key={system.key} className={s.toggle}>
                      <div className={s.toggleText}>
                        <label htmlFor={id}>{system.label}</label>
                        <span id={`${id}-hint`} className={site.hint}>
                          {describe(system)}
                        </span>
                        {need && <span className={s.warn}>{need}</span>}
                      </div>
                      <input
                        id={id}
                        type="checkbox"
                        role="switch"
                        className={s.switch}
                        aria-describedby={`${id}-hint`}
                        checked={value[system.key]}
                        onChange={(e) => setDraft({ ...value, [system.key]: e.target.checked })}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          <div className={site.actions} style={{ alignItems: 'center' }}>
            <button type="button" className={`${site.btn} ${site.btnSmall} ${site.btnSolid}`} onClick={() => void save()} disabled={draft === null}>
              Save systems
            </button>
            <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => setDraft(DEFAULT_SYSTEM_PREFERENCES)}>
              Turn every system on
            </button>
            <span className={s.status} role="status" aria-live="polite">
              {draft !== null ? 'Unsaved changes' : note}
            </span>
          </div>
        </div>
      )}
    </SystemSection>
  )
}

function DisplaySettings() {
  const { profile, updateProfile, loading } = useAuth()
  const [locale, setLocale] = useState<'en' | 'he' | null>(null)
  const [zone, setZone] = useState<string | null>(null)
  const { note, run } = useSaveNote()
  const shownLocale = locale ?? profile?.locale ?? 'en'
  const shownZone = zone ?? profile?.timezone ?? 'UTC'
  const zones = useMemo(() => timeZones(shownZone), [shownZone])
  const dirty = locale !== null || zone !== null

  return (
    <SystemSection id="display" title="Language and time" lead="The timezone sets when a day turns over for you and when the daily brief arrives.">
      {loading ? (
        <Skeleton height={160} />
      ) : (
        <div className={site.card} style={{ display: 'grid', gap: 16 }}>
          <div className={s.formRow}>
            <SelectField id="locale" label="Language" value={shownLocale} options={LOCALES} onChange={setLocale} />
            <SelectField id="timezone" label="Timezone" value={shownZone} options={zones.map((z) => ({ value: z, label: z.replaceAll('_', ' ') }))} onChange={setZone} />
          </div>
          <div className={site.actions} style={{ alignItems: 'center' }}>
            <button
              type="button"
              className={`${site.btn} ${site.btnSmall} ${site.btnSolid}`}
              disabled={!dirty}
              onClick={() =>
                void run(async () => {
                  await updateProfile({ locale: shownLocale, timezone: shownZone })
                  setLocale(null)
                  setZone(null)
                })
              }
            >
              Save language and time
            </button>
            <span className={s.status} role="status" aria-live="polite">
              {dirty ? 'Unsaved changes' : note}
            </span>
          </div>
        </div>
      )}
    </SystemSection>
  )
}

/** Template T12 for settings: systems, language and time, the daily brief, the plan. */
export function SettingsView() {
  const { loading } = useAuth()
  useEffect(() => {
    if (loading || !window.location.hash) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [loading])
  return (
    <>
      <PageHead eyebrow="Account" title={routeTitle('/app/settings')} lead="What the map reads, when the brief arrives and which plan the account is on.">
        <nav aria-label="Settings sections" className={site.chipRow}>
          {SECTIONS.map((x) => (
            <a key={x.id} href={`#${x.id}`} className={kit.pill}>
              {x.label}
            </a>
          ))}
        </nav>
      </PageHead>
      <div className={`${site.page} ${s.page}`}>
        <SystemsSettings />
        <DisplaySettings />
        <NotificationSettings />
        <PlanSettings />
      </div>
    </>
  )
}
