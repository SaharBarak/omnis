import type { ReactNode } from 'react'
import { site } from '../site'
import kit from '../kit.module.css'
import { ContentsRail } from './contents-rail'
import d from './docs.module.css'

export interface DocumentSection {
  readonly id: string
  readonly title: string
  readonly children: ReactNode
}

export interface DocumentPageProps {
  readonly eyebrow: string
  readonly title: string
  /** Formatted date of the last change, when the page carries one. */
  readonly updated?: string
  readonly lead?: ReactNode
  readonly sections: readonly DocumentSection[]
}

/** T7: title and last-updated line, a section rail, prose at 65ch. */
export function DocumentPage({ eyebrow, title, updated, lead, sections }: DocumentPageProps) {
  return (
    <div className={`${site.page} ${d.doc}`}>
      <ContentsRail items={sections.map(({ id, title: label }) => ({ id, label }))} />
      <article>
        <header className={d.docHead}>
          <span className={kit.eyebrow}>{eyebrow}</span>
          <h1 className={site.display}>{title}</h1>
          {updated && <p className={d.updated}>{`Last updated: ${updated}`}</p>}
          {lead && <p className={site.lead}>{lead}</p>}
        </header>
        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className={d.docSection}>
            <h2 id={`${section.id}-title`} className={d.sectionTitle}>
              {section.title}
            </h2>
            <div className={d.prose}>{section.children}</div>
          </section>
        ))}
      </article>
    </div>
  )
}
