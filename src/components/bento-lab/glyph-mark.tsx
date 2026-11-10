import type { CSSProperties } from 'react'
import styles from './kit.module.css'

/**
 * A glyph drawn in the current colour: its SVG masks `currentColor`, so it
 * reads on any ground and takes its tint from its parent. The caller's class
 * sizes it. Decorative: the name is in the text beside it.
 */
export function GlyphMark({ src, className }: { readonly src: string; readonly className?: string }) {
  return <span className={[styles.glyphMark, className].filter(Boolean).join(' ')} style={{ '--src': `url("${src}")` } as CSSProperties} aria-hidden />
}

/** A glyph centred in a ring; the caller's class sets `--disc` (size) and `--disc-ring` (the ring's colour). */
export function GlyphDisc({ src, className }: { readonly src: string; readonly className?: string }) {
  return (
    <span className={[styles.glyphDisc, className].filter(Boolean).join(' ')} aria-hidden>
      <GlyphMark src={src} />
    </span>
  )
}
