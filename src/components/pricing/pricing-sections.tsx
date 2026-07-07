'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TYPE } from '@/lib/design/landing-tokens'
import {
  FREE_PLAN,
  EXPLORER_PLAN,
  LIFETIME_PLAN,
  PAID_PLANS,
  LEDGER_COLUMNS,
  LEDGER_ROWS,
  type PaidPlanId,
} from './plan-data'

// ============================================
// Pricing page body — free tier leads, paid tiers follow with clear
// hierarchy (featured Complete column), then the entitlement ledger.
// Checkout reuses the existing Paddle flow: POST /api/billing/checkout
// returns a hosted checkout URL; unauthenticated visitors go to login
// and come back here.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: easeOut },
} as const

// --------------------------------------------
// Checkout — reuse the hosted Paddle transaction flow
// --------------------------------------------

function CheckoutButton({
  plan,
  label,
  featured,
}: {
  readonly plan: PaidPlanId
  readonly label: string
  readonly featured: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (response.status === 401) {
        // Not signed in yet — come back to pricing after login.
        window.location.href = `/login?redirectTo=${encodeURIComponent('/pricing')}`
        return
      }

      const data = (await response.json()) as { url?: string; error?: string }
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={`w-full rounded-xl active:scale-[0.98] ${
          featured
            ? 'bg-brand text-white hover:bg-brand-soft'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {loading ? 'Opening checkout…' : label}
      </Button>
      {error && <p className="mt-2 text-center text-xs text-white/50">{error}</p>}
    </div>
  )
}

// --------------------------------------------
// Free lead — the reading comes before the wall
// --------------------------------------------

export function FreeLead() {
  return (
    <motion.section {...fadeUp} className="mx-auto mt-16 max-w-4xl px-6">
      <div className="rounded-2xl border border-white/10 bg-surface p-8 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className={`${TYPE.eyebrow} text-brand`}>Start here — free</p>
            <h2 className={`${TYPE.card} mt-3`}>
              Your reading costs nothing.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
              Enter a birthday and read it — no card, no wall. The free plan
              holds up to 3 people with Dreamspell readings and the daily kin,
              for as long as you like.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
              {FREE_PLAN.points.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <span className="text-brand">·</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
          >
            <Link href="/calculate">Get your free reading</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  )
}

// --------------------------------------------
// Explorer — slim entry row: the whole map, small scale, no AI.
// Deliberately quieter than the Complete/Practitioner cards below it.
// --------------------------------------------

function ExplorerRow() {
  return (
    <motion.div
      {...fadeUp}
      className="rounded-2xl border border-white/10 bg-surface p-6 sm:p-7"
    >
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
        <div className="flex items-baseline gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            {EXPLORER_PLAN.name}
          </p>
          <p className="font-display text-3xl font-semibold text-white">
            {EXPLORER_PLAN.price}
            <span className="text-sm font-normal text-white/50">/mo</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-white/70">{EXPLORER_PLAN.tagline}</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-white/50">
            {EXPLORER_PLAN.points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="text-brand">·</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full md:w-52">
          <CheckoutButton
            plan={EXPLORER_PLAN.id}
            label={EXPLORER_PLAN.cta}
            featured={false}
          />
        </div>
      </div>
    </motion.div>
  )
}

// --------------------------------------------
// Founding Lifetime — slim launch band under the paid tiers grid.
// One-time purchase, Complete entitlements forever. Quieter than the
// cards above it, but carried by the brand violet.
// --------------------------------------------

function LifetimeBand() {
  return (
    <motion.div
      {...fadeUp}
      className="rounded-2xl border border-brand/30 bg-brand/[0.07] p-6 sm:p-7"
    >
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
        <div className="flex items-baseline gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-soft">
            {LIFETIME_PLAN.name}
          </p>
          <p className="font-display text-3xl font-semibold text-white">
            {LIFETIME_PLAN.price}
            <span className="text-sm font-normal text-white/50">
              {' '}
              {LIFETIME_PLAN.priceNote}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-white/70">{LIFETIME_PLAN.tagline}</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-white/50">
            {LIFETIME_PLAN.points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="text-brand">·</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full md:w-52">
          <CheckoutButton
            plan={LIFETIME_PLAN.id}
            label={LIFETIME_PLAN.cta}
            featured
          />
        </div>
      </div>
    </motion.div>
  )
}

// --------------------------------------------
// Paid tiers — Explorer entry row, then the featured Complete column
// with Practitioner beside it
// --------------------------------------------

export function PaidTiers() {
  return (
    <section className="mx-auto mt-20 max-w-4xl px-6 sm:mt-24">
      <motion.h2 {...fadeUp} className={`${TYPE.section} text-center`}>
        Upgrade when the map becomes something you return to.
      </motion.h2>
      <div className="mt-12">
        <ExplorerRow />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-5">
        {PAID_PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            {...fadeUp}
            transition={{ duration: 0.55, delay: i * 0.1, ease: easeOut }}
            className={`flex flex-col rounded-2xl border p-8 ${
              plan.featured
                ? 'border-brand/40 bg-brand/5 md:col-span-3'
                : 'border-white/10 bg-surface md:col-span-2'
            }`}
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                {plan.name}
              </p>
              {plan.featured && (
                <span className="rounded-full bg-brand/15 px-3 py-1 text-[11px] font-medium text-brand-soft">
                  Most people land here
                </span>
              )}
            </div>
            <p className="mt-4 font-display text-4xl font-semibold text-white">
              {plan.price}
              <span className="text-base font-normal text-white/50">/mo</span>
            </p>
            <p className="mt-1 text-sm text-white/50">{plan.tagline}</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-white/70">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-brand">·</span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CheckoutButton
                plan={plan.id}
                label={plan.cta}
                featured={plan.featured}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6">
        <LifetimeBand />
      </div>
      <p className="mt-6 text-center text-sm text-white/35">
        Billed monthly through Paddle — Founding Lifetime is a single one-time
        payment. Cancel any time — your plan runs to the end of the period, and
        your people stay saved.
      </p>
    </section>
  )
}

// --------------------------------------------
// Ledger — every entitlement, one row each
// --------------------------------------------

export function PlanLedger() {
  return (
    <section className="mx-auto mt-20 max-w-4xl px-6 sm:mt-24">
      <motion.h2 {...fadeUp} className={`${TYPE.section} text-center`}>
        What each plan holds.
      </motion.h2>
      <motion.div {...fadeUp} className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-4 pr-4 text-left font-normal text-white/35" scope="col">
                <span className="sr-only">Feature</span>
              </th>
              {LEDGER_COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-4 py-4 text-left text-xs uppercase tracking-[0.2em] ${
                    column === 'Complete' ? 'text-brand-soft' : 'text-white/50'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {LEDGER_ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="py-3.5 pr-4 text-left font-normal text-white/70">
                  {row.label}
                </th>
                <LedgerCell value={row.free} />
                <LedgerCell value={row.explorer} />
                <LedgerCell value={row.complete} featured />
                <LedgerCell value={row.practitioner} />
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  )
}

function LedgerCell({
  value,
  featured = false,
}: {
  readonly value: string
  readonly featured?: boolean
}) {
  const empty = value === '—'
  return (
    <td
      className={`px-4 py-3.5 ${
        empty ? 'text-white/35' : featured ? 'text-white/90' : 'text-white/70'
      }`}
    >
      {value}
    </td>
  )
}
