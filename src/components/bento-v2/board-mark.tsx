import m from './board-mark.module.css'
import { GlyphMark } from '@/components/bento-lab/glyph-mark'
import { BarDot, MOON_R, moonPath } from '@/components/bento-lab/blocks/board-art'
import type { BoardMark } from '@/lib/boards/types'

/** The Moon's face at an elongation: the dark disc, the lit part, the limb. */
function MoonFace({ angle }: { readonly angle: number }) {
  return (
    <svg viewBox="-50 -50 100 100" className={m.moon}>
      <circle r={MOON_R} className={m.dark} />
      <path d={moonPath(angle)} className={m.lit} />
      <circle r={MOON_R} className={m.limb} />
    </svg>
  )
}

/** A hexagram's line: one bar where yang, two where yin. */
function Line({ yang }: { readonly yang: boolean }) {
  return (
    <span className={m.line} data-yang={yang ? '' : undefined}>
      <i />
      {!yang && <i />}
    </span>
  )
}

/** A hexagram: its six lines, top first. */
function Hexagram({ yang }: { readonly yang: readonly boolean[] }) {
  return (
    <span className={m.hexagram}>
      {[...yang].reverse().map((line, i) => (
        <Line key={i} yang={line} />
      ))}
    </span>
  )
}

/**
 * A symbol a board draws (BENTO_V2.md "Rows open their calendar's board"),
 * a line of its text tall and in its colour: the Moon's face, a glyph, a
 * bar-and-dot numeral, a hexagram or one of its lines, or a character. Decorative: the
 * words beside it say the same.
 */
export function BoardMarkView({ mark, className }: { readonly mark: BoardMark; readonly className?: string }) {
  const cls = [m.mark, className].filter(Boolean).join(' ')
  switch (mark.kind) {
    case 'moon':
      return (
        <span className={cls} data-mark="moon" aria-hidden>
          <MoonFace angle={mark.angle} />
        </span>
      )
    case 'glyph':
      return <GlyphMark src={mark.src} className={cls} />
    case 'bars':
      return (
        <span className={cls} data-mark="bars" aria-hidden>
          <BarDot n={mark.n} className={m.bars} />
        </span>
      )
    case 'line':
      return (
        <span className={cls} data-mark="line" aria-hidden>
          <Line yang={mark.yang} />
        </span>
      )
    case 'hexagram':
      return (
        <span className={cls} data-mark="hexagram" aria-hidden>
          <Hexagram yang={mark.yang} />
        </span>
      )
    case 'text':
      return (
        <span className={cls} data-mark="text" lang={mark.lang} aria-hidden>
          {mark.text}
        </span>
      )
  }
}
