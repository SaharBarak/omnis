import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { appHrefs } from './hrefs'
import p from './people.module.css'
import kit from '../kit.module.css'
import { Skeleton } from '../site/states'
import type { SiteTree } from '@/lib/site/routes'
import { atlasPersonOf, missingOf, MISSING_LABEL, type SavedPersonLike } from '@/lib/atlas/app/saved-person'
import { BIRTH_FIELD_LABEL } from '@/lib/atlas/birth-input'
import { birthLine } from '@/lib/atlas/birth-line'
import { buildMaya } from '@/lib/atlas/maya'

/** Tiles name only what the map itself lacks; the Hebrew name shows on the person page. */
const MAP_GAPS = new Set(['time', 'place'])

/** One saved person: kin seal, name, kin title, birth line, what the map still lacks. The whole tile opens the person. */
export function PersonTile({
  person,
  compact = false,
  selected,
  onToggle,
  tree,
}: {
  readonly person: SavedPersonLike
  /** The tree the tile links into: it renders from server and client pages alike. */
  readonly tree: SiteTree
  readonly compact?: boolean
  readonly selected?: boolean
  readonly onToggle?: (id: string) => void
}) {
  const read = atlasPersonOf(person)
  const atlasPerson = read.success ? read.data : null
  const maya = atlasPerson ? buildMaya(atlasPerson.input.date) : null
  const fix = read.success ? null : `Saved ${BIRTH_FIELD_LABEL[read.error.field]} needs fixing`
  const gaps = compact ? [] : missingOf(person).filter((m) => MAP_GAPS.has(m))
  return (
    <li className={p.tile} data-selected={selected ? '' : undefined}>
      <span className={p.seal} aria-hidden>
        {maya && <Image src={maya.seal.src} alt="" width={26} height={26} className={kit.glyph} />}
      </span>
      <div className={p.tileBody}>
        <Link href={appHrefs(tree).person(person.id)} className={p.tileName}>
          {person.name}
        </Link>
        <span className={p.tileMeta}>{maya ? `Kin ${maya.kin} · ${maya.title}` : fix}</span>
        {!compact && atlasPerson && <span className={p.tileSub}>{birthLine(atlasPerson)}</span>}
        {gaps.length > 0 && (
          <span className={p.chips}>
            {gaps.map((m) => (
              <span key={m} className={p.miniChip}>
                {MISSING_LABEL[m]}
              </span>
            ))}
          </span>
        )}
      </div>
      {onToggle && (
        <button type="button" className={p.select} aria-pressed={selected ?? false} aria-label={`Select ${person.name}`} onClick={() => onToggle(person.id)}>
          {selected && <Check size={14} aria-hidden />}
        </button>
      )}
    </li>
  )
}

/** Tile-shaped placeholders while people load. */
export function TileSkeletons({ count }: { readonly count: number }) {
  return (
    <ul className={p.tiles} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={p.tile}>
          <span className={p.seal} />
          <div className={p.tileBody}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="85%" height={12} />
          </div>
        </li>
      ))}
    </ul>
  )
}
