import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Notch } from '../notch'
import { site } from '../site'
import kit from '../kit.module.css'
import { ArticleBlockView } from './article-blocks'
import { ContentsRail } from './contents-rail'
import d from './docs.module.css'
import { neighboursOf, type Article } from './library'
import { TryDateCard } from './try-date-card'
import { PAGE, pageContentMax } from '@/lib/design/layout-tokens'
import { siteHref } from '@/lib/site/routes'

const articleHref = (article: Article): string => siteHref(`/learn/${article.slug}`)

function Neighbour({ article, rel }: { readonly article: Article | null; readonly rel: 'prev' | 'next' }) {
  if (!article) return null
  return (
    <Link
      href={articleHref(article)}
      rel={rel}
      className={[site.card, site.cardTight, d.neighbour, rel === 'next' ? d.neighbourNext : ''].join(' ')}
      style={{ '--accent': article.flavor.accentSoft } as CSSProperties}
    >
      <span className={kit.eyebrow}>{rel === 'prev' ? 'Previous' : 'Next'}</span>
      <span className={d.neighbourTitle}>{article.title}</span>
    </Link>
  )
}

/** T6: banner with the title in a notch, contents rail, body at 65ch, the map card beside it. */
export function ArticleView({ article }: { readonly article: Article }) {
  const { prev, next } = neighboursOf(article.slug)
  return (
    <div className={site.page} style={{ '--accent': article.flavor.accentSoft } as CSSProperties}>
      <header>
        <div className={d.banner}>
          <Image src={article.flavor.bannerSrc} alt="" fill priority sizes={`(max-width: ${PAGE.max}px) 100vw, ${pageContentMax()}px`} className={d.bannerArt} />
          <Notch corner="bl" className={d.bannerNotch}>
            <span className={kit.eyebrow}>Library</span>
            <h1 className={d.bannerTitle}>{article.title}</h1>
            <div className={d.bannerMeta}>
              <span className={site.chip}>{`${article.sections.length} sections`}</span>
              <span className={site.chip}>{`${article.minutes} min read`}</span>
            </div>
          </Notch>
        </div>
        <p className={d.dek}>{article.description}</p>
      </header>

      <div className={d.article}>
        <ContentsRail className={d.articleRail} items={article.sections.map(({ id, title }) => ({ id, label: title }))} />
        <div className={d.articleBody}>
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className={d.docSection}>
              <h2 id={`${section.id}-title`} className={d.sectionTitle}>
                {section.title}
              </h2>
              {section.subtitle && <p className={d.sectionSub}>{section.subtitle}</p>}
              {section.blocks.map((block, index) => (
                <ArticleBlockView key={index} block={block} />
              ))}
            </section>
          ))}
          <nav aria-label="More articles" className={d.neighbours}>
            <Neighbour article={prev} rel="prev" />
            <Neighbour article={next} rel="next" />
          </nav>
        </div>
        <aside className={d.aside} aria-label="Try it">
          <TryDateCard />
          <Link href={siteHref('/learn')} className={site.textLink}>
            Back to the library
          </Link>
        </aside>
      </div>
    </div>
  )
}
