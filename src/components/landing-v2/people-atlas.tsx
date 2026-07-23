'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Link2, Plus } from 'lucide-react'
import { NatalChartWheel } from '@/components/astrology/NatalChartWheel'
import { BodygraphChart } from '@/components/human-design/BodygraphChart'
import { SYSTEM_FLAVORS, FLAVOR_DESCENT, MURAL_GROUND, type SystemKey } from '@/lib/design/system-flavors'
import { COLORS, TYPE } from '@/lib/design/landing-tokens'
import { byInterest, type DemoPerson, type DemoCharts, type DemoPair, type DemoTie } from '@/lib/data/homepage-demo'

// ============================================================================
// THE PEOPLE ATLAS — the homepage's product proof.
//
// Pick a person → page their five charts → open Connections to see how they
// tie to everyone else in the collection. Every chart and every tie here is
// computed by the real engine (see src/lib/data/homepage-demo.ts). Nothing on
// this surface is decorative.
// ============================================================================

type Tab = SystemKey | 'connections'

const TABS: readonly Tab[] = [...FLAVOR_DESCENT, 'connections']

/** One concrete sentence per system — what this map actually tells you. */
const SYSTEM_BLURB: Record<SystemKey, string> = {
  astrology: 'The sky at the minute of birth: planets, houses, and the angles between them.',
  dreamspell: 'The galactic signature: one of 260 kin, built from a seal and a tone.',
  tzolkin: 'The 260-day count: the day-sign and trecena the birth falls inside.',
  humanDesign: 'The bodygraph: which centers are defined, and which channels are open.',
  gematria: 'The name by letter value: every letter carries a number.',
}

interface PeopleAtlasProps {
  readonly people: readonly DemoPerson[]
  readonly charts: Record<string, DemoCharts>
  readonly pairs: readonly DemoPair[]
}

export function PeopleAtlas({ people, charts, pairs }: PeopleAtlasProps) {
  const [personId, setPersonId] = useState(people[0].id)
  const [tab, setTab] = useState<Tab>('humanDesign')

  const person = people.find((p) => p.id === personId) ?? people[0]
  const chart = charts[person.id]

  // Every tie this person has to anyone else in the collection.
  const connections = useMemo(() => {
    return pairs
      .filter((p) => p.a === person.id || p.b === person.id)
      .map((p) => ({
        other: people.find((x) => x.id === (p.a === person.id ? p.b : p.a))!,
        overall: p.overall,
        // Rank by what the tie actually tells you, not raw score — otherwise
        // "name resonance" (which fires on nearly every pair) buries the Guide.
        ties: [...p.ties].sort(byInterest),
      }))
      .sort((x, y) => y.overall - x.overall)
  }, [pairs, people, person.id])

  return (
    <section id="atlas" className="relative py-24 md:py-32" style={{ backgroundColor: MURAL_GROUND }}>
      <div className="mx-auto w-full max-w-content px-6">
        <span
          className={`${TYPE.eyebrow} inline-block rounded-full border px-4 py-1.5`}
          style={{ borderColor: `${COLORS.brand}55`, color: COLORS.brand, backgroundColor: `${COLORS.brand}14` }}
        >
          Your private people library
        </span>

        <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
          <h2 className={TYPE.section}>Keep every person ready to reopen.</h2>
          <p className="text-lg leading-relaxed text-white/70">
            Save their birth date, time, place, and name once. Their available
            readings and the comparisons you choose stay together in your
            account, ready when you want to return to them.
          </p>
        </div>

        {/* ---- the app surface ---- */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10" style={{ backgroundColor: COLORS.surface }}>
          {/* People rail — the dashboard selector */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 px-4 py-4">
            {people.map((p) => {
              const active = p.id === person.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPersonId(p.id)}
                  aria-pressed={active}
                  className="group flex shrink-0 items-center gap-2.5 rounded-full border px-3 py-2 transition active:scale-[0.98]"
                  style={{
                    borderColor: active ? `${COLORS.brand}88` : 'rgba(255,255,255,0.10)',
                    backgroundColor: active ? `${COLORS.brand}1A` : 'transparent',
                  }}
                >
                  <Avatar person={p} kin={charts[p.id].kin} active={active} />
                  <span className={`text-sm ${active ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>
                    {p.name}
                  </span>
                </button>
              )
            })}
            <Link
              href="/calculate"
              className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-2 text-sm text-white/45 transition hover:border-white/30 hover:text-white/70 active:scale-[0.98]"
            >
              <Plus size={14} strokeWidth={1.5} />
              Add person
            </Link>
          </div>

          {/* Per-person navbar: five systems + connections */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-4 py-3">
            {TABS.map((t) => {
              const active = t === tab
              const isConn = t === 'connections'
              // accentSoft reads on the near-black ground; Tzolkin's #2E6E5E does not.
              const accent = isConn ? COLORS.brandSoft : SYSTEM_FLAVORS[t].accentSoft
              const label = isConn ? 'Connections' : SYSTEM_FLAVORS[t].name
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  aria-pressed={active}
                  className="relative shrink-0 rounded-lg px-3 py-1.5 text-[13px] transition active:scale-[0.98]"
                  style={{ color: active ? accent : 'rgba(255,255,255,0.45)' }}
                >
                  {isConn && <Link2 size={13} strokeWidth={1.5} className="mr-1.5 inline-block align-[-2px]" />}
                  {label}
                  {active && (
                    <motion.span
                      layoutId="atlas-tab"
                      className="absolute inset-0 -z-10 rounded-lg"
                      style={{ backgroundColor: `${accent}1A`, border: `1px solid ${accent}44` }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Panel */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${person.id}-${tab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === 'connections' ? (
                  <ConnectionsPanel person={person} connections={connections} />
                ) : (
                  <ChartPanel person={person} chart={chart} system={tab} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/calculate"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition active:translate-y-[1px]"
            style={{ backgroundColor: COLORS.brand }}
          >
            Start with your birthday
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

function ChartPanel({
  person,
  chart,
  system,
}: {
  readonly person: DemoPerson
  readonly chart: DemoCharts
  readonly system: SystemKey
}) {
  const flavor = SYSTEM_FLAVORS[system]
  const label = flavor.accentSoft

  return (
    // items-center: the bodygraph runs ~650px tall while the facts column is
    // ~380px — top-aligned, the column read as cut off after its last row.
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div className="flex min-h-[340px] items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-black/20 p-6 md:p-10">
        <SystemChart chart={chart} system={system} />
      </div>

      <div>
        <p className={TYPE.eyebrow} style={{ color: label }}>
          {flavor.name}
        </p>
        <h3 className={`${TYPE.card} mt-3`}>{person.name}</h3>
        <p className="mt-1 font-mono text-xs text-white/35">
          {person.birthDate} · {person.birthTime}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-white/55">{SYSTEM_BLURB[system]}</p>

        <dl className="mt-6 divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {chartFacts(chart, system).map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-xs uppercase tracking-wider text-white/35">{k}</dt>
              <dd className="font-mono text-sm text-white/85">{v}</dd>
            </div>
          ))}
        </dl>

        <Link
          href="/calculate"
          className="mt-6 inline-flex items-center gap-1.5 text-sm transition hover:gap-2.5"
          style={{ color: label }}
        >
          Read {person.name}&apos;s full {flavor.name}
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  )
}

/** The real chart for each system. Astrology + Human Design reuse the app's own components. */
function SystemChart({ chart, system }: { readonly chart: DemoCharts; readonly system: SystemKey }) {
  switch (system) {
    case 'astrology':
      // NatalChartWheel ships its own aspect legend as a second flex child. On the
      // homepage the facts column already carries that data, and the legend blows
      // out this container — so hide it and keep just the wheel.
      return (
        <NatalChartWheel
          chart={chart.natal}
          className="w-full max-w-[380px] [&>div>div:nth-child(2)]:hidden"
        />
      )
    case 'humanDesign':
      // No fixed width/height — a 300×360 box letterboxed the 5:7 viewBox down
      // to ~257px wide and made the gate numbers unreadable. Width-driven,
      // height follows the viewBox ratio.
      // The 440px cap MUST live on our own wrapper: BodygraphChart puts an
      // inline maxWidth:'100%' on its root, which beats any max-w-* class
      // handed to it — the graph grew to full column width (~1100px tall)
      // and left the facts column as dead space.
      return (
        <div className="w-full max-w-[440px]">
          <BodygraphChart bodygraph={chart.bodygraph} className="w-full" />
        </div>
      )
    case 'dreamspell':
      return <KinGlyph kin={chart.kin} seal={chart.seal} tone={chart.tone} accent={SYSTEM_FLAVORS.dreamspell.accent} />
    case 'tzolkin':
      return <TzolkinGlyph chart={chart} accent={SYSTEM_FLAVORS.tzolkin.accent} />
    case 'gematria':
      return <GematriaGlyph chart={chart} accent={SYSTEM_FLAVORS.gematria.accent} />
  }
}

/** Key/value facts pulled straight off the computed chart. */
function chartFacts(chart: DemoCharts, system: SystemKey): readonly (readonly [string, string])[] {
  switch (system) {
    case 'astrology': {
      const asc = chart.natal.ascendant
      return [
        ['Sun', chart.natal.sunSign.name],
        ['Moon', chart.natal.moonSign.name],
        ['Rising', asc ? `${asc.sign.name} ${asc.degree}°` : '—'],
        ['Planets', String(chart.natal.planets.length)],
      ]
    }
    case 'dreamspell':
      return [
        ['Kin', String(chart.kin)],
        ['Seal', String(chart.seal)],
        ['Tone', String(chart.tone)],
      ]
    case 'tzolkin':
      return [
        ['Day sign', chart.tzolkin.daySign.english],
        ['Yucatec', chart.tzolkin.daySign.yucatec],
        ['Tone', String(chart.tzolkin.tone)],
      ]
    case 'humanDesign':
      return [
        ['Type', chart.bodygraph.type],
        ['Authority', chart.bodygraph.authority],
        ['Profile', chart.bodygraph.profile.id],
        ['Channels', String(chart.bodygraph.channels.length)],
      ]
    case 'gematria':
      return [
        ['Name', chart.gematria.text],
        ['Value', String(chart.gematriaValue)],
        ['Letters', String(chart.gematria.letterCount)],
      ]
  }
}

// ---------------------------------------------------------------------------
// Connections — the tab the whole product hangs on.

function ConnectionsPanel({
  person,
  connections,
}: {
  readonly person: DemoPerson
  readonly connections: readonly {
    other: DemoPerson
    overall: number
    ties: readonly DemoTie[]
  }[]
}) {
  return (
    <div>
      <p className="mb-6 text-sm text-white/50">
        How <span className="text-white">{person.name}</span> connects to everyone else in the
        collection, named by the system that found it.
      </p>

      <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
        {connections.map(({ other, overall, ties }) => (
          <div key={other.id} className="grid gap-4 py-5 md:grid-cols-[180px_1fr] md:gap-8">
            <div className="flex items-center gap-3">
              <span className="font-display text-lg font-medium text-white">{other.name}</span>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[11px]"
                style={{ backgroundColor: `${COLORS.brand}1A`, color: COLORS.brandSoft }}
              >
                {overall}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ties.slice(0, 5).map((t, i) => (
                <TiePill key={`${t.system}-${t.type}-${i}`} tie={t} />
              ))}
              {ties.length > 5 && (
                <span className="self-center font-mono text-[11px] text-white/30">
                  +{ties.length - 5} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export function TiePill({ tie }: { readonly tie: DemoTie }) {
  const flavor = SYSTEM_FLAVORS[tie.system]
  const accent = flavor.accentSoft // legible on the dark ground
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
      style={{ borderColor: `${accent}55`, backgroundColor: `${flavor.accent}1A`, color: accent }}
      title={tie.meaning}
    >
      <span className="capitalize">{tie.type.replace(/-/g, ' ')}</span>
      {tie.channel && <span className="font-mono text-white/40">{tie.channel}</span>}
      {tie.planets && (
        <span className="font-mono capitalize text-white/40">
          {tie.planets[0]}/{tie.planets[1]}
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Lightweight real glyphs for the three systems without a full app chart.

function Avatar({ person, kin, active }: { readonly person: DemoPerson; readonly kin: number; readonly active: boolean }) {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full font-mono text-[10px] transition"
      style={{
        backgroundColor: active ? COLORS.brand : 'rgba(255,255,255,0.08)',
        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      }}
      aria-hidden
    >
      {person.name.slice(0, 1)}
      <span className="sr-only">kin {kin}</span>
    </span>
  )
}

function KinGlyph({ kin, seal, tone, accent }: { readonly kin: number; readonly seal: number; readonly tone: number; readonly accent: string }) {
  return (
    <div className="grid place-items-center gap-4">
      <div
        className="grid h-40 w-40 place-items-center rounded-full border"
        style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0E` }}
      >
        <span className="font-mono text-5xl font-medium" style={{ color: accent }}>
          {kin}
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/40">kin</span>
      </div>
      <div className="flex gap-6 font-mono text-xs text-white/50">
        <span>seal {seal}</span>
        <span>tone {tone}</span>
      </div>
      {/* 260-kin ring: the person's kin lit among the count */}
      <svg viewBox="0 0 260 12" className="h-3 w-full max-w-[320px]" aria-hidden>
        {Array.from({ length: 260 }, (_, i) => (
          <rect
            key={i}
            x={i}
            y={i + 1 === kin ? 0 : 4}
            width={0.8}
            height={i + 1 === kin ? 12 : 4}
            fill={i + 1 === kin ? accent : 'rgba(255,255,255,0.12)'}
          />
        ))}
      </svg>
    </div>
  )
}

function TzolkinGlyph({ chart, accent }: { readonly chart: DemoCharts; readonly accent: string }) {
  const sign = chart.tzolkin.daySign.english
  const num = chart.tzolkin.tone
  return (
    <div className="grid place-items-center gap-5">
      {/* Maya bar-and-dot numeral */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-1.5">
          {Array.from({ length: num % 5 }, (_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
          ))}
        </div>
        {Array.from({ length: Math.floor(num / 5) }, (_, i) => (
          <span key={i} className="h-1.5 w-12 rounded-sm" style={{ backgroundColor: accent }} />
        ))}
      </div>
      <div className="text-center">
        <p className="font-display text-3xl font-medium text-white">{sign}</p>
        <p className="mt-1 font-mono text-xs text-white/40">
          {chart.tzolkin.daySign.yucatec} · tone {num}
        </p>
      </div>
    </div>
  )
}

function GematriaGlyph({ chart, accent }: { readonly chart: DemoCharts; readonly accent: string }) {
  const letters = chart.gematria.methods.standard.breakdown ?? []
  return (
    <div className="grid place-items-center gap-5">
      <p className="font-display text-5xl font-medium text-white" dir="rtl">
        {chart.gematria.text}
      </p>
      <div className="flex flex-wrap justify-center gap-2" dir="rtl">
        {letters.map((l, i) => (
          <span
            key={i}
            className="grid h-12 w-12 place-items-center rounded-lg border"
            style={{ borderColor: `${accent}44`, backgroundColor: `${accent}0E` }}
          >
            <span className="text-lg text-white">{l.letter}</span>
            <span className="font-mono text-[10px]" style={{ color: accent }}>
              {l.value}
            </span>
          </span>
        ))}
      </div>
      <p className="font-mono text-sm text-white/50">
        total <span style={{ color: accent }}>{chart.gematriaValue}</span>
      </p>
    </div>
  )
}
