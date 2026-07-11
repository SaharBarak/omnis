'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CompatSystem } from '@pleiad/engine/services/compatibility'
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

function PairBreakdown({
  selected,
  onClose,
}: {
  selected: SelectedPair | null
  onClose: () => void
}) {
  if (!selected) return null
  const { a, b, pair } = selected

  return (
    <Sheet open={!!selected} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {a.name} × {b.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          <div className="flex items-baseline gap-2">
            <span className="stat-value text-4xl">{pair.overallScore}</span>
            <span className="text-sm text-muted-foreground">/ 100 overall resonance</span>
          </div>

          <div className="space-y-3">
            {SYSTEM_ORDER.map((key) => {
              const sys = pair.systems[key]
              if (!sys) return null
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/90">{SYSTEM_LABELS[key]}</span>
                    {sys.available ? (
                      <span className="text-foreground/70 tabular-nums">
                        {Math.round(sys.score)}
                        <span className="text-foreground/35 ml-1.5 text-xs">
                          w {Math.round(sys.weight * 100)}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-foreground/35 text-xs">no data</span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    {sys.available && (
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, Math.min(100, sys.score))}%`,
                          background: scoreRampStep(sys.score).fill,
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {pair.summary.english}
          </p>
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
          <Skeleton key={i} className="h-9 w-9 rounded-md" />
        ))}
      </div>
      {Array.from({ length: n }).map((_, r) => (
        <div key={r} className="flex gap-2 items-center">
          <Skeleton className="h-4 w-24 rounded" />
          {Array.from({ length: n }).map((_, c) => (
            <Skeleton key={c} className="h-9 w-9 rounded-md" />
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
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          Try again
        </Button>
      </div>
    )
  }

  const people = data?.people ?? []
  if (people.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center gap-4">
        <p className="text-muted-foreground">
          Add at least two people to see the resonance matrix
        </p>
        <Button
          onClick={() => (window.location.href = '/app/people')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          + Add People
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
            className="h-10 flex items-end justify-center pb-1 text-[11px] font-medium text-foreground/70"
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
      <div className="flex items-center gap-2 mt-5 text-xs text-muted-foreground">
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

      <PairBreakdown selected={selected} onClose={() => setSelected(null)} />
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
        className="h-10 flex items-center pr-3 text-sm text-foreground/90 truncate max-w-40"
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
              className="h-10 w-10 rounded-md bg-white/[0.02] border border-white/5"
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
              className="text-[11px] font-semibold tabular-nums opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
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
