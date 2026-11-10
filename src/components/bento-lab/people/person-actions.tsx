'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EditPersonForm } from './add-person-form'
import { DialogButton } from '../site/dialog'
import { useAppHrefs } from '../site/site-tree'
import site from '../site/site.module.css'
import type { SavedPersonLike } from '@/lib/atlas/app/saved-person'
import { usePeople } from '@/lib/hooks/use-people'

type Removal = { readonly kind: 'asking' } | { readonly kind: 'removing' } | { readonly kind: 'failed'; readonly message: string }

/** Asks before a person goes to the trash (recoverable), then leaves for the people list. */
function RemovePerson({ person, close }: { readonly person: SavedPersonLike; readonly close: () => void }) {
  const router = useRouter()
  const hrefs = useAppHrefs()
  const { deletePerson } = usePeople()
  const [removal, setRemoval] = useState<Removal>({ kind: 'asking' })
  const remove = () => {
    setRemoval({ kind: 'removing' })
    deletePerson(person.id).then(
      () => {
        close()
        router.push(hrefs.people)
      },
      (err: unknown) => setRemoval({ kind: 'failed', message: err instanceof Error ? err.message : 'They could not be removed.' }),
    )
  }
  return (
    <>
      <p>{person.name} moves to the trash, with their map and every tie drawn from it. They can be restored from there.</p>
      {removal.kind === 'failed' && (
        <p className={site.error} role="alert">
          {removal.message}
        </p>
      )}
      <div className={site.actions}>
        <button type="button" className={site.btn} data-tone="danger" disabled={removal.kind === 'removing'} onClick={remove}>
          {removal.kind === 'removing' ? 'Removing' : `Remove ${person.name}`}
        </button>
        <button type="button" className={site.btn} onClick={close}>
          Keep them
        </button>
      </div>
    </>
  )
}

/**
 * A saved person's own actions (BENTO_V2.md "The app in v2", "Flows"):
 * editing their details in a dialog, the page redrawn on save; removing
 * them, asked first, to the trash.
 */
export function PersonActions({ person }: { readonly person: SavedPersonLike }) {
  const router = useRouter()
  return (
    <div className={site.actions}>
      <DialogButton label="Edit details" title={`Edit ${person.name}`}>
        {(close) => (
          <EditPersonForm
            person={person}
            onSaved={() => {
              close()
              router.refresh()
            }}
            onCancel={close}
          />
        )}
      </DialogButton>
      <DialogButton label="Remove" title={`Remove ${person.name}?`}>
        {(close) => <RemovePerson person={person} close={close} />}
      </DialogButton>
    </div>
  )
}
