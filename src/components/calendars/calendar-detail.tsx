'use client'

import type { ReactNode } from 'react'
import { DataRow, PageSection, Pill } from '@/components/app-kit'
import { PageHeader } from '@/components/dashboard'

/**
 * Calendar detail template (#70) — the one educational scaffold every
 * calendar page instantiates (PRD "Calendar Detail Pages"): overview,
 * history, how it works, how dates are calculated, concepts, modern usage,
 * related systems, plus two live slots — `hero` (today in this calendar)
 * and `explorer` (the interactive converter). Content is data; layout,
 * order, and grammar live here so #71's pages inherit them for free.
 */

export interface CalendarConcept {
  readonly term: string
  readonly meaning: string
}

export interface RelatedSystem {
  readonly name: string
  /** In-app link when the target page exists; plain chip otherwise. */
  readonly href?: string
  readonly relation: string
}

export interface CalendarSpec {
  readonly title: string
  readonly subtitle: string
  /** Flavor accent hex for every section hairline. */
  readonly accent: string
  readonly overview: readonly string[]
  readonly history: readonly string[]
  readonly howItWorks: readonly string[]
  readonly calculation: readonly string[]
  readonly concepts: readonly CalendarConcept[]
  readonly modernUsage: readonly string[]
  readonly related: readonly RelatedSystem[]
}

function Prose({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="max-w-[65ch] space-y-3">
      {paragraphs.map((p) => (
        <p key={p.slice(0, 32)} className="text-sm leading-relaxed text-white/70">
          {p}
        </p>
      ))}
    </div>
  )
}

export function CalendarDetail({
  spec,
  hero,
  explorer,
  holidays,
}: {
  spec: CalendarSpec
  /** "Today in this calendar" set piece. */
  hero?: ReactNode
  /** Interactive converter / browser. */
  explorer?: ReactNode
  /** Holidays / observances block (calendar-specific shape). */
  holidays?: ReactNode
}) {
  let index = 0
  return (
    <div className="space-y-6">
      <PageHeader title={spec.title} subtitle={spec.subtitle} />

      {hero && (
        <PageSection index={index++} accent={spec.accent} eyebrow="Today">
          {hero}
        </PageSection>
      )}

      <PageSection index={index++} accent={spec.accent} eyebrow="Overview">
        <Prose paragraphs={spec.overview} />
      </PageSection>

      <PageSection index={index++} accent={spec.accent} eyebrow="History">
        <Prose paragraphs={spec.history} />
      </PageSection>

      <PageSection index={index++} accent={spec.accent} eyebrow="How it works">
        <Prose paragraphs={spec.howItWorks} />
      </PageSection>

      <PageSection index={index++} accent={spec.accent} eyebrow="How dates are calculated">
        <Prose paragraphs={spec.calculation} />
      </PageSection>

      {explorer && (
        <PageSection index={index++} accent={spec.accent} eyebrow="Explore">
          {explorer}
        </PageSection>
      )}

      {holidays && (
        <PageSection index={index++} accent={spec.accent} eyebrow="Holidays">
          {holidays}
        </PageSection>
      )}

      <PageSection index={index++} accent={spec.accent} eyebrow="Key concepts">
        <div className="surface-card p-5">
          {spec.concepts.map((c, i) => (
            <DataRow
              key={c.term}
              label={c.term}
              value={c.meaning}
              last={i === spec.concepts.length - 1}
            />
          ))}
        </div>
      </PageSection>

      <PageSection index={index++} accent={spec.accent} eyebrow="Modern usage">
        <Prose paragraphs={spec.modernUsage} />
      </PageSection>

      <PageSection index={index++} accent={spec.accent} eyebrow="Related systems">
        <div className="flex flex-wrap gap-3">
          {spec.related.map((r) =>
            r.href ? (
              <a key={r.name} href={r.href} title={r.relation}>
                <Pill accent={spec.accent}>{r.name}</Pill>
              </a>
            ) : (
              <span key={r.name} title={r.relation}>
                <Pill>{r.name}</Pill>
              </span>
            )
          )}
        </div>
        <div className="mt-3 max-w-[65ch] space-y-1">
          {spec.related.map((r) => (
            <p key={r.name} className="text-xs text-white/50">
              <span className="text-white/70">{r.name}</span> — {r.relation}
            </p>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
