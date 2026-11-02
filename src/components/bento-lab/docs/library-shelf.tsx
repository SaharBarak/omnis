import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import d from './docs.module.css'
import type { Article } from './library'
import type { DocSectionId } from '@/lib/design/system-flavors'
import { siteHref } from '@/lib/site/routes'

/** The article that reads every system together leads the shelf. */
const FEATURE: DocSectionId = 'integration'

function Tile({ article, className, feature }: { readonly article: Article; readonly className?: string; readonly feature?: boolean }) {
  return (
    <Link
      href={siteHref(`/learn/${article.slug}`)}
      className={[d.tile, className].filter(Boolean).join(' ')}
      style={{ '--accent': article.flavor.accentSoft } as CSSProperties}
    >
      <Image
        src={article.flavor.bannerSrc}
        alt=""
        fill
        priority={feature}
        sizes={feature ? '(max-width: 960px) 100vw, 640px' : '(max-width: 600px) 100vw, 320px'}
        className={d.tileArt}
      />
      <span className={d.tileMeta}>{`${article.sections.length} sections · ${article.minutes} min`}</span>
      <span className={d.tileName}>{article.title}</span>
      <span className={d.tileLine}>{feature ? article.flavor.lineage : article.description}</span>
    </Link>
  )
}

/** T5 system shelf: the feature article tall on the left, one tile per system beside it. */
export function LibraryShelf({ articles }: { readonly articles: readonly Article[] }) {
  const feature = articles.find((article) => article.slug === FEATURE)
  const systems = articles.filter((article) => article !== feature)
  const lastIsAlone = systems.length % 2 === 1
  return (
    <div className={d.shelf}>
      {feature && <Tile article={feature} className={d.feature} feature />}
      {systems.map((article, index) => (
        <Tile key={article.slug} article={article} className={lastIsAlone && index === systems.length - 1 ? d.wide : undefined} />
      ))}
    </div>
  )
}
