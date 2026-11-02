import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import a from './atlas.module.css'
import { TIE_LAYER } from './tie-geometry'
import site from '../site/site.module.css'
import { centerName, type PairReading } from '@/lib/relations/pair-ties'
import { SYSTEM_LABEL, tieBetween, tieName, tieOdds } from '@/lib/relations/tie-text'

/** The rarest drawable ties as short cards, for narrow columns. */
export function TieList({ reading, names, limit = 4 }: { readonly reading: PairReading; readonly names: Readonly<Record<string, string>>; readonly limit?: number }) {
  const name = (id: string) => names[id] ?? id
  const drawn = reading.ties.filter((t) => mayDrawEdge(t.baseRate)).slice(0, limit)
  if (drawn.length === 0) {
    return <p className={site.body}>No tie between these two is rare enough to draw. Most pairs share only common ties.</p>
  }
  return (
    <ol className={a.tokens} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
      {drawn.map((t, i) => (
        <li key={`${t.system}-${t.type}-${i}`} className={`${site.card} ${site.cardTight}`} style={{ display: 'grid', gap: 6 }}>
          <span className={a.readoutHead}>
            <span className={a.swatch} data-layer={TIE_LAYER[t.system]} aria-hidden />
            {SYSTEM_LABEL[t.system]} · {tieOdds(t.baseRate)}
          </span>
          <strong style={{ fontWeight: 600 }}>{tieName(t, centerName)}</strong>
          <span className={site.hint} style={{ fontSize: 13 }}>
            {tieBetween(t, name)}
          </span>
        </li>
      ))}
    </ol>
  )
}
