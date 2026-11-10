/**
 * The Lantern tokens as a typed theme for React Native
 * (docs/redesign/MOBILE_V2_MATCH.md). The values are generated from the web's
 * palette in `bento-tokens.ts`; this is the accessor components read, the way
 * `useTheme()` serves the Material 3 theme today. Both resolve during the
 * migration — a screen moves onto `useLantern()` one at a time — until the M3
 * layer is retired.
 *
 * Depth here is the bento model (ground / surface / inverse), not M3's
 * tint-on-tint: a raised surface is `surface1`/`surface2`, and an inverse
 * section takes the opposite theme's whole palette rather than a mixed tint.
 */

import { useColorScheme } from 'react-native'
import { LANTERN, RADIUS, otherTheme, type LanternRole, type LanternTheme } from './bento-tokens'

export type { LanternRole, LanternTheme } from './bento-tokens'
export { LANTERN, RADIUS } from './bento-tokens'

export interface LanternTokens {
  /** The active theme: the system scheme, or its opposite inside an inverse section. */
  readonly theme: LanternTheme
  /** Every role's hex for the active theme. */
  readonly colors: Readonly<Record<LanternRole, string>>
  /** One role's hex. */
  readonly color: (role: LanternRole) => string
  readonly radius: typeof RADIUS
}

/**
 * The Lantern tokens for the current scheme. `inverse` flips to the opposite
 * theme for a section that sits inverted on the page (a plate on paper, paper
 * on a plate). Dark is the default where the device expresses no preference.
 */
export function useLantern(inverse = false): LanternTokens {
  const scheme = useColorScheme()
  const base: LanternTheme = scheme === 'light' ? 'light' : 'dark'
  const theme = inverse ? otherTheme(base) : base
  const colors = LANTERN[theme]
  return { theme, colors, color: (role) => colors[role], radius: RADIUS }
}
