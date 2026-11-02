import Link from 'next/link'
import site from '../site/site.module.css'
import type { CircleAtlas } from '@/lib/atlas/types'
import { tieBits, tieHeadline } from '@/lib/relations/tie-text'

export interface CirclePairsProps {
  readonly circle: CircleAtlas
  readonly limit?: number
  readonly id?: string
  /** Where a pair links, when the page has a pair view for it. */
  readonly hrefOf?: (a: string, b: string) => string
}

/** A circle's pairs, heaviest first, each with its rarest drawable tie. */
export function CirclePairs({ circle, limit, id, hrefOf }: CirclePairsProps) {
  const name = (pid: string) => circle.people.find((p) => p.id === pid)?.name ?? pid
  const pairs = [...circle.circle.pairs].sort((x, y) => y.bits - x.bits).slice(0, limit)
  return (
    <ol id={id} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px 24px', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}>
      {pairs.map((p) => {
        const title = `${name(p.a)} and ${name(p.b)}`
        return (
          <li key={`${p.a}-${p.b}`} style={{ display: 'grid', gap: 2 }}>
            {hrefOf ? (
              <Link href={hrefOf(p.a, p.b)} className={site.textLink}>
                <strong style={{ fontWeight: 600 }}>{title}</strong>
              </Link>
            ) : (
              <strong style={{ fontWeight: 600 }}>{title}</strong>
            )}
            <span className={site.hint} style={{ fontSize: 13 }}>
              {tieHeadline(p.ties)} · {tieBits(p.bits)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
