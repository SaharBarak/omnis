'use client'

import type { ReactNode } from 'react'
import { mayDrawEdge } from '@pleiad/engine/services/rarity'
import f from './figure.module.css'
import p from './pair.module.css'
import kit from '../kit.module.css'
import { TIE_LAYER, tieStroke } from '@/components/bento-lab/atlas/tie-geometry'
import { Rolling } from '@/components/bento-lab/motion'
import { centerName, type PairReading, type Tie } from '@/lib/relations/pair-ties'
import { tieName, tieOdds } from '@/lib/relations/tie-text'

/** The rarity gauge's path length: rarity is out of 100. */
const GAUGE = 100
/** The rarest tie's mark is a half-size copy of its line. */
const MARK_SCALE = 0.5

/** `shown` rolls to each new value; assistive tech reads only `final`. */
export function Shown({ shown, final }: { readonly shown: string | number; readonly final: string | number }) {
  return (
    <>
      <span aria-hidden>
        <Rolling value={shown} />
      </span>
      <span className={kit.srOnly}>{final}</span>
    </>
  )
}

function TieMark({ tie }: { readonly tie: Tie }) {
  return (
    <svg viewBox="0 0 64 40" className={p.mark} data-layer={TIE_LAYER[tie.system]} aria-hidden>
      <path d="M 8 32 C 16 6, 48 6, 56 32" className={p.markLine} strokeWidth={tieStroke(tie.bits).width * MARK_SCALE} pathLength={1} data-mark-line="" />
      <circle cx={8} cy={32} r={4} className={p.markEnd} />
      <circle cx={56} cy={32} r={4} className={p.markEnd} />
    </svg>
  )
}

function Fact({ visual, label, value, meta, layer, surface }: { visual: ReactNode; label: string; value: ReactNode; meta: string; layer?: string; surface: string }) {
  return (
    <li className={`${surface} ${p.fact}`} data-layer={layer}>
      {visual}
      <span className={p.factText}>
        <span className={p.factLabel}>{label}</span>
        <span className={p.factValue}>{value}</span>
        <span className={p.factMeta}>{meta}</span>
      </span>
    </li>
  )
}

export interface PairFactsProps {
  /** The pair's reading: its ties, rarest first, and its rarity. */
  readonly reading: Pick<PairReading, 'ties' | 'rarity'>
  /** Lines drawn so far, while a sequence draws them; every drawable line when absent. */
  readonly lit?: number
  /** The list's layout; the bento figure's row of facts when absent. */
  readonly className?: string
  /** Each fact's surface; the bento figure's raised surface when absent. */
  readonly surface?: string
  /** Further items, after the facts (an action). */
  readonly children?: ReactNode
}

/**
 * A pair's three facts (BENTO_MOTION.md storyboard 3): its rarest tie as its
 * line in miniature with its odds, how many of its ties are rare enough to
 * draw, and its rarity against random pairs as a gauge. The mark, dots and
 * gauge carry the hooks a sequence draws them by (`data-mark-line`,
 * `data-gauge`); at rest they are whole.
 */
export function PairFacts({ reading, lit, className, surface = f.surface, children }: PairFactsProps) {
  const ties = reading.ties
  const drawn = ties.filter((t) => mayDrawEdge(t.baseRate))
  const top = drawn[0]
  const shown = lit ?? drawn.length
  return (
    <ul className={className ?? p.facts} data-action={children ? '' : undefined}>
      {top ? (
        <Fact visual={<TieMark tie={top} />} label="Rarest tie" value={tieName(top, centerName)} meta={tieOdds(top.baseRate)} layer={TIE_LAYER[top.system]} surface={surface} />
      ) : (
        <Fact visual={<span className={p.markEmpty} aria-hidden />} label="Rarest tie" value="None drawn" meta="Common ties only" surface={surface} />
      )}
      <Fact
        visual={
          <span className={p.dots} aria-hidden>
            {ties.map((t, i) => (
              <span key={`${t.system}-${t.type}-${i}`} className={p.dot} data-layer={mayDrawEdge(t.baseRate) ? TIE_LAYER[t.system] : undefined} data-lit={i < shown ? '' : undefined} />
            ))}
          </span>
        }
        label="Lines drawn"
        value={
          <>
            <Shown shown={shown} final={drawn.length} /> of {ties.length}
          </>
        }
        meta="ties checked"
        surface={surface}
      />
      <Fact
        visual={
          <svg viewBox="0 0 44 44" className={p.gauge} aria-hidden>
            <circle cx={22} cy={22} r={18} className={p.gaugeTrack} />
            <circle
              cx={22}
              cy={22}
              r={18}
              className={p.gaugeArc}
              pathLength={GAUGE}
              strokeDasharray={`${reading.rarity} ${2 * GAUGE}`}
              transform="rotate(-90 22 22)"
              data-gauge=""
            />
          </svg>
        }
        label="Rarity"
        value={reading.rarity}
        meta="of 100, against random pairs"
        surface={surface}
      />
      {children}
    </ul>
  )
}
