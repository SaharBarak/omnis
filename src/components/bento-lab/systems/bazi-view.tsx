'use client'

import { useCallback, useState } from 'react'
import type { BaziChart, BaziElement, LuckPillar, StemBranch } from '@pleiad/engine/calculations/bazi'
import { systemArt } from './art'
import s from './systems.module.css'
import { undash } from './model'
import { FigureCard, GridSkeleton, PersonPicker, Readout, Segmented, SelectField, SystemGrid, SystemPage, SystemSection, SystemState, type SystemPageSpec } from './system-page'
import { useComputed, useToday } from './use-computed'
import { useSystemPeople, type SavedPerson } from './use-system-people'
import { ErrorState } from '../site'
import site from '../site/site.module.css'
import { routeTitle } from '@/lib/site/routes'

export const BAZI_SPEC: SystemPageSpec = {
  path: '/app/bazi',
  title: routeTitle('/app/bazi'),
  eyebrow: 'Four pillars',
  lead: 'Year, month, day and hour as stem and branch, the day master at the centre, and the ten-year pillars that follow.',
  reads: 'Reads the birth date and hour. Each pillar pairs a heavenly stem with an earthly branch, and the year turns at Li Chun, the solar term near 4 February.',
  ...systemArt('/app/bazi'),
  article: 'bazi-day-master',
  guide: null,
}

const ELEMENTS: readonly BaziElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water']

const ANNUAL_YEARS = 5

type Direction = 'male' | 'female'

const DIRECTIONS: readonly { readonly id: Direction; readonly label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
]

interface BaziReading {
  readonly chart: BaziChart
  readonly luck: Readonly<Record<Direction, readonly LuckPillar[]>>
  readonly annuals: readonly { readonly year: number; readonly pillar: StemBranch }[]
}

const stemLabel = (p: StemBranch): string => `${p.polarity} ${p.element}`
const pillarName = (p: StemBranch): string => `${p.stemName} ${p.branchName}`
const pillarDetail = (p: StemBranch): string => `${p.polarity} ${p.element} ${p.animal}`
const el = (e: BaziElement): string => s[`el-${e}`] ?? ''

function PillarColumn({ label, pillar, center = false }: { readonly label: string; readonly pillar: StemBranch | null; readonly center?: boolean }) {
  return (
    <div className={`${s.pillar} ${center ? s.pillarCenter : ''}`}>
      <span className={s.pillarLabel}>{center ? 'Day master' : label}</span>
      {pillar ? (
        <>
          <div className={`${s.cell} ${el(pillar.element)}`}>
            <span className={s.cellBig}>{pillar.stemName}</span>
            <span className={s.cellSmall}>{stemLabel(pillar)}</span>
          </div>
          <div className={`${s.cell} ${el(pillar.branchElement)}`}>
            <span className={s.cellBig}>{pillar.animal}</span>
            <span className={s.cellSmall}>
              {pillar.branchName}, {pillar.branchElement}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className={`${s.cell} ${s.cellEmpty}`}>
            <span className={s.cellSmall}>No birth time</span>
          </div>
          <div className={`${s.cell} ${s.cellEmpty}`} aria-hidden />
        </>
      )}
    </div>
  )
}

function Figure({ chart }: { readonly chart: BaziChart }) {
  const max = Math.max(1, ...ELEMENTS.map((e) => chart.elementCounts[e]))
  return (
    <FigureCard label="The four pillars">
      <div className={s.pillars}>
        <PillarColumn label="Hour" pillar={chart.hour} />
        <PillarColumn label="Day" pillar={chart.day} center />
        <PillarColumn label="Month" pillar={chart.month} />
        <PillarColumn label="Year" pillar={chart.year} />
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <span className={site.label}>Five elements across stems and branches</span>
        <ul className={s.bars}>
          {ELEMENTS.map((e) => (
            <li key={e} className={`${s.bar} ${el(e)}`}>
              <span>{e}</span>
              <span className={s.track}>
                <span className={s.fill} style={{ display: 'block', width: `${Math.round((chart.elementCounts[e] / max) * 100)}%` }} />
              </span>
              <span className={s.num}>{chart.elementCounts[e]}</span>
            </li>
          ))}
        </ul>
      </div>
    </FigureCard>
  )
}

function Pair({ selected, people, chart }: { readonly selected: SavedPerson; readonly people: readonly SavedPerson[]; readonly chart: BaziChart }) {
  const [partnerId, setPartnerId] = useState('')
  const others = people.filter((p) => p.person.id !== selected.person.id)
  const partner = others.find((p) => p.person.id === partnerId) ?? null
  const task = useCallback(async () => {
    if (!partner) return null
    const { baziChart, baziBranchCompatibility } = await import('@pleiad/engine/calculations/bazi')
    const other = baziChart(partner.input.date, partner.input.time)
    return { other, verdict: baziBranchCompatibility(chart.year.branch, other.year.branch) }
  }, [partner, chart.year.branch])
  const reading = useComputed(partner ? task : null)
  if (others.length === 0) return null
  return (
    <SystemSection id="pair" title="With someone" lead="Year branch against year branch: a trine, a six harmony, a clash or neutral.">
      <div style={{ maxWidth: 320 }}>
        <SelectField
          id="partner"
          label="Read with"
          value={partnerId}
          options={[{ value: '', label: 'Choose a person' }, ...others.map((p) => ({ value: p.person.id, label: p.person.name }))]}
          onChange={setPartnerId}
        />
      </div>
      {reading.status === 'ready' && reading.value && partner && (
        <Readout
          title="Pair reading"
          rows={[
            { label: 'Year animals', value: `${selected.person.name} ${chart.year.animal}, ${partner.person.name} ${reading.value.other.year.animal}` },
            { label: 'Relation', value: reading.value.verdict.relation.charAt(0).toUpperCase() + reading.value.verdict.relation.slice(1), detail: undash(reading.value.verdict.note) },
          ]}
        />
      )}
    </SystemSection>
  )
}

function Reading({ selected, people, year }: { readonly selected: SavedPerson; readonly people: readonly SavedPerson[]; readonly year: number }) {
  const [direction, setDirection] = useState<Direction>('male')
  const { date, time } = selected.input
  const task = useCallback(async (): Promise<BaziReading> => {
    const { baziChart, luckPillars, annualPillar } = await import('@pleiad/engine/calculations/bazi')
    return {
      chart: baziChart(date, time),
      luck: { male: luckPillars(date, 'male'), female: luckPillars(date, 'female') },
      annuals: Array.from({ length: ANNUAL_YEARS }, (_, i) => ({ year: year + i, pillar: annualPillar(year + i) })),
    }
  }, [date, time, year])
  const reading = useComputed(task)

  if (reading.status === 'loading' || reading.status === 'idle') return <GridSkeleton spec={BAZI_SPEC} />
  if (reading.status === 'error') {
    return (
      <SystemGrid
        spec={BAZI_SPEC}
        figure={
          <ErrorState
            title="The chart did not compute"
            action={
              <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={reading.retry}>
                Try again
              </button>
            }
          >
            {reading.error}
          </ErrorState>
        }
      />
    )
  }
  const { chart, luck, annuals } = reading.value
  const name = selected.person.name
  return (
    <>
      <SystemGrid
        spec={BAZI_SPEC}
        figure={<Figure chart={chart} />}
        side={
          <>
            <Readout
              title="The chart"
              rows={[
                { label: 'Day master', value: chart.dayMaster.name, detail: `${chart.dayMaster.polarity} ${chart.dayMaster.element}. The self the rest of the chart is read against.` },
                { label: 'Year', value: pillarName(chart.year), detail: pillarDetail(chart.year) },
                { label: 'Month', value: pillarName(chart.month), detail: pillarDetail(chart.month) },
                { label: 'Day', value: pillarName(chart.day), detail: pillarDetail(chart.day) },
                { label: 'Hour', value: chart.hour ? pillarName(chart.hour) : 'Unknown', detail: chart.hour ? pillarDetail(chart.hour) : `Add a birth time to ${name}'s record to complete the chart.` },
              ]}
            />
          </>
        }
      />
      <SystemSection
        id="luck"
        title="Ten-year pillars"
        lead="They run forward for yang-year males and yin-year females, backward otherwise. Saved people carry no gender, so pick the direction that applies."
        actions={<Segmented label="Direction" options={DIRECTIONS} value={direction} onChange={setDirection} />}
      >
        <div className={s.tiles}>
          {luck[direction].map((d) => (
            <div key={d.startAge} className={`${s.tile} ${el(d.element)}`} style={{ borderTop: '3px solid var(--el)' }}>
              <span className={s.tileLabel}>
                Ages {d.startAge} to {d.endAge}
              </span>
              <span className={s.cellBig}>{pillarName(d)}</span>
              <span className={s.tileText}>{pillarDetail(d)}</span>
            </div>
          ))}
        </div>
      </SystemSection>
      <SystemSection id="annual" title="Year pillars" lead="Each runs from Li Chun, near 4 February, to the next.">
        <Readout columns title="Year pillars" rows={annuals.map(({ year: y, pillar }) => ({ label: String(y), value: pillarName(pillar), detail: pillarDetail(pillar) }))} />
      </SystemSection>
      <Pair selected={selected} people={people} chart={chart} />
    </>
  )
}

export function BaziView({ requested = null }: { readonly requested?: string | null }) {
  const { status, people, selectedId, select } = useSystemPeople('bazi', requested)
  const today = useToday('utc')
  const view = today ? status : ({ kind: 'loading' } as const)
  return (
    <SystemPage spec={BAZI_SPEC} picker={status.kind === 'ready' && <PersonPicker people={people} value={selectedId} onChange={select} />}>
      <SystemState spec={BAZI_SPEC} status={view} ready={(selected) => today && <Reading selected={selected} people={people} year={Number(today.slice(0, 4))} />} />
    </SystemPage>
  )
}
