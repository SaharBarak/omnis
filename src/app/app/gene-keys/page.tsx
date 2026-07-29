'use client'

import { useMemo, useState } from 'react'
import { geneKeysProfile, type GeneKeysSphere } from '@pleiad/engine/calculations'
import { calculateBodygraph } from '@pleiad/engine/calculations/human-design'
import { usePeople } from '@/lib/hooks/use-people'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { Notice, PageSection, SkeletonCard } from '@/components/app-kit'
import { cn } from '@/lib/utils'

/**
 * Gene Keys (#75) — the Golden Path hologenetic profile, riding the same
 * planetary gate activations the Human Design bodygraph computes. Needs a
 * birth time: without one there are no activations to read.
 */

const ACCENT = '#B9E8DD' // kin to the Human Design flavor it derives from

const SEQUENCES = [
  {
    key: 'activation' as const,
    title: 'Activation Sequence',
    note: 'The Four Prime Gifts — your core purpose, read from the Sun and Earth on both sides of the chart.',
  },
  {
    key: 'venus' as const,
    title: 'Venus Sequence',
    note: 'The relational path — the imprints of childhood and the patterns you bring to intimacy.',
  },
  {
    key: 'pearl' as const,
    title: 'Pearl Sequence',
    note: 'The prosperity path — vocation, culture, and the pearl that rewards service.',
  },
]

function PersonChip({
  name,
  selected,
  onSelect,
}: {
  name: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm transition-colors active:scale-[0.98]',
        selected
          ? 'border-brand/60 bg-brand/15 text-white/90'
          : 'border-white/[0.12] text-white/60 hover:border-white/[0.25]'
      )}
    >
      {name}
    </button>
  )
}

function SphereCard({ sphere }: { sphere: GeneKeysSphere }) {
  return (
    <div className="surface-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-display text-lg tracking-tight text-white/90">
            {sphere.sphere}
          </span>
          <span className="ml-2 text-xs text-white/40">{sphere.theme}</span>
        </div>
        <span className="font-display text-xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
          {sphere.geneKey.key}.{sphere.line}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-white/45">{sphere.geneKey.shadow}</span>
        <span aria-hidden className="text-white/25">→</span>
        <span className="text-white/80">{sphere.geneKey.gift}</span>
        <span aria-hidden className="text-white/25">→</span>
        <span style={{ color: ACCENT }}>{sphere.geneKey.siddhi}</span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/30">
        shadow → gift → siddhi
      </p>
    </div>
  )
}

export default function GeneKeysPage() {
  const { people, loading } = usePeople()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const withDates = useMemo(
    () => people.filter((p) => Boolean(p.birth_date)),
    [people]
  )
  const selected =
    withDates.find((p) => p.id === selectedId) ?? withDates[0] ?? null

  const profile = useMemo(() => {
    if (!selected?.birth_time) return null
    const chart = calculateBodygraph({
      birthDate: selected.birth_date,
      birthTime: selected.birth_time,
      latitude: selected.birth_place?.lat ?? 32.0853,
      longitude: selected.birth_place?.lng ?? 34.7818,
    })
    if (!chart.hasBirthTime) return null
    return geneKeysProfile(chart.activations)
  }, [selected])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gene Keys"
          subtitle="The Golden Path — shadow, gift, and siddhi across three sequences"
        />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (withDates.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gene Keys"
          subtitle="The Golden Path — shadow, gift, and siddhi across three sequences"
        />
        <EmptyState
          icon="people"
          title="No people yet"
          description="Add a person with a birth date and time and their hologenetic profile appears here."
          action={{ label: 'Add your first person', href: '/app/people' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gene Keys"
        subtitle="The Golden Path — shadow, gift, and siddhi across three sequences"
      />

      <PageSection index={0} accent={ACCENT} eyebrow="Whose profile">
        <div className="flex flex-wrap gap-2">
          {withDates.map((p) => (
            <PersonChip
              key={p.id}
              name={p.name}
              selected={selected?.id === p.id}
              onSelect={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </PageSection>

      {!profile && selected && (
        <Notice variant="info">
          The hologenetic profile is read from the planetary activations of
          the bodygraph, and those need a birth time — add one to{' '}
          {selected.name}&rsquo;s profile to unlock it.
        </Notice>
      )}

      {profile &&
        SEQUENCES.map((seq, i) => (
          <PageSection key={seq.key} index={i + 1} accent={ACCENT} eyebrow={seq.title}>
            <p className="mb-3 max-w-[65ch] text-sm text-white/50">{seq.note}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {profile[seq.key].map((sphere) => (
                <SphereCard key={sphere.sphere} sphere={sphere} />
              ))}
            </div>
          </PageSection>
        ))}

      {profile && (
        <p className="text-xs text-white/35">
          Gene Key n is Human Design gate n — the same sky, read as a
          contemplation path. Sphere-to-planet correlations follow the
          official Gene Keys documentation.
        </p>
      )}
    </div>
  )
}
