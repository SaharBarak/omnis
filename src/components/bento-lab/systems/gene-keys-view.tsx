'use client'

import { useCallback } from 'react'
import type { GeneKeysProfile, GeneKeysSequence, GeneKeysSphere } from '@pleiad/engine/calculations/gene-keys'
import { GENE_KEYS } from '@pleiad/engine/data/gene-keys'
import { systemArt } from './art'
import s from './systems.module.css'
import { requiredParts } from './model'
import { FigureCard, GridSkeleton, MissingBirthData, PersonPicker, Readout, SystemGrid, SystemPage, SystemSection, SystemState, type ReadoutRow, type SystemPageSpec } from './system-page'
import { useComputed } from './use-computed'
import { systemInfo, useSystemPeople, type SavedPerson } from './use-system-people'
import { ErrorState } from '../site'
import site from '../site/site.module.css'
import { routeTitle } from '@/lib/site/routes'
import { missingOf } from '@/lib/atlas/app/saved-person'

export const GENE_KEYS_SPEC: SystemPageSpec = {
  path: '/app/gene-keys',
  title: routeTitle('/app/gene-keys'),
  eyebrow: 'Golden Path',
  lead: 'The spheres of the Golden Path, each a gene key with its shadow, gift and siddhi, in three sequences.',
  reads: `Reads the planetary gates of the Human Design chart, so it needs the birth time and place. There are ${GENE_KEYS.length} keys; each sphere carries the line of its activation, 1 to 6.`,
  ...systemArt('/app/gene-keys'),
  article: 'what-is-human-design',
  guide: { slug: 'human-design', label: 'Human Design guide' },
}

const REQUIRED = requiredParts(systemInfo('genekeys'))

const SEQUENCES: readonly { readonly id: GeneKeysSequence; readonly title: string; readonly lead: string }[] = [
  { id: 'activation', title: 'Activation sequence', lead: 'Core purpose, read from the Sun and Earth on both sides of the chart.' },
  { id: 'venus', title: 'Venus sequence', lead: 'The imprints of childhood and the patterns brought to intimacy.' },
  { id: 'pearl', title: 'Pearl sequence', lead: 'Vocation, culture and the pearl that follows service.' },
]

const keyLine = (sphere: GeneKeysSphere): string => `${sphere.geneKey.key}.${sphere.line}`

const rowsOf = (spheres: readonly GeneKeysSphere[]): readonly ReadoutRow[] =>
  spheres.map((sp) => ({
    label: sp.sphere,
    value: `Key ${sp.geneKey.key}, line ${sp.line}`,
    detail: `Shadow ${sp.geneKey.shadow}, gift ${sp.geneKey.gift}, siddhi ${sp.geneKey.siddhi}. ${sp.theme}.`,
  }))

function Figure({ profile }: { readonly profile: GeneKeysProfile }) {
  return (
    <FigureCard label="The Golden Path">
      {SEQUENCES.map((seq) => (
        <div key={seq.id} style={{ display: 'grid', gap: 10 }}>
          <span className={site.label}>{seq.title}</span>
          <div className={s.tiles} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 112px), 1fr))' }}>
            {profile[seq.id].map((sp) => (
              <div key={sp.sphere} className={`${s.tile} ${seq.id === 'activation' ? s.tileActive : ''}`}>
                <span className={s.tileLabel}>{sp.sphere}</span>
                <span className={s.tileValue}>{keyLine(sp)}</span>
                <span className={s.tileText}>{sp.geneKey.gift}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </FigureCard>
  )
}

function Reading({ selected }: { readonly selected: SavedPerson }) {
  const { date, time } = selected.input
  const lat = selected.input.place?.lat
  const lng = selected.input.place?.lng
  const task = useCallback(async (): Promise<GeneKeysProfile | null> => {
    if (!time || lat === undefined || lng === undefined) return null
    const [{ calculateBodygraph }, { geneKeysProfile }] = await Promise.all([import('@pleiad/engine/calculations/human-design'), import('@pleiad/engine/calculations/gene-keys')])
    const chart = calculateBodygraph({ birthDate: date, birthTime: time, latitude: lat, longitude: lng })
    return 'activations' in chart ? geneKeysProfile(chart.activations) : null
  }, [date, time, lat, lng])
  const missing = missingOf(selected.person).filter((m) => REQUIRED.some((r) => r === m))
  const profile = useComputed(missing.length === 0 ? task : null)

  if (missing.length > 0) return <SystemGrid spec={GENE_KEYS_SPEC} figure={<MissingBirthData spec={GENE_KEYS_SPEC} person={selected} missing={missing} />} />
  if (profile.status === 'loading' || profile.status === 'idle') return <GridSkeleton spec={GENE_KEYS_SPEC} rows={4} />
  if (profile.status === 'error' || !profile.value) {
    return (
      <SystemGrid
        spec={GENE_KEYS_SPEC}
        figure={
          <ErrorState
            title="The profile did not compute"
            action={
              <button type="button" className={`${site.btn} ${site.btnSmall}`} onClick={profile.retry}>
                Try again
              </button>
            }
          >
            {profile.status === 'error' ? profile.error : 'The chart returned no activations.'}
          </ErrorState>
        }
      />
    )
  }
  const value = profile.value
  return (
    <>
      <SystemGrid spec={GENE_KEYS_SPEC} figure={<Figure profile={value} />} side={<Readout title="Activation sequence" rows={rowsOf(value.activation)} />} />
      {SEQUENCES.filter((seq) => seq.id !== 'activation').map((seq) => (
        <SystemSection key={seq.id} id={seq.id} title={seq.title} lead={seq.lead}>
          <Readout title={seq.title} rows={rowsOf(value[seq.id])} />
        </SystemSection>
      ))}
    </>
  )
}

export function GeneKeysView({ requested = null }: { readonly requested?: string | null }) {
  const { status, people, selectedId, select } = useSystemPeople('genekeys', requested)
  return (
    <SystemPage spec={GENE_KEYS_SPEC} picker={status.kind === 'ready' && <PersonPicker people={people} value={selectedId} onChange={select} />}>
      <SystemState spec={GENE_KEYS_SPEC} status={status} rows={4} ready={(selected) => <Reading selected={selected} />} />
    </SystemPage>
  )
}
