import { MARK_TONES } from '@/lib/brand/mark-tones.gen'
import { MARK_PARTS, MARK_VARS, lanternShape, optical, type MarkTheme } from '@/lib/brand/mark'

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
export function BrandMark({
  size = 28,
  className,
  mono = false,
  tone = 'dark',
}: {
  size?: number
  className?: string
  mono?: boolean
  tone?: MarkTheme
}) {
  const { paths, box } = lanternShape(optical(size))
  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      width={(size * box.width) / box.height}
      height={size}
      className={className}
      aria-hidden
    >
      {MARK_PARTS.map((part) => (
        <path key={part} d={paths[part]} fill={mono ? 'currentColor' : `var(${MARK_VARS[part]}, ${MARK_TONES[tone][part]})`} />
      ))}
    </svg>
  )
}
