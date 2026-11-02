import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import s from './systems.module.css'
import { undashProse } from './model'
import kit from '../kit.module.css'
import site from '../site/site.module.css'
import { PageHead } from '../site/page-head'
import { routeTitle, siteHref, sitePageForLive, type PatternValues } from '@/lib/site/routes'
import { docStructure } from '@/lib/docs/content'
import { ARTICLES, TOPIC_LABELS, type Article } from '@/lib/library/articles'

type Topic = Article['topic']

const LIBRARY = '/app/library'

/** Slugs each dynamic route can resolve, so related links never point at a missing page. */
const LINKABLE: PatternValues = {
  '/learn/[slug]': docStructure.sections.map((section) => section.id),
  '/app/library/[slug]': ARTICLES.map((a) => a.slug),
}

const TOPICS: readonly Topic[] = (Object.keys(TOPIC_LABELS) as Topic[]).filter((t) => ARTICLES.some((a) => a.topic === t))

export const isTopic = (value: string | null | undefined): value is Topic => TOPICS.some((t) => t === value)

const topicHref = (topic: Topic | null): string => (topic ? `${siteHref(LIBRARY)}?topic=${topic}` : siteHref(LIBRARY))

/** Template T5 inside the app: every library article, filtered by topic through the URL. */
export function LibraryIndex({ topic }: { readonly topic: Topic | null }) {
  const shown = topic ? ARTICLES.filter((a) => a.topic === topic) : ARTICLES
  return (
    <>
      <PageHead eyebrow="Library" title={routeTitle(LIBRARY)} lead={`${ARTICLES.length} short answers to the questions people ask about the systems, each a few minutes long.`}>
        <nav aria-label="Topics" className={site.chipRow}>
          <Link href={topicHref(null)} className={`${kit.pill} ${s.chipLink}`} aria-current={topic === null ? 'page' : undefined}>
            All
          </Link>
          {TOPICS.map((t) => (
            <Link key={t} href={topicHref(t)} className={`${kit.pill} ${s.chipLink}`} aria-current={topic === t ? 'page' : undefined}>
              {TOPIC_LABELS[t]}
            </Link>
          ))}
        </nav>
      </PageHead>
      <div className={`${site.page} ${s.page}`}>
      <ul className={s.articles} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {shown.map((a) => (
          <li key={a.slug} style={{ display: 'grid' }}>
            <Link href={siteHref(`${LIBRARY}/${a.slug}`)} className={`${site.card} ${s.articleCard}`}>
              <span className={kit.eyebrow}>
                {TOPIC_LABELS[a.topic]}, {a.minutes} min
              </span>
              <h2 className={site.h3}>{undashProse(a.question)}</h2>
              <span className={s.tileText}>{undashProse(a.title)}</span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </>
  )
}

/** Template T6 inside the app: one article, its sections, then related reading that exists in this site. */
export function LibraryArticle({ article }: { readonly article: Article }) {
  const related = article.related.flatMap((r) => {
    const href = sitePageForLive(r.href, LINKABLE)
    return href ? [{ href, label: r.label }] : []
  })
  return (
    <article>
      <PageHead eyebrow={`${TOPIC_LABELS[article.topic]}, ${article.minutes} min`} title={undashProse(article.question)} lead={undashProse(article.title)}>
        <Link href={siteHref(LIBRARY)} className={kit.pill}>
          <ArrowLeft size={14} aria-hidden />
          Library
        </Link>
      </PageHead>
      <div className={`${site.page} ${s.page}`}>
      <div className={s.prose}>
        {article.sections.map((section, i) => (
          <section key={section.heading ?? i} style={{ display: 'grid', gap: 12 }}>
            {section.heading && <h2 className={site.h3}>{undashProse(section.heading)}</h2>}
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{undashProse(p)}</p>
            ))}
          </section>
        ))}
      </div>
      {related.length > 0 && (
        <nav aria-label="Keep reading" className={s.section}>
          <span className={kit.eyebrow}>Keep reading</span>
          <div className={s.chips}>
            {related.map((r) => (
              <Link key={r.href} href={r.href} className={kit.pill}>
                {r.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
      </div>
    </article>
  )
}
