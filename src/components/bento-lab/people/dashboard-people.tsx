'use client'

import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { pairHref } from './hrefs'
import p from './people.module.css'
import { PersonTile, TileSkeletons } from './person-tile'
import { PrimaryAction } from '../site/action'
import site from '../site/site.module.css'
import { EmptyState, ErrorState, Loading } from '../site/states'
import { usePeople } from '@/lib/hooks/use-people'
import { siteHref } from '@/lib/site/routes'

const SHOWN = 8

const addHref = `${siteHref('/app/people')}?add=1`

/** T3 slot: saved people as a compact grid with their kin seals, and the two quick actions. */
export function DashboardPeople() {
  const { people, loading, error, fetchPeople } = usePeople()

  if (loading)
    return (
      <Loading label="Loading people">
        <TileSkeletons count={4} />
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
      <EmptyState
        title="No one saved yet"
        action={
          <PrimaryAction href={addHref} intent="add">
            Add a person
          </PrimaryAction>
        }
      >
        Add someone&apos;s birth date to draw their map.
      </EmptyState>
    )

  return (
    <div className={p.stack}>
      <ul className={p.tiles} aria-label="Saved people">
        {people.slice(0, SHOWN).map((person) => (
          <PersonTile key={person.id} person={person} compact />
        ))}
      </ul>
      <div className={site.actionsCentred}>
        <Link href={addHref} className={site.btn}>
          <Plus size={16} aria-hidden />
          Add a person
        </Link>
        {people.length >= 2 && (
          <Link href={pairHref(people[0].id, people[1].id)} className={site.btn}>
            Map two people
            <ArrowRight size={16} aria-hidden />
          </Link>
        )}
        {people.length > SHOWN && (
          <Link href={siteHref('/app/people')} className={site.textLink}>
            All {people.length} people
          </Link>
        )}
      </div>
    </div>
  )
}
