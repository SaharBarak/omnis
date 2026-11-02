'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import styles from './kit.module.css'
import { DEFAULT_THEME, labRoot, readPaletteChoice, readTheme, subscribePaletteChoice, subscribeTheme, writePaletteChoice } from './lab-state'
import { DEFAULT_PALETTE, PALETTE_IDS, PALETTE_LABELS } from '@/lib/design/palette-ids'

/** Cycles the lab's palettes (BENTO_MOTION.md "Palette"); the swatch shows the current one's layers around its accent. */
export function PaletteSwitch({ className }: { readonly className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const palette = useSyncExternalStore(subscribePaletteChoice, readPaletteChoice, () => DEFAULT_PALETTE)
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME)
  const next = PALETTE_IDS[(PALETTE_IDS.indexOf(palette) + 1) % PALETTE_IDS.length]

  useEffect(() => {
    labRoot(buttonRef.current).setAttribute('data-palette', palette)
  }, [palette])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      aria-label={`Palette: ${PALETTE_LABELS[palette]}. Switch to ${PALETTE_LABELS[next]}`}
      title={`Palette: ${PALETTE_LABELS[palette]}`}
      onClick={() => writePaletteChoice(next)}
    >
      <span data-swatch="" data-palette={palette} data-theme={theme} className={styles.swatch} aria-hidden />
    </button>
  )
}
