'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { analyzeGroup } from '@pleiad/engine/services/group-analysis'
import type { FullGroupAnalysis, DistributionItem, GroupMemberAnalysis } from '@pleiad/engine/services/group-analysis'
import { buildPenta } from '@pleiad/engine/services/composite-bodygraph'
import {
  calculateBodygraph,
  isCompleteBodygraph,
} from '@pleiad/engine/calculations/human-design'
import { CENTER_LABELS } from '@pleiad/engine/types/human-design'
import type { GroupWithMembers } from '@/lib/types/relationship'
import { useGroups } from '@/lib/hooks/use-groups'
import { cn } from '@/lib/utils'
import { PentaChart, type PentaMember } from '@/components/human-design/PentaChart'
import { Button } from '@/components/ui/button'
import {
  Eyebrow,
  FlavorTabs,
  MeterBar,
  Notice,
  PageSection,
  Pill,
  SkeletonCard,
  SkeletonRows,
  StatNumber,
  StatWord,
  getFlavor,
  type FlavorTab,
} from '@/components/app-kit'
import { SEAL_COLORS, toSealColor } from '@/components/app-kit/seal-colors'
import { MATRIX_RAMP, scoreRampStep } from '@/lib/services/resonance-matrix'

// Per-section folklore accents (system-flavors.ts via the kit)
const INTEGRATION = getFlavor('integration')
const DREAMSPELL = getFlavor('dreamspell')
const TZOLKIN = getFlavor('tzolkin')
const HUMAN_DESIGN = getFlavor('humanDesign')

const COLOR_NAMES: Record<'red' | 'white' | 'blue' | 'yellow', string> = {
  red: 'Red',
  white: 'White',
  blue: 'Blue',
  yellow: 'Yellow',
}

const INSIGHT_VARIANT = {
  strength: 'success',
  challenge: 'warning',
  pattern: 'info',
} as const

// Kit gap: no neutral flavor exists for the members tab, so it borrows the
// integration accent (shared with the compatibility tab).
const ANALYSIS_TABS: readonly FlavorTab[] = [
  { key: 'compatibility', label: 'Compatibility', flavor: 'integration' },
  { key: 'penta', label: 'Penta', flavor: 'humanDesign' },
  { key: 'dreamspell', label: 'Dreamspell', flavor: 'dreamspell' },
  { key: 'tzolkin', label: 'Tzolkin', flavor: 'tzolkin' },
  { key: 'members', label: 'Members', flavor: 'neutral' },
]

/** Card header inside a surface-card: display title + muted description. */
function CardHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-medium text-white/90">{title}</h3>
      <p className="mt-0.5 text-sm text-white/50">{description}</p>
    </div>
  )
}

// Distribution list — MeterBars with the section's folklore accent.
function DistributionList({
  items,
  accent,
}: {
  items: DistributionItem[]
  accent: string
}) {
  const present = items.filter(d => d.count > 0)
  if (present.length === 0) {
    return <p className="py-4 text-center text-sm text-white/35">No data</p>
  }
  const maxCount = Math.max(...items.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {present.map(item => (
        <MeterBar
          key={item.value}
          label={item.name}
          value={item.count}
          max={maxCount}
          accent={accent}
        />
      ))}
    </div>
  )
}

// Color balance — the four directional seal colors through SEAL_COLORS tokens.
function ColorBalanceChart({ colorBalance }: { colorBalance: FullGroupAnalysis['dreamspell']['colorBalance'] }) {
  const colors = ['red', 'white', 'blue', 'yellow'] as const

  return (
    <div className="space-y-3">
      {colors.map(color => {
        const data = colorBalance[color]
        const spec = SEAL_COLORS[color]
        return (
          <div key={color} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full border border-white/[0.12]"
              style={{ backgroundColor: spec.css }}
            />
            <MeterBar
              className="min-w-0 flex-1"
              label={COLOR_NAMES[color]}
              value={Math.round(data.percentage)}
              max={100}
              accent={spec.css}
              displayValue={`${data.percentage.toFixed(0)}%`}
            />
          </div>
        )
      })}
    </div>
  )
}

// Compatibility matrix — cells climb the brand-violet resonance ramp
// (same ramp as /app/graph's resonance matrix).
function CompatibilityMatrix({ analysis }: { analysis: FullGroupAnalysis }) {
  const { members, compatibility } = analysis

  if (members.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-white/50">
        At least two members are needed to compute compatibility.
      </p>
    )
  }

  // Create a lookup for quick score finding
  const scoreMap = new Map<string, number>()
  for (const entry of compatibility.matrix) {
    const key1 = `${entry.person1Id}-${entry.person2Id}`
    const key2 = `${entry.person2Id}-${entry.person1Id}`
    scoreMap.set(key1, entry.score)
    scoreMap.set(key2, entry.score)
  }

  const getScore = (p1Id: string, p2Id: string): number | null => {
    if (p1Id === p2Id) return null
    return scoreMap.get(`${p1Id}-${p2Id}`) ?? null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="min-w-[100px]" />
            {members.map(m => (
              <th
                key={m.id}
                className="min-w-[44px] px-1 pb-1 text-center font-sans text-[10px] font-medium uppercase tracking-[0.15em] text-white/50"
              >
                <div className="mx-auto max-w-[60px] truncate" title={m.name || m.hebrewName || ''}>
                  {(m.name || m.hebrewName || '').slice(0, 5)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map(row => (
            <tr key={row.id}>
              <td className="pr-3 text-left text-sm text-white/70">
                <div className="max-w-[100px] truncate" title={row.name || row.hebrewName || ''}>
                  {row.name || row.hebrewName}
                </div>
              </td>
              {members.map(col => {
                const score = getScore(row.id, col.id)
                if (score === null) {
                  return (
                    <td
                      key={col.id}
                      aria-hidden
                      className="h-10 min-w-[44px] rounded-md border border-white/5 bg-white/[0.02]"
                    />
                  )
                }
                const step = scoreRampStep(score)
                return (
                  <td
                    key={col.id}
                    className="h-10 min-w-[44px] rounded-md text-center text-sm font-medium tabular-nums"
                    style={{ background: step.fill, color: step.text }}
                    title={`${row.name || row.hebrewName} × ${col.name || col.hebrewName}: ${score}`}
                  >
                    {score}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ramp legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
        <span>Low</span>
        <div className="flex gap-0.5">
          {MATRIX_RAMP.map(step => (
            <span
              key={step.min}
              className="h-2.5 w-6 rounded-sm"
              style={{ background: step.fill }}
            />
          ))}
        </div>
        <span>High resonance</span>
      </div>
    </div>
  )
}

// Member row — hairline-divided list row with a seal-tinted kin disc.
function MemberRow({ member, last }: { member: GroupMemberAnalysis; last: boolean }) {
  const seal = toSealColor(member.dreamspell.color)
  const spec = seal ? SEAL_COLORS[seal] : null

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3',
        !last && 'border-b border-white/[0.07]'
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] text-sm font-semibold tabular-nums',
          !spec && 'bg-white/[0.06] text-white/70'
        )}
        style={spec ? { backgroundColor: spec.cssSoft, color: spec.css } : undefined}
      >
        {member.dreamspell.kin}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-white/90">{member.name || member.hebrewName}</div>
        <div className="text-xs text-white/50">
          {member.dreamspell.toneName} {member.dreamspell.sealName}
        </div>
      </div>
      <Eyebrow className="shrink-0">Kin {member.dreamspell.kin}</Eyebrow>
    </div>
  )
}

// Penta tab — MAPS_ROADMAP #2 group mode: what the group defines that no
// individual member has. Needs exact birth time + place per member; members
// without them are listed as uncharted rather than silently dropped.
function PentaSection({ group }: { group: GroupWithMembers }) {
  const charted: PentaMember[] = []
  const uncharted: string[] = []

  for (const member of group.members) {
    const name = member.name || member.hebrew_name || 'Unnamed'
    const lat = member.birth_place?.lat
    const lng = member.birth_place?.lng
    if (!member.birth_time || typeof lat !== 'number' || typeof lng !== 'number') {
      uncharted.push(name)
      continue
    }
    const result = calculateBodygraph({
      birthDate: member.birth_date,
      birthTime: member.birth_time,
      latitude: lat,
      longitude: lng,
    })
    if (isCompleteBodygraph(result)) {
      charted.push({ name, bodygraph: result })
    } else {
      uncharted.push(name)
    }
  }

  if (charted.length < 3) {
    return (
      <div className="surface-card p-5">
        <CardHeading
          title="Penta"
          description="The group bodygraph, read for 3-5 charted members"
        />
        <div className="mt-4 space-y-2">
          <p className="text-sm text-white/70">
            The Penta needs at least three members with an exact birth time and place
            ({charted.length} of {group.members.length} charted).
            {charted.length === 2 &&
              ' For two people, open their cell on the resonance matrix to see the pair composite.'}
          </p>
          {uncharted.length > 0 && (
            <p className="text-sm text-white/50">
              Missing birth time or place: {uncharted.join(', ')}
            </p>
          )}
        </div>
      </div>
    )
  }

  const penta = buildPenta(charted.map((m) => m.bodygraph))
  const emergent = penta.channels.filter((c) => c.state === 'emergent')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="surface-card p-5">
        <CardHeading
          title="Penta"
          description={[
            `${charted.length} charted members`,
            charted.length > 5 ? 'the Penta is classically read for 3-5' : null,
            uncharted.length > 0 ? `uncharted: ${uncharted.join(', ')}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
        <div className="mt-4 flex justify-center">
          <PentaChart members={charted} className="w-full max-w-[400px]" />
        </div>
      </div>

      <div className="surface-card p-5">
        <CardHeading
          title="What only the group defines"
          description="Channels and centers no single member carries alone"
        />
        <div className="mt-4 space-y-4">
          {emergent.length === 0 && penta.emergentCenters.size === 0 ? (
            <p className="text-sm text-white/50">
              No emergent definition: every defined channel in this group is carried by
              at least one member on their own.
            </p>
          ) : (
            <>
              {emergent.map((pc) => (
                <div key={pc.channel.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 font-medium text-white/90">
                      {pc.channel.name}
                      <span className="ml-1.5 font-normal text-white/50">
                        ({pc.channel.id})
                      </span>
                    </span>
                    <Pill
                      accent={HUMAN_DESIGN.accent}
                      className="shrink-0 px-3 py-1 text-[10px]"
                    >
                      Group-only
                    </Pill>
                  </div>
                  <p className="text-xs text-white/50">
                    {pc.contributors
                      .map((ref) => `${charted[ref.index].name} brings gate ${ref.gates.join(', ')}`)
                      .join(' · ')}
                  </p>
                </div>
              ))}
              {penta.emergentCenters.size > 0 && (
                <p className="border-t border-white/[0.07] pt-3 text-sm text-white/50">
                  Centers defined only together:{' '}
                  <span className="text-white/90">
                    {[...penta.emergentCenters].map((c) => CENTER_LABELS[c]).join(', ')}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading skeleton — layout-matched (header, stat grid, list card)
function AnalysisSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="skeleton-shimmer h-3 w-40 rounded" />
        <div className="skeleton-shimmer h-8 w-56 rounded" />
        <div className="skeleton-shimmer h-4 w-24 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="surface-card p-5">
        <SkeletonRows count={4} />
      </div>
    </div>
  )
}

// Main page component
export default function GroupAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getGroupWithMembers } = useGroups()
  const [analysis, setAnalysis] = useState<FullGroupAnalysis | null>(null)
  const [group, setGroup] = useState<GroupWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('compatibility')

  useEffect(() => {
    const loadAnalysis = async () => {
      setLoading(true)
      setError(null)

      try {
        const group = await getGroupWithMembers(id)
        if (!group) {
          setError('Group not found')
          return
        }

        const analysisResult = analyzeGroup(group)
        setGroup(group)
        setAnalysis(analysisResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong while loading the analysis')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [id, getGroupWithMembers])

  if (loading) {
    return <AnalysisSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Notice variant="error" title="Could not load the analysis">
          {error}
        </Notice>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  // Get top items for quick view
  const topSeals = analysis.dreamspell.sealDistribution.slice(0, 5).filter(d => d.count > 0)
  const topTones = analysis.dreamspell.toneDistribution.slice(0, 5).filter(d => d.count > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Link
              href="/app/groups"
              className="font-sans font-medium text-[11px] uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white/70"
            >
              Groups
            </Link>
            <span aria-hidden className="text-white/35">/</span>
            <Eyebrow className="text-white/70">{analysis.groupName}</Eyebrow>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
            Group analysis
          </h1>
          <p className="mt-0.5 text-white/50">{analysis.memberCount} members</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>
          Back to groups
        </Button>
      </div>

      {/* Quick stats */}
      <PageSection index={0} accent={INTEGRATION.accent} eyebrow="Overview">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="surface-card p-5">
            <StatNumber value={analysis.memberCount} label="Members" />
          </div>
          <div className="surface-card p-5">
            <StatNumber
              value={`${analysis.compatibility.averageScore}%`}
              label="Avg compatibility"
            />
          </div>
          <div className="surface-card p-5">
            <StatWord
              value={topSeals[0]?.name || '—'}
              label={
                topSeals[0]
                  ? `Most common seal · ${topSeals[0].count} people`
                  : 'Most common seal'
              }
            />
          </div>
          <div className="surface-card p-5">
            <StatWord
              value={topTones[0]?.name || '—'}
              label={
                topTones[0]
                  ? `Most common tone · ${topTones[0].count} people`
                  : 'Most common tone'
              }
            />
          </div>
        </div>
      </PageSection>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <PageSection index={1} accent={INTEGRATION.accent} eyebrow="Insights">
          <div className="space-y-3">
            {analysis.insights.map((insight, idx) => (
              <Notice key={idx} variant={INSIGHT_VARIANT[insight.type]}>
                {insight.english}
              </Notice>
            ))}
          </div>
        </PageSection>
      )}

      {/* Detailed analysis */}
      <PageSection index={2} accent={INTEGRATION.accent} eyebrow="Readings">
        <FlavorTabs tabs={ANALYSIS_TABS} active={tab} onChange={setTab} />

        {tab === 'compatibility' && (
          <div className="surface-card p-5">
            <CardHeading
              title="Compatibility matrix"
              description="Compatibility scores for every pair in the group (0-100)"
            />
            <div className="mt-4">
              <CompatibilityMatrix analysis={analysis} />
            </div>
            {analysis.compatibility.highestPair && (
              <Notice
                variant="success"
                title="Highest-compatibility pair"
                className="mt-6"
              >
                {analysis.compatibility.highestPair.person1} &harr;{' '}
                {analysis.compatibility.highestPair.person2}:{' '}
                {analysis.compatibility.highestPair.score}%
              </Notice>
            )}
          </div>
        )}

        {tab === 'penta' && group && <PentaSection group={group} />}

        {tab === 'dreamspell' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="surface-card p-5">
                <CardHeading
                  title="Seal distribution"
                  description="The 20 solar seals of the Dreamspell"
                />
                <div className="mt-4">
                  <DistributionList
                    items={analysis.dreamspell.sealDistribution}
                    accent={DREAMSPELL.accent}
                  />
                </div>
              </div>

              <div className="surface-card p-5">
                <CardHeading
                  title="Tone distribution"
                  description="The 13 galactic tones"
                />
                <div className="mt-4">
                  <DistributionList
                    items={analysis.dreamspell.toneDistribution}
                    accent={DREAMSPELL.accent}
                  />
                </div>
              </div>
            </div>

            <div className="surface-card p-5">
              <CardHeading
                title="Color balance"
                description="Distribution of the four directional colors"
              />
              <div className="mt-4">
                <ColorBalanceChart colorBalance={analysis.dreamspell.colorBalance} />
              </div>
            </div>
          </div>
        )}

        {tab === 'tzolkin' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="surface-card p-5">
              <CardHeading
                title="Day sign distribution"
                description="The 20 day signs of the traditional Tzolkin"
              />
              <div className="mt-4">
                <DistributionList
                  items={analysis.tzolkin.signDistribution}
                  accent={TZOLKIN.accent}
                />
              </div>
            </div>

            <div className="surface-card p-5">
              <CardHeading
                title="Tone distribution (Tzolkin)"
                description="The 13 Tzolkin tones"
              />
              <div className="mt-4">
                <DistributionList
                  items={analysis.tzolkin.toneDistribution}
                  accent={TZOLKIN.accent}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="surface-card p-5">
            <CardHeading
              title="Group members"
              description="Every member with their Dreamspell profile"
            />
            <div className="mt-2">
              {analysis.members.map((member, i) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  last={i === analysis.members.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </PageSection>
    </div>
  )
}
