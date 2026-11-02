import type { ReactNode } from 'react'
import s from './site.module.css'
import kit from '../kit.module.css'

export interface PageHeadProps {
  readonly eyebrow?: ReactNode
  readonly title: ReactNode
  readonly lead?: ReactNode
  /** Actions, pickers or chips, centred under the lead. */
  readonly children?: ReactNode
}

/** A page's opening head: the centred section head at `h1` (BENTO_SITE.md "Heads"). */
export function PageHead({ eyebrow, title, lead, children }: PageHeadProps) {
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
