'use client'

import { useRef, type CSSProperties, type ReactNode } from 'react'
import s from './atlas.module.css'
import { LayerSwitch } from './layer-switch'
import { NumberStrip } from './number-strip'
import { PersonAtlasDrawing } from './person-atlas'
import { PinLayer } from './pin-layer'
import { atlasPins } from './pins'
import kit from '../kit.module.css'
import { useTurn } from '../motion/use-turn'
import { LAYER_META } from '@/lib/atlas/layers'
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

/**
 * One person's live atlas: layer switch and status on top, the drawing with
 * numbered pins, the number strip below. Shared by the home hero and the tools.
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
  useTurn(drawingRef, 'g[data-layer="sky"]', skyAnchor(atlas))
  useTurn(drawingRef, 'g[data-layer="maya"]', kinAnchor(atlas))
  return (
    <div
      className={[s.stage, fit && s.stageFit, className].filter(Boolean).join(' ')}
      aria-busy={status.status === 'loading'}
      style={style}
    >
      {background}
      <div className={s.stageTop}>
        <LayerSwitch value={focus} onChange={onFocus} />
        <StageBadge {...status} idle={`Kin ${atlas.maya.kin} · ${atlas.sky.precision === 'exact' ? 'exact sky' : 'date only'}`} />
      </div>
      <div className={s.stageDrawing} data-busy={status.status === 'loading' ? '' : undefined}>
        <div ref={drawingRef} className={s.square}>
          <PersonAtlasDrawing atlas={atlas} focus={focus} describedBy={readoutId} />
          <PinLayer pins={atlasPins(atlas)} cards={!fit} />
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
