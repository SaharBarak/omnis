'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftRight, LayoutGrid } from 'lucide-react'
import {
  calculateFiveSystemCompatibility,
  CONNECTION_DESCRIPTIONS,
  getPersonKinData,
  type FiveSystemCompatibility,
} from '@pleiad/engine/services/compatibility'
import { calculateOracle, getMoonReading } from '@pleiad/engine/calculations'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import type { HarmonyType } from '@pleiad/engine/types/relationship'
import { usePeople, type Person } from '@/lib/hooks/use-people'
import { SealIcon } from '@/components/cards/SealIcon'
import { MoonGlyph } from '@/components/moon/moon-glyph'
import { PageHeader, EmptyState } from '@/components/dashboard'
import {
  DataRow,
  Eyebrow,
  MeterBar,
  Notice,
  PageSection,
  Pill,
  StatNumber,
  getFlavor,
  SkeletonCard,
} from '@/components/app-kit'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { cn } from '@/lib/utils'

/**
 * The couples map — one pair, every system (#board issue "compare people on
 * dreamspell and find guides occult etc in each other"). Web counterpart of
 * packages/mobile/src/app/pair/[id1]/[id2].tsx, on the engine's five-system
 * fusion. The Dreamspell section leads: both oracles rendered slot by slot,
 * with the seats the partner actually occupies lit up.
 */

const HARMONY_ACCENT: Record<HarmonyType, string> = {
  supportive: getFlavor('humanDesign').accent, // teal — calm support
  challenging: getFlavor('astrology').accent, // gold — friction that sharpens
  transformative: getFlavor('dreamspell').accent, // violet — the occult current
  neutral: '#8B90A5',
}

const ORACLE_SLOTS = [
  ['guide', 'Guide'],
  ['analog', 'Analog'],
  ['antipode', 'Antipode'],
  ['occult', 'Occult'],
] as const

function personCoords(person: Person) {
  const place = person.birth_place
  return {
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
  }
}

/** One person's oracle, with the slots the partner's seal occupies lit. */
function OracleStrip({
  person,
  partner,
}: {
  person: Person
  partner: Person
}) {
  const kin = getPersonKinData(person.birth_date)
  const partnerKin = getPersonKinData(partner.birth_date)
  const oracle = calculateOracle(kin.kin)

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 flex items-center gap-3">
        <SealIcon sealNumber={kin.seal} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white/90">{person.name}</div>
          <div className="text-xs text-white/50 [font-variant-numeric:tabular-nums]">
            Kin {kin.kin} · {getTone(kin.tone).name} {getSeal(kin.seal).english}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ORACLE_SLOTS.map(([slot, label]) => {
          const slotSeal = oracle[slot]
          const occupied = partnerKin.seal === slotSeal
          const color = SEAL_COLORS[toSealColor(getSeal(slotSeal).color) ?? 'red']
          return (
            <div
              key={slot}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center',
                occupied
                  ? 'border-brand/60 bg-brand/10'
                  : 'border-white/[0.07]'
              )}
            >
              <SealIcon sealNumber={slotSeal} size="xs" />
              <span className="font-sans text-[9px] font-medium uppercase tracking-[0.12em] text-white/50">
                {label}
              </span>
              <span className={cn('text-[10px]', occupied ? 'text-brand-soft' : 'text-white/35')}>
                {occupied ? partner.name.split(' ')[0] : getSeal(slotSeal).english}
              </span>
              <span aria-hidden className={cn('size-1 rounded-full', color.bg)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreateBoardButton({
  person1,
  person2,
}: {
  person1: Person
  person2: Person
}) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'creating' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async () => {
    setState('creating')
    setError(null)
    const node = (person: Person, x: number) => ({
      id: `person-${person.id}`,
      type: 'person',
      personId: person.id,
      display: 'card',
      showSystems: ['dreamspell', 'astrology', 'humandesign'],
      position: { x, y: 420 },
      size: { width: 260, height: 200 },
      rotation: 0,
      locked: false,
      visible: true,
      layerId: 'people',
      zIndex: 1,
      style: { opacity: 1 },
    })
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${person1.name} × ${person2.name}`,
          description: 'Couple map — created from the pair view',
          template: 'relationship-map',
          canvas: {
            width: 1920,
            height: 1080,
            viewBox: { x: 0, y: 0, width: 1920, height: 1080, zoom: 1 },
            background: { type: 'solid', color: '#0B0D16' },
            grid: { visible: true, size: 20, snap: true, color: '#1A1E2C' },
            nodes: [node(person1, 560), node(person2, 1100)],
            connections: [
              {
                id: `pair-${person1.id}-${person2.id}`,
                type: 'relationship',
                sourceId: `person-${person1.id}`,
                targetId: `person-${person2.id}`,
                sourceAnchor: 'auto',
                targetAnchor: 'auto',
                style: { color: '#7D5BC9', width: 2 },
                label: 'couple',
                layerId: 'connections',
              },
            ],
            annotations: [],
          },
        }),
      })
      const data = (await res.json()) as { board?: { id: string }; error?: string }
      if (!res.ok || !data.board) {
        setState('error')
        setError(data.error ?? 'Could not create the board.')
        return
      }
      router.push(`/app/boards/${data.board.id}`)
    } catch {
      setState('error')
      setError('Could not create the board.')
    }
  }, [person1, person2, router])

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={create}
        disabled={state === 'creating'}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-soft active:scale-[0.98] disabled:opacity-60"
      >
        <LayoutGrid className="size-4" />
        {state === 'creating' ? 'Creating board…' : 'Create a board from this pair'}
      </button>
      {state === 'error' && error && <Notice variant="warning">{error}</Notice>}
    </div>
  )
}

export default function PairPage() {
  const params = useParams<{ id1: string; id2: string }>()
  const { people, loading } = usePeople()

  const person1 = people.find((p) => p.id === params.id1)
  const person2 = people.find((p) => p.id === params.id2)

  const fusion = useMemo<FiveSystemCompatibility | null>(() => {
    if (!person1 || !person2) return null
    return calculateFiveSystemCompatibility(
      {
        birthDate: person1.birth_date,
        birthTime: person1.birth_time,
        birthPlace: personCoords(person1),
        hebrewName: person1.hebrew_name,
        name: person1.name,
      },
      {
        birthDate: person2.birth_date,
        birthTime: person2.birth_time,
        birthPlace: personCoords(person2),
        hebrewName: person2.hebrew_name,
        name: person2.name,
      }
    )
  }, [person1, person2])

  const moons = useMemo(() => {
    if (!person1 || !person2) return null
    return {
      m1: getMoonReading(person1.birth_date),
      m2: getMoonReading(person2.birth_date),
    }
  }, [person1, person2])

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-48" />
      </div>
    )
  }

  if (!person1 || !person2 || !fusion || !moons || person1.id === person2.id) {
    return (
      <div className="surface-card">
        <EmptyState
          icon="people"
          title="Pick two people to compare"
          description="This view needs two distinct people from your map"
          action={{ label: 'Go to people', href: '/app/people' }}
        />
      </div>
    )
  }

  const ds = getFlavor('dreamspell')
  const astro = getFlavor('astrology')
  const hd = getFlavor('humanDesign')
  const integration = getFlavor('integration')

  const sameMoonPhase = moons.m1.phaseIndex === moons.m2.phaseIndex
  const oppositeMoonPhase = Math.abs(moons.m1.phaseIndex - moons.m2.phaseIndex) === 4

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${person1.name} × ${person2.name}`}
        subtitle="The couple map — one bond, read across the systems"
        actions={
          <Link
            href={`/app/pair/${person2.id}/${person1.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-white/[0.25]"
          >
            <ArrowLeftRight className="size-3.5" />
            Swap
          </Link>
        }
      />

      {/* Resonance — the fused finding */}
      <PageSection index={0} accent={integration.accent} eyebrow="Resonance">
        <div className="feature-card p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12">
            <StatNumber value={fusion.overallScore} label="Overall resonance" />
            <div className="min-w-0 flex-1 space-y-3">
              {(['dreamspell', 'tzolkin', 'astrology', 'humanDesign'] as const).map((key) => {
                const sys = fusion.systems[key]
                if (!sys.available) return null
                return (
                  <MeterBar
                    key={key}
                    label={
                      key === 'humanDesign' ? 'Human Design'
                        : key === 'tzolkin' ? 'Tzolkin'
                          : key.charAt(0).toUpperCase() + key.slice(1)
                    }
                    value={sys.score}
                    accent={getFlavor(key === 'tzolkin' ? 'tzolkin' : key).accent}
                  />
                )
              })}
            </div>
          </div>
          <p className="mt-4 text-sm text-white/50">{fusion.summary.english}</p>
        </div>
      </PageSection>

      {/* Dreamspell — oracles side by side, partner-occupied seats lit */}
      <PageSection index={1} accent={ds.accent} eyebrow="Dreamspell oracle">
        <p className="text-sm text-white/50">
          Each chart carries four oracle seats — guide, analog, antipode, occult.
          Highlighted seats are the ones the partner actually sits in.
        </p>
        <div className="surface-card p-5">
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            <OracleStrip person={person1} partner={person2} />
            <OracleStrip person={person2} partner={person1} />
          </div>

          {fusion.dreamspellDetail.connections.length > 0 ? (
            <div className="mt-6 space-y-2">
              <Eyebrow accent={ds.accent}>Bonds found</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {fusion.dreamspellDetail.connections.map((conn) => (
                  <Pill key={conn.type} accent={HARMONY_ACCENT[conn.harmony]}>
                    {CONNECTION_DESCRIPTIONS[conn.type].description.split(' - ')[0]}
                  </Pill>
                ))}
              </div>
              <div className="pt-1">
                {fusion.dreamspellDetail.connections.map((conn, i) => (
                  <DataRow
                    key={conn.type}
                    label={CONNECTION_DESCRIPTIONS[conn.type].description.split(' - ')[0]}
                    value={conn.description.split(' - ')[1] ?? conn.description}
                    last={i === fusion.dreamspellDetail.connections.length - 1}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/50">
              No direct oracle relation — two distinct currents running side by side.
            </p>
          )}
        </div>
      </PageSection>

      {/* Astrology synastry */}
      <PageSection index={2} accent={astro.accent} eyebrow="Synastry">
        {fusion.synastryDetail?.available ? (
          <div className="surface-card p-5">
            {fusion.synastryDetail.discriminators.length > 0 ? (
              <div>
                {fusion.synastryDetail.discriminators.slice(0, 6).map((conn, i, arr) => (
                  <DataRow
                    key={`${conn.type}-${i}`}
                    label={conn.tight ? 'Tight contact' : 'Contact'}
                    value={conn.description}
                    last={i === arr.length - 1}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">
                No rare cross-chart contacts — the background hum without a signature chord.
              </p>
            )}
          </div>
        ) : (
          <Notice variant="info">
            Synastry needs birth times and places for both people.
          </Notice>
        )}
      </PageSection>

      {/* Human Design */}
      <PageSection index={3} accent={hd.accent} eyebrow="Human Design">
        {fusion.hdDetail?.available ? (
          <div className="surface-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              {fusion.hdDetail.type1 && <Pill accent={hd.accent}>{fusion.hdDetail.type1}</Pill>}
              <span className="text-xs text-white/35">×</span>
              {fusion.hdDetail.type2 && <Pill accent={hd.accent}>{fusion.hdDetail.type2}</Pill>}
            </div>
            {fusion.hdDetail.typeDynamic && (
              <p className="mt-3 text-sm text-white/70">{fusion.hdDetail.typeDynamic.english}</p>
            )}
            {fusion.hdDetail.relation && (
              <div className="mt-4">
                <DataRow
                  label="Electromagnetic channels"
                  value={String(fusion.hdDetail.relation.counts.electromagnetic)}
                />
                <DataRow
                  label="Companionship channels"
                  value={String(fusion.hdDetail.relation.counts.companionship)}
                />
                <DataRow
                  label="Centers defined together"
                  value={`${fusion.hdDetail.relation.definedCenterCount} of 9`}
                  last
                />
              </div>
            )}
          </div>
        ) : (
          <Notice variant="info">
            Human Design comparison needs birth times for both people.
          </Notice>
        )}
      </PageSection>

      {/* Moon phases */}
      <PageSection index={4} accent={integration.accent} eyebrow="Born under">
        <div className="surface-card p-5">
          <div className="flex flex-col gap-6 md:flex-row md:gap-12">
            {[
              { person: person1, moon: moons.m1 },
              { person: person2, moon: moons.m2 },
            ].map(({ person, moon }) => (
              <div key={person.id} className="flex items-center gap-4">
                <MoonGlyph angle={moon.angle} size={64} />
                <div>
                  <div className="text-sm font-medium text-white/90">{person.name}</div>
                  <div className="text-sm text-white/70">{moon.phase}</div>
                  <div className="text-xs text-white/50 [font-variant-numeric:tabular-nums]">
                    {Math.round(moon.illumination * 100)}% lit
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(sameMoonPhase || oppositeMoonPhase) && (
            <p className="mt-4 text-sm text-white/50">
              {sameMoonPhase
                ? 'Born under the same lunar phase — the month moves through both on one rhythm.'
                : 'Born under opposite lunar phases — each stands where the other’s cycle turns.'}
            </p>
          )}
        </div>
      </PageSection>

      {/* Names */}
      {fusion.nameMatch?.exact && (
        <PageSection index={5} accent={getFlavor('gematria').accent} eyebrow="Names">
          <Notice variant="success">
            Both Hebrew names carry the same gematria value — {fusion.nameMatch.value1}.
          </Notice>
        </PageSection>
      )}

      {/* Board */}
      <PageSection index={6} accent={integration.accent} eyebrow="Keep it">
        <CreateBoardButton person1={person1} person2={person2} />
      </PageSection>
    </div>
  )
}
