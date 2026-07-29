'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ARTICLE_BY_SLUG, TOPIC_LABELS } from '@/lib/library/articles'
import { PageHeader, EmptyState } from '@/components/dashboard'
import { PageSection, Pill, getFlavor } from '@/components/app-kit'

/** One library article (#79) — the question, the answer, the trailheads. */

const FLAVOR = getFlavor('integration')

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const article = ARTICLE_BY_SLUG[slug]

  if (!article) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon="general"
          title="This page of the library is blank"
          description="The article you followed doesn't exist here."
          action={{ label: 'Back to the library', href: '/app/library' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/app/library"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
      >
        <ArrowLeft className="size-4" />
        Library
      </Link>

      <PageHeader
        title={article.question}
        subtitle={article.title}
        meta={`${TOPIC_LABELS[article.topic]} · ${article.minutes} min`}
      />

      {article.sections.map((section, i) => (
        <PageSection
          key={section.heading ?? i}
          index={i}
          accent={FLAVOR.accent}
          eyebrow={section.heading ?? (i === 0 ? 'The answer' : 'Continued')}
        >
          <div className="max-w-[65ch] space-y-3">
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="text-sm leading-relaxed text-white/70">
                {p}
              </p>
            ))}
          </div>
        </PageSection>
      ))}

      {article.related.length > 0 && (
        <PageSection
          index={article.sections.length}
          accent={FLAVOR.accent}
          eyebrow="Keep going"
        >
          <div className="flex flex-wrap gap-3">
            {article.related.map((r) => (
              <Link key={r.href} href={r.href}>
                <Pill accent={FLAVOR.accent}>{r.label}</Pill>
              </Link>
            ))}
          </div>
        </PageSection>
      )}
    </div>
  )
}
