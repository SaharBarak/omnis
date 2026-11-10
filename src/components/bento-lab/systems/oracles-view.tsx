'use client'

import { useMemo } from 'react'
import { dailyHexagram, dailyRune, dailyTarotCard } from '@pleiad/engine/calculations/oracles'
import { HEXAGRAMS, TRIGRAMS, hexagramLines, type Hexagram } from '@pleiad/engine/data/iching'
import { ELDER_FUTHARK } from '@pleiad/engine/data/runes'
import { TAROT_DECK } from '@pleiad/engine/data/tarot'
import { systemArt } from './art'
import s from './systems.module.css'
import { roman, undash } from './model'
import { FigureCard, GridSkeleton, Readout, SystemGrid, SystemPage, SystemSection, type SystemPageSpec } from './system-page'
import { useToday } from './use-computed'
import { routeTitle } from '@/lib/site/routes'
import { useAuth } from '@/lib/hooks/use-auth'

export const ORACLES_SPEC: SystemPageSpec = {
  path: '/app/oracles',
  title: routeTitle('/app/oracles'),
  eyebrow: 'Daily draw',
  lead: 'A tarot card, a hexagram and a rune for today. The draw holds for the whole UTC day and differs from one account to the next.',
  reads: `Reads the date and your account, no birth data. One card from ${TAROT_DECK.length}, one hexagram from ${HEXAGRAMS.length} and one rune from ${ELDER_FUTHARK.length}.`,
  ...systemArt('/app/oracles'),
  article: 'iching-hexagrams',
  guide: null,
}

const AETTIR = ["Freyr's aett", "Hagal's aett", "Tyr's aett"] as const

/** Major arcana carry Roman numerals on the card face; minors their rank. */
const cardFace = (card: { readonly arcana: string; readonly number: number }): string => (card.arcana === 'major' ? roman(card.number) : String(card.number))

/** Six lines, top first, as a hexagram is drawn. */
const topFirst = (h: Hexagram): readonly boolean[] => [...hexagramLines(h.number)].reverse()

function HexagramFigure({ hexagram }: { readonly hexagram: Hexagram }) {
  return (
    <div className={s.hexagram} role="img" aria-label={`Hexagram ${hexagram.number}, ${hexagram.trigrams[1]} over ${hexagram.trigrams[0]}`}>
      {topFirst(hexagram).map((yang, i) => (
        <span key={i} className={yang ? s.yang : s.yin} />
      ))}
    </div>
  )
}

function Reference() {
  return (
    <SystemSection id="reference" title="The full sets" lead="Every card, hexagram and rune the draw can land on.">
      <details>
        <summary className={s.tileLabel} style={{ cursor: 'pointer', paddingBlock: 6 }}>
          Tarot, {TAROT_DECK.length} cards
        </summary>
        <Readout columns title="Tarot deck" rows={TAROT_DECK.map((c) => ({ label: c.name, value: c.upright, detail: `Reversed: ${c.reversed}` }))} />
      </details>
      <details>
        <summary className={s.tileLabel} style={{ cursor: 'pointer', paddingBlock: 6 }}>
          I Ching, {HEXAGRAMS.length} hexagrams
        </summary>
        <Readout columns title="Hexagrams" rows={HEXAGRAMS.map((h) => ({ label: `${h.number} ${h.pinyin}`, value: h.english, detail: undash(h.judgment) }))} />
      </details>
      <details>
        <summary className={s.tileLabel} style={{ cursor: 'pointer', paddingBlock: 6 }}>
          Elder Futhark, {ELDER_FUTHARK.length} runes
        </summary>
        <Readout columns title="Runes" rows={ELDER_FUTHARK.map((r) => ({ label: `${r.glyph} ${r.name}`, value: `${r.literal}, ${AETTIR[r.aett - 1]}`, detail: undash(r.meaning) }))} />
      </details>
    </SystemSection>
  )
}

function Draws({ today, seed }: { readonly today: string; readonly seed: string }) {
  const tarot = useMemo(() => dailyTarotCard(today, seed), [today, seed])
  const hexagram = useMemo(() => dailyHexagram(today, seed), [today, seed])
  const rune = useMemo(() => dailyRune(today, seed), [today, seed])
  const orientation = tarot.reversed ? 'Reversed' : 'Upright'
  return (
    <SystemGrid
      spec={ORACLES_SPEC}
      figure={
        <FigureCard label={`Draw for ${today}`}>
          <div className={s.draws}>
            <div className={s.draw}>
              <span className={s.tileLabel}>Tarot</span>
              <span className={`${s.tarot} ${tarot.reversed ? s.reversed : ''}`} aria-hidden>
                {cardFace(tarot.card)}
              </span>
              <strong>{tarot.card.name}</strong>
              <span className={s.tileText}>{orientation}</span>
            </div>
            <div className={s.draw}>
              <span className={s.tileLabel}>I Ching</span>
              <HexagramFigure hexagram={hexagram} />
              <strong>
                {hexagram.number}. {hexagram.english}
              </strong>
              <span className={s.tileText}>{hexagram.pinyin}</span>
            </div>
            <div className={s.draw}>
              <span className={s.tileLabel}>Rune</span>
              <span className={s.rune} aria-hidden>
                {rune.glyph}
              </span>
              <strong>{rune.name}</strong>
              <span className={s.tileText}>{rune.literal}</span>
            </div>
          </div>
        </FigureCard>
      }
      side={
        <Readout
          title="Today's draw"
          rows={[
            { label: 'Tarot', value: `${tarot.card.name}, ${orientation.toLowerCase()}`, detail: tarot.reversed ? tarot.card.reversed : tarot.card.upright },
            { label: 'Hexagram', value: `${hexagram.number} ${hexagram.english}`, detail: `${hexagram.trigrams[1]} over ${hexagram.trigrams[0]}. ${undash(hexagram.judgment)}` },
            { label: 'Rune', value: `${rune.name} (${rune.transliteration})`, detail: `${AETTIR[rune.aett - 1]}. ${undash(rune.meaning)}` },
            { label: 'Date', value: today, detail: 'Draws change when the UTC date changes.' },
          ]}
        />
      }
    />
  )
}

export function OraclesView() {
  const today = useToday('utc')
  const { user, loading } = useAuth()
  return (
    <SystemPage spec={ORACLES_SPEC}>
      {today && !loading ? <Draws today={today} seed={user?.id ?? ''} /> : <GridSkeleton spec={ORACLES_SPEC} rows={4} />}
      <Reference />
    </SystemPage>
  )
}
