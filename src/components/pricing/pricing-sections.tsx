'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FREE_PLAN,
  PRICING_PLANS,
  LEDGER_COLUMNS,
  LEDGER_ROWS,
  type PaidPlan,
} from './plan-data'
import { Button } from '@/components/ui/button'
import { TYPE } from '@/lib/design/landing-tokens'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/store-links'

// ============================================
// Pricing page body — free tier leads, paid tiers follow with clear
// hierarchy (featured Complete column), then the entitlement ledger.
// Paid plans are in-app purchases (the App Store / Google Play are the
// merchant of record), so every paid CTA points at the app rather than a
// web checkout. Buying on the phone unlocks the same account on the web.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

// initial: false — the tiers and ledger are the money content; SSR must
// never ship them at opacity 0. Motion here is enhancement only.
const fadeUp = {
  initial: false,
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: easeOut },
} as const

// --------------------------------------------
// Paid CTA — the purchase happens in the app
// --------------------------------------------

function GetInAppButton({
  label,
  featured,
}: {
  readonly label: string
  readonly featured: boolean
}) {
  const href = APP_STORE_URL ?? PLAY_STORE_URL

  const className = `w-full rounded-xl active:scale-[0.98] ${
    featured
      ? 'bg-brand text-white hover:bg-brand-soft'
      : 'bg-white/10 text-white hover:bg-white/20'
  }`

  // Store not live yet — never show a dead button. Route intent into the
  // account funnel; the purchase completes in the app once it ships.
  if (!href) {
    return (
      <div>
        <Button asChild className={className}>
          <Link href="/login">{label}</Link>
        </Button>
        <p className="mt-2 text-center text-xs text-white/50">
          Start free on the web: purchases arrive with the app
        </p>
      </div>
    )
  }

  return (
    <Button asChild className={className}>
      <a href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    </Button>
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
            <p className={`${TYPE.eyebrow} text-brand`}>Start here: free</p>
            <h2 className={`${TYPE.card} mt-3`}>
              Your reading costs nothing.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              Enter a birthday and read it: no card, no wall. The free plan
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
            <Link href="/calculate">Start with your birthday</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  )
}

// --------------------------------------------
// Paid tiers — one card anatomy for all four plans (Explorer, Complete,
// Practitioner, Founding Lifetime). Same header / price / feature-list /
// CTA structure everywhere; the recommended plan (Complete) is the only
// card allowed emphasis — brand border, tinted surface, brand CTA.
// --------------------------------------------

function PlanCard({
  plan,
  index,
}: {
  readonly plan: PaidPlan
  readonly index: number
}) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.55, delay: index * 0.08, ease: easeOut }}
      className={`flex flex-col rounded-2xl border p-7 ${
        plan.featured
          ? 'border-brand/40 bg-brand/5'
          : 'border-white/10 bg-surface'
      }`}
    >
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <p
          className={`${TYPE.eyebrow} ${
            plan.featured ? 'text-brand-soft' : 'text-white/50'
          }`}
        >
          {plan.name}
        </p>
        {plan.badge && (
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              plan.featured
                ? 'bg-brand/15 text-brand-soft'
                : 'bg-white/10 text-white/50'
            }`}
          >
            {plan.badge}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-4xl font-semibold text-white">
        {plan.price}
        <span className="text-base font-normal text-white/50">
          {plan.priceNote.startsWith('/') ? plan.priceNote : ` ${plan.priceNote}`}
        </span>
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
        <GetInAppButton label={plan.cta} featured={plan.featured} />
      </div>
    </motion.div>
  )
}

export function PaidTiers() {
  return (
    <section className="mx-auto mt-20 max-w-5xl px-6 sm:mt-24">
      <motion.h2 {...fadeUp} className={`${TYPE.section} text-center`}>
        Upgrade when the map becomes something you return to.
      </motion.h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PRICING_PLANS.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} index={i} />
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-white/35">
        Plans are purchased in the Pleiad app and billed by the App Store or
        Google Play. Founding Lifetime is a single one-time payment. Cancel any
        time from your device&apos;s subscription settings; your plan runs to the
        end of the period, and your people stay saved.
      </p>
    </section>
  )
}

// --------------------------------------------
// Ledger — every entitlement, one row each. On small screens the table
// scrolls horizontally behind a fade edge + swipe hint (same overflow
// treatment as the learn doc tables).
// --------------------------------------------

export function PlanLedger() {
  return (
    <section className="mx-auto mt-20 max-w-4xl px-6 sm:mt-24">
      <motion.h2 {...fadeUp} className={`${TYPE.section} text-center`}>
        What each plan holds.
      </motion.h2>
      <motion.div {...fadeUp} className="relative mt-12">
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 pr-4 text-left font-normal text-white/35" scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                {LEDGER_COLUMNS.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className={`${TYPE.eyebrow} px-4 py-4 text-left ${
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
                  <LedgerCell value={row.lifetime} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Fade edge — signals more columns off-screen; mobile only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-r from-transparent to-ground md:hidden"
        />
        <p className="mt-3 text-center text-xs text-white/35 md:hidden">
          Swipe to compare all plans
        </p>
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
