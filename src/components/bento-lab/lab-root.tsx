import type { CSSProperties, ReactNode } from 'react'
import { DEFAULT_THEME, THEME_BOOT_SCRIPT } from './lab-state'
import styles from './kit.module.css'
import { MotionRoot } from './motion/motion-root'
import { BAZI_ELEMENT_COLORS } from '@/lib/design/bazi-elements'
import { markCss } from '@/lib/brand/mark'
import { MARK_TONES } from '@/lib/brand/mark-tones.gen'
import { DEFAULT_PALETTE, paletteCss } from '@/lib/design/bento-palette'
import { motionCssVars } from '@/lib/design/motion-tokens'
import { layoutCssVars } from '@/lib/design/layout-tokens'
import { typeCssVars } from '@/lib/design/type-scale'

/** BaZi element colours, motion, type and layout tokens; none varies by palette. */
const ROOT_TOKENS = {
  ...Object.fromEntries(Object.entries(BAZI_ELEMENT_COLORS).map(([element, color]) => [`--el-${element.toLowerCase()}`, color])),
  ...motionCssVars(),
  ...typeCssVars(),
  ...layoutCssVars(),
} as CSSProperties

/** Every palette and theme, for the lab root and for palette swatches; their attributes pick one. The mark follows the theme only. */
const PALETTE_CSS = paletteCss(['[data-lab]', '[data-swatch]']) + markCss(['[data-lab]'], MARK_TONES)

/**
 * Theme root for the lab: the palette stylesheet from bento-palette.ts, dark
 * and Groundwater by default. The inline boot script applies a remembered
 * theme and palette before first paint; the attributes it sets are expected
 * to differ from the server render.
 */
export function LabRoot({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div
      data-lab=""
      data-theme={DEFAULT_THEME}
      data-palette={DEFAULT_PALETTE}
      data-motion="running"
      data-entrance=""
      className={[styles.lab, className].filter(Boolean).join(' ')}
      style={ROOT_TOKENS}
      suppressHydrationWarning
    >
      <style dangerouslySetInnerHTML={{ __html: PALETTE_CSS }} />
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      <MotionRoot>{children}</MotionRoot>
    </div>
  )
}
