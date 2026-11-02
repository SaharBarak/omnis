'use client'

import { useState } from 'react'
import { isBirthField, parseBirthInput, type BirthField, type BirthInputRaw } from './birth-input'
import type { BirthInput, BirthPlace } from './types'

export interface BirthDraft {
  readonly date: string
  readonly time: string
  readonly place: BirthPlace | null
  readonly name: string
  readonly hebrewName: string
}

export type DraftField = BirthField

export type DraftErrors = Partial<Record<DraftField, string>>

/** A field nobody has filled in yet carries no error; the missing date shows as a disabled map instead. */
const isBlank = (value: BirthDraft[DraftField]): boolean => value === null || value === ''

/** The schema's first complaint about each filled-in field, keyed by the field it names. */
export const draftErrors = (draft: BirthDraft, issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]): DraftErrors =>
  issues.reduce<DraftErrors>((errors, issue) => {
    const field = issue.path[0]
    if (!isBirthField(field) || isBlank(draft[field]) || errors[field]) return errors
    return { ...errors, [field]: issue.message }
  }, {})

export const draftOf = (input: BirthInput): BirthDraft => ({
  date: input.date,
  time: input.time ?? '',
  place: input.place,
  name: input.name ?? '',
  hebrewName: input.hebrewName ?? '',
})

export const rawOf = (d: BirthDraft): BirthInputRaw => ({
  date: d.date,
  time: d.time === '' ? null : d.time,
  place: d.place,
  name: d.name,
  hebrewName: d.hebrewName,
})

const EMPTY: BirthDraft = { date: '', time: '', place: null, name: '', hebrewName: '' }

export interface AtlasDraft {
  readonly draft: BirthDraft
  readonly sample: boolean
  readonly input: BirthInput | null
  readonly errors: DraftErrors
  readonly set: <K extends DraftField>(field: K, value: BirthDraft[K]) => void
}

/**
 * Birth fields for a map. Starts on a sample person; the first new date
 * clears the sample's time, place and names, so a map never mixes a visitor's
 * date with someone else's birth time.
 */
export function useAtlasDraft(seed: BirthInput, startsAsSample = true): AtlasDraft {
  const [state, setState] = useState({ draft: draftOf(seed), sample: startsAsSample })

  const set: AtlasDraft['set'] = (field, value) =>
    setState((prev) => {
      if (prev.sample && field === 'date') return { draft: { ...EMPTY, date: value as string }, sample: false }
      return { draft: { ...prev.draft, [field]: value }, sample: prev.sample }
    })

  const parsed = parseBirthInput(rawOf(state.draft))
  const errors = parsed.success ? {} : draftErrors(state.draft, parsed.error.issues)
  return { draft: state.draft, sample: state.sample, input: parsed.success ? parsed.data : null, errors, set }
}
