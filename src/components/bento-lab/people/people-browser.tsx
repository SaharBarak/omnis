'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Plus, X } from 'lucide-react'
import { AddPersonForm } from './add-person-form'
import { newCircleHref, pairHref, personHref } from './hrefs'
import p from './people.module.css'
import { PersonTile, TileSkeletons } from './person-tile'
import kit from '../kit.module.css'
import { Field } from '../site/field'
import site from '../site/site.module.css'
import { EmptyState, ErrorState, Loading } from '../site/states'
import { usePeople, type PersonWithTags, type Tag } from '@/lib/hooks/use-people'

const matches = (person: PersonWithTags, query: string, tag: string | null): boolean => {
  const q = query.trim().toLocaleLowerCase()
  const named = q === '' || person.name.toLocaleLowerCase().includes(q) || (person.hebrew_name ?? '').includes(q)
  return named && (tag === null || person.tags.some((t) => t.id === tag))
}

/** Tags at least one saved person carries, in the API's order. */
const usedTags = (tags: readonly Tag[], people: readonly PersonWithTags[]): readonly Tag[] => {
  const used = new Set(people.flatMap((person) => person.tags.map((t) => t.id)))
  return tags.filter((t) => used.has(t.id))
}

function AddPanel({ onCancel }: { readonly onCancel?: () => void }) {
  const router = useRouter()
  return (
    <section className={p.panel} aria-labelledby="add-person-title">
      <h2 id="add-person-title" className={p.panelTitle}>
        Add a person
      </h2>
      <AddPersonForm onSaved={(id) => router.push(personHref(id))} onCancel={onCancel} />
    </section>
  )
}

function CompareBar({ ids, onClear }: { readonly ids: readonly string[]; readonly onClear: () => void }) {
  return (
    <div className={`${p.compare} ${kit.glass}`} role="region" aria-label="Selected people">
      <span className={site.body}>{ids.length} selected</span>
      <div className={site.actions}>
        <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={onClear}>
          <X size={14} aria-hidden />
          Clear
        </button>
        {ids.length === 2 ? (
          <Link href={pairHref(ids[0], ids[1])} className={`${site.btn} ${site.btnSmall} ${site.btnSolid}`}>
            Map these two
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : (
          <Link href={newCircleHref(ids)} className={`${site.btn} ${site.btnSmall} ${site.btnSolid}`}>
            Make a circle
            <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}

/** T9 people list: search, tag filter, tiles, a compare bar once two are picked, and the add form. */
export function PeopleBrowser({ startAdding = false }: { readonly startAdding?: boolean }) {
  const { people, tags, loading, error, fetchPeople } = usePeople()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [selected, setSelected] = useState<readonly string[]>([])
  const [adding, setAdding] = useState(startAdding)

  if (loading)
    return (
      <Loading label="Loading people">
        <TileSkeletons count={6} />
      </Loading>
    )

  if (error)
    return (
      <ErrorState
        title="Could not load your people"
        action={
          <button type="button" className={site.btn} onClick={() => void fetchPeople()}>
            Try again
          </button>
        }
      >
        {error}
      </ErrorState>
    )

  if (people.length === 0)
    return (
      <div className={p.stack}>
        <EmptyState title="No one saved yet">Add someone&apos;s birth date to draw their map. A birth time and place add the bodygraph and the rising sign.</EmptyState>
        <AddPanel />
      </div>
    )

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const filters = usedTags(tags, people)
  const shown = people.filter((person) => matches(person, query, tag))

  return (
    <div className={p.stack}>
      {adding && <AddPanel onCancel={() => setAdding(false)} />}
      <div className={p.toolbar}>
        <div className={p.search}>
          <Field id="people-search" label="Search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or Hebrew name" autoComplete="off" />
        </div>
        <span className={site.hint} aria-live="polite" style={{ paddingBottom: 12 }}>
          {shown.length === people.length ? `${people.length} people` : `${shown.length} of ${people.length}`}
        </span>
        {!adding && (
          <button type="button" className={`${site.btn} ${site.btnSolid}`} onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden />
            Add a person
          </button>
        )}
      </div>
      {filters.length > 0 && (
        <div className={p.filters} role="group" aria-label="Filter by tag">
          <button type="button" className={p.filter} aria-pressed={tag === null} onClick={() => setTag(null)}>
            Everyone
          </button>
          {filters.map((t) => (
            <button key={t.id} type="button" className={p.filter} aria-pressed={tag === t.id} onClick={() => setTag(tag === t.id ? null : t.id)}>
              <span className={site.dot} style={{ background: t.color }} aria-hidden />
              {t.name}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState
          title="No one matches"
          action={
            <button
              type="button"
              className={site.btn}
              onClick={() => {
                setQuery('')
                setTag(null)
              }}
            >
              Clear the search
            </button>
          }
        />
      ) : (
        <ul className={p.tiles} aria-label="Saved people">
          {shown.map((person) => (
            <PersonTile key={person.id} person={person} selected={selected.includes(person.id)} onToggle={toggle} />
          ))}
        </ul>
      )}
      {selected.length >= 2 && <CompareBar ids={selected} onClear={() => setSelected([])} />}
    </div>
  )
}
