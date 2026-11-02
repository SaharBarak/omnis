'use client'

import { useId, useState, type FormEvent } from 'react'
import p from './people.module.css'
import { BirthFields } from '../atlas/birth-fields'
import { PrimaryAction } from '../site/action'
import { Field } from '../site/field'
import site from '../site/site.module.css'
import { personInsertOf } from '@/lib/atlas/app/saved-person'
import type { BirthInput } from '@/lib/atlas/types'
import { useAtlasDraft } from '@/lib/atlas/use-atlas-draft'
import { usePeople } from '@/lib/hooks/use-people'

const BLANK: BirthInput = { date: '', time: null, place: null, name: null, hebrewName: null }

type SaveState = { readonly kind: 'idle' } | { readonly kind: 'saving' } | { readonly kind: 'failed'; readonly message: string }

/** Name, birth date, time and place, then the Hebrew name. Saves through the people API. */
export function AddPersonForm({ onSaved, onCancel }: { readonly onSaved: (id: string) => void; readonly onCancel?: () => void }) {
  const id = useId()
  const { addPerson } = usePeople()
  const form = useAtlasDraft(BLANK, false)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const name = form.draft.name.trim()
  const ready = name !== '' && form.input !== null && save.kind !== 'saving'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.input || name === '') return
    setSave({ kind: 'saving' })
    try {
      const created = await addPerson(personInsertOf({ ...form.input, name }))
      setSave({ kind: 'idle' })
      onSaved(created.id)
    } catch (err) {
      setSave({ kind: 'failed', message: err instanceof Error ? err.message : 'Could not save this person' })
    }
  }

  return (
    <form className={p.form} onSubmit={(e) => void submit(e)} aria-busy={save.kind === 'saving'}>
      <Field
        id={`${id}-name`}
        label="Name"
        required
        value={form.draft.name}
        onChange={(e) => form.set('name', e.target.value)}
        hint="Latin letters give the expression and soul numbers."
        autoComplete="off"
        error={form.errors.name}
      />
      <BirthFields id={id} form={form} />
      <Field
        id={`${id}-hebrew`}
        label="Hebrew name"
        value={form.draft.hebrewName}
        onChange={(e) => form.set('hebrewName', e.target.value)}
        hint="Optional, for gematria."
        error={form.errors.hebrewName}
        dir="rtl"
        lang="he"
        autoComplete="off"
      />
      {save.kind === 'failed' && (
        <p className={site.error} role="alert">
          {save.message}
        </p>
      )}
      <div className={site.actions}>
        <PrimaryAction type="submit" intent="save" disabled={!ready}>
          {save.kind === 'saving' ? 'Saving' : 'Save person'}
        </PrimaryAction>
        {onCancel && (
          <button type="button" className={site.btn} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
