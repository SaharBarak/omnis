'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { CompatSystem } from '@pleiad/engine/services/compatibility'
import type { Bodygraph } from '@pleiad/engine/types/human-design'
import {
  calculateBodygraph,
  isCompleteBodygraph,
} from '@pleiad/engine/calculations/human-design'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CompositeBodygraphChart } from '@/components/human-design/CompositeBodygraphChart'
import {
  DataRow,
  Eyebrow,
  MeterBar,
  PageSection,
  getFlavor,
  useCountUp,
} from '@/components/app-kit'
import { usePeople, type Person } from '@/lib/hooks/use-people'
import {
  MATRIX_RAMP,
  type MatrixPairScore,
  scoreRampStep,
  sortPair,
} from '@/lib/services/resonance-matrix'

/**
 * Resonance Matrix — N×N five-system compatibility heatmap, the second view
 * mode of /app/graph. Data comes from GET /api/compatibility/matrix (server
 * computes + caches pairwise scores); cells climb the brand-violet ramp with
 * resonance, and clicking a cell opens the per-system breakdown sheet.
 */

interface MatrixPerson {
  id: string
  name: string
  hebrew_name: string | null
  is_self: boolean
}

interface MatrixResponse {
  people: MatrixPerson[]
  pairs: MatrixPairScore[]
  meta: { pairCount: number; cachedCount: number; computedCount: number }
}

const SYSTEM_ORDER: CompatSystem[] = [
  'dreamspell',
  'tzolkin',
  'astrology',
  'humanDesign',
  'gematria',
]

const SYSTEM_LABELS: Record<CompatSystem, string> = {
  dreamspell: 'Dreamspell',
  tzolkin: 'Tzolkin',
  astrology: 'Astrology',
  humanDesign: 'Human Design',
  gematria: 'Gematria',
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

interface SelectedPair {
  a: MatrixPerson
  b: MatrixPerson
  pair: MatrixPairScore
}

/** Full bodygraph from a person row, or null when time/place are missing. */
function personBodygraph(person: Person | undefined): Bodygraph | null {
  if (
    !person?.birth_time ||
    typeof person.birth_place?.lat !== 'number' ||
    typeof person.birth_place?.lng !== 'number'
  ) {
    return null
  }
  const result = calculateBodygraph({
    birthDate: person.birth_date,
    birthTime: person.birth_time,
    latitude: person.birth_place.lat,
    longitude: person.birth_place.lng,
  })
  return isCompleteBodygraph(result) ? result : null
}

/** Big counted numeral for the pair's overall resonance. */
function OverallResonance({ value }: { value: number }) {
  const [ref, counted] = useCountUp(value)
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className="flex items-baseline gap-3">
      <span className="font-display text-4xl tracking-tight text-brand-bright [font-variant-numeric:tabular-nums]">
        {counted}
      </span>
      <Eyebrow>/ 100 overall resonance</Eyebrow>
    </div>
  )
}

/**
 * The "why" behind the score — MAPS_ROADMAP #2 pair mode. Overlays the two
 * bodygraphs with channels colored by connection type; falls back to a short
 * note when either chart lacks birth time or place.
 */
function CompositeSection({
  a,
  b,
  personsById,
}: {
  a: MatrixPerson
  b: MatrixPerson
  personsById: Map<string, Person>
}) {
  const bgA = useMemo(() => personBodygraph(personsById.get(a.id)), [personsById, a.id])
  const bgB = useMemo(() => personBodygraph(personsById.get(b.id)), [personsById, b.id])

  return (
    <PageSection
      index={1}
      accent={getFlavor('humanDesign').accent}
      eyebrow="Composite bodygraph"
    >
      {bgA && bgB ? (
        <CompositeBodygraphChart
          personA={{ name: a.name, bodygraph: bgA }}
          personB={{ name: b.name, bodygraph: bgB }}
        />
      ) : (
        <p className="text-xs leading-relaxed text-white/50">
          Needs an exact birth time and place for both people. Missing for{' '}
          {[!bgA && a.name, !bgB && b.name].filter(Boolean).join(' and ')}.
        </p>
      )}
    </PageSection>
  )
}

function PairBreakdown({
  selected,
  onClose,
  personsById,
}: {
  selected: SelectedPair | null
  onClose: () => void
  personsById: Map<string, Person>
}) {
  if (!selected) return null
  const { a, b, pair } = selected

  return (
    <Sheet open={!!selected} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:w-96 sm:max-w-96">
        <SheetHeader>
          <SheetTitle className="font-display">
            {a.name} × {b.name}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-8">
          <OverallResonance value={pair.overallScore} />

          <PageSection index={0} accent={getFlavor('integration').accent} eyebrow="By system">
            <div className="flex flex-col gap-3">
              {SYSTEM_ORDER.map((key) => {
                const sys = pair.systems[key]
                if (!sys) return null
                if (!sys.available) {
                  return (
                    <DataRow
                      key={key}
                      label={SYSTEM_LABELS[key]}
                      value={<span className="text-xs text-white/35">no data</span>}
                      last
                      className="py-1"
                    />
                  )
                }
                return (
                  <div key={key} className="flex items-center gap-3">
                    <MeterBar
                      className="min-w-0 flex-1"
                      label={SYSTEM_LABELS[key]}
                      value={Math.round(sys.score)}
                      accent={getFlavor(key).accent}
                    />
                    <span
                      className="w-10 shrink-0 text-right text-[11px] text-white/35 [font-variant-numeric:tabular-nums]"
                      title={`Weight ${Math.round(sys.weight * 100)}%`}
                    >
                      {Math.round(sys.weight * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-sm leading-relaxed text-white/70">
              {pair.summary.english}
            </p>
          </PageSection>

          <CompositeSection a={a} b={b} personsById={personsById} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MatrixSkeleton() {
  const n = 6
  return (
    <div className="p-6 space-y-3" aria-hidden data-testid="matrix-skeleton">
      <div className="flex gap-2">
        <div className="w-24" />
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-9 w-9 rounded-md" />
        ))}
      </div>
      {Array.from({ length: n }).map((_, r) => (
        <div key={r} className="flex gap-2 items-center">
          <div className="skeleton-shimmer h-4 w-24 rounded" />
          {Array.from({ length: n }).map((_, c) => (
            <div key={c} className="skeleton-shimmer h-9 w-9 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ResonanceMatrix() {
  const [data, setData] = useState<MatrixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SelectedPair | null>(null)
  // Full person rows (birth data) power the composite bodygraph drill-down.
  const { people: fullPeople } = usePeople()
  const personsById = useMemo(
    () => new Map<string, Person>(fullPeople.map((p) => [p.id, p])),
    [fullPeople]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/compatibility/matrix', { credentials: 'include' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || `Request failed: ${res.status}`)
      }
      setData(body as MatrixResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the matrix')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pairMap = useMemo(() => {
    const map = new Map<string, MatrixPairScore>()
    for (const pair of data?.pairs ?? []) {
      map.set(`${pair.p1}:${pair.p2}`, pair)
    }
    return map
  }, [data])

  const handleCellClick = useCallback(
    (a: MatrixPerson, b: MatrixPerson) => {
      const [lo, hi] = sortPair(a.id, b.id)
      const pair = pairMap.get(`${lo}:${hi}`)
      if (pair) setSelected({ a, b, pair })
    },
    [pairMap]
  )

  if (loading) return <MatrixSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center gap-4">
        <p className="text-sm text-white/50">{error}</p>
        <Button variant="outline" size="sm" onClick={load} className="rounded-xl">
          Try again
        </Button>
      </div>
    )
  }

  const people = data?.people ?? []
  if (people.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center gap-4">
        <p className="text-sm text-white/50">
          Add at least two people to see the resonance matrix
        </p>
        <Button
          onClick={() => (window.location.href = '/app/people')}
          className="rounded-xl bg-brand text-white hover:bg-brand-soft active:scale-[0.98]"
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Add people
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div
        className="grid gap-1 w-max"
        style={{
          gridTemplateColumns: `minmax(5.5rem, auto) repeat(${people.length}, 2.5rem)`,
        }}
        role="grid"
        aria-label="Resonance matrix"
      >
        {/* Header row */}
        <div />
        {people.map((p) => (
          <div
            key={`col-${p.id}`}
            className="h-10 flex items-end justify-center pb-1 text-[11px] text-white/70"
            title={p.is_self ? `${p.name} · You` : p.name}
          >
            {initials(p.name)}
          </div>
        ))}

        {/* Body rows */}
        {people.map((row) => (
          <RowCells
            key={`row-${row.id}`}
            row={row}
            people={people}
            pairMap={pairMap}
            onCellClick={handleCellClick}
          />
        ))}
      </div>

      {/* Ramp legend */}
      <div className="flex items-center gap-2 mt-5 text-xs text-white/50">
        <span>Low</span>
        <div className="flex gap-0.5">
          {MATRIX_RAMP.map((step) => (
            <span
              key={step.min}
              className="h-2.5 w-6 rounded-sm"
              style={{ background: step.fill }}
            />
          ))}
        </div>
        <span>High resonance</span>
      </div>

      <PairBreakdown
        selected={selected}
        onClose={() => setSelected(null)}
        personsById={personsById}
      />
    </div>
  )
}

function RowCells({
  row,
  people,
  pairMap,
  onCellClick,
}: {
  row: MatrixPerson
  people: MatrixPerson[]
  pairMap: Map<string, MatrixPairScore>
  onCellClick: (a: MatrixPerson, b: MatrixPerson) => void
}) {
  return (
    <>
      <div
        className="h-10 flex items-center pr-3 text-sm text-white/90 truncate max-w-40"
        title={row.name}
      >
        {row.name}
        {row.is_self && <span className="ml-1.5 text-xs text-primary">You</span>}
      </div>
      {people.map((col) => {
        if (col.id === row.id) {
          return (
            <div
              key={`${row.id}-${col.id}`}
              className="h-10 w-10 rounded-md bg-white/[0.02] border border-white/[0.07]"
              aria-hidden
            />
          )
        }
        const [lo, hi] = sortPair(row.id, col.id)
        const pair = pairMap.get(`${lo}:${hi}`)
        if (!pair) {
          return <div key={`${row.id}-${col.id}`} className="h-10 w-10 rounded-md bg-white/[0.03]" />
        }
        const step = scoreRampStep(pair.overallScore)
        return (
          <button
            key={`${row.id}-${col.id}`}
            type="button"
            className="group h-10 w-10 rounded-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            style={{ background: step.fill }}
            onClick={() => onCellClick(row, col)}
            aria-label={`${row.name} and ${col.name}: ${pair.overallScore} resonance`}
            title={`${row.name} × ${col.name} — ${pair.overallScore}`}
          >
            <span
              className="text-[11px] font-semibold [font-variant-numeric:tabular-nums] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
              style={{ color: step.text }}
            >
              {pair.overallScore}
            </span>
          </button>
        )
      })}
    </>
  )
}
