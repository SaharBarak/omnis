'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ARTICLES, TOPIC_LABELS, type Article } from '@/lib/library/articles'
import { PageHeader } from '@/components/dashboard'
import { PageSection, Pill, getFlavor } from '@/components/app-kit'
import { cn } from '@/lib/utils'

/**
 * Learning Library (#79) — the Q&A shelf. Every card is a question; the
 * article answers it. Topics filter, ⌘K searches the same corpus.
 */

const FLAVOR = getFlavor('integration')

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/app/library/${article.slug}`}
      className="surface-card block p-5 transition-colors hover:border-white/[0.16]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          {TOPIC_LABELS[article.topic]}
        </span>
        <span className="text-[11px] text-white/30">{article.minutes} min</span>
      </div>
      <h3 className="mt-2 font-display text-lg tracking-tight text-white/90">
        {article.question}
      </h3>
      <p className="mt-1 text-sm text-white/50">{article.title}</p>
    </Link>
  )
}

export default function LibraryPage() {
  const [topic, setTopic] = useState<Article['topic'] | 'all'>('all')

  const topics = useMemo(() => {
    const present = [...new Set(ARTICLES.map((a) => a.topic))]
    return present.sort((a, b) => TOPIC_LABELS[a].localeCompare(TOPIC_LABELS[b]))
  }, [])

  const visible = useMemo(
    () => (topic === 'all' ? ARTICLES : ARTICLES.filter((a) => a.topic === topic)),
    [topic]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Library"
        subtitle="Every article answers one question — history, mathematics, and honest caveats included"
      />

      <PageSection index={0} accent={FLAVOR.accent} eyebrow="Topics">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTopic('all')}
            aria-pressed={topic === 'all'}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition-colors active:scale-[0.98]',
              topic === 'all'
                ? 'border-brand/60 bg-brand/15 text-white/90'
                : 'border-white/[0.12] text-white/60 hover:border-white/[0.25]'
            )}
          >
            All ({ARTICLES.length})
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              aria-pressed={topic === t}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors active:scale-[0.98]',
                topic === t
                  ? 'border-brand/60 bg-brand/15 text-white/90'
                  : 'border-white/[0.12] text-white/60 hover:border-white/[0.25]'
              )}
            >
              {TOPIC_LABELS[t]}
            </button>
          ))}
        </div>
      </PageSection>

      <PageSection index={1} accent={FLAVOR.accent} eyebrow="Questions">
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <p className="mt-4 text-xs text-white/35">
          The six system codices live under{' '}
          <Link href="/learn" className="text-white/60 underline-offset-2 hover:underline">
            /learn
          </Link>
          {' '}— this shelf holds the questions between them.{' '}
          <Pill accent={FLAVOR.accent}>⌘K searches everything</Pill>
        </p>
      </PageSection>
    </div>
  )
}
