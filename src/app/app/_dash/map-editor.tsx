'use client'

import { useActionState, useId, useRef, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Pencil } from 'lucide-react'
import s from './dash.module.css'
import { changeYourMap, keepOffer, type KeepIntent, type MapActionState } from './keep-actions'
import { BirthFields } from '@/components/bento-lab/atlas/birth-fields'
import { Field, PrimaryAction, site } from '@/components/bento-lab/site'
import { frame as f } from '@/components/bento-v2'
import type { BirthInput } from '@/lib/atlas/types'
import { useAtlasDraft } from '@/lib/atlas/use-atlas-draft'

const NONE: MapActionState = { error: null }

/** A set of buttons, disabled while the form submits and until `ready`. */
function Actions({ ready, children, className }: { readonly ready: boolean; readonly children: ReactNode; readonly className: string }) {
  const { pending } = useFormStatus()
  return (
    <fieldset className={className} disabled={!ready || pending}>
      {children}
    </fieldset>
  )
}

/**
 * One map's birth fields with its actions (BENTO_V2.md "Changing it later"):
 * the keep card and the change dialog are this editor. The form posts to one
 * server action, with the map's input as JSON in `input` (parsed again on
 * the server) and the pressed button's `intent`. Buttons in `actions` need a
 * birth date that parses; buttons in `aside` do not.
 */
export function MapEditor({
  seed,
  action,
  hidden = {},
  extra,
  actions,
  aside,
  error,
}: {
  readonly seed: BirthInput
  readonly action: (formData: FormData) => void
  readonly hidden?: Readonly<Record<string, string>>
  readonly extra?: ReactNode
  readonly actions: ReactNode
  readonly aside?: ReactNode
  readonly error: string | null
}) {
  const id = useId()
  const form = useAtlasDraft(seed, false)
  return (
    <form action={action} className={s.editor}>
      <BirthFields id={id} form={form} row />
      {extra}
      <input type="hidden" name="input" value={form.input ? JSON.stringify(form.input) : ''} />
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {error ? (
        <p className={site.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={s.editorRow}>
        <Actions ready={form.input !== null} className={s.editorActions}>
          {actions}
        </Actions>
        {aside ? (
          <Actions ready className={s.editorAside}>
            {aside}
          </Actions>
        ) : null}
      </div>
    </form>
  )
}

export interface KeepSummary {
  readonly kin: number
  readonly title: string
  readonly line: string
}

/** A submit button that names what it asks the keep action for. */
const intent = (value: KeepIntent) => ({ type: 'submit' as const, name: 'intent', value })

/**
 * The offer of a map kept before sign-in (BENTO_V2.md "The hand-off"). An
 * account without its own map keeps it as theirs; one with a map adds it as a
 * person, or replaces their map only when asked. The page keys the card by
 * the kept map's nonce, so a newer map never inherits an older one's fields.
 */
export function KeepCard({
  nonce,
  input,
  hasSelf,
  summary,
}: {
  readonly nonce: string
  readonly input: BirthInput
  readonly hasSelf: boolean
  readonly summary: KeepSummary
}) {
  const ids = useId()
  const [state, keep] = useActionState(keepOffer, NONE)
  const [name, setName] = useState(input.name ?? '')

  return (
    <section className={`${f.panel} ${f.pad} ${s.keepCard}`} aria-labelledby={`${ids}title`}>
      <div className={s.keepHead}>
        <p className={f.eyebrow}>Drawn before you signed in</p>
        <h2 id={`${ids}title`} className={s.keepTitle}>
          {hasSelf ? 'Keep this map too.' : 'Keep your map.'}
        </h2>
        <p className={f.caption}>
          Kin {summary.kin}, {summary.title} · {summary.line}
        </p>
      </div>
      <MapEditor
        seed={input}
        action={keep}
        hidden={{ nonce }}
        error={state.error}
        extra={hasSelf ? <Field id={`${ids}name`} name="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /> : null}
        actions={
          hasSelf ? (
            <>
              <PrimaryAction {...intent('person')} intent="add" size="small">
                Add as a person
              </PrimaryAction>
              <button {...intent('replace')} className={`${f.pill} ${f.pillQuiet}`}>
                Replace your map
              </button>
            </>
          ) : (
            <PrimaryAction {...intent('as-you')} intent="save" size="small">
              Keep as you
            </PrimaryAction>
          )
        }
        aside={
          <button {...intent('discard')} className={`${f.pill} ${f.pillQuiet}`}>
            Discard
          </button>
        }
      />
    </section>
  )
}

/** The dialog's form, mounted afresh on every open: the saved map's fields and no earlier error. */
function ChangeForm({ seed, onSaved, onCancel }: { readonly seed: BirthInput; readonly onSaved: () => void; readonly onCancel: () => void }) {
  const [state, save] = useActionState(async (prev: MapActionState, formData: FormData) => {
    const next = await changeYourMap(prev, formData)
    if (next.error === null) onSaved()
    return next
  }, NONE)
  return (
    <MapEditor
      seed={seed}
      action={save}
      error={state.error}
      actions={
        <PrimaryAction type="submit" intent="save" size="small">
          Save
        </PrimaryAction>
      }
      aside={
        <button type="button" className={`${f.pill} ${f.pillQuiet}`} onClick={onCancel}>
          Cancel
        </button>
      }
    />
  )
}

/**
 * "Change your map" (BENTO_V2.md "Changing it later"): the platform's modal
 * dialog holds focus, closes on Escape and returns focus to the control.
 * Saving goes through the profile, as keeping does.
 */
export function ChangeMap({ seed }: { readonly seed: BirthInput }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const [opened, setOpened] = useState(0)
  const close = () => dialog.current?.close()

  const open = () => {
    setOpened((n) => n + 1)
    dialog.current?.showModal()
  }

  return (
    <>
      <button ref={opener} type="button" className={f.round} aria-label="Change your map" aria-haspopup="dialog" onClick={open}>
        <Pencil size={16} aria-hidden />
      </button>
      <dialog
        ref={dialog}
        className={`${f.panel} ${s.dialog}`}
        aria-labelledby={titleId}
        onClose={() => {
          if (document.activeElement === document.body) opener.current?.focus()
        }}
      >
        <h2 id={titleId} className={s.keepTitle}>
          Change your map
        </h2>
        <ChangeForm key={`${opened}:${JSON.stringify(seed)}`} seed={seed} onSaved={close} onCancel={close} />
      </dialog>
    </>
  )
}
