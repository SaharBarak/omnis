'use client'

import Link from 'next/link'
import { useState } from 'react'
import { pairHref, personHref } from './hrefs'
import p from './people.module.css'
import site from '../site/site.module.css'
import type { Tied } from './use-ranked-ties'
import type { AtlasPerson } from '@/lib/atlas/pair'
import { tieBits, tieHeadline } from '@/lib/relations/tie-text'

const SHOWN = 8

function Row({ self, tied }: { readonly self: AtlasPerson; readonly tied: Tied }) {
  return (
    <li className={p.row}>
      <span className={p.rowMain}>
        <Link href={personHref(tied.other.id)} className={site.textLink}>
          <strong>{tied.other.name}</strong>
        </Link>
        <span>
          {tieHeadline(tied.reading.ties)} · {tieBits(tied.reading.bits)}
        </span>
      </span>
      <Link href={pairHref(self.id, tied.other.id)} className={`${site.btn} ${site.btnSmall}`}>
        Map the pair
      </Link>
    </li>
  )
}

/** `self`'s ties with everyone else saved, heaviest first, the first few and then all on request. */
export function TieRows({ self, ranked }: { readonly self: AtlasPerson; readonly ranked: readonly Tied[] }) {
  const [all, setAll] = useState(false)
  const rows = all ? ranked : ranked.slice(0, SHOWN)
  return (
    <div className={p.rowsBlock}>
      <ol className={p.rows}>
        {rows.map((tied) => (
          <Row key={tied.other.id} self={self} tied={tied} />
        ))}
      </ol>
      {ranked.length > SHOWN && (
        <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Show fewer' : `Show all ${ranked.length}`}
        </button>
      )}
    </div>
  )
}
