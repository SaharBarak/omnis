'use client'

/**
 * App primitives — the web port of packages/mobile/src/components/ui/
 * primitives.tsx, speaking the landing-v2 language (landing-tokens.ts):
 * mono eyebrows, flavor-accented pills, hairline dividers, tabular-mono
 * numerals in brand-bright. Chrome stays violet; per-system folklore
 * accents come from src/lib/design/system-flavors.ts.
 */

import { cn } from '@/lib/utils'
import {
  INTEGRATION_FLAVOR,
  SYSTEM_FLAVORS,
  type SystemKey,
} from '@/lib/design/system-flavors'

/** Flavor lookup covering the six authed-app reading surfaces. */
export type AppFlavorKey = SystemKey | 'integration' | 'neutral'

export interface AppFlavor {
  readonly name: string
  readonly accent: string
  readonly accentSoft: string
}

/** Non-system surfaces (members lists, misc tabs) — cool gray chrome
    matching the muted-foreground ramp, so nothing reads as a flavor. */
const NEUTRAL_FLAVOR: AppFlavor = Object.freeze({
  name: 'Neutral',
  accent: '#8F94AC',
  accentSoft: '#C7CBDA',
})

export function getFlavor(key: AppFlavorKey): AppFlavor {
  if (key === 'integration') return INTEGRATION_FLAVOR
  if (key === 'neutral') return NEUTRAL_FLAVOR
  return SYSTEM_FLAVORS[key]
}

/** Micro-caps label — every pill, chip, stat label, column title. */
export function Eyebrow({
  children,
  className,
  accent,
}: {
  children: React.ReactNode
  className?: string
  /** Optional flavor accent color; defaults to muted. */
  accent?: string
}) {
  return (
    <span
      className={cn(
        'font-sans text-[11px] font-medium uppercase tracking-[0.2em]',
        !accent && 'text-muted-foreground',
        className
      )}
      style={accent ? { color: accent } : undefined}
    >
      {children}
    </span>
  )
}

/** Flavor-accented pill badge (landing zone.tsx grammar). */
export function Pill({
  children,
  accent,
  size = 'md',
  className,
}: {
  children: React.ReactNode
  /** Flavor accent hex; omit for quiet neutral chrome. */
  accent?: string
  /** `sm` for inline tags/chips, `md` for section pills. */
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border',
        size === 'md' ? 'px-4 py-1.5 text-[11px]' : 'px-2.5 py-0.5 text-[10px]',
        'font-sans font-medium uppercase tracking-[0.2em]',
        !accent && 'border-white/15 text-white/70',
        className
      )}
      style={
        accent
          ? {
              color: accent,
              borderColor: `${accent}55`,
              backgroundColor: `${accent}14`,
            }
          : undefined
      }
    >
      {children}
    </span>
  )
}

/** Hairline divider — refraction line, optionally flavor-tinted. */
export function Hairline({
  accent,
  className,
}: {
  accent?: string
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn('h-px w-full', !accent && 'bg-white/[0.07]', className)}
      style={
        accent
          ? {
              background: `linear-gradient(90deg, ${accent}59, ${accent}14 60%, transparent)`,
            }
          : undefined
      }
    />
  )
}

/** Big display numeral + micro-caps label (mobile StatNumber port). */
export function StatNumber({
  value,
  label,
  className,
}: {
  value: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="font-display text-3xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
        {value}
      </span>
      <Eyebrow>{label}</Eyebrow>
    </div>
  )
}
