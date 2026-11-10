import type { ReactNode } from 'react'
import type { Appearance } from './appearance'
import s from './site.module.css'
import kit from '../kit.module.css'
import f from '@/components/bento-v2/frame/frame.module.css'

export interface SectionProps {
  readonly id?: string
  readonly eyebrow?: string
  readonly title: ReactNode
  readonly lead?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  /** Heading level for the title; sections under a page h1 use h2. */
  readonly as?: 'h1' | 'h2'
  readonly appearance?: Appearance
}

/**
 * A page section: eyebrow, title and lead stacked on the centre line,
 * content below (BENTO_SITE.md, centred sections); framed, a panel with its
 * head from the panel's start (BENTO_V2.md "The app in v2").
 */
export function Section({ id, eyebrow, title, lead, children, className, as: Heading = 'h2', appearance = 'bento' }: SectionProps) {
  const headingId = id ? `${id}-title` : undefined
  if (appearance === 'frame')
    return (
      <section id={id} aria-labelledby={headingId} className={[f.panel, f.pad, s.frameSection, className].filter(Boolean).join(' ')}>
        <header className={s.frameSectionHead}>
          {eyebrow && <p className={f.eyebrow}>{eyebrow}</p>}
          <Heading id={headingId} className={Heading === 'h1' ? f.title : f.figure}>
            {title}
          </Heading>
          {lead && <p className={f.lead}>{lead}</p>}
        </header>
        {children}
      </section>
    )
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
