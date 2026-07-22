/**
 * Seal styling helpers local to the predictions surface.
 *
 * Works around two app-kit gaps (report upstream):
 * - `SEAL_COLORS` has no "on-color" foreground token, so full-strength
 *   seal tiles need a readable text class per seal.
 * - `SEAL_COLORS.css` values are `hsl()` strings and the kit `Pill`
 *   assumes hex accents (`${accent}55`), so alpha variants need a local
 *   hsl→hsla conversion.
 */

import {
  SEAL_COLORS,
  toSealColor,
  type SealColor,
} from '@/components/app-kit/seal-colors'

/** Foreground class readable on a full-strength seal tile. */
const SEAL_TILE_TEXT: Readonly<Record<SealColor, string>> = Object.freeze({
  red: 'text-white',
  white: 'text-ground',
  blue: 'text-white',
  yellow: 'text-ground',
})

/**
 * Tailwind classes for a kin tile: seal token background + readable
 * foreground. Unknown colors fall back to quiet chrome — never a
 * fabricated seal.
 */
export function sealTileClasses(raw: string | null | undefined): string {
  const seal = toSealColor(raw)
  if (!seal) return 'bg-surface-2 text-white/70'
  return `${SEAL_COLORS[seal].bg} ${SEAL_TILE_TEXT[seal]}`
}

/** Alpha variant of a seal token color for inline borders/fills. */
export function sealAlpha(seal: SealColor, alpha: number): string {
  return SEAL_COLORS[seal].css
    .replace('hsl(', 'hsla(')
    .replace(')', `, ${alpha})`)
}
