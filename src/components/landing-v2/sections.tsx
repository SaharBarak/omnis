'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, MURAL_GROUND } from '@/lib/design/system-flavors'
import { TYPE } from '@/lib/design/landing-tokens'
import { faqs } from '@/lib/data/faqs'

// ============================================
// Supporting sections: sigil band, social proof, pricing, FAQ.
// All live on the same near-black canvas — zero white sections.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

// --------------------------------------------
// §2 Sigil band — breather between hero and first zone
// --------------------------------------------

const SIGILS = [
  { src: '/images/astrology/signs/01-aries.svg', label: 'Astrology' },
  { src: '/images/dreamspell/seals/20-sun.svg', label: 'Dreamspell' },
  { src: '/icons/tzolkin/signs/01-imix.svg', label: 'Tzolkin' },
  { src: '/images/human-design/bodygraph/bodygraph.svg', label: 'Human Design' },
  { src: '/images/gematria/letters/01-aleph.svg', label: 'Kabbalah' },
] as const

export function SigilBand() {
  return (
    <section className="py-16" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto max-w-content px-6">
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {SIGILS.map((sigil, i) => (
            <motion.div
              key={sigil.label}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: easeOut }}
            >
              <Image
                src={sigil.src}
                alt={sigil.label}
                width={34}
                height={34}
                className="h-[34px] w-[34px] object-contain opacity-50 invert"
              />
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                {sigil.label}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center font-mono text-sm text-white/50">
          Five traditions, thousands of years old. One map.
        </p>
      </div>
    </section>
  )
}

// --------------------------------------------
// §11 Social proof — grid-paper cards
// --------------------------------------------

const TESTIMONIALS = [
  {
    quote:
      'I have 40 people saved. When my sister asked about her new boyfriend, the comparison took ten seconds — his chart was already next to hers.',
    name: 'Noa B.',
    role: 'Reads for family and friends',
  },
  {
    quote:
      'The group view finally explained why our founding team argues the way it does. We put the map on the office wall.',
    name: 'Daniel K.',
    role: 'Startup founder',
  },
  {
    quote:
      'I built my mother’s family map for her 70th birthday and sent the link. Half the family signed up the same week.',
    name: 'Michal R.',
    role: 'Practitioner',
  },
] as const


const MARQUEE_QUOTES = [
  'finally deleted my birthday-notes doc',
  'my chavruta group map made everyone gasp',
  'the family map explained thirty years in one look',
  'sent my co-founder our pair reading. silence, then "oh no, it\u2019s accurate"',
  'six systems agreeing about my sister was not on my bingo card',
  'the layers view is the first time astrology and HD talked to each other',
] as const

function QuoteMarquee() {
  return (
    <div className="relative mt-10 overflow-hidden" aria-hidden>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ground to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ground to-transparent" />
      <motion.div
        className="flex w-max gap-10"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 55, ease: 'linear', repeat: Infinity }}
      >
        {[...MARQUEE_QUOTES, ...MARQUEE_QUOTES].map((q, i) => (
          <span key={i} className="whitespace-nowrap font-mono text-sm text-white/50">
            {'\u201C'}{q}{'\u201D'}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export function SocialProofV2() {
  return (
    <section className="py-24" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto max-w-content px-6">
        <motion.h2
          className={`${TYPE.section} text-center`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          For people who read people carefully.
        </motion.h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              className={`rounded-2xl border border-white/10 p-7 ${i === 1 ? "md:-mt-6" : ""}`}
              style={{
                backgroundImage: 'url(/images/redesign/motifs/grid-paper-tile.webp)',
                backgroundSize: '340px',
                backgroundColor: '#0D101A', // surface token (style prop for blend-mode)
                backgroundBlendMode: 'overlay',
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: easeOut }}
            >
              <blockquote className="text-[15px] leading-relaxed text-white/70">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-medium text-white/90">{t.name}</span>
                <span className="text-white/50"> — {t.role}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
        <QuoteMarquee />
      </div>
    </section>
  )
}

// --------------------------------------------
// §13 Pricing — map capacity first, AI second
// --------------------------------------------

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'You and a few people',
    features: ['Your five-system reading', 'A small people library', 'Daily kin & today board'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Complete',
    price: '$9',
    tagline: 'Your whole map',
    features: [
      'Up to 10 people, kept forever',
      'Full map & group dynamics',
      'AI interpretations, grounded in sources',
    ],
    cta: 'Grow your map',
    highlight: true,
  },
  {
    name: 'Practitioner',
    price: '$29',
    tagline: 'Maps for others',
    features: ['Collaborators on any map', 'Client maps & living links', 'Exports & print cards'],
    cta: 'Go practitioner',
    highlight: false,
  },
] as const

export function PricingV2() {
  return (
    <section id="pricing" className="py-24" style={{ backgroundColor: MURAL_GROUND }}>
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: easeOut }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">{plan.name}</p>
              <p className="mt-3 font-display text-4xl text-white">
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
                <Link href="/login">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --------------------------------------------
// §14 FAQ — dark accordion, persistence/privacy first
// --------------------------------------------

export function FaqV2() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24" style={{ backgroundColor: MURAL_GROUND }}>
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
          {faqs.map((faq, i) => (
            <div key={faq.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-[15px] font-medium text-white/90">{faq.question}</span>
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
      </div>
    </section>
  )
}

// --------------------------------------------
// §16 Footer — live mono line, the calendars are counting
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
    links: FLAVOR_DESCENT.map((key) => ({
      label: SYSTEM_FLAVORS[key].name,
      href: SYSTEM_FLAVORS[key].learnHref,
    })),
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
] as const

export function FooterV2({ liveLine }: { readonly liveLine: string }) {
  return (
    <footer className="border-t border-white/10 py-16" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto max-w-content px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className={TYPE.card}>OmnisX</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              The living map of your people, read through six wisdom systems.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">{col.title}</p>
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
          <p className="font-mono text-[11px] tracking-[0.18em] text-brand/80">{liveLine}</p>
          <p className="mt-3 text-xs text-white/35">
            © {new Date().getFullYear()} OmnisX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
