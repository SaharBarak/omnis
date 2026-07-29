'use client'

import { useMemo, useState } from 'react'
import {
  NUMBER_MEANINGS,
  numerologyChart,
  numerologyCompatibility,
  type NumerologyChart,
} from '@pleiad/engine/calculations'
import { usePeople } from '@/lib/hooks/use-people'
import { PageHeader, EmptyState } from '@/components/dashboard'
import {
  DataRow,
  Eyebrow,
  Notice,
  PageSection,
  Pill,
  SkeletonCard,
} from '@/components/app-kit'
import { cn } from '@/lib/utils'

/**
 * Numerology suite (#72) — the Pythagorean chart for each of your people:
 * core numbers, the personal Year/Month/Day running now, pinnacles with
 * their age windows, challenges, and Life Path compatibility between any
 * two people. All engine math; the page only arranges it.
 */

const ACCENT = '#10B981' // the V2 design system's numerology emerald

function meaning(n: number | null): string {
  if (n === null) return 'Needs a name written in Latin letters'
  return NUMBER_MEANINGS[n] ?? ''
}

function NumberHero({ label, value }: { label: string; value: number }) {
  return (
    <div className="feature-card flex-1 p-5">
      <div className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
        {label}
      </div>
      <div className="mt-1 font-display text-4xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
        {value}
      </div>
      <p className="mt-1 text-xs text-white/50">{meaning(value)}</p>
    </div>
  )
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

function ageNow(birthDate: string): number {
  const birth = new Date(`${birthDate}T12:00:00Z`)
  const now = new Date()
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

function ChartSections({
  chart,
  age,
  index,
}: {
  chart: NumerologyChart
  age: number
  index: number
}) {
  return (
    <>
      <PageSection index={index} accent={ACCENT} eyebrow="Core numbers">
        <div className="flex flex-col gap-3 md:flex-row">
          <NumberHero label="Life Path" value={chart.lifePath} />
          {chart.expression !== null && (
            <NumberHero label="Expression / Destiny" value={chart.expression} />
          )}
          <NumberHero label="Birthday" value={chart.birthday} />
        </div>
        <div className="surface-card mt-3 p-5">
          <DataRow
            label="Soul Urge"
            value={chart.soulUrge !== null ? String(chart.soulUrge) : '—'}
            detail={meaning(chart.soulUrge)}
          />
          <DataRow
            label="Personality"
            value={chart.personality !== null ? String(chart.personality) : '—'}
            detail={meaning(chart.personality)}
          />
          <DataRow
            label="Maturity"
            value={chart.maturity !== null ? String(chart.maturity) : '—'}
            detail={meaning(chart.maturity)}
            last
          />
        </div>
        {chart.expression === null && (
          <div className="mt-3">
            <Notice variant="info">
              Name numbers need a name written in Latin letters — this
              person&rsquo;s name doesn&rsquo;t map onto the Pythagorean table.
            </Notice>
          </div>
        )}
      </PageSection>

      <PageSection index={index + 1} accent={ACCENT} eyebrow="Cycles now">
        <div className="surface-card p-5">
          <DataRow
            label="Personal Year"
            value={String(chart.personalYear)}
            detail={meaning(chart.personalYear)}
          />
          <DataRow
            label="Personal Month"
            value={String(chart.personalMonth)}
            detail={meaning(chart.personalMonth)}
          />
          <DataRow
            label="Personal Day"
            value={String(chart.personalDay)}
            detail={meaning(chart.personalDay)}
            last
          />
        </div>
      </PageSection>

      <PageSection index={index + 2} accent={ACCENT} eyebrow="Pinnacles">
        <div className="surface-card p-5">
          {chart.pinnacles.map((p, i) => {
            const active =
              age >= p.fromAge && (p.toAge === null || age <= p.toAge)
            return (
              <DataRow
                key={`${i}-${p.number}`}
                label={`${['First', 'Second', 'Third', 'Fourth'][i]}${active ? ' · now' : ''}`}
                value={`${p.number} · ages ${p.fromAge}–${p.toAge ?? '∞'}`}
                detail={meaning(p.number)}
                last={i === chart.pinnacles.length - 1}
              />
            )
          })}
        </div>
      </PageSection>

      <PageSection index={index + 3} accent={ACCENT} eyebrow="Challenges">
        <div className="surface-card p-5">
          {chart.challenges.map((c, i) => (
            <DataRow
              key={`${i}-${c}`}
              label={['First', 'Second', 'Third', 'Fourth'][i]}
              value={String(c)}
              detail={meaning(c)}
              last={i === chart.challenges.length - 1}
            />
          ))}
        </div>
      </PageSection>
    </>
  )
}

export default function NumerologyPage() {
  const { people, loading } = usePeople()
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)

  const withDates = useMemo(
    () => people.filter((p) => Boolean(p.birth_date)),
    [people]
  )
  const selected =
    withDates.find((p) => p.id === selectedId) ?? withDates[0] ?? null
  const partner = withDates.find((p) => p.id === partnerId) ?? null

  const chart = useMemo(
    () =>
      selected
        ? numerologyChart(selected.birth_date, selected.name, todayIso)
        : null,
    [selected, todayIso]
  )

  const pairReading = useMemo(() => {
    if (!selected || !partner || partner.id === selected.id) return null
    const partnerChart = numerologyChart(partner.birth_date, partner.name, todayIso)
    return {
      partnerChart,
      verdict: numerologyCompatibility(
        chart?.lifePath ?? 1,
        partnerChart.lifePath
      ),
    }
  }, [selected, partner, chart, todayIso])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Numerology"
          subtitle="The Pythagorean numbers — every letter and date reduced to its charge"
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
          title="Numerology"
          subtitle="The Pythagorean numbers — every letter and date reduced to its charge"
        />
        <EmptyState
          icon="people"
          title="No people yet"
          description="Add a person with a birth date and their full numerology chart appears here."
          action={{ label: 'Add your first person', href: '/app/people' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Numerology"
        subtitle="The Pythagorean numbers — every letter and date reduced to its charge"
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
        <ChartSections chart={chart} age={ageNow(selected.birth_date)} index={1} />
      )}

      {withDates.length > 1 && selected && (
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
                <span className="font-display text-3xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
                  {chart?.lifePath} × {pairReading.partnerChart.lifePath}
                </span>
                <Pill accent={ACCENT}>{pairReading.verdict.harmony}</Pill>
              </div>
              <p className="mt-2 max-w-[65ch] text-sm text-white/70">
                {pairReading.verdict.note}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {selected.name} is a {chart?.lifePath} · {partner.name} is a{' '}
                {pairReading.partnerChart.lifePath}
              </p>
            </div>
          ) : (
            <p className="text-sm text-white/40">
              Pick a second person to read the pair.
            </p>
          )}
        </PageSection>
      )}
    </div>
  )
}
