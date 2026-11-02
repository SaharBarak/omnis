'use client'

import Link from 'next/link'
import { useDeferredValue, useState, type CSSProperties, type ReactNode } from 'react'
import { EmptyState, Field, site } from '../site'
import kit from '../kit.module.css'
import d from './docs.module.css'
import { matchesQuery, type LibraryEntry } from './library-search'
import { siteHref } from '@/lib/site/routes'

export interface LibraryIndexProps {
  readonly entries: readonly LibraryEntry[]
  readonly lead: string
  /** The system shelf, rendered on the server. */
  readonly children: ReactNode
}

const countLabel = (shown: number, total: number): string =>
  shown === total ? `${total} sections` : `${shown} of ${total} sections`

/** T5: title and search, the shelf, then every section of every article, filtered as you type. */
export function LibraryIndex({ entries, lead, children }: LibraryIndexProps) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const shown = deferred.trim() ? entries.filter((entry) => matchesQuery(entry, deferred)) : entries

  return (
    <div className={site.page}>
      <header className={d.libraryHead}>
        <div className={d.libraryTitle}>
          <span className={kit.eyebrow}>Library</span>
          <h1 className={site.display}>How each system is read</h1>
          <p className={site.lead}>{lead}</p>
        </div>
        <Field
          id="library-search"
          label="Search the library"
          type="search"
          hint="Seal, gate, letter, planet"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      {children}

      <div className={d.listHead}>
        <h2 className={site.h3}>Every section</h2>
        <p className={d.count} aria-live="polite">
          {countLabel(shown.length, entries.length)}
        </p>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={`Nothing matches “${deferred.trim()}”`}
          action={
            <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => setQuery('')}>
              Clear the search
            </button>
          }
        >
          Try a seal, a gate number, a Hebrew letter or a planet.
        </EmptyState>
      ) : (
        <ul className={`${site.card} ${d.list}`}>
          {shown.map((entry) => (
            <li key={entry.id} className={d.entry} style={{ '--accent': entry.accent } as CSSProperties}>
              <Link href={`${siteHref(`/learn/${entry.article}`)}#${entry.id}`} className={d.entryLink}>
                {entry.title}
              </Link>
              <span className={`${site.chip} ${d.entrySystem}`}>
                <span className={`${site.dot} ${d.accentDot}`} aria-hidden />
                {entry.system}
              </span>
              <span className={d.minutes}>{`${entry.minutes} min`}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
