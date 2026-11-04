'use client'

import { useEffect, useId, useReducer, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import s from './atlas.module.css'
import { IDLE, inspect } from './inspect'
import { MarkCard } from './mark-card'
import { placeMarks, type PlacedMark } from './mark-geometry'
import { holds, MarkTargets } from './mark-targets'
import { LayerSwitch } from './layer-switch'
import { NumberStrip } from './number-strip'
import { PersonAtlasDrawing, type MarkHighlight } from './person-atlas'
import { PinLayer } from './pin-layer'
import { atlasPins } from './pins'
import { useExplain } from './use-explain'
import { useGrace } from './use-grace'
import kit from '../kit.module.css'
import { useTurn } from '../motion/use-turn'
import { LAYER_META } from '@/lib/atlas/layers'
import { markKey, markTitle, relatedMarks, type AtlasMarkRef } from '@/lib/atlas/marks'
import type { AtlasLayerId, PersonAtlas } from '@/lib/atlas/types'
import type { ComputeStatus } from '@/lib/hooks/use-deferred-compute'

export interface StageStatus {
  readonly status: ComputeStatus
  readonly error: string | null
}

/** The status pill every stage shows: drawing, failed, or what the drawing knows. */
export function StageBadge({ status, error, idle }: StageStatus & { readonly idle: string }) {
  const busy = status === 'loading'
  return (
    <span className={`${s.badge} ${kit.glass}`} role="status" aria-live="polite">
      {busy && <span className={s.badgeDot} aria-hidden />}
      {busy ? 'Drawing' : error ? `Could not draw: ${error}` : idle}
    </span>
  )
}

/** How far each ring's content is turned (maths degrees): the sky by the rising degree, the Kin ring by the birth seal. */
const skyAnchor = (atlas: PersonAtlas): number => -(atlas.sky.ascendant ?? 0)
const kinAnchor = (atlas: PersonAtlas): number => atlas.maya.seal.n * 18

/** The marks that answer: every mark, or only the layer the switch holds forward. */
const answering = (marks: readonly PlacedMark[], focus: AtlasLayerId | null): ReadonlyMap<string, PlacedMark> =>
  new Map(marks.filter((m) => focus === null || m.layer === focus).map((m) => [m.key, m]))

const find = (marks: ReadonlyMap<string, PlacedMark>, ref: AtlasMarkRef | null): PlacedMark | null => (ref ? (marks.get(markKey(ref)) ?? null) : null)


/**
 * Which mark's card is open, and the drawing's highlight for it
 * (BENTO_SITE.md, "Marks explain themselves"). A new atlas or a new layer
 * focus closes the card: the marks it described moved or stopped answering.
 */
function useMarkInspect(atlas: PersonAtlas, focus: AtlasLayerId | null, squareRef: RefObject<HTMLDivElement | null>) {
  const [state, dispatch] = useReducer(inspect, IDLE)
  const [seen, setSeen] = useState({ atlas, focus })
  if (seen.atlas !== atlas || seen.focus !== focus) {
    setSeen({ atlas, focus })
    dispatch({ type: 'reset' })
  }
  const marks = answering(placeMarks(atlas), focus)
  const active = find(marks, state.active)
  const highlight: MarkHighlight | null = active ? { active, related: new Set(relatedMarks(atlas, active.ref).map(markKey)) } : null
  const open = active !== null
  const kept = state.kept

  const { send, hold } = useGrace(dispatch)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      dispatch({ type: 'dismiss' })
    }
    const onDown = (e: PointerEvent) => {
      if (kept && !holds(squareRef.current, e.target)) dispatch({ type: 'dismiss' })
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, kept, squareRef])

  return { state, send, hold, marks: [...marks.values()], active, shown: find(marks, state.shown), highlight }
}

/**
 * One person's live atlas: layer switch and status on top, the drawing with
 * numbered pins, the number strip below. Shared by the home hero and the tools.
 * Every mark explains itself on hover, focus and tap.
 * `fit` sizes the drawing to the stage's height and leaves the values to a
 * digest beside it: pins carry only their numbers, and there is no strip.
 * A new date turns the rings to their new positions.
 */
export function AtlasStage({
  atlas,
  status,
  focus,
  onFocus,
  readoutId,
  background,
  className,
  style,
  fit = false,
}: {
  readonly atlas: PersonAtlas
  readonly status: StageStatus
  readonly focus: AtlasLayerId | null
  readonly onFocus: (next: AtlasLayerId | null) => void
  readonly readoutId?: string
  readonly background?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
  readonly fit?: boolean
}) {
  const drawingRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const cardId = useId()
  useTurn(drawingRef, 'g[data-layer="sky"]', skyAnchor(atlas))
  useTurn(drawingRef, 'g[data-layer="maya"]', kinAnchor(atlas))
  const { state, send, hold, marks, active, shown, highlight } = useMarkInspect(atlas, focus, drawingRef)
  const { explainer, prime } = useExplain()
  const reading = shown && explainer ? explainer.explain(atlas, shown.ref) : null
  return (
    <div
      className={[s.stage, fit && s.stageFit, className].filter(Boolean).join(' ')}
      aria-busy={status.status === 'loading'}
      style={style}
    >
      {background}
      <div className={s.stageTop}>
        <LayerSwitch value={focus} onChange={onFocus} />
        <StageBadge {...status} idle={atlas.sky.precision === 'exact' ? 'Exact sky' : 'Date only'} />
      </div>
      <div className={s.stageDrawing} data-busy={status.status === 'loading' ? '' : undefined}>
        <div ref={drawingRef} className={s.square} data-inspect={active ? '' : undefined}>
          <PersonAtlasDrawing atlas={atlas} focus={focus} highlight={highlight} describedBy={readoutId}>
            <MarkTargets
              marks={marks}
              titleOf={(ref) => markTitle(atlas, ref)}
              activeKey={active?.key ?? null}
              cardId={cardId}
              isInCard={(target) => holds(cardRef.current, target)}
              onEvent={send}
              onIntent={prime}
            />
          </PersonAtlasDrawing>
          <PinLayer pins={atlasPins(atlas)} cards={!fit} />
          <MarkCard
            id={cardId}
            cardRef={cardRef}
            mark={shown}
            title={shown ? markTitle(atlas, shown.ref) : null}
            reading={reading}
            open={active !== null}
            kept={state.kept && active !== null}
            onPointerEnter={hold}
            onPointerLeave={(e) => {
              if (!holds(drawingRef.current, e.relatedTarget)) send({ type: 'point', ref: null })
            }}
          />
        </div>
      </div>
      {!fit && (
        <div className={s.stageBottom}>
          <span className={kit.eyebrow}>
            <span className={s.stripBadge} aria-hidden>
              {LAYER_META.number.pin}
            </span>
            Numbers
          </span>
          <NumberStrip number={atlas.number} />
        </div>
      )}
    </div>
  )
}
