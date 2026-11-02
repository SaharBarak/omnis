'use client'

import { useCallback, useRef } from 'react'
import { RENDERERS, type ArtName } from './art-renderers'
import { useCanvasLoop, type DrawFrame } from './use-canvas-loop'
import styles from './kit.module.css'

interface ArtCanvasProps {
  readonly art: ArtName
  readonly label: string
  readonly kin?: number
  readonly tone?: number
  readonly className?: string
}

export function ArtCanvas({ art, label, kin = 1, tone = 1, className }: ArtCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const draw = useCallback<DrawFrame>(
    (ctx, w, h, t, palette) => RENDERERS[art](ctx, w, h, t, palette, { kin, tone }),
    [art, kin, tone],
  )
  useCanvasLoop(ref, draw)

  return (
    <div className={[styles.art, className].filter(Boolean).join(' ')} role="img" aria-label={label}>
      <canvas ref={ref} className={styles.artCanvas} />
    </div>
  )
}
