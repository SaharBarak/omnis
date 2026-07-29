'use client'

import { useMemo, useState } from 'react'
import {
  annualPillar,
  baziBranchCompatibility,
  baziChart,
  luckPillars,
  type BaziElement,
  type StemBranch,
} from '@pleiad/engine/calculations'
import { usePeople } from '@/lib/hooks/use-people'
import { PageHeader, EmptyState } from '@/components/dashboard'
import {
  DataRow,
  Notice,
  PageSection,
  Pill,
  SkeletonCard,
} from '@/components/app-kit'
import { cn } from '@/lib/utils'

/**
 * BaZi — Four Pillars of Destiny (#73). The solar-year stems and branches
 * of each person: four pillars, day master, five-element balance, luck
 * decades (direction depends on gender, offered as a toggle since people
 * don't carry one), annual pillars, and branch compatibility.
 */

const ACCENT = '#CF6F6F' // the Chinese-tradition vermilion of the calendar page

const ELEMENT_COLORS: Record<BaziElement, string> = {
  Wood: '#86C89B',
  Fire: '#D98E5F',
  Earth: '#D9B36A',
  Metal: '#C9CDD4',
  Water: '#7FA8D4',
}

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

function PillarCard({ label, pillar }: { label: string; pillar: StemBranch }) {
  return (
    <div className="feature-card flex-1 p-5">
      <div className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl tracking-tight text-brand-bright">
        {pillar.stemName} {pillar.branchName}
      </div>
      <p className="mt-1 text-xs text-white/60">
        {pillar.polarity} {pillar.element} {pillar.animal}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: ELEMENT_COLORS[pillar.element] }}
        />
        <span className="text-[11px] text-white/40">
          stem {pillar.element} · branch {pillar.branchElement}
        </span>
      </div>
    </div>
  )
}

export default function BaziPage() {
  const { people, loading } = usePeople()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [gender, setGender] = useState<'male' | 'female'>('male')

  const withDates = useMemo(
    () => people.filter((p) => Boolean(p.birth_date)),
    [people]
  )
  const selected =
    withDates.find((p) => p.id === selectedId) ?? withDates[0] ?? null
  const partner = withDates.find((p) => p.id === partnerId) ?? null

  const chart = useMemo(
    () =>
      selected ? baziChart(selected.birth_date, selected.birth_time) : null,
    [selected]
  )

  const decades = useMemo(
    () => (selected ? luckPillars(selected.birth_date, gender) : []),
    [selected, gender]
  )

  const annuals = useMemo(() => {
    const thisYear = new Date().getFullYear()
    return [0, 1, 2, 3, 4].map((i) => ({
      year: thisYear + i,
      pillar: annualPillar(thisYear + i),
    }))
  }, [])

  const pairReading = useMemo(() => {
    if (!chart || !partner || partner.id === selected?.id) return null
    const partnerChart = baziChart(partner.birth_date, partner.birth_time)
    return {
      partnerChart,
      verdict: baziBranchCompatibility(chart.year.branch, partnerChart.year.branch),
    }
  }, [chart, partner, selected])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="BaZi — Four Pillars"
          subtitle="The solar stems and branches of the moment you arrived"
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
          title="BaZi — Four Pillars"
          subtitle="The solar stems and branches of the moment you arrived"
        />
        <EmptyState
          icon="people"
          title="No people yet"
          description="Add a person with a birth date and their four pillars appear here."
          action={{ label: 'Add your first person', href: '/app/people' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="BaZi — Four Pillars"
        subtitle="The solar stems and branches of the moment you arrived"
      />

      <PageSection index={0} accent={ACCENT} eyebrow="Whose chart">
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

      {chart && selected && (
        <>
          <PageSection index={1} accent={ACCENT} eyebrow="The four pillars">
            <div className="flex flex-col gap-3 md:flex-row">
              <PillarCard label="Year" pillar={chart.year} />
              <PillarCard label="Month" pillar={chart.month} />
              <PillarCard label="Day" pillar={chart.day} />
              {chart.hour && <PillarCard label="Hour" pillar={chart.hour} />}
            </div>
            {!chart.hour && (
              <div className="mt-3">
                <Notice variant="info">
                  The hour pillar needs a birth time — add one to{' '}
                  {selected.name}&rsquo;s profile to complete the chart.
                </Notice>
              </div>
            )}
            <p className="mt-3 max-w-[65ch] text-xs text-white/40">
              The day stem is the Day Master — the self the rest of the chart
              is read against. {selected.name}&rsquo;s Day Master is{' '}
              <span className="text-white/70">
                {chart.dayMaster.name} ({chart.dayMaster.polarity}{' '}
                {chart.dayMaster.element})
              </span>
              .
            </p>
          </PageSection>

          <PageSection index={2} accent={ACCENT} eyebrow="Five elements">
            <div className="surface-card p-5">
              {(Object.entries(chart.elementCounts) as [BaziElement, number][]).map(
                ([element, count], i, all) => (
                  <div
                    key={element}
                    className={cn(
                      'flex items-center gap-3 py-2.5',
                      i < all.length - 1 && 'border-b border-white/[0.06]'
                    )}
                  >
                    <span className="w-14 text-sm text-white/70">{element}</span>
                    <div className="flex flex-1 items-center gap-1">
                      {Array.from({ length: count }, (_, j) => (
                        <span
                          key={j}
                          className="h-2 w-6 rounded-full"
                          style={{ backgroundColor: ELEMENT_COLORS[element] }}
                        />
                      ))}
                      {count === 0 && (
                        <span className="text-xs text-white/30">absent</span>
                      )}
                    </div>
                    <span className="text-sm text-white/50 [font-variant-numeric:tabular-nums]">
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
            <p className="mt-2 text-xs text-white/35">
              Counted across the stems and branches of{' '}
              {chart.hour ? 'all four' : 'the three known'} pillars.
            </p>
          </PageSection>

          <PageSection index={3} accent={ACCENT} eyebrow="Luck decades">
            <div className="mb-3 flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <PersonChip
                  key={g}
                  name={g === 'male' ? 'Male direction' : 'Female direction'}
                  selected={gender === g}
                  onSelect={() => setGender(g)}
                />
              ))}
            </div>
            <div className="surface-card p-5">
              {decades.map((d, i) => (
                <DataRow
                  key={`${d.startAge}-${d.name}`}
                  label={`Ages ${d.startAge}–${d.endAge}`}
                  value={`${d.stemName} ${d.branchName}`}
                  detail={`${d.polarity} ${d.element} ${d.animal}`}
                  last={i === decades.length - 1}
                />
              ))}
            </div>
            <p className="mt-2 max-w-[65ch] text-xs text-white/35">
              Luck pillars run forward for yang-year males and yin-year
              females, backward otherwise — people here don&rsquo;t carry a
              gender, so pick the direction that applies.
            </p>
          </PageSection>

          <PageSection index={4} accent={ACCENT} eyebrow="Annual pillars">
            <div className="surface-card p-5">
              {annuals.map(({ year, pillar }, i) => (
                <DataRow
                  key={year}
                  label={String(year)}
                  value={`${pillar.stemName} ${pillar.branchName}`}
                  detail={`${pillar.polarity} ${pillar.element} ${pillar.animal} · from Li Chun (~4 Feb)`}
                  last={i === annuals.length - 1}
                />
              ))}
            </div>
          </PageSection>

          {withDates.length > 1 && (
            <PageSection index={5} accent={ACCENT} eyebrow="Compatibility">
              <div className="mb-3 flex flex-wrap gap-2">
                {withDates
                  .filter((p) => p.id !== selected.id)
                  .map((p) => (
                    <PersonChip
                      key={p.id}
                      name={p.name}
                      selected={partner?.id === p.id}
                      onSelect={() => setPartnerId(p.id)}
                    />
                  ))}
              </div>
              {pairReading && partner ? (
                <div className="feature-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl tracking-tight text-brand-bright">
                      {chart.year.animal} × {pairReading.partnerChart.year.animal}
                    </span>
                    <Pill accent={ACCENT}>{pairReading.verdict.relation}</Pill>
                  </div>
                  <p className="mt-2 max-w-[65ch] text-sm text-white/70">
                    {pairReading.verdict.note}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Year branches: {selected.name} is {chart.year.branchName} ·{' '}
                    {partner.name} is {pairReading.partnerChart.year.branchName}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-white/40">
                  Pick a second person to read the pair.
                </p>
              )}
            </PageSection>
          )}
        </>
      )}
    </div>
  )
}
