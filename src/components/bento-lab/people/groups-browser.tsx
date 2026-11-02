'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { groupHref } from './hrefs'
import p from './people.module.css'
import { Field } from '../site/field'
import site from '../site/site.module.css'
import { EmptyState, ErrorState, Loading, Skeleton } from '../site/states'
import { useGroups } from '@/lib/hooks/use-groups'
import { usePeople } from '@/lib/hooks/use-people'

type SaveState = { readonly kind: 'idle' } | { readonly kind: 'saving' } | { readonly kind: 'failed'; readonly message: string }

/** Name, a line of description, and who is in it. Opens the new circle once saved. */
function NewCircleForm({ preselect, onCancel }: { readonly preselect: readonly string[]; readonly onCancel?: () => void }) {
  const router = useRouter()
  const { createGroup } = useGroups()
  const { people, loading } = usePeople()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<readonly string[]>(preselect)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const chosen = members.filter((id) => people.some((person) => person.id === id))
  const ready = name.trim() !== '' && save.kind !== 'saving'

  const toggle = (id: string) => setMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setSave({ kind: 'saving' })
    try {
      const group = await createGroup({ name: name.trim(), description: description.trim() || undefined, personIds: [...chosen] })
      router.push(groupHref(group.id))
    } catch (err) {
      setSave({ kind: 'failed', message: err instanceof Error ? err.message : 'Could not save this circle' })
    }
  }

  return (
    <form className={p.form} onSubmit={(e) => void submit(e)} aria-busy={save.kind === 'saving'}>
      <div className={p.formRow}>
        <Field id="circle-name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Family, team, friends" autoComplete="off" />
        <Field id="circle-description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} hint="Optional." autoComplete="off" />
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        <legend className={site.label} style={{ marginBottom: 8 }}>
          People in it · {chosen.length} chosen
        </legend>
        {loading ? (
          <Skeleton height={38} />
        ) : people.length === 0 ? (
          <p className={site.hint}>Save people first, then pick who belongs here.</p>
        ) : (
          <ul className={p.checks}>
            {people.map((person) => (
              <li key={person.id}>
                <label className={p.check}>
                  <input type="checkbox" checked={chosen.includes(person.id)} onChange={() => toggle(person.id)} />
                  {person.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
      {save.kind === 'failed' && (
        <p className={site.error} role="alert">
          {save.message}
        </p>
      )}
      <div className={site.actions}>
        <button type="submit" className={`${site.btn} ${site.btnSolid}`} disabled={!ready}>
          {save.kind === 'saving' ? 'Saving' : 'Save circle'}
        </button>
        {onCancel && (
          <button type="button" className={site.btn} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function NewCirclePanel({ preselect, onCancel }: { readonly preselect: readonly string[]; readonly onCancel?: () => void }) {
  return (
    <section className={p.panel} aria-labelledby="new-circle-title">
      <h2 id="new-circle-title" className={p.panelTitle}>
        New circle
      </h2>
      <NewCircleForm preselect={preselect} onCancel={onCancel} />
    </section>
  )
}

/** T9 circles list, with the new-circle form open when people arrive preselected. */
export function GroupsBrowser({ preselect }: { readonly preselect: readonly string[] }) {
  const { groups, loading, error, fetchGroups } = useGroups()
  const [creating, setCreating] = useState(preselect.length > 0)

  if (loading)
    return (
      <Loading label="Loading circles">
        <div className={p.panel} aria-hidden>
          <Skeleton height={18} width="40%" />
          <Skeleton height={14} width="70%" style={{ marginTop: 10 }} />
        </div>
      </Loading>
    )

  if (error)
    return (
      <ErrorState
        title="Could not load your circles"
        action={
          <button type="button" className={site.btn} onClick={() => void fetchGroups()}>
            Try again
          </button>
        }
      >
        {error}
      </ErrorState>
    )

  if (groups.length === 0)
    return (
      <div className={p.stack}>
        <EmptyState title="No circles yet">Put three or more people in a circle to see every pair ranked by how rare its ties are.</EmptyState>
        <NewCirclePanel preselect={preselect} />
      </div>
    )

  return (
    <div className={p.stack}>
      {creating ? (
        <NewCirclePanel preselect={preselect} onCancel={() => setCreating(false)} />
      ) : (
        <div className={site.actions}>
          <button type="button" className={`${site.btn} ${site.btnSolid}`} onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden />
            New circle
          </button>
        </div>
      )}
      <section className={p.panel} aria-label="Your circles">
        <ul className={p.rows}>
          {groups.map((group) => (
            <li key={group.id} className={p.row}>
              <span className={p.rowMain}>
                <Link href={groupHref(group.id)} className={site.textLink}>
                  <strong>{group.name}</strong>
                </Link>
                {group.description && <span>{group.description}</span>}
              </span>
              <Link href={groupHref(group.id)} className={`${site.btn} ${site.btnSmall}`}>
                Open map
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
