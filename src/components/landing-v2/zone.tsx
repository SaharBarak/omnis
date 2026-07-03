'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { SystemFlavor } from '@/lib/design/system-flavors'
import { MURAL_GROUND } from '@/lib/design/system-flavors'
import { COLORS, TYPE } from '@/lib/design/landing-tokens'

// ============================================
// ZONE — the shared Railway-grammar section:
// mural band → pill → serif H2 → prose → embed → triad → lineage row
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

interface ZoneProps {
  readonly id: string
  readonly flavor?: SystemFlavor
  /** Pill badge label, e.g. `Start with one birthday`. */
  readonly pill: string
  /** Serif display headline. */
  readonly heading: string
  readonly body: ReactNode
  readonly cta?: { readonly label: string; readonly href: string }
  /** The embedded product UI. */
  readonly children?: ReactNode
  readonly triad?: readonly { readonly title: string; readonly text: string }[]
  /** Show the mural band behind this zone. */
  readonly mural?: boolean
  /** Compact variant (half-height, no triad) — spec §4 You + One. */
  readonly compact?: boolean
  readonly accentOverride?: string
  /**
   * Asymmetric play (taste: Railway control surfaces): which way the
   * mural detail and the embedded product surface lean. Alternate per
   * zone so the descent zig-zags instead of stacking symmetrically.
   */
  readonly lean?: 'left' | 'right'
}

export function Zone({
  id,
  flavor,
  pill,
  heading,
  body,
  cta,
  children,
  triad,
  mural = true,
  compact = false,
  accentOverride,
  lean = 'left',
}: ZoneProps) {
  const accent = accentOverride ?? flavor?.accent ?? COLORS.brand
  const leansRight = lean === 'right'

  return (
    <section
      id={id}
      className={`relative overflow-hidden ${compact ? 'py-20 md:py-28' : 'py-28 md:py-40'}`}
      style={{ backgroundColor: MURAL_GROUND }}
    >
      {/* Mural band — fades into shared ground at both edges */}
      {mural && flavor && (
        <div aria-hidden className="absolute inset-0">
          <Image
            src={flavor.muralSrc}
            alt=""
            fill
            sizes="100vw"
            className={`object-cover opacity-45 ${leansRight ? 'object-[70%_center]' : 'object-[30%_center]'}`}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${MURAL_GROUND} 0%, transparent 22%, transparent 78%, ${MURAL_GROUND} 100%)`,
            }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-content px-6">
        {/* Pill */}
        <motion.span
          className="inline-block rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.18em]"
          style={{ borderColor: `${accent}55`, color: accent, backgroundColor: `${accent}14` }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          {pill}
        </motion.span>

        {/* Serif headline */}
        <motion.h2
          className={`${TYPE.zone} mt-6 max-w-3xl`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.08, ease: easeOut }}
        >
          {heading}
        </motion.h2>

        {/* Prose */}
        <motion.div
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.16, ease: easeOut }}
        >
          {body}
          {cta && (
            <Link
              href={cta.href}
              className="mt-5 flex w-fit items-center gap-2 font-medium transition-opacity hover:opacity-80"
              style={{ color: accent }}
            >
              {cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </motion.div>

        {/* Embedded product UI */}
        {children && (
          <motion.div
            className={`mt-14 ${leansRight ? 'md:-mr-8 md:ml-16 lg:-mr-14' : 'md:-ml-8 md:mr-16 lg:-ml-14'}`}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
          >
            {children}
          </motion.div>
        )}

        {/* Triad — divide-y rows, not card columns (taste-audit A2) */}
        {triad && !compact && (
          <div className="mt-14 max-w-2xl divide-y divide-white/10 border-t border-white/10">
            {triad.map((item, i) => (
              <motion.div
                key={item.title}
                className="flex flex-col gap-1.5 py-5 md:flex-row md:items-baseline md:gap-8"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: easeOut }}
              >
                <h3 className="w-56 shrink-0 text-sm font-semibold uppercase tracking-wide text-white/90">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/50">{item.text}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lineage row */}
        {flavor && !compact && (
          <motion.div
            className="mt-12 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-white/10 pt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-xs tracking-wide text-white/40">{flavor.lineage}</p>
            <Link
              href={flavor.learnHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: accent }}
            >
              {flavor.learnLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
