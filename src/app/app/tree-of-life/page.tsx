'use client'

import { useMemo, useState } from 'react'
import {
  SEFIRAH_BY_ID,
  SEFIROT,
  TREE_PATHS,
  type Sefirah,
  type TreePath,
} from '@pleiad/engine/data/tree-of-life'
import { LETTER_BY_ID } from '@pleiad/engine/data/hebrew-letters'
import { PageHeader } from '@/components/dashboard'
import { DataRow, PageSection, Pill, getFlavor } from '@/components/app-kit'
import { cn } from '@/lib/utils'

/**
 * Tree of Life (#76) — the ten sefirot and twenty-two lettered paths as an
 * interactive figure: tap a sefirah or a path and the panel reads it. The
 * letters ride the existing gematria data, so every path links its letter's
 * values and keywords.
 */

const FLAVOR = getFlavor('gematria')

const PILLAR_LABELS = {
  severity: 'Pillar of Severity',
  equilibrium: 'Middle Pillar',
  mercy: 'Pillar of Mercy',
} as const

type Selection =
  | { kind: 'sefirah'; sefirah: Sefirah }
  | { kind: 'path'; path: TreePath }
  | null

function TreeFigure({
  selection,
  onSelect,
}: {
  selection: Selection
  onSelect: (next: Selection) => void
}) {
  const selectedSefirah = selection?.kind === 'sefirah' ? selection.sefirah.id : null
  const selectedPath = selection?.kind === 'path' ? selection.path.number : null

  return (
    <svg
      viewBox="0 0 100 132"
      role="group"
      aria-label="Tree of Life diagram"
      className="mx-auto w-full max-w-[420px]"
    >
      {TREE_PATHS.map((path) => {
        const a = SEFIRAH_BY_ID[path.from]
        const b = SEFIRAH_BY_ID[path.to]
        const letter = LETTER_BY_ID[path.letterId]
        const active = selectedPath === path.number
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        return (
          <g key={path.number}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={active ? FLAVOR.accent : 'rgba(255,255,255,0.18)'}
              strokeWidth={active ? 1.1 : 0.6}
            />
            {/* fat invisible hit line */}
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="transparent"
              strokeWidth={3.4}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`Path ${path.number}, letter ${letter.name}`}
              onClick={() => onSelect({ kind: 'path', path })}
            />
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="3.2"
              fill={active ? FLAVOR.accent : 'rgba(255,255,255,0.45)'}
              style={{ pointerEvents: 'none' }}
            >
              {letter.letter}
            </text>
          </g>
        )
      })}

      {SEFIROT.map((s) => {
        const active = selectedSefirah === s.id
        return (
          <g
            key={s.id}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`${s.name} — ${s.translation}`}
            onClick={() => onSelect({ kind: 'sefirah', sefirah: s })}
          >
            <circle
              cx={s.x}
              cy={s.y}
              r={6.4}
              fill={active ? 'rgba(212,175,55,0.25)' : 'rgba(11,13,22,0.92)'}
              stroke={active ? FLAVOR.accent : 'rgba(255,255,255,0.35)'}
              strokeWidth={active ? 0.9 : 0.5}
            />
            <text
              x={s.x}
              y={s.y - 0.9}
              textAnchor="middle"
              fontSize="2.6"
              fill="rgba(255,255,255,0.85)"
              style={{ pointerEvents: 'none' }}
            >
              {s.hebrew}
            </text>
            <text
              x={s.x}
              y={s.y + 2.6}
              textAnchor="middle"
              fontSize="1.9"
              fill="rgba(255,255,255,0.5)"
              style={{ pointerEvents: 'none' }}
            >
              {s.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function SelectionPanel({ selection }: { selection: Selection }) {
  if (!selection) {
    return (
      <p className="text-sm text-white/50">
        Tap a sefirah or a path — every circle is a station of emanation,
        every line one of the twenty-two letters.
      </p>
    )
  }

  if (selection.kind === 'sefirah') {
    const s = selection.sefirah
    return (
      <div className="surface-card p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight text-brand-bright">
            {s.hebrew} {s.name}
          </span>
          <Pill accent={FLAVOR.accent}>{s.number}</Pill>
        </div>
        <DataRow label="Translation" value={s.translation} />
        <DataRow label="Pillar" value={PILLAR_LABELS[s.pillar]} />
        <DataRow label="Meaning" value={s.meaning} last />
      </div>
    )
  }

  const path = selection.path
  const letter = LETTER_BY_ID[path.letterId]
  const from = SEFIRAH_BY_ID[path.from]
  const to = SEFIRAH_BY_ID[path.to]
  return (
    <div className="surface-card p-5">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl tracking-tight text-brand-bright">
          {letter.letter} {letter.name}
        </span>
        <Pill accent={FLAVOR.accent}>path {path.number}</Pill>
      </div>
      <DataRow label="Connects" value={`${from.name} ↔ ${to.name}`} />
      <DataRow label="Gematria" value={String(letter.standardValue)} />
      <DataRow label="Keywords" value={letter.keywords.join(' · ')} last />
    </div>
  )
}

export default function TreeOfLifePage() {
  const [selection, setSelection] = useState<Selection>(null)

  const pillars = useMemo(
    () =>
      (['mercy', 'equilibrium', 'severity'] as const).map((pillar) => ({
        pillar,
        sefirot: SEFIROT.filter((s) => s.pillar === pillar),
      })),
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tree of Life"
        subtitle="Ten sefirot, twenty-two lettered paths — the map of emanation"
      />

      <PageSection index={0} accent={FLAVOR.accent} eyebrow="The tree">
        <div className="grid gap-6 lg:grid-cols-[1fr,minmax(280px,0.8fr)]">
          <div className="feature-card p-4 md:p-6">
            <TreeFigure selection={selection} onSelect={setSelection} />
          </div>
          <div className="lg:pt-2">
            <SelectionPanel selection={selection} />
          </div>
        </div>
        <p className="mt-3 max-w-[65ch] text-xs text-white/40">
          Path-letter placement follows the Kircher tree, the most widely
          illustrated arrangement; Jewish trees (the GRA and Ari arrangements)
          draw several paths differently. The sefirot and pillars are common
          to all.
        </p>
      </PageSection>

      <PageSection index={1} accent={FLAVOR.accent} eyebrow="Emanation">
        <div className="max-w-[65ch] space-y-3">
          <p className="text-sm leading-relaxed text-white/70">
            In Kabbalah, creation is not an event but a flow: the infinite
            (Ein Sof) pours through ten vessels — the sefirot — each refracting
            the light into a more particular register, from the first stirring
            of will (Keter) down to the manifest world (Malkhut).
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            The tree also reads as a map of the person: the right pillar gives,
            the left restrains, and the middle reconciles. A life leaning too
            far into kindness dissolves; too far into severity, it hardens.
            The work is the middle.
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            Between Binah and Chesed the tradition places Da&rsquo;at —
            knowledge — not a sefirah but the invisible point where
            understanding becomes lived. It is drawn as an absence on purpose.
          </p>
        </div>
      </PageSection>

      <PageSection index={2} accent={FLAVOR.accent} eyebrow="The three pillars">
        <div className="grid gap-3 md:grid-cols-3">
          {pillars.map(({ pillar, sefirot }) => (
            <div key={pillar} className="surface-card p-5">
              <div className="mb-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                {PILLAR_LABELS[pillar]}
              </div>
              {sefirot.map((s, i) => (
                <DataRow
                  key={s.id}
                  label={`${s.number} · ${s.name}`}
                  value={s.translation}
                  last={i === sefirot.length - 1}
                />
              ))}
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection index={3} accent={FLAVOR.accent} eyebrow="The letters on the tree">
        <div className="surface-card p-5">
          {TREE_PATHS.map((p, i) => {
            const letter = LETTER_BY_ID[p.letterId]
            return (
              <DataRow
                key={p.number}
                label={`${p.number} · ${letter.letter} ${letter.name}`}
                value={`${SEFIRAH_BY_ID[p.from].name} ↔ ${SEFIRAH_BY_ID[p.to].name}`}
                detail={letter.keywords.join(' · ')}
                last={i === TREE_PATHS.length - 1}
              />
            )
          })}
        </div>
        <p className={cn('mt-2 text-xs text-white/35')}>
          The same letters Pleiad reads names with — each path carries its
          gematria value into the tree.
        </p>
      </PageSection>
    </div>
  )
}
