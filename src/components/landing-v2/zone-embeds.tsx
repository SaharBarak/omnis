'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Link2, Users, Eye, MessageSquare, Pencil } from 'lucide-react'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, type SystemKey } from '@/lib/design/system-flavors'
import { COLORS } from '@/lib/design/landing-tokens'
import { DemoGraph } from './demo-graph'

// ============================================
// ZONE EMBEDS — the "real product UI" moments inside each zone.
// Marketing-weight demo versions of app components, demo data only.
// ============================================

const easeOut = [0.4, 0, 0.2, 1] as const

// --------------------------------------------
// §3 YOU — five readings auto-cycling
// --------------------------------------------

interface ReadingTab {
  readonly key: SystemKey
  readonly title: string
  readonly value: string
  readonly detail: string
  readonly icon: string
}

const READING_TABS: readonly ReadingTab[] = [
  {
    key: 'astrology',
    title: 'Natal chart',
    value: 'Sun in Leo · Moon in Pisces',
    detail: 'Rising Scorpio — 12 placements, 34 aspects',
    icon: '/images/astrology/signs/05-leo.svg',
  },
  {
    key: 'dreamspell',
    title: 'Galactic signature',
    value: 'Kin 113 · Solar Skywalker',
    detail: 'Red Skywalker, tone 9 — wavespell of the Serpent',
    icon: '/images/dreamspell/seals/13-skywalker.svg',
  },
  {
    key: 'tzolkin',
    title: 'Day sign',
    value: "B'en · 9",
    detail: 'Reed — pillar between sky and earth',
    icon: '/icons/tzolkin/signs/13-ben.svg',
  },
  {
    key: 'humanDesign',
    title: 'Bodygraph',
    value: 'Manifesting Generator 5/1',
    detail: 'Sacral authority — 4 centers defined',
    icon: '/images/human-design/bodygraph/bodygraph.svg',
  },
  {
    key: 'gematria',
    title: 'Name value',
    value: 'מיה — 55',
    detail: 'Ten and five doubled — the walking gate',
    icon: '/images/gematria/letters/13-mem.svg',
  },
]

export function ReadingCycler() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % READING_TABS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const tab = READING_TABS[active]
  const flavor = SYSTEM_FLAVORS[tab.key]

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
      {/* Tab strip with progress hairline */}
      <div className="flex gap-1 border-b border-white/10 pb-3">
        {READING_TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(i)}
            className="relative flex-1 pb-2 text-[11px] uppercase tracking-wider transition-colors"
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{tab.title}</p>
            <p className="mt-1 font-display text-2xl text-white">{tab.value}</p>
            <p className="mt-1 text-sm text-white/50">{tab.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 border-t border-white/10 pt-4 text-right text-xs text-white/50">
        Save to map →
      </p>
    </div>
  )
}

// --------------------------------------------
// §4 YOU + ONE — five-system score stack
// --------------------------------------------

const PAIR_SCORES: readonly { readonly key: SystemKey; readonly score: number; readonly note: string }[] = [
  { key: 'astrology', score: 78, note: 'Moon trine Venus — ease' },
  { key: 'dreamspell', score: 91, note: 'Occult partners' },
  { key: 'tzolkin', score: 64, note: 'Same trecena' },
  { key: 'humanDesign', score: 83, note: 'Electromagnetic 19-49' },
  { key: 'gematria', score: 57, note: 'Names share a root' },
]

export function PairScores() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
      <div className="mb-6 flex items-center justify-center gap-4">
        <PairAvatar name="Maya" color="#C0392B" />
        <div className="h-px w-16 bg-gradient-to-r from-[#C0392B] to-[#2C3E90]" />
        <PairAvatar name="Ari" color="#2C3E90" />
      </div>
      <div className="space-y-3">
        {PAIR_SCORES.map(({ key, score, note }, i) => {
          const flavor = SYSTEM_FLAVORS[key]
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-white/50">
                {flavor.name}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: flavor.accent }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.12, ease: easeOut }}
                />
              </div>
              <span className="w-8 text-right font-mono text-sm text-white/90">{score}</span>
              <span className="hidden w-44 text-xs text-white/50 md:block">{note}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PairAvatar({ name, color }: { readonly name: string; readonly color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: `${color}66`, border: `2px solid ${color}` }}
      >
        {name[0]}
      </span>
      <span className="text-xs text-white/70">{name}</span>
    </div>
  )
}

// --------------------------------------------
// §5 YOUR PEOPLE, KEPT — library demo with typed search
// --------------------------------------------

const LIBRARY_PEOPLE = [
  { name: 'Maya Cohen', meta: 'Kin 113 · Leo · MG 5/1', tags: ['family'] },
  { name: 'Ari Levit', meta: 'Kin 42 · Sagittarius · Projector 3/5', tags: ['team'] },
  { name: 'Dana Peled', meta: 'Kin 200 · Cancer · Generator 1/3', tags: ['family', 'circle'] },
] as const

export function LibraryDemo() {
  const query = 'Maya'
  const [typed, setTyped] = useState('')

  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i += 1
      setTyped(query.slice(0, i))
      if (i >= query.length) clearInterval(t)
    }, 220)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface p-6 md:p-8">
      <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-surface-2 px-4 py-3">
        <Search className="h-4 w-4 text-white/50" />
        <span className="font-mono text-sm text-white/90">
          {typed}
          <span className="animate-gentle-pulse text-white/50">|</span>
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {LIBRARY_PEOPLE.filter((p) => p.name.includes(typed) || typed.length < query.length).map(
          (p, i) => (
            <motion.div
              key={p.name}
              className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3"
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              <div>
                <p className="text-sm font-medium text-white/90">{p.name}</p>
                <p className="font-mono text-xs text-white/50">{p.meta}</p>
              </div>
              <div className="flex gap-2 text-xs text-white/50">
                <span>Open reading</span>
                <span className="text-white/35">·</span>
                <span>Add to map</span>
              </div>
            </motion.div>
          ),
        )}
      </div>
      <p className="mt-5 text-center text-xs text-white/35">
        Saved once — birth time, place, name, all five readings.
      </p>
    </div>
  )
}

// --------------------------------------------
// §6 THE MAP — full-width graph with lens controls
// --------------------------------------------

export function MapCenterpiece() {
  const [lens, setLens] = useState<SystemKey | null>(null)

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4 md:p-8">
      <div className="mb-5 flex flex-wrap gap-2">
        {FLAVOR_DESCENT.map((key) => {
          const flavor = SYSTEM_FLAVORS[key]
          const isActive = lens === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setLens(isActive ? null : key)}
              className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
              style={{
                borderColor: `${flavor.accent}55`,
                color: flavor.accent,
                backgroundColor: isActive ? `${flavor.accent}22` : `${flavor.accent}08`,
                opacity: lens === null || isActive ? 1 : 0.4,
              }}
            >
              {flavor.name}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setLens(null)}
          className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest"
          style={{
            borderColor: `${COLORS.gold}55`,
            color: COLORS.gold,
            backgroundColor: lens === null ? `${COLORS.gold}22` : `${COLORS.gold}08`,
          }}
        >
          Fused
        </button>
      </div>
      <DemoGraph lens={lens} />
      <p className="mt-4 text-center text-xs text-white/35">
        Hover any line for its five-system score. Tap a lens to isolate a layer.
      </p>
    </div>
  )
}

// --------------------------------------------
// §8 CIRCLES — three groups, same person, different role
// --------------------------------------------

const CIRCLES = [
  {
    name: 'Family',
    accent: COLORS.gold,
    members: ['Maya', 'Noam', 'Dana', 'Shai'],
    insight: 'Maya bridges — the only defined throat in the room.',
  },
  {
    name: 'Team',
    accent: '#7FD4C1',
    members: ['Maya', 'Ari', 'Tal', 'Omer'],
    insight: 'Maya drives — sacral motor against three projectors.',
  },
  {
    name: 'Friends',
    accent: '#B387E8',
    members: ['Maya', 'Lior', 'Shai'],
    insight: 'Maya rests — occult kin on both sides.',
  },
] as const

export function CirclesDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
      {CIRCLES.map((circle, i) => (
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
              className="text-xs uppercase tracking-[0.18em]"
              style={{ color: circle.accent }}
            >
              {circle.name}
            </span>
            <Users className="h-4 w-4 text-white/35" />
          </div>
          <div className="mt-4 flex -space-x-2">
            {circle.members.map((m) => (
              <span
                key={m}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface text-xs font-medium text-white ${
                  m === 'Maya' ? '' : 'bg-white/15'
                }`}
                style={m === 'Maya' ? { backgroundColor: circle.accent } : undefined}
                title={m}
              >
                {m[0]}
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
// §9 BEYOND YOU — share dialog + living link
// --------------------------------------------

export function ShareDemo() {
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Share this map</p>
        <p className="mt-2 font-display text-xl text-white">Mom&rsquo;s side — 12 people</p>
        <div className="mt-5 space-y-2.5">
          {[
            { icon: Eye, label: 'View only', on: true },
            { icon: MessageSquare, label: 'Can comment', on: false },
            { icon: Pencil, label: 'Can collaborate', on: false },
          ].map(({ icon: Icon, label, on }) => (
            <div key={label} className="flex items-center justify-between text-sm text-white/70">
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-white/50" />
                {label}
              </span>
              <span
                className={`h-4 w-7 rounded-full ${on ? 'bg-gold' : 'bg-white/15'} relative`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? 'right-0.5' : 'left-0.5'}`}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/15 bg-surface-2 px-3 py-2.5">
          <Link2 className="h-4 w-4 shrink-0 text-gold" />
          <span className="truncate font-mono text-xs text-white/70">
            omnis.app/share/m0ms-side-x7f2
          </span>
        </div>
      </div>

      {/* Recipient phone frame */}
      <motion.div
        className="mx-auto w-52 rounded-[2rem] border border-white/15 bg-surface p-3 shadow-2xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
      >
        <div className="rounded-[1.4rem] bg-surface-2 p-4">
          <p className="text-[9px] uppercase tracking-widest text-white/50">Shared with you</p>
          <p className="mt-1 font-display text-sm text-white">Mom&rsquo;s side</p>
          <div className="mt-3">
            <DemoGraph className="scale-[1.02]" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --------------------------------------------
// §10 KNOWLEDGE — self-typing search + five portals
// --------------------------------------------

const KNOWLEDGE_QUERIES = ['Gate 34', 'Kin 113', 'Venus synastry', 'Tone 7', 'Gematria 26']

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

export function KnowledgeSearch() {
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
        className="flex items-center gap-3 rounded-full border border-white/15 bg-surface-2 px-6 py-4 transition-colors focus-within:border-gold/50"
        onSubmit={(e) => {
          e.preventDefault()
          void runSearch()
        }}
      >
        <Search className="h-5 w-5 shrink-0 text-gold" />
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
          Search is unavailable right now — the five guides below are always open.
        </p>
      )}
      {search.status === 'done' && search.hits.length === 0 && (
        <p className="mt-4 text-center text-sm text-white/50">
          Nothing close enough yet — try a gate, kin, sign, tone, or number.
        </p>
      )}
      {search.status === 'done' && search.hits.length > 0 && (
        <div className="mt-4 space-y-2">
          {search.hits.map((hit) => (
            <a
              key={hit.sourceUrl + hit.snippet.slice(0, 24)}
              href={hit.sourceUrl}
              className="block rounded-lg border border-white/10 bg-surface px-4 py-3 transition-colors hover:border-gold/40"
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
        {FLAVOR_DESCENT.map((key) => {
          const flavor = SYSTEM_FLAVORS[key]
          return (
            <a
              key={key}
              href={flavor.learnHref}
              className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-white/5"
              style={{ borderColor: `${flavor.accent}44`, color: flavor.accent }}
            >
              {flavor.name}
            </a>
          )
        })}
      </div>
    </div>
  )
}
