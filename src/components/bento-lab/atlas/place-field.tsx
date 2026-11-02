'use client'

import { useRef, useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import site from '../site/site.module.css'
import { birthPlaceOf } from '@/lib/atlas/birth-input'
import { searchPlaces, type PlaceHit } from '@/lib/geo/place-search'
import type { BirthPlace } from '@/lib/atlas/types'

type SearchState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'searching' }
  | { readonly kind: 'results'; readonly hits: readonly PlaceHit[] }
  | { readonly kind: 'error'; readonly message: string }

/** Birth place: type a town, press Enter or Find, pick one. One request per search. */
export function PlaceField({
  id,
  value,
  onChange,
  error,
}: {
  readonly id: string
  readonly value: BirthPlace | null
  readonly onChange: (place: BirthPlace | null) => void
  readonly error?: string
}) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>({ kind: 'idle' })
  const inFlight = useRef<AbortController | null>(null)

  const find = async () => {
    const q = query.trim()
    if (q.length < 2) return
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    setState({ kind: 'searching' })
    try {
      const hits = await searchPlaces(q, controller.signal)
      setState({ kind: 'results', hits })
    } catch (err) {
      if (controller.signal.aborted) return
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Place search failed' })
    }
  }

  if (value) {
    return (
      <div className={site.field}>
        <span className={site.label} id={`${id}-label`}>
          Birth place
        </span>
        <div className={site.chip} style={{ height: 46, borderRadius: 'var(--radius-control)', justifyContent: 'space-between', paddingInline: 14 }} aria-labelledby={`${id}-label`}>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <MapPin size={14} aria-hidden />
            {value.label ?? `${value.lat.toFixed(2)}, ${value.lng.toFixed(2)}`}
          </span>
          <button type="button" onClick={() => onChange(null)} aria-label="Change birth place">
            <X size={14} aria-hidden />
          </button>
        </div>
        {error && <span className={site.error}>{error}</span>}
      </div>
    )
  }

  return (
    <div className={site.field}>
      <label htmlFor={id} className={site.label}>
        Birth place
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={id}
          className={site.input}
          value={query}
          placeholder="Town or city"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void find()
            }
          }}
          aria-describedby={`${id}-hint`}
        />
        <button type="button" className={`${site.btn} ${site.btnSmall}`} style={{ height: 46 }} onClick={() => void find()} disabled={state.kind === 'searching'}>
          <Search size={14} aria-hidden />
          Find
        </button>
      </div>
      <span id={`${id}-hint`} className={site.hint} aria-live="polite">
        {state.kind === 'searching' && 'Searching OpenStreetMap…'}
        {state.kind === 'idle' && 'Needed for the rising sign and the bodygraph.'}
        {state.kind === 'results' && state.hits.length === 0 && 'No match. Try the nearest city.'}
      </span>
      {state.kind === 'error' && <span className={site.error}>{state.message}</span>}
      {state.kind === 'results' && state.hits.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }} aria-label="Matching places">
          {state.hits.map((hit, i) => (
            <li key={`${i}-${hit.label}`}>
              <button
                type="button"
                className={site.chip}
                style={{ width: '100%', height: 'auto', minHeight: 34, padding: '6px 12px', whiteSpace: 'normal', textAlign: 'start', borderRadius: 'var(--radius-control)' }}
                onClick={() => {
                  onChange(birthPlaceOf(hit))
                  setState({ kind: 'idle' })
                  setQuery('')
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
