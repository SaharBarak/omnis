'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SYSTEM_FLAVORS,
  FLAVOR_DESCENT,
  INTEGRATION_FLAVOR,
  MURAL_GROUND,
} from '@/lib/design/system-flavors'
import { BrandMark } from '@/components/brand-mark'
import { TYPE } from '@/lib/design/landing-tokens'
import { FREE_PLAN, PAID_PLANS } from '@/components/pricing/plan-data'
import { faqs } from '@/lib/data/faqs'

// ============================================
// Supporting sections: pricing, FAQ, footer.
// All live on the same near-black canvas — zero white sections.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

// --------------------------------------------
// Pricing — map capacity first, AI second
// --------------------------------------------

// Derived from the pricing page's canonical plan copy (which mirrors
// billing.ts) — the homepage previously hand-wrote a diverging price list
// and contradicted the FAQ rendered directly below it.
const PLANS = [
  {
    name: FREE_PLAN.name,
    price: FREE_PLAN.price,
    tagline: FREE_PLAN.tagline,
    features: FREE_PLAN.points,
    // CTA canon: acquisition goes to /calculate under one label sitewide.
    cta: 'Start with your birthday',
    href: '/calculate',
    highlight: false,
  },
  ...PAID_PLANS.map((plan) => ({
    name: plan.name,
    price: plan.price,
    tagline: plan.tagline,
    features: plan.points.slice(0, 3),
    // CTA canon: account CTAs share one label. Purchases finish in the app,
    // so the honest next step on the web is the account, not a checkout verb.
    cta: 'Create a free account',
    href: '/login',
    highlight: plan.featured,
  })),
] as const

export function PricingV2() {
  return (
    <section id="pricing" className="py-24 md:py-32" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto max-w-content px-6">
        <motion.h2
          className={`${TYPE.section} text-center`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Free while your map is small.
        </motion.h2>
        <p className="mt-4 text-center text-lg text-white/50">
          Upgrade when the map becomes something you return to.
        </p>
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`rounded-2xl border p-7 ${
                plan.highlight
                  ? 'border-brand/40 bg-brand/5 shadow-[0_0_40px_rgba(201,162,39,0.13)] md:scale-105'
                  : 'border-white/10 bg-surface'
              }`}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: easeOut }}
            >
              <p className={`${TYPE.eyebrow} text-white/50`}>{plan.name}</p>
              <p className="mt-3 font-display text-4xl font-medium text-white">
                {plan.price}
                <span className="text-base text-white/50">/mo</span>
              </p>
              <p className="mt-1 text-sm text-white/50">{plan.tagline}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-white/70">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand">·</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 w-full rounded-xl ${
                  plan.highlight
                    ? 'bg-brand text-white hover:bg-brand-soft active:scale-[0.98]'
                    : 'bg-white/10 text-white hover:bg-white/20 active:scale-[0.98]'
                }`}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-white/50">
          Also: Explorer at $5/mo and a one-time Founding Lifetime:{' '}
          <Link href="/pricing" className="text-brand-soft underline-offset-4 hover:underline">
            see full pricing
          </Link>
        </p>
      </div>
    </section>
  )
}

// --------------------------------------------
// FAQ — dark accordion, persistence/privacy first
// --------------------------------------------

interface FaqV2Props {
  /** Defaults to the full plan/accuracy/data set rendered on /pricing. */
  readonly items?: readonly { question: string; answer: string }[]
  /** Quiet trailing link for pages that render a trimmed set. */
  readonly more?: { readonly label: string; readonly href: string }
}

export function FaqV2({ items = faqs, more }: FaqV2Props) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 md:py-32" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto max-w-2xl px-6">
        <motion.h2
          className={`${TYPE.section} text-center`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Before you start mapping.
        </motion.h2>
        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {items.map((faq, i) => (
            <div key={faq.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-medium text-white/90">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-brand transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <motion.p
                  className="pb-5 text-sm leading-relaxed text-white/70"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.25 }}
                >
                  {faq.answer}
                </motion.p>
              )}
            </div>
          ))}
        </div>
        {more && (
          <p className="mt-8 text-center text-sm text-white/50">
            <Link
              href={more.href}
              className="text-brand-soft underline-offset-4 hover:underline"
            >
              {more.label}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}

// --------------------------------------------
// Footer — live mono line, the calendars are counting
// --------------------------------------------

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Your reading', href: '/calculate' },
      { label: 'Compatibility', href: '/compatibility' },
      { label: 'Today', href: '/today' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Knowledge',
    // One link per /learn guide: the five systems (canonical display names —
    // Tzolkin is the guide that exists; Long Count has no page) + Integration.
    links: [
      ...FLAVOR_DESCENT.map((key) => ({
        label: SYSTEM_FLAVORS[key].name,
        href: SYSTEM_FLAVORS[key].learnHref,
      })),
      {
        label: INTEGRATION_FLAVOR.name,
        href: INTEGRATION_FLAVOR.learnHref,
      },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Refunds', href: '/refund' },
    ],
  },
] as const

export function FooterV2({ liveLine }: { readonly liveLine: string }) {
  return (
    <footer className="border-t border-white/10 py-16" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto max-w-content px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className={`flex items-center gap-2.5 ${TYPE.card}`}>
              <BrandMark size={24} />
              Pleiad
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              The living map of your people, read through six wisdom systems.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className={`${TYPE.eyebrow} text-white/50`}>{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 border-t border-white/10 pt-6 text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-brand/80">{liveLine}</p>
          <p className="mt-3 text-xs text-white/35">
            © {new Date().getFullYear()} Pleiad. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
