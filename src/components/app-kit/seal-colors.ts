/**
 * Dreamspell seal colors — the ONE source for seal color styling in the
 * authed app. Values resolve through the `--seal-*` tokens declared in
 * globals.css (and mirrored in tailwind.config.ts as `seal-red` etc.),
 * so raw palette classes (`bg-red-500`, `#EF4444`, …) are banned.
 *
 * `hex`-style literals are provided ONLY for canvas/SVG contexts that
 * cannot read CSS variables; they are the resolved values of the tokens.
 */

export type SealColor = 'red' | 'white' | 'blue' | 'yellow'

interface SealColorSpec {
  /** Tailwind text class. */
  readonly text: string
  /** Tailwind bg class (full strength — pair with /10 style opacity in situ). */
  readonly bg: string
  /** Tailwind border class. */
  readonly border: string
  /** CSS color string for canvas/inline-SVG (matches the token). */
  readonly css: string
  /** Softened CSS color for fills behind text. */
  readonly cssSoft: string
}

export const SEAL_COLORS: Readonly<Record<SealColor, SealColorSpec>> =
  Object.freeze({
    red: {
      text: 'text-seal-red',
      bg: 'bg-seal-red',
      border: 'border-seal-red',
      css: 'hsl(4, 72%, 48%)',
      cssSoft: 'hsla(4, 72%, 48%, 0.16)',
    },
    white: {
      text: 'text-seal-white',
      bg: 'bg-seal-white',
      border: 'border-seal-white',
      css: 'hsl(0, 0%, 96%)',
      cssSoft: 'hsla(0, 0%, 96%, 0.14)',
    },
    blue: {
      text: 'text-seal-blue',
      bg: 'bg-seal-blue',
      border: 'border-seal-blue',
      css: 'hsl(215, 65%, 45%)',
      cssSoft: 'hsla(215, 65%, 45%, 0.16)',
    },
    yellow: {
      text: 'text-seal-yellow',
      bg: 'bg-seal-yellow',
      border: 'border-seal-yellow',
      css: 'hsl(45, 90%, 48%)',
      cssSoft: 'hsla(45, 90%, 48%, 0.16)',
    },
  })

/** Normalize an engine color string ("Red", "RED", "red") to a SealColor. */
export function toSealColor(raw: string | null | undefined): SealColor | null {
  const key = raw?.toLowerCase()
  return key === 'red' || key === 'white' || key === 'blue' || key === 'yellow'
    ? key
    : null
}
