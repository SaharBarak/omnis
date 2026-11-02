import type { ReactNode } from 'react'
import s from './site.module.css'
import kit from '../kit.module.css'

export interface SectionProps {
  readonly id?: string
  readonly eyebrow?: string
  readonly title: ReactNode
  readonly lead?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  /** Heading level for the title; sections under a page h1 use h2. */
  readonly as?: 'h1' | 'h2'
}

/** A page section: eyebrow, title and lead stacked on the centre line, content below (BENTO_SITE.md, centred sections). */
export function Section({ id, eyebrow, title, lead, children, className, as: Heading = 'h2' }: SectionProps) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section id={id} aria-labelledby={headingId} className={[s.page, s.section, className].filter(Boolean).join(' ')}>
      <header className={s.sectionHead}>
        <div className={s.sectionTitle}>
          {eyebrow && <span className={kit.eyebrow}>{eyebrow}</span>}
          <Heading id={headingId} className={Heading === 'h1' ? s.display : s.h2}>
            {title}
          </Heading>
        </div>
        {lead && <p className={s.lead}>{lead}</p>}
      </header>
      {children}
    </section>
  )
}
