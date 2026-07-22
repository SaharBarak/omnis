'use client'

/**
 * Relationship-type accents — the ONE tokened map for relationship-type
 * color anywhere in the authed app (graph edges, filter pills, type
 * badges). Replaces the raw palette hex that used to live on
 * RELATIONSHIP_TYPE_LABELS call sites (#EF4444, #EC4899, …), which the
 * design contract bans.
 *
 * The map draws from the folklore flavor tokens
 * (src/lib/design/system-flavors.ts) so relationship chrome speaks the
 * same language as the five reading systems:
 *
 *  - family       → astrology gold    (lineage — the oldest sky record)
 *  - romantic     → dreamspell violet (every kin has its occult ally)
 *  - friend       → human-design teal (channels between two people)
 *  - professional → tzolkin jade      (the working count of days)
 *  - other        → null — neutral chrome (accent-less Pill; faint edges)
 */

import { cn } from '@/lib/utils'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'
import type { RelationshipType } from '@/lib/types/relationship'

export const RELATIONSHIP_ACCENTS: Readonly<
  Record<RelationshipType, string | null>
> = Object.freeze({
  family: SYSTEM_FLAVORS.astrology.accent,
  romantic: SYSTEM_FLAVORS.dreamspell.accent,
  friend: SYSTEM_FLAVORS.humanDesign.accent,
  professional: SYSTEM_FLAVORS.tzolkin.accent,
  other: null,
})

/** Faint text step (white/35) — neutral "other" edges on the dark ground. */
const NEUTRAL_EDGE = 'rgba(255, 255, 255, 0.35)'

/** Canvas/SVG edge color for a relationship type (never raw palette). */
export function relationshipEdgeColor(type: RelationshipType): string {
  return RELATIONSHIP_ACCENTS[type] ?? NEUTRAL_EDGE
}

/**
 * Toggleable filter/selector pill in the kit Pill grammar: mono
 * micro-caps, accent-alpha fill when active (border `55`, bg `14`),
 * quiet accent-tinted text when idle. Neutral (accent-less) pills get
 * quiet white chrome instead.
 */
export function TypeFilterPill({
  active,
  accent,
  onClick,
  children,
  className,
}: {
  active: boolean
  /** Flavor accent hex; null/undefined renders neutral chrome. */
  accent?: string | null
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em]',
        'transition-colors active:scale-[0.98]',
        active && !accent && 'border-white/35 bg-white/[0.08] text-white/90',
        !active && 'border-white/15 text-white/50 hover:border-white/25 hover:text-white/70',
        className
      )}
      style={
        accent
          ? active
            ? {
                color: accent,
                borderColor: `${accent}55`,
                backgroundColor: `${accent}14`,
              }
            : // 65% alpha — the type keeps its hue while idle, quietly.
              { color: `${accent}A6` }
          : undefined
      }
    >
      {children}
    </button>
  )
}
