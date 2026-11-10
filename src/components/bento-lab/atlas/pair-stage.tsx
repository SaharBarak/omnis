'use client'

import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from 'react'
import s from './atlas.module.css'
import { IDLE, type InspectEvent, type InspectState } from './inspect'
import { MarkCard } from './mark-card'
import type { PlacedMark } from './mark-geometry'
import { holds, MarkTargets } from './mark-targets'
import { pairEyebrow, pairLayer, pairReading, pairTargetTitle, pairTitle } from './pair-card'
import { PairCurrents, PairFrameArt, pairLabel } from './pair-drawing'
import { MarkHalo } from './person-atlas'
import { pairInspect, pairLighting, pairRefKey, tieEndKeys, type PairLighting } from './pair-inspect'
import { keySelector, ORIENTATIONS, PAIR_GAP, pairLayout, placePairMarks, tieKey, type PairLayout, type PairMarkRef } from './pair-layout'
import { useDismiss } from './use-dismiss'
import { useExplain } from './use-explain'
import { useGrace } from './use-grace'
import { loop } from '../motion/loops'
import type { MarkReading } from '@/lib/atlas/explain'
import type { PairAtlas } from '@/lib/atlas/types'

/**
 * Which mark or tie of a pair is being read, shared by the drawing and the
 * tie list beside it (docs/redesign/BENTO_SITE.md, "Ties explain
 * themselves"), so the two are one control: a press on either keeps the card.
 */
export interface PairControl {
  readonly pair: PairAtlas
  readonly state: InspectState<PairMarkRef>
  readonly send: (event: InspectEvent<PairMarkRef>) => void
  /** The pointer reached the card: a pending close is cancelled. */
  readonly hold: () => void
  readonly stageRef: RefObject<HTMLDivElement | null>
  /** The tie list: a press inside it does not close a kept card. */
  readonly listRef: RefObject<HTMLOListElement | null>
  /** The tie whose row the pointer rests on: lit on the drawing, with no card. */
  readonly preview: number | null
  /** The base of the cards' ids: each orientation's card is `${cardBase}-${orientation}`. */
  readonly cardBase: string
  /**
   * A row of the tie list: the pointer resting on it lights its tie on the
   * drawing, and opens no card away from the pointer. The row's button reads
   * the tie on focus, and a press, Enter or Space keeps its card, so every
   * listed tie, drawn or not, is reached from the keyboard.
   */
  readonly rowProps: (index: number) => TieRowProps
  readonly rowButtonProps: (index: number) => TieRowButtonProps
}

export interface TieRowProps {
  readonly 'data-tie-row': number
  readonly onPointerEnter: (e: PointerEvent) => void
  readonly onPointerLeave: () => void
}

export interface TieRowButtonProps {
  readonly type: 'button'
  /** The row of the tie being read. */
  readonly 'aria-current': 'true' | undefined
  readonly 'aria-describedby': string | undefined
  /** The row of the tie lit on the drawing, read or rested on. */
  readonly 'data-lit': '' | undefined
  readonly onFocus: () => void
  readonly onBlur: () => void
  readonly onClick: () => void
}

/** The orientation whose card a row describes: either holds the same words, so one is named. */
const DESCRIBED_ORIENTATION = ORIENTATIONS[0]

export function usePairControl(pair: PairAtlas): PairControl {
  const [state, dispatch] = useReducer(pairInspect, IDLE)
  const [preview, setPreview] = useState<number | null>(null)
  const [seen, setSeen] = useState(pair)
  if (seen !== pair) {
    setSeen(pair)
    setPreview(null)
    dispatch({ type: 'reset' })
  }
  const { send, hold } = useGrace(dispatch)
  const stageRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const cardBase = useId()
  useDismiss(state.active !== null, state.kept, dispatch, stageRef, listRef)
  const activeKey = state.active ? pairRefKey(state.active) : null
  const rowProps = (index: number): TieRowProps => ({
    'data-tie-row': index,
    onPointerEnter: (e) => {
      if (e.pointerType !== 'touch') setPreview(index)
    },
    onPointerLeave: () => setPreview(null),
  })
  const rowButtonProps = (index: number): TieRowButtonProps => {
    const ref: PairMarkRef = { kind: 'tie', index }
    const current = activeKey === tieKey(index)
    return {
      type: 'button',
      'aria-current': current ? 'true' : undefined,
      'aria-describedby': current ? `${cardBase}-${DESCRIBED_ORIENTATION}` : undefined,
      'data-lit': current || (activeKey === null && preview === index) ? '' : undefined,
      onFocus: () => send({ type: 'focus', ref }),
      onBlur: () => send({ type: 'blur' }),
      onClick: () => send({ type: 'keep', ref }),
    }
  }
  return { pair, state, send, hold, stageRef, listRef, preview, cardBase, rowProps, rowButtonProps }
}

/** Writes the lighting onto the drawing's own elements: the art never renders again, so the nodes the entrance animates stay the nodes on screen. */
function useLighting(root: RefObject<HTMLDivElement | null>, lighting: PairLighting): void {
  useLayoutEffect(() => {
    const stage = root.current
    if (!stage) return
    const lit = [...lighting.states].flatMap(([key, state]) => [...stage.querySelectorAll(keySelector(key))].map((el) => [el, state] as const))
    for (const [el, state] of lit) el.setAttribute('data-state', state)
    return () => {
      for (const [el] of lit) el.removeAttribute('data-state')
    }
  }, [root, lighting])
}

/** The halos of the lit marks, over the art in its own layer. */
function Halos({ layout, marks, lighting }: { layout: PairLayout; marks: readonly PlacedMark<PairMarkRef>[]; lighting: PairLighting }) {
  const haloed = marks.filter((m) => lighting.halos.has(m.key))
  return (
    <svg className={s.pairHalos} viewBox={`0 0 ${layout.view.width} ${layout.view.height}`} aria-hidden="true" focusable="false">
      {haloed.map((m) => (
        <MarkHalo key={m.key} mark={m} />
      ))}
    </svg>
  )
}

/**
 * Where an open card hangs: from the mark or the drawn tie it is about; a
 * tie too common to draw hangs from the first mark it ends on, or from the
 * drawing's centre when it names none.
 */
const cardMarkOf = (
  pair: PairAtlas,
  layout: PairLayout,
  marks: ReadonlyMap<string, PlacedMark<PairMarkRef>>,
  ref: PairMarkRef | null,
): PlacedMark<PairMarkRef> | null => {
  if (!ref) return null
  const key = pairRefKey(ref)
  const placed = marks.get(key)
  if (placed || ref.kind === 'mark') return placed ?? null
  const end = tieEndKeys(pair, ref.index)
    .map((k) => marks.get(k))
    .find(Boolean)
  const centre: PlacedMark<PairMarkRef> = {
    ref,
    key,
    layer: pairLayer(pair, ref),
    anchor: [layout.view.width / 2, layout.view.height / 2],
    r: 0,
  }
  return end ? { ...end, ref, key, layer: pairLayer(pair, ref) } : centre
}

interface ViewProps {
  readonly control: PairControl
  readonly layout: PairLayout
  readonly marks: readonly PlacedMark<PairMarkRef>[]
  readonly art: ReactNode
  readonly lighting: PairLighting
  readonly reading: MarkReading | null
  /** The pointer or focus arrived: start loading the meanings. */
  readonly prime: () => void
}

/** One orientation: its art, the halos over it, its targets and its card. */
function PairView({ control, layout, marks, art, lighting, reading, prime }: ViewProps) {
  const { pair, state, send, hold, stageRef, listRef, cardBase } = control
  const cardRef = useRef<HTMLDivElement>(null)
  const cardId = `${cardBase}-${layout.orientation}`
  const byKey = useMemo(() => new Map(marks.map((m) => [m.key, m])), [marks])
  const open = state.active !== null
  const shown = state.shown
  const cardMark = useMemo(() => cardMarkOf(pair, layout, byKey, shown), [pair, layout, byKey, shown])
  return (
    <div className={s[layout.orientation]} data-orient={layout.orientation}>
      <div
        className={`${s.square} ${s.pairView}`}
        data-pair-view=""
        style={
          {
            '--pair-w': layout.view.width,
            '--pair-h': layout.view.height,
          } as CSSProperties
        }
      >
        {art}
        <Halos layout={layout} marks={marks} lighting={lighting} />
        <MarkTargets
          marks={marks}
          titleOf={(ref) => pairTargetTitle(pair, ref)}
          activeKey={state.active ? pairRefKey(state.active) : null}
          cardId={cardId}
          isInCard={(target) => holds(cardRef.current, target)}
          onEvent={send}
          onIntent={prime}
          view={layout.view}
          turns={false}
          label={`${pair.people[0].name} and ${pair.people[1].name}: ties and marks`}
        />
        <MarkCard
          id={cardId}
          cardRef={cardRef}
          mark={cardMark}
          title={shown ? pairTitle(pair, shown) : null}
          eyebrow={shown ? pairEyebrow(pair, shown) : undefined}
          reading={reading}
          open={open}
          kept={state.kept && open}
          view={layout.view}
          onPointerEnter={hold}
          onPointerLeave={(e) => {
            if (!holds(stageRef.current, e.relatedTarget) && !holds(listRef.current, e.relatedTarget)) send({ type: 'point', ref: null })
          }}
        />
      </div>
    </div>
  )
}

export interface PairStageProps {
  readonly control: PairControl
  /** Whether the ties' currents may run: once the drawing's entrance has drawn its lines. */
  readonly currents?: boolean
  /** id of the tie list, the drawing's description. */
  readonly describedBy?: string
  readonly className?: string
  /** Space between the maps when they sit side by side, in drawing units. */
  readonly gap?: number
}

/**
 * Two people drawn together, read like one atlas (BENTO_SITE.md, "Ties
 * explain themselves"): every mark of both maps and every drawn tie answers
 * the pointer, a tap and the keyboard with a card. Each orientation holds
 * its own art, halos, targets and card; the one on screen answers. The art
 * renders once per pair: reading a mark only writes its lighting.
 */
export function PairStage({ control, currents = false, describedBy, className, gap = PAIR_GAP }: PairStageProps) {
  const { pair, state, stageRef } = control
  const layouts = useMemo(() => ORIENTATIONS.map((orientation) => pairLayout(pair, orientation, gap)), [pair, gap])
  const marks = useMemo(() => layouts.map((layout) => placePairMarks(pair, layout)), [pair, layouts])
  const art = useMemo(() => {
    const label = pairLabel(pair, layouts[0])
    return layouts.map((layout) => (
      <Fragment key={layout.orientation}>
        <PairFrameArt pair={pair} layout={layout} label={label} describedBy={describedBy} />
        <PairCurrents layout={layout} />
      </Fragment>
    ))
  }, [pair, layouts, describedBy])
  const { preview } = control
  const read = useMemo<PairMarkRef | null>(() => state.active ?? (preview === null ? null : { kind: 'tie', index: preview }), [state.active, preview])
  const lighting = useMemo(() => pairLighting(pair, read), [pair, read])
  useLighting(stageRef, lighting)
  const { explainer, prime } = useExplain()
  const reading = state.shown ? pairReading(pair, state.shown, explainer?.explain ?? null) : null

  return (
    <div ref={stageRef} className={[s.relation, s.tokens, className].filter(Boolean).join(' ')} data-pair-stage="" {...loop} data-inspect={read ? '' : undefined} data-currents={currents ? '' : undefined}>
      {layouts.map((layout, i) => (
        <PairView
          key={layout.orientation}
          control={control}
          layout={layout}
          marks={marks[i]}
          art={art[i]}
          lighting={lighting}
          reading={reading}
          prime={prime}
        />
      ))}
    </div>
  )
}
