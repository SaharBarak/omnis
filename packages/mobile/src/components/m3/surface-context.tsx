import { createContext, useContext, type PropsWithChildren } from 'react'

import { useTheme } from '@/theme/m3'

/**
 * The colour of whatever surface a component is currently sitting on.
 *
 * Exists for one reason: the outlined text field's floating label has to *notch
 * through* its own outline, and the way that is drawn is by painting a small
 * chip of the surrounding surface's colour over the border. That only looks
 * right if the chip is the same colour as what's actually behind the field —
 * and a field inside a bottom sheet is sitting on `surfaceAt(1)`, not on
 * `background`.
 *
 * Without this, every form in the app renders its label notch as a visibly
 * darker rectangle cut into the sheet. Containers publish what they're painted
 * with; the field reads it. No call site has to pass a colour it shouldn't have
 * had to know.
 */
const SurfaceColorContext = createContext<string | null>(null)

export function SurfaceColorProvider({
  color,
  children,
}: PropsWithChildren<{ color: string }>) {
  return (
    <SurfaceColorContext.Provider value={color}>{children}</SurfaceColorContext.Provider>
  )
}

/** The surface behind the caller. Falls back to the screen's own background. */
export function useSurfaceColor(): string {
  const theme = useTheme()
  return useContext(SurfaceColorContext) ?? theme.colors.background
}
