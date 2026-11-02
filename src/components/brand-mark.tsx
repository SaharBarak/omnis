import type { CSSProperties } from 'react'
import s from './brand-lockup.module.css'
import { BRAND } from '@/lib/brand/identity'
import { MARK_PARTS, MARK_VARS, lanternShape, lockup, optical, type Lantern, type MarkTheme } from '@/lib/brand/mark'
import { MARK_TONES } from '@/lib/brand/mark-tones.gen'

interface MarkLook {
  className?: string
  mono?: boolean
  tone?: MarkTheme
}

function MarkSvg({ table, width, height, className, mono = false, tone = 'dark' }: MarkLook & { table: Lantern; width?: number; height?: number }) {
  const { paths, box } = lanternShape(table)
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} width={width} height={height} className={className} aria-hidden>
      {MARK_PARTS.map((part) => (
        <path key={part} d={paths[part]} fill={mono ? 'currentColor' : `var(${MARK_VARS[part]}, ${MARK_TONES[tone][part]})`} />
      ))}
    </svg>
  )
}

/**
 * The brand mark: the Lantern (docs/redesign/BRAND_MARK.md). Single source
 * for every inline rendering of the logo (nav, login, footer, onboarding,
 * sidebar); the favicon and app icons are drawn from the same module by
 * `npm run brand:icons`. `size` is the mark's height; its width is its own
 * aspect. Parts read `--mark-*`, which the lab root sets per theme, and fall
 * back to `tone`'s colours: dark unless the mark sits on a light surface.
 * `mono` paints every part `currentColor`; the cuts are holes, so the lit
 * window still reads in one colour.
 */
export function BrandMark({ size = 28, ...look }: MarkLook & { size?: number }) {
  const table = optical(size)
  const { box } = lanternShape(table)
  return <MarkSvg table={table} width={(size * box.width) / box.height} height={size} {...look} />
}

/**
 * The mark set beside the name (BRAND_MARK.md "Lockup"). It sizes itself
 * from the word: the mark is measured in the font's cap height, so the
 * lockup follows whatever size and face the surrounding text sets. `fit` is
 * the mark's expected height in pixels, used only to fit its thin parts.
 */
export function BrandLockup({ fit = 24, className, ...look }: MarkLook & { fit?: number }) {
  const table = optical(fit)
  const { height, drop, gap } = lockup(table)
  const style = { '--lockup-height': height, '--lockup-drop': drop, '--lockup-gap': gap } as CSSProperties
  return (
    <span className={className ? `${s.lockup} ${className}` : s.lockup} style={style}>
      <MarkSvg table={table} {...look} />
      {BRAND.name}
    </span>
  )
}
