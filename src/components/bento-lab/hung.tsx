import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import h from './hung.module.css'
import { hangOf, MEDIAN_BEARING, type Figures } from '@/lib/design/face-bearings'

interface HungBase extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The element it renders as. */
  readonly as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'
  /** Set this as the element's CSS sets its figures. */
  readonly figures?: Figures
}

/** Text alone, whose first glyph sets the hang; or anything, with the text it starts with as `lead`. */
export type HungProps = HungBase & ({ readonly children: string | number; readonly lead?: never } | { readonly children: ReactNode; readonly lead: string })

/**
 * Display text that starts on an edge (BENTO_TYPE.md, "Hung bearings"): its
 * first line hangs its first glyph's bearing outside the edge and any line
 * the browser wraps hangs the face's median, so its ink, not its box, meets
 * the edge. `data-hang` names it to the e2e check that measures it.
 */
export function Hung({ as: Tag = 'span', children, lead, figures = 'proportional', className, style, ...rest }: HungProps) {
  return (
    <Tag
      {...rest}
      className={[h.hung, className].filter(Boolean).join(' ')}
      style={{ ...style, '--hang': hangOf(lead ?? String(children), figures), '--hang-median': MEDIAN_BEARING } as CSSProperties}
      data-hang=""
    >
      {children}
    </Tag>
  )
}
