import type { ReactNode } from 'react'
import type { Appearance } from './appearance'
import s from './site.module.css'
import kit from '../kit.module.css'
import f from '@/components/bento-v2/frame/frame.module.css'

export interface PageHeadProps {
  readonly eyebrow?: ReactNode
  readonly title: ReactNode
  readonly lead?: ReactNode
  /** Actions, pickers or chips: centred under the lead, or, framed, in a row under it. */
  readonly children?: ReactNode
  readonly appearance?: Appearance
}

/**
 * A page's opening head at `h1`: the centred section head (BENTO_SITE.md
 * "Heads"), or, framed, v2's head panel (BENTO_V2.md "The app in v2"):
 * eyebrow, title and lead from the panel's start, the actions under them.
 */
export function PageHead({ eyebrow, title, lead, children, appearance = 'bento' }: PageHeadProps) {
  if (appearance === 'frame')
    return (
      <header className={`${f.panel} ${f.art} ${f.pad} ${s.frameHead}`}>
        {eyebrow && <p className={f.eyebrow}>{eyebrow}</p>}
        <h1 className={f.title}>{title}</h1>
        {lead && <p className={f.lead}>{lead}</p>}
        {children && <div className={s.frameActions}>{children}</div>}
      </header>
    )
  return (
    <header className={`${s.page} ${s.pageHead}`}>
      <div className={s.sectionHead}>
        <div className={s.sectionTitle}>
          {eyebrow && <span className={kit.eyebrow}>{eyebrow}</span>}
          <h1 className={s.display}>{title}</h1>
        </div>
        {lead && <p className={s.lead}>{lead}</p>}
        {children && <div className={s.pageHeadBelow}>{children}</div>}
      </div>
    </header>
  )
}

/** A page's parts in order: the bento site's sections follow each other down the page; framed, the panels stack a gap apart. */
export function PageStack({ appearance = 'bento', children }: { readonly appearance?: Appearance; readonly children: ReactNode }) {
  return appearance === 'frame' ? <div className={s.frameStack}>{children}</div> : <>{children}</>
}

/** A page's block of content under its head: on the page's measure, or, framed, on a panel. */
export function PageBlock({ appearance = 'bento', className, children }: { readonly appearance?: Appearance; readonly className?: string; readonly children: ReactNode }) {
  const own = appearance === 'frame' ? `${f.panel} ${f.pad}` : s.page
  return <div className={[own, className].filter(Boolean).join(' ')}>{children}</div>
}
