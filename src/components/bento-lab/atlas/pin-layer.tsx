'use client'

import { useRef, type CSSProperties } from 'react'
import s from './atlas.module.css'
import { C, SIZE, percent } from './geometry'
import kit from '../kit.module.css'
import { useGlide } from '../motion/use-glide'
import type { AtlasPin } from './pins'

/**
 * Numbered pins laid over the drawing. Decorative duplicates of the readout,
 * hidden from assistive tech. Without cards, the pins only number the layers
 * and a digest beside the drawing carries the values.
 */
export function PinLayer({ pins, cards = true }: { readonly pins: readonly AtlasPin[]; readonly cards?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useGlide(
    ref,
    pins.map((pin) => ({ id: String(pin.n), x: pin.point[0] / SIZE, y: pin.point[1] / SIZE })),
  )
  return (
    <div ref={ref} className={`${s.pins} ${s.tokens}`} aria-hidden>
      {pins.map((pin) => (
        <div key={pin.n} className={s.pin} style={percent(pin.point)} data-side={pin.point[0] < C ? 'left' : 'right'} data-glide={pin.n}>
          <span className={s.pinDot} data-layer={pin.layer} style={{ '--i': pin.n } as CSSProperties}>
            {pin.n}
          </span>
          {cards && (
            <span className={`${s.pinCard} ${kit.glass}`}>
              <strong>{pin.title}</strong>
              <span>{pin.value}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
