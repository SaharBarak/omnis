'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ATTACHMENT_NAMES,
  ATTACHMENT_STYLES,
  BIG_FIVE_DIMENSIONS,
  DISC_NAMES,
  DISC_STYLES,
  ENNEAGRAM_TYPES,
  LOVE_LANGUAGES,
  MBTI_TYPES,
  cognitiveFunctions,
  mbtiNickname,
  type MbtiType,
} from '@pleiad/engine/calculations'
import {
  usePeople,
  type PersonPersonality,
  type PersonWithTags,
} from '@/lib/hooks/use-people'
import { DataRow, Notice, PageSection } from '@/components/app-kit'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Personality frameworks editor (#75) — MBTI, Enneagram, DISC, attachment,
 * love languages. These are user-entered (nothing derives them), stored on
 * the person as jsonb, and read back by the pair page's comparison.
 */

const ACCENT = '#C9CDD4'

const CLEAR = '—'

function FrameworkSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: readonly { value: string; label: string }[]
  onChange: (value: string | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
        {label}
      </span>
      <Select
        value={value ?? CLEAR}
        onValueChange={(v) => onChange(v === CLEAR ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR}>Not set</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PersonalityEditor({ person }: { person: PersonWithTags }) {
  const { updatePerson } = usePeople()
  const stored = (person.personality ?? {}) as PersonPersonality
  const [draft, setDraft] = useState<PersonPersonality>(stored)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(stored),
    [draft, stored]
  )

  const patch = (partial: Partial<PersonPersonality>) =>
    setDraft((d) => ({ ...d, ...partial }))

  const save = async () => {
    setSaving(true)
    try {
      await updatePerson(person.id, { personality: draft })
      toast.success('Personality profile saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const mbti = (draft.mbti ?? null) as MbtiType | null
  const functions = mbti && MBTI_TYPES.includes(mbti) ? cognitiveFunctions(mbti) : null

  const primaryLanguage = draft.loveLanguages?.[0] ?? null
  const secondaryLanguage = draft.loveLanguages?.[1] ?? null

  return (
    <div className="space-y-6">
      <PageSection index={0} accent={ACCENT} eyebrow="Frameworks">
        <p className="mb-4 max-w-[65ch] text-sm text-white/50">
          These aren&rsquo;t computed from a birth date — they&rsquo;re
          self-reported. Enter what {person.name} knows about themselves and
          the relationship pages can read the pair.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FrameworkSelect
            label="MBTI"
            value={draft.mbti ?? null}
            options={MBTI_TYPES.map((t) => ({
              value: t,
              label: `${t} · ${mbtiNickname(t)}`,
            }))}
            onChange={(mbtiValue) => patch({ mbti: mbtiValue })}
          />
          <FrameworkSelect
            label="Enneagram"
            value={draft.enneagram ?? null}
            options={ENNEAGRAM_TYPES.map((t) => ({
              value: String(t.number),
              label: `${t.number} · ${t.name}`,
            }))}
            onChange={(enneagram) => patch({ enneagram })}
          />
          <FrameworkSelect
            label="DISC"
            value={draft.disc ?? null}
            options={DISC_STYLES.map((s) => ({ value: s, label: DISC_NAMES[s] }))}
            onChange={(disc) => patch({ disc })}
          />
          <FrameworkSelect
            label="Attachment style"
            value={draft.attachment ?? null}
            options={ATTACHMENT_STYLES.map((s) => ({
              value: s,
              label: ATTACHMENT_NAMES[s],
            }))}
            onChange={(attachment) => patch({ attachment })}
          />
          <FrameworkSelect
            label="Primary love language"
            value={primaryLanguage}
            options={LOVE_LANGUAGES.map((l) => ({ value: l, label: l }))}
            onChange={(primary) =>
              patch({
                loveLanguages: primary
                  ? [primary, ...(secondaryLanguage && secondaryLanguage !== primary ? [secondaryLanguage] : [])]
                  : null,
              })
            }
          />
          <FrameworkSelect
            label="Secondary love language"
            value={secondaryLanguage}
            options={LOVE_LANGUAGES.filter((l) => l !== primaryLanguage).map((l) => ({
              value: l,
              label: l,
            }))}
            onChange={(secondary) =>
              patch({
                loveLanguages: primaryLanguage
                  ? [primaryLanguage, ...(secondary ? [secondary] : [])]
                  : secondary
                    ? [secondary]
                    : null,
              })
            }
          />
        </div>

        <div className="mt-6">
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
            Big Five (0–100)
          </span>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {BIG_FIVE_DIMENSIONS.map((d) => {
              const value = draft.bigFive?.[d.key]
              return (
                <label key={d.key} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-white/70">{d.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value ?? 50}
                    onChange={(e) =>
                      patch({
                        bigFive: { ...draft.bigFive, [d.key]: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-white/70"
                  />
                  <span className="w-8 text-right text-sm text-white/50 [font-variant-numeric:tabular-nums]">
                    {value ?? '—'}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          {dirty && !saving && (
            <span className="text-xs text-white/40">Unsaved changes</span>
          )}
        </div>
      </PageSection>

      {functions && (
        <PageSection index={1} accent={ACCENT} eyebrow="Cognitive functions">
          <div className="surface-card p-5">
            {functions.map((fn, i) => (
              <DataRow
                key={fn}
                label={['Dominant', 'Auxiliary', 'Tertiary', 'Inferior'][i]}
                value={fn}
                last={i === functions.length - 1}
              />
            ))}
          </div>
          <p className={cn('mt-2 text-xs text-white/35')}>
            The Grant stack for {mbti} — how this type takes in the world and
            decides about it, in order of confidence.
          </p>
        </PageSection>
      )}

      {!dirty && Object.keys(stored).length === 0 && (
        <Notice variant="info">
          Nothing entered yet — fill in whichever frameworks {person.name} has
          explored. Partial profiles are fine; comparisons only use what both
          people carry.
        </Notice>
      )}
    </div>
  )
}
