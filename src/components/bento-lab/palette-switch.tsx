'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import styles from './kit.module.css'
import { DEFAULT_THEME, labRoot, readPaletteChoice, readTheme, subscribePaletteChoice, subscribeTheme, writePaletteChoice } from './lab-state'
import { DEFAULT_PALETTE, PALETTE_IDS, PALETTE_LABELS } from '@/lib/design/palette-ids'

interface SwitchProps {
  readonly className?: string
}

/** Cycles the lab's palettes (BENTO_COLOR.md "One palette"); shown only when there is more than one. */
export function PaletteSwitch(props: SwitchProps) {
  return PALETTE_IDS.length > 1 ? <PaletteCycle {...props} /> : null
}

/** The switch itself; the swatch shows the current palette's layers around its accent. */
function PaletteCycle({ className }: SwitchProps) {
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
