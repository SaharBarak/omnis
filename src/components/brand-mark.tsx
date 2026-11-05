import type { CSSProperties } from 'react'
import s from './brand-lockup.module.css'
import { BRAND } from '@/lib/brand/identity'
import { LANTERN, MARK_PARTS, MARK_VARS, lanternShape, lockup, optical, type Lantern, type MarkTheme } from '@/lib/brand/mark'
import { MARK_TONES } from '@/lib/brand/mark-tones.gen'
import { DISPLAY_FACE, TYPE_STEPS, smallestPx, stepSize } from '@/lib/design/type-scale'

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
 * The mark's height, before fitting, in a lockup set at the lead role's
 * smallest size in the display face. The fitted mark draws a little taller,
 * so fitted here, no part falls under a pixel at any width.
 */
const LEAD_LOCKUP_PX = DISPLAY_FACE.capHeight * smallestPx(stepSize(TYPE_STEPS.lead)) * lockup(LANTERN).height

/**
 * The mark set beside the name (BRAND_MARK.md "Lockup"). It sizes itself
 * from the word: the mark is measured in the font's cap height and centred
 * on the word's capitals, so the lockup follows whatever size and face the
 * surrounding text sets, and its box is the mark's ink. `fit` is
 * the mark's smallest expected height in pixels, used only to fit its thin
 * parts; it defaults to a lockup set in the lead role.
 */
export function BrandLockup({ fit = LEAD_LOCKUP_PX, className, ...look }: MarkLook & { fit?: number }) {
  const table = optical(fit)
  const { height, gap } = lockup(table)
  const style = { '--lockup-height': height, '--lockup-gap': gap, '--lockup-cap': DISPLAY_FACE.capHeight } as CSSProperties
  return (
    <span className={className ? `${s.lockup} ${className}` : s.lockup} style={style} data-brand-lockup>
      <MarkSvg table={table} {...look} />
      <span className={s.word}>{BRAND.name}</span>
    </span>
  )
}
