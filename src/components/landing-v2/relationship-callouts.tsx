'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SYSTEM_FLAVORS, MURAL_GROUND } from '@/lib/design/system-flavors'
import { COLORS, TYPE } from '@/lib/design/landing-tokens'
import type { DemoPerson, DemoTie } from '@/lib/data/homepage-demo'

// ============================================================================
// NAMED RELATIONSHIPS — the payoff section.
//
// The map has semantics. Every card here is a tie the engine actually found
// between two of the demo people, named in the system's own vocabulary.
// ============================================================================

export interface Callout {
  readonly tie: DemoTie
  readonly from: DemoPerson
  readonly to: DemoPerson
  /** The headline sentence, built from the real tie. */
  readonly headline: string
}

const HARMONY_LABEL: Record<DemoTie['harmony'], string> = {
  supportive: 'Supportive',
  challenging: 'Challenging',
  transformative: 'Transformative',
  neutral: 'Contextual',
}

export function RelationshipCallouts({ callouts }: { readonly callouts: readonly Callout[] }) {
  return (
    <section id="connections" className="relative py-24 md:py-32" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto w-full max-w-content px-6">
        <span
          className={`${TYPE.eyebrow} inline-block rounded-full border px-4 py-1.5`}
          style={{ borderColor: `${COLORS.brand}55`, color: COLORS.brand, backgroundColor: `${COLORS.brand}14` }}
        >
          Pair comparisons
        </span>

        <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
          <h2 className={TYPE.section}>See how two profiles compare.</h2>
          <p className="text-lg leading-relaxed text-white/70">
            Move beyond one blended score. See per-system compatibility and a
            plain-language summary, with Dreamspell connections and Human
            Design composite patterns when the required data is available.
          </p>
        </div>

        {/* Three lead ties, full stop — after three cards the point is made. */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {callouts.slice(0, 3).map((c, i) => (
            <CalloutCard key={`${c.from.id}-${c.to.id}-${c.tie.type}`} callout={c} index={i} />
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition active:translate-y-[1px]"
            style={{ backgroundColor: COLORS.brand }}
          >
            Save two people to compare
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CalloutCard({ callout, index }: { readonly callout: Callout; readonly index: number }) {
  const { tie, from, to, headline } = callout
  const flavor = SYSTEM_FLAVORS[tie.system]
  const accent = flavor.accentSoft // legible on near-black

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.08 }}
      className="relative overflow-hidden rounded-2xl border p-6"
      style={{ borderColor: `${accent}33`, backgroundColor: `${accent}0A` }}
    >
      <div className="flex items-center justify-between">
        <span className={TYPE.eyebrow} style={{ color: accent }}>
          {SYSTEM_FLAVORS[tie.system].name}
        </span>
        <span className="font-mono text-[11px] text-white/30">{HARMONY_LABEL[tie.harmony]}</span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <PersonDot name={from.name} accent={accent} />
        <span className="h-px flex-1" style={{ backgroundColor: `${accent}66` }} />
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[11px] capitalize"
          style={{ borderColor: `${accent}55`, color: accent, backgroundColor: MURAL_GROUND }}
        >
          {tie.type.replace(/-/g, ' ')}
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: `${accent}66` }} />
        <PersonDot name={to.name} accent={accent} />
      </div>

      <p className="mt-5 font-display text-lg font-medium leading-snug text-white">{headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{tie.meaning}</p>

      {tie.channel && (
        <p className="mt-4 font-mono text-xs text-white/35">channel {tie.channel}</p>
      )}
    </motion.article>
  )
}

function PersonDot({ name, accent }: { readonly name: string; readonly accent: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] text-white"
        style={{ backgroundColor: `${accent}33`, border: `1px solid ${accent}66` }}
      >
        {name.slice(0, 1)}
      </span>
      <span className="text-sm text-white/80">{name}</span>
    </span>
  )
}
