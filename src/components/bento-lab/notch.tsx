import type { ReactNode } from 'react'
import styles from './kit.module.css'

export type NotchCorner = 'tl' | 'tr' | 'bl' | 'br'

const CORNER_CLASS: Readonly<Record<NotchCorner, string | undefined>> = {
  tl: styles.notchTl,
  tr: styles.notchTr,
  bl: styles.notchBl,
  br: styles.notchBr,
}

interface NotchProps {
  readonly corner: NotchCorner
  readonly children: ReactNode
  readonly className?: string
}

/**
 * A page-coloured cut-out in a card's corner. The block itself rounds the
 * inner corner; two inverse-radius squares round the card edges it meets, so
 * the card reads as one shape that wraps the notch.
 */
export function Notch({ corner, children, className }: NotchProps) {
  return <div className={[styles.notch, CORNER_CLASS[corner], className].filter(Boolean).join(' ')}>{children}</div>
}
