'use client'

import { useState, type KeyboardEvent } from 'react'
import { LETTER_BY_ID } from '@pleiad/engine/data/hebrew-letters'
import { SEFIRAH_BY_ID, SEFIROT, TREE_PATHS, type Pillar } from '@pleiad/engine/data/tree-of-life'
import { systemArt } from './art'
import s from './systems.module.css'
import { undash } from './model'
import { FigureCard, Readout, SystemGrid, SystemPage, SystemSection, type ReadoutRow, type SystemPageSpec } from './system-page'
import site from '../site/site.module.css'
import { routeTitle } from '@/lib/site/routes'

export const TREE_SPEC: SystemPageSpec = {
  path: '/app/tree-of-life',
  title: routeTitle('/app/tree-of-life'),
  eyebrow: 'Kabbalah',
  lead: `${SEFIROT.length} sefirot on three pillars and ${TREE_PATHS.length} lettered paths between them. Pick a circle or a line to read it.`,
  reads: `A fixed map with no birth data. Each of the ${TREE_PATHS.length} paths carries one Hebrew letter, and each letter carries its gematria value.`,
  ...systemArt('/app/tree-of-life'),
  article: 'gematria-basics',
  guide: { slug: 'gematria', label: 'Gematria guide' },
}

const PILLARS: readonly { readonly id: Pillar; readonly label: string }[] = [
  { id: 'mercy', label: 'Pillar of Mercy' },
  { id: 'equilibrium', label: 'Middle Pillar' },
  { id: 'severity', label: 'Pillar of Severity' },
]

const pillarLabel = (p: Pillar): string => PILLARS.find((x) => x.id === p)?.label ?? p

type Selection = { readonly kind: 'sefirah'; readonly id: string } | { readonly kind: 'path'; readonly number: number }

const pressKeys = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  fn()
}

function TreeFigure({ selection, onSelect }: { readonly selection: Selection; readonly onSelect: (next: Selection) => void }) {
  return (
    <svg viewBox="0 0 100 132" className={s.tree} role="group" aria-label="Tree of Life">
      {TREE_PATHS.map((path) => {
        const a = SEFIRAH_BY_ID[path.from]
        const b = SEFIRAH_BY_ID[path.to]
        const letter = LETTER_BY_ID[path.letterId]
        const select = () => onSelect({ kind: 'path', number: path.number })
        return (
          <g
            key={path.number}
            className={s.treePath}
            role="button"
            tabIndex={0}
            aria-pressed={selection.kind === 'path' && selection.number === path.number}
            aria-label={`Path ${path.number}, ${letter.name}, ${a.name} to ${b.name}`}
            onClick={select}
            onKeyDown={pressKeys(select)}
          >
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={s.hit} />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} fontSize="3.2" textAnchor="middle" dominantBaseline="central" fill="var(--lab-text-3)" pointerEvents="none">
              {letter.letter}
            </text>
          </g>
        )
      })}
      {SEFIROT.map((sef) => {
        const select = () => onSelect({ kind: 'sefirah', id: sef.id })
        return (
          <g
            key={sef.id}
            className={s.sefirah}
            role="button"
            tabIndex={0}
            aria-pressed={selection.kind === 'sefirah' && selection.id === sef.id}
            aria-label={`${sef.number}, ${sef.name}, ${sef.translation}`}
            onClick={select}
            onKeyDown={pressKeys(select)}
          >
            <circle cx={sef.x} cy={sef.y} r={6.4} />
            <text x={sef.x} y={sef.y - 1} fontSize="2.8">
              {sef.hebrew}
            </text>
            <text x={sef.x} y={sef.y + 2.6} fontSize="1.9" className={s.sefirahName}>
              {sef.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function selectionRows(selection: Selection): readonly ReadoutRow[] {
  if (selection.kind === 'sefirah') {
    const sef = SEFIRAH_BY_ID[selection.id]
    return [
      { label: 'Sefirah', value: `${sef.number}. ${sef.name} ${sef.hebrew}` },
      { label: 'Translation', value: sef.translation },
      { label: 'Pillar', value: pillarLabel(sef.pillar) },
      { label: 'Meaning', value: undash(sef.meaning) },
    ]
  }
  const path = TREE_PATHS.find((p) => p.number === selection.number) ?? TREE_PATHS[0]
  const letter = LETTER_BY_ID[path.letterId]
  return [
    { label: 'Path', value: String(path.number) },
    { label: 'Letter', value: `${letter.letter} ${letter.name}` },
    { label: 'Connects', value: `${SEFIRAH_BY_ID[path.from].name} and ${SEFIRAH_BY_ID[path.to].name}` },
    { label: 'Gematria', value: String(letter.standardValue) },
    { label: 'Keywords', value: letter.keywords.join(', ') },
  ]
}

export function TreeView() {
  const [selection, setSelection] = useState<Selection>({ kind: 'sefirah', id: SEFIROT[0].id })
  return (
    <SystemPage spec={TREE_SPEC}>
      <SystemGrid
        spec={TREE_SPEC}
        figure={
          <FigureCard label="Tree of Life diagram">
            <TreeFigure selection={selection} onSelect={setSelection} />
            <p className={s.status} style={{ margin: 0 }}>
              Path letters follow the Kircher tree, the arrangement most books draw. The GRA and Ari trees run several paths between other sefirot; the sefirot and pillars are common to all.
            </p>
          </FigureCard>
        }
        side={<Readout title="Selected" rows={selectionRows(selection)} />}
      />
      <SystemSection id="pillars" title="The three pillars" lead="The right pillar gives, the left restrains, the middle reconciles the two.">
        <div className={s.tiles} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
          {PILLARS.map((p) => (
            <div key={p.id} style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <span className={site.label}>{p.label}</span>
              <Readout title={p.label} rows={SEFIROT.filter((sef) => sef.pillar === p.id).map((sef) => ({ label: `${sef.number}. ${sef.name}`, value: sef.translation }))} />
            </div>
          ))}
        </div>
      </SystemSection>
      <SystemSection id="letters" title="The letters on the tree" lead="Each path, its letter and the letter's value.">
        <Readout
          columns
          title="Paths"
          rows={TREE_PATHS.map((p) => {
            const letter = LETTER_BY_ID[p.letterId]
            return { label: `Path ${p.number}`, value: `${letter.letter} ${letter.name}, ${letter.standardValue}`, detail: `${SEFIRAH_BY_ID[p.from].name} and ${SEFIRAH_BY_ID[p.to].name}` }
          })}
        />
      </SystemSection>
    </SystemPage>
  )
}
