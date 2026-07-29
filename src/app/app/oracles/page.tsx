'use client'

import { useMemo, useState } from 'react'
import {
  dailyHexagram,
  dailyRune,
  dailyTarotCard,
} from '@pleiad/engine/calculations'
import { TAROT_DECK, type TarotSuit } from '@pleiad/engine/data/tarot'
import { HEXAGRAMS, TRIGRAMS } from '@pleiad/engine/data/iching'
import { ELDER_FUTHARK } from '@pleiad/engine/data/runes'
import { useAuth } from '@/lib/hooks/use-auth'
import { PageHeader } from '@/components/dashboard'
import { DataRow, PageSection, Pill } from '@/components/app-kit'
import { cn } from '@/lib/utils'

/**
 * Oracles (#74) — tarot, I Ching, and the Elder Futhark on one page.
 * Each system opens with today's deterministic draw (seeded by date +
 * user, so it holds all day and differs per person) and unfolds into its
 * full reference library. Spreads are a later phase.
 */

const ACCENTS = {
  tarot: '#A87BD1',
  iching: '#7FA8D4',
  runes: '#C9CDD4',
} as const

const SUIT_LABELS: Record<TarotSuit, string> = {
  wands: 'Wands — fire, will, work',
  cups: 'Cups — water, feeling, bonds',
  swords: 'Swords — air, mind, conflict',
  pentacles: 'Pentacles — earth, body, means',
}

function DrawHero({
  eyebrow,
  title,
  subtitle,
  body,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  body: string
}) {
  return (
    <div className="feature-card p-6">
      <div className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
        {eyebrow}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-3">
        <span className="font-display text-3xl tracking-tight text-brand-bright">
          {title}
        </span>
        {subtitle && <span className="text-sm text-white/50">{subtitle}</span>}
      </div>
      <p className="mt-2 max-w-[65ch] text-sm text-white/70">{body}</p>
    </div>
  )
}

function ToggleAll({
  open,
  onToggle,
  label,
}: {
  open: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="mt-3 rounded-full border border-white/15 px-4 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/[0.25] active:scale-[0.98]"
    >
      {open ? `Hide ${label}` : `Browse ${label}`}
    </button>
  )
}

export default function OraclesPage() {
  const { user } = useAuth()
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])
  const seed = user?.id ?? ''

  const tarot = useMemo(() => dailyTarotCard(todayIso, seed), [todayIso, seed])
  const hexagram = useMemo(() => dailyHexagram(todayIso, seed), [todayIso, seed])
  const rune = useMemo(() => dailyRune(todayIso, seed), [todayIso, seed])

  const [showDeck, setShowDeck] = useState(false)
  const [showHexagrams, setShowHexagrams] = useState(false)
  const [showRunes, setShowRunes] = useState(false)

  const dateLine = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oracles"
        subtitle="A card, a hexagram, and a rune for the day — held all day, different tomorrow"
      />

      <PageSection index={0} accent={ACCENTS.tarot} eyebrow="Tarot">
        <DrawHero
          eyebrow={`Today’s card · ${dateLine}`}
          title={tarot.card.name}
          subtitle={tarot.reversed ? 'reversed' : 'upright'}
          body={tarot.reversed ? tarot.card.reversed : tarot.card.upright}
        />
        <ToggleAll
          open={showDeck}
          onToggle={() => setShowDeck((s) => !s)}
          label="the full deck"
        />
        {showDeck && (
          <div className="mt-4 space-y-5">
            <div className="surface-card p-5">
              <div className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                Major Arcana — the archetypes
              </div>
              {TAROT_DECK.filter((c) => c.arcana === 'major').map((c, i, all) => (
                <DataRow
                  key={c.id}
                  label={`${c.number} · ${c.name}`}
                  value=""
                  detail={`${c.upright} · Reversed: ${c.reversed}`}
                  last={i === all.length - 1}
                />
              ))}
            </div>
            {(Object.keys(SUIT_LABELS) as TarotSuit[]).map((suit) => (
              <div key={suit} className="surface-card p-5">
                <div className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                  {SUIT_LABELS[suit]}
                </div>
                {TAROT_DECK.filter((c) => c.suit === suit).map((c, i, all) => (
                  <DataRow
                    key={c.id}
                    label={c.name}
                    value=""
                    detail={`${c.upright} · Reversed: ${c.reversed}`}
                    last={i === all.length - 1}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection index={1} accent={ACCENTS.iching} eyebrow="I Ching">
        <DrawHero
          eyebrow={`Today’s hexagram · ${dateLine}`}
          title={`${hexagram.number} · ${hexagram.english}`}
          subtitle={`${hexagram.pinyin} — ${hexagram.trigrams[1]} over ${hexagram.trigrams[0]}`}
          body={hexagram.judgment}
        />
        <ToggleAll
          open={showHexagrams}
          onToggle={() => setShowHexagrams((s) => !s)}
          label="all 64 hexagrams"
        />
        {showHexagrams && (
          <div className="mt-4 space-y-5">
            <div className="surface-card p-5">
              <div className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                The eight trigrams
              </div>
              {TRIGRAMS.map((t, i) => (
                <DataRow
                  key={t.pinyin}
                  label={`${t.name} (${t.pinyin})`}
                  value={t.lines.map((l) => (l === 1 ? '⚊' : '⚋')).join(' ')}
                  detail={t.attribute}
                  last={i === TRIGRAMS.length - 1}
                />
              ))}
            </div>
            <div className="surface-card p-5">
              {HEXAGRAMS.map((h, i) => (
                <DataRow
                  key={h.number}
                  label={`${h.number} · ${h.english} (${h.pinyin})`}
                  value={`${h.trigrams[1]} / ${h.trigrams[0]}`}
                  detail={h.judgment}
                  last={i === HEXAGRAMS.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </PageSection>

      <PageSection index={2} accent={ACCENTS.runes} eyebrow="Runes">
        <DrawHero
          eyebrow={`Today’s rune · ${dateLine}`}
          title={`${rune.glyph} ${rune.name}`}
          subtitle={`${rune.literal} · aett ${rune.aett}`}
          body={rune.meaning}
        />
        <ToggleAll
          open={showRunes}
          onToggle={() => setShowRunes((s) => !s)}
          label="the Elder Futhark"
        />
        {showRunes && (
          <div className="mt-4 space-y-5">
            {([1, 2, 3] as const).map((aett) => (
              <div key={aett} className="surface-card p-5">
                <div className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                  {aett === 1 ? "Freyr's aett" : aett === 2 ? "Hagal's aett" : "Tyr's aett"}
                </div>
                {ELDER_FUTHARK.filter((r) => r.aett === aett).map((r, i, all) => (
                  <DataRow
                    key={r.id}
                    label={`${r.glyph} ${r.name}`}
                    value={r.transliteration}
                    detail={`${r.literal} — ${r.meaning}`}
                    last={i === all.length - 1}
                  />
                ))}
              </div>
            ))}
            <p className="text-xs text-white/35">
              The three rows (aettir) of eight are the futhark&rsquo;s own
              ordering, older than any alphabetical arrangement.
            </p>
          </div>
        )}
      </PageSection>

      <p className={cn('text-xs text-white/35')}>
        Draws are seeded by the date and your account — the same reading all
        day, on every device, and a different one tomorrow.{' '}
        <Pill accent={ACCENTS.tarot}>deterministic</Pill>
      </p>
    </div>
  )
}
