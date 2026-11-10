import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isTopic, LibraryArticle, LibraryIndex } from '@/components/bento-lab/systems/library-view'
import { ARTICLE_BY_SLUG } from '@/lib/library/articles'
import type { SiteTree } from '@/lib/site/routes'

export type SlugParams = Promise<{ readonly slug: string }>

/** The library index, filtered by `?topic=`. The same body in either tree. */
export async function LibraryPageBody({ tree, searchParams }: { readonly tree: SiteTree; readonly searchParams: Promise<{ readonly topic?: string | string[] }> }) {
  const { topic } = await searchParams
  const value = Array.isArray(topic) ? topic[0] : topic
  return <LibraryIndex tree={tree} topic={isTopic(value) ? value : null} />
}

/** An article's title, for its route's metadata. */
export async function libraryArticleMetadata(params: SlugParams): Promise<Metadata> {
  const article = ARTICLE_BY_SLUG[(await params).slug]
  return { title: article ? article.title : 'Library' }
}

/** One library article; an unknown slug is a 404. The same body in either tree. */
export async function LibraryArticleBody({ tree, params }: { readonly tree: SiteTree; readonly params: SlugParams }) {
  const article = ARTICLE_BY_SLUG[(await params).slug]
  if (!article) notFound()
  return <LibraryArticle tree={tree} article={article} />
}
