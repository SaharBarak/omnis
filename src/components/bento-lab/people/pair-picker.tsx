'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight } from 'lucide-react'
import p from './people.module.css'
import kit from '../kit.module.css'
import site from '../site/site.module.css'
import { useAppHrefs } from '@/components/bento-lab/site/site-tree'
import type { AtlasPersonRef } from '@/lib/atlas/types'

function PersonSelect({
  id,
  label,
  value,
  people,
  exclude,
  onPick,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly people: readonly AtlasPersonRef[]
  readonly exclude: string
  readonly onPick: (id: string) => void
}) {
  return (
    <div className={site.field}>
      <label htmlFor={id} className={site.label}>
        {label}
      </label>
      <select id={id} className={p.selectInput} value={value} onChange={(e) => onPick(e.target.value)}>
        {people
          .filter((person) => person.id !== exclude)
          .map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
      </select>
    </div>
  )
}

/** Switch either side of a pair, or swap them. Each choice opens that pair's page. */
export function PairPicker({ people, a, b }: { readonly people: readonly AtlasPersonRef[]; readonly a: string; readonly b: string }) {
  const router = useRouter()
  const { pair: pairHref } = useAppHrefs()
  return (
    <div className={p.pickers}>
      <PersonSelect id="pair-a" label="First person" value={a} people={people} exclude={b} onPick={(next) => router.push(pairHref(next, b))} />
      <Link href={pairHref(b, a)} className={`${kit.iconButton} ${p.swap}`} aria-label="Swap the two people">
        <ArrowLeftRight size={16} aria-hidden />
      </Link>
      <PersonSelect id="pair-b" label="Second person" value={b} people={people} exclude={a} onPick={(next) => router.push(pairHref(a, next))} />
    </div>
  )
}
