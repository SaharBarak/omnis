'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_OUT, Eyebrow } from '@/components/app-kit'

interface WelcomeCardProps {
  className?: string
}

/**
 * First-run welcome — kit grammar: brand-soft eyebrow, font-display
 * title, contract primary CTA (rounded-xl bg-brand), quiet hairline
 * secondary. Fades up once on mount.
 */
export function WelcomeCard({ className }: WelcomeCardProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT as [number, number, number, number] }}
      className={cn(
        'surface-card border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent p-6',
        className
      )}
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-brand-soft" strokeWidth={1.5} />
            <Eyebrow className="text-brand-soft">Welcome to Pleiad</Eyebrow>
          </div>
          <h2 className="mb-1 font-display text-xl font-semibold tracking-tight text-white/90">
            Begin your symbolic journey
          </h2>
          <p className="max-w-md text-sm text-white/70">
            Start by adding yourself and the people in your life to discover unique Galactic Signatures and explore the connections between you.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/app/people"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-soft active:scale-[0.98]"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Add First Person
          </Link>
          <Link
            href="/app/profile"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white/90 active:scale-[0.98]"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
