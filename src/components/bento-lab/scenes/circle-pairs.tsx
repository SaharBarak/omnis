import type { CSSProperties } from 'react'
import c from './circle.module.css'
import f from './figure.module.css'
import { GlyphDisc } from '../glyph-mark'
import { TIE_LAYER, tieStroke } from '@/components/bento-lab/atlas/tie-geometry'
import type { CircleAtlas } from '@/lib/atlas/types'
import { headlineTie, tieBits, tieHeadline } from '@/lib/relations/tie-text'

/** Heaviest pairs listed by default. */
export const SHOWN_PAIRS = 3
/** The pair chip's link is the line at this share of its drawn width. */
const LINK_SCALE = 0.5

export interface CirclePairsProps {
  readonly circle: CircleAtlas
  /** For the drawing's `describedBy`. */
  readonly id?: string
  /** How many pairs, heaviest first. */
  readonly count?: number
  /** The list's layout; the bento figure's row when absent. */
  readonly className?: string
  /** Each pair's surface; the bento figure's raised surface when absent. */
  readonly surface?: string
}

/**
 * A circle's heaviest pairs (BENTO_MOTION.md storyboard 4): each as the two
 * people's seals joined by their rarest tie's line at its weight, their names,
 * that tie with its odds and the pair's bits.
 */
export function CirclePairs({ circle, id, count = SHOWN_PAIRS, className, surface = f.surface }: CirclePairsProps) {
  const person = (pid: string) => circle.people.find((x) => x.id === pid)
  const pairs = [...circle.circle.pairs].sort((x, y) => y.bits - x.bits).slice(0, count)
  return (
    <ol id={id} className={className ?? c.pairs} aria-label="Heaviest pairs">
      {pairs.map((pair) => {
        const a = person(pair.a)
        const b = person(pair.b)
        const top = headlineTie(pair.ties)
        return (
          <li key={`${pair.a}-${pair.b}`} className={`${surface} ${c.pair}`} data-layer={top ? TIE_LAYER[top.system] : undefined}>
            <span className={c.duo} aria-hidden>
              <GlyphDisc src={a?.maya.seal.src ?? ''} className={c.seal} />
              <span className={c.link} style={{ '--w': `${top ? tieStroke(top.bits).width * LINK_SCALE : 1}px` } as CSSProperties} />
              <GlyphDisc src={b?.maya.seal.src ?? ''} className={c.seal} />
            </span>
            <span className={c.pairText}>
              <span className={c.names}>
                {a?.name ?? pair.a} and {b?.name ?? pair.b}
              </span>
              <span className={c.tie}>{tieHeadline(pair.ties)}</span>
            </span>
            <span className={c.bits}>{tieBits(pair.bits)}</span>
          </li>
        )
      })}
    </ol>
  )
}
