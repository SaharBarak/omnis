'use client'

import { useId, useState, type FormEvent } from 'react'
import p from './people.module.css'
import { BirthFields, birthFieldId } from '../atlas/birth-fields'
import { PrimaryAction } from '../site/action'
import { Field } from '../site/field'
import site from '../site/site.module.css'
import { birthInputOf, changedPersonFields, personInsertOf, type SavedPersonLike } from '@/lib/atlas/app/saved-person'
import type { BirthInput } from '@/lib/atlas/types'
import { useAtlasDraft } from '@/lib/atlas/use-atlas-draft'
import { usePeople } from '@/lib/hooks/use-people'

const BLANK: BirthInput = { date: '', time: null, place: null, name: null, hebrewName: null }

type SaveState = { readonly kind: 'idle' } | { readonly kind: 'saving' } | { readonly kind: 'failed'; readonly message: string }

/** What a person form writes: the fields the people API takes. */
export type PersonFields = ReturnType<typeof personInsertOf>

/**
 * Name, birth date, time and place, then the Hebrew name, from `seed`;
 * `save` writes them (a new person, or one saved already) and gives back
 * its id. The one form for adding and for editing a person.
 */
export function PersonForm({
  seed,
  save: write,
  saveLabel,
  onSaved,
  onCancel,
}: {
  readonly seed: BirthInput
  readonly save: (fields: PersonFields) => Promise<{ readonly id: string }>
  readonly saveLabel: string
  readonly onSaved: (id: string) => void
  readonly onCancel?: () => void
}) {
  const id = useId()
  const form = useAtlasDraft(seed, false)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const name = form.draft.name.trim()
  const ready = name !== '' && form.input !== null && save.kind !== 'saving'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.input || name === '') return
    setSave({ kind: 'saving' })
    try {
      const saved = await write(personInsertOf({ ...form.input, name }))
      setSave({ kind: 'idle' })
      onSaved(saved.id)
    } catch (err) {
      setSave({ kind: 'failed', message: err instanceof Error ? err.message : 'Could not save this person' })
    }
  }

  return (
    <form className={p.form} onSubmit={(e) => void submit(e)} aria-busy={save.kind === 'saving'}>
      <Field
        id={birthFieldId(id, 'name')}
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
        id={birthFieldId(id, 'hebrewName')}
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
          {save.kind === 'saving' ? 'Saving' : saveLabel}
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

/** A new person, saved through the people API. */
export function AddPersonForm({ onSaved, onCancel }: { readonly onSaved: (id: string) => void; readonly onCancel?: () => void }) {
  const { addPerson } = usePeople()
  return <PersonForm seed={BLANK} save={addPerson} saveLabel="Save person" onSaved={onSaved} onCancel={onCancel} />
}

/**
 * A saved person's details, opened as they are saved; an unreadable birth
 * starts from its name alone. Only the fields the edit changed are written,
 * so what the record keeps beyond the form survives an edit.
 */
export function EditPersonForm({ person, onSaved, onCancel }: { readonly person: SavedPersonLike; readonly onSaved: (id: string) => void; readonly onCancel?: () => void }) {
  const { updatePerson } = usePeople()
  const read = birthInputOf(person)
  const seed: BirthInput = { ...(read.success ? read.data : BLANK), name: person.name }
  const before = personInsertOf({ ...seed, name: person.name })
  const save = async (fields: PersonFields) => {
    const changed = changedPersonFields(before, fields)
    return Object.keys(changed).length === 0 ? { id: person.id } : updatePerson(person.id, changed)
  }
  return <PersonForm seed={seed} save={save} saveLabel="Save changes" onSaved={onSaved} onCancel={onCancel} />
}
