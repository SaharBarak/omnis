'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Users } from 'lucide-react'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, INTEGRATION_FLAVOR } from '@/lib/design/system-flavors'
import { TYPE } from '@/lib/design/landing-tokens'
import type { DemoCircle, ReadingTabData } from '@/lib/data/homepage-demo'

// ============================================
// ZONE EMBEDS — the "real product UI" moments inside each zone.
// Marketing-weight demo versions of app components. Every reading, score, and
// person below is computed by the engine and passed in — see homepage-demo.ts.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

// --------------------------------------------
// §3 YOU — five readings auto-cycling
// --------------------------------------------


export function ReadingCycler({ tabs }: { readonly tabs: readonly ReadingTabData[] }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % tabs.length), 4000)
    return () => clearInterval(t)
  }, [tabs.length])

  const tab = tabs[active]
  const flavor = SYSTEM_FLAVORS[tab.key]

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
      {/* Tab strip with progress hairline. Scrolls on phone widths — five
          tracked mono labels are wider than a 390px viewport and were the
          page's horizontal-overflow source. */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-3">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(i)}
            className={`${TYPE.eyebrow} relative shrink-0 px-2 pb-2 transition-colors md:flex-1 md:px-0`}
            style={{ color: i === active ? SYSTEM_FLAVORS[t.key].accent : '#ffffff55' }}
          >
            {SYSTEM_FLAVORS[t.key].name}
            {i === active && (
              <motion.span
                key={`bar-${active}`}
                className="absolute bottom-0 left-0 h-px"
                style={{ backgroundColor: SYSTEM_FLAVORS[t.key].accent }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab.key}
          className="flex items-center gap-6 pt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: easeOut }}
        >
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: `${flavor.accent}44`, backgroundColor: `${flavor.accent}10` }}
          >
            <Image src={tab.icon} alt={tab.title} width={52} height={52} className="h-[52px] w-[52px] object-contain opacity-90 invert" />
          </div>
          <div className="text-left">
            <p className={`${TYPE.eyebrow} text-white/50`}>{tab.title}</p>
            <p className="mt-1 font-display text-2xl font-medium text-white">{tab.value}</p>
            <p className="mt-1 text-sm text-white/50">{tab.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 border-t border-white/10 pt-4 text-right">
        <Link
          href="/calculate"
          className="text-xs text-white/50 transition-colors hover:text-white/80"
        >
          Save it to your map →
        </Link>
      </div>
    </div>
  )
}

// --------------------------------------------
// §8 CIRCLES — three groups, same person, different role
// --------------------------------------------

export function CirclesDemo({ circles }: { readonly circles: readonly DemoCircle[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
      {circles.map((circle, i) => (
        <motion.div
          key={circle.name}
          className={`rounded-2xl border border-white/10 bg-surface p-6 ${i === 0 ? 'md:p-8' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: i * 0.12, ease: easeOut }}
        >
          <div className="flex items-center justify-between">
            <span
              className={TYPE.eyebrow}
              style={{ color: circle.accent }}
            >
              {circle.name}
            </span>
            <Users className="h-4 w-4 text-white/35" />
          </div>
          <div className="mt-4 flex -space-x-2">
            {circle.members.map((m) => (
              <span
                key={m.id}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface text-xs font-medium text-white ${
                  m.id === 'maya' ? '' : 'bg-white/15'
                }`}
                style={m.id === 'maya' ? { backgroundColor: circle.accent } : undefined}
                title={m.name}
              >
                {m.name[0]}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{circle.insight}</p>
        </motion.div>
      ))}
    </div>
  )
}

// --------------------------------------------
// §10 KNOWLEDGE — self-typing search + five portals
// --------------------------------------------

const KNOWLEDGE_QUERIES = ['Gate 34', 'Kin 60', 'Venus synastry', 'Tone 7', 'Gematria 26']

interface SearchHit {
  readonly title: string
  readonly snippet: string
  readonly sourceUrl: string
}

type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'done'; readonly hits: readonly SearchHit[] }
  | { readonly status: 'error' }

export function KnowledgeSearch({
  includeIntegration = false,
}: {
  /**
   * The /learn hub advertises six guides, so it shows the Integration chip
   * too; the homepage zone keeps the five mural systems.
   */
  readonly includeIntegration?: boolean
}) {
  const chips = [
    ...FLAVOR_DESCENT.map((key) => SYSTEM_FLAVORS[key]),
    ...(includeIntegration ? [INTEGRATION_FLAVOR] : []),
  ]
  const [queryIndex, setQueryIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })

  // Demo placeholder self-types while the input is untouched.
  useEffect(() => {
    if (focused || value) return
    const query = KNOWLEDGE_QUERIES[queryIndex]
    let i = 0
    const typeTimer = setInterval(() => {
      i += 1
      setTyped(query.slice(0, i))
      if (i >= query.length) {
        clearInterval(typeTimer)
        setTimeout(() => setQueryIndex((q) => (q + 1) % KNOWLEDGE_QUERIES.length), 1800)
      }
    }, 110)
    return () => clearInterval(typeTimer)
  }, [queryIndex, focused, value])

  const runSearch = async () => {
    const query = value.trim()
    if (query.length < 2) return
    setSearch({ status: 'loading' })
    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 3 }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { results: SearchHit[] }
      setSearch({ status: 'done', hits: data.results })
    } catch {
      setSearch({ status: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form
        className="flex items-center gap-3 rounded-xl border border-white/15 bg-surface-2 px-6 py-4 transition-colors focus-within:border-brand/50"
        onSubmit={(e) => {
          e.preventDefault()
          void runSearch()
        }}
      >
        <Search className="h-5 w-5 shrink-0 text-brand" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused || value ? 'Search the knowledge base' : typed}
          aria-label="Search the knowledge base"
          className="w-full bg-transparent font-mono text-base text-white/90 outline-none placeholder:text-white/50"
        />
      </form>

      {/* Result states */}
      {search.status === 'loading' && (
        <div className="mt-4 space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-shimmer rounded-lg bg-white/5" />
          ))}
        </div>
      )}
      {search.status === 'error' && (
        <p className="mt-4 text-center text-sm text-white/50">
          Search is unavailable right now. The guides below are always open.
        </p>
      )}
      {search.status === 'done' && search.hits.length === 0 && (
        <p className="mt-4 text-center text-sm text-white/50">
          Nothing close enough yet. Try a gate, kin, sign, tone, or number.
        </p>
      )}
      {search.status === 'done' && search.hits.length > 0 && (
        <div className="mt-4 space-y-2">
          {search.hits.map((hit) => (
            <a
              key={hit.sourceUrl + hit.snippet.slice(0, 24)}
              href={hit.sourceUrl}
              className="block rounded-lg border border-white/10 bg-surface px-4 py-3 transition-colors hover:border-brand/40"
            >
              <p className="text-sm font-medium text-white/90">{hit.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
                {hit.snippet}
              </p>
            </a>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {chips.map((flavor) => (
          <a
            key={flavor.key}
            href={flavor.learnHref}
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ borderColor: `${flavor.accent}44`, color: flavor.accent }}
          >
            {flavor.name}
          </a>
        ))}
      </div>
    </div>
  )
}
