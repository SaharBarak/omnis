'use client'

import { useId, useState, type ReactNode } from 'react'
import w from './map-window.module.css'
import f from './frame/frame.module.css'
import { MotionToggle, kit } from '@/components/bento-lab'
import { AtlasReadout, AtlasStage, type StageStatus } from '@/components/bento-lab/atlas'
import { AtlasDigest } from '@/components/bento-lab/atlas/digest'
import type { AtlasLayerId, PersonAtlas } from '@/lib/atlas/types'

const READY: StageStatus = { status: 'ready', error: null }

interface MapWindowProps {
  readonly atlas: PersonAtlas
  readonly title: string
  readonly meta?: string
  /** The pill at the bar's end. */
  readonly badge?: ReactNode
  /** Anything under the map inside the window: a pair's ties, an action row. */
  readonly children?: ReactNode
  /** Anything between the bar and the map: the fields a map is drawn from. */
  readonly head?: ReactNode
  /** A cover over the map alone (never the bar or the head), with the one control that lifts it; the map under it is inert. */
  readonly veil?: ReactNode
  /** The map shown is not the current input's (the input is incomplete): it stays readable, dimmed. */
  readonly stale?: boolean
  /** Where the map's drawing is: a map computed in the browser is loading or failed before it is ready. */
  readonly status?: StageStatus
  readonly className?: string
  /** Whether the map's defined channels carry their currents: once the window's entrance has landed (BENTO_SITE.md "The Atlas", Currents). */
  readonly currents?: boolean
}

/**
 * One person's map as an app window (BENTO_V2.md "Home" 2 and "Dashboard"):
 * window chrome over the bento site's atlas stage and digest, which keep
 * their own pins, cards and switch, and the full readout for assistive tech.
 * The bar carries the lab's pause, so the map's currents stop within reach
 * (BENTO_MOTION.md "Loops", WCAG 2.2.2).
 */
export function MapWindow({ atlas, title, meta, badge, children, head, veil, stale = false, status = READY, className, currents = false }: MapWindowProps) {
  const [focus, setFocus] = useState<AtlasLayerId | null>(null)
  const readoutId = useId()
  return (
    <div className={[f.panel, w.window, className].filter(Boolean).join(' ')}>
      <div className={f.windowBar}>
        <span className={f.windowDots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <p className={f.windowTitle}>
          {title} {meta ? <span className={f.caption}>· {meta}</span> : null}
        </p>
        {badge}
        <MotionToggle className={`${f.pill} ${f.pillIcon}`} />
      </div>
      {head}
      <div className={w.body} data-stale={stale ? '' : undefined}>
        <div className={w.covered} inert={veil ? true : undefined}>
          <AtlasStage atlas={atlas} status={status} focus={focus} onFocus={setFocus} readoutId={readoutId} className={w.stage} fit currents={currents} />
          <div className={w.digestBox} data-lenis-prevent>
            <AtlasDigest atlas={atlas} focus={focus} onFocus={setFocus} className={w.digest} />
          </div>
          <AtlasReadout atlas={atlas} id={readoutId} focus={focus} className={kit.srOnly} />
        </div>
        {veil ? <div className={w.veil}>{veil}</div> : null}
      </div>
      {children}
    </div>
  )
}
