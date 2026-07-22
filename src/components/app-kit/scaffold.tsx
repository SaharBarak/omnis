'use client'

/**
 * Reading-page scaffold — the web port of packages/mobile/src/components/
 * person/scaffold.tsx. One scaffold, six flavored skins: every domain
 * reading page (Dreamspell / Tzolkin / Astrology / Human Design /
 * Kabbalah / Insights) is built from these pieces so consistency is free.
 *
 * Laws (from the mobile system + TASTE_AUDIT):
 * - Lists group with hairline dividers, never nested boxes.
 * - Four text steps only: white/90 · /70 · /50 · /35.
 * - Numerals are tabular mono. Eyebrows are mono micro-caps.
 * - Missing data renders an honest state + AddDataChip — never zeros
 *   dressed as truth, never fabricated readings.
 * - Everything respects prefers-reduced-motion.
 */

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_OUT, useCountUp, VIEWPORT_ONCE } from './motion'
import { Eyebrow, Hairline, Pill } from './primitives'

/**
 * Bare in-view entrance — PageSection's motion contract without the
 * hairline/eyebrow chrome. For grid cells and standalone blocks.
 */
export function Rise({
  index = 0,
  children,
  className,
}: {
  index?: number
  children: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * A flavored section: tinted hairline, accent eyebrow, staggered
 * fade-up on first view (60ms per section index).
 */
export function PageSection({
  index = 0,
  accent,
  eyebrow,
  action,
  children,
  className,
}: {
  /** Position on the page — drives the stagger delay. */
  index?: number
  /** Flavor accent hex (system-flavors.ts). */
  accent: string
  eyebrow: string
  /** Trailing element on the eyebrow row (e.g. a "View all" link). */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: EASE_OUT,
      }}
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="flex flex-col gap-2">
        <Hairline accent={accent} />
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow accent={accent}>{eyebrow}</Eyebrow>
          {action}
        </div>
      </div>
      {children}
    </motion.section>
  )
}

/**
 * The universal key/value row: mono label left, value right-aligned,
 * hairline bottom border unless `last`.
 */
export function DataRow({
  label,
  value,
  detail,
  last = false,
  className,
}: {
  label: string
  value: React.ReactNode
  /** Secondary line under the value. */
  detail?: string
  last?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-6 py-3',
        !last && 'border-b border-white/[0.07]',
        className
      )}
    >
      <Eyebrow className="shrink-0">{label}</Eyebrow>
      <div className="min-w-0 text-right">
        <div className="text-sm text-white/90">{value}</div>
        {detail && <div className="mt-0.5 text-xs text-white/50">{detail}</div>}
      </div>
    </div>
  )
}

/** Word-sized stat — display face, for Sun/Moon/Rising trios etc. */
export function StatWord({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="truncate font-display text-xl font-medium text-white/90 md:text-2xl">
        {value}
      </span>
      <Eyebrow>{label}</Eyebrow>
    </div>
  )
}

/**
 * Meter: label + hairline track + flavor-accent fill + tabular value.
 * The fill animates via scaleX (transform-only) and the value counts up.
 * Used for element/modality balance and compatibility scores.
 */
export function MeterBar({
  label,
  value,
  max = 100,
  accent,
  displayValue,
  suffix,
  labelClassName = 'w-28',
  valueClassName = 'w-12',
  className,
}: {
  label: string
  value: number
  max?: number
  accent: string
  /** Override the printed value (defaults to the counted number). */
  displayValue?: string
  /** Trailing element after the value (weight tag, percent, unit). */
  suffix?: React.ReactNode
  /** Width class for the label column (default w-28). */
  labelClassName?: string
  /** Width class for the value column (default w-12). */
  valueClassName?: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const [ref, counted] = useCountUp(value)
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={cn('flex items-center gap-4', className)}>
      <Eyebrow className={cn('shrink-0', labelClassName)}>{label}</Eyebrow>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ backgroundColor: accent }}
          initial={reduced ? { scaleX: ratio } : { scaleX: 0 }}
          whileInView={{ scaleX: ratio }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
      </div>
      <span
        className={cn(
          'shrink-0 text-right font-mono text-sm text-brand-bright [font-variant-numeric:tabular-nums]',
          valueClassName
        )}
      >
        {displayValue ?? counted}
      </span>
      {suffix}
    </div>
  )
}

/**
 * The honest-partial-state path: a flavored pill chip that deep-links
 * back to the form field that would complete this reading.
 */
export function AddDataChip({
  href,
  accent,
  children,
  onClick,
}: {
  href?: string
  accent: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const chip = (
    <Pill
      accent={accent}
      className="cursor-pointer transition-transform duration-fast active:scale-[0.98]"
    >
      {children}
    </Pill>
  )
  if (href) return <Link href={href}>{chip}</Link>
  return (
    <button type="button" onClick={onClick} className="w-fit">
      {chip}
    </button>
  )
}

/**
 * Entitlement upsell — NOT a wall. Renders the real page dimmed to 35%
 * behind a centered flavor-accented lock panel. Subscription-loading
 * should be treated as locked upstream so gated content never flashes.
 */
export function LockedPage({
  accent,
  systemName,
  href = '/app/settings/billing',
  cta = 'See plans',
  children,
}: {
  accent: string
  systemName: string
  href?: string
  cta?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none opacity-35">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="surface-card flex max-w-sm flex-col items-center gap-4 p-8 text-center">
          <Pill accent={accent}>{systemName}</Pill>
          <p className="text-sm leading-relaxed text-white/70">
            This reading opens with a paid plan. Your data is already here;
            the lens is waiting.
          </p>
          <Link
            href={href}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
