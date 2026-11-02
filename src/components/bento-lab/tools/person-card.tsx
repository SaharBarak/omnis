'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import s from './tools.module.css'
import { BirthFields } from '../atlas/birth-fields'
import kit from '../kit.module.css'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { letterOf, personLabel } from '@/lib/atlas/person-label'
import type { BirthInput } from '@/lib/atlas/types'
import { useAtlasDraft } from '@/lib/atlas/use-atlas-draft'

export interface Slot {
  readonly key: string
  readonly seed: BirthInput
  readonly sample: boolean
}

/** One person in the rail. Owns its fields and reports a valid person, or null, upward. */
export function PersonCard({
  slot,
  index,
  onReport,
  onRemove,
  startOpen,
}: {
  readonly slot: Slot
  readonly index: number
  readonly onReport: (key: string, person: AtlasPerson | null) => void
  readonly onRemove?: (key: string) => void
  /** Open on first render; the visitor folds and unfolds it after that. */
  readonly startOpen: boolean
}) {
  const form = useAtlasDraft(slot.seed, slot.sample)
  const name = personLabel(form.draft.name, index)
  const report = form.input ? JSON.stringify({ id: slot.key, name, input: form.input }) : null

  useEffect(() => {
    onReport(slot.key, report ? (JSON.parse(report) as AtlasPerson) : null)
  }, [report, slot.key, onReport])

  return (
    <details className={s.card} open={startOpen}>
      <summary className={s.cardHead}>
        <span className={s.letter} aria-hidden>
          {letterOf(index)}
        </span>
        <span className={s.who}>{form.sample ? `${name} (sample)` : name}</span>
        <span className={s.when}>{form.draft.date || 'No date yet'}</span>
        {onRemove && (
          <button
            type="button"
            className={kit.iconButton}
            onClick={(e) => {
              e.preventDefault()
              onRemove(slot.key)
            }}
            aria-label={`Remove ${name}`}
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </summary>
      <BirthFields id={`tool-${slot.key}`} form={form} withName compact />
    </details>
  )
}
