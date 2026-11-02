'use client'

import { useMemo, useState } from 'react'
import { NUMBER_MEANINGS, numerologyChart, numerologyCompatibility, type NumerologyChart } from '@pleiad/engine/calculations/numerology'
import { systemArt } from './art'
import s from './systems.module.css'
import { ageOn, listAnd, undash } from './model'
import { FigureCard, PersonPicker, Readout, SelectField, SystemGrid, SystemPage, SystemSection, SystemState, type SystemPageSpec } from './system-page'
import { useToday } from './use-computed'
import { useSystemPeople, type SavedPerson } from './use-system-people'
import site from '../site/site.module.css'
import { routeTitle } from '@/lib/site/routes'

const MASTERS = Object.keys(NUMBER_MEANINGS)
  .map(Number)
  .filter((n) => n > 9)
  .map(String)

export const NUMEROLOGY_SPEC: SystemPageSpec = {
  path: '/app/numerology',
  title: routeTitle('/app/numerology'),
  eyebrow: 'Pythagorean numbers',
  lead: 'Life path, the name numbers and the cycles running now, read from a birth date and a name.',
  reads: `Reads the birth date and the name in Latin letters. Each value reduces to a digit from 1 to 9; ${listAnd(MASTERS)} stay whole as master numbers.`,
  ...systemArt('/app/numerology'),
  article: 'personal-year-calculation',
  guide: null,
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth'] as const

const NO_LATIN = 'Needs a name in Latin letters'

const meaning = (n: number | null): string => (n === null ? NO_LATIN : undash(NUMBER_MEANINGS[n] ?? ''))

const shown = (n: number | null): string => (n === null ? 'None' : String(n))

function Tile({ label, value, text, active = false }: { readonly label: string; readonly value: string; readonly text: string; readonly active?: boolean }) {
  return (
    <div className={`${s.tile} ${active ? s.tileActive : ''}`}>
      <span className={s.tileLabel}>{label}</span>
      <span className={s.tileValue}>{value}</span>
      <span className={s.tileText}>{text}</span>
    </div>
  )
}

function Figure({ chart, age }: { readonly chart: NumerologyChart; readonly age: number }) {
  return (
    <FigureCard label="Life path and cycles">
      <div className={s.hero}>
        <span className={s.big}>{chart.lifePath}</span>
        <div className={s.heroText}>
          <span className={site.label}>Life path</span>
          <span className={s.tileText}>{meaning(chart.lifePath)}</span>
        </div>
      </div>
      <div className={s.tiles}>
        <Tile label="Personal year" value={String(chart.personalYear)} text={meaning(chart.personalYear)} />
        <Tile label="Personal month" value={String(chart.personalMonth)} text={meaning(chart.personalMonth)} />
        <Tile label="Personal day" value={String(chart.personalDay)} text={meaning(chart.personalDay)} />
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <span className={site.label}>Pinnacles, by age</span>
        <div className={s.tiles}>
          {chart.pinnacles.map((p, i) => {
            const active = age >= p.fromAge && (p.toAge === null || age <= p.toAge)
            return (
              <Tile
                key={ORDINALS[i]}
                label={`${p.toAge === null ? `From ${p.fromAge}` : `${p.fromAge} to ${p.toAge}`}${active ? ', now' : ''}`}
                value={String(p.number)}
                text={meaning(p.number)}
                active={active}
              />
            )
          })}
        </div>
      </div>
    </FigureCard>
  )
}

function Pair({ selected, people, today, chart }: { readonly selected: SavedPerson; readonly people: readonly SavedPerson[]; readonly today: string; readonly chart: NumerologyChart }) {
  const [partnerId, setPartnerId] = useState('')
  const others = people.filter((p) => p.person.id !== selected.person.id)
  const partner = others.find((p) => p.person.id === partnerId) ?? null
  const otherPath = partner ? numerologyChart(partner.input.date, partner.person.name, today).lifePath : null
  const reading = otherPath === null ? null : { lifePath: otherPath, verdict: numerologyCompatibility(chart.lifePath, otherPath) }
  if (others.length === 0) return null
  return (
    <SystemSection id="pair" title="With someone" lead="Life path against life path. Master numbers read through their root digit.">
      <div style={{ maxWidth: 320 }}>
        <SelectField
          id="partner"
          label="Read with"
          value={partnerId}
          options={[{ value: '', label: 'Choose a person' }, ...others.map((p) => ({ value: p.person.id, label: p.person.name }))]}
          onChange={setPartnerId}
        />
      </div>
      {reading && partner && (
        <Readout
          title="Pair reading"
          rows={[
            { label: 'Life paths', value: `${selected.person.name} ${chart.lifePath}, ${partner.person.name} ${reading.lifePath}` },
            { label: 'Harmony', value: reading.verdict.harmony.charAt(0).toUpperCase() + reading.verdict.harmony.slice(1), detail: undash(reading.verdict.note) },
          ]}
        />
      )}
    </SystemSection>
  )
}

function Ready({ selected, people, today }: { readonly selected: SavedPerson; readonly people: readonly SavedPerson[]; readonly today: string }) {
  const chart = useMemo(() => numerologyChart(selected.input.date, selected.person.name, today), [selected, today])
  const age = ageOn(selected.input.date, today)
  return (
    <>
      <SystemGrid
        spec={NUMEROLOGY_SPEC}
        figure={<Figure chart={chart} age={age} />}
        side={
          <>
            <Readout
              title="Core numbers"
              rows={[
                { label: 'Life path', value: shown(chart.lifePath), detail: meaning(chart.lifePath) },
                { label: 'Expression', value: shown(chart.expression), detail: meaning(chart.expression) },
                { label: 'Soul urge', value: shown(chart.soulUrge), detail: meaning(chart.soulUrge) },
                { label: 'Personality', value: shown(chart.personality), detail: meaning(chart.personality) },
                { label: 'Maturity', value: shown(chart.maturity), detail: meaning(chart.maturity) },
                { label: 'Birthday', value: shown(chart.birthday), detail: meaning(chart.birthday) },
              ]}
            />
            {chart.expression === null && (
              <p className={s.status}>The name numbers read Latin letters, and {selected.person.name}&rsquo;s saved name has none.</p>
            )}
          </>
        }
      />
      <SystemSection id="challenges" title="Challenges" lead="The four lessons the birth date sets, one per pinnacle.">
        <div className={s.tiles}>
          {chart.challenges.map((c, i) => (
            <Tile key={ORDINALS[i]} label={ORDINALS[i]} value={String(c)} text={meaning(c)} />
          ))}
        </div>
      </SystemSection>
      <Pair selected={selected} people={people} today={today} chart={chart} />
    </>
  )
}

export function NumerologyView({ requested = null }: { readonly requested?: string | null }) {
  const { status, people, selectedId, select } = useSystemPeople('numerology', requested)
  const today = useToday('utc')
  const view = today ? status : ({ kind: 'loading' } as const)
  return (
    <SystemPage spec={NUMEROLOGY_SPEC} picker={status.kind === 'ready' && <PersonPicker people={people} value={selectedId} onChange={select} />}>
      <SystemState spec={NUMEROLOGY_SPEC} status={view} ready={(selected) => today && <Ready selected={selected} people={people} today={today} />} />
    </SystemPage>
  )
}
