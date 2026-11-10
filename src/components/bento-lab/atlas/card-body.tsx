import type { CSSProperties } from 'react'
import c from './card-body.module.css'
import { TYPE_VOICES, voiceCssVars } from '@/lib/design/type-voice'
import type { MarkFact, MarkReading } from '@/lib/atlas/explain'
import type { AtlasLayerId } from '@/lib/atlas/types'

/** What heads a card: the eyebrow naming its system, what the thing is, and the person's value at it. */
export interface CardHead {
  /** The layer whose colour keys the eyebrow; null for a system read beside the map. */
  readonly layer: AtlasLayerId | null
  readonly eyebrow: string
  readonly label: string
  readonly value: string
}

/** The card's text levels as custom properties (BENTO_TYPE.md, "The card"), set on its body. */
const VOICE = voiceCssVars(TYPE_VOICES.card) as CSSProperties

/**
 * A card's words, shared by the drawing's marks and the digest's facts
 * (BENTO_SITE.md, "Marks explain themselves"): the eyebrow, the label, the
 * value as the strong line, then the meaning and facts once explain.ts has
 * loaded. Every string is set as text.
 */
export function CardBody({ head, reading }: { readonly head: CardHead; readonly reading: MarkReading | null }) {
  return (
    <div className={c.body} style={VOICE}>
      <span className={c.eyebrow} data-layer={head.layer ?? undefined}>
        {head.eyebrow}
      </span>
      <span className={c.label}>{head.label}</span>
      <strong className={c.value}>{head.value}</strong>
      {reading?.meaning && <span className={c.meaning}>{reading.meaning}</span>}
      {reading && reading.facts.length > 0 && <CardFacts facts={reading.facts} />}
    </div>
  )
}

/** A card's facts: label and value in two columns, in the card's voice wherever they stand (BENTO_TYPE.md, "The card"). */
export function CardFacts({ facts }: { readonly facts: readonly MarkFact[] }) {
  return (
    <dl className={c.facts} style={VOICE}>
      {facts.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
